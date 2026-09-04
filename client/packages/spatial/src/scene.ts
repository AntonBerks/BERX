/**
 * Scene composer — a v9 contract plus a real device becomes a
 * concrete, renderable scene.
 *
 * This is the single place where camera, depth, material, lighting,
 * motion and the performance budget meet. Adapters (React Native and
 * web) consume `BerxSceneRuntime` and do nothing but map its numbers
 * onto their platform's style system, which is why the two platforms
 * cannot drift apart in how a BERX scene feels.
 */
import {
	BERX_DEPTH_KEYS,
	BERX_DEPTH_ROLE,
	BERX_DEPTH_TOKENS,
	BERX_COLOR_WORLDS,
	BERX_DEFAULT_COLOR_WORLD,
	BERX_V9_COLOR,
	type BerxColorWorldName,
	type BerxDepthKey,
	type BerxMaterialName,
} from './tokens';
import {ensureReadableSurface, type BerxMaterialSurface} from './materials';
import {depthLightIntensity, resolveLighting, type BerxLightingSpec} from './lighting';
import {resolveCamera, type BerxCameraRuntime} from './camera';
import {resolveMotion, type BerxResolvedMotion} from './motion';
import {
	allocateBlurLayers,
	resolvePerformanceBudget,
	type BerxDeviceSignals,
	type BerxPerformanceBudget,
} from './performance';
import type {BerxSceneContract} from './contract';
import {relativeLuminance, round} from './color';

export interface BerxSceneEnvironment {
	device: BerxDeviceSignals;
	viewportWidth: number;
	viewportHeight: number;
	/** User-chosen color world (BERX-004). Falls back to the brand default. */
	colorWorld?: BerxColorWorldName;
	/** Forces opaque surfaces everywhere — the WCAG contrast fallback. */
	highContrast?: boolean;
}

export interface BerxDepthLayerRuntime {
	depth: BerxDepthKey;
	role: string;
	z: number;
	/** Painting order. Identical to z, named separately because platforms differ. */
	zIndex: number;
	translateZ: number;
	parallaxFactor: number;
	/** False when this layer lost its blur to the budget — it is opaque, not missing. */
	blurred: boolean;
	surface: BerxMaterialSurface;
	lighting: BerxLightingSpec;
	/** D0/D1 are dimmed so they cannot steal contrast from D3. */
	contentOpacity: number;
}

export interface BerxSceneRuntime {
	screenId: string;
	title: string;
	family: BerxSceneContract['family'];
	route: BerxSceneContract['route'];
	mood: BerxSceneContract['experience']['mood'];
	colorWorld: BerxColorWorldName;
	accent: string;
	background: string;
	camera: BerxCameraRuntime;
	layers: Record<BerxDepthKey, BerxDepthLayerRuntime>;
	layerOrder: BerxDepthKey[];
	focalDepth: BerxDepthKey;
	budget: BerxPerformanceBudget;
	motion: {
		enter: BerxResolvedMotion;
		exit: BerxResolvedMotion;
		focus: BerxResolvedMotion;
		ambient: BerxResolvedMotion;
	};
	reducedMotion: boolean;
	/** Every adaptation the runtime made, for the QA/performance reports. */
	adaptations: string[];
}

/**
 * Per-depth material. A scene names one material; the layers below
 * and above the content plane are not that same pane repeated —
 * atmosphere is soft, structure is the scene's material, controls
 * read crisply over anything, focus emits.
 */
function materialForDepth(depth: BerxDepthKey, sceneMaterial: BerxMaterialName): BerxMaterialName {
	switch (depth) {
		case 'D0':
			return 'Carbon';
		case 'D1':
			return 'SoftLight';
		case 'D2':
			return sceneMaterial;
		case 'D3':
			return sceneMaterial === 'DarkMetal' || sceneMaterial === 'Carbon' ? sceneMaterial : 'ClearGlass';
		case 'D4':
			return 'LiquidGlass';
		case 'D5':
			return 'NeonEnergy';
	}
}

export function resolveScene(contract: BerxSceneContract, env: BerxSceneEnvironment): BerxSceneRuntime {
	const budget = resolvePerformanceBudget(env.device);
	const reducedMotion = env.device.prefersReducedMotion === true;
	const colorWorld = env.colorWorld ?? contract.scene.colorWorld ?? BERX_DEFAULT_COLOR_WORLD;
	const accent = BERX_COLOR_WORLDS[colorWorld].accent;
	const adaptations: string[] = [];

	const camera = resolveCamera({
		contract: contract.scene.camera,
		viewportWidth: env.viewportWidth,
		viewportHeight: env.viewportHeight,
		reducedMotion,
		allow3D: budget.allow3D,
	});
	if (!camera.perspectiveEnabled) adaptations.push(`3D flattened (${budget.reason})`);
	if (camera.maxTiltDeg === 0 && budget.allow3D) adaptations.push('tilt disabled (reduced motion)');

	const order = contract.scene.layerOrder.length ? contract.scene.layerOrder : [...BERX_DEPTH_KEYS];
	const blurAllowed = allocateBlurLayers(order, budget);
	if (budget.maxBlurLayers < order.length) {
		adaptations.push(`blur budget ${budget.maxBlurLayers}/${order.length} layers (${budget.tier} tier)`);
	}

	const layers = {} as Record<BerxDepthKey, BerxDepthLayerRuntime>;
	for (const depth of BERX_DEPTH_KEYS) {
		const token = BERX_DEPTH_TOKENS[depth];
		const material = materialForDepth(depth, contract.scene.material);
		const surface = ensureReadableSurface({
			material,
			accent,
			ground: BERX_V9_COLOR.bg,
			blurBudgetAvailable: blurAllowed[depth],
			forceOpaque: env.highContrast === true,
			elevation: token.z / 5,
		});
		if (surface.opaqueFallback && blurAllowed[depth] && env.highContrast !== true && material !== 'Carbon' && material !== 'SoftLight' && material !== 'MediaSurface') {
			adaptations.push(`${depth} fell back to opaque for contrast (${surface.textContrast}:1)`);
		}
		layers[depth] = {
			depth,
			role: BERX_DEPTH_ROLE[depth],
			z: token.z,
			zIndex: token.z,
			translateZ: round(-((5 - token.z) * camera.depthUnitPx), 2),
			parallaxFactor: budget.allowParallax ? token.parallax : 0,
			blurred: blurAllowed[depth] && !surface.opaqueFallback,
			surface,
			lighting: resolveLighting({
				recipe: contract.scene.lightRecipe,
				depthZ: token.z,
				accent,
				intensity: depthLightIntensity(depth),
			}),
			contentOpacity: depth === 'D0' ? 1 : depth === 'D1' ? 0.72 : 1,
		};
	}

	const motionBudget = {allowAmbientMotion: budget.allowAmbientMotion, allow3D: budget.allow3D};
	const motion = {
		enter: resolveMotion({preset: contract.motion.enter, reducedMotion, budget: motionBudget}),
		exit: resolveMotion({preset: contract.motion.exit, reducedMotion, budget: motionBudget}),
		focus: resolveMotion({preset: contract.motion.focus, reducedMotion, budget: motionBudget}),
		ambient: resolveMotion({preset: contract.motion.ambient, reducedMotion, budget: motionBudget}),
	};
	for (const m of Object.values(motion)) {
		if (m.adapted && m.reason) adaptations.push(m.reason);
	}

	return {
		screenId: contract.screenId,
		title: contract.title,
		family: contract.family,
		route: contract.route,
		mood: contract.experience.mood,
		colorWorld,
		accent,
		background: BERX_V9_COLOR.bg,
		camera,
		layers,
		layerOrder: order,
		focalDepth: contract.scene.depthProfile.content,
		budget,
		motion,
		reducedMotion,
		adaptations: [...new Set(adaptations)],
	};
}

/**
 * Scene graph rule 2 as an executable check: the environment and
 * atmosphere layers must not out-shine the content plane.
 *
 * "Stealing contrast" is a question of luminance, not of how legible
 * text would be on each layer — a very dark substrate scores a high
 * text-contrast ratio precisely because it is dark, which is the
 * opposite of stealing attention. What must hold is that D0 and D1
 * stay at or below the content plane's luminance, so the eye lands
 * on D3 first. Measured on the layer's real composited color, with
 * D1's own dimming applied.
 */
export function assertContrastHierarchy(scene: BerxSceneRuntime): string[] {
	const violations: string[] = [];
	const content = scene.layers[scene.focalDepth];
	const contentLuminance = relativeLuminance(content.surface.effectiveColor);
	for (const depth of ['D0', 'D1'] as const) {
		const layer = scene.layers[depth];
		const luminance = relativeLuminance(layer.surface.effectiveColor) * layer.contentOpacity;
		/**
		 * A hair of tolerance: D0 and the content plane can legitimately
		 * resolve to the same surface on an opaque-mode device, and an
		 * exact tie is not a hierarchy failure.
		 */
		if (luminance > contentLuminance + 1e-4) {
			violations.push(
				`${depth} luminance ${round(luminance, 5)} exceeds content ${scene.focalDepth} ${round(contentLuminance, 5)}`,
			);
		}
	}
	return violations;
}
