<?php
/**
 * BERX API v1 — Profiles (public view of another user by username).
 *
 * `reputation` — Future Identity (see docs/BERX_FUTURE_LAYER_SPEC.md):
 * the same real, live COUNT()s as lifegraph.php's own summary, no
 * invented score. Deliberately conservative here: only counts that
 * are already independently public (a place review, an event you
 * attended, an experience/trip you created) — no communities_joined
 * or places_saved, which aren't independently exposed for OTHER users
 * anywhere else in this API today, unlike the caller's own /lifegraph/me.
 *
 * BERX WORLD MAX BUILD — `mutual_friends_count`: real, bounded
 * intersection of the caller's and the viewed user's real friend
 * lists (same personal-scale bounded pattern as discovery.php's own
 * "people you may know" computation) — never a guessed number, only
 * computed for non-own profiles. `mutual_communities_count`: same
 * real intersection over 'group:join:approve' relations — privacy-
 * safe by construction, since it only ever intersects with
 * communities the CALLER already belongs to (never reveals a
 * stranger's membership the caller couldn't already see by opening
 * that community's own real member list).
 */

if ($method !== 'GET' || !isset($segments[0])) {
	ossn_api_error('not_found', 'Unknown profiles action', 404);
}

$username = urldecode($segments[0]);
$user = ossn_user_by_username($username);
if (!$user) {
	ossn_api_error('not_found', 'User not found', 404);
}

if (ossn_api_is_blocked($api_user_guid, $user->guid)) {
	ossn_api_error('not_found', 'User not found', 404);
}

$isOwn = intval($user->guid) === intval($api_user_guid);
$isFriend = false;
$mutualFriendsCount = 0;
$mutualCommunitiesCount = 0;
if (!$isOwn) {
	$checker = new OssnUser();
	$isFriend = (bool) $checker->isFriend($api_user_guid, $user->guid);

	// BERX WORLD MAX BUILD — real mutual-friends count, same bounded
	// real-intersection pattern discovery.php already uses (never a
	// guessed/estimated number). Surfaced on every non-own profile,
	// not just discovery suggestions — the directive's own "mutual
	// friends" example applies wherever two real people meet, not one
	// screen.
	$myFriendRows = $checker->getFriends(intval($api_user_guid), array('limit' => 2000, 'page_limit' => false));
	$myFriendIds = array();
	if ($myFriendRows) {
		foreach ($myFriendRows as $f) {
			$myFriendIds[intval($f->guid)] = true;
		}
	}
	if ($myFriendIds) {
		$theirFriendRows = $checker->getFriends(intval($user->guid), array('limit' => 2000, 'page_limit' => false));
		if ($theirFriendRows) {
			foreach ($theirFriendRows as $f) {
				if (isset($myFriendIds[intval($f->guid)])) {
					$mutualFriendsCount++;
				}
			}
		}
	}

	// Real shared-communities count — privacy-safe by construction:
	// only intersects with communities the CALLER is already a member
	// of (never reveals a stranger's membership the caller couldn't
	// already see by opening that community's own member list).
	$myCommunityRows = ossn_get_relationships(array('to' => intval($api_user_guid), 'type' => 'group:join:approve', 'limit' => 200, 'page_limit' => false));
	$myCommunityIds = array();
	if ($myCommunityRows) {
		foreach ($myCommunityRows as $r) {
			$myCommunityIds[intval($r->relation_from)] = true;
		}
	}
	if ($myCommunityIds) {
		$theirCommunityRows = ossn_get_relationships(array('to' => intval($user->guid), 'type' => 'group:join:approve', 'limit' => 200, 'page_limit' => false));
		if ($theirCommunityRows) {
			foreach ($theirCommunityRows as $r) {
				if (isset($myCommunityIds[intval($r->relation_from)])) {
					$mutualCommunitiesCount++;
				}
			}
		}
	}
}
$isCreator = false;
if (class_exists('OssnCreator')) {
	$creatorModel = new OssnCreator();
	$isCreator = $creatorModel->isCreator($user->guid);
}

$db = new OssnDatabase();
$reviewsRow = $db->select(array('from' => 'ossn_place_reviews', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('author_guid', '=', intval($user->guid)))));
$tripsRow = $db->select(array('from' => 'ossn_trips', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', intval($user->guid)))));
$experiencesRow = $db->select(array('from' => 'ossn_experiences', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', intval($user->guid)))));
$eventsAttended = 0;
if (class_exists('OssnEvents')) {
	$eventsAttended = intval(ossn_get_relationships(array('from' => intval($user->guid), 'type' => 'event:going', 'count' => true)));
}

ossn_api_json(array(
	'guid'        => intval($user->guid),
	'username'    => (string) $user->username,
	'fullname'    => trim($user->first_name . ' ' . $user->last_name),
	'icon_url'    => (string) $user->iconURL()->large,
	'profile_url' => (string) $user->profileURL(),
	'is_own'      => $isOwn,
	'is_friend'   => $isFriend,
	'is_creator'  => (bool) $isCreator,
	'mutual_friends_count' => $mutualFriendsCount,
	'mutual_communities_count' => $mutualCommunitiesCount,
	'reputation'  => array(
		'places_reviewed'     => $reviewsRow ? intval($reviewsRow->cnt) : 0,
		'events_going'        => $eventsAttended,
		'trips_created'       => $tripsRow ? intval($tripsRow->cnt) : 0,
		'experiences_created' => $experiencesRow ? intval($experiencesRow->cnt) : 0,
	),
));
