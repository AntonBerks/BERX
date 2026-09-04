/**
 * Lighting resolver — a light recipe (key / rim / ambient) becomes a
 * concrete set of gradients and a depth shadow.
 *
 * BERX scenes are lit, not decorated: the key light gives a scene its
 * direction, the rim separates a surface from what is behind it, and
 * ambient is the environment's own contribution. A `hero` recipe and
 * a `card` recipe therefore produce measurably different surfaces
 * from the same material.
 */
import {
	BERX_ENVIRONMENT_LIGHT,
	BERX_LIGHT_RECIPES,
	BERX_V9_COLOR,
	type BerxDepthKey,
	type BerxLightRecipeName,
} from './tokens';
import {clamp, rgba, round} from './color';

export interface BerxGradientStop {
	color: string;
	/** 0..1 along the gradient axis. */
	position: number;
}

export interface BerxGradient {
	/** Degrees, CSS convention: 0 = to top, 180 = to bottom. */
	angleDeg: number;
	stops: BerxGradientStop[];
}

export interface BerxShadowSpec {
	color: string;
	radius: number;
	offsetY: number;
	/** Android has no blur radius — RN maps this instead. */
	elevation: number;
}

export interface BerxLightingSpec {
	recipe: BerxLightRecipeName;
	/** Directional light falling across the surface. */
	key: BerxGradient;
	/** Separation light along the surface's leading edge. */
	rimColor: string;
	rimWidth: number;
	/** Uniform environment contribution, applied as a flat wash. */
	ambientColor: string;
	/** Depth shadow — grows with the layer's z, so depth reads as distance. */
	shadow: BerxShadowSpec;
	/** Accent energy present in the scene at this recipe. */
	accentGlow: string;
}

export interface BerxLightingInput {
	recipe: BerxLightRecipeName;
	depthZ: number;
	accent?: string;
	/** Scenes may dim their own lighting when content must dominate. */
	intensity?: number;
}

/**
 * Depth shadow. Distance from the substrate is what a shadow encodes,
 * so both spread and darkness rise with z — a D4 control sits visibly
 * above D2 structure without either changing color.
 */
export function depthShadow(depthZ: number, keyIntensity: number): BerxShadowSpec {
	const z = clamp(depthZ, 0, 5);
	return {
		color: rgba('#000000', round(clamp(0.14 + z * 0.07 * (0.6 + keyIntensity * 0.8), 0, 0.62))),
		radius: Math.round(6 + z * 11),
		offsetY: Math.round(2 + z * 4),
		elevation: Math.round(z * 3),
	};
}

export function resolveLighting(input: BerxLightingInput): BerxLightingSpec {
	const recipe = BERX_LIGHT_RECIPES[input.recipe];
	const accent = input.accent ?? BERX_V9_COLOR.accent;
	const intensity = clamp(input.intensity ?? 1, 0, 1);

	const key = recipe.key * intensity * BERX_ENVIRONMENT_LIGHT.directional;
	const rim = recipe.rim * intensity;
	const ambient = recipe.ambient * BERX_ENVIRONMENT_LIGHT.ambient;

	return {
		recipe: input.recipe,
		key: {
			/**
			 * 165° rather than a flat 180° so the key reads as a light
			 * arriving from upper-left, consistent across every scene —
			 * a scene whose lights disagree stops looking like a space.
			 */
			angleDeg: 165,
			stops: [
				{color: rgba(BERX_V9_COLOR.textPrimary, round(clamp(key * 0.16, 0, 0.14))), position: 0},
				{color: rgba(BERX_V9_COLOR.textPrimary, round(clamp(key * 0.05, 0, 0.05))), position: 0.55},
				{color: 'rgba(255,255,255,0)', position: 1},
			],
		},
		rimColor: rgba(BERX_V9_COLOR.textPrimary, round(clamp(0.05 + rim * 0.32, 0.05, 0.34))),
		rimWidth: rim > 0.3 ? 1.5 : 1,
		ambientColor: rgba(BERX_V9_COLOR.surface, round(clamp(ambient, 0, 0.14))),
		shadow: depthShadow(input.depthZ, recipe.key),
		accentGlow: rgba(accent, round(clamp(BERX_ENVIRONMENT_LIGHT.accent * intensity * rim * 1.6, 0, 0.24))),
	};
}

/**
 * D0/D1 must never steal contrast from D3 (scene graph rule 2), so
 * the environment layers are lit at a fraction of the scene recipe.
 * This returns the multiplier for a given depth rather than letting
 * each screen invent one.
 */
export function depthLightIntensity(depth: BerxDepthKey): number {
	switch (depth) {
		case 'D0':
			return 0.25;
		case 'D1':
			return 0.4;
		case 'D2':
			return 0.75;
		case 'D3':
			return 1;
		case 'D4':
			return 1;
		case 'D5':
			return 1;
	}
}
