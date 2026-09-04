/**
 * Resolves a depth layer whether or not there is a scene above.
 *
 * Most spatial components live inside a <BerxSpatialScene> and take
 * their material, lighting and depth from it. A few genuinely sit
 * outside one — the app shell's tab bar spans every scene rather than
 * belonging to any single one — and those still need a real material
 * rather than a hand-picked colour.
 *
 * Outside a scene the layer is resolved from the same tokens at
 * documented defaults: no camera, no device budget, but the material
 * system still decides how the surface looks. That is a fallback, not
 * a second design.
 */
import {useMemo} from 'react';
import {
	BERX_DEPTH_ROLE,
	BERX_DEPTH_TOKENS,
	BERX_V9_COLOR,
	depthLightIntensity,
	ensureReadableSurface,
	resolveLighting,
	type BerxDepthKey,
	type BerxLightRecipeName,
} from '@berx/spatial';
import {useBerxSceneOptional} from './BerxSpatialScene';

export interface BerxResolvedLayer {
	depth: BerxDepthKey;
	role: string;
	surface: ReturnType<typeof ensureReadableSurface>;
	lighting: ReturnType<typeof resolveLighting>;
	accent: string;
	/** False when resolved from defaults because no scene was present. */
	fromScene: boolean;
}

const FALLBACK_MATERIAL: Record<BerxDepthKey, Parameters<typeof ensureReadableSurface>[0]['material']> = {
	D0: 'Carbon',
	D1: 'SoftLight',
	D2: 'ClearGlass',
	D3: 'ClearGlass',
	D4: 'LiquidGlass',
	D5: 'NeonEnergy',
};

export function useBerxLayer(depth: BerxDepthKey, recipe: BerxLightRecipeName = 'card'): BerxResolvedLayer {
	const scene = useBerxSceneOptional();

	return useMemo(() => {
		if (scene) {
			const layer = scene.scene.layers[depth];
			return {
				depth,
				role: layer.role,
				surface: layer.surface,
				lighting: layer.lighting,
				accent: scene.scene.accent,
				fromScene: true,
			};
		}
		const token = BERX_DEPTH_TOKENS[depth];
		return {
			depth,
			role: BERX_DEPTH_ROLE[depth],
			surface: ensureReadableSurface({
				material: FALLBACK_MATERIAL[depth],
				accent: BERX_V9_COLOR.accent,
				/* React Native has no backdrop filter; the resolver substitutes an opaque surface */
				blurBudgetAvailable: false,
				elevation: token.z / 5,
			}),
			lighting: resolveLighting({
				recipe,
				depthZ: token.z,
				accent: BERX_V9_COLOR.accent,
				intensity: depthLightIntensity(depth),
			}),
			accent: BERX_V9_COLOR.accent,
			fromScene: false,
		};
	}, [scene, depth, recipe]);
}
