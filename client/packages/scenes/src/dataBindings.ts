/**
 * Scene → real API binding.
 *
 * Every method name below is typed as `keyof BerxApiClient`, so an
 * endpoint that does not exist is a compile error rather than a
 * runtime 404. That is the mechanical enforcement of the v9 rule
 * "never invent backend endpoints": this file cannot name one.
 *
 * Only the 29 archive screens that carry real product logic appear
 * here. The other 271 contracts are numbered scene definitions with
 * no product logic in the archive — inventing data sources for them
 * would be exactly the fabrication the contract forbids, so they
 * resolve as real scenes with an explicit empty binding and render a
 * contract-only boundary (see resolve.ts).
 */
import type {BerxApiClient} from '@berx/api/client';

/** The BERX domain objects. Same list as 04_DATA_AND_STATE/DOMAIN_ENTITIES. */
export type BerxDomain =
	| 'User'
	| 'Profile'
	| 'Moment'
	| 'Media'
	| 'Place'
	| 'Event'
	| 'Experience'
	| 'Community'
	| 'Conversation'
	| 'Message'
	| 'Business'
	| 'Creator'
	| 'Collection'
	| 'Reward'
	| 'Reputation'
	| 'Notification';

/**
 * A method that genuinely exists on the API client. `keyof` is the
 * whole point — remove `feed()` from the client and every binding
 * that names it stops compiling.
 */
export type BerxApiMethod = keyof BerxApiClient;

export interface BerxBlockedCapability {
	capability: string;
	/** Precise reason. Never "not implemented" — what is missing, and where. */
	reason: string;
}

export interface BerxSceneDataBinding {
	screenId: string;
	domains: readonly BerxDomain[];
	/** Read calls the scene makes to render its default state. */
	reads: readonly BerxApiMethod[];
	/** Server-confirmed mutations the scene's actions dispatch. */
	mutations: readonly BerxApiMethod[];
	/** Capabilities the archive contract implies that the backend genuinely does not have. */
	blocked?: readonly BerxBlockedCapability[];
	/** True when the scene legitimately has no server data (device permissions, pure intro). */
	dataless?: boolean;
}

export const BERX_SCENE_DATA_BINDINGS: Record<string, BerxSceneDataBinding> = {
	'BERX-001': {
		screenId: 'BERX-001',
		domains: [],
		reads: [],
		mutations: [],
		dataless: true,
	},
	'BERX-002': {screenId: 'BERX-002', domains: ['User'], reads: [], mutations: ['login']},
	'BERX-003': {screenId: 'BERX-003', domains: ['User'], reads: [], mutations: ['register']},
	'BERX-004': {
		screenId: 'BERX-004',
		domains: ['Profile'],
		reads: [],
		mutations: [],
		/**
		 * Implemented and device-local. The six archive worlds are real
		 * and selecting one re-resolves every scene in the app; only the
		 * account-level persistence below is missing, and the screen
		 * says so rather than implying the choice follows the user.
		 */
		dataless: true,
		blocked: [
			{
				capability: 'persist the chosen color world to the account',
				reason:
					'POST /api/v1/me accepts only firstname, lastname, email and password (BerxApiClient.updateProfile). There is no profile preference resource, so a chosen world can only be device-local until one exists.',
			},
		],
	},
	'BERX-005': {
		screenId: 'BERX-005',
		domains: ['Profile'],
		reads: [],
		mutations: [],
		blocked: [
			{
				capability: 'general interest tags on a profile',
				reason:
					'The only interests resource is POST /api/v1/dating/interests, which records a dating like between two users — a different capability, not a tag list. No general interest storage exists on the profile.',
			},
		],
	},
	'BERX-006': {screenId: 'BERX-006', domains: ['User', 'Media'], reads: ['me'], mutations: ['uploadAvatar']},
	'BERX-007': {
		screenId: 'BERX-007',
		domains: [],
		reads: [],
		mutations: [],
		dataless: true,
		blocked: [
			{
				capability: 'runtime OS permission prompts',
				reason:
					'Permissions are an OS-level grant, not a BERX resource. The scene explains and links out; nothing is stored server-side, so nothing is claimed to be.',
			},
		],
	},
	'BERX-008': {
		screenId: 'BERX-008',
		domains: ['Profile'],
		reads: [],
		mutations: [],
		blocked: [
			{
				capability: 'account-wide privacy settings',
				reason:
					'POST /api/v1/dating/privacy governs the dating profile only (BerxApiClient.datingUpdatePrivacy). Post-level visibility is real but per-post (berx_visibility on createPost). There is no account-wide privacy resource to read or write.',
			},
		],
	},
	'BERX-009': {
		screenId: 'BERX-009',
		domains: ['User'],
		reads: ['blockedUsers'],
		mutations: ['blockUser', 'unblockUser', 'submitReport'],
	},
	'BERX-010': {screenId: 'BERX-010', domains: ['User', 'Reputation'], reads: ['me', 'pointsBalance'], mutations: []},

	'BERX-031': {
		screenId: 'BERX-031',
		domains: ['Moment', 'Media', 'User'],
		reads: ['feed'],
		mutations: ['likePost', 'commentOnPost', 'createPost'],
	},
	'BERX-032': {
		screenId: 'BERX-032',
		domains: ['Moment', 'Media'],
		reads: ['storiesFeed', 'ownStories'],
		mutations: ['markStoryViewed', 'createStory', 'deleteStory'],
	},

	'BERX-061': {
		screenId: 'BERX-061',
		domains: ['User', 'Place', 'Event', 'Community'],
		reads: ['searchUsers', 'searchPlaces', 'searchEvents', 'searchCommunities'],
		mutations: [],
	},

	'BERX-091': {
		screenId: 'BERX-091',
		domains: ['Place', 'Event'],
		reads: ['nearbyNow'],
		mutations: ['recordNearbyAction'],
	},

	'BERX-121': {
		screenId: 'BERX-121',
		domains: ['Profile', 'User', 'Reputation'],
		reads: ['getProfile', 'pointsBalance', 'friends'],
		mutations: ['addFriend', 'removeFriend'],
	},
	'BERX-122': {
		screenId: 'BERX-122',
		domains: ['Profile', 'Moment', 'Media'],
		reads: ['getProfile', 'userAlbums'],
		mutations: [],
	},
	'BERX-123': {
		screenId: 'BERX-123',
		domains: ['Profile', 'Place'],
		reads: ['getProfile', 'savedPlaces'],
		mutations: ['savePlace', 'unsavePlace'],
		blocked: [
			{
				capability: "another user's saved places",
				reason:
					'GET /api/v1/places/saved is scoped to the authenticated caller by design (a saved-places list is private). Viewing someone else\'s places is not a gap to fill client-side; the scene shows the owner-only tab only to the owner.',
			},
		],
	},
	'BERX-124': {
		screenId: 'BERX-124',
		domains: ['Profile', 'Event'],
		reads: ['getProfile', 'myGoingEvents'],
		mutations: ['rsvpEvent', 'cancelRsvp'],
		blocked: [
			{
				capability: "another user's event attendance",
				reason:
					'GET /api/v1/events/going is caller-scoped. Per-event attendance is public via eventAttendees, but there is no by-user attendance resource, so the tab is owner-only rather than fabricated.',
			},
		],
	},
	'BERX-125': {
		screenId: 'BERX-125',
		domains: ['Profile', 'Experience'],
		reads: ['getProfile', 'experiences'],
		mutations: [],
	},
	'BERX-126': {screenId: 'BERX-126', domains: ['Profile'], reads: ['getProfile'], mutations: []},
	'BERX-127': {
		screenId: 'BERX-127',
		domains: ['Profile', 'User'],
		reads: ['getProfile', 'friends'],
		mutations: ['addFriend', 'removeFriend'],
		blocked: [
			{
				capability: "another user's connection list",
				reason:
					'GET /api/v1/friends returns the authenticated caller\'s friends. No by-user friends resource exists, so the list renders for the owner and the scene states plainly that it is not public.',
			},
		],
	},

	'BERX-151': {
		screenId: 'BERX-151',
		domains: ['User'],
		reads: ['friends', 'searchUsers'],
		mutations: ['addFriend', 'removeFriend', 'blockUser'],
	},

	'BERX-176': {
		screenId: 'BERX-176',
		domains: ['Conversation', 'Message'],
		reads: ['conversations', 'conversationWith', 'unreadMessageCount', 'getTypingStatus'],
		mutations: ['sendMessage', 'markConversationRead', 'deleteMessage', 'setTypingStatus'],
		blocked: [
			{
				capability: 'voice / video calling (BerxCallSurface in the contract)',
				reason:
					'There is no signalling, TURN/STUN or call-session resource anywhere under /api/v1/. A call button that cannot place a call is exactly the fake functionality the constitution forbids, so the surface is not rendered.',
			},
		],
	},

	'BERX-201': {
		screenId: 'BERX-201',
		domains: ['Place'],
		reads: ['places', 'nearbyPlaces', 'placeCategories', 'savedPlaces'],
		mutations: ['savePlace', 'unsavePlace'],
	},
	'BERX-226': {
		screenId: 'BERX-226',
		domains: ['Event'],
		reads: ['events', 'eventCategories', 'myGoingEvents'],
		mutations: ['rsvpEvent', 'cancelRsvp'],
		blocked: [
			{
				capability: 'paid ticketing (BerxTicket/BerxWalletCard in the contract)',
				reason:
					'RSVP and capacity are real; payment, ticket issuance and wallet passes have no endpoint or provider integration. The scene renders real RSVP state and no ticket artefact.',
			},
		],
	},
	'BERX-246': {
		screenId: 'BERX-246',
		domains: ['Experience', 'Collection'],
		reads: ['experiences', 'trips', 'collections'],
		mutations: ['respondToExperience', 'inviteToExperience'],
	},
	'BERX-266': {
		screenId: 'BERX-266',
		domains: ['Community'],
		reads: ['communities', 'myCommunities'],
		mutations: ['joinCommunity', 'leaveCommunity', 'createCommunity'],
	},
	'BERX-281': {
		screenId: 'BERX-281',
		domains: ['Creator', 'Reward', 'Reputation'],
		reads: ['getCreatorProfile', 'getCreatorContent', 'pointsBalance', 'pointsHistory'],
		mutations: ['updateCreatorProfile', 'recordCreatorView'],
		blocked: [
			{
				capability: 'creator payouts / earnings wallet (BerxWalletCard in the contract)',
				reason:
					'Points are real and server-authoritative; money is not. No payment processor, balance or payout resource exists, so the hub shows real points and no currency.',
			},
		],
	},
	'BERX-291': {
		screenId: 'BERX-291',
		domains: ['Business', 'Place'],
		reads: ['businessDashboard', 'businessTeam', 'getBusinessSubscription'],
		mutations: ['addBusinessTeamMember', 'removeBusinessTeamMember', 'startBusinessTrial'],
		blocked: [
			{
				capability: 'visitor / impression analytics beyond nearby impressions',
				reason:
					'GET /api/v1/places/{guid}/business/dashboard returns real ratings, review counts and nearby impressions. There is no page-view, reach or conversion pipeline, so no such metric is displayed.',
			},
		],
	},
};

/** The 29 archive screens with real product logic and a real data source. */
export const BERX_BOUND_SCENE_IDS: readonly string[] = Object.keys(BERX_SCENE_DATA_BINDINGS).sort();
