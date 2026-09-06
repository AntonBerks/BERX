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
import { Berx5DRuntime, Berx5DWorldApp, cameraBasis, type BerxSpatialObject, type BerxWorldIngest } from '@berx/spatial';
import { BerxThreeRuntimeRenderer } from './threeRuntime';
import { resolveSpatialQuality, type BerxSpatialQualityResult } from './runtimeQuality';

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
}

export interface Berx5DWebHost {
	readonly canvas: HTMLCanvasElement;
	readonly runtime: Berx5DRuntime;
	/** The world application, when this host was given one. */
	readonly world?: Berx5DWorldApp;
	/** Put real entities into the world. Requires a world. */
	ingest(entries: readonly BerxWorldIngest[]): void;
	readonly renderer: BerxThreeRuntimeRenderer;
	readonly quality: BerxSpatialQualityResult;
	/** False while the GPU context is lost; the world state survives. */
	readonly contextAlive: boolean;
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
	const renderer = new BerxThreeRuntimeRenderer(canvas, {textureBudget: options.textureBudget, onMediaError: options.onMediaError});
	const pixelRatioCap = Math.max(1, options.pixelRatioCap ?? 2);

	let quality: BerxSpatialQualityResult = {quality: 'balanced', pixelRatio: 1, maxObjects: 80, ambientMotion: true};
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
		if (object) announce(`${nameOf(object)} в фокусе`);
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
			renderer.render(world ? world.frame(dt) : runtime.frame(dt), {maxObjects: quality.maxObjects, ambientMotion: quality.ambientMotion});
		} else {
			/* the world keeps time even with no GPU to draw it, so a
			   restore resumes where it was rather than snapping */
			if (world) world.frame(dt);
			else runtime.frame(dt);
		}
		raf = requestAnimationFrame(frame);
	};

	/* ---------------- pointer ---------------- */
	const onPointerDown = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		dragging = true;
		lastX = downX = e.clientX;
		lastY = downY = e.clientY;
		canvas.setPointerCapture?.(e.pointerId);
	};
	const onPointerMove = (e: PointerEvent) => {
		if (!dragging) return;
		const dx = e.clientX - lastX, dy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
		runtime.input({panX: -dx * 0.018, panY: dy * 0.018, depthDelta: 0, pinch: 0});
	};
	const onPointerUp = (e: PointerEvent) => {
		if (!dragging) return;
		dragging = false;
		canvas.releasePointerCapture?.(e.pointerId);
		/* a drag is not a tap: a pick after panning would select
		   whatever happened to be under the finger when it lifted */
		if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
		const rect = canvas.getBoundingClientRect();
		const dpr = canvas.width / Math.max(1, rect.width);
		const hit = renderer.pick(world ? world.latestFrame : runtime.latestFrame, (e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
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
		switch (e.key) {
			case 'ArrowRight': handled = step(1, 0); break;
			case 'ArrowLeft': handled = step(-1, 0); break;
			case 'ArrowUp': handled = step(0, 1); break;
			case 'ArrowDown': handled = step(0, -1); break;
			case 'Enter':
			case ' ': {
				const object = runtime.world.getActiveObject();
				if (object) {
					/* travel, not open: the camera moves and the world stays */
					if (world) world.travelTo(object.id);
					else runtime.enterWorld({id: `${object.kind}:${object.id}`, focusObjectId: object.id, enteredAt: Date.now()});
					announce(`${nameOf(object)} — камера перемещается`);
				} else handled = false;
				break;
			}
			case 'Escape':
			case 'Backspace':
				handled = world ? world.back() : runtime.back();
				if (handled) announce('Назад');
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
			announceFocus();
		}
	};

	/* ---------------- lifecycle ---------------- */
	const onContextLost = (e: Event) => {
		/* the default is to make the loss permanent; preventing it is
		   what allows a restore event to arrive at all */
		e.preventDefault();
		contextAlive = false;
		renderer.handleContextLost();
		options.onContextChange?.('lost');
		announce('Графика прервалась. BERX восстановит сцену.');
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
		world,
		ingest: (entries) => {
			if (!world) throw new Error('BERX 5D: this host has no world to ingest into');
			world.ingest(entries);
			for (const entry of entries) renderer.setObjectMedia(entry.object.id, entry.media ?? []);
		},
		addObject: (object, media) => {
			runtime.registerObject(object);
			renderer.setObjectMedia(object.id, media ?? []);
		},
		removeObject: (id) => {
			runtime.removeObject(id);
			/* an object that has left the world must stop holding a
			   texture open, or a long session leaks one per thing seen */
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
