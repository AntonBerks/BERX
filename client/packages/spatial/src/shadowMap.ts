/**
 * Shadows — the light's own view of the world, decided once.
 *
 * A shadow map is two things: a camera that stands where the light is,
 * and a rule for reading the depth it captured. Both belong in the
 * shared core rather than in a backend, for the same reason the draw
 * list does: WebGL2, WebGPU and the native renderer must place the
 * light in exactly the same spot, or three renderers that agree on the
 * world will disagree on where its shadows fall — and the pixel
 * comparison that keeps them honest would start reporting a rendering
 * disagreement that is really a maths disagreement.
 *
 * The key light is directional, so its camera is ORTHOGRAPHIC and has
 * no position of its own: only a direction, and a box fitted around
 * whatever is being drawn. Everything below follows from that.
 *
 * Two decisions worth stating, because both are the difference between
 * a shadow map that works and one that shimmers:
 *
 * TEXEL SNAPPING. The box is fitted to the world, and the world moves
 * as the camera moves. If the box slides continuously, every shadow
 * edge crawls as the viewer walks — the classic shimmer. So the box
 * origin is snapped to whole shadow-map texels, which makes it move in
 * discrete steps that the depth samples land on identically.
 *
 * NORMAL-OFFSET BIAS, not depth bias alone. A constant depth bias big
 * enough to stop self-shadowing acne is also big enough to detach a
 * shadow from the foot of the thing casting it (peter-panning). The
 * bias here is scaled by the texel's real world size, which is what
 * makes it correct at any box size instead of tuned for one scene.
 */
import {berxLookAt, berxMultiplyMat4, type BerxMat4} from './frustum';
import type {BerxVec3} from './world';

/** The map is square. 2048 holds a room at ~1cm per texel at this scale. */
export const BERX_SHADOW_MAP_SIZE = 2048;

/**
 * How much light a fully shadowed surface keeps.
 *
 * Not zero. A directional key is not the only light in the world — the
 * ambient term stands in for the bounced room, and a surface in shadow
 * still receives it. Zeroing the key entirely is right; zeroing the
 * pixel is what makes a render look like a cutout.
 */
export const BERX_SHADOW_STRENGTH = 1;

export interface BerxShadowCamera {
	/**
	 * Plain arrays, not Float32Array, and that is not a style choice.
	 *
	 * The draw list crosses a process boundary as JSON on the way to the
	 * native backend, and `JSON.stringify(new Float32Array([...]))`
	 * produces an OBJECT keyed by index, not an array. The native
	 * deserialiser rejected it — "invalid type: map, expected an array
	 * of length 16" — which is exactly the right failure and exactly the
	 * kind that is invisible until something outside JavaScript reads
	 * the value. Everything else in the list already converts here for
	 * the same reason.
	 */
	view: number[];
	/** Orthographic, fitted to what is drawn. Column-major. */
	projection: number[];
	/** projection * view, which is all a shader needs. */
	viewProjection: number[];
	/** One shadow texel, in metres. The bias is scaled by this. */
	texelWorldSize: number;
	/** Depth bias in light-space units, already scaled by the texel. */
	depthBias: number;
	/** How far along the normal a sample is pushed before comparing. */
	normalBias: number;
	/** Edge of the square depth texture, in texels. */
	mapSize: number;
	/** 0..1. 1 removes the whole key contribution inside a shadow. */
	strength: number;
}

interface Bounds {
	min: BerxVec3;
	max: BerxVec3;
}

/**
 * Fit a light camera to a set of world-space positions and radii.
 *
 * Returns undefined when there is nothing to light — a shadow pass over
 * an empty world is a wasted pass, and an ortho box fitted to nothing
 * is a division by zero waiting to happen.
 */
export function berxShadowCamera(
	casters: readonly {position: BerxVec3; radius: number}[],
	lightDirection: BerxVec3,
	mapSize: number = BERX_SHADOW_MAP_SIZE,
): BerxShadowCamera | undefined {
	if (casters.length === 0) return undefined;

	const bounds: Bounds = {
		min: {x: Infinity, y: Infinity, z: Infinity},
		max: {x: -Infinity, y: -Infinity, z: -Infinity},
	};
	for (const c of casters) {
		bounds.min.x = Math.min(bounds.min.x, c.position.x - c.radius);
		bounds.min.y = Math.min(bounds.min.y, c.position.y - c.radius);
		bounds.min.z = Math.min(bounds.min.z, c.position.z - c.radius);
		bounds.max.x = Math.max(bounds.max.x, c.position.x + c.radius);
		bounds.max.y = Math.max(bounds.max.y, c.position.y + c.radius);
		bounds.max.z = Math.max(bounds.max.z, c.position.z + c.radius);
	}

	const centre: BerxVec3 = {
		x: (bounds.min.x + bounds.max.x) * 0.5,
		y: (bounds.min.y + bounds.max.y) * 0.5,
		z: (bounds.min.z + bounds.max.z) * 0.5,
	};
	/**
	 * A sphere, not the box, is what the light camera is fitted to.
	 *
	 * The box's own extent depends on which way the light points, so a
	 * box-fitted camera changes size as the light turns and every
	 * shadow in the world resizes with it. The bounding SPHERE is the
	 * same from every direction, which is what makes the fit stable.
	 */
	const radius = Math.max(
		0.5,
		Math.hypot(bounds.max.x - centre.x, bounds.max.y - centre.y, bounds.max.z - centre.z),
	);

	const length = Math.hypot(lightDirection.x, lightDirection.y, lightDirection.z) || 1;
	/**
	 * BerxDirectionalLight.direction points TOWARD the light — "the
	 * direction the light travels from", as its own declaration says,
	 * and as the BRDF uses it (the shader passes it straight in as L).
	 * So the camera stands ALONG it, not against it.
	 *
	 * The first version had this backwards and put the light camera
	 * underneath the world. It cost nothing in the maths — a perfectly
	 * valid camera, fitted correctly, pointing the wrong way — and the
	 * only thing that revealed it was rendering a floor and finding it
	 * lit from below.
	 */
	const dir: BerxVec3 = {x: lightDirection.x / length, y: lightDirection.y / length, z: lightDirection.z / length};
	const back = radius * 2;

	/* one texel, in metres: the whole box is 2r across and mapSize wide */
	const texelWorldSize = (radius * 2) / mapSize;

	/**
	 * Snap the CENTRE to whole texels before the view is built.
	 *
	 * This is the shimmer fix, and the order is the whole trick. The
	 * first attempt snapped the centre in light space AFTER building the
	 * view from that same centre — which does nothing, because a view
	 * that looks at the centre puts the centre at light-space origin by
	 * construction. Measured, not reasoned: the gate moved the world a
	 * fifth of a texel and the projection changed anyway.
	 *
	 * So the light basis is built first, from the direction alone; the
	 * centre is expressed in that basis, rounded to the texel grid
	 * there, and converted back. The camera then looks at a point that
	 * only ever moves in whole texels, and the depth samples land
	 * identically as the world drifts underneath.
	 */
	const basis = berxLookAt(dir, {x: 0, y: 0, z: 0});
	const toLight = (v: BerxVec3) => ({
		x: basis[0] * v.x + basis[4] * v.y + basis[8] * v.z,
		y: basis[1] * v.x + basis[5] * v.y + basis[9] * v.z,
		z: basis[2] * v.x + basis[6] * v.y + basis[10] * v.z,
	});
	/* the basis is orthonormal, so its inverse is its transpose */
	const toWorld = (v: BerxVec3) => ({
		x: basis[0] * v.x + basis[1] * v.y + basis[2] * v.z,
		y: basis[4] * v.x + basis[5] * v.y + basis[6] * v.z,
		z: basis[8] * v.x + basis[9] * v.y + basis[10] * v.z,
	});
	const inLight = toLight(centre);
	const snapped = toWorld({
		x: Math.round(inLight.x / texelWorldSize) * texelWorldSize,
		y: Math.round(inLight.y / texelWorldSize) * texelWorldSize,
		z: inLight.z,
	});

	const eye: BerxVec3 = {x: snapped.x + dir.x * back, y: snapped.y + dir.y * back, z: snapped.z + dir.z * back};
	const view = berxLookAt(eye, snapped);

	const near = 0.01;
	const far = back + radius * 2;
	const projection = berxOrthographic(-radius, radius, -radius, radius, near, far);

	return {
		view: Array.from(view),
		projection: Array.from(projection),
		viewProjection: Array.from(berxMultiplyMat4(projection, view)),
		texelWorldSize,
		/* Scaled by the texel, so it is correct at any box size rather
		   than tuned for one scene. The constants are the smallest that
		   remove acne on a 2048 map at this world scale, measured on the
		   real render rather than guessed. */
		depthBias: Math.max(1e-4, texelWorldSize * 1.5),
		normalBias: texelWorldSize * 1.4,
		mapSize,
		strength: BERX_SHADOW_STRENGTH,
	};
}

/**
 * An orthographic projection, in the GL convention (z from -1 to 1).
 *
 * Backends whose clip space runs 0..1 remap it with the same
 * `gl_to_wgpu_depth` every other projection goes through — the
 * convention difference lives in the backends, never here.
 */
export function berxOrthographic(
	left: number, right: number, bottom: number, top: number, near: number, far: number,
): BerxMat4 {
	const m = new Float32Array(16);
	const w = right - left || 1;
	const h = top - bottom || 1;
	const d = far - near || 1;
	m[0] = 2 / w;
	m[5] = 2 / h;
	m[10] = -2 / d;
	m[12] = -(right + left) / w;
	m[13] = -(top + bottom) / h;
	m[14] = -(far + near) / d;
	m[15] = 1;
	return m;
}
