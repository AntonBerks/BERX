/**
 * BERX V9 COMPONENT REGISTRY — 118 contract names, mapped to what is
 * really in this repository.
 *
 * The archive's component layer is 118 contracts that share one
 * template: each carries a name, a purpose string, and the SAME shared
 * contract (props `depth`/`material`/`motion`/`reducedMotionSafe`/
 * `testID`/`accessibilityLabel`/`disabled`, seven states, seven
 * platforms, and a "doNot" list). The specification is therefore the
 * CONTRACT, not 118 distinct designs — so this file does two real
 * things and refuses a third:
 *
 *   1. It maps every V9 name to the component that already implements
 *      it here, including where the repository named it differently.
 *      "Переиспользуй существующие компоненты. Не создавай дубли" — so
 *      BerxPrimaryButton resolves to BerxAnimatedButton's primary
 *      variant rather than becoming a second button.
 *   2. It records, honestly, which names have no implementation yet.
 *   3. It does NOT generate 102 stub components to make a count look
 *      complete. A file that renders nothing is not an implementation.
 *
 * `berxV9ComponentCoverage()` computes the numbers the reports quote,
 * so they cannot drift from reality.
 */
import index from './component_index.json';

export type BerxV9ComponentState = 'REAL' | 'ALIAS' | 'MISSING';

export interface BerxV9ComponentEntry {
	/** The archive's name. */
	name: string;
	state: BerxV9ComponentState;
	/** The real module/export that satisfies it. */
	implementation?: string;
	/** How it satisfies the contract, when that needs saying. */
	note?: string;
}

/**
 * Names the repository already implements under a DIFFERENT name. Each
 * one was checked against the real file/exports, not assumed.
 */
const ALIASES: Record<string, {implementation: string; note?: string}> = {
	// Material variants of one real glass component.
	BerxDeepGlass: {implementation: 'BerxGlassView', note: 'material="DeepGlass" — one glass component, six recipes (v9/tokens.ts).'},
	BerxFrostGlass: {implementation: 'BerxGlassView', note: 'material="FrostGlass".'},
	BerxLiquidGlass: {implementation: 'BerxGlassView', note: 'material="LiquidGlass".'},
	// Buttons — variants of one control, not four components.
	BerxPrimaryButton: {implementation: 'BerxAnimatedButton', note: 'variant="primary".'},
	BerxSecondaryButton: {implementation: 'BerxAnimatedButton', note: 'variant="secondary".'},
	BerxGhostButton: {implementation: 'BerxButton', note: 'variant="secondary"/danger — the quiet control.'},
	BerxFloatingAction: {implementation: 'BerxWayfinder', note: 'the raised create orb is part of the wayfinder, by design.'},
	// Navigation / chrome.
	BerxBottomNav: {implementation: 'BerxWayfinder'},
	BerxTopBar: {implementation: 'BerxHeader'},
	BerxSpatialHeader: {implementation: 'BerxGreetingHeader'},
	BerxTabs: {implementation: 'BerxSegmentedTabs'},
	BerxSegmentedControl: {implementation: 'BerxSegmentedTabs'},
	BerxProfileTabs: {implementation: 'BerxSegmentedTabs', note: 'ProfileScreen composes it.'},
	// Content.
	BerxStoryTray: {implementation: 'BerxStoryRail'},
	BerxMomentGrid: {implementation: 'BerxPhotoGrid'},
	BerxMomentViewer: {implementation: 'BerxMediaViewer'},
	BerxMasonry: {implementation: 'BerxMediaGrid'},
	BerxCarousel: {implementation: 'BerxMediaGrid'},
	BerxReel: {implementation: 'BerxVideoCard'},
	BerxReelViewer: {implementation: 'BerxVideoPlayer'},
	BerxHorizontalRail: {implementation: 'BerxStoryRail', note: 'the rail primitive; callers supply the item renderer.'},
	// Cards that live in BerxSpatialCards.
	BerxPlaceCard: {implementation: 'BerxSpatialCards/BerxPlaceCard'},
	BerxEventCard: {implementation: 'BerxSpatialCards/BerxEventCard'},
	BerxAvatarCluster: {implementation: 'BerxAvatarStack'},
	BerxIdentity: {implementation: 'BerxSpatialCards/BerxPersonCard'},
	BerxPill: {implementation: 'BerxSpatialCards/BerxMetaPill'},
	BerxChip: {implementation: 'BerxSpatialCards/BerxMetaPill'},
	BerxTag: {implementation: 'BerxSpatialCards/BerxMetaPill'},
	BerxBadge: {implementation: 'BerxSpatialCards/BerxMetaPill'},
	BerxMetric: {implementation: 'BerxBusinessPrimitives/BerxStatTile'},
	BerxStatRail: {implementation: 'BerxBusinessPrimitives/BerxStatTile', note: 'ProfileScreen composes the rail from these.'},
	BerxBusinessMetric: {implementation: 'BerxBusinessPrimitives/BerxStatTile'},
	// Map.
	BerxMap: {implementation: 'BerxMapSurface'},
	// States.
	BerxSkeleton: {implementation: 'BerxStates/BerxSkeleton'},
	BerxEmptyState: {implementation: 'BerxStates/BerxEmptyState'},
	BerxErrorState: {implementation: 'BerxStates/BerxErrorState'},
	// Spatial system — built for V9 in this repo.
	BerxDepthLayer: {implementation: 'v9/BerxSpatialScene/BerxDepthLayer'},
	BerxParallaxGroup: {implementation: 'v9/BerxSpatialScene/BerxParallaxGroup'},
	BerxSpatialTransition: {implementation: 'BerxSpatialLayer'},
	BerxLiveIndicator: {implementation: 'BerxSpatialCards/BerxLiveDot'},
};

/** Exact-name matches that already exist as their own module or export. */
const REAL = new Set([
	// Built for V9 in this repo (v9/BerxV9Primitives.tsx, v9/BerxV9Live.tsx,
	// v9/BerxBoundaries.tsx) — chosen by how many of the 300 contracts
	// actually demand them, not by which were easiest.
	'BerxProgressRing', 'BerxSearchField', 'BerxFilterBar', 'BerxCountdown', 'BerxMapPin',
	'BerxNowPulse', 'BerxEnergyHalo', 'BerxTypingIndicator', 'BerxMessageBubble', 'BerxChatRow',
	'BerxOfflineState', 'BerxErrorBoundary', 'BerxAnalyticsBoundary', 'BerxDataBoundary',
	'BerxPerformanceGate', 'BerxReducedMotionGate',
	'BerxGlassSurface', 'BerxScrimHero', 'BerxSpatialCard', 'BerxMediaCard', 'BerxVideoCard',
	'BerxTrackCard', 'BerxAvatar', 'BerxIconButton', 'BerxInput', 'BerxMediaViewer',
	'BerxProfileHero', 'BerxSpatialLayer', 'BerxStoryRing', 'BerxMediaGrid', 'BerxAudioPlayer',
]);

export const BERX_V9_COMPONENTS: BerxV9ComponentEntry[] = (index as {components: {name: string}[]}).components.map(({name}) => {
	if (REAL.has(name)) return {name, state: 'REAL' as const, implementation: name};
	const alias = ALIASES[name];
	if (alias) return {name, state: 'ALIAS' as const, implementation: alias.implementation, note: alias.note};
	return {name, state: 'MISSING' as const};
});

export function berxV9ComponentCoverage() {
	const by = (s: BerxV9ComponentState) => BERX_V9_COMPONENTS.filter((c) => c.state === s).length;
	return {total: BERX_V9_COMPONENTS.length, real: by('REAL'), alias: by('ALIAS'), missing: by('MISSING')};
}

/**
 * THE SHARED COMPONENT CONTRACT — the part of the archive's component
 * layer that is a real specification rather than a name. Every BERX
 * spatial component should accept these, and the ones being written or
 * touched from here on do.
 */
export interface BerxV9ComponentContract {
	testID?: string;
	accessibilityLabel?: string;
	disabled?: boolean;
	/** Which plane this instance sits on. */
	depth?: 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
	material?: 'ClearGlass' | 'FrostGlass' | 'DeepGlass' | 'LiquidGlass' | 'Crystal' | 'DarkMetal';
	motion?: 'micro' | 'fast' | 'standard' | 'spatial' | 'cinematic' | 'ambient';
	/** True when the component's own motion is already safe under Reduced Motion. */
	reducedMotionSafe?: boolean;
}

/** The seven states every component contract declares. */
export const BERX_V9_COMPONENT_STATES = ['default', 'pressed', 'focused', 'disabled', 'loading', 'error', 'offline'] as const;
