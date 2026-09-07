/**
 * Light in the world, as light rather than as a gradient.
 *
 * The existing lighting module resolves CSS for the DOM layer's
 * planes. This is the other thing entirely: real lights with real
 * positions and real colours that a GPU integrates against a surface's
 * roughness and metalness. Nothing here is a shadow spec or a
 * gradient stop.
 *
 * What is here is what is implemented: ambient, one directional key,
 * point lights that a region can place, and — as of this commit — a
 * real environment. The key casts (its camera is fitted in shadowMap.ts
 * and its depth is read by every shader source) and the room is now
 * image-based lighting without an image: an ANALYTIC environment, in
 * lighting/berxEnvironment.ts, evaluated identically in TypeScript,
 * WGSL, GLSL and Rust.
 *
 * This paragraph used to promise that "when one is genuinely written,
 * its light gains a field here and the capability flips — not before".
 * `environment` below is that field. There is still no
 * ambient-occlusion pass, so that one does not appear.
 */
import {parseColor} from './color';
import type {BerxVec3} from './world';
import {berxEnvironment, type BerxEnvironment} from './lighting/berxEnvironment';

export type BerxShaderRgb3 = [number, number, number];

const rgb = (hex: string): BerxShaderRgb3 => {
	const c = parseColor(hex);
	if (!c) throw new Error(`BERX 5D lighting: ${hex} is not a colour`);
	return [c.r / 255, c.g / 255, c.b / 255];
};

export interface BerxDirectionalLight {
	/** Direction the light travels *from*, normalised by the resolver. */
	direction: BerxVec3;
	colour: BerxShaderRgb3;
	intensity: number;
}

export interface BerxPointLight {
	position: BerxVec3;
	colour: BerxShaderRgb3;
	intensity: number;
	/** Metres at which this light has fallen to roughly nothing. */
	range: number;
}

export interface BerxWorldLighting {
	/** Uniform fill. Never zero: a world with no fill is a world of silhouettes. */
	ambient: BerxShaderRgb3;
	ambientIntensity: number;
	key: BerxDirectionalLight;
	/**
	 * The room itself, as a function of direction rather than one colour.
	 *
	 * `ambient` above is kept because it is still what a surface receives
	 * when a backend has no environment — and because the environment is
	 * built to agree with it at the horizon, so turning the room off
	 * dims a scene rather than changing its colour.
	 */
	environment: BerxEnvironment;
	/** At most this many reach the shader; the rest are culled by distance. */
	points: BerxPointLight[];
}

/** How many point lights the forward pass carries. A real, enforced limit. */
export const BERX_MAX_POINT_LIGHTS = 4;

const normalise = (v: BerxVec3): BerxVec3 => {
	const l = Math.hypot(v.x, v.y, v.z) || 1;
	return {x: v.x / l, y: v.y / l, z: v.z / l};
};

/**
 * The world's standing light.
 *
 * One cool key from high and to the side, and a fill that is the
 * ground colour rather than grey — so unlit faces read as being in the
 * BERX room instead of in an empty renderer.
 */
export function berxWorldLighting(): BerxWorldLighting {
	/* One vector, used twice on purpose: the sun in the environment is a
	   reflection OF the key light, so if the two could drift apart a
	   glass surface would show a highlight where no light is. */
	const keyDirection = normalise({x: 0.45, y: 0.72, z: 0.9});
	return {
		/* #15191E: the room, bounced */
		ambient: rgb('#15191E'),
		ambientIntensity: 1.35,
		key: {
			direction: keyDirection,
			/* #F2F0EB: daylight-neutral pearl, not white */
			colour: rgb('#F2F0EB'),
			intensity: 1.0,
		},
		environment: berxEnvironment(keyDirection),
		points: [],
	};
}

/**
 * The lights that actually matter to a point in space.
 *
 * Nearest first, capped at what the shader carries. Culling by
 * distance rather than by index means a light behind the camera never
 * costs one of the four slots.
 */
export function berxResolvePointLights(lighting: BerxWorldLighting, at: BerxVec3): BerxPointLight[] {
	return lighting.points
		.map((light) => ({
			light,
			d: Math.hypot(light.position.x - at.x, light.position.y - at.y, light.position.z - at.z),
		}))
		.filter(({light, d}) => d <= light.range)
		.sort((a, b) => a.d - b.d)
		.slice(0, BERX_MAX_POINT_LIGHTS)
		.map(({light}) => light);
}

/**
 * A light an entity gives off because it is live.
 *
 * This is the one place BERX Energy becomes an actual light rather
 * than an emissive tint: a place with something happening in it lights
 * the things around it. Returns nothing at zero energy, so a quiet
 * world is quiet.
 */
export function berxEnergyLight(position: BerxVec3, energy: number): BerxPointLight | undefined {
	const e = Math.max(0, Math.min(1, energy));
	if (e <= 0.01) return undefined;
	return {
		position: {...position},
		colour: rgb('#4FD6E8'),
		intensity: e * 1.6,
		range: 4 + e * 6,
	};
}
