/**
 * A head or device pose, as a camera.
 *
 * ARKit, ARCore and OpenXR all report the same thing in the end: where
 * the viewer's head is and which way it is facing, as a position and an
 * orientation quaternion, per eye on a headset. What none of them
 * report is a BERX camera — and if each platform converted its own
 * pose its own way, the same head movement would look different on a
 * phone and in a headset, which is exactly the per-platform divergence
 * the shared core exists to prevent.
 *
 * So the conversion lives here, once, and a platform adapter's whole
 * job becomes handing over the pose its runtime gave it.
 *
 * Nothing here fabricates a pose. There is no default head position and
 * no smoothing of a missing signal: a platform with no tracking has no
 * pose, and the caller keeps the camera it already had.
 */
import type {BerxSpatialCameraState} from './spatialCamera';
import type {BerxVec3} from './world';

/** A unit quaternion, in the order every XR runtime reports it. */
export interface BerxQuaternion {
	x: number;
	y: number;
	z: number;
	w: number;
}

/**
 * One eye's pose, as an XR runtime gives it.
 *
 * `fovDegrees` is the vertical field of view the runtime asks for — a
 * headset's optics decide it, not BERX, and rendering at a different
 * one is what makes a world feel the wrong size through a lens.
 */
export interface BerxXrPose {
	position: BerxVec3;
	orientation: BerxQuaternion;
	fovDegrees: number;
	/** How much the runtime trusts this pose, 0..1. Below `minConfidence` it is not used. */
	confidence?: number;
}

/** Both eyes of a headset, or the single view of a handheld AR session. */
export interface BerxXrViews {
	left: BerxXrPose;
	right?: BerxXrPose;
}

/**
 * Rotate a vector by a quaternion.
 *
 * The standard v + 2q_v × (q_v × v + wv), which is the form that needs
 * no matrix and no normalisation of anything but the quaternion itself.
 */
export function berxRotateByQuaternion(v: BerxVec3, q: BerxQuaternion): BerxVec3 {
	const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
	const x = q.x / l;
	const y = q.y / l;
	const z = q.z / l;
	const w = q.w / l;
	/* t = 2 * (q_v × v) */
	const tx = 2 * (y * v.z - z * v.y);
	const ty = 2 * (z * v.x - x * v.z);
	const tz = 2 * (x * v.y - y * v.x);
	return {
		x: v.x + w * tx + (y * tz - z * ty),
		y: v.y + w * ty + (z * tx - x * tz),
		z: v.z + w * tz + (x * ty - y * tx),
	};
}

/** How far ahead a pose's target is placed. Only the direction matters. */
const LOOK_DISTANCE = 1;

/**
 * The default trust below which a pose is refused.
 *
 * ARKit and ARCore both report tracking that is limited or lost — while
 * a phone is being covered, or in the dark. A world that follows a pose
 * nobody trusts swims; refusing it and holding still is the honest
 * behaviour, and the caller is told so by getting `undefined` back.
 */
export const BERX_MIN_POSE_CONFIDENCE = 0.5;

/**
 * A camera from a pose, or nothing when the pose cannot be trusted.
 *
 * The camera looks along the pose's own -Z, which is what every XR
 * runtime means by forward, and keeps the near and far planes of the
 * camera it is replacing — those are a property of the world's scale,
 * not of the head.
 */
export function berxCameraFromPose(
	pose: BerxXrPose,
	previous: BerxSpatialCameraState,
	minConfidence = BERX_MIN_POSE_CONFIDENCE,
): BerxSpatialCameraState | undefined {
	if (pose.confidence !== undefined && pose.confidence < minConfidence) return undefined;
	if (!Number.isFinite(pose.position.x) || !Number.isFinite(pose.position.y) || !Number.isFinite(pose.position.z)) return undefined;
	const forward = berxRotateByQuaternion({x: 0, y: 0, z: -LOOK_DISTANCE}, pose.orientation);
	return {
		position: {...pose.position},
		target: {
			x: pose.position.x + forward.x,
			y: pose.position.y + forward.y,
			z: pose.position.z + forward.z,
		},
		/* the head's own roll, kept: a tilted head is a tilted world */
		rotation: berxEulerFromQuaternion(pose.orientation),
		fov: pose.fovDegrees > 0 ? pose.fovDegrees : previous.fov,
		near: previous.near,
		far: previous.far,
	};
}

/**
 * Both eyes, from a runtime that reports both.
 *
 * A headset gives two poses that already carry its own interpupillary
 * distance and its own per-eye optics; using them is the difference
 * between a world at the right scale and one rendered from a guess.
 * Where a runtime reports only one view — handheld AR — the second is
 * absent rather than invented, and the caller draws monoscopically.
 */
export function berxStereoCamerasFromPose(
	views: BerxXrViews,
	previous: BerxSpatialCameraState,
	minConfidence = BERX_MIN_POSE_CONFIDENCE,
): {left: BerxSpatialCameraState; right?: BerxSpatialCameraState} | undefined {
	const left = berxCameraFromPose(views.left, previous, minConfidence);
	if (!left) return undefined;
	const right = views.right ? berxCameraFromPose(views.right, previous, minConfidence) : undefined;
	return {left, right};
}

/**
 * The interpupillary distance a pair of eye poses actually describes.
 *
 * Measured from the runtime rather than assumed, so the stereo path can
 * be checked against what the headset says instead of against 63mm.
 */
export function berxPoseIpd(views: BerxXrViews): number | undefined {
	if (!views.right) return undefined;
	return Math.hypot(
		views.right.position.x - views.left.position.x,
		views.right.position.y - views.left.position.y,
		views.right.position.z - views.left.position.z,
	);
}

/** Euler angles from a quaternion, in the XYZ order the camera state uses. */
export function berxEulerFromQuaternion(q: BerxQuaternion): {x: number; y: number; z: number} {
	const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
	const x = q.x / l;
	const y = q.y / l;
	const z = q.z / l;
	const w = q.w / l;
	/* clamped, because a head looking straight up is exactly ±1 and
	   asin of 1.0000001 is NaN — which would send the world nowhere */
	const sinPitch = Math.max(-1, Math.min(1, 2 * (w * x - y * z)));
	return {
		x: Math.asin(sinPitch),
		y: Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y)),
		z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z)),
	};
}
