/**
 * The only things a platform is allowed to differ in.
 *
 * BERX is one world, not one world per operating system. The world
 * graph, spatial identity, X/Y/Z/T/R, domain state, relationships and
 * spatial semantics live in this package and are shared by web, iOS,
 * Android, desktop, tablet, watch and XR without modification. A
 * platform supplies four things and nothing else:
 *
 *   a renderer  — how the frame reaches the screen
 *   an input    — how a person reaches the world
 *   a display   — the form factor and its real dimensions
 *   capabilities— what the device can actually do
 *
 * Anything a platform wants that is not on this list is a fork of the
 * product, and there is no second product. In particular there is no
 * per-platform screen architecture: a platform that renders a list of
 * cards is not rendering BERX.
 *
 * This module has no DOM, no React Native and no Node in it, and
 * `verify:5d-shared-core` fails the build if that ever stops being
 * true of anything in @berx/spatial.
 */
import type {Berx5DFrame} from './runtime5d';
import type {BerxHit} from './spatialInteraction';

/** Where BERX is being experienced. Changes framing, never architecture. */
export type BerxDisplayForm = 'watch' | 'phone' | 'tablet' | 'desktop' | 'ar' | 'vr';

export interface BerxDisplay {
	form: BerxDisplayForm;
	/** Logical pixels of the surface the world is drawn into. */
	width: number;
	height: number;
	/** Backing-store scale. */
	pixelRatio: number;
	/** Stereo forms render the same world twice from two eyes. */
	stereo?: boolean;
}

/**
 * What the device can really do, as facts rather than intentions.
 *
 * A capability that is false here is one this build does not have. It
 * is never set optimistically: the renderer that answers `shadows:
 * true` is a renderer with a shadow pass in it.
 */
export interface BerxPlatformCapabilities {
	gpu: 'webgl2' | 'webgpu' | 'metal' | 'vulkan' | 'none';
	depthBuffer: boolean;
	physicallyLitMaterials: boolean;
	shadows: boolean;
	postProcessing: boolean;
	/** Real world-space audio, not stereo panning. */
	spatialAudio: boolean;
	/** Head or device pose, for tilt and for XR. */
	poseTracking: boolean;
	/** A keyboard exists and focus can move through the world with it. */
	keyboard: boolean;
	/** A pointer exists — mouse, finger, or a ray from a controller. */
	pointer: boolean;
}

/**
 * A renderer is real only when it consumes the authoritative frame and
 * performs a perspective/depth GPU pass. Drawing rectangles onto a
 * canvas is not an implementation of this interface.
 */
export interface BerxSpatialRendererBackend {
	readonly kind: BerxPlatformCapabilities['gpu'];
	readonly capabilities: Omit<BerxPlatformCapabilities, 'gpu' | 'spatialAudio' | 'poseTracking' | 'keyboard' | 'pointer'> & {perspective: boolean};
	resize(widthPx: number, heightPx: number): void;
	render(frame: Berx5DFrame, options?: {maxObjects?: number; ambientMotion?: boolean}): void;
	/** The object under a point, in backing-store pixels. */
	pick(frame: Berx5DFrame, xPx: number, yPx: number): BerxHit | undefined;
	dispose(): void;
}

/**
 * What a platform reports back to the world. Same events everywhere.
 *
 * Deliberately not `BerxSpatialIntent`, which is the social one — a
 * person invoking an affordance on an object. This is how someone
 * moves: a finger drag, a thumbstick, a head turn and an arrow key all
 * arrive as the same thing, so the world does not know or care which
 * device produced it.
 */
export interface BerxNavigationIntent {
	kind: 'pan' | 'depth' | 'zoom' | 'pose' | 'select' | 'enter' | 'back' | 'step' | 'time';
	/** pan/step: screen-space direction. pose: pitch/roll/yaw. */
	x?: number;
	y?: number;
	z?: number;
	/** depth/zoom: signed amount. time: seconds to move the cursor. */
	amount?: number;
	/** select: a point in backing-store pixels. */
	pointPx?: {x: number; y: number};
	/** pose: 0..1 confidence. */
	intensity?: number;
}
