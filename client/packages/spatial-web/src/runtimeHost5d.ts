/**
 * BERX MAX 5D web host — the real GPU scene, adaptive quality, camera
 * input, picking, world navigation, and the keyboard and screen-reader
 * path into all of it.
 *
 * Three things this host used to get wrong, all of them the kind that
 * only show up in a real browser:
 *
 * The world was unreachable without a pointer. The canvas was created
 * `aria-hidden` with `tabIndex -1`, so the entire spatial product was
 * invisible to assistive technology and unusable from a keyboard. It
 * is an `application` now, focusable, with arrow keys moving between
 * objects, Enter focusing one, Escape going back, and a live region
 * that says what just came forward.
 *
 * Layout was read on every frame. `getBoundingClientRect()` inside the
 * rAF callback forces a synchronous layout sixty times a second, on
 * the one thread that also has to produce the frame. A ResizeObserver
 * reports the same fact when it actually changes.
 *
 * A lost GPU context killed the world permanently. `webglcontextlost`
 * happens for ordinary reasons — a laptop switching GPUs, a driver
 * reset, too many live contexts — and nothing listened, so the canvas
 * stayed black until reload. It is caught, the frame loop pauses, and
 * the meshes rebuild on restore.
 */
import {
	Berx5DRuntime, Berx5DWorldApp, BerxHaptics, cameraBasis, pickActionSlot, berxNearActionSlots, rayFromNdc,
	berxRenderQuality, berxResolveRenderTier, berxCoreAt, berxCoreStep, berxCoreEnter, berxCoreCause,
	berxListenerFromCamera,
	type BerxHapticBackend, type BerxSpatialObject, type BerxWorldIngest,
	type BerxRenderQuality, type BerxCoreMotion, type BerxCoreCause,
	type BerxSpatialAudioBackend, type Berx5DFrame,
} from '@berx/spatial';
import { BerxThreeRuntimeRenderer } from './threeRuntime';
import type { BerxWebRendererBackend } from './webRenderer';
import { resolveSpatialQuality, type BerxSpatialQualityResult } from './runtimeQuality';
import { BerxWebHaptics } from './hapticsWeb';

export interface Berx5DWebHostOptions {
	/**
	 * The world this host draws.
	 *
	 * Supplying one makes this the product shell: frames come from the
	 * world application, so the relational layout and the temporal
	 * cursor are part of every frame, and entering an object travels to
	 * it rather than merely focusing it. Without one the host drives a
	 * bare runtime, which is what the GPU verification needs to place
	 * objects at exact coordinates and read the pixels back.
	 */
	world?: Berx5DWorldApp;
	canvas?: HTMLCanvasElement;
	reducedMotion?: boolean;
	deviceMotion?: boolean;
	pixelRatioCap?: number;
	/** What the world is, for anyone arriving by keyboard or screen reader. */
	ariaLabel?: string;
	/** Called whenever the focused object changes, however it was reached. */
	onFocusChange?: (object: BerxSpatialObject | undefined) => void;
	/** Called when the GPU context is lost or restored, so a shell can say so. */
	onContextChange?: (state: 'lost' | 'restored') => void;
	/** How many media textures may be resident at once. */
	textureBudget?: number;
	/** A real media URL that would not load. Reported, never substituted. */
	onMediaError?: (uri: string, error: unknown) => void;
	/**
	 * Haptics for what the world does — selecting, focusing, travelling,
	 * an action taken or refused.
	 *
	 * On by default where the browser has a vibration motor, off where
	 * it has none: `navigator.vibrate` is absent in Safari and on every
	 * desktop, and BerxWebHaptics reports that rather than pretending.
	 * Pass a backend to drive different hardware, or false to silence
	 * it entirely.
	 */
	haptics?: BerxHapticBackend | false;
	/**
	 * Where the world is heard from.
	 *
	 * Given a backend, the listener is moved to the camera every frame —
	 * the same camera the pixels come from, so a sound placed at an
	 * entity is behind you exactly when the entity is. The host never
	 * plays anything: BERX has no audio assets and invents no media, so
	 * what is heard is whatever a caller `play`s from a real URL the
	 * server handed over.
	 *
	 * Left out, nothing listens and nothing costs anything.
	 */
	audio?: BerxSpatialAudioBackend;
	/** Whether the air carries dust, energy and the far field. Default on. */
	particles?: boolean;
	/** Whether the key light is visible in the air. Default on. */
	volumetric?: boolean;
	/**
	 * The GPU backend to draw with.
	 *
	 * Omitted, the host builds the WebGL2 one, which is what every
	 * synchronous caller gets and has always got. A caller that can wait
	 * — `startBerxApp` does — builds one with `createBerxWebRenderer`
	 * and passes it here, which is how a session ends up on WebGPU where
	 * the browser has it. The host does not care which it is: everything
	 * about the world is decided in @berx/spatial either way.
	 */
	renderer?: BerxWebRendererBackend;
	/**
	 * How to build another one, when the GPU takes this one away.
	 *
	 * WebGL2 gets its context back through `webglcontextrestored` and
	 * keeps the same renderer. WebGPU has no such event: a lost device
	 * is gone, and continuing means asking for a new one and rebuilding
	 * every pipeline and buffer on it. The world is untouched either
	 * way — it lives in @berx/spatial, not in the renderer — so what a
	 * lost GPU costs is pixels, and this is what buys them back.
	 */
	rendererFactory?: () => Promise<BerxWebRendererBackend>;
}

export interface Berx5DWebHost {
	readonly canvas: HTMLCanvasElement;
	readonly runtime: Berx5DRuntime;
	/** The world application, when this host was given one. */
	readonly world?: Berx5DWorldApp;
	/** Put real entities into the world. Requires a world. */
	ingest(entries: readonly BerxWorldIngest[]): void;
	readonly renderer: BerxWebRendererBackend;
	readonly quality: BerxSpatialQualityResult;
	/**
	 * The render tier this session resolved, and its knobs.
	 *
	 * Exposed so a gate can check the session IS resolving one. The tier
	 * table was built and verified before anything called it, and no gate
	 * could see the gap because every gate drove the module directly.
	 */
	readonly renderTier: {tier: string; reason: string; quality: BerxRenderQuality};
	/** The Core this session's frame loop is stepping. Same reason. */
	readonly core: BerxCoreMotion;
	/** Where the world is heard from, when this host was given ears. */
	readonly audio?: BerxSpatialAudioBackend;
	/**
	 * Move the Core, by naming something that happened.
	 *
	 * The one way in from outside, and it takes a CAUSE rather than a
	 * state on purpose: there is no expression here for "look like this",
	 * only for "this occurred". The voice binding is the caller that
	 * matters — a spoken turn's understanding, search, results and
	 * failures reach the rendered Core through this and nowhere else.
	 */
	coreCause(cause: BerxCoreCause): void;
	/** False while the GPU context is lost; the world state survives. */
	readonly contextAlive: boolean;
	/**
	 * Whether the air carries dust, energy and the far field.
	 *
	 * A real switch on the host, not just in the renderer: a low-tier
	 * device drops the whole pass, and a measurement that needs one
	 * object's outline can stop the field filling the frame around it.
	 */
	setParticles(on: boolean): void;
	/**
	 * Whether the key light is visible in the air.
	 *
	 * Same reasoning as setParticles: a real switch for a low-tier
	 * device, and the only way a measurement of one object's outline can
	 * stop the in-scatter lighting every pixel around it.
	 */
	setVolumetric(on: boolean): void;
	/**
	 * What the last frame actually cost, plus how long it took.
	 *
	 * Measured during the draw and during the loop — never estimated
	 * from the object count, which is the number culling and the budget
	 * exist to stop mattering.
	 */
	readonly performance: {
		frameMs: number;
		p95Ms: number;
		visible: number;
		inFrustum: number;
		drawCalls: number;
		triangles: number;
		lodReduced: number;
		budgetCut: number;
		residentTextures: number;
		residentLabels: number;
		quality: BerxSpatialQualityResult['quality'];
	};
	/**
	 * `media` is whatever the mapping layer produced for this object —
	 * real URIs the server sent, and nothing when it sent none. The
	 * structural shape keeps this package independent of @berx/scenes.
	 */
	addObject(object: BerxSpatialObject, media?: readonly {uri: string}[]): void;
	removeObject(id: string): void;
	focus(id: string): boolean;
	enterWorld(id: string, sourceRoute?: string, destination?: {x: number; y: number; z: number}): void;
	back(): boolean;
	start(): void;
	stop(): void;
	destroy(): void;
}

const prefersReducedMotion = () =>
	typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** What to call an object out loud when it has told us nothing better. */
const KIND_NAME: Record<BerxSpatialObject['kind'], string> = {
	person: 'человек',
	moment: 'момент',
	place: 'место',
	event: 'событие',
	experience: 'впечатление',
	community: 'сообщество',
	business: 'бизнес',
	collection: 'подборка',
	message: 'сообщение',
	create: 'создать',
};
const nameOf = (o: BerxSpatialObject) => o.label ?? KIND_NAME[o.kind];

export function createBerx5DWebHost(options: Berx5DWebHostOptions = {}): Berx5DWebHost {
	const canvas = options.canvas ?? document.createElement('canvas');
	const owned = !options.canvas;
	if (owned) document.body.appendChild(canvas);
	canvas.style.display = 'block';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.style.touchAction = 'none';
	canvas.style.background = '#07080A';

	/* The world is an application, not decoration: it takes focus, it
	   has a name, and its state is announced. */
	canvas.removeAttribute('aria-hidden');
	canvas.tabIndex = 0;
	canvas.setAttribute('role', 'application');
	canvas.setAttribute('aria-label', options.ariaLabel ?? 'Пространство BERX. Стрелки — к соседнему объекту, Enter — переместиться к нему, Escape — назад, L — к тому, что происходит сейчас, запятая и точка — назад и вперёд во времени.');

	/* Announcements go in their own node: a canvas has no text for a
	   screen reader to read, so what happens in the world has to be
	   said somewhere it can be read. */
	const live = document.createElement('div');
	live.setAttribute('aria-live', 'polite');
	live.setAttribute('aria-atomic', 'true');
	live.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
	(canvas.parentElement ?? document.body).appendChild(live);
	const announce = (text: string) => {
		live.textContent = text;
	};

	const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;
	let reducedMotion = options.reducedMotion ?? prefersReducedMotion();
	/**
	 * The world this host draws, when it was given one.
	 *
	 * With a world, frames come from the world application, so the
	 * relational layout and the temporal cursor are part of every frame
	 * and entering an object travels to it. Without one the host drives
	 * a bare runtime — which is what the GPU verification needs, to
	 * place objects at exact coordinates and read the pixels back.
	 */
	const world = options.world;
	const runtime = world?.runtime ?? new Berx5DRuntime({reducedMotion, deviceMotionEnabled: options.deviceMotion !== false});
	world?.setAccessibility({reducedMotion});
	let renderer: BerxWebRendererBackend = options.renderer
		?? new BerxThreeRuntimeRenderer(canvas, {textureBudget: options.textureBudget, onMediaError: options.onMediaError});
	/* what each object shows, kept by the host rather than only by the
	   renderer: a rebuilt renderer starts with nothing, and the pictures
	   have to come back without re-reading the server */
	const mediaByObject = new Map<string, readonly {uri: string}[]>();
	/* One vocabulary for the whole world: WHAT is played lives in
	   @berx/spatial's BERX_HAPTICS, so focusing feels the same here as
	   it does on a phone; this only chooses the hardware. Reduced
	   motion silences it, because a device asking for less motion is
	   asking for less buzzing too. */
	let particles = options.particles !== false;
	let volumetric = options.volumetric !== false;
	const haptics = new BerxHaptics(options.haptics === false ? undefined : (options.haptics ?? new BerxWebHaptics()));
	haptics.setReducedMotion(reducedMotion);
	const pixelRatioCap = Math.max(1, options.pixelRatioCap ?? 2);

	let quality: BerxSpatialQualityResult = {quality: 'balanced', pixelRatio: 1, maxObjects: 80, ambientMotion: true};

	/**
	 * WHAT THIS DEVICE CAN AFFORD, and what BERX is doing about it.
	 *
	 * Both of these were built, verified and then not called — the tier
	 * table and the Core state machine each had their own gate and
	 * neither reached a product session. A verified module the shell does
	 * not drive is a library, not a feature, and the difference is
	 * invisible from inside a gate. See verify:5d-wiring, which exists
	 * because nothing was looking for that gap.
	 *
	 * The tier is resolved ONCE, from what the platform will say about
	 * itself. It is deliberately not re-resolved per frame: a device does
	 * not become a different device, and a tier that moved with the frame
	 * rate would be the flicker the stability work removed.
	 */
	const renderTier = berxResolveRenderTier({
		deviceMemoryGb: (navigator as unknown as {deviceMemory?: number}).deviceMemory,
		logicalCores: navigator.hardwareConcurrency,
		pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
		saveData: (navigator as unknown as {connection?: {saveData?: boolean}}).connection?.saveData,
		prefersReducedMotion: reducedMotion,
	});
	const renderQuality: BerxRenderQuality = berxRenderQuality(renderTier.tier);

	/**
	 * The Core: the world's own state, made physical.
	 *
	 * Stepped every frame with the real elapsed time, and its field is
	 * handed to the draw list — which is the only way it is drawn at all.
	 * Nothing here decides how the Core feels; `berxCoreCause` does, from
	 * things that really happened.
	 */
	let core: BerxCoreMotion = berxCoreAt('idle');
	const coreCause = (cause: BerxCoreCause) => {
		core = berxCoreEnter(core, berxCoreCause(core.state, cause, core.unresolved));
	};
	let raf = 0;
	let last = performance.now();
	let running = false;
	let contextAlive = true;
	let dragging = false;
	let lastX = 0, lastY = 0, downX = 0, downY = 0;
	let pinchDistance: number | undefined;
	/* the last size the observer reported, in CSS pixels */
	let cssWidth = 1, cssHeight = 1;
	let lastAnnouncedId: string | undefined;
	/* a rolling window of real frame times, for a p95 that means something */
	const frameTimes: number[] = [];
	let lastFrameMs = 0;

	const visibleObjects = () => (world ? world.latestFrame : runtime.latestFrame).world.objects.filter((o) => o.visible);

	/** Re-resolve quality and the backing store. Only on real size or load changes. */
	const applySize = () => {
		const nativeDpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
		const baseDpr = Math.min(nativeDpr, pixelRatioCap);
		quality = resolveSpatialQuality({
			devicePixelRatio: baseDpr,
			width: Math.max(1, cssWidth),
			height: Math.max(1, cssHeight),
			reducedMotion,
			visibleObjectCount: visibleObjects().length,
		});
		const dpr = Math.min(baseDpr, quality.pixelRatio);
		const width = Math.max(1, Math.round(cssWidth * dpr));
		const height = Math.max(1, Math.round(cssHeight * dpr));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			renderer.resize(width, height);
		}
	};

	/* The object count changes quality but not size, and it changes when
	   worlds are populated rather than every frame — so it is checked
	   against what it was, not recomputed blindly. */
	let lastVisibleCount = -1;
	const syncQualityToLoad = () => {
		const count = visibleObjects().length;
		if (count === lastVisibleCount) return;
		lastVisibleCount = count;
		applySize();
	};

	const announceFocus = () => {
		const object = runtime.world.getActiveObject();
		if (object?.id === lastAnnouncedId) return;
		lastAnnouncedId = object?.id;
		options.onFocusChange?.(object);
		if (object) {
			/* Arriving somewhere IS the resolution: the thing being looked
			   for is now the thing being stood in front of. */
			coreCause({kind: 'arrived', region: world?.worldPosition.region ?? 'world'});
			announce(`${nameOf(object)} в фокусе`);
			/* the same moment, said three ways: to the screen reader, to
			   the eye, and to the hand */
			haptics.moment('focus');
		}
	};

	/**
	 * The ears go where the eyes are.
	 *
	 * Driven from the frame that is about to be drawn rather than from
	 * the camera object, so what is heard is the pose the pixels were
	 * made with — including mid-travel, where the camera's own state is
	 * the destination and the frame's is where it currently is. One
	 * conversion, in @berx/spatial, so every backend agrees which way
	 * forward is.
	 *
	 * It keeps running with the GPU context gone: the world is still
	 * there and still moving, and sound that froze on a driver reset
	 * would jump when the pixels came back.
	 */
	const listen = (scene: Berx5DFrame) => {
		options.audio?.setListener(berxListenerFromCamera(scene.camera.position, scene.camera.target));
	};

	const frame = (now: number) => {
		if (!running) return;
		const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
		lastFrameMs = now - last;
		last = now;
		/* 120 frames is two seconds at 60fps: long enough for a p95 to
		   mean something, short enough to reflect what is happening now */
		frameTimes.push(lastFrameMs);
		if (frameTimes.length > 120) frameTimes.shift();
		if (contextAlive) {
			syncQualityToLoad();
			/* what can be done with what is focused, this frame */
			if (world) renderer.setAffordances(world.affordances());
			/* The Core advances on real elapsed time, so a slow device
			   reaches the same state at the same moment rather than at
			   half speed — the integrator is exponential for exactly
			   this reason. */
			core = berxCoreStep(core, dt);
			const scene = world ? world.frame(dt) : runtime.frame(dt);
			listen(scene);
			renderer.render(scene, {
				maxObjects: quality.maxObjects,
				ambientMotion: quality.ambientMotion,
				particles, volumetric,
				quality: renderQuality,
				core: core.field,
			});
		} else {
			/* the world keeps time even with no GPU to draw it, so a
			   restore resumes where it was rather than snapping */
			listen(world ? world.frame(dt) : runtime.frame(dt));
		}
		raf = requestAnimationFrame(frame);
	};

	/* ---------------- pointer ---------------- */
	const onPointerDown = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		/* Someone is here and reaching for something. Not a hover — a
		   hand actually landing on the world. */
		coreCause({kind: 'presence', near: true});
		/* Held down IS a state: the slot presses in while a finger is on
		   it, and lets go when the finger does. */
		if (world) world.pressAffordance(slotsUnder(e).over?.affordance.id);
		dragging = true;
		lastX = downX = e.clientX;
		lastY = downY = e.clientY;
		/* Capture keeps a drag alive when the finger leaves the canvas,
		   and it THROWS when the pointer is not one the browser is
		   tracking — a synthetic event from an automation tool or an
		   assistive one, or a pointer released between the event and this
		   line. Losing capture costs a drag that ends at the canvas edge;
		   letting it throw costs the whole gesture and the frame it was
		   in. */
		try {
			canvas.setPointerCapture?.(e.pointerId);
		} catch {
			/* no capture, still a drag */
		}
	};
	const onPointerMove = (e: PointerEvent) => {
		if (!dragging) {
			/* Not dragging: the hand is looking. Hover and proximity are
			   reported as FACTS about where it is — what they mean is
			   decided in the world, with everything else that could be
			   true of the same affordance at the same moment. */
			if (world) {
				const {over, near} = slotsUnder(e);
				world.pointAt(over?.affordance.id, near);
			}
			return;
		}
		/* Dragging: the hand is moving the world, not choosing in it, so
		   nothing is hovered. */
		if (world) world.pointAt(undefined);
		const dx = e.clientX - lastX, dy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
		runtime.input({panX: -dx * 0.018, panY: dy * 0.018, depthDelta: 0, pinch: 0});
	};
	/**
	 * DOING AN AFFORDANCE. One path, whatever reached it.
	 *
	 * The pointer had this inline, so a keyboard route would have meant
	 * a second copy of the announcement, the haptics and the error
	 * handling — three chances to drift, and a keyboard that slowly
	 * stopped meaning the same thing as a finger. It is lifted out
	 * unchanged instead: `world.act` is the ONE action path, and neither
	 * input decides anything about what an action does.
	 */
	const activate = (affordanceId: string, label: string): void => {
		if (!world) return;
		announce(`${label}…`);
		haptics.moment('select');
		void world.act(affordanceId).then((done) => {
			announce(done ? `${label}: готово` : `${label}: не удалось`);
			haptics.moment(done ? 'action-ok' : 'action-refused');
		}).catch((error) => {
			haptics.moment('action-refused');
			/* the server's own reason, out loud */
			announce(error instanceof Error ? error.message : `${label}: не удалось`);
		});
	};

	/**
	 * Where a pointer is, in the world's own terms.
	 *
	 * One conversion, used by move, down and up, so the slot a hover
	 * highlights is the slot a press activates. Two copies of this is
	 * how a highlight and a hit-test end up one pixel apart.
	 */
	const slotsUnder = (e: {clientX: number; clientY: number}) => {
		const rect = canvas.getBoundingClientRect();
		const dpr = canvas.width / Math.max(1, rect.width);
		const x = (e.clientX - rect.left) * dpr;
		const y = (e.clientY - rect.top) * dpr;
		const frameState = world ? world.latestFrame : runtime.latestFrame;
		const aspect = canvas.width / canvas.height;
		const ray = rayFromNdc(frameState.camera, (x / canvas.width) * 2 - 1, 1 - (y / canvas.height) * 2, aspect);
		if (!ray || !world) return {x, y, frameState, over: undefined, near: [] as string[]};
		return {
			x, y, frameState,
			over: pickActionSlot(renderer.actionSlots, frameState.camera, ray.direction, aspect),
			near: berxNearActionSlots(renderer.actionSlots, frameState.camera, ray.direction, aspect),
		};
	};

	const onPointerUp = (e: PointerEvent) => {
		if (!dragging) return;
		dragging = false;
		/* The finger is off it: `press` ends here, whatever happens next.
		   The pick below reads the slots the last frame produced, so
		   clearing it now cannot cost the activation. */
		if (world) world.pressAffordance(undefined);
		/**
		 * RELEASING A CAPTURE THAT WAS NEVER TAKEN THROWS, and this line
		 * runs BEFORE the pick.
		 *
		 * setPointerCapture is already wrapped for the same reason; its
		 * sibling was not. Any pointer whose capture never took — the
		 * browser cancelled it, another element claimed it, or the
		 * capture call itself threw — arrives here and raises, and the
		 * throw abandons the rest of this handler. The rest of this
		 * handler is where an affordance is picked and acted on, so the
		 * failure is not cosmetic: the press lands on the action and
		 * nothing happens.
		 *
		 * Found by driving a real PointerEvent at the pixel a slot is
		 * drawn at, which is exactly the pointer a browser produces when
		 * a capture has already been lost.
		 */
		try {
			canvas.releasePointerCapture?.(e.pointerId);
		} catch {
			/* nothing held it; the pick below is what matters */
		}
		/* a drag is not a tap: a pick after panning would select
		   whatever happened to be under the finger when it lifted */
		if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
		const rect = canvas.getBoundingClientRect();
		const dpr = canvas.width / Math.max(1, rect.width);
		const x = (e.clientX - rect.left) * dpr;
		const y = (e.clientY - rect.top) * dpr;
		const frameState = world ? world.latestFrame : runtime.latestFrame;
		/* an action beside the focused entity is nearer to hand than the
		   entity behind it, so the ring is tested first */
		const ray = rayFromNdc(frameState.camera, (x / canvas.width) * 2 - 1, 1 - (y / canvas.height) * 2, canvas.width / canvas.height);
		const slot = ray && world ? pickActionSlot(renderer.actionSlots, frameState.camera, ray.direction, canvas.width / canvas.height) : undefined;
		if (slot && world) {
			activate(slot.affordance.id, slot.affordance.label);
			return;
		}
		const hit = renderer.pick(frameState, x, y);
		if (hit && runtime.focus(hit.objectId)) announceFocus();
	};
	const onWheel = (e: WheelEvent) => {
		e.preventDefault();
		runtime.input({panX: 0, panY: 0, depthDelta: e.deltaY * 0.003, pinch: 0});
	};
	const onTouchStart = (e: TouchEvent) => {
		if (e.touches.length === 2) pinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
	};
	const onTouchMove = (e: TouchEvent) => {
		if (e.touches.length !== 2 || pinchDistance === undefined) return;
		const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
		runtime.input({panX: 0, panY: 0, depthDelta: 0, pinch: (d - pinchDistance) * 0.03});
		pinchDistance = d;
	};
	const onTouchEnd = () => {
		pinchDistance = undefined;
	};
	const onDeviceMotion = (e: DeviceOrientationEvent) => {
		if (reducedMotion) return;
		runtime.input({panX: 0, panY: 0, depthDelta: 0, pinch: 0, motion: {pitch: (e.beta ?? 0) / 45, roll: (e.gamma ?? 0) / 45, yaw: (e.alpha ?? 0) / 180, intensity: 0.65}});
	};

	/* ---------------- keyboard ---------------- */
	/**
	 * Arrow keys move to the nearest focusable object in that direction
	 * in world space — not through a list, because the world is not a
	 * list. Direction is taken in the camera's own frame so "right"
	 * means right on screen whatever the camera is doing.
	 */
	const step = (dx: number, dy: number) => {
		const frameState = world ? world.latestFrame : runtime.latestFrame;
		const objects = frameState.world.objects.filter((o) => o.visible && o.focusable);
		if (objects.length === 0) return false;
		const current = runtime.world.getActiveObject();
		if (!current) return runtime.focus(objects[0].id);

		/* the same basis picking uses, so "right" means the same thing
		   whether it was reached by a tap or by the right arrow key */
		const basis = cameraBasis(frameState.camera);
		if (!basis) return false;
		const {right, up} = basis;

		let best: BerxSpatialObject | undefined;
		let bestScore = Infinity;
		for (const o of objects) {
			if (o.id === current.id) continue;
			const d = {x: o.transform.position.x - current.transform.position.x, y: o.transform.position.y - current.transform.position.y, z: o.transform.position.z - current.transform.position.z};
			const sx = d.x * right.x + d.y * right.y + d.z * right.z;
			const sy = d.x * up.x + d.y * up.y + d.z * up.z;
			/* how far along the requested direction, versus how far off it */
			const along = sx * dx + sy * dy;
			if (along <= 0.001) continue;
			const off = Math.abs(sx * dy - sy * dx);
			const score = off * 2 + along;
			if (score < bestScore) {
				bestScore = score;
				best = o;
			}
		}
		if (!best) return false;
		return runtime.focus(best.id);
	};

	const onKeyDown = (e: KeyboardEvent) => {
		let handled = true;
		/* Some branches say something more specific than "you are looking
		   at X"; announceFocus below must not talk over them. */
		let spoke = false;
		switch (e.key) {
			case 'ArrowRight': handled = step(1, 0); break;
			case 'ArrowLeft': handled = step(-1, 0); break;
			case 'ArrowUp': handled = step(0, 1); break;
			case 'ArrowDown': handled = step(0, -1); break;
			case 'Tab': {
				/**
				 * INTO THE RING, and around it.
				 *
				 * Tab walks the affordances of the focused entity — the
				 * same ones a finger picks, in the order they stand in the
				 * world. It is not a parallel focus order assembled for
				 * the keyboard: `world.affordances()` is the one list, and
				 * the focused one is marked in it, which is what puts the
				 * focus ring in the WORLD rather than around the canvas.
				 *
				 * With nothing focusable, Tab is left alone so it still
				 * leaves the world for the rest of the page.
				 */
				handled = world ? world.focusAffordance(e.shiftKey ? -1 : 1) : false;
				if (handled) {
					const a = world?.focusedAffordance;
					if (a) { announce(`${a.label} — Enter, чтобы выполнить`); spoke = true; }
				}
				break;
			}
			case 'Enter':
			case ' ': {
				/* An affordance in focus is what Enter is for. Travel is
				   what Enter means when the ring has not been entered. */
				const focused = world?.focusedAffordance;
				if (focused) {
					activate(focused.id, focused.label);
					spoke = true;
					break;
				}
				const object = runtime.world.getActiveObject();
				if (object) {
					/* travel, not open: the camera moves and the world stays */
					if (world) world.travelTo(object.id);
					else runtime.enterWorld({id: `${object.kind}:${object.id}`, focusObjectId: object.id, enteredAt: Date.now()});
					announce(`${nameOf(object)} — камера перемещается`);
					haptics.moment('travel');
				} else handled = false;
				break;
			}
			case 'Escape':
			case 'Backspace':
				/* Out of the ring first: Escape from an action means "not
				   that action", not "leave the place". */
				if (world?.focusedAffordance) {
					world.blurAffordance();
					announce('Действие отменено');
					handled = true;
					spoke = true;
					break;
				}
				handled = world ? world.back() : runtime.back();
				if (handled) {
					announce('Назад');
					haptics.moment('back');
				}
				break;
			/* what is happening, from anywhere in the world */
			case 'l':
			case 'д':
				if (world) {
					const wentLive = world.travelToLive();
					announce(wentLive ? 'Сейчас' : 'Сейчас ничего не происходит');
				} else handled = false;
				break;
			/* time is a direction you can move in, on the same keyboard */
			case ',':
			case '<':
				if (world) world.scrubTime(-86400);
				else handled = false;
				if (handled) announce('Назад во времени на день');
				break;
			case '.':
			case '>':
				if (world) world.scrubTime(86400);
				else handled = false;
				if (handled) announce('Вперёд во времени на день');
				break;
			default:
				handled = false;
		}
		if (handled) {
			e.preventDefault();
			if (!spoke) announceFocus();
		}
	};

	/* ---------------- lifecycle ---------------- */
	const onContextLost = (e: Event) => {
		/* the default is to make the loss permanent; preventing it is
		   what allows a restore event to arrive at all */
		e.preventDefault();
		contextAlive = false;
		/* The GPU went away mid-frame. Presence is KEPT — energy stays up
		   while coherence falls — because something is still happening and
		   BERX has not stopped being here. */
		coreCause({kind: 'outcome', outcome: {ok: false, awaiting: false, results: []}});
		renderer.handleContextLost();
		options.onContextChange?.('lost');
		announce('Графика прервалась. BERX восстановит сцену.');
	};
	/**
	 * A GPU device that went away for good.
	 *
	 * Only WebGPU reports this; WebGL2 restores its context instead.
	 * With a factory, a new backend is built, given the size and the
	 * pictures back, and the loop resumes on it — the world graph, the
	 * camera, the temporal cursor and the focus were never in the
	 * renderer, so nothing about where the viewer is changes. Without a
	 * factory the host stays honestly stopped rather than drawing into
	 * a dead device.
	 */
	const onDeviceLost = async (reason: string) => {
		contextAlive = false;
		coreCause({kind: 'outcome', outcome: {ok: false, awaiting: false, results: []}});
		renderer.handleContextLost(reason);
		options.onContextChange?.('lost');
		announce('Графика прервалась. BERX восстановит сцену.');
		if (!options.rendererFactory) return;
		try {
			const next = await options.rendererFactory();
			renderer.dispose();
			renderer = next;
			applySize();
			for (const [objectId, surfaces] of mediaByObject) renderer.setObjectMedia(objectId, surfaces);
			if (world) renderer.setAffordances(world.affordances());
			contextAlive = true;
			watchForDeviceLoss();
			options.onContextChange?.('restored');
			announce('Сцена восстановлена.');
		} catch (error) {
			options.onMediaError?.('gpu:device', error);
		}
	};

	/** WebGPU backends carry this; WebGL2 ones do not, and need not. */
	const watchForDeviceLoss = () => {
		const lost = (renderer as {whenLost?: Promise<string>}).whenLost;
		if (!lost) return;
		const mine = renderer;
		void lost.then((reason) => {
			/* a promise from a renderer that has since been replaced is
			   about a device nobody is drawing with any more */
			if (renderer === mine) void onDeviceLost(reason);
		});
	};

	const onContextRestored = () => {
		contextAlive = true;
		/* the backing store is reset by the restore, so the size has to
		   be reapplied before the next frame draws into it */
		applySize();
		options.onContextChange?.('restored');
		announce('Сцена восстановлена.');
	};

	const onMotionPreferenceChange = (e: MediaQueryListEvent) => {
		/* an explicit option is a decision, not a default: it is not
		   overridden by the system changing its mind */
		if (options.reducedMotion !== undefined) return;
		reducedMotion = e.matches;
		runtime.setAccessibility({reducedMotion});
		world?.setAccessibility({reducedMotion});
		applySize();
	};

	const observer = typeof ResizeObserver === 'function'
		? new ResizeObserver((entries) => {
				const box = entries[0]?.contentRect;
				if (!box) return;
				if (box.width === cssWidth && box.height === cssHeight) return;
				cssWidth = box.width;
				cssHeight = box.height;
				applySize();
			})
		: undefined;

	/* no ResizeObserver (older engines) — fall back to window resize,
	   which is coarser but is not nothing */
	const onWindowResize = () => {
		const rect = canvas.getBoundingClientRect();
		cssWidth = rect.width;
		cssHeight = rect.height;
		applySize();
	};

	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointercancel', onPointerUp);
	canvas.addEventListener('wheel', onWheel, {passive: false});
	canvas.addEventListener('touchstart', onTouchStart, {passive: true});
	canvas.addEventListener('touchmove', onTouchMove, {passive: true});
	canvas.addEventListener('touchend', onTouchEnd, {passive: true});
	canvas.addEventListener('keydown', onKeyDown);
	watchForDeviceLoss();
	canvas.addEventListener('webglcontextlost', onContextLost);
	canvas.addEventListener('webglcontextrestored', onContextRestored);
	if (observer) observer.observe(canvas);
	else window.addEventListener('resize', onWindowResize);
	motionQuery?.addEventListener?.('change', onMotionPreferenceChange);
	const wantsDeviceMotion = options.deviceMotion !== false && typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
	if (wantsDeviceMotion) window.addEventListener('deviceorientation', onDeviceMotion);

	onWindowResize();

	return {
		canvas,
		runtime,
		renderer,
		/**
		 * What this session is actually driving, exposed so a gate can
		 * check that it IS driving it.
		 *
		 * Both of these were built and verified before anything called
		 * them, and no gate could see the gap because every gate drove the
		 * modules directly. These two getters are what verify:5d-wiring
		 * reads: the tier a real session resolved, and the Core a real
		 * frame loop stepped.
		 */
		get renderTier() {
			return {...renderTier, quality: renderQuality};
		},
		get core() {
			return {
				state: core.state, previous: core.previous, unresolved: core.unresolved,
				field: {...core.field, offset: {...core.field.offset}},
			};
		},
		coreCause,
		audio: options.audio,
		get quality() {
			return quality;
		},
		get contextAlive() {
			return contextAlive;
		},
		get performance() {
			const sorted = [...frameTimes].sort((a, b) => a - b);
			const stats = renderer.frameStats;
			return {
				frameMs: lastFrameMs,
				p95Ms: sorted.length > 0 ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0,
				visible: stats.visible,
				inFrustum: stats.inFrustum,
				drawCalls: stats.drawCalls,
				triangles: stats.triangles,
				lodReduced: stats.lodReduced,
				budgetCut: stats.budgetCut,
				residentTextures: stats.residentTextures,
				residentLabels: stats.residentLabels,
				quality: quality.quality,
			};
		},
		setParticles: (on) => {
			particles = on;
		},
		setVolumetric: (on) => {
			volumetric = on;
		},
		world,
		ingest: (entries) => {
			if (!world) throw new Error('BERX 5D: this host has no world to ingest into');
			world.ingest(entries);
			for (const entry of entries) {
				mediaByObject.set(entry.object.id, entry.media ?? []);
				renderer.setObjectMedia(entry.object.id, entry.media ?? []);
			}
		},
		addObject: (object, media) => {
			runtime.registerObject(object);
			mediaByObject.set(object.id, media ?? []);
			renderer.setObjectMedia(object.id, media ?? []);
		},
		removeObject: (id) => {
			runtime.removeObject(id);
			/* an object that has left the world must stop holding a
			   texture open, or a long session leaks one per thing seen */
			mediaByObject.delete(id);
			renderer.forgetObjectMedia(id);
		},
		focus: (id) => {
			const ok = world ? world.focus(id) : runtime.focus(id);
			if (ok) announceFocus();
			return ok;
		},
		enterWorld: (id, sourceRoute, destination) => runtime.enterWorld({id, sourceRoute, enteredAt: Date.now()}, destination),
		back: () => {
			const ok = world ? world.back() : runtime.back();
			if (ok) announceFocus();
			return ok;
		},
		start: () => {
			if (running) return;
			running = true;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		},
		stop: () => {
			running = false;
			cancelAnimationFrame(raf);
		},
		destroy: () => {
			running = false;
			cancelAnimationFrame(raf);
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerUp);
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('touchstart', onTouchStart);
			canvas.removeEventListener('touchmove', onTouchMove);
			canvas.removeEventListener('touchend', onTouchEnd);
			canvas.removeEventListener('keydown', onKeyDown);
			canvas.removeEventListener('webglcontextlost', onContextLost);
			canvas.removeEventListener('webglcontextrestored', onContextRestored);
			observer?.disconnect();
			if (!observer) window.removeEventListener('resize', onWindowResize);
			motionQuery?.removeEventListener?.('change', onMotionPreferenceChange);
			if (wantsDeviceMotion) window.removeEventListener('deviceorientation', onDeviceMotion);
			renderer.dispose();
			live.remove();
			if (owned) canvas.remove();
		},
	};
}
