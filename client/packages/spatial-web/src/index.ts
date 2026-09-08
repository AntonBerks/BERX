/**
 * @berx/spatial-web — the DOM adapter for the BERX 5D runtime.
 *
 * It renders nothing itself. It takes a resolved scene from
 * @berx/spatial and drives a real DOM subtree with it: custom
 * properties per depth layer, a perspective camera on the scene root,
 * parallax and tilt bound to real input, and a frame sampler that can
 * downgrade the scene's tier while it is running.
 *
 * The same resolver that decides how a scene looks on React Native
 * decides it here, so "one BERX scene" is a fact about the code
 * rather than a claim about the design.
 *
 * Everything it touches is compositor-friendly: transform and opacity
 * only, written inside a single rAF, with no layout reads in the
 * scroll or pointer path. That is the performance contract's
 * "avoidContinuousLayoutReads" implemented rather than asserted.
 */
import {
	BERX_DEPTH_KEYS,
	BERX_MAX_TILT_DEG,
	berxAtmosphereForFamily,
	berxAtmospherePoolBudget,
	berxIlluminationAt,
	berxRoomColorAt,
	flatten,
	planSharedElementFlip,
	parallaxOffset,
	perspectiveScale,
	resolveAtmosphere,
	resolveFocus,
	resolveScene,
	tiltFromPointer,
	type BerxAtmosphere,
	type BerxAtmosphereKind,
	type BerxColorWorldName,
	type BerxDepthKey,
	type BerxDeviceSignals,
	type BerxFocusField,
	type BerxPlatform,
	type BerxSceneContract,
	type BerxSceneRuntime,
} from '@berx/spatial';

export interface BerxWebSceneOptions {
	colorWorld?: BerxColorWorldName;
	highContrast?: boolean;
	/** Overrides for tests; real signals are read from the browser otherwise. */
	device?: Partial<BerxDeviceSignals>;
	/** Element that scrolls. Defaults to the window. */
	scrollTarget?: HTMLElement | Window;
	/**
	 * Overrides the family's atmosphere when a page's content is more
	 * specific than its family — a trip inside PLACES, the wallet
	 * inside PROFILE. Omit and the family decides.
	 */
	atmosphereKind?: BerxAtmosphereKind;
	/** Real domain media for D1. Omitted when the page has none. */
	atmosphereMediaUrl?: string;
	/**
	 * Binds parallax and tilt to real input. On by default.
	 *
	 * A page can hold several scenes at once — the site's sections are
	 * one per family — and every one of them binding scroll and
	 * pointer listeners is cost for movement the viewer will not
	 * notice on a card. Passing false resolves and paints the scene,
	 * including its environment, and leaves the input alone.
	 */
	interactive?: boolean;
	/**
	 * Live frame sampling. On by default: the scene measures the
	 * frames it actually produces while the user is scrolling and
	 * lowers its own tier if it cannot hold the budget. Pass false
	 * only to measure the unadapted scene (the probe does this to
	 * attribute cost).
	 */
	sampleFrames?: boolean;
}

export interface BerxWebScene {
	scene: BerxSceneRuntime;
	/** The resolved environment, for tests and for the QA report. */
	atmosphere: BerxAtmosphere;
	/** Re-resolves against current conditions (resize, preference change, tier drop). */
	refresh: () => void;
	destroy: () => void;
	/** Frames per second from the last completed sample window, or null. */
	measuredFps: () => number | null;
	/** True once the runtime has lowered its own tier from a measurement. */
	adapted: () => boolean;
	/**
	 * Re-measures every surface against the room's light pools and
	 * writes each one's illumination. Called on mount and resize; call
	 * it again after the page adds or moves content.
	 */
	relight: () => void;
	/**
	 * Gives the scene's focus to an element, or releases it with null.
	 *
	 * The element is measured, not described: the clearing is centred
	 * and sized on the box the object actually occupies, so a wide
	 * hero and a small avatar get different fields from the same call.
	 * Returns the resolved field, or null when focus was released.
	 */
	setFocus: (target: HTMLElement | null, intensity?: number) => BerxFocusField | null;
	/** The field currently held, or null. */
	focusField: () => BerxFocusField | null;
}

/* ------------------------------------------------------------------ */
/* Real browser capability detection                                   */
/* ------------------------------------------------------------------ */

interface NavigatorWithHints extends Navigator {
	deviceMemory?: number;
	connection?: {saveData?: boolean};
}

export function detectPlatform(width: number): BerxPlatform {
	const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
	if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'tablet';
	if (/iPhone|iPod/i.test(ua)) return 'ios';
	if (/Android/i.test(ua)) return 'android';
	return width >= 1280 ? 'desktop' : 'web';
}

export function supportsBackdropBlur(): boolean {
	if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
	return CSS.supports('backdrop-filter', 'blur(4px)') || CSS.supports('-webkit-backdrop-filter', 'blur(4px)');
}

export function readDeviceSignals(overrides?: Partial<BerxDeviceSignals>): BerxDeviceSignals {
	const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
	const nav = typeof navigator === 'undefined' ? undefined : (navigator as NavigatorWithHints);
	const reduced =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	return {
		platform: detectPlatform(width),
		deviceMemoryGb: nav?.deviceMemory,
		logicalCores: nav?.hardwareConcurrency,
		pixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
		supportsBackdropBlur: supportsBackdropBlur(),
		prefersReducedMotion: reduced,
		saveData: nav?.connection?.saveData === true,
		...overrides,
	};
}

/* ------------------------------------------------------------------ */
/* Shared elements                                                     */
/* ------------------------------------------------------------------ */

/**
 * The archive's shared-element transition, actually running.
 *
 * v9 names seven things allowed to travel between scenes as one
 * continuous object — an avatar, hero media, a place pin, an event
 * poster, a message thread, a primary action, a profile header — and
 * the point of the list is that the object survives the navigation
 * rather than being redrawn on the other side. Until now BERX had the
 * tags on every card and the FLIP maths in the core, and nothing that
 * moved.
 *
 * This is the FLIP: the destination is placed where the source was and
 * released, so the browser animates one element from one scene's
 * geometry to the next. The plan comes from @berx/spatial, so the same
 * transition on React Native travels the same distance over the same
 * curve.
 *
 * Under reduced motion the planner returns an identity transform with
 * `travels: false` and this cross-fades instead — the element still
 * changes, it simply stops flying.
 */
export interface BerxSharedElementRun {
	/** Resolves when the element has arrived. */
	finished: Promise<void>;
	/** True when the element actually travelled rather than cross-fading. */
	travelled: boolean;
}

export function runBerxSharedElement(
	from: Element,
	to: HTMLElement,
	options: {reducedMotion?: boolean} = {},
): BerxSharedElementRun {
	const reducedMotion =
		options.reducedMotion ??
		(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

	const a = from.getBoundingClientRect();
	const b = to.getBoundingClientRect();
	const flip = planSharedElementFlip(
		{x: a.left, y: a.top, width: a.width, height: a.height},
		{x: b.left, y: b.top, width: b.width, height: b.height},
		reducedMotion,
	);

	/* No geometry to travel between — a destination that has not been
	   laid out yet would produce a transform from nowhere, so it
	   cross-fades rather than lying about where it came from. */
	const measurable = b.width > 0 && b.height > 0;
	const travels = flip.travels && measurable;

	const keyframes: Keyframe[] = travels
		? [
				{
					transform: `translate(${flip.translateX}px, ${flip.translateY}px) scale(${flip.scaleX}, ${flip.scaleY})`,
					opacity: 0.72,
				},
				{transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1},
		  ]
		: [{opacity: 0}, {opacity: 1}];

	const animation = to.animate(keyframes, {
		duration: flip.durationMs,
		easing: flip.easing,
		fill: 'both',
	});

	/* the element is one object mid-flight, not two overlapping ones */
	to.dataset.berxSharedElement = travels ? 'travelling' : 'fading';
	const finished = animation.finished
		.then(() => undefined)
		.catch(() => undefined)
		.finally(() => {
			animation.cancel();
			delete to.dataset.berxSharedElement;
		});

	return {finished, travelled: travels};
}

/* ------------------------------------------------------------------ */
/* Atmosphere                                                          */
/* ------------------------------------------------------------------ */

/**
 * The resolved atmosphere as one CSS `background-image` value.
 *
 * Layer order in CSS is topmost-first, and it is the whole point: the
 * vignette and the pools of light fall in *front* of the media, the
 * ground and the sky sit behind it. A photograph painted last would
 * be a flat rectangle covering the room instead of an object inside
 * it.
 *
 * Every layer here is a real gradient with continuous falloff, which
 * is what carries the depth when the blur budget takes the glass
 * away. Removing `backdrop-filter` from this page changes how the
 * glass reads; it does not flatten the room.
 */
export function atmosphereBackground(
	atmosphere: BerxAtmosphere,
	viewportWidth: number,
	viewportHeight: number,
	mediaUrl?: string,
): string {
	const major = Math.max(viewportWidth, viewportHeight);
	const layers: string[] = [];

	if (atmosphere.vignette > 0) {
		layers.push(
			`radial-gradient(ellipse 150% 150% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${atmosphere.vignette}) 100%)`,
		);
	}

	for (const pool of atmosphere.pools) {
		const r = Math.round(pool.radius * major);
		layers.push(
			`radial-gradient(circle ${r}px at ${pool.x * 100}% ${pool.y * 100}%, ${pool.color} 0%, ${transparentize(pool.color, 0.45)} 45%, ${transparentize(pool.color, 0)} 100%)`,
		);
	}

	if (mediaUrl && atmosphere.mediaRole !== 'none') {
		/* the scrim rides with the media so the two can never separate */
		if (atmosphere.mediaScrim > 0) {
			layers.push(`linear-gradient(rgba(0,0,0,${atmosphere.mediaScrim}), rgba(0,0,0,${atmosphere.mediaScrim}))`);
		}
		layers.push(`image-set(url("${encodeURI(mediaUrl)}") 1x)`);
	}

	if (atmosphere.ground) {
		const h = atmosphere.ground.horizon * 100;
		layers.push(
			`linear-gradient(to bottom, rgba(0,0,0,0) ${h}%, ${transparentize(atmosphere.ground.color, 1 - atmosphere.ground.haze)} ${h}%, ${atmosphere.ground.color} 100%)`,
		);
		/* the horizon line itself — the strongest distance cue in the frame */
		layers.push(
			`linear-gradient(to bottom, rgba(0,0,0,0) calc(${h}% - 1px), rgba(255,255,255,${atmosphere.ground.edge}) calc(${h}% - 1px), rgba(255,255,255,${atmosphere.ground.edge}) ${h}%, rgba(0,0,0,0) ${h}%)`,
		);
	}

	const sky = atmosphere.sky.stops
		.map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`)
		.join(', ');
	layers.push(`linear-gradient(${atmosphere.sky.angleDeg}deg, ${sky})`);

	return layers.join(', ');
}

/** Rescales an rgba()'s alpha. Non-rgba colours pass through unchanged. */
function transparentize(color: string, factor: number): string {
	const m = /^rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)$/.exec(color.replace(/\s/g, ''));
	if (!m) return color;
	return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${(Number(m[4]) * factor).toFixed(4)})`;
}

/**
 * The atmosphere for a scene, as custom properties. `--berx-d1-*`
 * because it is D1 that paints it, and the stylesheet reads nothing
 * else.
 */
export function atmosphereCustomProperties(
	atmosphere: BerxAtmosphere,
	viewportWidth: number,
	viewportHeight: number,
	mediaUrl?: string,
): Record<string, string> {
	return {
		'--berx-d1-atmosphere': atmosphereBackground(atmosphere, viewportWidth, viewportHeight, mediaUrl),
		'--berx-d1-atmosphere-size': mediaUrl && atmosphere.mediaRole !== 'none' ? 'cover' : 'auto',
		'--berx-d1-media-opacity': String(atmosphere.mediaOpacity || 1),
		'--berx-d1-vignette': String(atmosphere.vignette),
	};
}

/* ------------------------------------------------------------------ */
/* D5 — focus                                                          */
/* ------------------------------------------------------------------ */

/**
 * The focus falloff as one CSS radial gradient.
 *
 * An ellipse rather than a circle, because the clearing is shaped by
 * the object that holds focus and objects on a phone are rarely
 * square; and `closest-side` sizing with explicit radii, so the field
 * is the one the resolver computed rather than one the browser picks
 * from the box.
 */
export function focusBackground(field: BerxFocusField): string {
	const stops = field.stops
		.map((stop) => `${rgbaOf(field.surroundColor, stop.alpha)} ${round2(stop.offset * 100)}%`)
		.join(', ');
	return `radial-gradient(ellipse ${round2(field.radiusX * 100)}% ${round2(field.radiusY * 100)}% at ${round2(field.centerX * 100)}% ${round2(field.centerY * 100)}%, ${stops})`;
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

/** The substrate colour at a given alpha, whatever notation it arrived in. */
function rgbaOf(color: string, alpha: number): string {
	const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
	if (hex) {
		const n = parseInt(hex[1], 16);
		return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
	}
	const rgb = /^rgba?\(([^,]+),([^,]+),([^,)]+)(?:,([^)]+))?\)$/.exec(color.replace(/\s/g, ''));
	if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
	/* an unparseable colour is reported, not silently replaced with a
	   black that would turn the room into a hole */
	throw new Error(`BERX: focus surround colour "${color}" is not a colour this runtime can fade.`);
}

/**
 * The focus field as custom properties. Null clears them, so a scene
 * that has released focus carries no stale clearing.
 */
export function focusCustomProperties(field: BerxFocusField | null): Record<string, string> {
	if (!field) {
		return {
			'--berx-focus-field': 'none',
			'--berx-focus-emission': '1',
			'--berx-focus-alpha': '0',
		};
	}
	return {
		'--berx-focus-field': focusBackground(field),
		'--berx-focus-emission': String(field.emissionGain),
		'--berx-focus-alpha': String(field.surroundAlpha),
	};
}

/* ------------------------------------------------------------------ */
/* Custom properties                                                   */
/* ------------------------------------------------------------------ */

/**
 * The scene's numbers as CSS custom properties. styles/berx-5d.css
 * consumes these and nothing else — so the stylesheet never hardcodes
 * a depth, a blur radius or a duration that the runtime might have
 * decided differently.
 */
export function sceneCustomProperties(scene: BerxSceneRuntime): Record<string, string> {
	/**
	 * Minimum touch target in layout px, so the *painted* control is
	 * never under the 44 CSS px the accessibility contract requires.
	 *
	 * A control on the control plane is projected by the scene camera,
	 * and an element off the perspective origin foreshortens further
	 * the further it sits from it. The browser probe measured that
	 * off-axis loss at up to 6% down the length of a scrolling scene,
	 * so the layout minimum is the target divided by both the plane's
	 * projection and that measured worst case — not 44 with the
	 * projection ignored, which is how a 38px button reached the page.
	 */
	const controlScale = perspectiveScale(scene.layers.D4.translateZ, scene.camera.perspectivePx);
	const OFF_AXIS_WORST_CASE = 0.94;
	const touchMin = Math.ceil(44 / (controlScale * OFF_AXIS_WORST_CASE));

	const props: Record<string, string> = {
		'--berx-touch-min': `${touchMin}px`,
		'--berx-bg': scene.background,
		'--berx-accent': scene.accent,
		'--berx-perspective': `${scene.camera.perspectivePx}px`,
		'--berx-perspective-origin': `${scene.camera.originX}px ${scene.camera.originY}px`,
		'--berx-tilt-max': `${scene.camera.maxTiltDeg}deg`,
		'--berx-enter-ms': `${scene.motion.enter.durationMs}ms`,
		'--berx-enter-ease': scene.motion.enter.easing,
		'--berx-exit-ms': `${scene.motion.exit.durationMs}ms`,
		'--berx-focus-ms': `${scene.motion.focus.durationMs}ms`,
		'--berx-focus-ease': scene.motion.focus.easing,
		'--berx-focus-scale': String(scene.motion.focus.to?.scale ?? 1),
		'--berx-ambient-ms': `${scene.motion.ambient.durationMs}ms`,
	};

	/**
	 * D2 — the room between the atmosphere and the content.
	 *
	 * Not a box: a bordered container drawn around the content is the
	 * generic dashboard the archive rejects, and it would fight the
	 * cards for the same edge. A room is legible from the light coming
	 * in at the top, along the axis every BERX surface is lit from, and
	 * from a floor the content stands on. Both from the structure
	 * plane's own resolved material, so the room changes with the
	 * colour world rather than being a fixed wash — and from the two
	 * walls it is between, which is what gives the scene a width to be
	 * inside of rather than a flat plane with a lit top and bottom.
	 * The walls are asymmetric on purpose: the one the key light falls
	 * on is lighter than the one opposite, because that is what a lit
	 * room does, and two identical walls read as a vignette rather
	 * than as architecture.
	 */
	const d2 = scene.layers.D2;
	/**
	 * The falloff an object made of its own media darkens into.
	 *
	 * Emitted as real rgba stops rather than left to the stylesheet's
	 * color-mix: rendered against a bright photograph, the mixed
	 * version resolved far weaker than its percentages implied and the
	 * title sat on a lit image at a contrast that would not pass —
	 * found by putting a bright picture in a card and looking at it.
	 * The substrate colour is known here, so the ramp is stated here.
	 */
	props['--berx-card-fall'] = [
		'to bottom',
		`${rgbaOf(scene.background, 0)} 0%`,
		`${rgbaOf(scene.background, 0.18)} 38%`,
		`${rgbaOf(scene.background, 0.72)} 62%`,
		`${rgbaOf(scene.background, 0.94)} 82%`,
		`${rgbaOf(scene.background, 0.99)} 100%`,
	].join(', ');

	props['--berx-room'] = [
		`linear-gradient(160deg, ${d2.lighting.key.stops[0].color} 0%, ${d2.lighting.key.stops[1].color} 34%, transparent 100%)`,
		`linear-gradient(to right, ${transparentize(d2.surface.edgeHighlightColor, 0.5)} 0%, transparent 14%)`,
		`linear-gradient(to left, ${transparentize(d2.surface.backgroundColor, 0.9)} 0%, transparent 14%)`,
		`linear-gradient(to bottom, transparent 68%, ${d2.surface.backgroundColor} 100%)`,
	].join(', ');

	for (const depth of BERX_DEPTH_KEYS) {
		const layer = scene.layers[depth];
		const k = depth.toLowerCase();
		props[`--berx-${k}-z`] = String(layer.zIndex);
		props[`--berx-${k}-translate-z`] = `${layer.translateZ}px`;
		props[`--berx-${k}-bg`] = layer.surface.backgroundColor;
		/**
		 * A full backdrop-filter value, not a radius. `blur(0px)` is
		 * not the same as `none`: it still promotes the element to a
		 * backdrop root and still asks the compositor to sample what is
		 * behind it, which is exactly the cost the blur budget exists to
		 * avoid — and it makes an opaque high-contrast surface still
		 * report a filter. When a layer has no blur budget it gets
		 * `none` and the compositor skips it entirely.
		 */
		props[`--berx-${k}-blur`] = layer.blurred && layer.surface.blurPx > 0 ? `blur(${layer.surface.blurPx}px)` : 'none';
		props[`--berx-${k}-border`] = layer.surface.borderColor;
		props[`--berx-${k}-edge`] = layer.surface.edgeHighlightColor;
		props[`--berx-${k}-rim`] = layer.surface.rimColor;
		props[`--berx-${k}-rim-width`] = `${layer.surface.rimWidth}px`;
		props[`--berx-${k}-glow`] = layer.surface.glowColor;
		props[`--berx-${k}-glow-radius`] = `${layer.surface.glowRadius}px`;
		props[`--berx-${k}-shadow`] = `0 ${layer.lighting.shadow.offsetY}px ${layer.lighting.shadow.radius}px ${layer.lighting.shadow.color}`;
		props[`--berx-${k}-key-0`] = layer.lighting.key.stops[0].color;
		props[`--berx-${k}-key-1`] = layer.lighting.key.stops[1].color;
		props[`--berx-${k}-key-angle`] = `${layer.lighting.key.angleDeg}deg`;
		props[`--berx-${k}-ambient`] = layer.lighting.ambientColor;
		props[`--berx-${k}-light-rim`] = layer.lighting.rimColor;
		props[`--berx-${k}-opacity`] = String(layer.contentOpacity);
	}
	return props;
}

function applyProps(el: HTMLElement, props: Record<string, string>) {
	for (const [name, value] of Object.entries(props)) el.style.setProperty(name, value);
}

/* ------------------------------------------------------------------ */
/* Mount                                                               */
/* ------------------------------------------------------------------ */

/**
 * Frames sampled before the runtime is willing to act. Small enough
 * to react within about half a second of scrolling, large enough that
 * one slow frame cannot trigger a downgrade.
 */
const SAMPLE_FRAMES = 24;

/**
 * A frame slower than this missed vsync at 60Hz. The contract's
 * interactive budget is 16.7ms; 20ms allows for timer noise without
 * excusing a genuinely late frame.
 */
const SLOW_FRAME_MS = 20;

/**
 * How many of the sampled frames may miss vsync before the scene is
 * judged not to be holding 60fps.
 *
 * The median alone is not enough, and the browser probe is why: with
 * three blurred layers the median frame during a real scroll was
 * exactly 16.7ms — a perfect 60fps by that measure — while nearly a
 * quarter of the frames were arriving two or three vsyncs late. A
 * user feels those, so the runtime has to see them.
 */
const MAX_DROPPED_RATIO = 0.15;

export function mountBerxScene(
	root: HTMLElement,
	contract: BerxSceneContract,
	options: BerxWebSceneOptions = {},
): BerxWebScene {
	let fps: number | null = null;
	let tierOverride: number | undefined;
	let blurDisabled = false;
	let scene: BerxSceneRuntime;
	let atmosphere: BerxAtmosphere;
	let frame = 0;
	let focusTarget: HTMLElement | null = null;
	let focusIntensity: number | undefined;
	let focusField: BerxFocusField | null = null;
	let clearingEl: HTMLElement | null = null;

	const scrollTarget = options.scrollTarget ?? window;

	const build = () => {
		const device = readDeviceSignals({
			...options.device,
			measuredFps: tierOverride,
			...(blurDisabled ? {supportsBackdropBlur: false} : null),
		});
		scene = resolveScene(contract, {
			device,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			colorWorld: options.colorWorld,
			highContrast: options.highContrast,
		});
		applyProps(root, sceneCustomProperties(scene));
		/**
		 * The environment, resolved from the same source the React
		 * Native adapter uses. D1 is not "a background": a PLACES page
		 * gets a ground plane and a horizon, a MESSAGES page gets a lit
		 * corridor, and neither is the other's wash tinted differently.
		 */
		atmosphere = resolveAtmosphere({
			kind: options.atmosphereKind ?? berxAtmosphereForFamily(scene.family),
			/* a room inside a card has no horizon to show */
			bounded: root.getBoundingClientRect().height > 0 && root.getBoundingClientRect().height < window.innerHeight * 0.85,
			accent: scene.accent,
			background: scene.background,
			hasMedia: options.atmosphereMediaUrl !== undefined,
			intensity: scene.layers.D1.contentOpacity,
			reducedMotion: scene.reducedMotion,
			allowParallax: scene.budget.allowParallax,
			blurred: scene.layers.D1.blurred,
			maxPools: berxAtmospherePoolBudget(scene.budget.tier),
			/* the room may not out-shine the objects standing in it */
			contentColor: scene.layers.D3.surface.effectiveColor,
		});
		/**
		 * The room is sized to the scene, not to the window.
		 *
		 * A pool of light with a radius set from the viewport, painted
		 * into a 360px card, covers the whole card at one flat
		 * intensity — the falloff that makes it read as a light source
		 * happens outside the element. Six section cards on the site
		 * looked identical for exactly this reason.
		 *
		 * A scene that fills the page keeps the viewport-anchored
		 * behaviour with its overscan; a bounded one is its own box.
		 */
		const box = root.getBoundingClientRect();
		const bounded = box.height > 0 && box.height < window.innerHeight * 0.85;
		/**
		 * Sized to the box the environment plane actually occupies, not
		 * to the root. A page-level scene's D1 layer is one viewport
		 * tall however long the document is, so sizing its light to a
		 * 2400px root put the falloff below the fold; a bounded scene's
		 * layer is its own element.
		 */
		const envWidth = Math.max(1, Math.round(bounded ? box.width : window.innerWidth));
		const envHeight = Math.max(1, Math.round(bounded ? box.height : window.innerHeight));
		applyProps(root, atmosphereCustomProperties(atmosphere, envWidth, envHeight, options.atmosphereMediaUrl));
		root.dataset.berxBounded = String(bounded);
		root.dataset.berxAtmosphere = atmosphere.kind;
		root.dataset.berxAtmosphereDepth = String(
			atmosphere.sky.stops.length + atmosphere.pools.length + (atmosphere.ground ? 2 : 0),
		);
		root.dataset.berxScene = scene.screenId;
		root.dataset.berxFamily = scene.family;
		root.dataset.berxTier = scene.budget.tier;
		root.dataset.berxReducedMotion = String(scene.reducedMotion);
		root.dataset.berxParallax = String(scene.budget.allowParallax);
		root.dataset.berxBlurLayers = String(
			BERX_DEPTH_KEYS.filter((d) => scene.layers[d].blurred).length,
		);
		root.dataset.berx3d = String(scene.camera.perspectiveEnabled);
		root.dataset.berxAdaptation = blurDisabled ? (tierOverride === undefined ? 'blur-dropped' : 'tier-dropped') : 'none';
		/* the focus field is resolved against the scene that just
		   changed, never against the one it replaced */
		if (focusTarget) applyFocus();
	};

	/**
	 * D5 — the focus field.
	 *
	 * Two things happen and neither is "make the object brighter":
	 * the planes behind the focus step back by the amount focus.ts
	 * resolved for each of them, and one radial falloff is painted
	 * between the content and the controls so the surround falls away
	 * around the object rather than a sheet being laid over the room.
	 *
	 * It is rebuilt whenever the scene is, because a resize, a tier
	 * drop or a colour-world change all move the box the clearing is
	 * centred on.
	 */
	const applyFocus = () => {
		focusField = null;
		if (focusTarget && root.contains(focusTarget)) {
			const target = focusTarget.getBoundingClientRect();
			const box = root.getBoundingClientRect();
			/* the plane the target is standing on: recession is measured
			   from the focus, so the layer holding it must not dim out
			   from under it */
			const holder = focusTarget.closest<HTMLElement>('[data-berx-depth]');
			const holderDepth = holder?.dataset.berxDepth as BerxDepthKey | undefined;
			focusField = resolveFocus({
				/* the object's box in the scene's own coordinates */
				rect: {
					x: target.left - box.left,
					y: target.top - box.top,
					width: target.width,
					height: target.height,
				},
				viewportWidth: Math.max(1, box.width),
				viewportHeight: Math.max(1, box.height),
				background: scene.background,
				intensity: focusIntensity,
				plane: holderDepth && holderDepth in scene.layers ? holderDepth : undefined,
				tier: scene.budget.tier,
				blurred: scene.layers.D5.blurred,
			});
		}

		applyProps(root, focusCustomProperties(focusField));
		root.dataset.berxFocused = String(focusField !== null);

		for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-berx-depth]'))) {
			const depth = el.dataset.berxDepth as BerxDepthKey | undefined;
			if (!depth || !(depth in scene.layers)) continue;
			el.style.setProperty('--berx-focus-recession', String(focusField ? focusField.recession[depth] : 1));
		}

		if (!focusField) {
			clearingEl?.remove();
			clearingEl = null;
			return;
		}
		if (!clearingEl) {
			clearingEl = document.createElement('div');
			clearingEl.className = 'berx-focus-clearing';
			clearingEl.setAttribute('aria-hidden', 'true');
			root.appendChild(clearingEl);
		}
		/* last child, so it cannot be reordered under content added
		   after focus was taken */
		if (clearingEl.parentElement !== root || root.lastElementChild !== clearingEl) {
			root.appendChild(clearingEl);
		}
	};

	/**
	 * The room lights the objects standing in it.
	 *
	 * A BERX scene has light sources at real positions, and until this
	 * every surface in it carried the identical highlight wherever it
	 * sat — which is precisely what makes a column of cards read as a
	 * column of rectangles. Each surface is measured against the room
	 * it is in and told how much of the light reaches its own corner;
	 * the stylesheet scales that surface's key light and lit edge by
	 * it, and nothing else. A card in the corner is still the same
	 * material — it is just not in the light.
	 *
	 * Measured on layout, resize and tier change, never per frame: the
	 * performance contract forbids reading layout inside an animation
	 * frame, and where an object stands is not something that changes
	 * sixty times a second.
	 */
	const lightSurfaces = () => {
		const box = root.getBoundingClientRect();
		const w = Math.max(1, box.width);
		const h = Math.max(1, box.height);
		for (const el of Array.from(root.querySelectorAll<HTMLElement>('.berx-surface'))) {
			const depth = el.dataset.berxDepth;
			/* the environment planes *are* the light; they do not stand in it */
			if (depth === 'D0' || depth === 'D1') continue;
			const r = el.getBoundingClientRect();
			if (r.width <= 0 || r.height <= 0) continue;
			const nx = (r.left + r.width / 2 - box.left) / w;
			const ny = (r.top + r.height / 2 - box.top) / h;
			const lit = berxIlluminationAt(atmosphere, nx, ny);
			/* 0.5 is the even wash the stylesheet's own default matches */
			el.style.setProperty('--berx-surface-light', String(Math.round((0.45 + lit) * 100) / 100));

			/**
			 * A surface that lost its translucency was flattened over the
			 * substrate, which is only what is behind it where the room
			 * is dark. Between two cards in a lit room it is not, and the
			 * card then reads as a hole cut in the wall — measured at 12
			 * L* inverted on a real scene. Given the room's colour at
			 * this point, the surface's own fill is flattened against
			 * that instead, and an object standing in the light is
			 * lighter than the wall behind it.
			 */
			if (!depth || !(depth in scene.layers)) continue;
			const layer = scene.layers[depth as BerxDepthKey];
			if (!layer.surface.opaqueFallback) continue;
			const behind = berxRoomColorAt(atmosphere, scene.background, nx, ny);
			el.style.setProperty('--berx-surface-bg', flatten(layer.surface.translucentColor, behind));
		}
	};

	build();
	lightSurfaces();

	/* ---- parallax: transform-only, one write per frame ---- */
	const layerEls = () => Array.from(root.querySelectorAll<HTMLElement>('[data-berx-depth]'));
	let pendingScroll: number | null = null;

	const applyParallax = (now: number) => {
		frame = 0;
		recordFrame(now);
		if (pendingScroll === null) return;
		const y = pendingScroll;
		pendingScroll = null;
		for (const el of layerEls()) {
			const depth = el.dataset.berxDepth as BerxDepthKey | undefined;
			if (!depth || !(depth in scene.layers)) continue;
			const layer = scene.layers[depth];
			const offset = parallaxOffset(y, layer.parallaxFactor, scene.budget.allowParallax);
			/**
			 * D1 — the atmosphere — is anchored to the viewport: it adds
			 * the scroll back so the room travels with the viewer and
			 * lags behind by exactly its parallax factor, instead of
			 * being left at the top of the page.
			 *
			 * D0 is deliberately NOT anchored. Its parallax factor is 0,
			 * so it is a flat substrate fill that covers the document
			 * and never needs to move — and moving it would cost a
			 * second full-screen composited layer every frame for no
			 * visible difference. The browser probe measured exactly
			 * that cost when both planes were anchored.
			 */
			const anchored = depth === 'D1' ? y + offset : offset;
			el.style.setProperty('--berx-parallax-y', `${anchored}px`);
		}
	};

	const onScroll = () => {
		if (!scene.budget.allowParallax) return;
		/* the offset is read from the scroll source, never from layout */
		pendingScroll = scrollTarget === window ? window.scrollY : (scrollTarget as HTMLElement).scrollTop;
		if (frame === 0) frame = requestAnimationFrame(applyParallax);
	};

	/* ---- tilt: clamped by the scene, exactly zero under reduced motion ---- */
	const onPointerMove = (e: PointerEvent) => {
		if (scene.camera.maxTiltDeg === 0) return;
		const w = window.innerWidth || 1;
		const h = window.innerHeight || 1;
		const {rotateXDeg, rotateYDeg} = tiltFromPointer((e.clientX / w) * 2 - 1, (e.clientY / h) * 2 - 1, scene.camera);
		root.style.setProperty('--berx-tilt-x', `${rotateXDeg}deg`);
		root.style.setProperty('--berx-tilt-y', `${rotateYDeg}deg`);
	};

	/* ---- live frame sampling on the frames that actually matter ----
	   Idle frames are cheap and would dilute the measurement, so the
	   sample is taken from the parallax frames produced while the user
	   is scrolling — the exact moment the blur budget is being spent.
	   A scene that cannot hold the budget lowers its own tier once,
	   which drops effects and never layers or content. */
	let sampleTimes: number[] = [];
	let lastFrameAt = 0;

	const recordFrame = (now: number) => {
		if (!options.sampleFrames && options.sampleFrames !== undefined) return;
		if (lastFrameAt !== 0) sampleTimes.push(now - lastFrameAt);
		lastFrameAt = now;
		if (sampleTimes.length < SAMPLE_FRAMES) return;

		const sorted = [...sampleTimes].sort((a, b) => a - b);
		const median = sorted[Math.floor(sorted.length / 2)];
		const droppedRatio = sorted.filter((t) => t > SLOW_FRAME_MS).length / sorted.length;
		fps = median > 0 ? 1000 / median : null;
		sampleTimes = [];

		const holding = median <= SLOW_FRAME_MS && droppedRatio <= MAX_DROPPED_RATIO;
		if (holding || fps === null) return;

		/**
		 * Graduated, because the cost is known. The browser probe
		 * attributed the whole frame shortfall to backdrop blur: the
		 * same scene, same scroll, with the filters removed, dropped
		 * zero frames out of 39. So the first response drops blur and
		 * nothing else — every layer, every transform, all parallax and
		 * all content stay exactly as they were. Only if the scene is
		 * still missing vsync after that does the tier itself fall,
		 * which is the point where 3D and parallax go.
		 */
		if (!blurDisabled) {
			blurDisabled = true;
			build();
			return;
		}
		if (tierOverride === undefined) {
			tierOverride = fps;
			build();
		}
	};

	const onResize = () => {
		build();
		lightSurfaces();
	};
	const motionQuery =
		typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
	const onMotionChange = () => build();

	if (options.interactive !== false) scrollTarget.addEventListener('scroll', onScroll, {passive: true});
	window.addEventListener('resize', onResize, {passive: true});
	if (options.interactive !== false) window.addEventListener('pointermove', onPointerMove, {passive: true});
	motionQuery?.addEventListener?.('change', onMotionChange);

	return {
		get scene() {
			return scene;
		},
		get atmosphere() {
			return atmosphere;
		},
		refresh: () => {
			build();
			lightSurfaces();
		},
		/** Re-measures every surface against the room. Call after the
		 *  page adds or moves content. */
		relight: lightSurfaces,
		setFocus: (target, intensity) => {
			focusTarget = target;
			focusIntensity = intensity;
			applyFocus();
			return focusField;
		},
		focusField: () => focusField,
		measuredFps: () => fps,
		adapted: () => blurDisabled || tierOverride !== undefined,
		destroy: () => {
			if (frame) cancelAnimationFrame(frame);
			clearingEl?.remove();
			clearingEl = null;
			scrollTarget.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onPointerMove);
			motionQuery?.removeEventListener?.('change', onMotionChange);
		},
	} as BerxWebScene;
}

/** Re-exported so the bundle is a complete, self-sufficient runtime for the web. */
export {BERX_DEPTH_KEYS, BERX_MAX_TILT_DEG, resolveScene};
export type {BerxSceneRuntime, BerxSceneContract, BerxDepthKey};

/* ------------------------------------------------------------------ */
/* DOM primitives                                                      */
/* ------------------------------------------------------------------ */

/**
 * The same component grammar the React Native adapter has, as plain
 * DOM builders.
 *
 * BERX's web client is not React, so these are functions that return
 * elements rather than components — but they produce exactly the
 * markup styles/berx-5d.css expects, with the same depth semantics,
 * the same decorative-layer accessibility rules and the same control
 * minimums. A web surface built with these is the same BERX surface
 * a phone renders, not a lookalike.
 */

export interface BerxLayerOptions {
	/** Renders the layer's material. Off for pure positioning layers. */
	surface?: boolean;
	/** Overrides the default decorative treatment (D0/D1 are decorative). */
	decorative?: boolean;
	className?: string;
}

export function createBerxLayer(depth: BerxDepthKey, options: BerxLayerOptions = {}): HTMLElement {
	const layer = document.createElement('div');
	layer.className = ['berx-layer', options.className].filter(Boolean).join(' ');
	layer.dataset.berxDepth = depth;

	/* D0 and D1 are the room: they carry no semantic content, so they
	   are hidden from assistive technology unless told otherwise */
	const decorative = options.decorative ?? (depth === 'D0' || depth === 'D1');
	if (decorative) {
		layer.setAttribute('aria-hidden', 'true');
		layer.style.pointerEvents = 'none';
	}

	if (options.surface === false) return layer;

	const surface = document.createElement('div');
	surface.className = 'berx-surface';
	surface.dataset.berxDepth = depth;
	layer.appendChild(surface);
	return layer;
}

/** The content element of a layer built with `createBerxLayer`. */
export function berxLayerContent(layer: HTMLElement): HTMLElement {
	return (layer.querySelector('.berx-surface') as HTMLElement | null) ?? layer;
}

export interface BerxCardOptions {
	depth?: BerxDepthKey;
	/** Makes the card a real button, with the name assistive technology needs. */
	onPress?: () => void;
	accessibleName?: string;
	className?: string;
	/**
	 * Real domain media. Given one, the card *is* the picture: the
	 * image fills the object and everything the object says sits in
	 * the image's own falloff at the bottom of it, rather than in a
	 * paragraph under a decorative band. The same treatment the React
	 * Native object card gives it, so a place looks like the same
	 * place on both platforms.
	 *
	 * Omitted, the card is the lit surface and the type. BERX ships no
	 * stock photograph to make the two look alike.
	 */
	mediaUrl?: string;
	/** What the picture shows. Omitted marks it decorative. */
	mediaAlt?: string;
}

/**
 * A card on a depth plane. When it acts, it is a `<button>` — a card
 * that navigates is a control whatever it looks like, and only a real
 * button is reachable by keyboard and announced correctly.
 */
export function createBerxCard(options: BerxCardOptions = {}): HTMLElement {
	const depth = options.depth ?? 'D3';
	const interactive = typeof options.onPress === 'function';

	const el = document.createElement(interactive ? 'button' : 'div');
	el.className = ['berx-surface', interactive ? 'berx-focusable' : '', options.className].filter(Boolean).join(' ');
	if (interactive) {
		/**
		 * A card that acts is a <button>, and a button does not inherit
		 * the page's colour or font: rendered as one, a BERX card's own
		 * title came out in the user agent's dark button text on a dark
		 * surface — invisible, while the body text beside it was fine.
		 * Found by looking at a rendered scene rather than at the DOM.
		 */
		el.style.color = 'inherit';
		el.style.font = 'inherit';
		el.style.textAlign = 'inherit';
	}
	el.dataset.berxDepth = depth;

	if (interactive) {
		(el as HTMLButtonElement).type = 'button';
		if (options.accessibleName) el.setAttribute('aria-label', options.accessibleName);
		el.addEventListener('click', () => options.onPress?.());
	}

	if (options.mediaUrl) {
		el.classList.add('berx-card-media');
		const stage = document.createElement('div');
		stage.className = 'berx-card-stage';
		const img = document.createElement('img');
		img.src = options.mediaUrl;
		img.decoding = 'async';
		img.loading = 'lazy';
		if (options.mediaAlt) img.alt = options.mediaAlt;
		else {
			img.alt = '';
			img.setAttribute('aria-hidden', 'true');
		}
		stage.appendChild(img);
		/* the falloff, painted by the stylesheet from the scene's own
		   substrate colour so the picture darkens into the room rather
		   than into a black rectangle */
		const fall = document.createElement('div');
		fall.className = 'berx-card-fall';
		fall.setAttribute('aria-hidden', 'true');
		stage.appendChild(fall);
		el.appendChild(stage);
	}
	return el;
}

/**
 * A control that meets the archive's touch minimum.
 *
 * The runtime writes `--berx-touch-min` from the control plane's own
 * projection, so the painted target is never under 44 CSS px even
 * though the scene's camera scales it.
 */
export function createBerxControl(label: string, onPress: () => void): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'berx-focusable berx-control';
	button.textContent = label;
	button.addEventListener('click', onPress);
	return button;
}

/** The D5 energy marker. Decorative by contract — meaning lives in text beside it. */
export function createBerxEnergy(sizePx = 64): HTMLElement {
	const el = document.createElement('div');
	el.className = 'berx-energy';
	el.setAttribute('aria-hidden', 'true');
	el.style.width = `${sizePx}px`;
	el.style.height = `${sizePx}px`;
	return el;
}

/**
 * Builds a complete scene root with all six planes in order, ready
 * for content. The layers are returned so a caller can fill D2–D5
 * without querying the DOM back out.
 */
export function createBerxSceneRoot(root: HTMLElement): Record<BerxDepthKey, HTMLElement> {
	root.className = 'berx-scene';
	root.innerHTML = '';
	const layers = {} as Record<BerxDepthKey, HTMLElement>;
	for (const depth of BERX_DEPTH_KEYS) {
		const layer = createBerxLayer(depth, {surface: depth !== 'D3'});
		layers[depth] = layer;
		root.appendChild(layer);
	}
	return layers;
}
export * from './voiceToWorld';
