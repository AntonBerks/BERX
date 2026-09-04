/**
 * V9 component resolution.
 *
 * Every component the 300 contracts ask for is resolved here to one
 * of six honest outcomes:
 *
 *   EXISTING  — a real implementation already ships; reuse it.
 *   ALIAS     — the contract's name for something BERX already has.
 *   EXTEND    — real but incomplete; extended, not replaced.
 *   REFACTOR  — real but wrong against v9; corrected in place.
 *   CREATE    — genuinely required, real support exists, built.
 *   BLOCKED   — the backend or platform cannot support it. Named,
 *               with the exact reason, and NOT rendered as a stub.
 *
 * A BLOCKED component is never given an empty shell that looks
 * finished. The scene omits it and says why (see resolve.ts).
 */

export type BerxComponentResolution = 'EXISTING' | 'ALIAS' | 'EXTEND' | 'REFACTOR' | 'CREATE' | 'BLOCKED';

export interface BerxComponentBinding {
	/** The name the v9 contract uses. */
	contractName: string;
	resolution: BerxComponentResolution;
	/** The real module export that renders it. Absent only when BLOCKED. */
	implementation?: string;
	/** Module path relative to packages/design-system/src. */
	module?: string;
	/** Why — required for ALIAS, EXTEND, REFACTOR and BLOCKED. */
	note?: string;
}

const B = (
	contractName: string,
	resolution: BerxComponentResolution,
	implementation?: string,
	module?: string,
	note?: string,
): BerxComponentBinding => ({contractName, resolution, implementation, module, note});

/**
 * Keyed by the contract's component name. Only names that at least
 * one of the 300 contracts actually requests are resolved — the
 * archive's component index lists 118, of which 50 are referenced by
 * a screen. The remaining 68 are catalogued in
 * BERX_V9_COMPONENT_STATUS.md as unreferenced rather than built
 * speculatively.
 */
export const BERX_COMPONENT_BINDINGS: Record<string, BerxComponentBinding> = {
	/* ---- spatial foundation (the 5D runtime itself) ---- */
	BerxSpatialCard: B('BerxSpatialCard', 'CREATE', 'BerxSpatialCard', 'spatial/BerxSpatialCard'),
	BerxGlassSurface: B(
		'BerxGlassSurface',
		'REFACTOR',
		'BerxGlassSurface',
		'components/BerxGlassSurface',
		'Was a fixed translucent card with a hairline. Now resolves its fill, blur, border, edge highlight, refractive rim and glow from the v9 material via @berx/spatial, so DeepGlass and ClearGlass no longer render identically. Existing props and call sites are unchanged.',
	),
	BerxEnergyHalo: B('BerxEnergyHalo', 'CREATE', 'BerxEnergyHalo', 'spatial/BerxEnergyHalo'),
	BerxProgressRing: B('BerxProgressRing', 'CREATE', 'BerxProgressRing', 'spatial/BerxProgressRing'),

	/* ---- identity ---- */
	BerxAvatar: B('BerxAvatar', 'EXISTING', 'BerxAvatar', 'components/BerxAvatar'),
	BerxAvatarCluster: B('BerxAvatarCluster', 'CREATE', 'BerxAvatarCluster', 'spatial/BerxAvatarCluster'),
	BerxIdentity: B('BerxIdentity', 'CREATE', 'BerxIdentity', 'spatial/BerxIdentity'),

	/* ---- controls ---- */
	BerxPrimaryButton: B(
		'BerxPrimaryButton',
		'ALIAS',
		'BerxButton',
		'components/BerxButton',
		'BerxButton already implements the primary/secondary/ghost variants the contract splits into three names. Aliased rather than duplicated.',
	),
	BerxInput: B('BerxInput', 'EXISTING', 'BerxInput', 'components/BerxInput'),
	BerxSearchField: B('BerxSearchField', 'CREATE', 'BerxSearchField', 'spatial/BerxSearchField'),
	BerxFilterBar: B('BerxFilterBar', 'CREATE', 'BerxFilterBar', 'spatial/BerxFilterBar'),
	BerxTabs: B(
		'BerxTabs',
		'ALIAS',
		'BerxSegmentTabs',
		'components/BerxBusinessPrimitives',
		'BerxSegmentTabs is the real, already-used segmented control. Aliased.',
	),
	BerxProfileTabs: B(
		'BerxProfileTabs',
		'ALIAS',
		'BerxSegmentTabs',
		'components/BerxBusinessPrimitives',
		'Same control as BerxTabs; the contract names it twice by context, not by behaviour.',
	),
	BerxBottomNav: B(
		'BerxBottomNav',
		'EXTEND',
		'BerxBottomNav',
		'spatial/BerxBottomNav',
		'The tab bar existed only inline inside AppShell. Extracted into a real component with the D4 control-layer material, a visible focus ring and 44dp targets; AppShell renders it instead of its own copy.',
	),

	/* ---- surfaces / media ---- */
	BerxScrimHero: B(
		'BerxScrimHero',
		'EXTEND',
		'BerxScrimHero',
		'components/BerxScrimHero',
		'Real scrim hero already shipped. Extended with a D1 atmosphere layer and parallax binding so hero media sits behind the content plane rather than beside it.',
	),
	BerxMediaCard: B(
		'BerxMediaCard',
		'BLOCKED',
		undefined,
		undefined,
		'The HOME contract names a media card, but feed.php returns no media per item — it deliberately omits per-item joins to avoid an N+1, so a feed row has text and an author and nothing to put in a media card. Post detail, where media does exist, fetches the assets separately and renders BerxMediaGrid, which handles the multi-asset case properly. A media card was built during this pass and then removed rather than shipped unrendered: a component nothing draws is not a delivered component.',
	),
	BerxMediaGrid: B('BerxMediaGrid', 'EXISTING', 'BerxMediaGrid', 'components/BerxMediaGrid'),
	BerxMomentGrid: B(
		'BerxMomentGrid',
		'ALIAS',
		'BerxMediaGrid',
		'components/BerxMediaGrid',
		'A moment grid is a media grid over the Moment domain. Same component, real data difference only.',
	),
	BerxHorizontalRail: B('BerxHorizontalRail', 'CREATE', 'BerxHorizontalRail', 'spatial/BerxHorizontalRail'),
	BerxStoryTray: B('BerxStoryTray', 'CREATE', 'BerxStoryTray', 'spatial/BerxStoryTray'),

	/* ---- metrics ---- */
	BerxStatRail: B('BerxStatRail', 'CREATE', 'BerxStatRail', 'spatial/BerxStatRail'),
	BerxBusinessMetric: B(
		'BerxBusinessMetric',
		'ALIAS',
		'BerxStatTile',
		'components/BerxBusinessPrimitives',
		'BerxStatTile is the real metric tile already used by the business screens.',
	),

	/* ---- domain cards ---- */
	BerxPlaceCard: B('BerxPlaceCard', 'CREATE', 'BerxPlaceCard', 'spatial/BerxPlaceCard'),
	BerxPlaceHero: B('BerxPlaceHero', 'CREATE', 'BerxPlaceHero', 'spatial/BerxPlaceHero'),
	BerxPlaceRating: B('BerxPlaceRating', 'CREATE', 'BerxPlaceRating', 'spatial/BerxPlaceRating'),
	BerxPlaceHours: B('BerxPlaceHours', 'CREATE', 'BerxPlaceHours', 'spatial/BerxPlaceHours'),
	BerxEventHero: B('BerxEventHero', 'CREATE', 'BerxEventHero', 'spatial/BerxEventHero'),
	BerxCountdown: B('BerxCountdown', 'CREATE', 'BerxCountdown', 'spatial/BerxCountdown'),
	BerxExperienceCard: B('BerxExperienceCard', 'CREATE', 'BerxExperienceCard', 'spatial/BerxExperienceCard'),
	BerxTripCard: B('BerxTripCard', 'CREATE', 'BerxTripCard', 'spatial/BerxTripCard'),
	BerxCollectionCard: B('BerxCollectionCard', 'CREATE', 'BerxCollectionCard', 'spatial/BerxCollectionCard'),
	BerxCommunityCard: B('BerxCommunityCard', 'CREATE', 'BerxCommunityCard', 'spatial/BerxCommunityCard'),
	BerxCreatorCard: B('BerxCreatorCard', 'CREATE', 'BerxCreatorCard', 'spatial/BerxCreatorCard'),
	BerxRewardCard: B('BerxRewardCard', 'CREATE', 'BerxRewardCard', 'spatial/BerxRewardCard'),
	BerxBusinessHero: B('BerxBusinessHero', 'CREATE', 'BerxBusinessHero', 'spatial/BerxBusinessHero'),
	BerxProfileHero: B('BerxProfileHero', 'CREATE', 'BerxProfileHero', 'spatial/BerxProfileHero'),

	/* ---- social / messaging ---- */
	BerxChatRow: B('BerxChatRow', 'CREATE', 'BerxChatRow', 'spatial/BerxChatRow'),
	BerxMessageBubble: B('BerxMessageBubble', 'CREATE', 'BerxMessageBubble', 'spatial/BerxMessageBubble'),
	BerxComposer: B('BerxComposer', 'CREATE', 'BerxComposer', 'spatial/BerxComposer'),
	BerxTypingIndicator: B('BerxTypingIndicator', 'CREATE', 'BerxTypingIndicator', 'spatial/BerxTypingIndicator'),
	BerxReactionPicker: B(
		'BerxReactionPicker',
		'CREATE',
		'BerxReactionPicker',
		'spatial/BerxReactionPicker',
		'Built against the reaction the backend actually has: OssnLikes is a single like/unlike, so this is a real like control with server-confirmed state. It does not offer six emoji that would all write the same row.',
	),
	BerxShareSheet: B(
		'BerxShareSheet',
		'CREATE',
		'BerxShareSheet',
		'spatial/BerxShareSheet',
		"Uses React Native's own Share API — a real OS share, not a BERX resource, so nothing is faked and nothing is stored.",
	),

	/* ---- NOW ---- */
	BerxNowPulse: B('BerxNowPulse', 'CREATE', 'BerxNowPulse', 'spatial/BerxNowPulse'),
	BerxNowRail: B('BerxNowRail', 'CREATE', 'BerxNowRail', 'spatial/BerxNowRail'),
	BerxNowScene: B('BerxNowScene', 'CREATE', 'BerxNowScene', 'spatial/BerxNowScene'),

	/* ---- blocked ---- */
	BerxMap: B(
		'BerxMap',
		'BLOCKED',
		undefined,
		undefined,
		'No map renderer is available: react-native-maps / MapLibre are not installed and no tile or geocoding provider is configured. /api/v1/nearby returns real coordinates and distances, so the NOW and Places scenes render a real ranked distance list instead of an empty map frame.',
	),
	BerxMapPin: B(
		'BerxMapPin',
		'BLOCKED',
		undefined,
		undefined,
		'A pin without a map surface has nothing to be placed on. Blocked with BerxMap; the same real coordinates drive the distance list instead.',
	),
	BerxCallSurface: B(
		'BerxCallSurface',
		'BLOCKED',
		undefined,
		undefined,
		'No call signalling, media server or call-session resource exists under /api/v1/. A call button that cannot place a call is fake functionality, so none is rendered.',
	),
	BerxTicket: B(
		'BerxTicket',
		'BLOCKED',
		undefined,
		undefined,
		'Events have real RSVP and capacity but no payment, ticket issuance or barcode resource. The Events scene shows real RSVP state instead of a ticket artefact.',
	),
	BerxWalletCard: B(
		'BerxWalletCard',
		'BLOCKED',
		undefined,
		undefined,
		'Points and rewards are real and server-authoritative; money is not. There is no balance, payout or payment-processor resource, so no currency surface is rendered.',
	),
};

export function resolveComponent(contractName: string): BerxComponentBinding {
	return (
		BERX_COMPONENT_BINDINGS[contractName] ?? {
			contractName,
			resolution: 'BLOCKED',
			note: 'No resolution recorded. A component with no recorded binding is treated as unavailable rather than rendered as an empty shell.',
		}
	);
}

export function isRenderable(binding: BerxComponentBinding): boolean {
	return binding.resolution !== 'BLOCKED';
}
