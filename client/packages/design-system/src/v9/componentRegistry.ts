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
 *   3. It DEFERS, with a named blocker, the few contracts whose backing
 *      capability genuinely does not exist in this backend — rather
 *      than shipping a control that cannot be wired to anything.
 *   4. It does NOT generate stub components to make a count look
 *      complete. A file that renders nothing is not an implementation.
 *
 * `berxV9ComponentCoverage()` computes the numbers the reports quote,
 * so they cannot drift from reality.
 */
import index from './component_index.json';
import contracts from './scene_contracts.json';

export type BerxV9ComponentState = 'REAL' | 'ALIAS' | 'DEFER' | 'MISSING';

export interface BerxV9ComponentEntry {
	/** The archive's name. */
	name: string;
	state: BerxV9ComponentState;
	/** The real module/export that satisfies it. */
	implementation?: string;
	/** How it satisfies the contract, when that needs saying. */
	note?: string;
	/** For DEFER only: the concrete thing that must exist before this can be built. */
	unblockedBy?: string;
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
	// Composition helpers that resolve to the component doing the work.
	BerxNotificationStack: {
		implementation: 'BerxNotificationRow',
		note: 'NotificationsScreen composes rows directly, in real chronological order. Grouping them by subject kind would impose an order the product does not use, so the wrapper resolves to the row rather than forcing a different information architecture to justify itself.',
	},
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

/**
 * DEFERRED — real contracts with no real capability behind them here.
 *
 * Each of these would have to invent the thing it controls, which the
 * directive forbids ("Если capability backend отсутствует — честно
 * пометь BLOCKED/MISSING, но не подделывай её"). Each names the exact
 * condition that unblocks it.
 */
const DEFERRED: Record<string, {note: string; unblockedBy: string}> = {
	BerxCommandBar: {
		note: 'Desktop command palette. BERX ships iOS/Android/Web-mobile shells; there is no desktop chrome, no keyboard-shortcut layer and no global command index to search.',
		unblockedBy: 'A desktop shell with a keyboard layer, plus a real cross-domain search endpoint to back the palette (searchUsers/searchPlaces are per-domain).',
	},
	BerxOtpInput: {
		note: 'One-time-code entry. The OSSN auth surface in this repository is password + session (login/register/logout); there is no OTP issue or verify endpoint, so this control would submit a code nothing can check.',
		unblockedBy: 'A real OTP issue+verify pair on the OSSN API (e.g. components/OssnApi/v1/auth otp_request / otp_verify).',
	},
	BerxPermissionPrompt: {
		note: 'Asks for a permission. There is no permission flow anywhere in this codebase — no location, camera or notification request path exists (BERX-007 is BLOCKED for exactly this reason, and PlacesNearbyScreen documents the same gap by asking the user to type coordinates). A prompt that grants nothing is a lie about capability, so the built version was removed rather than left unreachable.',
		unblockedBy: 'A real permission layer: expo-location / expo-camera requests wired to real behaviour, plus the server-side capability that consumes them.',
	},
	BerxPermissionGate: {
		note: 'Gates content behind a permission BERX never asks for — same blocker as BerxPermissionPrompt above. Removed rather than shipped as a wrapper that always renders its children.',
		unblockedBy: 'The same real permission layer.',
	},
	BerxPopover: {
		note: 'A transient anchored disclosure. Every disclosure in BERX is a sheet or a full screen, because these are phone shells where a popover has nothing to anchor against; the desktop surface that would need one does not exist — the same blocker as BerxCommandBar. Removed rather than left as unreachable code.',
		unblockedBy: 'A desktop or tablet shell with real anchor geometry and hover affordances.',
	},
	BerxCallSurface: {
		note: 'Voice/video call UI. Messaging here is real (conversations, messages, group messages) but text-only — there is no signalling, no media server and no call record in the API.',
		unblockedBy: 'A real calling capability: signalling endpoints plus a media transport. Until then messaging renders its real states without a call affordance.',
	},
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
	// v9/BerxV9Overlays.tsx — the overlay + safety layer the 300 contracts
	// reference from nearly every family.
	'BerxSheet', 'BerxModal', 'BerxToast', 'BerxSnackbar', 'BerxContextMenu',
	'BerxShareSheet', 'BerxReportSheet', 'BerxBlockSheet', 'BerxSafetyBanner',
	'BerxReactionPicker',
	// v9/BerxV9Domain.tsx — the real BERX objects, each with an endpoint behind it.
	'BerxVerifiedBadge', 'BerxLevelBadge', 'BerxPlaceHero', 'BerxPlaceHours', 'BerxPlaceRating',
	'BerxEventHero', 'BerxTicket', 'BerxExperienceCard', 'BerxTripCard', 'BerxCollectionCard',
	'BerxCommunityCard', 'BerxBusinessCard', 'BerxCreatorCard', 'BerxRewardCard',
	'BerxBusinessHero', 'BerxWalletCard', 'BerxNotificationRow',
	// v9/BerxV9Controls.tsx — input + NOW + boundary controls.
	'BerxToggle', 'BerxTextArea', 'BerxStepper', 'BerxSlider', 'BerxDatePicker', 'BerxTimePicker',
	'BerxColorVibePicker', 'BerxComposer', 'BerxNowRail', 'BerxNowScene', 'BerxFocusRing',
	'BerxRouteBoundary',
	// v9/BerxV9Profile.tsx — the five profile sections and real map clustering.
	'BerxProfileAbout', 'BerxProfilePlaces', 'BerxProfileMoments', 'BerxProfileExperiences',
	'BerxProfileConnections', 'BerxMapCluster',
]);

/**
 * The real universe of contract names.
 *
 * The archive is internally inconsistent here, and this is the honest
 * reconciliation rather than a silent pick: `component_index.json`
 * lists 118 components, but the 300 scene contracts reference two names
 * it does not carry — BerxCountdown (every Events scene) and
 * BerxMediaGrid (the media families). A registry built from the index
 * alone reports those two as "not in the registry" on 30 real scenes,
 * which is a false gap: both are implemented here. So the universe is
 * the UNION of what the index declares and what the contracts actually
 * demand — nothing invented, nothing dropped.
 */
const CONTRACT_NAMES = new Set<string>(
	Object.values(contracts as Record<string, {components?: string[]}>).flatMap((c) => c.components ?? [])
);
const UNIVERSE: string[] = [
	...(index as {components: {name: string}[]}).components.map((c) => c.name),
	...[...CONTRACT_NAMES].filter((n) => !(index as {components: {name: string}[]}).components.some((c) => c.name === n)),
];

export const BERX_V9_COMPONENTS: BerxV9ComponentEntry[] = UNIVERSE.map((name) => {
	if (REAL.has(name)) return {name, state: 'REAL' as const, implementation: name};
	const alias = ALIASES[name];
	if (alias) return {name, state: 'ALIAS' as const, implementation: alias.implementation, note: alias.note};
	const deferred = DEFERRED[name];
	if (deferred) return {name, state: 'DEFER' as const, note: deferred.note, unblockedBy: deferred.unblockedBy};
	return {name, state: 'MISSING' as const};
});

export function berxV9ComponentCoverage() {
	const by = (s: BerxV9ComponentState) => BERX_V9_COMPONENTS.filter((c) => c.state === s).length;
	return {
		total: BERX_V9_COMPONENTS.length,
		real: by('REAL'),
		alias: by('ALIAS'),
		defer: by('DEFER'),
		missing: by('MISSING'),
		/** Every contract accounted for by a real decision — the number the audit gates on. */
		classified: by('REAL') + by('ALIAS') + by('DEFER'),
	};
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
