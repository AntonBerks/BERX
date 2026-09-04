# BERX v9 — API MAPPING

Backend unchanged: **OSSN + PHP + MySQL, REST under `/api/v1/`.** No
endpoint was invented, and none can be: every method name in
`client/packages/scenes/src/dataBindings.ts` is typed as
`keyof BerxApiClient`, so naming an endpoint that does not exist is a
compile error rather than a runtime 404.

```
Screen → Scene → Data binding → BerxApiClient → /api/v1/ → OSSN/MySQL
```

## Domain coverage

| Domain | Real endpoints in use | Notes |
|---|---|---|
| User | `login`, `register`, `me`, `updateProfile`, `uploadAvatar`, `sessions`, `revokeSession`, `deleteAccount` | `updateProfile` accepts only firstname, lastname, email, password |
| Profile | `getProfile`, `friends`, `addFriend`, `removeFriend`, `blockUser`, `unblockUser`, `blockedUsers` | No counts, bio or about fields are returned |
| Moment | `feed`, `getPost`, `createPost`, `likePost`, `commentOnPost`, `postComments`, `deletePost`, `storiesFeed`, `ownStories`, `createStory`, `markStoryViewed`, `deleteStory` | `feed` omits `like_count` by design (no N+1); `getPost` returns it |
| Media | `mediaByContext`, `uploadMedia`, `getMediaAsset`, `attachMedia`, `detachMedia`, `userAlbums`, `getAlbum`, `uploadAlbumPhoto` | |
| Place | `places`, `getPlace`, `nearbyPlaces`, `placeCategories`, `savePlace`, `unsavePlace`, `savedPlaces`, `placeReviews`, `createPlaceReview`, `placeHours`, `savePlaceHours`, `placeMoments`, `nearbyNow`, `recordNearbyAction` | `placeHours` returns structured intervals plus a server-computed `is_open_now`, which is `null` when the place has none |
| Event | `events`, `getEvent`, `createEvent`, `updateEvent`, `eventCategories`, `rsvpEvent`, `cancelRsvp`, `myGoingEvents`, `eventAttendees`, `inviteToEvent`, `eventStories` | Real capacity via `seats_left` |
| Experience | `experiences`, `getExperience`, `createExperience`, `respondToExperience`, `inviteToExperience` | `my_status` is the viewer's real answer |
| Community | `communities`, `myCommunities`, `getCommunity`, `joinCommunity`, `leaveCommunity`, `createCommunity`, `communityMembers`, `communityRequests` | Returns guid, name, description, owner_guid, privacy, is_member — no cover, no member count |
| Conversation | `conversations`, `conversationWith`, `unreadMessageCount`, `markConversationRead`, `searchMessages` | |
| Message | `sendMessage`, `deleteMessage`, `getTypingStatus`, `setTypingStatus` | Send returns `{status}` only, so the thread is re-read rather than appended to locally |
| Business | `businessDashboard`, `businessTeam`, `getBusinessSubscription`, `startBusinessTrial`, `enableBusiness`, `disableBusiness`, `verifyBusiness`, `createBusinessMoment`, `deleteBusinessMoment` | Verification is admin-only and server-enforced |
| Creator | `getCreatorProfile`, `getCreatorContent`, `updateCreatorProfile`, `recordCreatorView`, `enableCreatorMode` | Real audience aggregates; no earnings |
| Collection | `collections`, `getCollection`, `createCollection`, `updateCollection`, `addCollectionItem`, `removeCollectionItem` | Real visibility |
| Reward | `pointsBalance`, `pointsHistory`, `spendPoints`, `boostDatingProfile`, `streakCheckIn` | `spendPoints` accepts exactly one reason: `dating_boost` |
| Reputation | `pointsBalance` (level, level_progress_ratio, streaks) | |
| Notification | `notifications`, `unreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification` | |

## Scene bindings

27 scenes are `bound` (real reads and mutations), 2 are `dataless`
(Welcome, Permissions — legitimately no server data), 271 are
`contract-only` and render an explicit boundary rather than invented
content.

## Missing capability, per domain

Recorded as MISSING or BLOCKED. Never substituted with mock logic.

| Capability | Status | Where it would live |
|---|---|---|
| Per-item like state on the feed | **BLOCKED (deliberate)** | `feed.php` omits it to avoid an N+1 per item. The feed therefore has no reaction control |
| "Has the viewer liked this post" | **MISSING** | `GET /posts/{id}` returns `like_count` but no viewer flag. Post detail treats "liked" as session knowledge and disables afterwards |
| Per-viewer story seen state | **MISSING** | `POST /stories/{id}/view` writes one; nothing reads it back |
| Profile preferences (color world) | **MISSING** | `POST /me` takes four fields only |
| General interest tags | **MISSING** | `/dating/interests` is a dating like, not a tag list |
| Account-wide privacy | **MISSING** | Only `/dating/privacy` and per-post visibility exist |
| Community cover and member count | **MISSING** | The endpoint returns neither |
| Another user's friends / saved places / attendance | **BY DESIGN** | Caller-scoped endpoints; owner-only tabs rather than fabricated lists |
| Voice/video calling | **BLOCKED** | No signalling, TURN/STUN or call-session resource |
| Ticketing and payments | **BLOCKED** | No payment provider or ticket resource |
| Creator payouts | **BLOCKED** | Points are real; money is not |
| Reach/conversion analytics | **BLOCKED** | Real ratings, reviews and nearby impressions only |
| Analytics ingestion | **BLOCKED** | No endpoint accepts an event. `BerxAnalytics` buffers locally and takes a sink |
| WebSockets | **BLOCKED** | Typing polls every 4s and discloses it |
| Group messaging | **MISSING** | No group thread resource, so Messages has one tab |
