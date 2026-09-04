/**
 * BERX V9 SCREEN BINDINGS — where the archive meets the real backend.
 *
 * The architecture's last two steps: "individual screen contracts ->
 * REAL DOMAIN/API -> 300 real routes/scenes". This file is that join.
 * The archive deliberately ships no endpoint names ("this archive
 * intentionally does not invent backend endpoints... map the contract
 * to the existing BERX REST resources in the source tree"), so every
 * binding below was read off packages/api/src/client.ts — 335 real
 * methods over 84 real paths under /api/v1/ — and every name here was
 * checked against that file and against apps/mobile/src/screens before
 * being written down. (That check caught four names that did not
 * exist: `setMyInterests` is really `saveInterests`, `rsvpToEvent` is
 * `rsvpEvent`, and the Events/Communities screens are
 * `EventsListScreen`/`CommunitiesListScreen`.)
 *
 * HONEST SCOPE, stated up front because it decides what this file can
 * and cannot contain.
 *
 * The archive names 300 screens. Checked field-by-field across all
 * three of its screen layers (V9 contracts, V2 contracts, V1
 * screen.json): 29 carry a distinct title and purpose. The other 271
 * are their family's name plus a running number ("Home Feed 33",
 * "Places & Map 208") and carry no distinct components, data,
 * composition or copy — the archive's per-screen design content is
 * family-level, which its own DESIGN_SPEC files confirm (11 distinct
 * bodies across 300 files).
 *
 * So: all 300 are REGISTERED and resolvable, inherit their family
 * scene, and keep their real route and analytics keys. The 29 named
 * ones are BOUND to real screens and real API methods below. Inventing
 * 271 screen designs and 271 data bindings the archive does not contain
 * is the fabrication the brief forbids, so it is not done — the gap is
 * reported instead.
 */
import {BERX_V9_CONTRACTS, BERX_V9_SCREEN_IDS} from '../../../../packages/design-system/src/v9/scenes';

/** How completely a contract is realised in the running app. */
export type BerxV9BindingStatus =
	/** A real screen renders it against real API data. */
	| 'BOUND'
	/** Registered and inheriting its family scene; the archive gives it no distinct design or data. */
	| 'INHERITED'
	/** The archive asks for a capability this backend genuinely does not have. Never faked. */
	| 'BLOCKED';

export interface BerxV9Binding {
	screenId: string;
	status: BerxV9BindingStatus;
	/** A real screen component in apps/mobile/src/screens. */
	screen?: string;
	/** Real BerxApiClient methods this scene reads or writes. */
	api?: string[];
	/** Why, when BLOCKED — or what a binding deliberately does not claim. */
	note?: string;
}

const NAMED: BerxV9Binding[] = [
	// AUTH
	{screenId: 'BERX-001', status: 'BOUND', screen: 'onboarding/CinematicOnboarding', api: []},
	{screenId: 'BERX-002', status: 'BOUND', screen: 'LoginScreen', api: ['login']},
	{screenId: 'BERX-003', status: 'BOUND', screen: 'onboarding/CinematicOnboarding', api: ['register']},
	{screenId: 'BERX-004', status: 'BOUND', screen: 'SettingsScreen', api: [], note: 'Color Vibe is the live accent runtime (useBerxThemeSettings), persisted client-side. No server field for it exists.'},
	{screenId: 'BERX-005', status: 'BOUND', screen: 'OnboardingScreen', api: ['myInterests', 'saveInterests']},
	{screenId: 'BERX-006', status: 'BOUND', screen: 'OnboardingScreen', api: ['uploadAvatar']},
	{screenId: 'BERX-007', status: 'BLOCKED', note: 'Permissions: no location/camera permission flow exists anywhere in this codebase (PlacesNearbyScreen documents the same gap). Nothing to bind without inventing it.'},
	{screenId: 'BERX-008', status: 'BOUND', screen: 'DatingPrivacyScreen', api: ['datingUpdatePrivacy', 'getOwnDatingProfile']},
	{screenId: 'BERX-009', status: 'BOUND', screen: 'SettingsScreen', api: ['blockedUsers', 'blockUser', 'mutedUsers', 'muteUser']},
	{screenId: 'BERX-010', status: 'BOUND', screen: 'OnboardingScreen', api: ['me']},
	// HOME
	{screenId: 'BERX-031', status: 'BOUND', screen: 'FeedScreen', api: ['feed', 'likePost', 'commentOnPost', 'pinPost']},
	{screenId: 'BERX-032', status: 'BOUND', screen: 'StoriesRailScreen', api: ['ownStories', 'createStory', 'markStoryViewed']},
	// EXPLORE / NOW
	{screenId: 'BERX-061', status: 'BOUND', screen: 'SearchScreen', api: ['searchPlaces', 'peopleDiscovery', 'discoverWorlds']},
	{screenId: 'BERX-091', status: 'BOUND', screen: 'NowScreen', api: ['nearbyNow', 'onlineFriends', 'cityMode']},
	// PROFILE
	{screenId: 'BERX-121', status: 'BOUND', screen: 'ProfileScreen', api: ['getProfile', 'identity', 'me']},
	{screenId: 'BERX-122', status: 'BOUND', screen: 'ProfileScreen', api: ['momentsForSource', 'myLifeMoments']},
	{screenId: 'BERX-123', status: 'BOUND', screen: 'ProfileScreen', api: ['savedPlaces', 'recentCheckins']},
	{screenId: 'BERX-124', status: 'BOUND', screen: 'ProfileScreen', api: ['myGoingEvents']},
	{screenId: 'BERX-125', status: 'BOUND', screen: 'ProfileScreen', api: ['experiences']},
	{screenId: 'BERX-126', status: 'BOUND', screen: 'ProfileScreen', api: ['getProfile']},
	{screenId: 'BERX-127', status: 'BOUND', screen: 'PeopleScreen', api: ['friends', 'onlineFriends', 'addFriend']},
	// SOCIAL / MESSAGES
	{screenId: 'BERX-151', status: 'BOUND', screen: 'PeopleScreen', api: ['friends', 'peopleDiscovery', 'addFriend']},
	{screenId: 'BERX-176', status: 'BOUND', screen: 'ConversationListScreen', api: ['conversations', 'markConversationRead', 'myGroups']},
	// PLACES / EVENTS / EXPERIENCES
	{screenId: 'BERX-201', status: 'BOUND', screen: 'PlacesNearbyScreen', api: ['nearbyPlaces', 'placeCategories', 'searchPlaces']},
	{screenId: 'BERX-226', status: 'BOUND', screen: 'EventsListScreen', api: ['events', 'eventCategories', 'rsvpEvent']},
	{screenId: 'BERX-246', status: 'BOUND', screen: 'ExperiencesScreen', api: ['experiences', 'getExperience']},
	// COMMUNITY / CREATOR / BUSINESS
	{screenId: 'BERX-266', status: 'BOUND', screen: 'CommunitiesListScreen', api: ['communities', 'myCommunities', 'joinCommunity']},
	{screenId: 'BERX-281', status: 'BOUND', screen: 'CreatorSettingsScreen', api: ['getCreatorProfile', 'getCreatorContent', 'enableCreatorMode']},
	{screenId: 'BERX-291', status: 'BOUND', screen: 'BusinessDashboardScreen', api: ['businessDashboard', 'businessTeam', 'placeOffers']},
];

const BY_ID = new Map(NAMED.map((b) => [b.screenId, b]));

export const BERX_V9_BINDINGS: BerxV9Binding[] = BERX_V9_SCREEN_IDS.map(
	(id) => BY_ID.get(id) ?? {screenId: id, status: 'INHERITED' as const}
);

export function bindingFor(screenId: string): BerxV9Binding | undefined {
	return BERX_V9_BINDINGS.find((b) => b.screenId === screenId);
}

/** Coverage, computed rather than asserted — the reports read their numbers from here. */
export function bindingCoverage() {
	const by = (s: BerxV9BindingStatus) => BERX_V9_BINDINGS.filter((b) => b.status === s).length;
	return {
		total: BERX_V9_BINDINGS.length,
		bound: by('BOUND'),
		inherited: by('INHERITED'),
		blocked: by('BLOCKED'),
		namedTotal: Object.values(BERX_V9_CONTRACTS).filter((c) => !/\s\d+$/.test(c.title)).length,
	};
}
