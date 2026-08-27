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
	| 'DatingUserPhotos'
	| 'DatingMatch'
	| 'DatingMatches'
	| 'DatingPrivacy'
	| 'Settings'
	| 'DeviceSessions'
	| 'DeleteAccount'
	| 'BlockedUsers'
	| 'Communities'
	| 'CommunityDetail'
	| 'CreateCommunity'
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
	| 'MyEvents'
	| 'Places'
	| 'PlaceDetail'
	| 'CreatePlace'
	| 'EditPlace'
	| 'EditProfile'
	| 'PlacesNearby'
	| 'SavedPlaces'
	| 'AdminUnvalidated'
	| 'AdminReports'
	| 'BERXWorld'
	| 'Saved';

export interface BerxRouteParams {
	Splash: undefined;
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	Home: undefined;
	PostDetail: { postGuid: number };
	CreatePost: undefined;
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
	DatingUserPhotos: { userGuid: number; username: string };
	DatingPrivacy: undefined;
	Settings: undefined;
	DeviceSessions: undefined;
	DeleteAccount: undefined;
	BlockedUsers: undefined;
	Communities: undefined;
	CommunityDetail: { guid: number };
	CreateCommunity: undefined;
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
	Circles: undefined;
	CircleDetail: { id: number };
	CreateCircle: undefined;
	Trips: { userGuid?: number; isOwn: boolean };
	TripDetail: { id: number };
	CreateTrip: undefined;
	Experiences: { userGuid?: number; isOwn: boolean };
	ExperienceDetail: { id: number };
	CreateExperience: undefined;
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
	MyEvents: undefined;
	Places: undefined;
	PlaceDetail: { guid: number };
	CreatePlace: undefined;
	EditPlace: { guid: number };
	EditProfile: undefined;
	PlacesNearby: undefined;
	SavedPlaces: undefined;
	AdminUnvalidated: undefined;
	AdminReports: undefined;
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
	{ name: 'DatingUserPhotos', connected: true },
	{ name: 'DatingPrivacy', connected: true },
	{ name: 'Settings', connected: true },
	{ name: 'DeviceSessions', connected: true },
	{ name: 'DeleteAccount', connected: true },
	{ name: 'BlockedUsers', connected: true },
	{ name: 'Communities', connected: true },
	{ name: 'CommunityDetail', connected: true },
	{ name: 'CreateCommunity', connected: true },
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
	// MAX BUILD — both real screens now have a real entry point
	// (Profile's own Admin menu section, is_admin-gated) and a real,
	// working server-side admin gate (ossn_api_is_admin(), fixed from
	// the previously-broken session-dependent ossn_isAdminLoggedin()).
	{ name: 'AdminUnvalidated', connected: true },
	{ name: 'AdminReports', connected: true },
	{ name: 'Report', connected: true },
	{ name: 'Collections', connected: true },
	{ name: 'CollectionDetail', connected: true },
	{ name: 'CreateCollection', connected: true },
	{ name: 'AddToCollection', connected: true },
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
export const BERX_BOTTOM_TABS: BerxRouteName[] = ['Home', 'Search', 'Stories', 'Messages', 'Profile'];
