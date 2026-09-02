/**
 * BERX Mobile — information architecture.
 *
 * Route names/params only — pure data, verifiable by tsc without any
 * navigation library installed (react-navigation itself is NOT
 * imported here; wiring these routes to an actual Stack/Tab navigator
 * is a separate, still-UNVERIFIED step once real navigation deps can
 * be installed).
 *
 * `connected: true` means a real API endpoint exists for this section
 * (see API_SECURITY_MATRIX.md) — `connected: false` sections get a
 * route stub but must render an honest "coming soon" boundary, never
 * fake content. This list is the actual, current state of BERX's
 * backend, not an aspirational full sitemap.
 */

export type BerxRouteName =
	| 'Splash'
	| 'Welcome'
	| 'Login'
	| 'Register'
	| 'Home'
	| 'Feed'
	| 'People'
	| 'Create'
	| 'PostDetail'
	| 'CreatePost'
	| 'Profile'
	| 'Search'
	| 'Messages'
	| 'Conversation'
	| 'MessageSearch'
	| 'Notifications'
	| 'Points'
	| 'Stories'
	| 'StoryViewer'
	| 'CreateStory'
	| 'Dating'
	| 'DatingProfile'
	| 'DatingPhotos'
	| 'DatingSearch'
	| 'DatingUserPhotos'
	| 'DatingMatch'
	| 'DatingMatches'
	| 'DatingPrivacy'
	| 'Settings'
	| 'DeviceSessions'
	| 'NotificationPreferences'
	| 'InviteFriends'
	| 'SitePage'
	| 'MyDrafts'
	| 'DeleteAccount'
	| 'BlockedUsers'
	| 'MutedUsers'
	| 'Communities'
	| 'CommunityDetail'
	| 'CreateCommunity'
	| 'Plans'
	| 'PlanDetail'
	| 'CreatePlan'
	| 'Worlds'
	| 'WorldDetail'
	| 'CreateWorld'
	| 'Next'
	| 'MemoryDetail'
	| 'Hashtag'
	| 'MyMoments'
	| 'CommunityRequests'
	| 'CommunityModerators'
	| 'CommunityMembers'
	| 'Albums'
	| 'AlbumDetail'
	| 'CreateAlbum'
	| 'Report'
	| 'Collections'
	| 'CollectionDetail'
	| 'CreateCollection'
	| 'AddToCollection'
	| 'AddToTrip'
	| 'AddToWorld'
	| 'Circles'
	| 'CircleDetail'
	| 'CreateCircle'
	| 'Trips'
	| 'TripDetail'
	| 'CreateTrip'
	| 'Experiences'
	| 'ExperienceDetail'
	| 'CreateExperience'
	| 'CreatorProfile'
	| 'CreatorSettings'
	| 'VideoFeed'
	| 'VideoDetail'
	| 'CreateVideo'
	| 'MyVideos'
	| 'TrackFeed'
	| 'TrackDetail'
	| 'CreateTrack'
	| 'MyTracks'
	| 'Memories'
	| 'Wrapped'
	| 'NearbyNow'
	| 'Missions'
	| 'LifeGraph'
	| 'SocialMap'
	| 'BusinessDashboard'
	| 'BusinessHome'
	| 'BusinessProfile'
	| 'BusinessProducts'
	| 'BusinessOffers'
	| 'BusinessTeam'
	| 'BusinessSettings'
	| 'Events'
	| 'EventDetail'
	| 'CreateEvent'
	| 'EditEvent'
	| 'EventInvite'
	| 'SharePost'
	| 'MyEvents'
	| 'Places'
	| 'PlaceDetail'
	| 'CreatePlace'
	| 'EditPlace'
	| 'EditProfile'
	| 'PlacesNearby'
	| 'SavedPlaces'
	| 'RecentCheckins'
	| 'AdminUnvalidated'
	| 'AdminReports'
	| 'AdminPlaceClaims'
	| 'MyPlaceClaims'
	| 'BERXWorld'
	| 'Saved';

export interface BerxRouteParams {
	Splash: undefined;
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	Home: undefined;
	Feed: undefined;
	People: undefined;
	Create: undefined;
	PostDetail: { postGuid: number };
	/** MAX BUILD — optional real draft to prefill (see MyDraftsScreen.tsx) or a real Repost target (see posts.php's own comment on berx_repost_of). */
	CreatePost: {draft?: {id: number; text: string; visibility: string}; repostTarget?: {guid: number; text: string; owner_username: string | null}} | undefined;
	Profile: { username?: string };
	Search: undefined;
	Messages: undefined;
	Conversation: { otherGuid: number; otherUsername?: string };
	MessageSearch: undefined;
	Notifications: undefined;
	Points: undefined;
	Stories: undefined;
	StoryViewer: undefined;
	CreateStory: { eventGuid?: number } | undefined;
	Dating: undefined;
	DatingMatch: { otherGuid: number; otherUsername: string };
	DatingMatches: undefined;
	DatingProfile: undefined;
	DatingPhotos: undefined;
	DatingSearch: undefined;
	DatingUserPhotos: { userGuid: number; username: string };
	DatingPrivacy: undefined;
	Settings: undefined;
	DeviceSessions: undefined;
	NotificationPreferences: undefined;
	InviteFriends: undefined;
	SitePage: { prefix: 'about' | 'terms' | 'privacy' };
	MyDrafts: undefined;
	DeleteAccount: undefined;
	BlockedUsers: undefined;
	MutedUsers: undefined;
	Communities: undefined;
	CommunityDetail: { guid: number };
	CreateCommunity: undefined;
	Plans: undefined;
	PlanDetail: { id: number };
	CreatePlan: undefined;
	Worlds: undefined;
	WorldDetail: { id: number };
	CreateWorld: undefined;
	Next: undefined;
	MemoryDetail: { id: number };
	Hashtag: { tag: string };
	MyMoments: undefined;
	CommunityRequests: { guid: number };
	CommunityModerators: { guid: number };
	CommunityMembers: { guid: number; isOwner?: boolean };
	Albums: { userGuid: number; isOwn: boolean };
	AlbumDetail: { guid: number };
	CreateAlbum: undefined;
	Report: { targetType: 'dating_profile' | 'post' | 'comment' | 'user' | 'group'; targetGuid: number };
	Collections: { userGuid?: number; isOwn: boolean };
	CollectionDetail: { id: number };
	CreateCollection: undefined;
	AddToCollection: { itemType: 'place' | 'event' | 'post'; itemGuid: number };
	AddToTrip: { itemType: 'place' | 'event'; itemGuid: number };
	AddToWorld: { itemType: 'place' | 'event' | 'plan' | 'experience'; itemGuid: number };
	Circles: undefined;
	CircleDetail: { id: number };
	CreateCircle: undefined;
	Trips: { userGuid?: number; isOwn: boolean };
	TripDetail: { id: number };
	CreateTrip: undefined;
	Experiences: { userGuid?: number; isOwn: boolean };
	ExperienceDetail: { id: number };
	// Optional real anchor (master build directive §56, "context
	// everywhere"): set when pushed from PlaceDetail/EventDetail so the
	// place/event is already attached, skipping the search step.
	CreateExperience: { initialAnchor?: {type: 'place' | 'event'; guid: number; title: string} } | undefined;
	CreatorProfile: { username: string };
	CreatorSettings: undefined;
	VideoFeed: undefined;
	VideoDetail: { postGuid: number };
	CreateVideo: undefined;
	MyVideos: { userGuid: number; isOwn: boolean };
	TrackFeed: undefined;
	TrackDetail: { postGuid: number };
	CreateTrack: undefined;
	MyTracks: { userGuid: number; isOwn: boolean };
	Memories: undefined;
	Wrapped: undefined;
	NearbyNow: undefined;
	Missions: undefined;
	LifeGraph: undefined;
	SocialMap: undefined;
	BusinessDashboard: { placeGuid: number };
	BusinessHome: { placeGuid: number };
	BusinessProfile: { placeGuid: number };
	BusinessProducts: { placeGuid: number };
	BusinessOffers: { placeGuid: number };
	BusinessTeam: { placeGuid: number };
	BusinessSettings: { placeGuid: number };
	Events: undefined;
	EventDetail: { guid: number };
	CreateEvent: undefined;
	EditEvent: { guid: number };
	EventInvite: { guid: number };
	SharePost: { postGuid: number };
	MyEvents: undefined;
	Places: undefined;
	PlaceDetail: { guid: number };
	CreatePlace: undefined;
	EditPlace: { guid: number };
	EditProfile: undefined;
	PlacesNearby: undefined;
	SavedPlaces: undefined;
	RecentCheckins: undefined;
	AdminUnvalidated: undefined;
	AdminReports: undefined;
	AdminPlaceClaims: undefined;
	MyPlaceClaims: undefined;
	BERXWorld: undefined;
	Saved: undefined;
}

export interface BerxRouteMeta {
	name: BerxRouteName;
	connected: boolean;
	/** Why connected=false, when applicable — so a "coming soon" screen can say something real instead of a generic placeholder. */
	notConnectedReason?: string;
}

export const BERX_ROUTES: BerxRouteMeta[] = [
	{ name: 'Splash', connected: true },
	{ name: 'Welcome', connected: true },
	{ name: 'Login', connected: true },
	{ name: 'Register', connected: true },
	{ name: 'Home', connected: true },
	{ name: 'Feed', connected: true },
	{ name: 'People', connected: true },
	{ name: 'Create', connected: true },
	{ name: 'PostDetail', connected: true },
	{ name: 'CreatePost', connected: true },
	{ name: 'Profile', connected: true },
	{ name: 'Search', connected: true },
	{ name: 'Messages', connected: true },
	{ name: 'Conversation', connected: true },
	{ name: 'MessageSearch', connected: true },
	{ name: 'Notifications', connected: true },
	{ name: 'Points', connected: true },
	{ name: 'Stories', connected: true },
	{ name: 'StoryViewer', connected: true },
	{ name: 'CreateStory', connected: true },
	{ name: 'Dating', connected: true },
	{ name: 'DatingMatch', connected: true },
	{ name: 'DatingMatches', connected: true },
	// MAX BUILD — real profile create/edit form. saveDatingProfile()/
	// getOwnDatingProfile() were always real client methods with zero
	// callers anywhere — there was no way to create a dating profile
	// from mobile at all (DatingDiscoverScreen's own error message
	// pointed users to the website instead).
	{ name: 'DatingProfile', connected: true },
	// MAX BUILD — real private-photo upload/access system: photos had
	// list/delete client methods with no upload endpoint at all until
	// this batch (dating.php's own header comment said so explicitly).
	{ name: 'DatingPhotos', connected: true },
	// MAX BUILD — searchDatingProfiles() was always a real client
	// method (real pseudonym search) with zero UI caller.
	{ name: 'DatingSearch', connected: true },
	{ name: 'DatingUserPhotos', connected: true },
	{ name: 'DatingPrivacy', connected: true },
	{ name: 'Settings', connected: true },
	{ name: 'DeviceSessions', connected: true },
	{ name: 'NotificationPreferences', connected: true },
	{ name: 'InviteFriends', connected: true },
	{ name: 'MyDrafts', connected: true },
	{ name: 'DeleteAccount', connected: true },
	{ name: 'BlockedUsers', connected: true },
	{ name: 'MutedUsers', connected: true },
	{ name: 'Communities', connected: true },
	{ name: 'CommunityDetail', connected: true },
	{ name: 'CreateCommunity', connected: true },
	{ name: 'Plans', connected: true },
	{ name: 'PlanDetail', connected: true },
	{ name: 'CreatePlan', connected: true },
	{ name: 'Worlds', connected: true },
	{ name: 'WorldDetail', connected: true },
	{ name: 'CreateWorld', connected: true },
	{ name: 'Next', connected: true },
	{ name: 'MemoryDetail', connected: true },
	{ name: 'Hashtag', connected: true },
	{ name: 'MyMoments', connected: true },
	{ name: 'CommunityRequests', connected: true },
	{ name: 'CommunityModerators', connected: true },
	{ name: 'CommunityMembers', connected: true },
	{ name: 'Albums', connected: true },
	{ name: 'AlbumDetail', connected: true },
	{ name: 'CreateAlbum', connected: true },
	// Events/Places were marked connected:false ("no backend module
	// exists at all") — stale. Both OssnEvents/OssnPlaces plus full
	// /api/v1 coverage (reviews, RSVP+capacity, invites, geo/nearby,
	// save) were built this session. Corrected here, not left wrong.
	{ name: 'Events', connected: true },
	{ name: 'EventDetail', connected: true },
	{ name: 'CreateEvent', connected: true },
	// MAX BUILD — updateEvent()/deleteEvent() were always real client
	// methods (real PATCH/DELETE routes) with zero UI callers -- an
	// organizer could create but never edit or cancel an event.
	{ name: 'EditEvent', connected: true },
	{ name: 'EventInvite', connected: true },
	{ name: 'SharePost', connected: true },
	{ name: 'MyEvents', connected: true },
	{ name: 'Places', connected: true },
	{ name: 'PlaceDetail', connected: true },
	{ name: 'CreatePlace', connected: true },
	// MAX BUILD — real edit/delete now exist. updatePlace()/deletePlace()
	// were always real client methods (real PATCH/DELETE routes) with
	// zero UI callers -- a place owner could create but never edit or
	// delete a place from the app.
	{ name: 'EditPlace', connected: true },
	// MAX BUILD — updateProfile() was always a real client method (real
	// PATCH /me route) with zero UI callers anywhere -- a user could
	// never change their own name/email/password from the app.
	{ name: 'EditProfile', connected: true },
	{ name: 'PlacesNearby', connected: true },
	{ name: 'SavedPlaces', connected: true },
	// MAX BUILD — recentCheckins() was always a real client method
	// (real geo-verified check-in history) with zero UI caller.
	{ name: 'RecentCheckins', connected: true },
	// MAX BUILD — both real screens now have a real entry point
	// (Profile's own Admin menu section, is_admin-gated) and a real,
	// working server-side admin gate (ossn_api_is_admin(), fixed from
	// the previously-broken session-dependent ossn_isAdminLoggedin()).
	{ name: 'AdminUnvalidated', connected: true },
	{ name: 'AdminReports', connected: true },
	// MAX BUILD — real business-claim review queue: approve/reject were
	// always real client methods with zero UI caller, and the
	// underlying admin gate itself was silently broken (session-
	// dependent check, fixed separately) until this batch.
	{ name: 'AdminPlaceClaims', connected: true },
	{ name: 'MyPlaceClaims', connected: true },
	{ name: 'Report', connected: true },
	{ name: 'Collections', connected: true },
	{ name: 'CollectionDetail', connected: true },
	{ name: 'CreateCollection', connected: true },
	{ name: 'AddToCollection', connected: true },
	// MAX BUILD — addTripStop() was always a real client method with
	// zero UI caller: a trip's itinerary could only ever shrink
	// (removeTripStop already wired), never actually be built.
	{ name: 'AddToTrip', connected: true },
	{ name: 'AddToWorld', connected: true },
	{ name: 'Circles', connected: true },
	{ name: 'CircleDetail', connected: true },
	{ name: 'CreateCircle', connected: true },
	{ name: 'Trips', connected: true },
	{ name: 'TripDetail', connected: true },
	{ name: 'CreateTrip', connected: true },
	{ name: 'Experiences', connected: true },
	{ name: 'ExperienceDetail', connected: true },
	{ name: 'CreateExperience', connected: true },
	{ name: 'CreatorProfile', connected: true },
	{ name: 'CreatorSettings', connected: true },
	{ name: 'VideoFeed', connected: true },
	{ name: 'VideoDetail', connected: true },
	{ name: 'CreateVideo', connected: true },
	{ name: 'MyVideos', connected: true },
	{ name: 'TrackFeed', connected: true },
	{ name: 'TrackDetail', connected: true },
	{ name: 'CreateTrack', connected: true },
	{ name: 'MyTracks', connected: true },
	{ name: 'Memories', connected: true },
	{ name: 'Wrapped', connected: true },
	{ name: 'NearbyNow', connected: true },
	{ name: 'Missions', connected: true },
	{ name: 'LifeGraph', connected: true },
	{ name: 'SocialMap', connected: true },
	{ name: 'BusinessDashboard', connected: true },
	{ name: 'BusinessHome', connected: true },
	{ name: 'BusinessProfile', connected: true },
	{ name: 'BusinessProducts', connected: true },
	{ name: 'BusinessOffers', connected: true },
	{ name: 'BusinessTeam', connected: true },
	{ name: 'BusinessSettings', connected: true },
	{ name: 'BERXWorld', connected: true },
	// MAX BUILD — real post save/unsave/saved-list now exists
	// (posts.php's post:save relation, separate from OssnCollections'
	// curated item_type='post' support and from SavedPlaces).
	{ name: 'Saved', connected: true },
];

/** Bottom tab bar — mobile only; web/desktop use a sidebar (not yet built). Five items, matching common social-app conventions (home/search/create/messages/menu). Dating and CreatePost dropped from the tab bar per explicit design feedback — still reachable (Dating via a button on Profile, CreatePost via a header action on Home), just not permanent tab-bar real estate. */
/**
 * BERX SPATIAL NAVIGATION — NOW / PEOPLE / CREATE / PLACES / PROFILE.
 * Search, Stories and Messages are NOT removed: Stories live inside
 * NOW's own live rail, Search is People's own search field plus the
 * full Search route, and Messages keeps its route and its unread
 * badge — they moved out of the tab bar, not out of the app.
 */
export const BERX_BOTTOM_TABS: BerxRouteName[] = ['Home', 'People', 'Create', 'Places', 'Profile'];
