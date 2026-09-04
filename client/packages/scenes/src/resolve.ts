/**
 * Screen resolution — the single entry point the app uses to turn a
 * route into everything needed to render it.
 *
 * route → family → scene → components → data → states → navigation
 * → motion → a11y → platform
 *
 * All 300 contracts resolve through here. The 29 with real product
 * logic resolve to a bound scene with real API reads; the other 271
 * resolve to a `contract-only` scene that renders an explicit
 * boundary naming its family and what it is waiting on. Neither path
 * invents data.
 */
import {
	planSharedElement,
	resolveScene,
	type BerxDeviceSignals,
	type BerxFamily,
	type BerxPlatform,
	type BerxSceneContract,
	type BerxSceneEnvironment,
	type BerxSceneRuntime,
	type BerxScreenState,
	type BerxSharedElementId,
} from '@berx/spatial';
import {getSceneContract, getSceneContractByPath, getSceneContractByRouteName, getSceneDataBinding} from './registry';
import {resolveComponent, type BerxComponentBinding} from './componentMap';
import type {BerxSceneDataBinding} from './dataBindings';

/* ------------------------------------------------------------------ */
/* Navigation shell                                                    */
/* ------------------------------------------------------------------ */

export type BerxNavShell = 'bottom-tabs' | 'rail' | 'sidebar' | 'compact' | 'spatial-anchors';

/**
 * From 06_PLATFORM/platform_matrix.json. Width matters as much as
 * platform: a phone-width browser window gets bottom tabs, the same
 * browser maximised gets a sidebar.
 */
export function resolveNavShell(platform: BerxPlatform, viewportWidth: number): BerxNavShell {
	if (platform === 'watch') return 'compact';
	if (platform === 'arvr') return 'spatial-anchors';
	if (platform === 'ios' || platform === 'android') return 'bottom-tabs';
	if (viewportWidth >= 1280) return 'sidebar';
	if (viewportWidth >= 840) return 'rail';
	return 'bottom-tabs';
}

export type BerxLayoutMode = 'single-column' | 'two-zone' | 'spatial-grid';

export function resolveLayoutMode(viewportWidth: number): BerxLayoutMode {
	if (viewportWidth >= 1280) return 'spatial-grid';
	if (viewportWidth >= 840) return 'two-zone';
	return 'single-column';
}

/* ------------------------------------------------------------------ */
/* Resolved screen                                                     */
/* ------------------------------------------------------------------ */

export interface BerxResolvedComponent extends BerxComponentBinding {
	/** False for BLOCKED components — the scene omits them and explains. */
	renderable: boolean;
}

export interface BerxScreenAccessibility {
	/** Announced when the screen becomes active. */
	screenLabel: string;
	wcag: string;
	minTouchTargetDp: number;
	minTouchTargetCssPx: number;
	focusVisible: boolean;
	reducedMotionHonoured: boolean;
	/** Set when translucency was dropped for contrast — screen readers are unaffected either way. */
	opaqueSurfaceMode: boolean;
	/** Every gesture-only interaction needs one of these. */
	dragAlternativeRequired: boolean;
}

export interface BerxScreenAnalytics {
	view: string;
	primaryAction: string;
	error: string;
	mutationStart: string;
	mutationSuccess: string;
	mutationError: string;
	/** Never carries message bodies, private content or secrets. */
	properties: readonly string[];
}

export interface BerxResolvedScreen {
	contract: BerxSceneContract;
	screenId: string;
	route: BerxSceneContract['route'];
	family: BerxFamily;
	scene: BerxSceneRuntime;
	components: BerxResolvedComponent[];
	blockedComponents: BerxResolvedComponent[];
	data: BerxSceneDataBinding | undefined;
	/**
	 * 'bound'        — real API reads/mutations back this scene.
	 * 'dataless'     — legitimately has no server data (intro, OS permissions).
	 * 'contract-only'— a numbered archive contract with no product logic;
	 *                  renders a real boundary, never invented content.
	 */
	dataMode: 'bound' | 'dataless' | 'contract-only';
	states: readonly BerxScreenState[];
	navShell: BerxNavShell;
	layoutMode: BerxLayoutMode;
	maxContentWidth: number;
	gutter: number;
	sectionGap: number;
	accessibility: BerxScreenAccessibility;
	analytics: BerxScreenAnalytics;
	platform: BerxPlatform;
	/** Shared elements this scene can hand to, or take from, its neighbours. */
	sharedElements: readonly BerxSharedElementId[];
}

export interface BerxResolveInput {
	/** 'BERX-031', '/home-feed' or 'home-feed' — all three resolve. */
	screen: string;
	device: BerxDeviceSignals;
	viewportWidth: number;
	viewportHeight: number;
	colorWorld?: BerxSceneEnvironment['colorWorld'];
	highContrast?: boolean;
}

const ANALYTICS_PROPERTIES = [
	'screenId',
	'route',
	'platform',
	'sessionId',
	'objectId?',
	'source?',
	'latencyMs?',
	'offline?',
] as const;

/**
 * Shared elements a family can legitimately carry. Only roles the
 * family's real screens actually render — an EVENTS scene has no
 * message thread to hand on.
 */
const FAMILY_SHARED_ELEMENTS: Record<BerxFamily, readonly BerxSharedElementId[]> = {
	AUTH: ['primaryAction'],
	HOME: ['avatar', 'heroMedia', 'primaryAction'],
	EXPLORE: ['heroMedia', 'placePin', 'eventPoster', 'avatar'],
	NOW: ['placePin', 'heroMedia'],
	PROFILE: ['avatar', 'profileHeader', 'heroMedia'],
	SOCIAL: ['avatar', 'profileHeader'],
	MESSAGES: ['avatar', 'messageThread'],
	PLACES: ['placePin', 'heroMedia'],
	EVENTS: ['eventPoster', 'heroMedia'],
	EXPERIENCE: ['heroMedia', 'eventPoster'],
	COMMUNITY: ['avatar', 'heroMedia'],
	CREATOR: ['avatar', 'profileHeader', 'heroMedia'],
	BUSINESS: ['heroMedia', 'profileHeader'],
};

export function findContract(screen: string): BerxSceneContract | undefined {
	return (
		getSceneContract(screen) ??
		getSceneContractByPath(screen) ??
		getSceneContractByRouteName(screen)
	);
}

export function resolveScreen(input: BerxResolveInput): BerxResolvedScreen | undefined {
	const contract = findContract(input.screen);
	if (!contract) return undefined;

	const scene = resolveScene(contract, {
		device: input.device,
		viewportWidth: input.viewportWidth,
		viewportHeight: input.viewportHeight,
		colorWorld: input.colorWorld,
		highContrast: input.highContrast,
	});

	const resolved: BerxResolvedComponent[] = contract.components.map((name) => {
		const binding = resolveComponent(name);
		return {...binding, renderable: binding.resolution !== 'BLOCKED'};
	});

	const binding = getSceneDataBinding(contract.screenId);
	const dataMode: BerxResolvedScreen['dataMode'] = !binding
		? 'contract-only'
		: binding.dataless && binding.reads.length === 0 && binding.mutations.length === 0
			? 'dataless'
			: 'bound';

	const opaqueSurfaceMode =
		input.highContrast === true || scene.layers[scene.focalDepth].surface.opaqueFallback;

	return {
		contract,
		screenId: contract.screenId,
		route: contract.route,
		family: contract.family,
		scene,
		components: resolved.filter((c) => c.renderable),
		blockedComponents: resolved.filter((c) => !c.renderable),
		data: binding,
		dataMode,
		/**
		 * A scene with no data source cannot have a meaningful loading
		 * or empty state, so it does not claim one. Every other scene
		 * carries the full v9 state set.
		 */
		states: dataMode === 'dataless' ? ['default', 'error', 'disabled'] : contract.states,
		navShell: resolveNavShell(input.device.platform, input.viewportWidth),
		layoutMode: resolveLayoutMode(input.viewportWidth),
		maxContentWidth: contract.layout.maxContentWidth,
		gutter: contract.layout.gutter,
		sectionGap: contract.layout.sectionGap,
		accessibility: {
			screenLabel: contract.title,
			wcag: contract.accessibility.wcag,
			minTouchTargetDp: 44,
			minTouchTargetCssPx: 24,
			focusVisible: contract.accessibility.focusVisible,
			reducedMotionHonoured: scene.reducedMotion,
			opaqueSurfaceMode,
			dragAlternativeRequired: contract.interaction.gestures.includes('swipe'),
		},
		analytics: {
			view: contract.analytics.view,
			primaryAction: contract.analytics.primaryAction,
			error: contract.analytics.error,
			mutationStart: `${contract.screenId}.mutation_start`,
			mutationSuccess: `${contract.screenId}.mutation_success`,
			mutationError: `${contract.screenId}.mutation_error`,
			properties: ANALYTICS_PROPERTIES,
		},
		platform: input.device.platform,
		sharedElements: FAMILY_SHARED_ELEMENTS[contract.family],
	};
}

/**
 * Transition plan between two resolved screens. Elements shared by
 * both families travel as one object; everything else uses the
 * destination's enter motion. Under reduced motion the shared
 * elements stop travelling but keep their identity, so focus and
 * screen-reader position still follow the same object.
 */
export interface BerxTransitionPlan {
	from: string;
	to: string;
	shared: ReturnType<typeof planSharedElement>[];
	enterMs: number;
	exitMs: number;
	reducedMotion: boolean;
}

export function planTransition(
	from: BerxResolvedScreen,
	to: BerxResolvedScreen,
	objectId: string | number = 'scene',
): BerxTransitionPlan {
	const shared = from.sharedElements.filter((id) => to.sharedElements.includes(id));
	return {
		from: from.screenId,
		to: to.screenId,
		shared: shared.map((id) => planSharedElement(id, objectId, to.scene.reducedMotion)),
		enterMs: to.scene.motion.enter.durationMs,
		exitMs: from.scene.motion.exit.durationMs,
		reducedMotion: to.scene.reducedMotion,
	};
}
