<?php
/**
 * BERX API v1 — People Discovery (Max Build). No new class, no new
 * table: real mutual-friend suggestions computed by intersecting the
 * caller's real friend list with each of those friends' own real
 * friend lists (both via the same trusted OssnUser::getFriends() this
 * API already uses in friend.php/friends.php) — never a guessed
 * "similar interests" score, no AI, just real overlapping
 * friendships, same idea as every major real social graph's "people
 * you may know".
 *
 * Real, disclosed cap: only the caller's first FRIEND_SCAN_LIMIT
 * friends are expanded (each bounded to CANDIDATE_FRIENDS_LIMIT of
 * their own friends) — a personal-scale bounded computation, same
 * honesty rule as Nearby Now/Experience Graph's own row caps, not a
 * true exhaustive graph traversal. A candidate blocked in EITHER
 * direction (ossn_relation_exists(), real 'userblock' relation — see
 * OssnBlock) is excluded, never surfaced as a suggestion.
 */

if ($method !== 'GET' || (isset($segments[0]) && $segments[0] !== 'people')) {
	ossn_api_error('not_found', 'Unknown discovery route', 404);
}

$userGuid = intval($api_user_guid);
$userModel = new OssnUser();

$myFriendRows = $userModel->getFriends($userGuid, array('limit' => 2000, 'page_limit' => false));
$myFriendIds = array();
if ($myFriendRows) {
	foreach ($myFriendRows as $f) {
		$myFriendIds[intval($f->guid)] = true;
	}
}

const FRIEND_SCAN_LIMIT = 30;
const CANDIDATE_FRIENDS_LIMIT = 200;

$mutualCount = array();
$scanned = 0;
if ($myFriendRows) {
	foreach ($myFriendRows as $friend) {
		if ($scanned >= FRIEND_SCAN_LIMIT) {
			break;
		}
		$scanned++;
		$theirFriends = $userModel->getFriends(intval($friend->guid), array('limit' => CANDIDATE_FRIENDS_LIMIT, 'page_limit' => false));
		if (!$theirFriends) {
			continue;
		}
		foreach ($theirFriends as $candidate) {
			$candidateGuid = intval($candidate->guid);
			if ($candidateGuid === $userGuid || isset($myFriendIds[$candidateGuid])) {
				continue;
			}
			$mutualCount[$candidateGuid] = isset($mutualCount[$candidateGuid]) ? $mutualCount[$candidateGuid] + 1 : 1;
		}
	}
}

arsort($mutualCount);

$out = array();
$shown = 0;
foreach ($mutualCount as $candidateGuid => $count) {
	if ($shown >= 20) {
		break;
	}
	// Real block check, both directions — never a fake success that
	// silently ignores a real block.
	if (ossn_relation_exists($userGuid, $candidateGuid, 'userblock') || ossn_relation_exists($candidateGuid, $userGuid, 'userblock')) {
		continue;
	}
	$user = ossn_user_by_guid($candidateGuid);
	if (!$user) {
		continue;
	}
	$out[] = array(
		'guid'          => intval($user->guid),
		'username'      => (string) $user->username,
		'fullname'      => trim($user->first_name . ' ' . $user->last_name),
		'icon'          => (string) $user->iconURL()->large,
		'mutual_count'  => intval($count),
	);
	$shown++;
}

ossn_api_json(array('people' => $out));
