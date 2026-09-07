/**
 * BERX volumetric light — the key light made visible in the air.
 *
 * A shadow map tells you where light does NOT land. This tells you
 * where it TRAVELS: the air between the eye and a surface is not empty,
 * a fraction of the light passing through it scatters toward the
 * viewer, and the shafts that fall between occluders are the most
 * legible cue a 5D world has for "this is a place with depth" rather
 * than "these are objects on a background".
 *
 * WHAT IS BEING COMPUTED, precisely. Single-scattering along the view
 * ray, with:
 *
 *   EXTINCTION      Beer–Lambert. Light entering the eye from distance
 *                   t has already been attenuated by exp(−σ·t). Nothing
 *                   here is a linear fade standing in for it.
 *   PHASE           Henyey–Greenstein, the standard analytic phase
 *                   function, with a forward-scattering g. Air is
 *                   forward-scattering, which is why a shaft is bright
 *                   when you look toward the light and faint when you
 *                   look away — a constant phase would make fog that
 *                   glows equally in every direction, which is not fog.
 *   VISIBILITY      The same shadow map the surface pass samples. A
 *                   shaft is exactly the part of the ray the shadow map
 *                   says is lit; without that term this degenerates
 *                   into a uniform haze.
 *
 * NO Math.random. The march is a fixed number of evenly spaced steps
 * with a DETERMINISTIC per-pixel offset (see berxVolumetricJitter), so
 * the same pixel produces the same number on every run and on every
 * backend — which is what lets the CPU twin below predict what the GPU
 * will do, rather than merely resemble it.
 *
 * The dither matters and is worth naming: without an offset, a
 * low-step march puts every step at the same distance for every pixel
 * and the shaft becomes a set of hard concentric bands. The usual fix
 * is a random offset; the fix here is a hash of the pixel coordinate,
 * which breaks the bands identically everywhere.
 */
import type {BerxVec3} from '../world';

/**
 * How many samples along the ray.
 *
 * Thirty-two is where the banding stops being visible on this dither at
 * this density. It is a real cost — thirty-two shadow-map reads per
 * pixel — which is why the pass is optional per frame rather than
 * always on, exactly like the occlusion pass.
 */
export const BERX_VOLUMETRIC_STEPS = 32;

export interface BerxVolumetricParams {
	/** Scattering coefficient σ, per metre. How thick the air is. */
	density: number;
	/**
	 * Henyey–Greenstein asymmetry, −1..1.
	 *
	 * 0 is isotropic. Positive is forward-scattering, which is what air
	 * and haze really do. Kept well below the 0.8+ that produces a
	 * near-singular lobe: that lobe is what blows a shaft out to white
	 * the moment the camera looks near the light, and a clipped white
	 * blob is not a light shaft.
	 */
	phaseG: number;
	/** How far along the ray to march, in metres. */
	maxDistance: number;
	/** Overall multiplier on the in-scattered radiance. */
	intensity: number;
}

/**
 * The air BERX stands in.
 *
 * Deliberately thin. The reference point is that the brightest pixel in
 * a shaft should sit around a quarter of full scale — visible as light
 * in the air, never as a white wash over the world. A volumetric pass
 * that clips to 1.0 has stopped being lighting and become an overlay.
 */
export function berxVolumetricParams(): BerxVolumetricParams {
	return {
		density: 0.035,
		phaseG: 0.45,
		maxDistance: 28,
		intensity: 0.85,
	};
}

/** Packed for a uniform: one vec4, in the order every port reads it. */
export function berxVolumetricUniform(params: BerxVolumetricParams = berxVolumetricParams()): number[] {
	return [params.density, params.phaseG, params.maxDistance, params.intensity];
}

export const BERX_VOLUMETRIC_FLOATS = 4;

/**
 * Henyey–Greenstein, written out so all four ports are the same curve.
 *
 * `cosTheta` is the angle between the view direction and the direction
 * TOWARD the light — the same convention BerxDirectionalLight.direction
 * uses, so nothing has to be negated at a call site.
 */
export function berxPhaseHG(cosTheta: number, g: number): number {
	const g2 = g * g;
	const denom = 1 + g2 - 2 * g * cosTheta;
	/* max() rather than a branch: at g→1 and cosTheta→1 the denominator
	   goes to zero and the phase to infinity, which is the singular lobe
	   that blows a shaft out to white. Clamped here, once, rather than
	   in three shaders that might clamp differently. */
	return (1 - g2) / (4 * Math.PI * Math.pow(Math.max(denom, 1e-4), 1.5));
}

/**
 * The per-pixel march offset, 0..1.
 *
 * FNV-1a over the pixel coordinate, not a noise texture and not a
 * random: a hash is the same number in TypeScript, WGSL, GLSL and Rust
 * without shipping an asset, and it is what makes this pass
 * reproducible enough to have an oracle at all.
 */
export function berxVolumetricJitter(x: number, y: number): number {
	let h = 0x811c9dc5;
	h ^= x & 0xffff;
	h = Math.imul(h, 0x01000193) >>> 0;
	h ^= y & 0xffff;
	h = Math.imul(h, 0x01000193) >>> 0;
	return (h >>> 8) / 0x1000000;
}

/**
 * The in-scattered radiance at one pixel — the reference implementation.
 *
 * The CPU twin of the shader loop, and the ORACLE the gate predicts
 * with: given the same ray and the same shadow map, this produces the
 * number the GPU should have produced.
 *
 * `visible` is a callback rather than a texture so this function does
 * not need to know how any backend stores its shadow map — the gate
 * hands it the same lookup the shader performs.
 *
 * Returns a scalar: the scattering is grey, and the colour is the key
 * light's own, applied by the caller. Keeping them apart means a change
 * of light colour cannot silently change the amount of scattering.
 */
export function berxVolumetricAt(
	eye: BerxVec3,
	direction: BerxVec3,
	/** Distance to the first surface along this ray, or the far plane. */
	surfaceDistance: number,
	/** Toward the key light, normalised. */
	lightDirection: BerxVec3,
	visible: (point: BerxVec3) => number,
	x: number,
	y: number,
	params: BerxVolumetricParams = berxVolumetricParams(),
	steps: number = BERX_VOLUMETRIC_STEPS,
): number {
	/* The march stops at the surface: air behind a wall does not scatter
	   light into the eye, and marching past it is how a volumetric pass
	   ends up glowing through solid objects. */
	const far = Math.min(params.maxDistance, surfaceDistance > 0 ? surfaceDistance : params.maxDistance);
	if (far <= 0) return 0;

	const stepLength = far / steps;
	const cosTheta =
		direction.x * lightDirection.x + direction.y * lightDirection.y + direction.z * lightDirection.z;
	const phase = berxPhaseHG(cosTheta, params.phaseG);
	const offset = berxVolumetricJitter(x, y);

	let inscatter = 0;
	for (let i = 0; i < steps; i++) {
		/* the deterministic dither: the same step pattern everywhere, and
		   a different one per pixel, so the bands break identically */
		const t = (i + offset) * stepLength;
		const p = {
			x: eye.x + direction.x * t,
			y: eye.y + direction.y * t,
			z: eye.z + direction.z * t,
		};
		const lit = visible(p);
		if (lit <= 0) continue;
		/* Beer–Lambert: what is scattered here still has to reach the eye */
		const transmittance = Math.exp(-params.density * t);
		inscatter += lit * phase * params.density * stepLength * transmittance;
	}

	return inscatter * params.intensity;
}
