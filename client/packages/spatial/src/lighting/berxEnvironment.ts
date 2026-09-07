/**
 * BERX ENVIRONMENT — image-based lighting, without an image.
 *
 * BERX has no captured HDR environment map and no licence to ship one,
 * so this is an ANALYTIC environment rather than a fake of a captured
 * one: a closed-form function of direction that four implementations
 * evaluate identically. Nothing here is sampled, prefiltered or baked,
 * which is exactly why it can be the same maths in TypeScript, WGSL,
 * GLSL and Rust — a cubemap could not be.
 *
 * THE ROOM IS THREE THINGS, and they are the three the brief names:
 *
 *   skyGradient   the vertical falloff of the room. #07080A at the
 *                 horizon rising to #15191E at the zenith, so a surface
 *                 facing up is measurably lighter than one facing
 *                 sideways. This is what gives an unlit face a
 *                 direction instead of a flat fill.
 *   sunGlow       a real lobe around the key direction, in the BERX
 *                 accent #4FD6E8. A reflective surface turned toward
 *                 the key picks the accent out of the room, which is
 *                 what makes glass read as glass rather than as tinted
 *                 plastic.
 *   groundBounce  the floor's weak return, #0D1014 scaled well below 1.
 *                 A floor is not a light; it is a dim reflector, and a
 *                 downward-facing surface should read as being over
 *                 something rather than as being switched off.
 *
 * WHY IT REPLACES A CONSTANT. The forward pass used one flat `ambient`
 * colour for every direction, so the underside of an orb and the top of
 * it received exactly the same fill. That is the single largest reason
 * an unphotographed BERX surface read as a shape rather than as an
 * object in a room.
 *
 * DIRECTION CONVENTION, stated because it has already been a bug here:
 * every direction in this file — including `sunDirection` — points
 * TOWARD the thing it names, never away from it. `sunDirection` is the
 * vector from the world toward the key light, the same convention
 * `BerxDirectionalLight.direction` uses and the same one the shaders'
 * `key_dir` uses.
 *
 * PRECISION. The shaders run f32 and this file runs f64, so the gate
 * compares within a tolerance rather than for equality. The FORMULA is
 * identical; the last bit is not, and claiming otherwise would be the
 * kind of "verified" that means nothing.
 */
import {parseColor} from '../color';
import type {BerxVec3} from '../world';
import type {BerxShaderRgb3} from '../worldLighting';

const rgb = (hex: string): BerxShaderRgb3 => {
	const c = parseColor(hex);
	if (!c) throw new Error(`BERX 5D environment: ${hex} is not a colour`);
	return [c.r / 255, c.g / 255, c.b / 255];
};

export interface BerxEnvironment {
	/** Straight up. The lightest part of the room. */
	zenith: BerxShaderRgb3;
	/** Level with the eye, where the room meets the floor. */
	horizon: BerxShaderRgb3;
	/** The floor's own colour, before its return is scaled down. */
	ground: BerxShaderRgb3;
	/** The colour the key light throws into the room. */
	sun: BerxShaderRgb3;
	/** Peak radiance of the glow, at the key direction exactly. */
	sunIntensity: number;
	/** Lobe tightness. Higher is a smaller, harder sun. */
	sunSharpness: number;
	/** How much of the floor comes back up. A reflector, so well below 1. */
	bounce: number;
	/** One multiplier over the whole room, so a scene can be dimmed as a scene. */
	intensity: number;
	/** Toward the key light. See the direction note in this file's header. */
	sunDirection: BerxVec3;
}

/* --- the two shared helpers, written out so every port matches --- */

export const berxEnvClamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * The Hermite smoothstep, spelled out rather than assumed.
 *
 * WGSL and GLSL both have `smoothstep` built in and both define it as
 * this exact polynomial, so the ports call the builtin; TypeScript and
 * Rust use this. Writing it here is what makes that equivalence
 * checkable instead of hoped for.
 */
export const berxEnvSmoothstep01 = (x: number): number => {
	const t = berxEnvClamp01(x);
	return t * t * (3 - 2 * t);
};

/**
 * The BERX room.
 *
 * Every colour is a brand token: bg at the horizon, a lifted surface at
 * the zenith, the accent as the sun. `sunDirection` defaults to the same
 * vector `berxWorldLighting()` gives the key, so the glow sits where the
 * light actually is rather than somewhere chosen for the look of it.
 */
export function berxEnvironment(sunDirection: BerxVec3): BerxEnvironment {
	return {
		zenith: rgb('#15191E'),
		horizon: rgb('#07080A'),
		ground: rgb('#0D1014'),
		sun: rgb('#4FD6E8'),
		/* The sun is the only part of the room brighter than the room. It
		   is deliberately modest: a glow that out-runs the key light stops
		   reading as a reflection of it and starts reading as a second
		   light nobody placed. */
		sunIntensity: 0.55,
		/* ~18° of visible lobe. Tight enough to be a sun rather than a
		   tinted sky, wide enough that a rough surface still finds it. */
		sunSharpness: 32,
		/* A floor returns a little of what falls on it. This is the number
		   that keeps a downward face dim but not black. */
		bounce: 0.35,
		intensity: 1,
		sunDirection,
	};
}

/**
 * Radiance arriving from `dir`. The whole environment, in one function.
 *
 * `dir` must be normalised; the callers all normalise before calling and
 * the shaders do the same, so this does not re-normalise — a hidden
 * normalise here would be a fifth place for the maths to differ.
 */
export function berxEnvironmentRadiance(dir: BerxVec3, env: BerxEnvironment): BerxShaderRgb3 {
	const up = berxEnvClamp01(dir.y);
	const down = berxEnvClamp01(-dir.y);

	/* 1. SKY GRADIENT — horizon to zenith, over the upper hemisphere. */
	const sUp = berxEnvSmoothstep01(up);
	const skyR = env.horizon[0] + (env.zenith[0] - env.horizon[0]) * sUp;
	const skyG = env.horizon[1] + (env.zenith[1] - env.horizon[1]) * sUp;
	const skyB = env.horizon[2] + (env.zenith[2] - env.horizon[2]) * sUp;

	/* 3. GROUND BOUNCE — the floor's return, which is what the lower
	      hemisphere is made of. Computed here so the horizon blend below
	      crosses between two finished colours rather than adding a second
	      helping of the floor to a direction that already sees it. */
	const grR = env.ground[0] * env.bounce;
	const grG = env.ground[1] * env.bounce;
	const grB = env.ground[2] * env.bounce;

	/* The horizon is soft: a hard line between sky and floor is a seam,
	   and a room with a seam in it is a skybox. */
	const sDown = berxEnvSmoothstep01(down);
	const baseR = skyR + (grR - skyR) * sDown;
	const baseG = skyG + (grG - skyG) * sDown;
	const baseB = skyB + (grB - skyB) * sDown;

	/* 2. SUN GLOW — a lobe around the key direction. Both vectors point
	      toward the light, so the dot peaks at 1 when looking straight at
	      it and is clamped at 0 behind. */
	const cosA = dir.x * env.sunDirection.x + dir.y * env.sunDirection.y + dir.z * env.sunDirection.z;
	const glow = Math.pow(cosA > 0 ? cosA : 0, env.sunSharpness) * env.sunIntensity;

	return [
		(baseR + env.sun[0] * glow) * env.intensity,
		(baseG + env.sun[1] * glow) * env.intensity,
		(baseB + env.sun[2] * glow) * env.intensity,
	];
}

/**
 * The environment as the shaders receive it: four vec4s, in the order
 * the uniform block declares them.
 *
 * This exists so the packing is written ONCE. Three backends filling a
 * uniform buffer by hand, from prose, is how a renderer ends up with the
 * ground colour in the sun slot.
 *
 *   0: zenith.rgb,  sunIntensity
 *   1: horizon.rgb, sunSharpness
 *   2: ground.rgb * bounce, intensity
 *   3: sunDirection.xyz (toward the light), unused
 *   4: sun.rgb, unused
 */
export function berxEnvironmentUniform(env: BerxEnvironment): number[] {
	return [
		env.zenith[0], env.zenith[1], env.zenith[2], env.sunIntensity,
		env.horizon[0], env.horizon[1], env.horizon[2], env.sunSharpness,
		env.ground[0] * env.bounce, env.ground[1] * env.bounce, env.ground[2] * env.bounce, env.intensity,
		env.sunDirection.x, env.sunDirection.y, env.sunDirection.z, 0,
		env.sun[0], env.sun[1], env.sun[2], 0,
	];
}

/** How many floats `berxEnvironmentUniform` writes. The backends assert against this. */
export const BERX_ENVIRONMENT_FLOATS = 20;
