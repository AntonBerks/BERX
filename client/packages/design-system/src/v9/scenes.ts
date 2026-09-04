/**
 * BERX V9 SCENE REGISTRY — 300 individually resolved scenes.
 *
 * This is the step the architecture calls "individual screen
 * contracts": every one of the 300 contracts is resolved into a scene
 * that INHERITS its family's composition and then differs by its own
 * declared values. A family is the base, not the ceiling.
 *
 * WHAT MAKES EACH SCENE ITS OWN (all real inputs, nothing invented):
 *   1. its own component set, from its contract;
 *   2. its own material, mood, light recipe and content depth;
 *   3. its own DEPTH ASSIGNMENT — every component it declares is placed
 *      on a real layer by role (see COMPONENT_DEPTH below), so two
 *      screens in one family that declare different components get
 *      genuinely different depth compositions;
 *   4. its own content priority — the order the eye should travel,
 *      derived from that layer assignment rather than fixed per family;
 *   5. its own route, analytics keys and asset refs;
 *   6. its own domain binding — supplied by the app layer from the REAL
 *      API (see apps/mobile/src/v9/screenBindings.ts). This is where the
 *      largest genuine per-screen difference lives, and it comes from
 *      the repository, never from the archive.
 *
 * The archive is deliberately not embellished here. Where all 300
 * contracts agree on a value (camera, states, a11y, performance), that
 * value is the system's, and screens inherit it rather than each
 * carrying a copy that could drift.
 */
import contractsRaw from './scene_contracts.json';
import {BERX_V9_FAMILIES, type BerxV9Family, type BerxV9FamilyProfile, type BerxV9LightRecipe} from './families';
import {BERX_V9_GEOMETRY, type BerxV9LayerGeometry} from './depth';
import type {BerxV9Depth, BerxV9Material} from './tokens';

/** The contract shape, exactly as the archive ships it. */
export interface BerxV9SceneContract {
	schemaVersion: string;
	screenId: string;
	title: string;
	family: BerxV9Family;
	purpose: string;
	experience: {mood: string; primaryGoal: string; cognitiveLoad: string};
	route: {name: string; params: string[]};
	scene: {
		camera: {perspectivePx: number; fovDeg: number; tiltDeg: number};
		depthProfile: Record<'environment' | 'atmosphere' | 'structure' | 'content' | 'controls' | 'focus', BerxV9Depth>;
		layerOrder: BerxV9Depth[];
		focalPoint: string;
		material: BerxV9Material;
		lightRecipe: BerxV9LightRecipe;
		background: string;
	};
	layout: {mobile: string; tablet: string; desktop: string; safeArea: boolean; maxContentWidth: number; gutter: number; sectionGap: number};
	components: string[];
	states: string[];
	interaction: {primaryAction: string; gestures: string[]; spatial: string[]; dragAlternative: string};
	motion: {enter: string; exit: string; focus: string; ambient: string; reducedMotion: string};
	data: {source: string; serverAuthoritative: boolean; fakeDataAllowed: boolean; cache: string};
	analytics: {view: string; primaryAction: string; error: string};
	accessibility: Record<string, string | boolean>;
	performance: Record<string, string | number | boolean>;
	assetRefs: string[];
	qa: string[];
}

export const BERX_V9_CONTRACTS = contractsRaw as unknown as Record<string, BerxV9SceneContract>;
export const BERX_V9_SCREEN_IDS = Object.keys(BERX_V9_CONTRACTS).sort();

/**
 * Which layer a component belongs on, by its ROLE in the scene.
 *
 * This is the rule that gives each screen its own depth composition:
 * the archive assigns roles to layers (D2 media, D3 glass, D4
 * foreground, D5 energy) and names each screen's components, so placing
 * those components by role is a derivation from two archive facts, not
 * an invention. Anything unlisted falls to D3 — the content plane —
 * which is the safe default because it is the focal plane.
 */
export const COMPONENT_DEPTH: Record<string, BerxV9Depth> = {
	// D1 — environment
	BerxMap: 'D1', BerxNowScene: 'D1', BerxAuroraField: 'D1', BerxStage: 'D1',
	// D2 — media / primary subject
	BerxScrimHero: 'D2', BerxProfileHero: 'D2', BerxPlaceHero: 'D2', BerxEventHero: 'D2',
	BerxBusinessHero: 'D2', BerxMediaCard: 'D2', BerxVideoCard: 'D2', BerxMediaGrid: 'D2',
	BerxMomentGrid: 'D2', BerxMediaViewer: 'D2', BerxStoryTray: 'D2', BerxCallSurface: 'D2',
	BerxMessageBubble: 'D2', BerxChatRow: 'D2',
	// D3 — glass content
	BerxGlassSurface: 'D3', BerxSpatialCard: 'D3', BerxPlaceCard: 'D3', BerxEventCard: 'D3',
	BerxExperienceCard: 'D3', BerxTripCard: 'D3', BerxCollectionCard: 'D3', BerxCommunityCard: 'D3',
	BerxCreatorCard: 'D3', BerxWalletCard: 'D3', BerxRewardCard: 'D3', BerxStatRail: 'D3',
	BerxBusinessMetric: 'D3', BerxPlaceHours: 'D3', BerxPlaceRating: 'D3', BerxTicket: 'D3',
	BerxHorizontalRail: 'D3', BerxNowRail: 'D3', BerxIdentity: 'D3', BerxProfileTabs: 'D3',
	BerxTabs: 'D3', BerxAvatarCluster: 'D3', BerxTimeline: 'D3',
	// D4 — controls / foreground
	BerxPrimaryButton: 'D4', BerxSecondaryButton: 'D4', BerxIconButton: 'D4', BerxBottomNav: 'D4',
	BerxSearchField: 'D4', BerxFilterBar: 'D4', BerxInput: 'D4', BerxComposer: 'D4',
	BerxAvatar: 'D4', BerxMapPin: 'D4', BerxShareSheet: 'D4', BerxReactionPicker: 'D4',
	BerxProgressRing: 'D4', BerxCountdown: 'D4',
	// D5 — energy / live feedback
	BerxNowPulse: 'D5', BerxEnergyHalo: 'D5', BerxTypingIndicator: 'D5', BerxLiveIndicator: 'D5',
};

export interface BerxV9ResolvedLayer {
	depth: BerxV9Depth;
	geometry: BerxV9LayerGeometry;
	/** The components this screen actually puts on this layer. */
	components: string[];
	/** What this layer is for in this screen's family. */
	role: string;
}

export interface BerxV9Scene {
	contract: BerxV9SceneContract;
	family: BerxV9FamilyProfile;
	/** Only the layers this screen actually uses, in entry order. A screen that needs no D5 simply has none — still inside the same architecture. */
	layers: BerxV9ResolvedLayer[];
	/** Reading order for this screen specifically, derived from its own layer assignment. */
	contentPriority: string[];
	/** True when this screen genuinely carries live state (family allows it AND the screen declares an energy component). */
	live: boolean;
}

function roleFor(depth: BerxV9Depth, fam: BerxV9FamilyProfile): string {
	switch (depth) {
		case 'D0': return 'atmosphere';
		case 'D1': return 'environment';
		case 'D2': return fam.composition.d2;
		case 'D3': return fam.composition.d3;
		case 'D4': return fam.composition.d4;
		case 'D5': return 'live energy / focus feedback';
	}
}

const ORDER: BerxV9Depth[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5'];

/** Resolve one screen. Pure and deterministic — the same contract always yields the same scene. */
export function resolveScene(screenId: string): BerxV9Scene | null {
	const contract = BERX_V9_CONTRACTS[screenId];
	if (!contract) return null;
	const family = BERX_V9_FAMILIES[contract.family];

	const byDepth = new Map<BerxV9Depth, string[]>();
	// D0 always exists: the archive's background is "cinematic-environment"
	// on every contract, and an atmosphere layer is what every scene sits in.
	byDepth.set('D0', []);
	for (const c of contract.components) {
		const d = COMPONENT_DEPTH[c] ?? contract.scene.depthProfile.content;
		byDepth.set(d, [...(byDepth.get(d) ?? []), c]);
	}
	// A screen whose family is not live must not keep a persistent D5.
	const live = family.liveD5 && (byDepth.get('D5')?.length ?? 0) > 0;
	if (!family.liveD5) byDepth.delete('D5');

	const layers: BerxV9ResolvedLayer[] = ORDER.filter((d) => byDepth.has(d)).map((d) => ({
		depth: d,
		geometry: BERX_V9_GEOMETRY[d],
		components: byDepth.get(d) ?? [],
		role: roleFor(d, family),
	}));

	// Reading order: the focal plane first (that is what the screen is
	// ABOUT), then its controls, then its supporting context, then the
	// environment. Derived per screen from its own layers.
	const focal = contract.scene.depthProfile.content;
	const priority = [
		...layers.filter((l) => l.depth === focal),
		...layers.filter((l) => l.depth === 'D4' && l.depth !== focal),
		...layers.filter((l) => !['D0', 'D1', 'D4'].includes(l.depth) && l.depth !== focal),
		...layers.filter((l) => ['D0', 'D1'].includes(l.depth)),
	];

	return {contract, family, layers, contentPriority: priority.flatMap((l) => l.components).filter(Boolean), live};
}

/** Every scene, resolved once. */
export function allScenes(): BerxV9Scene[] {
	return BERX_V9_SCREEN_IDS.map((id) => resolveScene(id)).filter((s): s is BerxV9Scene => s !== null);
}

/** Route lookup — the registry the navigation layer binds against. */
export const BERX_V9_ROUTES: Record<string, string> = Object.fromEntries(
	BERX_V9_SCREEN_IDS.map((id) => [BERX_V9_CONTRACTS[id].route.name, id])
);
