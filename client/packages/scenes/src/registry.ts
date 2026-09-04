/**
 * The 300 BERX v9 screen contracts, as real, resolvable objects.
 *
 * 300 contracts are not 300 copies of code: each row in
 * contracts.generated.ts carries only what varies, and this module
 * expands it against the invariant defaults into a complete
 * `BerxSceneContract`. That is what makes "300/300 contracts
 * resolve" a fact the runtime can prove rather than a claim in a
 * document.
 */
import {
	BERX_DEPTH_KEYS,
	BERX_SCREEN_STATES,
	type BerxDepthKey,
	type BerxFamily,
	type BerxSceneContract,
} from '@berx/spatial';
import {BERX_V9_SCENE_COUNT, BERX_V9_SCENE_ROWS, type BerxSceneRow} from './contracts.generated';
import {BERX_SCENE_DATA_BINDINGS, type BerxSceneDataBinding} from './dataBindings';

/**
 * Every field the archive holds identically across all 300
 * contracts. Kept here once instead of 300 times; verified against
 * the archive by scripts/verify-v9-contracts.mjs, so a divergence is
 * a failing check rather than an unnoticed drift.
 */
export const BERX_V9_CONTRACT_DEFAULTS = {
	schemaVersion: '9.0' as const,
	experience: {primaryGoal: 'one dominant user goal', cognitiveLoad: 'low-to-medium'},
	routeParams: ['id?'],
	camera: {perspectivePx: 1200, fovDeg: 42, tiltDeg: 0},
	layerOrder: [...BERX_DEPTH_KEYS] as BerxDepthKey[],
	focalPoint: 'primary-content',
	background: 'cinematic-environment',
	layout: {
		mobile: 'single-column',
		tablet: 'two-zone',
		desktop: '12-column spatial grid',
		safeArea: true,
		maxContentWidth: 1280,
		gutter: 16,
		sectionGap: 24,
	},
	states: [...BERX_SCREEN_STATES],
	interaction: {
		primaryAction: 'explicit',
		gestures: ['tap', 'swipe', 'scroll'],
		spatial: ['micro-parallax', 'shared-element-transition'],
		dragAlternative: 'required where dragging exists',
	},
	motion: {
		enter: 'spatialEnter' as const,
		exit: 'exit' as const,
		focus: 'focus' as const,
		ambient: 'ambient' as const,
		reducedMotion: 'crossFade' as const,
	},
	data: {
		source: 'BERX domain/API adapter',
		serverAuthoritative: true,
		fakeDataAllowed: false as const,
		cache: 'stale-while-revalidate where appropriate',
	},
	accessibility: {
		wcag: '2.2 AA target',
		touchTarget: 'preferred 44dp; web minimum per applicable WCAG',
		focusVisible: true,
		reducedMotion: true,
		contrastFallback: 'opaque surface mode',
	},
	performance: {
		fpsTarget: 60,
		blurLayersMobile: '<=3',
		virtualizeLists: true,
		lazyMedia: true,
		avoidContinuousLayoutReads: true,
	},
	qa: ['visual hierarchy', 'spatial continuity', 'state completeness', 'a11y', 'performance', 'offline'],
} as const;

function assetRefs(screenId: string): string[] {
	const n = screenId.replace('BERX-', '');
	return [`ASSET-0${n}-hero`, `ASSET-0${n}-media`];
}

function expand(row: BerxSceneRow): BerxSceneContract {
	const [screenId, title, family, routeName, routePath, mood, material, lightRecipe, contentDepth, components] = row;
	const d = BERX_V9_CONTRACT_DEFAULTS;
	const binding = BERX_SCENE_DATA_BINDINGS[screenId];
	return {
		schemaVersion: d.schemaVersion,
		screenId,
		title,
		family,
		purpose: `Production scene contract for ${title}.`,
		experience: {mood, primaryGoal: d.experience.primaryGoal, cognitiveLoad: d.experience.cognitiveLoad},
		route: {name: routeName, path: routePath, params: [...d.routeParams]},
		scene: {
			camera: {...d.camera},
			depthProfile: {
				environment: 'D0',
				atmosphere: 'D1',
				structure: 'D2',
				content: contentDepth,
				controls: 'D4',
				focus: 'D5',
			},
			layerOrder: [...d.layerOrder],
			focalPoint: d.focalPoint,
			material,
			lightRecipe,
			background: d.background,
		},
		layout: {...d.layout},
		components: [...components],
		states: [...d.states],
		interaction: {
			primaryAction: d.interaction.primaryAction,
			gestures: [...d.interaction.gestures],
			spatial: [...d.interaction.spatial],
			dragAlternative: d.interaction.dragAlternative,
		},
		motion: {...d.motion},
		data: {...d.data, domains: binding ? [...binding.domains] : []},
		analytics: {
			view: `${screenId}.view`,
			primaryAction: `${screenId}.primary_action`,
			error: `${screenId}.error`,
		},
		accessibility: {...d.accessibility},
		performance: {...d.performance},
		assetRefs: assetRefs(screenId),
		qa: [...d.qa],
	};
}

const CONTRACTS: BerxSceneContract[] = BERX_V9_SCENE_ROWS.map(expand);

const BY_ID = new Map<string, BerxSceneContract>(CONTRACTS.map((c) => [c.screenId, c]));
const BY_PATH = new Map<string, BerxSceneContract>(CONTRACTS.map((c) => [c.route.path, c]));
const BY_NAME = new Map<string, BerxSceneContract>(CONTRACTS.map((c) => [c.route.name, c]));

const BY_FAMILY = ((): Record<BerxFamily, BerxSceneContract[]> => {
	const map = {} as Record<BerxFamily, BerxSceneContract[]>;
	for (const c of CONTRACTS) (map[c.family] ??= []).push(c);
	return map;
})();

export const BERX_V9_CONTRACTS: readonly BerxSceneContract[] = CONTRACTS;
export const BERX_V9_CONTRACT_COUNT = BERX_V9_SCENE_COUNT;

export function getSceneContract(screenId: string): BerxSceneContract | undefined {
	return BY_ID.get(screenId);
}

export function getSceneContractByPath(path: string): BerxSceneContract | undefined {
	return BY_PATH.get(path.startsWith('/') ? path : `/${path}`);
}

export function getSceneContractByRouteName(name: string): BerxSceneContract | undefined {
	return BY_NAME.get(name);
}

export function getFamilyContracts(family: BerxFamily): readonly BerxSceneContract[] {
	return BY_FAMILY[family] ?? [];
}

export function getSceneDataBinding(screenId: string): BerxSceneDataBinding | undefined {
	return BERX_SCENE_DATA_BINDINGS[screenId];
}

/** Every distinct component name any of the 300 contracts asks for. */
export const BERX_V9_REQUESTED_COMPONENTS: readonly string[] = [
	...new Set(CONTRACTS.flatMap((c) => c.components)),
].sort();
