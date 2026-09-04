/**
 * Camera resolver.
 *
 * A BERX scene has one camera: a perspective origin, a field of view
 * and a tilt ceiling. Everything spatial — how far apart the depth
 * layers sit, how much a layer shifts under parallax, how far a card
 * may tilt — is derived from it here, so a scene cannot half-apply
 * perspective to some layers and not others.
 */
import {BERX_MAX_TILT_DEG} from './tokens';
import {clamp, round} from './color';

export interface BerxCameraContract {
	perspectivePx: number;
	fovDeg: number;
	tiltDeg: number;
}

export interface BerxCameraInput {
	contract: BerxCameraContract;
	/** Viewport in CSS px / dp. Used to place the perspective origin. */
	viewportWidth: number;
	viewportHeight: number;
	reducedMotion?: boolean;
	/** Low-tier devices flatten the scene rather than drop it. */
	allow3D?: boolean;
}

export interface BerxCameraRuntime {
	perspectivePx: number;
	fovDeg: number;
	/** CSS `perspective-origin` / RN transform origin, in px from top-left. */
	originX: number;
	originY: number;
	/** Px of translateZ per depth step. */
	depthUnitPx: number;
	/** Max tilt this scene may apply, after reduced-motion and tier clamping. */
	maxTiltDeg: number;
	/** False when the runtime flattened the scene; layers then use scale/opacity only. */
	perspectiveEnabled: boolean;
}

/**
 * Depth spacing — px of z travel per depth step.
 *
 * A wider field of view makes the same z travel read as a larger
 * on-screen change, so the per-step unit shrinks with the half-angle
 * tangent rather than coming from a table.
 *
 * The constant is chosen so one step is roughly a 4-5% projected size
 * change at the default 1200px perspective. That is enough for the
 * eye to read the order of the planes and small enough that a control
 * one step in front of the content plane does not balloon, or one
 * step behind it shrink below its minimum touch target — a real
 * failure the browser probe caught when the spacing was wider.
 */
export function depthUnitPx(perspectivePx: number, fovDeg: number): number {
	const halfAngle = (clamp(fovDeg, 10, 120) / 2) * (Math.PI / 180);
	const spread = Math.tan(halfAngle);
	return round(clamp((perspectivePx * 0.04) / (0.5 + Math.max(spread, 0.09)), 6, 72), 2);
}

export function resolveCamera(input: BerxCameraInput): BerxCameraRuntime {
	const {contract} = input;
	const perspectiveEnabled = input.allow3D !== false;
	const reduced = input.reducedMotion === true;

	return {
		perspectivePx: contract.perspectivePx,
		fovDeg: contract.fovDeg,
		/**
		 * Origin is viewport-centre horizontally (scene graph schema)
		 * but slightly above centre vertically: content sits in the
		 * upper two thirds on a phone, and a centred origin would tilt
		 * the hero away from the reader.
		 */
		originX: round(input.viewportWidth / 2, 1),
		originY: round(input.viewportHeight * 0.42, 1),
		depthUnitPx: perspectiveEnabled ? depthUnitPx(contract.perspectivePx, contract.fovDeg) : 0,
		maxTiltDeg: reduced || !perspectiveEnabled ? 0 : round(clamp(Math.abs(contract.tiltDeg) || BERX_MAX_TILT_DEG, 0, BERX_MAX_TILT_DEG), 2),
		perspectiveEnabled,
	};
}

/**
 * Perspective projection scale for a layer at `translateZ`.
 *
 * React Native's transform list has perspective, rotate and scale but
 * no translateZ, so depth on mobile is applied as the scale that a
 * real perspective camera would produce for that z: p / (p - z).
 * A layer 150px behind the content plane under a 1200px perspective
 * renders at 0.889 — the same size the web layer reaches by actually
 * translating in z. Both platforms therefore agree on how far away a
 * layer looks, which is what keeps one scene one scene.
 */
export function perspectiveScale(translateZ: number, perspectivePx: number): number {
	if (perspectivePx <= 0) return 1;
	const denominator = perspectivePx - translateZ;
	if (denominator <= 1) return 1;
	return round(clamp(perspectivePx / denominator, 0.5, 1.6), 4);
}

/**
 * Pointer/gyro tilt for a spatial card. Input is a -1..1 offset from
 * the element's centre; output is clamped to the scene's ceiling and
 * is exactly zero under reduced motion, never merely small.
 */
export function tiltFromPointer(
	offsetX: number,
	offsetY: number,
	camera: BerxCameraRuntime,
): {rotateXDeg: number; rotateYDeg: number} {
	if (camera.maxTiltDeg === 0) return {rotateXDeg: 0, rotateYDeg: 0};
	return {
		rotateXDeg: round(clamp(-offsetY, -1, 1) * camera.maxTiltDeg, 3),
		rotateYDeg: round(clamp(offsetX, -1, 1) * camera.maxTiltDeg, 3),
	};
}
