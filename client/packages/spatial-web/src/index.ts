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
	parallaxOffset,
	perspectiveScale,
	resolveScene,
	tiltFromPointer,
	type BerxColorWorldName,
	type BerxDepthKey,
	type BerxDeviceSignals,
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
	/** Re-resolves against current conditions (resize, preference change, tier drop). */
	refresh: () => void;
	destroy: () => void;
	/** Frames per second from the last completed sample window, or null. */
	measuredFps: () => number | null;
	/** True once the runtime has lowered its own tier from a measurement. */
	adapted: () => boolean;
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
		'--berx-focus-scale': String(scene.motion.focus.to?.scale ?? 1),
		'--berx-ambient-ms': `${scene.motion.ambient.durationMs}ms`,
	};

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
	let frame = 0;

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
	};

	build();

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
			el.style.setProperty('--berx-parallax-y', `${offset}px`);
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

	const onResize = () => build();
	const motionQuery =
		typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
	const onMotionChange = () => build();

	scrollTarget.addEventListener('scroll', onScroll, {passive: true});
	window.addEventListener('resize', onResize, {passive: true});
	window.addEventListener('pointermove', onPointerMove, {passive: true});
	motionQuery?.addEventListener?.('change', onMotionChange);

	return {
		get scene() {
			return scene;
		},
		refresh: build,
		measuredFps: () => fps,
		adapted: () => blurDisabled || tierOverride !== undefined,
		destroy: () => {
			if (frame) cancelAnimationFrame(frame);
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
