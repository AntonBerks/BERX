# BERX V9 — API report

The archive ships no endpoint names by design ("this archive
intentionally does not invent backend endpoints"). Everything below was
read from `packages/api/src/client.ts`.

| | |
|---|---|
| Real client methods | 335 |
| Distinct `/api/v1/` paths | 84 |
| Methods referenced by bound scenes | 53 |

Backend is unchanged: OSSN/PHP + MySQL behind the existing REST
boundary. No endpoint was invented, renamed or replaced.

## Methods used by bound scenes
- `addFriend`
- `blockUser`
- `blockedUsers`
- `businessDashboard`
- `businessTeam`
- `cityMode`
- `commentOnPost`
- `communities`
- `conversations`
- `createStory`
- `datingUpdatePrivacy`
- `discoverWorlds`
- `enableCreatorMode`
- `eventCategories`
- `events`
- `experiences`
- `feed`
- `friends`
- `getCreatorContent`
- `getCreatorProfile`
- `getExperience`
- `getOwnDatingProfile`
- `getProfile`
- `identity`
- `joinCommunity`
- `likePost`
- `login`
- `markConversationRead`
- `markStoryViewed`
- `me`
- `momentsForSource`
- `muteUser`
- `mutedUsers`
- `myCommunities`
- `myGoingEvents`
- `myGroups`
- `myInterests`
- `myLifeMoments`
- `nearbyNow`
- `nearbyPlaces`
- `onlineFriends`
- `ownStories`
- `peopleDiscovery`
- `pinPost`
- `placeCategories`
- `placeOffers`
- `recentCheckins`
- `register`
- `rsvpEvent`
- `saveInterests`
- `savedPlaces`
- `searchPlaces`
- `uploadAvatar`

## All real endpoint paths
- `/admin/ban`
- `/admin/unban`
- `/admin/unvalidated`
- `/admin/validate`
- `/albums`
- `/auth/login`
- `/auth/logout`
- `/auth/register`
- `/block`
- `/business/claims/mine`
- `/business/claims/pending`
- `/circles`
- `/collections`
- `/comments`
- `/communities`
- `/communities/mine`
- `/conversations`
- `/conversations/unread-count`
- `/creator`
- `/creator/disable`
- `/creator/enable`
- `/dating/boost`
- `/dating/interests`
- `/dating/location`
- `/dating/matches`
- `/dating/pass`
- `/dating/photo-access`
- `/dating/photo-request`
- `/dating/photo-requests`
- `/dating/photo-respond`
- `/dating/photo-revoke`
- `/dating/photos`
- `/dating/privacy`
- `/dating/profile`
- `/dating/undo`
- `/dating/unmatch`
- `/discovery/people`
- `/events`
- `/events/categories`
- `/events/going`
- `/experiences`
- `/friends`
- `/giphy/trending`
- `/groups`
- `/groups/requests`
- `/identity/me`
- `/lifegraph/me`
- `/lifemoments`
- `/me`
- `/me/avatar`
- `/me/cover`
- `/me/delete`
- `/me/interests`
- `/me/referral`
- `/me/sessions`
- `/media`
- `/memories`
- `/missions`
- `/mute`
- `/next/mine`
- `/notificationprefs`
- `/notifications`
- `/notifications/read-all`
- `/notifications/unread-count`
- `/places`
- `/places/categories`
- `/places/checkins`
- `/places/saved`
- `/plans`
- `/points`
- `/points/history`
- `/points/spend`
- `/points/streak/check-in`
- `/posts`
- `/posts/drafts`
- `/posts/saved`
- `/posts/trending-hashtags`
- `/presence`
- `/report`
- `/report/queue`
- `/stories`
- `/stories/own`
- `/trips`
- `/worlds`
