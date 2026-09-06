/**
 * What the camera can see, as one piece of maths.
 *
 * This lived inside the WebGL backend as private functions, which meant
 * anything else that needed to know whether an object was visible —
 * a verification gate, a second renderer, a native backend — had to
 * write its own copy and could disagree with the one that actually
 * draws. It is shared core now: one culler, used by the renderer and
 * measured by the gates.
 */
import type {BerxVec3} from './world';

/** A 4x4 column-major matrix, as every GPU API wants it. */
export type BerxMat4 = Float32Array;

/**
 * The six planes of the view frustum, extracted from a view-projection
 * matrix (Gribb/Hartmann) and normalised — so the distance test below
 * is a real distance in world units rather than a scaled one.
 *
 * Returned as 24 floats: six planes of (a, b, c, d).
 */
export function berxFrustumPlanes(viewProjection: BerxMat4): Float32Array {
	const p = new Float32Array(24);
	const m = (r: number, c: number) => viewProjection[c * 4 + r];
	const set = (i: number, a: number, b: number, c: number, d: number) => {
		const l = Math.hypot(a, b, c) || 1;
		p[i * 4] = a / l;
		p[i * 4 + 1] = b / l;
		p[i * 4 + 2] = c / l;
		p[i * 4 + 3] = d / l;
	};
	set(0, m(3, 0) + m(0, 0), m(3, 1) + m(0, 1), m(3, 2) + m(0, 2), m(3, 3) + m(0, 3)); // left
	set(1, m(3, 0) - m(0, 0), m(3, 1) - m(0, 1), m(3, 2) - m(0, 2), m(3, 3) - m(0, 3)); // right
	set(2, m(3, 0) + m(1, 0), m(3, 1) + m(1, 1), m(3, 2) + m(1, 2), m(3, 3) + m(1, 3)); // bottom
	set(3, m(3, 0) - m(1, 0), m(3, 1) - m(1, 1), m(3, 2) - m(1, 2), m(3, 3) - m(1, 3)); // top
	set(4, m(3, 0) + m(2, 0), m(3, 1) + m(2, 1), m(3, 2) + m(2, 2), m(3, 3) + m(2, 3)); // near
	set(5, m(3, 0) - m(2, 0), m(3, 1) - m(2, 1), m(3, 2) - m(2, 2), m(3, 3) - m(2, 3)); // far
	return p;
}

/** True when a bounding sphere is at least partly inside every plane. */
export function berxSphereInFrustum(planes: Float32Array, centre: BerxVec3, radius: number): boolean {
	for (let i = 0; i < 6; i++) {
		if (planes[i * 4] * centre.x + planes[i * 4 + 1] * centre.y + planes[i * 4 + 2] * centre.z + planes[i * 4 + 3] < -radius) {
			return false;
		}
	}
	return true;
}

/** Column-major 4x4 multiply, in the order a view-projection wants. */
export function berxMultiplyMat4(a: BerxMat4, b: BerxMat4): BerxMat4 {
	const o = new Float32Array(16);
	for (let c = 0; c < 4; c++) {
		for (let r = 0; r < 4; r++) {
			let v = 0;
			for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
			o[c * 4 + r] = v;
		}
	}
	return o;
}

/** A perspective projection. One definition, so every backend agrees. */
export function berxPerspective(fovDegrees: number, aspect: number, near: number, far: number): BerxMat4 {
	const q = 1 / Math.tan((fovDegrees * Math.PI) / 360);
	const nf = 1 / (near - far);
	const m = new Float32Array(16);
	m[0] = q / aspect;
	m[5] = q;
	m[10] = (far + near) * nf;
	m[11] = -1;
	m[14] = 2 * far * near * nf;
	return m;
}

/** A look-at view matrix, from a position to a target. */
export function berxLookAt(position: BerxVec3, target: BerxVec3): BerxMat4 {
	const sub = (a: BerxVec3, b: BerxVec3): BerxVec3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
	const norm = (v: BerxVec3): BerxVec3 => {
		const l = Math.hypot(v.x, v.y, v.z) || 1;
		return {x: v.x / l, y: v.y / l, z: v.z / l};
	};
	const cross = (a: BerxVec3, b: BerxVec3): BerxVec3 => ({
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x,
	});
	const z = norm(sub(position, target));
	/* looking straight up or down leaves the world up vector useless */
	const up: BerxVec3 = Math.abs(z.y) > 0.98 ? {x: 1, y: 0, z: 0} : {x: 0, y: 1, z: 0};
	const x = norm(cross(up, z));
	const y = cross(z, x);
	const m = new Float32Array(16);
	m[0] = x.x; m[1] = y.x; m[2] = z.x;
	m[4] = x.y; m[5] = y.y; m[6] = z.y;
	m[8] = x.z; m[9] = y.z; m[10] = z.z;
	m[12] = -x.x * position.x - x.y * position.y - x.z * position.z;
	m[13] = -y.x * position.x - y.y * position.y - y.z * position.z;
	m[14] = -z.x * position.x - z.y * position.y - z.z * position.z;
	m[15] = 1;
	return m;
}
