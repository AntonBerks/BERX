import type {
	BerxAuthSession,
	BerxFeedResponse,
	BerxUser,
	BerxPostDetail,
	BerxConversationSummary,
	BerxMessage,
	BerxProfileSummary,
	BerxSearchUsersResponse,
	BerxDatingDiscoverResponse,
	BerxDatingMatch,
	BerxDateIdea,
	BerxNotificationsResponse,
	BerxStoryFeedGroup,
	BerxOwnStorySummary,
	BerxCommunity,
	BerxCommunitiesResponse,
	BerxPointsBalance,
	BerxStreakCheckIn,
	BerxNearbyNow,
	BerxBusinessMoment,
	BerxBusinessOffer,
	BerxOfferRedemption,
	BerxDatingOwnProfile,
	BerxDatingOwnPhoto,
	BerxDatingUserPhoto,
	BerxDatingProfileCard,
	BerxPlaceHours,
	BerxOpeningInterval,
	BerxEventStoryItem,
	BerxWrapped,
	BerxLifeGraphResponse,
	BerxSocialMapResponse,
	BerxOnlineFriend,
	BerxPlaceExperienceGraph,
	BerxEventExperienceGraph,
	BerxCityModeResponse,
	BerxIdentityResponse,
	BerxPeopleDiscoveryResponse,
	BerxCheckInResponse,
	BerxRecentCheckinsResponse,
	BerxMissionsResponse,
	BerxPointsHistoryEntry,
	BerxPlace,
	BerxBusinessDashboard,
	BerxNearbyPlace,
	BerxPlaceCategory,
	BerxPlaceReview,
	BerxEvent,
	BerxEventAttendee,
	BerxObjectComment,
	BerxCommentableType,
	BerxSession,
	BerxCommunityRequest,
	BerxMessageSearchResult,
	BerxBlockedUser,
	BerxReportTargetType,
	BerxReportQueueItem,
	BerxReportReason,
	BerxPlaceSearchResult,
	BerxEventSearchResult,
	BerxCommunitySearchResult,
	BerxDatingPhotoRequest,
	BerxUnvalidatedUser,
	BerxGroupModerator,
	BerxFriend,
	BerxCommunityMember,
	BerxAlbum,
	BerxAlbumDetail,
	BerxPostComment,
	BerxCollection,
	BerxCollectionDetail,
	BerxCollectionItemType,
	BerxCollectionVisibility,
	BerxCircle,
	BerxCircleDetail,
	BerxCircleKind,
	BerxTrip,
	BerxTripDetail,
	BerxTripItemType,
	BerxExperience,
	BerxExperienceDetail,
	BerxCreatorProfile,
	BerxCreatorContent,
	BerxVideoPost,
	BerxTrackPost,
	BerxMediaAsset,
	BerxPlaceClaim,
	BerxBusinessTeamMember,
	BerxBusinessTeamRole,
	BerxBusinessSubscription,
	BerxBusinessType,
	BerxMemory,
	BerxPostVisibility,
} from './types';
import type { BerxTokenStorage, BerxApiErrorBody } from '@berx/core';
import { BerxApiError } from '@berx/core';

/**
 * A file to upload, in whichever shape the calling platform naturally
 * produces one: a real Blob/File on web, or React Native's
 * {uri,name,type} object (RN's global FormData shim accepts this
 * directly at runtime — documented, stable RN behavior, not a guess).
 * The DOM lib's FormData.append() typing only knows about Blob, which
 * is exactly why appendFilePart() below needs one narrow, explicit
 * cast for the RN branch — not `any` anywhere.
 */
export type BerxFilePart = Blob | { uri: string; name: string; type: string };

function appendFilePart(form: FormData, field: string, part: BerxFilePart, filename?: string) {
	if (typeof Blob !== 'undefined' && part instanceof Blob) {
		form.append(field, part, filename);
	} else {
		form.append(field, part as unknown as Blob);
	}
}

/**
 * Thin, honest wrapper — one method per endpoint that actually exists
 * in components/OssnApi/v1/ right now (auth/login, auth/logout, me,
 * feed). Do not add a method here for an endpoint that isn't real yet;
 * a client method that 404s is worse than no method at all, because
 * it looks finished.
 */
export class BerxApiClient {
	private baseUrl: string;
	private storage: BerxTokenStorage;

	constructor(baseUrl: string, storage: BerxTokenStorage) {
		// Trim a trailing slash so callers can pass either
		// 'https://berx.online' or 'https://berx.online/' safely.
		this.baseUrl = baseUrl.replace(/\/+$/, '');
		this.storage = storage;
	}

	/**
	 * Public — used both internally by request() and directly by UI
	 * code that needs to fetch an authenticated resource RN's own
	 * components can request (e.g. <Image source={{uri, headers}}>
	 * for a private story's media, which needs the same bearer/
	 * fallback headers but isn't going through request() at all).
	 */
	async getAuthHeaders(): Promise<Record<string, string>> {
		const token = await this.storage.getToken();
		if (!token) return {};
		// Primary channel. See ossn_api_bearer_token()'s documented
		// fallback (X-Api-Token) on the PHP side for the case a hosting
		// environment strips this header — sent unconditionally, since
		// it costs nothing when the standard header does arrive intact.
		return { Authorization: `Bearer ${token}`, 'X-Api-Token': token };
	}

	private async request<T>(
		path: string,
		options: {
			method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
			body?: Record<string, string>;
			multipart?: { fields?: Record<string, string>; files: Array<{ field: string; part: BerxFilePart; filename?: string }> };
			auth?: boolean;
		} = {}
	): Promise<T> {
		const { method = 'GET', body, multipart, auth = true } = options;
		const headers: Record<string, string> = {};
		let fetchBody: string | FormData | undefined;

		if (multipart) {
			const form = new FormData();
			if (multipart.fields) {
				for (const [k, v] of Object.entries(multipart.fields)) {
					form.append(k, v);
				}
			}
			for (const f of multipart.files) {
				appendFilePart(form, f.field, f.part, f.filename);
			}
			fetchBody = form;
			// Deliberately NOT setting Content-Type here — fetch computes
			// the correct `multipart/form-data; boundary=...` header
			// itself only when it builds the body encoding, and only if
			// nothing already set Content-Type. Setting it manually would
			// omit the boundary parameter the server needs to parse the
			// body at all, silently breaking every upload.
		} else if (body) {
			headers['Content-Type'] = 'application/x-www-form-urlencoded';
			fetchBody = Object.entries(body)
				.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join('&');
		}

		if (auth) {
			const authHeaders = await this.getAuthHeaders();
			Object.assign(headers, authHeaders);
		}

		const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
			method,
			headers,
			body: fetchBody,
		});

		const json = await res.json();
		if (!res.ok) {
			throw new BerxApiError(res.status, json as BerxApiErrorBody);
		}
		return json as T;
	}

	/**
	 * Matches auth.php's real 'register' action field names exactly
	 * (username, firstname, lastname, email, password — see
	 * components/OssnApi/v1/auth.php). Returns no token — the real API
	 * requires email activation before login() will succeed, matching
	 * the web signup flow exactly (see that file's own comment).
	 */
	async register(fields: {
		username: string;
		firstname: string;
		lastname: string;
		email: string;
		password: string;
	}): Promise<{status: string; message: string}> {
		return this.request<{status: string; message: string}>('/auth/register', {
			method: 'POST',
			auth: false,
			body: fields,
		});
	}

	async login(usernameOrEmail: string, password: string, deviceLabel?: string): Promise<BerxAuthSession> {
		const session = await this.request<BerxAuthSession>('/auth/login', {
			method: 'POST',
			auth: false,
			body: {
				username_or_email: usernameOrEmail,
				password,
				...(deviceLabel ? { device_label: deviceLabel } : {}),
			},
		});
		await this.storage.setToken(session.token);
		return session;
	}

	async logout(): Promise<void> {
		try {
			await this.request<{ status: string }>('/auth/logout', { method: 'POST' });
		} finally {
			// Clear locally even if the network call fails — a client
			// that still holds a token after "logout" because the
			// revoke request happened to time out is a real, if minor,
			// privacy issue on a shared/lost device.
			await this.storage.setToken(null);
		}
	}

	async me(): Promise<BerxUser> {
		return this.request<BerxUser>('/me');
	}

	async updateProfile(fields: {firstname?: string; lastname?: string; email?: string; password?: string}): Promise<BerxUser> {
		return this.request<BerxUser>('/me', {method: 'PATCH', body: fields as Record<string, string>});
	}

	/**
	 * Field name is 'userphoto' to match components/OssnApi/v1/me.php
	 * exactly (`$_FILES['userphoto']`) — not a generic 'file' or
	 * 'avatar' name, since PHP's $_FILES key comes straight from the
	 * multipart field name the client sends.
	 */
	async uploadAvatar(part: BerxFilePart, filename = 'avatar.jpg'): Promise<{status: string; icon_url: string}> {
		return this.request<{status: string; icon_url: string}>('/me/avatar', {
			method: 'POST',
			multipart: { files: [{ field: 'userphoto', part, filename }] },
		});
	}

	async feed(limit = 20, offset = 0): Promise<BerxFeedResponse> {
		return this.request<BerxFeedResponse>(`/feed?limit=${limit}&offset=${offset}`);
	}

	/** visibility defaults to public server-side when omitted — every pre-existing post stays exactly as visible as it always was. */
	async createPost(text: string, visibility?: BerxPostVisibility): Promise<{guid: number}> {
		return this.request<{guid: number}>('/posts', {method: 'POST', body: {text, ...(visibility ? {visibility} : {})}});
	}

	async getPost(id: number): Promise<BerxPostDetail> {
		return this.request<BerxPostDetail>(`/posts/${id}`);
	}

	async likePost(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/posts/${id}/like`, {method: 'POST'});
	}

	/** Real unlike (Max Build) — OssnLikes::UnLike() was always real, wasn't wired to a route before. */
	async unlikePost(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/posts/${id}/unlike`, {method: 'POST'});
	}

	/** Real quick bookmark (Max Build) — separate from Collections' curated save. */
	async savePost(id: number): Promise<{status: string; is_saved: boolean}> {
		return this.request<{status: string; is_saved: boolean}>(`/posts/${id}/save`, {method: 'POST'});
	}

	async unsavePost(id: number): Promise<{status: string; is_saved: boolean}> {
		return this.request<{status: string; is_saved: boolean}>(`/posts/${id}/unsave`, {method: 'POST'});
	}

	async savedPosts(): Promise<{posts: BerxPostDetail[]}> {
		return this.request<{posts: BerxPostDetail[]}>('/posts/saved');
	}

	async commentOnPost(id: number, text: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/posts/${id}/comments`, {method: 'POST', body: {text}});
	}

	/** Closes a previously disclosed gap — comments were write-only until this session. */
	async postComments(id: number): Promise<{comments: BerxPostComment[]}> {
		return this.request<{comments: BerxPostComment[]}>(`/posts/${id}/comments`);
	}

	/** Author or admin only — enforced server-side against the stored comment's own owner_guid. */
	async deletePostComment(postId: number, commentId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/posts/${postId}/comments/${commentId}/delete`, {method: 'POST'});
	}

	// ---------------------------------------------------------------
	// Collections — components/OssnApi/v1/collections.php. New domain
	// this session, backed by real ossn_collections/ossn_collection_items
	// tables. All authorization (owner-only mutation, visibility-gated
	// read) lives server-side in OssnCollections — mirrored here only
	// as types, never re-derived client-side.
	// ---------------------------------------------------------------

	/** Omit userGuid to get the caller's own collections. */
	async collections(userGuid?: number): Promise<{collections: BerxCollection[]}> {
		const qs = userGuid !== undefined ? `?user=${userGuid}` : '';
		return this.request<{collections: BerxCollection[]}>(`/collections${qs}`);
	}

	async getCollection(id: number): Promise<BerxCollectionDetail> {
		return this.request<BerxCollectionDetail>(`/collections/${id}`);
	}

	async createCollection(title: string, description?: string, visibility: BerxCollectionVisibility = 'private'): Promise<{id: number}> {
		return this.request<{id: number}>('/collections', {
			method: 'POST',
			body: {title, ...(description ? {description} : {}), visibility},
		});
	}

	async updateCollection(id: number, fields: Partial<{title: string; description: string; visibility: BerxCollectionVisibility}>): Promise<BerxCollection> {
		const body: Record<string, string> = {};
		if (fields.title !== undefined) body.title = fields.title;
		if (fields.description !== undefined) body.description = fields.description;
		if (fields.visibility !== undefined) body.visibility = fields.visibility;
		return this.request<BerxCollection>(`/collections/${id}`, {method: 'PATCH', body});
	}

	async deleteCollection(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/collections/${id}`, {method: 'DELETE'});
	}

	/** itemExists() is re-checked server-side — adding a guid for a deleted place/event/post fails with a real 404, never silently "succeeds". */
	async addCollectionItem(collectionId: number, itemType: BerxCollectionItemType, itemGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/collections/${collectionId}/items`, {
			method: 'POST',
			body: {item_type: itemType, item_guid: String(itemGuid)},
		});
	}

	async removeCollectionItem(collectionId: number, itemType: BerxCollectionItemType, itemGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/collections/${collectionId}/items/${itemType}/${itemGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Circles — components/OssnApi/v1/circles.php. New domain this
	// session, real ossn_circles/ossn_circle_members tables. Strictly
	// owner-only (no public tier, unlike Collections). Membership is
	// constrained to real friends server-side (OssnUser::isFriend()) —
	// this is not a second contact list.
	// ---------------------------------------------------------------

	async circles(): Promise<{circles: BerxCircle[]}> {
		return this.request<{circles: BerxCircle[]}>('/circles');
	}

	async getCircle(id: number): Promise<BerxCircleDetail> {
		return this.request<BerxCircleDetail>(`/circles/${id}`);
	}

	async createCircle(name: string, kind?: Exclude<BerxCircleKind, null>): Promise<{id: number}> {
		return this.request<{id: number}>('/circles', {method: 'POST', body: {name, ...(kind ? {kind} : {})}});
	}

	async renameCircle(id: number, name: string): Promise<BerxCircle> {
		return this.request<BerxCircle>(`/circles/${id}`, {method: 'PATCH', body: {name}});
	}

	async deleteCircle(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/circles/${id}`, {method: 'DELETE'});
	}

	/** Rejected server-side with a real 'not_a_friend' error unless the target is a confirmed friend. */
	async addCircleMember(circleId: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/circles/${circleId}/members/${userGuid}`, {method: 'POST'});
	}

	async removeCircleMember(circleId: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/circles/${circleId}/members/${userGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Trips — components/OssnApi/v1/trips.php. New domain this
	// session: real ossn_trips/ossn_trip_stops/ossn_trip_participants
	// tables, built on already-real Places/Events + friends. Owner
	// edits; owner + real participants can view (public trips are
	// viewable by anyone).
	// ---------------------------------------------------------------

	/** Omit userGuid for the caller's own trips (owned + participant-of, deduplicated server-side). */
	async trips(userGuid?: number): Promise<{trips: BerxTrip[]}> {
		const qs = userGuid !== undefined ? `?user=${userGuid}` : '';
		return this.request<{trips: BerxTrip[]}>(`/trips${qs}`);
	}

	async getTrip(id: number): Promise<BerxTripDetail> {
		return this.request<BerxTripDetail>(`/trips/${id}`);
	}

	async createTrip(fields: {title: string; description?: string; visibility?: BerxCollectionVisibility; startDate?: number; endDate?: number}): Promise<{id: number}> {
		const body: Record<string, string> = {title: fields.title};
		if (fields.description) body.description = fields.description;
		if (fields.visibility) body.visibility = fields.visibility;
		if (fields.startDate) body.start_date = String(fields.startDate);
		if (fields.endDate) body.end_date = String(fields.endDate);
		return this.request<{id: number}>('/trips', {method: 'POST', body});
	}

	async updateTrip(id: number, fields: Partial<{title: string; description: string; visibility: BerxCollectionVisibility; startDate: number | null; endDate: number | null}>): Promise<BerxTrip> {
		const body: Record<string, string> = {};
		if (fields.title !== undefined) body.title = fields.title;
		if (fields.description !== undefined) body.description = fields.description;
		if (fields.visibility !== undefined) body.visibility = fields.visibility;
		if (fields.startDate !== undefined) body.start_date = fields.startDate === null ? '' : String(fields.startDate);
		if (fields.endDate !== undefined) body.end_date = fields.endDate === null ? '' : String(fields.endDate);
		return this.request<BerxTrip>(`/trips/${id}`, {method: 'PATCH', body});
	}

	async deleteTrip(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/trips/${id}`, {method: 'DELETE'});
	}

	/** itemExists() is re-checked server-side — adding a deleted place/event fails with a real 404. */
	async addTripStop(tripId: number, itemType: BerxTripItemType, itemGuid: number, dayNumber = 1, note?: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/trips/${tripId}/stops`, {
			method: 'POST',
			body: {item_type: itemType, item_guid: String(itemGuid), day_number: String(dayNumber), ...(note ? {note} : {})},
		});
	}

	async removeTripStop(tripId: number, stopId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/trips/${tripId}/stops/${stopId}`, {method: 'DELETE'});
	}

	/** Rejected server-side with a real 'not_a_friend' error unless the target is a confirmed friend. */
	async addTripParticipant(tripId: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/trips/${tripId}/participants/${userGuid}`, {method: 'POST'});
	}

	async removeTripParticipant(tripId: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/trips/${tripId}/participants/${userGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Experiences — components/OssnApi/v1/experiences.php. New domain
	// this session: real ossn_experiences/ossn_experience_participants
	// tables. Anchored to exactly one real Place or Event; NO ticket/
	// payment lifecycle — that infrastructure doesn't exist and isn't
	// faked. Participants are INVITED real friends who accept/decline
	// themselves, unlike Trips' simpler add/remove model.
	// ---------------------------------------------------------------

	async experiences(userGuid?: number): Promise<{experiences: BerxExperience[]}> {
		const qs = userGuid !== undefined ? `?user=${userGuid}` : '';
		return this.request<{experiences: BerxExperience[]}>(`/experiences${qs}`);
	}

	async getExperience(id: number): Promise<BerxExperienceDetail> {
		return this.request<BerxExperienceDetail>(`/experiences/${id}`);
	}

	/** Exactly one of placeGuid/eventGuid — the server rejects both or neither with a real create_failed error. */
	async createExperience(fields: {
		title: string;
		description?: string;
		placeGuid?: number;
		eventGuid?: number;
		scheduledStart: number;
		scheduledEnd?: number;
		visibility?: BerxCollectionVisibility;
	}): Promise<{id: number}> {
		const body: Record<string, string> = {title: fields.title, scheduled_start: String(fields.scheduledStart)};
		if (fields.description) body.description = fields.description;
		if (fields.placeGuid) body.place_guid = String(fields.placeGuid);
		if (fields.eventGuid) body.event_guid = String(fields.eventGuid);
		if (fields.scheduledEnd) body.scheduled_end = String(fields.scheduledEnd);
		if (fields.visibility) body.visibility = fields.visibility;
		return this.request<{id: number}>('/experiences', {method: 'POST', body});
	}

	async updateExperience(id: number, fields: Partial<{title: string; description: string; scheduledStart: number; scheduledEnd: number | null; visibility: BerxCollectionVisibility}>): Promise<BerxExperience> {
		const body: Record<string, string> = {};
		if (fields.title !== undefined) body.title = fields.title;
		if (fields.description !== undefined) body.description = fields.description;
		if (fields.scheduledStart !== undefined) body.scheduled_start = String(fields.scheduledStart);
		if (fields.scheduledEnd !== undefined) body.scheduled_end = fields.scheduledEnd === null ? '' : String(fields.scheduledEnd);
		if (fields.visibility !== undefined) body.visibility = fields.visibility;
		return this.request<BerxExperience>(`/experiences/${id}`, {method: 'PATCH', body});
	}

	async deleteExperience(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/experiences/${id}`, {method: 'DELETE'});
	}

	/** Rejected server-side with 'not_a_friend' unless the target is a confirmed friend. */
	async inviteToExperience(id: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/experiences/${id}/invite/${userGuid}`, {method: 'POST'});
	}

	async respondToExperience(id: number, accept: boolean): Promise<{status: string}> {
		return this.request<{status: string}>(`/experiences/${id}/respond`, {method: 'POST', body: {accept: accept ? '1' : '0'}});
	}

	/** Owner removes an invitee, or an invitee removes themselves — enforced server-side. */
	async removeExperienceParticipant(id: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/experiences/${id}/participants/${userGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Creator — components/OssnApi/v1/creator.php. New domain this
	// session: a real profile extension + real view-event log + real
	// content aggregation over already-real posts/albums/events/
	// experiences. No engagement rate, growth trend, or follower
	// projection anywhere — none of those have a real data source.
	// ---------------------------------------------------------------

	async getCreatorProfile(username: string): Promise<BerxCreatorProfile> {
		return this.request<BerxCreatorProfile>(`/creator/${username}`);
	}

	async getCreatorContent(username: string): Promise<BerxCreatorContent> {
		return this.request<BerxCreatorContent>(`/creator/${username}/content`);
	}

	/** Self-views are never recorded server-side — a creator can't inflate their own count by visiting their own profile. */
	async recordCreatorView(username: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/creator/${username}/view`, {method: 'POST'});
	}

	async enableCreatorMode(category?: string, bio?: string): Promise<{status: string}> {
		return this.request<{status: string}>('/creator/enable', {method: 'POST', body: {...(category ? {category} : {}), ...(bio ? {bio} : {})}});
	}

	async disableCreatorMode(): Promise<{status: string}> {
		return this.request<{status: string}>('/creator/disable', {method: 'POST'});
	}

	async updateCreatorProfile(fields: {category?: string; bio?: string}): Promise<BerxCreatorProfile> {
		const body: Record<string, string> = {};
		if (fields.category !== undefined) body.category = fields.category;
		if (fields.bio !== undefined) body.bio = fields.bio;
		return this.request<BerxCreatorProfile>('/creator', {method: 'PATCH', body});
	}

	// ---------------------------------------------------------------
	// Media Assets — components/OssnApi/v1/media.php. Generic upload/
	// metadata/attach layer on top of the real OssnFile storage
	// system (never duplicates its resize/MIME/CDN logic). Supports
	// image/video/audio — OssnFile::mimeTypes() already whitelists
	// mp4/mp3 alongside images. duration_seconds is always null for
	// video/audio: no real transcoding/probing pipeline exists in
	// this environment to measure it honestly, so it's never
	// estimated. Read URLs are public-by-guid (same trust model as
	// every other media URL in this codebase — Place/Event covers
	// work the same way); write operations (delete/attach/detach)
	// require a valid bearer token and real ownership.
	// ---------------------------------------------------------------

	async uploadMedia(part: BerxFilePart, filename: string): Promise<BerxMediaAsset> {
		return this.request<BerxMediaAsset>('/media', {method: 'POST', multipart: {files: [{field: 'file', part, filename}]}});
	}

	async getMediaAsset(guid: number): Promise<BerxMediaAsset> {
		return this.request<BerxMediaAsset>(`/media/${guid}`);
	}

	async deleteMediaAsset(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/media/${guid}`, {method: 'DELETE'});
	}

	/** contextType is caller-defined (e.g. 'post', 'creator') — the server stores it as-is, no whitelist enforced yet since no consuming feature requires one. */
	async attachMedia(guid: number, contextType: string, contextGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/media/${guid}/attach`, {method: 'POST', body: {context_type: contextType, context_guid: String(contextGuid)}});
	}

	async detachMedia(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/media/${guid}/detach`, {method: 'POST'});
	}

	async mediaByContext(contextType: string, contextGuid: number): Promise<{media: BerxMediaAsset[]}> {
		return this.request<{media: BerxMediaAsset[]}>(`/media/context/${contextType}/${contextGuid}`);
	}

	// ---------------------------------------------------------------
	// Video — components/OssnApi/v1/videos.php. NOT a new content
	// type: a video is a real post (OssnWall) with a real video-type
	// asset attached via the existing generic Media Foundation. This
	// is a read/listing layer only — creation reuses createPost() +
	// uploadMedia() + attachMedia() directly (see CreateVideoScreen),
	// deletion reuses the real deletePost() below.
	// ---------------------------------------------------------------

	async videoFeed(limit = 20, offset = 0): Promise<{videos: BerxVideoPost[]}> {
		return this.request<{videos: BerxVideoPost[]}>(`/videos?limit=${limit}&offset=${offset}`);
	}

	async getVideo(postGuid: number): Promise<BerxVideoPost> {
		return this.request<BerxVideoPost>(`/videos/${postGuid}`);
	}

	async userVideos(userGuid: number): Promise<{videos: BerxVideoPost[]}> {
		return this.request<{videos: BerxVideoPost[]}>(`/videos?user=${userGuid}`);
	}

	/** A video IS a post — deleting it deletes the real post (author/admin only, enforced server-side) AND cleans up any attached media (the real underlying file too), never leaving an orphan. Same method covers deleting a track post — a track is architecturally identical, just audio instead of video. */
	async deletePost(postGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/posts/${postGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Tracks — components/OssnApi/v1/tracks.php. Same architecture as
	// Video: a track is a real post with a real audio-type asset
	// attached via the Media Foundation, not a new content type. No
	// copyrighted-music catalog, no licensing metadata — attachment
	// of a user's own real uploaded audio only, same honest scope
	// Video has for video.
	// ---------------------------------------------------------------

	async trackFeed(limit = 20, offset = 0): Promise<{tracks: BerxTrackPost[]}> {
		return this.request<{tracks: BerxTrackPost[]}>(`/tracks?limit=${limit}&offset=${offset}`);
	}

	async getTrack(postGuid: number): Promise<BerxTrackPost> {
		return this.request<BerxTrackPost>(`/tracks/${postGuid}`);
	}

	async userTracks(userGuid: number): Promise<{tracks: BerxTrackPost[]}> {
		return this.request<{tracks: BerxTrackPost[]}>(`/tracks?user=${userGuid}`);
	}

	// ---------------------------------------------------------------
	// Business — components/OssnApi/v1/business.php. Real place-claim
	// requests (NEVER auto-approved — no real business registry or
	// verification service exists here) and real owner-only review
	// replies. Approval is a real, logged admin action, same manual-
	// review pattern as Admin Unvalidated Users / Community requests.
	// ---------------------------------------------------------------

	async submitPlaceClaim(placeGuid: number, message?: string): Promise<{id: number}> {
		return this.request<{id: number}>(`/business/places/${placeGuid}/claim`, {method: 'POST', body: message ? {message} : {}});
	}

	async myPlaceClaims(): Promise<{claims: BerxPlaceClaim[]}> {
		return this.request<{claims: BerxPlaceClaim[]}>('/business/claims/mine');
	}

	/** Admin only — enforced server-side regardless of what this client believes about the caller's role. */
	async pendingPlaceClaims(): Promise<{claims: BerxPlaceClaim[]}> {
		return this.request<{claims: BerxPlaceClaim[]}>('/business/claims/pending');
	}

	async approvePlaceClaim(claimId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/claims/${claimId}/approve`, {method: 'POST'});
	}

	async rejectPlaceClaim(claimId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/claims/${claimId}/reject`, {method: 'POST'});
	}

	/** Place-owner/admin only — real one-reply-per-review upsert, enforced server-side. */
	async replyToReview(reviewGuid: number, text: string): Promise<{text: string; time_created: number; time_updated: number}> {
		return this.request<{text: string; time_created: number; time_updated: number}>(`/business/reviews/${reviewGuid}/reply`, {method: 'POST', body: {text}});
	}

	async deleteReviewReply(reviewGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/reviews/${reviewGuid}/reply`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Business team + subscription — components/OssnApi/v1/business.php.
	// Team is a real access-control list (owner/manager/staff), never a
	// second user-identity system. Subscription is server-authoritative
	// trial timing only — NO payment endpoint exists (no real payment
	// provider is integrated), so there is deliberately no "upgrade"/
	// "pay" method here to call.
	// ---------------------------------------------------------------

	async businessTeam(placeGuid: number): Promise<{team: BerxBusinessTeamMember[]}> {
		return this.request<{team: BerxBusinessTeamMember[]}>(`/business/places/${placeGuid}/team`);
	}

	/** Owner/admin only, enforced server-side — a manager cannot add others even with UI access to this call. */
	async addBusinessTeamMember(placeGuid: number, userGuid: number, role: BerxBusinessTeamRole): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/places/${placeGuid}/team`, {method: 'POST', body: {user_guid: String(userGuid), role}});
	}

	async removeBusinessTeamMember(placeGuid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/places/${placeGuid}/team/${userGuid}`, {method: 'DELETE'});
	}

	async getBusinessSubscription(placeGuid: number): Promise<BerxBusinessSubscription> {
		return this.request<BerxBusinessSubscription>(`/business/places/${placeGuid}/subscription`);
	}

	/** Opens a real, server-timed 7-day trial window — idempotent, never resets an existing trial's clock. */
	async startBusinessTrial(placeGuid: number): Promise<BerxBusinessSubscription> {
		return this.request<BerxBusinessSubscription>(`/business/places/${placeGuid}/subscription/start-trial`, {method: 'POST'});
	}

	async setBusinessType(placeGuid: number, businessType: BerxBusinessType): Promise<{business_type: BerxBusinessType}> {
		return this.request<{business_type: BerxBusinessType}>(`/business/places/${placeGuid}/type`, {method: 'POST', body: {business_type: businessType}});
	}

	/** Pure read over existing real posts/photos — components/OssnApi/v1/memories.php. No push notification is sent from this call; no real push infrastructure exists to send one from. */
	async memories(): Promise<{memories: BerxMemory[]}> {
		return this.request<{memories: BerxMemory[]}>('/memories');
	}

	/** `identifier` may be a real username OR a real numeric guid (as a string) — profiles.php resolves either. */
	async getProfile(identifier: string): Promise<BerxProfileSummary> {
		return this.request<BerxProfileSummary>(`/profiles/${encodeURIComponent(identifier)}`);
	}

	async searchUsers(q: string): Promise<BerxSearchUsersResponse> {
		return this.request<BerxSearchUsersResponse>(`/search/users?q=${encodeURIComponent(q)}`);
	}

	async conversations(): Promise<{conversations: BerxConversationSummary[]}> {
		return this.request<{conversations: BerxConversationSummary[]}>('/conversations');
	}

	async conversationWith(otherGuid: number): Promise<{messages: BerxMessage[]}> {
		return this.request<{messages: BerxMessage[]}>(`/conversations/${otherGuid}`);
	}

	async sendMessage(otherGuid: number, text: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/conversations/${otherGuid}/messages`, {method: 'POST', body: {text}});
	}

	async unreadMessageCount(): Promise<{unread_count: number}> {
		return this.request<{unread_count: number}>('/conversations/unread-count');
	}

	/** Marks the OTHER user's messages to me as read — real server call, matching markViewed()'s real semantics. */
	async markConversationRead(otherGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/conversations/${otherGuid}/read`, {method: 'POST'});
	}

	/** Real ownership check server-side — only a participant in the message can delete it. */
	async deleteMessage(otherGuid: number, messageId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/conversations/${otherGuid}/messages/${messageId}`, {method: 'DELETE'});
	}

	/** Real, sender-only message edit (OssnMessages::editMessage()) — real 403 if the caller didn't write the message. */
	async editMessage(otherGuid: number, messageId: number, text: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/conversations/${otherGuid}/messages/${messageId}`, {method: 'PATCH', body: {text}});
	}

	async getTypingStatus(otherGuid: number): Promise<{typing: boolean}> {
		return this.request<{typing: boolean}>(`/conversations/${otherGuid}/typing`);
	}

	/** Sets MY OWN typing status toward otherGuid — server never lets this be set on someone else's behalf. */
	async setTypingStatus(otherGuid: number, typing: boolean): Promise<{status: string}> {
		return this.request<{status: string}>(`/conversations/${otherGuid}/typing`, {method: 'POST', body: {typing: typing ? '1' : '0'}});
	}

	async datingDiscover(limit = 20, offset = 0): Promise<BerxDatingDiscoverResponse> {
		return this.request<BerxDatingDiscoverResponse>(`/dating/discover?limit=${limit}&offset=${offset}`);
	}

	/** Create or update own Match profile — the only dating endpoint callable before a profile exists. */
	async saveDatingProfile(p: {pseudonym: string; age?: number; city?: string; goal?: string; bio?: string; interests?: string}): Promise<{status: string}> {
		const body: Record<string, string> = {pseudonym: p.pseudonym};
		if (p.age !== undefined) body.age = String(p.age);
		if (p.city !== undefined) body.city = p.city;
		if (p.goal !== undefined) body.goal = p.goal;
		if (p.bio !== undefined) body.bio = p.bio;
		if (p.interests !== undefined) body.interests = p.interests;
		return this.request<{status: string}>('/dating/profile', {method: 'POST', body});
	}

	/** Own profile — unmasked, since it's the owner viewing their own data. */
	async getOwnDatingProfile(): Promise<BerxDatingOwnProfile> {
		return this.request<BerxDatingOwnProfile>('/dating/profile');
	}

	async searchDatingProfiles(q: string, limit = 20, offset = 0): Promise<{profiles: BerxDatingProfileCard[]; limit: number; offset: number}> {
		return this.request<{profiles: BerxDatingProfileCard[]; limit: number; offset: number}>(`/dating/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`);
	}

	/** Server verifies a real mutual match exists before removing either direction. */
	async unmatchDating(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>('/dating/unmatch', {method: 'POST', body: {user: String(userGuid)}});
	}

	async ownDatingPhotos(): Promise<{photos: BerxDatingOwnPhoto[]}> {
		return this.request<{photos: BerxDatingOwnPhoto[]}>('/dating/photos');
	}

	/** Ownership re-checked server-side; the real underlying file is unlinked too, not just the DB row. */
	async deleteOwnDatingPhoto(photoId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/dating/photos/${photoId}`, {method: 'DELETE'});
	}

	/** Real byte-sniffed MIME validation server-side (JPEG/PNG/WebP/GIF only) — client-reported type is never trusted. */
	async uploadOwnDatingPhoto(part: BerxFilePart, filename = 'photo.jpg'): Promise<{id: number}> {
		return this.request<{id: number}>('/dating/photos', {
			method: 'POST',
			multipart: {files: [{field: 'photo', part, filename}]},
		});
	}

	/** Real, per-photo `can_view` from the server (owner OR a real granted access row) — never guessed client-side. */
	async userDatingPhotos(userGuid: number): Promise<{photos: BerxDatingUserPhoto[]}> {
		return this.request<{photos: BerxDatingUserPhoto[]}>(`/dating/photos/user/${userGuid}`);
	}

	/**
	 * Returns a fetch-ready URL, not the bytes — same pattern as
	 * storyMediaUrl(): private and token-gated (dating.php's own
	 * /media route re-checks canViewPhoto() on every request), so
	 * callers attach the same auth headers via getAuthHeaders() when
	 * actually fetching it (e.g. <Image source={{uri, headers}}>).
	 */
	datingPhotoUrl(photoId: number): string {
		return `${this.baseUrl}/api/v1/dating/photos/${photoId}/media`;
	}

	/** Real list backing a revoke UI — without this, revokeDatingPhotoAccess() had no way to discover which access_ids exist to revoke. */
	async grantedDatingPhotoAccess(): Promise<{access: BerxDatingPhotoRequest[]}> {
		return this.request<{access: BerxDatingPhotoRequest[]}>('/dating/photo-access');
	}

	async datingLike(userGuid: number): Promise<{status: string; mutual: boolean}> {
		return this.request<{status: string; mutual: boolean}>('/dating/interests', {method: 'POST', body: {user: String(userGuid)}});
	}

	async datingPass(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>('/dating/pass', {method: 'POST', body: {user: String(userGuid)}});
	}

	async datingUndo(): Promise<{status: string; restored_guid: number | null}> {
		return this.request<{status: string; restored_guid: number | null}>('/dating/undo', {method: 'POST'});
	}

	async datingMatches(): Promise<{matches: BerxDatingMatch[]}> {
		return this.request<{matches: BerxDatingMatch[]}>('/dating/matches');
	}

	/** Real Dating <-> Places connection — top-rated real places near the caller's own dating location, for a real mutual match. Requires the caller's own dating location to be set (real 422 no_location otherwise, surfaced verbatim). */
	async datingDateIdeas(matchGuid: number): Promise<{places: BerxDateIdea[]}> {
		return this.request<{places: BerxDateIdea[]}>(`/dating/date-ideas?match=${matchGuid}`);
	}

	/**
	 * Matches PATCH /api/v1/dating/location's real accepted fields
	 * exactly (dating.php: latitude, longitude, hide_location) — sent
	 * as strings since the transport is x-www-form-urlencoded, same as
	 * every other write method here.
	 */
	async datingUpdateLocation(fields: {latitude?: number; longitude?: number; hideLocation?: boolean}): Promise<{status: string}> {
		const body: Record<string, string> = {};
		if (fields.latitude !== undefined) body.latitude = String(fields.latitude);
		if (fields.longitude !== undefined) body.longitude = String(fields.longitude);
		if (fields.hideLocation !== undefined) body.hide_location = fields.hideLocation ? '1' : '0';
		return this.request<{status: string}>('/dating/location', {method: 'PATCH', body});
	}

	/** Matches PATCH /api/v1/dating/privacy's real accepted fields exactly. */
	async datingUpdatePrivacy(fields: {
		hideProfile?: boolean;
		hideOnline?: boolean;
		hideAge?: boolean;
		hideCity?: boolean;
		invisibleMode?: boolean;
	}): Promise<{status: string}> {
		const body: Record<string, string> = {};
		if (fields.hideProfile !== undefined) body.hide_profile = fields.hideProfile ? '1' : '0';
		if (fields.hideOnline !== undefined) body.hide_online = fields.hideOnline ? '1' : '0';
		if (fields.hideAge !== undefined) body.hide_age = fields.hideAge ? '1' : '0';
		if (fields.hideCity !== undefined) body.hide_city = fields.hideCity ? '1' : '0';
		if (fields.invisibleMode !== undefined) body.invisible_mode = fields.invisibleMode ? '1' : '0';
		return this.request<{status: string}>('/dating/privacy', {method: 'PATCH', body});
	}

	async notifications(unreadOnly = false, limit = 20, offset = 1): Promise<BerxNotificationsResponse> {
		const q = `?limit=${limit}&offset=${offset}${unreadOnly ? '&unread=1' : ''}`;
		return this.request<BerxNotificationsResponse>(`/notifications${q}`);
	}

	async unreadNotificationCount(): Promise<{unread_count: number}> {
		return this.request<{unread_count: number}>('/notifications/unread-count');
	}

	async markNotificationRead(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/notifications/${guid}/read`, {method: 'POST'});
	}

	async storiesFeed(): Promise<{feed: BerxStoryFeedGroup[]}> {
		return this.request<{feed: BerxStoryFeedGroup[]}>('/stories');
	}

	async ownStories(): Promise<{stories: BerxOwnStorySummary[]}> {
		return this.request<{stories: BerxOwnStorySummary[]}>('/stories/own');
	}

	async createStory(part: BerxFilePart, caption?: string, filename = 'story.jpg', eventGuid?: number): Promise<{id: number}> {
		const fields: Record<string, string> = {};
		if (caption) fields.caption = caption;
		if (eventGuid) fields.event_guid = String(eventGuid);
		return this.request<{id: number}>('/stories', {
			method: 'POST',
			multipart: { fields: Object.keys(fields).length ? fields : undefined, files: [{ field: 'story', part, filename }] },
		});
	}

	async markStoryViewed(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/stories/${id}/view`, {method: 'POST'});
	}

	async deleteStory(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/stories/${id}/delete`, {method: 'POST'});
	}

	/**
	 * Returns a fetch-ready URL, not the bytes — media is private and
	 * token-gated (see stories.php's /media route), so callers must
	 * attach the same Authorization/X-Api-Token headers this client
	 * uses internally when actually fetching it (e.g. into an <Image>
	 * component via a signed fetch, not a bare <img src>). This method
	 * intentionally does NOT fetch the bytes itself — that decision
	 * belongs to the UI layer, which knows whether it needs a Blob, a
	 * data URI, or a direct authenticated request.
	 */
	storyMediaUrl(id: number): string {
		return `${this.baseUrl}/api/v1/stories/${id}/media`;
	}

	async communities(q?: string): Promise<BerxCommunitiesResponse> {
		return this.request<BerxCommunitiesResponse>(q ? `/communities?q=${encodeURIComponent(q)}` : '/communities');
	}

	async myCommunities(): Promise<BerxCommunitiesResponse> {
		return this.request<BerxCommunitiesResponse>('/communities/mine');
	}

	async getCommunity(guid: number): Promise<BerxCommunity> {
		return this.request<BerxCommunity>(`/communities/${guid}`);
	}

	/** Real Communities <-> Events connection — this community's real hosted events (OssnEvents::upcomingByGroup()). Public, same visibility as getCommunity(). */
	async communityEvents(guid: number): Promise<{events: BerxEvent[]}> {
		return this.request<{events: BerxEvent[]}>(`/communities/${guid}/events`);
	}

	async createCommunity(name: string, description: string, privacy: 'public' | 'private'): Promise<{guid: number}> {
		return this.request<{guid: number}>('/communities', {method: 'POST', body: {name, description, privacy}});
	}

	/** Owner/admin only (enforced server-side against the real group's owner_guid) — updateGroup()'s own scope is title+description only, matching the real web edit action. */
	async updateCommunity(guid: number, name: string, description?: string): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}`, {method: 'PATCH', body: {name, ...(description ? {description} : {})}});
	}

	/** Permanent. Calls the real deleteGroup() the web delete action uses, not the generic object-delete path. */
	async deleteCommunity(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}`, {method: 'DELETE'});
	}

	async joinCommunity(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/join`, {method: 'POST'});
	}

	async leaveCommunity(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/leave`, {method: 'POST'});
	}

	async pointsBalance(): Promise<BerxPointsBalance> {
		return this.request<BerxPointsBalance>('/points');
	}

	/** Real server-side daily check-in — see OssnPoints::recordActivity(). Safe to call once per real app open; the server itself refuses to double-count same-day calls. */
	async streakCheckIn(): Promise<BerxStreakCheckIn> {
		return this.request<BerxStreakCheckIn>('/points/streak/check-in', {method: 'POST'});
	}

	/** Real Places (OssnGeo::near) + real Events (via their real linked Place's location) — no fake open-now filter, see nearby.php's own header. */
	async nearbyNow(lat: number, lng: number, radiusKm = 5, today = false, openNow = false): Promise<BerxNearbyNow> {
		return this.request<BerxNearbyNow>(`/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}&today=${today ? '1' : '0'}&open_now=${openNow ? '1' : '0'}`);
	}

	async placeHours(placeGuid: number): Promise<BerxPlaceHours> {
		return this.request<BerxPlaceHours>(`/business/places/${placeGuid}/hours`);
	}

	/** Owner-only, enforced server-side. Replaces the whole schedule — a schedule is edited as a whole, partial updates would leave stale rows. */
	async savePlaceHours(placeGuid: number, intervals: BerxOpeningInterval[]): Promise<{status: string}> {
		return this.request<{status: string}>(`/business/places/${placeGuid}/hours`, {
			method: 'POST',
			body: {intervals: JSON.stringify(intervals)},
		});
	}

	/** Owner-only, real time-bound (max 24h) announcement. NOT ad inventory — no boost/sponsored tier exists (needs a real payment provider). */
	async createBusinessMoment(placeGuid: number, text: string, endsAt: number): Promise<{id: number}> {
		return this.request<{id: number}>(`/moments/places/${placeGuid}`, {method: 'POST', body: {text, ends_at: String(endsAt)}});
	}

	async deleteBusinessMoment(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/moments/${id}`, {method: 'DELETE'});
	}

	async placeMoments(placeGuid: number): Promise<{moments: BerxBusinessMoment[]}> {
		return this.request<{moments: BerxBusinessMoment[]}>(`/moments/places/${placeGuid}`);
	}

	// ---------------------------------------------------------------
	// Business Offers — components/OssnApi/v1/offers.php. Real
	// loyalty/promotion claim+fulfill primitive (BERX World Max
	// Build), no payment infrastructure — see OssnBusinessOffers's own
	// header for why.
	// ---------------------------------------------------------------

	/** Live, already-claimable offers for a place — server re-checks expiry/redemption-cap on every request, never a stale flag. */
	async placeOffers(placeGuid: number): Promise<{offers: BerxBusinessOffer[]}> {
		return this.request<{offers: BerxBusinessOffer[]}>(`/offers/places/${placeGuid}`);
	}

	/** Owner/team/admin only — every offer for the place, including inactive/expired/exhausted, for the real business dashboard. */
	async allPlaceOffers(placeGuid: number): Promise<{offers: BerxBusinessOffer[]}> {
		return this.request<{offers: BerxBusinessOffer[]}>(`/offers/places/${placeGuid}/all`);
	}

	/** Owner/team/admin only — real canManage() check server-side, same gate business team actions already use. */
	async createOffer(placeGuid: number, fields: {title: string; description?: string; maxRedemptions?: number; endsAt?: number}): Promise<{id: number}> {
		const body: Record<string, string> = {title: fields.title};
		if (fields.description) body.description = fields.description;
		if (fields.maxRedemptions !== undefined) body.max_redemptions = String(fields.maxRedemptions);
		if (fields.endsAt !== undefined) body.ends_at = String(fields.endsAt);
		return this.request<{id: number}>(`/offers/places/${placeGuid}`, {method: 'POST', body});
	}

	/** Real claim — a real unique-index guarantee against double-claiming server-side, not just this call's own 409 response. */
	async claimOffer(offerId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/offers/${offerId}/claim`, {method: 'POST'});
	}

	/** Owner/team/admin only — real in-person fulfillment, marks one specific user's real claim as used. */
	async fulfillOffer(offerId: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/offers/${offerId}/fulfill/${userGuid}`, {method: 'POST'});
	}

	/** Owner/team/admin only — real claimant list for the dashboard. */
	async offerRedemptions(offerId: number): Promise<{redemptions: BerxOfferRedemption[]}> {
		return this.request<{redemptions: BerxOfferRedemption[]}>(`/offers/${offerId}/redemptions`);
	}

	/** Owner/team/admin only — deactivates, never a hard delete (claim history stays real and intact). */
	async deactivateOffer(offerId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/offers/${offerId}`, {method: 'DELETE'});
	}

	/** 'shown' is recorded automatically server-side inside GET /nearby — this covers the real actions the client itself performs: opened/saved/route. */
	async recordNearbyAction(placeGuid: number, action: 'opened' | 'saved' | 'route'): Promise<{status: string}> {
		return this.request<{status: string}>(`/impressions/places/${placeGuid}/action`, {method: 'POST', body: {action}});
	}

	/** Real, currently-active stories for one event — block-filtered server-side via the same real checkStoryAccess() the media route uses. */
	async eventStories(eventGuid: number): Promise<{stories: BerxEventStoryItem[]}> {
		return this.request<{stories: BerxEventStoryItem[]}>(`/stories/event/${eventGuid}`);
	}

	/** Pure read aggregation, real counts only — no invented insight text, no fake population comparison. */
	async wrapped(period: 'week' | 'month' = 'month'): Promise<BerxWrapped> {
		return this.request<BerxWrapped>(`/wrapped?period=${period}`);
	}

	/** Foundation of the Future Layer — see docs/BERX_FUTURE_LAYER_SPEC.md and components/OssnApi/v1/lifegraph.php's own header. Own graph only in v1. */
	async lifeGraph(): Promise<BerxLifeGraphResponse> {
		return this.request<BerxLifeGraphResponse>('/lifegraph/me');
	}

	/** Real Places/Events pins (OssnGeo) + real friends-online — see docs/BERX_FUTURE_LAYER_SPEC.md. friends_online is never geolocated. */
	async socialMap(lat: number, lng: number, radiusKm = 5): Promise<BerxSocialMapResponse> {
		return this.request<BerxSocialMapResponse>(`/socialmap?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
	}

	/** Real "who's online right now" among your friends, no location needed — GET /presence (real, always existed, zero client caller until BERX World Max Build). */
	async onlineFriends(): Promise<{online: BerxOnlineFriend[]}> {
		return this.request<{online: BerxOnlineFriend[]}>('/presence');
	}

	/** The graph AROUND one place — real friends who saved/reviewed it. See docs/BERX_FUTURE_LAYER_SPEC.md. */
	async placeExperienceGraph(placeGuid: number): Promise<BerxPlaceExperienceGraph> {
		return this.request<BerxPlaceExperienceGraph>(`/experiencegraph/place/${placeGuid}`);
	}

	/** The graph AROUND one event — real friends who are going. */
	async eventExperienceGraph(eventGuid: number): Promise<BerxEventExperienceGraph> {
		return this.request<BerxEventExperienceGraph>(`/experiencegraph/event/${eventGuid}`);
	}

	/** Radius-scoped "pulse of the city" summary — same real OssnGeo query as nearbyNow()/socialMap(). See docs/BERX_FUTURE_LAYER_SPEC.md. */
	async cityMode(lat: number, lng: number, radiusKm = 5): Promise<BerxCityModeResponse> {
		return this.request<BerxCityModeResponse>(`/citymode?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
	}

	/** Future Identity (Max Build) — Profile + Life Graph counts + Reputation + real progression composed server-side, one call. Achievements/interests are purely derived, no invented score. */
	async identity(): Promise<BerxIdentityResponse> {
		return this.request<BerxIdentityResponse>('/identity/me');
	}

	/** Real mutual-friend "people you may know" (Max Build) — no AI, no similarity score, just real overlapping friendships. */
	async peopleDiscovery(): Promise<BerxPeopleDiscoveryResponse> {
		return this.request<BerxPeopleDiscoveryResponse>('/discovery/people');
	}

	/** Real geo-verified check-in (Max Build) — server re-verifies the submitted coordinates are actually within range of the place, never trusts a claimed result. */
	async checkInAtPlace(guid: number, lat: number, lng: number): Promise<BerxCheckInResponse> {
		return this.request<BerxCheckInResponse>(`/places/${guid}/checkin`, {method: 'POST', body: {lat: String(lat), lng: String(lng)}});
	}

	/** The caller's own real check-in history, most recent first. */
	async recentCheckins(): Promise<BerxRecentCheckinsResponse> {
		return this.request<BerxRecentCheckinsResponse>('/places/checkins');
	}

	/** Real, fixed daily catalog — see components/OssnApi/v1/missions.php's own header. */
	async missions(): Promise<BerxMissionsResponse> {
		return this.request<BerxMissionsResponse>('/missions');
	}

	/** Re-verifies the real underlying action server-side before awarding — a 409 means "not completed yet today", not a client bug. */
	async claimMission(key: string): Promise<{status: string; points: number}> {
		return this.request<{status: string; points: number}>(`/missions/${key}/claim`, {method: 'POST'});
	}

	async pointsHistory(): Promise<{history: BerxPointsHistoryEntry[]}> {
		return this.request<{history: BerxPointsHistoryEntry[]}>('/points/history');
	}

	/**
	 * Real, fixed spend options only — 'dating_boost' is the one wired
	 * end-to-end server-side right now (see points.php's own
	 * $berx_spend_prices). Passing any other reason returns a real
	 * 422 from the server, not a client-side fake success.
	 */
	async spendPoints(reason: 'dating_boost', amount: number): Promise<{status: string; balance: number}> {
		return this.request<{status: string; balance: number}>('/points/spend', {method: 'POST', body: {reason, amount: String(amount)}});
	}

	/** Convenience wrapper — spends via dating.php's own /dating/boost action (which itself calls the real points spend + sets boosted_until), not the generic /points/spend endpoint, since boosting needs the extra server-side effect points/spend alone doesn't produce. */
	async boostDatingProfile(): Promise<{status: string; boosted_until: number}> {
		return this.request<{status: string; boosted_until: number}>('/dating/boost', {method: 'POST'});
	}

	// ---------------------------------------------------------------
	// Dating private photo access — request/respond/revoke/incoming.
	// Every ownership/policy check (mutual-match gating, "not your
	// own photo", "not the actual owner responding") is enforced
	// server-side inside the real OssnDating methods this wraps.
	// ---------------------------------------------------------------

	async requestDatingPhotoAccess(photoId: number): Promise<{status: string}> {
		return this.request<{status: string}>('/dating/photo-request', {method: 'POST', body: {photo_id: String(photoId)}});
	}

	async respondDatingPhotoAccess(accessId: number, grant: boolean): Promise<{status: string}> {
		return this.request<{status: string}>('/dating/photo-respond', {method: 'POST', body: {access_id: String(accessId), grant: grant ? '1' : '0'}});
	}

	async revokeDatingPhotoAccess(accessId: number): Promise<{status: string}> {
		return this.request<{status: string}>('/dating/photo-revoke', {method: 'POST', body: {access_id: String(accessId)}});
	}

	async datingPhotoRequests(): Promise<{requests: BerxDatingPhotoRequest[]}> {
		return this.request<{requests: BerxDatingPhotoRequest[]}>('/dating/photo-requests');
	}

	/** Block check is done server-side with real user objects, not session state — see the header comment in api/v1/poke.php for why that distinction matters here specifically. */
	async pokeUser(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/poke/${userGuid}`, {method: 'POST'});
	}

	// ---------------------------------------------------------------
	// Admin — components/OssnApi/v1/admin.php. Admin-only server-side
	// (ossn_isAdminLoggedin()), re-checked there regardless of client
	// state. Search is deliberately NOT exposed here — see the header
	// comment in admin.php for the real SQL-injection reason.
	// ---------------------------------------------------------------

	/** BERX WORLD MAX BUILD — `q` is real now: the underlying getUnvalidatedUSERS() SQL-injection primitive was fixed server-side (delegated to searchUsers()'s already-safe parameterized 'keyword' path), so this no longer has to withhold search from the API. */
	async unvalidatedUsers(q?: string): Promise<{users: BerxUnvalidatedUser[]}> {
		return this.request<{users: BerxUnvalidatedUser[]}>(q ? `/admin/unvalidated?q=${encodeURIComponent(q)}` : '/admin/unvalidated');
	}

	async validateUsers(guids: number[]): Promise<{results: Record<string, string>}> {
		return this.request<{results: Record<string, string>}>('/admin/validate', {method: 'POST', body: {guids: guids.join(',')}});
	}

	/** Real ban (OssnUser::ban()) — admin-only, enforced platform-wide at ossn_com.php's bearer-token choke point on the very next request. */
	async banUser(userGuid: number, reason?: string): Promise<{status: string}> {
		return this.request<{status: string}>('/admin/ban', {method: 'POST', body: {user_guid: String(userGuid), ...(reason ? {reason} : {})}});
	}

	async unbanUser(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>('/admin/unban', {method: 'POST', body: {user_guid: String(userGuid)}});
	}

	// ---------------------------------------------------------------
	// Group moderators — activates OssnGroup::isModerator(), which has
	// existed in core since the beginning as a documented extension
	// point (never implemented until this pass). Owner/admin only,
	// enforced server-side.
	// ---------------------------------------------------------------

	async communityModerators(guid: number): Promise<{moderators: BerxGroupModerator[]}> {
		return this.request<{moderators: BerxGroupModerator[]}>(`/communities/${guid}/moderators`);
	}

	async addCommunityModerator(guid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/moderators/${userGuid}`, {method: 'POST'});
	}

	async removeCommunityModerator(guid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/moderators/${userGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Friends — components/OssnApi/v1/friends.php, wraps the caller's
	// OWN OssnUser::getFriends(). Powers EventInviteScreen's picker.
	// ---------------------------------------------------------------

	async friends(): Promise<{friends: BerxFriend[]}> {
		return this.request<{friends: BerxFriend[]}>('/friends');
	}

	async communityMembers(guid: number): Promise<{members: BerxCommunityMember[]}> {
		return this.request<{members: BerxCommunityMember[]}>(`/communities/${guid}/members`);
	}

	// ---------------------------------------------------------------
	// Albums — components/OssnApi/v1/albums.php, wraps OssnAlbums::
	// GetAlbums/GetAlbum/CreateAlbum verbatim (real class, previously
	// zero API coverage despite an audited web UI built earlier).
	// ---------------------------------------------------------------

	async userAlbums(userGuid: number): Promise<{albums: BerxAlbum[]}> {
		return this.request<{albums: BerxAlbum[]}>(`/albums?user=${userGuid}`);
	}

	async getAlbum(guid: number): Promise<BerxAlbumDetail> {
		return this.request<BerxAlbumDetail>(`/albums/${guid}`);
	}

	async createAlbum(title: string, access: 'public' | 'private' = 'public'): Promise<{guid: number}> {
		return this.request<{guid: number}>('/albums', {method: 'POST', body: {title, access}});
	}

	/** Real byte-sniffed MIME + getimagesize() validation server-side — see components/OssnApi/v1/albums.php's header comment for the full ownership/session-bridge story. */
	async uploadAlbumPhoto(albumGuid: number, part: BerxFilePart, filename = 'photo.jpg', access: 'public' | 'private' = 'public'): Promise<{guid: number}> {
		return this.request<{guid: number}>(`/albums/${albumGuid}/photos`, {
			method: 'POST',
			multipart: {fields: {access}, files: [{field: 'photo', part, filename}]},
		});
	}

	/** Ownership verified server-side against the real file's owner_guid — deleteAlbumPhoto() itself has no built-in check, the endpoint adds it. */
	async deleteAlbumPhoto(albumGuid: number, photoGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/albums/${albumGuid}/photos/${photoGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Friends — components/OssnApi/v1/friend.php (send/remove) and
	// friends.php (list, above). OSSN's real model is mutual
	// confirmed friendship (sendRequest()/deleteFriend()) — there is
	// no one-directional "follow" concept anywhere in this backend, so
	// no followFoo/unfollowBar methods exist here; building them would
	// misrepresent the actual relationship model.
	// ---------------------------------------------------------------

	/** Covers BOTH "send a new request" and "confirm the other side's pending request" — sendRequest() itself decides which, matching the real web action's behavior exactly. */
	async addFriend(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/friend/${userGuid}`, {method: 'POST'});
	}

	/** Also cancels a pending (not-yet-mutual) request — deleteFriend() handles both cases, same as the real web action. */
	async removeFriend(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/friend/${userGuid}`, {method: 'DELETE'});
	}

	async isAuthenticated(): Promise<boolean> {
		return (await this.storage.getToken()) !== null;
	}

	// ---------------------------------------------------------------
	// Places — components/OssnApi/v1/places.php. Every method below
	// maps to exactly one branch in that file; field names copied
	// verbatim from the PHP input() calls, not inferred.
	// ---------------------------------------------------------------

	async places(q?: string, category?: string): Promise<{places: BerxPlace[]}> {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (category) params.set('category', category);
		const qs = params.toString();
		return this.request<{places: BerxPlace[]}>(`/places${qs ? `?${qs}` : ''}`);
	}

	async placeCategories(): Promise<{categories: BerxPlaceCategory[]}> {
		return this.request<{categories: BerxPlaceCategory[]}>('/places/categories');
	}

	async savedPlaces(): Promise<{places: BerxPlace[]}> {
		return this.request<{places: BerxPlace[]}>('/places/saved');
	}

	/**
	 * lat/lng are REQUIRED — places.php returns 422 without them
	 * (deliberately: the server never guesses a location for the
	 * caller). radius is in km, defaults to 5 server-side if omitted.
	 */
	async nearbyPlaces(lat: number, lng: number, radiusKm?: number): Promise<{places: BerxNearbyPlace[]; radius_km: number}> {
		const params = new URLSearchParams({lat: String(lat), lng: String(lng)});
		if (radiusKm !== undefined) params.set('radius', String(radiusKm));
		return this.request<{places: BerxNearbyPlace[]; radius_km: number}>(`/places/nearby?${params.toString()}`);
	}

	async getPlace(guid: number): Promise<BerxPlace> {
		return this.request<BerxPlace>(`/places/${guid}`);
	}

	async placeReviews(guid: number): Promise<{reviews: BerxPlaceReview[]}> {
		return this.request<{reviews: BerxPlaceReview[]}>(`/places/${guid}/reviews`);
	}

	/**
	 * Server-side rules this deliberately does NOT re-check client-side
	 * (the request will simply come back as a real 403/409/422, per
	 * this file's own "no fake success" rule): a place owner cannot
	 * review their own place, and one review per user per place.
	 */
	async createPlaceReview(guid: number, rating: number, text?: string): Promise<{guid: number}> {
		return this.request<{guid: number}>(`/places/${guid}/reviews`, {
			method: 'POST',
			body: {rating: String(rating), ...(text ? {review: text} : {})},
		});
	}

	// ---------------------------------------------------------------
	// Business — thin extension over existing Places (components/
	// OssnApi/v1/places.php's business/* branches). No new storage;
	// the dashboard reuses data that was already real and queryable.
	// ---------------------------------------------------------------

	async enableBusiness(placeGuid: number): Promise<BerxPlace> {
		return this.request<BerxPlace>(`/places/${placeGuid}/business/enable`, {method: 'POST'});
	}

	async disableBusiness(placeGuid: number): Promise<BerxPlace> {
		return this.request<BerxPlace>(`/places/${placeGuid}/business/disable`, {method: 'POST'});
	}

	/** Admin-only server-side — a business can never self-verify. */
	async verifyBusiness(placeGuid: number): Promise<BerxPlace> {
		return this.request<BerxPlace>(`/places/${placeGuid}/business/verify`, {method: 'POST'});
	}

	async unverifyBusiness(placeGuid: number): Promise<BerxPlace> {
		return this.request<BerxPlace>(`/places/${placeGuid}/business/verify`, {method: 'DELETE'});
	}

	async businessDashboard(placeGuid: number): Promise<BerxBusinessDashboard> {
		return this.request<BerxBusinessDashboard>(`/places/${placeGuid}/business/dashboard`);
	}

	async savePlace(guid: number): Promise<{status: string; is_saved: boolean}> {
		return this.request<{status: string; is_saved: boolean}>(`/places/${guid}/save`, {method: 'POST'});
	}

	async unsavePlace(guid: number): Promise<{status: string; is_saved: boolean}> {
		return this.request<{status: string; is_saved: boolean}>(`/places/${guid}/unsave`, {method: 'POST'});
	}

	async uploadPlaceCover(guid: number, part: BerxFilePart, filename = 'cover.jpg'): Promise<{status: string; cover_url: string | null}> {
		return this.request<{status: string; cover_url: string | null}>(`/places/${guid}/cover`, {
			method: 'POST',
			multipart: {files: [{field: 'cover', part, filename}]},
		});
	}

	async createPlace(fields: {
		title: string;
		category: string;
		description?: string;
		address?: string;
		phone?: string;
		website?: string;
		hours?: string;
		price?: number;
		lat?: number;
		lng?: number;
	}): Promise<{guid: number}> {
		const body: Record<string, string> = {title: fields.title, category: fields.category};
		if (fields.description) body.description = fields.description;
		if (fields.address) body.address = fields.address;
		if (fields.phone) body.phone = fields.phone;
		if (fields.website) body.website = fields.website;
		if (fields.hours) body.hours = fields.hours;
		if (fields.price !== undefined) body.price = String(fields.price);
		if (fields.lat !== undefined) body.lat = String(fields.lat);
		if (fields.lng !== undefined) body.lng = String(fields.lng);
		return this.request<{guid: number}>('/places', {method: 'POST', body});
	}

	/** Only fields actually present in `fields` are sent — a true partial PATCH, matching places.php's own "only touch what arrived" handling. */
	async updatePlace(guid: number, fields: Partial<{
		title: string;
		description: string;
		category: string;
		price: number;
		website: string;
		address: string;
		phone: string;
		hours: string;
		lat: number;
		lng: number;
	}>): Promise<BerxPlace> {
		const body: Record<string, string> = {};
		for (const [k, v] of Object.entries(fields)) {
			if (v !== undefined) body[k] = String(v);
		}
		return this.request<BerxPlace>(`/places/${guid}`, {method: 'PATCH', body});
	}

	/** Permanent — deletes the place's reviews and geo-index entry server-side too (see places.php's DELETE branch). */
	async deletePlace(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/places/${guid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Events — components/OssnApi/v1/events.php
	// ---------------------------------------------------------------

	async events(opts?: {q?: string; category?: string; past?: boolean}): Promise<{events: BerxEvent[]}> {
		const params = new URLSearchParams();
		if (opts?.q) params.set('q', opts.q);
		if (opts?.category) params.set('category', opts.category);
		if (opts?.past) params.set('past', '1');
		const qs = params.toString();
		return this.request<{events: BerxEvent[]}>(`/events${qs ? `?${qs}` : ''}`);
	}

	async eventCategories(): Promise<{categories: BerxPlaceCategory[]}> {
		return this.request<{categories: BerxPlaceCategory[]}>('/events/categories');
	}

	async myGoingEvents(): Promise<{events: BerxEvent[]}> {
		return this.request<{events: BerxEvent[]}>('/events/going');
	}

	async getEvent(guid: number): Promise<BerxEvent> {
		return this.request<BerxEvent>(`/events/${guid}`);
	}

	async eventAttendees(guid: number): Promise<{attendees: BerxEventAttendee[]}> {
		return this.request<{attendees: BerxEventAttendee[]}>(`/events/${guid}/attendees`);
	}

	/**
	 * starts/ends accept EITHER a unix timestamp (number) or an
	 * ISO/date-parseable string — events.php's create branch tries
	 * is_numeric() first, then strtotime(), so either works. Passing a
	 * JS Date, convert with `.getTime() / 1000` first.
	 */
	async createEvent(fields: {
		title: string;
		category: string;
		starts: number | string;
		ends?: number | string;
		description?: string;
		location?: string;
		placeGuid?: number;
		/** Real Communities <-> Events connection — server rejects this (real 422) unless the caller is actually a member of the community. */
		groupGuid?: number;
		capacity?: number;
	}): Promise<{guid: number}> {
		const body: Record<string, string> = {
			title: fields.title,
			category: fields.category,
			starts: String(fields.starts),
		};
		if (fields.ends !== undefined) body.ends = String(fields.ends);
		if (fields.description) body.description = fields.description;
		if (fields.location) body.location = fields.location;
		if (fields.placeGuid !== undefined) body.place_guid = String(fields.placeGuid);
		if (fields.groupGuid !== undefined) body.group_guid = String(fields.groupGuid);
		if (fields.capacity !== undefined) body.capacity = String(fields.capacity);
		return this.request<{guid: number}>('/events', {method: 'POST', body});
	}

	async updateEvent(guid: number, fields: Partial<{
		title: string;
		description: string;
		category: string;
		starts: number | string;
		ends: number | string;
		capacity: number;
		location: string;
		placeGuid: number;
		groupGuid: number;
	}>): Promise<BerxEvent> {
		const body: Record<string, string> = {};
		if (fields.title !== undefined) body.title = fields.title;
		if (fields.description !== undefined) body.description = fields.description;
		if (fields.category !== undefined) body.category = fields.category;
		if (fields.starts !== undefined) body.starts = String(fields.starts);
		if (fields.ends !== undefined) body.ends = String(fields.ends);
		if (fields.capacity !== undefined) body.capacity = String(fields.capacity);
		if (fields.location !== undefined) body.location = fields.location;
		if (fields.placeGuid !== undefined) body.place_guid = String(fields.placeGuid);
		if (fields.groupGuid !== undefined) body.group_guid = String(fields.groupGuid);
		return this.request<BerxEvent>(`/events/${guid}`, {method: 'PATCH', body});
	}

	async deleteEvent(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/events/${guid}`, {method: 'DELETE'});
	}

	/**
	 * Capacity is re-counted server-side immediately before insert
	 * (OssnEvents::rsvp()) — a replayed tap or two near-simultaneous
	 * requests cannot oversell an event. On error, `error` is a real
	 * BerxRsvpErrorCode the UI can branch on without string-matching
	 * `message`.
	 */
	async rsvpEvent(guid: number): Promise<{status: string; is_going: boolean; seats_left: number | null; attendee_count: number}> {
		return this.request(`/events/${guid}/rsvp`, {method: 'POST'});
	}

	async cancelRsvp(guid: number): Promise<{status: string; is_going: boolean}> {
		return this.request<{status: string; is_going: boolean}>(`/events/${guid}/rsvp/cancel`, {method: 'POST'});
	}

	/** userGuid must be a real friend of the caller — inviteFriend() re-checks this server-side regardless of what the UI already knows. */
	async inviteToEvent(guid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/events/${guid}/invite`, {method: 'POST', body: {user: String(userGuid)}});
	}

	async uploadEventCover(guid: number, part: BerxFilePart, filename = 'cover.jpg'): Promise<{status: string}> {
		return this.request<{status: string}>(`/events/${guid}/cover`, {
			method: 'POST',
			multipart: {files: [{field: 'cover', part, filename}]},
		});
	}

	// ---------------------------------------------------------------
	// Comments on Places/Events — components/OssnApi/v1/comments.php.
	// Deliberately separate from commentOnPost() above, which hits a
	// different endpoint (/posts/{id}/comments) with a different
	// backing model — these two were never the same feature.
	// ---------------------------------------------------------------

	async objectComments(type: BerxCommentableType, id: number): Promise<{comments: BerxObjectComment[]; count: number}> {
		return this.request<{comments: BerxObjectComment[]; count: number}>(`/comments?type=${type}&id=${id}`);
	}

	async createObjectComment(type: BerxCommentableType, id: number, text: string): Promise<{id: number}> {
		return this.request<{id: number}>('/comments', {method: 'POST', body: {type, id: String(id), comment: text}});
	}

	/** Author or admin only — enforced inside comments.php against the stored comment's own owner_guid, not against anything this call sends. */
	async deleteObjectComment(commentId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/comments/${commentId}/delete`, {method: 'POST'});
	}

	// ---------------------------------------------------------------
	// Devices & Sessions — components/OssnApi/v1/me.php. Backed by the
	// SAME ossn_api_tokens rows the web "Devices & Sessions" settings
	// tab reads — signing out a device here signs it out there too.
	// ---------------------------------------------------------------

	async sessions(): Promise<{sessions: BerxSession[]}> {
		return this.request<{sessions: BerxSession[]}>('/me/sessions');
	}

	/** Ownership is enforced server-side (id AND the caller's own guid, both in the WHERE) — a foreign session id simply matches zero rows. */
	async revokeSession(id: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/me/sessions/${id}/revoke`, {method: 'POST'});
	}

	/**
	 * PERMANENT. Requires the account's current password — verified
	 * server-side via the same authenticate() check login() uses, not
	 * merely "is a token present". Revokes the calling token itself on
	 * success, so this client is immediately logged out.
	 */
	async deleteAccount(password: string): Promise<{status: string}> {
		const result = await this.request<{status: string}>('/me/delete', {method: 'POST', body: {password}});
		await this.storage.setToken(null);
		return result;
	}

	// ---------------------------------------------------------------
	// Community join requests — components/OssnApi/v1/communities.php.
	// Owner/admin only; enforced server-side against the real group
	// owner_guid, not against anything these calls send.
	// ---------------------------------------------------------------

	async communityRequests(guid: number): Promise<{requests: BerxCommunityRequest[]}> {
		return this.request<{requests: BerxCommunityRequest[]}>(`/communities/${guid}/requests`);
	}

	async approveCommunityRequest(guid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/requests/${userGuid}/approve`, {method: 'POST'});
	}

	async declineCommunityRequest(guid: number, userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/communities/${guid}/requests/${userGuid}/decline`, {method: 'POST'});
	}

	// ---------------------------------------------------------------
	// Notifications — bulk actions added to notifications.php
	// alongside the existing single-item read/list methods above.
	// ---------------------------------------------------------------

	async markAllNotificationsRead(): Promise<{status: string}> {
		return this.request<{status: string}>('/notifications/read-all', {method: 'POST'});
	}

	/** Ownership enforced server-side: guid AND the caller's own owner_guid together in the delete query, so a foreign guid matches zero rows. */
	async deleteNotification(guid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/notifications/${guid}`, {method: 'DELETE'});
	}

	async deleteAllNotifications(): Promise<{status: string}> {
		return this.request<{status: string}>('/notifications', {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Message search — components/OssnApi/v1/messagesearch.php, a
	// thin wrapper around ossn_messagesearch_query() (also used by the
	// real web /messages-search page — one query, two surfaces).
	// ---------------------------------------------------------------

	async searchMessages(q: string): Promise<{results: BerxMessageSearchResult[]}> {
		return this.request<{results: BerxMessageSearchResult[]}>(`/messagesearch?q=${encodeURIComponent(q)}`);
	}

	// ---------------------------------------------------------------
	// Block — components/OssnApi/v1/block.php. `from` is always the
	// caller's own token identity, never sent explicitly.
	// ---------------------------------------------------------------

	async blockedUsers(): Promise<{blocked: BerxBlockedUser[]}> {
		return this.request<{blocked: BerxBlockedUser[]}>('/block');
	}

	async blockUser(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/block/${userGuid}`, {method: 'POST'});
	}

	async unblockUser(userGuid: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/block/${userGuid}`, {method: 'DELETE'});
	}

	// ---------------------------------------------------------------
	// Report — components/OssnApi/v1/report.php. targetType/reason are
	// validated server-side against OssnReport::VALID_TARGET_TYPES /
	// VALID_REASONS — the TS unions here exist for editor completion,
	// the server whitelist is still the actual authority.
	// ---------------------------------------------------------------

	async submitReport(targetType: BerxReportTargetType, targetGuid: number, reason: BerxReportReason, note?: string): Promise<{status: string}> {
		return this.request<{status: string}>('/report', {
			method: 'POST',
			body: {target_type: targetType, target_guid: String(targetGuid), reason, ...(note ? {note} : {})},
		});
	}

	/** Admin only — enforced server-side regardless of what this client believes. */
	async reportQueue(): Promise<{reports: BerxReportQueueItem[]}> {
		return this.request<{reports: BerxReportQueueItem[]}>('/report/queue');
	}

	async resolveReport(reportId: number, status: 'reviewed' | 'dismissed'): Promise<{status: string}> {
		return this.request<{status: string}>(`/report/${reportId}/resolve`, {method: 'POST', body: {status}});
	}

	/**
	 * Real moderation action — deletes the reported content itself and
	 * marks the report reviewed. Returns 501 server-side for target
	 * types with no real removal mechanism ('user', 'dating_profile'),
	 * rather than pretending the action succeeded.
	 */
	async deleteReportedContent(reportId: number): Promise<{status: string}> {
		return this.request<{status: string}>(`/report/${reportId}/action`, {method: 'POST', body: {action: 'delete_content'}});
	}

	// ---------------------------------------------------------------
	// Search — Places/Events/Communities scopes added to the existing
	// user search (components/OssnApi/v1/search.php). Note: these
	// results are intentionally lighter than the full Places/Events
	// list endpoints (guid/title/category/cover/rating only) — the
	// dispatcher loads exactly one v1 file per request, so search.php
	// cannot reuse places.php's/events.php's full JSON builder
	// functions. For a full place/event record after finding it here,
	// follow up with getPlace()/getEvent().
	// ---------------------------------------------------------------

	async searchPlaces(q: string): Promise<{places: BerxPlaceSearchResult[]}> {
		return this.request<{places: BerxPlaceSearchResult[]}>(`/search/places?q=${encodeURIComponent(q)}`);
	}

	async searchEvents(q: string): Promise<{events: BerxEventSearchResult[]}> {
		return this.request<{events: BerxEventSearchResult[]}>(`/search/events?q=${encodeURIComponent(q)}`);
	}

	async searchCommunities(q: string): Promise<{communities: BerxCommunitySearchResult[]}> {
		return this.request<{communities: BerxCommunitySearchResult[]}>(`/search/communities?q=${encodeURIComponent(q)}`);
	}
}
