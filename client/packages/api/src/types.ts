/**
 * BERX shared types — mirror EXACTLY what components/OssnApi/v1/*.php
 * actually return. Every field here traces to a real PHP response
 * built this session. Do not add speculative fields for endpoints
 * that don't exist yet (feed pagination cursors, reactions, etc.) —
 * extend this file the same day the matching PHP endpoint ships, not
 * before.
 */

export interface BerxUser {
	guid: number;
	username: string;
	fullname: string;
	/** Real, separate fields (Max Build) alongside the combined `fullname` — lets a profile editor pre-fill exactly what updateProfile() accepts, no client-side guessing by splitting `fullname`. */
	first_name: string;
	last_name: string;
	email: string;
	icon_url: string;
	profile_url: string;
	time_created: number;
	reputation: BerxReputation;
	/** Real signal (Max Build) — server re-checks independently on every actual admin route; this only controls what the client offers to show. */
	is_admin: boolean;
}

export interface BerxAuthSession {
	token: string;
	user_guid: number;
	expires_at: number;
}

export interface BerxFeedItem {
	guid: number;
	text: string;
	owner_guid: number;
	owner_username: string | null;
	time_created: number;
}

/**
 * Wraps a real endpoint's list field with the limit/offset the server
 * actually echoes back — only used for endpoints confirmed in
 * API_PAGINATION.md as "paginated" (feed, dating/discover,
 * notifications). Endpoints marked "naturally bounded" or "requires
 * future backend extension" there do NOT get this wrapper — adding it
 * would claim a pagination contract the PHP side doesn't actually
 * honor.
 */
export interface BerxPaginationMeta {
	limit: number;
	offset: number;
}

export interface BerxFeedResponse extends BerxPaginationMeta {
	items: BerxFeedItem[];
}

export interface BerxPostDetail {
	guid: number;
	text: string;
	owner_guid: number;
	owner_username: string | null;
	time_created: number;
	/** Only on the single-post detail response — feed items deliberately don't carry these to avoid an N+1 count query per feed load (see feed.php's own comment). */
	like_count: number;
	comment_count: number;
	/** Real quick-bookmark state (Max Build) — a lighter, separate mechanism from Collections. Same N+1 reasoning as like_count/comment_count: not on feed items. */
	is_saved: boolean;
	/** Real server-verified state (Max Build) — OssnLikes::isLiked() was always real, just never surfaced here. */
	is_liked: boolean;
}

export interface BerxConversationSummary {
	with_guid: number;
	with_username: string | null;
	last_message: string;
	time: number;
	/** Real signal: the most recent message was sent to the caller and they haven't viewed it yet — not an exact unread count, but never fake. */
	has_unread: boolean;
}

export interface BerxMessage {
	id: number;
	from_guid: number;
	to_guid: number;
	text: string;
	time: number;
	/** Real disclosure — set by OssnMessages::editMessage(), never a silent rewrite of message history. */
	edited: boolean;
	time_edited: number | null;
	/** Real read receipt — OssnMessages::markViewed(), already called on every thread open. */
	viewed: boolean;
}

/** Future Identity — see docs/BERX_FUTURE_LAYER_SPEC.md. Real, live counts, no invented score. */
export interface BerxReputation {
	places_reviewed: number;
	events_going: number;
	trips_created: number;
	experiences_created: number;
}

/**
 * Future Identity (Max Build) — GET /identity/me. Profile + Life Graph
 * counts + Reputation + real progression as ONE composed response.
 * Achievements/interests are purely derived server-side (thresholds
 * over real counts / real category metadata) — never invented.
 */
export interface BerxIdentityReputation extends BerxReputation {
	places_saved: number;
	communities_joined: number;
	friends_count: number;
	checkins_count: number;
}

/**
 * Real geo-verified check-in — POST /places/{guid}/checkin. The
 * server re-verifies distance itself (OssnPlaces::checkIn()); this is
 * the client-visible outcome of that verification, never a claim the
 * client can assert on its own.
 */
export interface BerxCheckInResponse {
	status: 'ok';
	distance_m: number;
	points_awarded: number;
}

export interface BerxRecentCheckin {
	place: BerxPlace;
	time: number;
}

export interface BerxRecentCheckinsResponse {
	checkins: BerxRecentCheckin[];
}

export interface BerxIdentityInterest {
	category: string;
	count: number;
}

export interface BerxIdentityAchievement {
	key: string;
	value: number;
	/** 0 = not yet earned. label/tier_label are always real display text, never blank. */
	tier: number;
	label: string;
	tier_label: string | null;
	next_threshold: number | null;
}

export interface BerxIdentity {
	level: number;
	balance: number;
	lifetime_earned: number;
	current_streak: number;
	longest_streak: number;
	reputation: BerxIdentityReputation;
	interests: BerxIdentityInterest[];
	achievements: BerxIdentityAchievement[];
}

export interface BerxIdentityResponse {
	identity: BerxIdentity;
}

/**
 * People Discovery (Max Build) — GET /discovery/people. Real mutual-
 * friend suggestions, never a fake "similar interests" score.
 */
export interface BerxPeopleSuggestion {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	mutual_count: number;
	/** Real shared-community count (secondary re-rank signal alongside mutual_count) — privacy-safe by construction, same reasoning as BerxProfileSummary.mutual_communities_count. */
	mutual_communities_count: number;
}

export interface BerxPeopleDiscoveryResponse {
	people: BerxPeopleSuggestion[];
}

export interface BerxProfileSummary {
	guid: number;
	username: string;
	fullname: string;
	icon_url: string;
	profile_url: string;
	is_own: boolean;
	is_friend: boolean;
	is_creator: boolean;
	/** Real moderation state (OssnUser::ban()) — publicly visible, same as a suspended account on any real platform. */
	banned: boolean;
	reputation: BerxReputation;
	/** Real, bounded friend-list intersection (BERX World Max Build) — 0 on the caller's own profile, never estimated. */
	mutual_friends_count: number;
	/** Real, bounded community-membership intersection (BERX World Max Build) — privacy-safe, only ever intersects with the caller's own real memberships. */
	mutual_communities_count: number;
}

export interface BerxSearchUsersResponse {
	users: Array<{ guid: number; username: string; fullname: string }>;
}

export interface BerxDatingProfileCard {
	guid: number;
	pseudonym: string;
	age: number | null;
	city: string | null;
	goal: string | null;
	bio: string;
	interests: string;
}

export interface BerxReportQueueItem {
	id: number;
	reporter_guid: number;
	target_type: BerxReportTargetType;
	target_guid: number;
	reason: BerxReportReason;
	note: string | null;
	status: string;
	time_created: number;
}

export interface BerxDatingOwnProfile {
	guid: number;
	pseudonym: string;
	/** Real, matches the server response exactly — dating.php's own GET /dating/profile returns null when unset (fixed a real type inaccuracy that previously claimed this was never null). */
	age: number | null;
	city: string | null;
	goal: string | null;
	bio: string | null;
	interests: string | null;
}

export interface BerxDatingOwnPhoto {
	id: number;
	original_name: string;
	mime_type: string;
	time_created: number;
}

/** Another user's photo — never carries the file itself, only enough to request /media (if can_view) or send a real access request. */
export interface BerxDatingUserPhoto {
	id: number;
	mime_type: string;
	can_view: boolean;
}

export interface BerxDatingDiscoverResponse extends BerxPaginationMeta {
	profiles: BerxDatingProfileCard[];
}

export interface BerxDatingMatch {
	guid: number;
	username: string;
	fullname: string;
}

/** GET /dating/date-ideas — real Business World connection, top-rated real places near the caller's own dating location. */
export interface BerxDateIdea {
	guid: number;
	title: string;
	category: string | null;
	cover_url: string | null;
	rating: number;
	rating_count: number;
	distance_km: number;
}

export interface BerxNotification {
	guid: number;
	type: string;
	poster_guid: number;
	subject_guid: number;
	item_guid: number | null;
	viewed: boolean;
	time_created: number;
}

export interface BerxNotificationsResponse extends BerxPaginationMeta {
	notifications: BerxNotification[];
}

/**
 * Notification Preferences — see classes/OssnNotificationPrefs.php's
 * own header. Keys are the real notification type strings; `true`
 * means "notify" (the honest default — matches server-side "no muted
 * row exists"), `false` means muted, real and enforced server-side
 * inside OssnNotifications::add() itself.
 */
export type BerxNotificationPrefType =
	| 'dating:match'
	| 'dating:interest'
	| 'dating:photo:request'
	| 'dating:photo:granted'
	| 'berx:place:review'
	| 'berx:place:comment'
	| 'berx:event:rsvp'
	| 'berx:event:comment'
	| 'berx:event:invite'
	| 'ossnpoke:poke';

export type BerxNotificationPrefs = Record<BerxNotificationPrefType, boolean>;

/**
 * Life Graph — see docs/BERX_FUTURE_LAYER_SPEC.md. Real derived edges
 * over already-real data (saves/RSVPs/reviews/memberships/creations/
 * rewards/friend co-attendance), not a new store. `target_guid` is
 * null for 'earned_reward' (rewards aren't a linkable object); `amount`
 * is only present there; `context_guid` is only present on
 * 'met_person' (the shared event guid).
 */
export type BerxLifeGraphEdgeType =
	| 'saved_place'
	| 'going_event'
	| 'attended_event'
	| 'reviewed_place'
	| 'joined_community'
	| 'created_trip'
	| 'created_experience'
	| 'earned_reward'
	| 'met_person'
	| 'checked_in';

export interface BerxLifeGraphEdge {
	type: BerxLifeGraphEdgeType;
	target_type: 'place' | 'event' | 'community' | 'trip' | 'experience' | 'reward' | 'person';
	target_guid: number | null;
	target_title: string;
	time: number;
	amount?: number;
	context_guid?: number;
}

export interface BerxLifeGraphSummary {
	places_saved: number;
	checkins_count: number;
	places_reviewed: number;
	events_going: number;
	communities_joined: number;
	trips_created: number;
	experiences_created: number;
}

export interface BerxLifeGraphResponse {
	edges: BerxLifeGraphEdge[];
	summary: BerxLifeGraphSummary;
}

export interface BerxExperienceGraphFriend {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

/** Graph AROUND one place/event (real friends only) — see docs/BERX_FUTURE_LAYER_SPEC.md. */
export interface BerxPlaceExperienceGraph {
	target_type: 'place';
	target_guid: number;
	friends_saved: BerxExperienceGraphFriend[];
	friends_reviewed: BerxExperienceGraphFriend[];
	/** Real friends with a real geo-verified check-in here — a stronger-than-saved signal ("a friend was actually here"). */
	friends_checked_in: BerxExperienceGraphFriend[];
}

export interface BerxEventExperienceGraph {
	target_type: 'event';
	target_guid: number;
	friends_going: BerxExperienceGraphFriend[];
}

/** Radius-scoped summary header — see docs/BERX_FUTURE_LAYER_SPEC.md. Counts are bounded by the same real cap OssnGeo::near() uses, not a true city-wide total. */
export interface BerxCityModeMoment {
	id: number;
	text: string;
	ends_at: number;
	place_guid: number;
	place_title: string;
}

export interface BerxCityModeResponse {
	radius_km: number;
	places_count: number;
	events_count: number;
	active_moments_count: number;
	/** Real "live now" strip — soonest-ending first, capped at 10. Same rows nearby.php already trusts, not a new signal. */
	moments: BerxCityModeMoment[];
	friends_online_count: number;
}

export interface BerxSocialMapPlacePin {
	guid: number;
	title: string;
	category: string | null;
	lat: number | null;
	lng: number | null;
}

export interface BerxSocialMapEventPin {
	guid: number;
	title: string;
	starts: number;
	lat: number;
	lng: number;
}

export interface BerxSocialMapFriend {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

/**
 * Real "who's online right now" among your friends — no location
 * needed (unlike BerxSocialMapFriend, which requires submitting a
 * lat/lng first). Backed by GET /presence (BERX World Max Build) —
 * the endpoint always existed (`ossn_users.last_activity`, updated on
 * every real request core already makes) but had zero client caller.
 */
export interface BerxOnlineFriend {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	last_active: number;
}

/** See docs/BERX_FUTURE_LAYER_SPEC.md — friends_online is never geolocated (no real friend-location data exists or is exposed). */
export interface BerxSocialMapResponse {
	places: BerxSocialMapPlacePin[];
	events: BerxSocialMapEventPin[];
	friends_online: BerxSocialMapFriend[];
	radius_km: number;
}

/**
 * Daily Missions — mirrors components/OssnApi/v1/missions.php's fixed
 * in-code catalog exactly (key/title/points), not a DB-configurable
 * list. `completed` reflects today's real OssnPoints reason-string
 * claim (server date), not client-guessed.
 */
export interface BerxMission {
	key: string;
	title: string;
	points: number;
	completed: boolean;
}

export interface BerxMissionsResponse {
	date: string;
	missions: BerxMission[];
}

export type BerxWrappedPeriod = 'week' | 'month';

export interface BerxWrappedTopPlace {
	guid: number;
	title: string;
	visits: number;
}

export interface BerxWrapped {
	period: BerxWrappedPeriod;
	insufficient_data: boolean;
	posts_created?: number;
	trips_created?: number;
	experiences_count?: number;
	events_going?: number;
	places_saved?: number;
	checkins_count?: number;
	/** The single most-visited real place this period, or null with no check-ins. */
	top_place?: BerxWrappedTopPlace | null;
}

export interface BerxEventStoryItem {
	id: number;
	owner_guid: number;
	owner_username: string | null;
	caption: string;
	time_created: number;
	mime_type: string;
}

export interface BerxStorySummary {
	id: number;
	caption: string;
	time_created: number;
	mime_type: string;
}

export interface BerxOwnStorySummary extends BerxStorySummary {
	time_expires: number;
}

export interface BerxStoryFeedGroup {
	owner_guid: number;
	owner_username: string | null;
	stories: BerxStorySummary[];
}

export interface BerxBusinessMoment {
	id: number;
	place_guid: number;
	text: string;
	starts_at: number;
	ends_at: number;
}

/**
 * Real loyalty/promotion offer (BERX World Max Build) — never a
 * payment/coupon system, see OssnBusinessOffers's own header. A claim
 * is real intent ("I'll use this"); `active` reflects the server's
 * own live isActive() check (not-expired, under max_redemptions),
 * never a stale flag.
 */
export interface BerxBusinessOffer {
	id: number;
	place_guid: number;
	title: string;
	description: string;
	max_redemptions: number | null;
	redemptions_count: number;
	ends_at: number | null;
	active: boolean;
	time_created: number;
	/** Whether the calling viewer personally already has a claim row on this offer — lets the client render real claimed/unclaimed state instead of a button that always shows and just errors on a second tap. */
	already_claimed: boolean;
	/** Whether the calling viewer's own claim has been marked fulfilled by the business (real in-person use). */
	already_fulfilled: boolean;
}

/** One real claimant on the business owner's redemptions dashboard — `fulfilled` is only ever set by the owner marking real in-person use, never automatic. */
export interface BerxOfferRedemption {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	fulfilled: boolean;
	time_created: number;
	time_fulfilled: number | null;
}

export interface BerxOpeningInterval {
	/** 0 = Sunday, matching PHP date('w') and JS getDay(). */
	weekday: number;
	/** Minutes from midnight, place-local. */
	open: number;
	close: number;
}

export interface BerxPlaceHours {
	intervals: BerxOpeningInterval[];
	/** null = the place has no structured hours at all — genuinely different from "closed". */
	is_open_now: boolean | null;
}

export interface BerxNearbyPlaceItem {
	guid: number;
	title: string;
	category: string | null;
	cover_url: string | null;
	distance_km: number;
	moments: {id: number; text: string; ends_at: number}[];
	/** null = no structured hours entered; never conflate with closed. */
	is_open_now: boolean | null;
	/** Real friends who saved/reviewed this place — Personal World / Dynamic Discovery, see docs/BERX_FUTURE_LAYER_SPEC.md. Not a ranking BERX applies server-side; the client sorts by this if it wants a "who you know" view. */
	friends_count: number;
}

export interface BerxNearbyEventItem {
	guid: number;
	title: string;
	starts: number;
	place_guid: number;
	distance_km: number;
	/** Real friends who are going — see friends_count on BerxNearbyPlaceItem. */
	friends_count: number;
}

export interface BerxNearbyNow {
	places: BerxNearbyPlaceItem[];
	events: BerxNearbyEventItem[];
	open_now_available: false;
}

export interface BerxPointsBalance {
	balance: number;
	lifetime_earned: number;
	level: number;
	level_floor: number;
	level_ceiling: number | null;
	level_progress_ratio: number;
	current_streak: number;
	longest_streak: number;
	last_active_date: string | null;
}

export interface BerxStreakCheckIn {
	current_streak: number;
	longest_streak: number;
	is_new_day: boolean;
	milestone: 7 | 30 | null;
}

export interface BerxPointsHistoryEntry {
	delta: number;
	reason: string;
	time_created: number;
}

export interface BerxCommunity {
	guid: number;
	name: string;
	description: string;
	owner_guid: number;
	privacy: string | null;
	is_member: boolean;
}

export interface BerxCommunitiesResponse {
	communities: BerxCommunity[];
}

/**
 * Places — mirrors ossn_api_place_to_json() in
 * components/OssnApi/v1/places.php field-for-field. `category` is one
 * of OssnPlaces::categories()'s slugs (fetched separately via
 * placesCategories(), not hardcoded here as a union — the server owns
 * the whitelist).
 */
export type BerxBusinessType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'shop' | 'beauty' | 'fitness' | 'entertainment' | 'events' | 'services' | 'creators' | 'other';

export interface BerxPlace {
	guid: number;
	title: string;
	description: string;
	category: string | null;
	address: string | null;
	phone: string | null;
	website: string | null;
	hours: string | null;
	price: number | null;
	lat: number | null;
	lng: number | null;
	owner_guid: number;
	cover_url: string | null;
	rating: number;
	rating_count: number;
	is_saved: boolean;
	is_business: boolean;
	business_type: BerxBusinessType | null;
	verified: boolean;
}

export interface BerxNearbyImpressionSummary {
	shown: number;
	opened: number;
	saved: number;
	route: number;
}

export interface BerxBusinessCheckin {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	time: number;
}

export interface BerxBusinessDashboard {
	place_guid: number;
	is_business: boolean;
	verified: boolean;
	rating: number;
	rating_count: number;
	recent_reviews: BerxPlaceReview[];
	nearby_impressions: BerxNearbyImpressionSummary | null;
	/** Real events this business created at this place (place_guid metadata filter), not-ended, soonest first. */
	upcoming_events: BerxEvent[];
	/** Real customer activity — who actually, geo-verified, checked in. Owner-only. */
	recent_checkins: BerxBusinessCheckin[];
	/** Real Business <-> Communities connection — top 5 real communities this business's actual customers (checked-in or reviewed) belong to, most-overlapping first. Never a guessed audience. */
	top_customer_communities: BerxTopCustomerCommunity[];
	/** Real Business <-> Creators connection — up to 10 real Creator-mode customers of this business, a genuine basis for a collab outreach, never a guessed influence score. */
	creator_customers: BerxCreatorCustomer[];
}

/** One row of BerxBusinessDashboard.top_customer_communities. */
export interface BerxTopCustomerCommunity {
	guid: number;
	title: string;
	customer_count: number;
}

/** One row of BerxBusinessDashboard.creator_customers. */
export interface BerxCreatorCustomer {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	category: string | null;
}

export type BerxBusinessTeamRole = 'manager' | 'staff';

export interface BerxBusinessTeamMember {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	role: BerxBusinessTeamRole;
}

export type BerxSubscriptionStatus = 'none' | 'trial' | 'active' | 'expired';

export interface BerxBusinessSubscription {
	plan?: string;
	status: BerxSubscriptionStatus;
	trial_started_at?: number;
	trial_ends_at?: number;
	entitled: boolean;
	monthly_price_rub?: number;
}

/** Only present on /places/nearby results — see places.php's own nearby branch. */
export interface BerxNearbyPlace extends BerxPlace {
	distance_km: number;
}

export interface BerxPlaceCategory {
	slug: string;
	label: string;
}

export interface BerxPlaceReview {
	guid: number;
	rating: number;
	text: string;
	time: number;
	author: { guid: number; username: string; fullname: string; icon: string } | null;
	owner_reply: BerxOwnerReply | null;
}

/**
 * Events — mirrors ossn_api_event_to_json() field-for-field.
 * seats_left is null when the event is uncapped (OssnEvents::
 * seatsLeft() returns false in that case, which the PHP layer already
 * translates to JSON null — not a client-side guess).
 */
export interface BerxEvent {
	guid: number;
	title: string;
	description: string;
	category: string | null;
	starts: number;
	ends: number | null;
	location: string | null;
	place: { guid: number; title: string } | null;
	/** Real Communities <-> Events connection — set only when the organizer was actually a member of this community at tag time. */
	group: { guid: number; title: string } | null;
	capacity: number | null;
	seats_left: number | null;
	attendee_count: number;
	owner_guid: number;
	cover_url: string | null;
	has_ended: boolean;
	is_going: boolean;
	/** Real friend-relevance count (Max Build) — only populated by GET /events/going ("shared activities"), undefined everywhere else. */
	friends_going_count?: number;
	/** MAX BUILD — real waitlist state, viewer-scoped like is_going (see classes/OssnEvents.php's own Waitlist section). */
	is_waitlisted: boolean;
	waitlist_count: number;
}

export interface BerxEventAttendee {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

/**
 * RSVP failure shapes — status_map in events.php's /rsvp branch, kept
 * as a union so callers can branch on `error` without string-matching
 * the human-readable `message`.
 */
export type BerxRsvpErrorCode = 'full' | 'already_going' | 'ended' | 'forbidden' | 'rsvp_failed';

/** MAX BUILD — Event Waitlist failure shapes, same status_map idiom as BerxRsvpErrorCode. */
export type BerxWaitlistErrorCode = 'not_found' | 'ended' | 'already_going' | 'not_full' | 'already_waitlisted' | 'rsvp_failed';

/**
 * Comments on Places/Events — mirrors ossn_api_comment_to_json() in
 * components/OssnApi/v1/comments.php. `type` here is the request
 * discriminator the endpoint itself requires ('place' | 'event'), not
 * a field the server echoes back on each comment row.
 */
export interface BerxObjectComment {
	id: number;
	text: string;
	time: number;
	photo_url: string | null;
	author: { guid: number; username: string; fullname: string; icon: string } | null;
}

export type BerxCommentableType = 'place' | 'event';

/** Mirrors OssnApiToken::listSessions()'s real columns, exposed via GET /me/sessions. */
export interface BerxSession {
	id: number;
	device_label: string | null;
	created_at: number;
	last_used_at: number | null;
	expires_at: number;
}

/** GET /communities/{id}/requests — pending join requests, owner/admin only. */
export interface BerxCommunityRequest {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export interface BerxMessageSearchResult {
	text: string;
	time: number;
	outgoing: boolean;
	user: { guid: number; username: string; fullname: string; icon: string };
}

export interface BerxBlockedUser {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export type BerxReportTargetType = 'dating_profile' | 'post' | 'comment' | 'user' | 'group';
export type BerxReportReason = 'spam' | 'fake_profile' | 'harassment' | 'inappropriate_content' | 'underage' | 'other';

export interface BerxPlaceSearchResult {
	guid: number;
	title: string;
	category: string | null;
	cover_url: string | null;
	rating: number;
	/** Real social-relevance signal (Max Build) — results are already server-sorted friends-first by this. */
	friends_count: number;
}

export interface BerxEventSearchResult {
	guid: number;
	title: string;
	category: string | null;
	starts: number;
	cover_url: string | null;
	/** Real social-relevance signal (Max Build) — results are already server-sorted friends-first by this. */
	friends_count: number;
}

export interface BerxCommunitySearchResult {
	guid: number;
	title: string;
	owner: string | null;
	members: number;
	/** Real social-relevance signal (BERX World Max Build) — results are already server-sorted friends-first by this, same as BerxPlaceSearchResult/BerxEventSearchResult. */
	friends_count: number;
}

export interface BerxDatingPhotoRequest {
	access_id: number;
	photo_id: number;
	requester: { guid: number; username: string; fullname: string; icon: string };
}

export interface BerxUnvalidatedUser {
	guid: number;
	username: string;
	fullname: string;
	email: string;
	time_created: number;
}

export interface BerxGroupModerator {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export interface BerxFriend {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export interface BerxCommunityMember {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	is_owner: boolean;
}

export interface BerxAlbumPhoto {
	guid: number;
	url: string;
}

export interface BerxAlbum {
	guid: number;
	title: string;
	owner_guid: number;
	access: number | null;
	time_created: number;
}

export interface BerxAlbumDetail extends BerxAlbum {
	photos: BerxAlbumPhoto[];
}

export interface BerxPostComment {
	id: number;
	text: string;
	time: number;
	photo_url: string | null;
	author: { guid: number; username: string; fullname: string; icon: string } | null;
}

export type BerxCollectionItemType = 'place' | 'event' | 'post';
export type BerxCollectionVisibility = 'private' | 'public';

export interface BerxCollection {
	id: number;
	title: string;
	description: string;
	visibility: BerxCollectionVisibility;
	owner_guid: number;
	is_own: boolean;
	item_count: number;
	time_updated: number;
}

export interface BerxCollectionItem {
	item_type: BerxCollectionItemType;
	item_guid: number;
	title: string;
	image_url: string | null;
}

export interface BerxCollectionDetail extends BerxCollection {
	items: BerxCollectionItem[];
}

export type BerxCircleKind = 'family' | 'work' | 'travel' | 'close_friends' | null;

export interface BerxCircleMember {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export interface BerxCircle {
	id: number;
	name: string;
	kind: BerxCircleKind;
	owner_guid: number;
	member_count: number;
	time_created: number;
}

export interface BerxCircleDetail extends BerxCircle {
	members: BerxCircleMember[];
}

export type BerxTripItemType = 'place' | 'event';

export interface BerxTripStop {
	stop_id: number;
	item_type: BerxTripItemType;
	item_guid: number;
	title: string;
	image_url: string | null;
	day_number: number;
	note: string | null;
}

export interface BerxTripParticipant {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
}

export interface BerxTrip {
	id: number;
	title: string;
	description: string;
	visibility: BerxCollectionVisibility;
	owner_guid: number;
	is_own: boolean;
	start_date: number | null;
	end_date: number | null;
	stop_count: number;
	time_updated: number;
}

export interface BerxTripDetail extends BerxTrip {
	stops: BerxTripStop[];
	participants: BerxTripParticipant[];
}

export type BerxExperienceAnchorType = 'place' | 'event';
export type BerxParticipantStatus = 'invited' | 'accepted' | 'declined';

export interface BerxExperienceAnchor {
	type: BerxExperienceAnchorType;
	guid: number;
	title: string;
	image_url: string | null;
}

export interface BerxExperienceParticipant {
	guid: number;
	username: string;
	fullname: string;
	icon: string;
	status: BerxParticipantStatus;
}

export interface BerxExperience {
	id: number;
	title: string;
	description: string;
	anchor: BerxExperienceAnchor | null;
	visibility: BerxCollectionVisibility;
	owner_guid: number;
	is_own: boolean;
	scheduled_start: number;
	scheduled_end: number | null;
	my_status: BerxParticipantStatus | null;
}

export interface BerxExperienceDetail extends BerxExperience {
	participants: BerxExperienceParticipant[];
}

export interface BerxCreatorAudience {
	friend_count: number;
	total_views: number;
	views_last_30_days: number;
}

export interface BerxCreatorProfile {
	user_guid: number;
	category: string | null;
	bio: string | null;
	is_own: boolean;
	time_enabled: number;
	audience: BerxCreatorAudience;
}

export interface BerxCreatorPostItem {
	guid: number;
	text: string;
	time: number;
}

export interface BerxCreatorAlbumItem {
	guid: number;
	title: string;
}

export interface BerxCreatorEventItem {
	guid: number;
	title: string;
	starts: number;
	image_url: string | null;
}

export interface BerxCreatorExperienceItem {
	id: number;
	title: string;
	anchor_title: string | null;
	image_url: string | null;
	scheduled_start: number;
}

export interface BerxCreatorContent {
	posts: BerxCreatorPostItem[];
	albums: BerxCreatorAlbumItem[];
	events: BerxCreatorEventItem[];
	experiences: BerxCreatorExperienceItem[];
}

export type BerxMediaType = 'image' | 'video' | 'audio';

export interface BerxMediaAsset {
	guid: number;
	owner_guid: number;
	media_type: BerxMediaType;
	mime: string;
	width: number | null;
	height: number | null;
	duration_seconds: number | null;
	status: string;
	context_type: string | null;
	context_guid: number | null;
	url: string | null;
	time_created: number;
}

export interface BerxVideoAsset {
	asset_guid: number;
	url: string;
	width: number | null;
	height: number | null;
	duration_seconds: number | null;
}

export interface BerxVideoPost {
	post_guid: number;
	text: string;
	owner_guid: number;
	owner_username: string | null;
	owner_icon: string | null;
	time_created: number;
	like_count: number;
	comment_count: number;
	video: BerxVideoAsset;
}

export interface BerxTrackAsset {
	asset_guid: number;
	url: string;
	duration_seconds: number | null;
}

export interface BerxTrackPost {
	post_guid: number;
	text: string;
	owner_guid: number;
	owner_username: string | null;
	owner_icon: string | null;
	time_created: number;
	like_count: number;
	comment_count: number;
	track: BerxTrackAsset;
}

export interface BerxOwnerReply {
	text: string;
	time_created: number;
}

export type BerxClaimStatus = 'pending' | 'approved' | 'rejected';

export interface BerxPlaceClaim {
	id: number;
	place_guid: number;
	requester_guid: number;
	message: string | null;
	status: BerxClaimStatus;
	time_created: number;
	time_reviewed: number | null;
}

export type BerxMemoryType = 'post' | 'photo' | 'checkin';

/**
 * Post visibility — server-authoritative, checked at every read path
 * (posts.php GET/comments, feed.php, videos.php, tracks.php,
 * collections.php, OssnCreator::recentPosts()). Absent = 'public'.
 * A `circle:{id}` value is only accepted server-side if the caller
 * actually owns that circle.
 */
export type BerxPostVisibility = 'public' | 'friends' | `circle:${number}`;

export interface BerxMemory {
	type: BerxMemoryType;
	guid: number;
	years_ago: number;
	time: number;
	text?: string;
	url?: string;
	album_guid?: number;
	/** 'checkin' only — real place title from the real check-in row. */
	place_title?: string;
}

/**
 * Error response shape lives in @berx/core as BerxApiErrorBody, not
 * duplicated here — this file is response/request DATA types only,
 * transport-level error shape belongs with the transport primitives.
 */
