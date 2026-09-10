/**
 * WebXR: the session, which is the half that was missing.
 *
 * `xrPose.ts` converts a runtime's head pose into BERX cameras, and it
 * is real and verified — and it is not WebXR. Nothing in BERX had ever
 * called `navigator.xr`, so no session was ever requested, no reference
 * space established, no XRFrame read, and the stereo path in the
 * renderer had no way to be reached. A pose converter with nothing to
 * convert is a library, not a capability.
 *
 * This is the layer that makes it one. It is deliberately thin: every
 * decision about what the world IS stays in @berx/spatial, and all this
 * does is ask the browser for a session, drive its frame loop, hand the
 * views to the world, and give the browser its canvas back when the
 * person leaves.
 *
 * THREE THINGS IT WILL NOT DO.
 *
 * It never starts a session on its own. `requestSession` must be called
 * from a real user gesture — the specification requires it, and a world
 * that put someone in a headset because a page loaded would deserve the
 * rejection it gets.
 *
 * It never claims support it has not been given. `berxXrAvailability`
 * asks the browser and reports what the browser said, including the
 * reason it said no. A device with no XR gets an honest unavailable
 * state, not a simulated one.
 *
 * It never fabricates a pose. A frame with no viewer pose, or one the
 * runtime does not trust, leaves the camera exactly where it was —
 * `berxCameraFromPose` already refuses those, and this refuses to work
 * around it.
 */
import {berxPoseIpd, type BerxXrPose, type BerxXrViews} from '@berx/spatial';
import type {Berx5DWorldApp} from '@berx/spatial';
import type {BerxWebRendererBackend} from './webRenderer';

/**
 * The parts of the WebXR Device API this file uses, typed here.
 *
 * The project ships no @types/webxr and adding a dependency to describe
 * an interface we touch in one file is not worth it — but calling a
 * browser API through `any` is worse, because then nothing checks that
 * the shape being used is the shape the specification defines. These
 * mirror https://www.w3.org/TR/webxr/ exactly, and nothing beyond what
 * is read below is declared: an interface that claims more than it uses
 * is a claim nobody verified.
 */
interface XRRigidTransformLike {
	readonly position: {x: number; y: number; z: number};
	readonly orientation: {x: number; y: number; z: number; w: number};
}
interface XRViewLike {
	readonly transform: XRRigidTransformLike;
	readonly projectionMatrix: Float32Array | number[];
}
interface XRViewerPoseLike {
	readonly views: readonly XRViewLike[];
	readonly emulatedPosition: boolean;
}
interface XRFrameLike {
	getViewerPose(space: XRReferenceSpaceLike): XRViewerPoseLike | undefined | null;
}
type XRReferenceSpaceLike = object;
type XRReferenceSpaceTypeLike = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
interface XRWebGLLayerLike {
	readonly framebuffer: WebGLFramebuffer | null;
	readonly framebufferWidth: number;
	readonly framebufferHeight: number;
}
interface XRSessionLike {
	requestReferenceSpace(type: XRReferenceSpaceTypeLike): Promise<XRReferenceSpaceLike>;
	updateRenderState(state: {baseLayer: XRWebGLLayerLike}): Promise<void> | void;
	requestAnimationFrame(callback: (time: number, frame: XRFrameLike) => void): number;
	addEventListener(type: 'end', listener: () => void, options?: {once?: boolean}): void;
	end(): Promise<void>;
	readonly renderState: {readonly baseLayer?: XRWebGLLayerLike | null};
}
interface XRSystemLike {
	isSessionSupported(mode: string): Promise<boolean>;
	requestSession(mode: string, init?: {optionalFeatures?: string[]}): Promise<XRSessionLike>;
}
type XRWebGLLayerCtor = new (session: XRSessionLike, gl: WebGL2RenderingContext) => XRWebGLLayerLike;

/** The kinds of session BERX knows how to be a world in. */
export type BerxXrMode = 'immersive-vr' | 'immersive-ar';

export interface BerxXrAvailability {
	/** False when this browser exposes no WebXR at all. */
	readonly present: boolean;
	readonly supported: Readonly<Record<BerxXrMode, boolean>>;
	/** Why, in the browser's own terms, when something is not available. */
	readonly reason?: string;
}

/**
 * What this browser will actually grant.
 *
 * `isSessionSupported` is the only honest answer to "can this device do
 * XR" — the presence of `navigator.xr` is not, because a desktop Chrome
 * with no headset exposes the object and supports no mode. Both modes
 * are asked separately, because a phone that does AR does not do VR.
 */
export async function berxXrAvailability(): Promise<BerxXrAvailability> {
	const xr = (navigator as Navigator & {xr?: XRSystemLike}).xr;
	if (!xr) return {present: false, supported: {'immersive-vr': false, 'immersive-ar': false}, reason: 'this browser exposes no navigator.xr'};
	const ask = async (mode: BerxXrMode) => {
		try {
			return await xr.isSessionSupported(mode);
		} catch (error) {
			/* a SecurityError here is a real answer — a cross-origin frame
			   without the xr-spatial-tracking permission policy — and it
			   means no, for a reason worth reporting */
			return error;
		}
	};
	const [vr, ar] = await Promise.all([ask('immersive-vr'), ask('immersive-ar')]);
	const failed = [vr, ar].find((r) => r instanceof Error) as Error | undefined;
	return {
		present: true,
		supported: {'immersive-vr': vr === true, 'immersive-ar': ar === true},
		reason: failed
			? `${failed.name}: ${failed.message}`
			: (vr === true || ar === true ? undefined : 'this device supports no immersive session'),
	};
}

export interface BerxXrSessionOptions {
	world: Berx5DWorldApp;
	renderer: BerxWebRendererBackend;
	/** The canvas the flat world is drawn into. Its context becomes the XR layer's. */
	canvas: HTMLCanvasElement;
	/** 'local-floor' where the device offers it, 'local' otherwise. Never faked. */
	referenceSpace?: XRReferenceSpaceTypeLike;
	/** Told when the session really starts and really ends, with the reason. */
	onState?: (state: 'entering' | 'running' | 'ended', detail?: string) => void;
	/** A frame whose pose the runtime would not give, or would not trust. */
	onPoseLost?: () => void;
}

export interface BerxXrSession {
	readonly mode: BerxXrMode;
	readonly session: XRSessionLike;
	/** The interpupillary distance the HEADSET reported, not a constant. */
	readonly ipd?: number;
	/** How many frames carried a usable pose, and how many did not. */
	readonly frames: {posed: number; unposed: number};
	end(): Promise<void>;
}

/**
 * Enter XR. Call this from a real user gesture and nowhere else.
 *
 * Rejects rather than degrading: a browser that refuses the session, a
 * device that does not support the mode, a canvas whose context cannot
 * back an XR layer — each is a real condition with a real message, and
 * a caller that wanted a flat world can simply not call this.
 */
export async function berxEnterXr(mode: BerxXrMode, options: BerxXrSessionOptions): Promise<BerxXrSession> {
	const xr = (navigator as Navigator & {xr?: XRSystemLike}).xr;
	if (!xr) throw new Error('BERX XR: this browser exposes no navigator.xr');
	if (!(await xr.isSessionSupported(mode))) throw new Error(`BERX XR: this device does not support ${mode}`);
	options.onState?.('entering');

	const session = await xr.requestSession(mode, {
		/* asked for, never assumed: a device without floor tracking gets
		   'local' below rather than a world sunk into the ground */
		optionalFeatures: ['local-floor', 'bounded-floor'],
	});

	/**
	 * The XR layer draws into the SAME context the flat world does.
	 *
	 * Not a second renderer and not a second world — the whole point is
	 * that entering a headset changes where the camera is, not what
	 * exists. `xrCompatible` has to be granted before the layer is made,
	 * and on a machine with two GPUs that can mean the context migrates.
	 */
	const gl = options.canvas.getContext('webgl2') as (WebGL2RenderingContext & {makeXRCompatible(): Promise<void>}) | null;
	if (!gl) {
		await session.end();
		throw new Error('BERX XR: the canvas has no WebGL2 context to make an XR layer from');
	}
	await gl.makeXRCompatible();
	const XRWebGLLayerCtor = (globalThis as {XRWebGLLayer?: XRWebGLLayerCtor}).XRWebGLLayer;
	if (!XRWebGLLayerCtor) {
		await session.end();
		throw new Error('BERX XR: this browser has navigator.xr but no XRWebGLLayer to draw through');
	}
	await session.updateRenderState({baseLayer: new XRWebGLLayerCtor(session, gl)});

	let space: XRReferenceSpaceLike;
	try {
		space = await session.requestReferenceSpace(options.referenceSpace ?? 'local-floor');
	} catch {
		/* no floor: 'local' is the origin at the head's starting point,
		   which is a real space and honestly a different one */
		space = await session.requestReferenceSpace('local');
	}

	const frames = {posed: 0, unposed: 0};
	let ipd: number | undefined;
	let running = true;

	const onFrame = (_time: number, frame: XRFrameLike) => {
		if (!running) return;
		session.requestAnimationFrame(onFrame);
		const pose = frame.getViewerPose(space);
		if (!pose || pose.views.length === 0) {
			/* tracking lost. The camera stays exactly where it was: a
			   world that snapped back to a default pose here is how a
			   headset makes someone ill. */
			frames.unposed++;
			options.onPoseLost?.();
			return;
		}
		const layer = session.renderState.baseLayer;
		if (!layer) return;

		const views: BerxXrViews | undefined = viewsFrom(pose);
		if (!views) {
			frames.unposed++;
			options.onPoseLost?.();
			return;
		}
		const cameras = options.world.setHeadViews(views);
		if (!cameras) {
			/* the runtime gave a pose the shared core would not trust */
			frames.unposed++;
			options.onPoseLost?.();
			return;
		}
		frames.posed++;
		ipd = berxPoseIpd(views) ?? ipd;

		/* The headset's own framebuffer, at the headset's own size. */
		gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
		options.renderer.resize(layer.framebufferWidth, layer.framebufferHeight);
		options.renderer.render(options.world.frame(1 / 90), cameras.right && ipd ? {stereo: {ipd}} : undefined);
	};

	const ended = new Promise<void>((resolve) => {
		session.addEventListener('end', () => {
			running = false;
			/* the browser's own framebuffer back, and the flat world's
			   size with it — a canvas left at the headset's resolution
			   draws the page world at the wrong scale */
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			options.renderer.resize(options.canvas.width, options.canvas.height);
			options.onState?.('ended');
			resolve();
		}, {once: true});
	});

	session.requestAnimationFrame(onFrame);
	options.onState?.('running');

	return {
		mode,
		session,
		get ipd() {
			return ipd;
		},
		get frames() {
			return {...frames};
		},
		end: async () => {
			if (!running) return ended;
			await session.end();
			return ended;
		},
	};
}

/**
 * An XRViewerPose's views as BERX poses.
 *
 * The projection matrix carries the runtime's own vertical field of
 * view, and reading it out is the only way to render at the optics the
 * headset actually has: element [5] of a perspective matrix is
 * 1/tan(fovY/2). A view whose matrix says otherwise — an orthographic
 * or degenerate projection — produces no pose rather than a guessed one.
 */
function viewsFrom(pose: XRViewerPoseLike): BerxXrViews | undefined {
	const poses: BerxXrPose[] = [];
	for (const view of pose.views) {
		const t = view.transform;
		const fy = view.projectionMatrix[5];
		if (!Number.isFinite(fy) || fy <= 0) return undefined;
		poses.push({
			position: {x: t.position.x, y: t.position.y, z: t.position.z},
			orientation: {x: t.orientation.x, y: t.orientation.y, z: t.orientation.z, w: t.orientation.w},
			fovDegrees: (2 * Math.atan(1 / fy) * 180) / Math.PI,
			/* WebXR reports emulated positions for devices with rotation
			   only, and a 3-DoF pose is not a 6-DoF one */
			confidence: pose.emulatedPosition ? 0.4 : 1,
		});
	}
	if (poses.length === 0) return undefined;
	return {left: poses[0], right: poses[1]};
}
