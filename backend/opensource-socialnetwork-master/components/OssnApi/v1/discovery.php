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
 *
 * MAX BUILD — real shared-communities secondary signal: same real
 * 'group:join:approve' relation intersection already used by
 * profiles.php's mutual_communities_count (privacy-safe by
 * construction, same reasoning — only ever intersects with
 * communities the CALLER already belongs to). Only computed for the
 * top RERANK_LIMIT friend-overlap candidates (not the full candidate
 * pool) to keep this a bounded, cheap re-rank rather than another
 * unbounded scan. Combined score = mutual friends weighted higher
 * than mutual communities (a real overlapping friendship is a
 * stronger "you may know them" signal than co-membership in a large
 * public community), never a fake/AI-guessed relevance score.
 */

if ($method !== 'GET' || !isset($segments[0]) || ($segments[0] !== 'people' && $segments[0] !== 'worlds')) {
	ossn_api_error('not_found', 'Unknown discovery route', 404);
}

$userGuid = intval($api_user_guid);

/**
 * GET /discovery/worlds — real public Worlds the caller has no
 * existing relationship to (see OssnWorlds::discoverPublicWorlds()'s
 * own header: not owned, no membership row of any status). Reuses
 * worlds.php's own ossn_api_world_json() shape rather than a second,
 * different world response format for the same real object.
 */
if ($segments[0] === 'worlds') {
	if (!class_exists('OssnWorlds')) {
		ossn_api_json(array('worlds' => array()));
	}
	$worldsModel = new OssnWorlds();
	$limit = input('limit') ? max(1, min(100, intval(input('limit')))) : 30;
	$rows = $worldsModel->discoverPublicWorlds($userGuid, $limit);
	$out = array();
	foreach ($rows as $row) {
		$owner = ossn_user_by_guid($row->owner_guid);
		$out[] = array(
			'id'             => intval($row->id),
			'owner_guid'     => intval($row->owner_guid),
			'owner_username' => $owner ? (string) $owner->username : null,
			'title'          => (string) $row->title,
			'description'    => $row->description !== null ? (string) $row->description : null,
			'is_temporary'   => (bool) $row->is_temporary,
			'time_created'   => intval($row->time_created),
			'member_count'   => count($worldsModel->membersForWorld($row->id)),
			'item_count'     => count($worldsModel->itemsForWorld($row->id)),
		);
	}
	ossn_api_json(array('worlds' => $out));
}
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

const RERANK_LIMIT = 50;

// My own real community memberships — computed once, only if I belong
// to any (skips the whole re-rank pass entirely otherwise).
$myCommunityIds = array();
$myCommunityRows = ossn_get_relationships(array('to' => $userGuid, 'type' => 'group:join:approve', 'limit' => 200, 'page_limit' => false));
if ($myCommunityRows) {
	foreach ($myCommunityRows as $r) {
		$myCommunityIds[intval($r->relation_from)] = true;
	}
}

$communityOverlap = array();
if ($myCommunityIds) {
	$i = 0;
	foreach ($mutualCount as $candidateGuid => $count) {
		if ($i >= RERANK_LIMIT) {
			break;
		}
		$i++;
		$theirCommunityRows = ossn_get_relationships(array('to' => intval($candidateGuid), 'type' => 'group:join:approve', 'limit' => 200, 'page_limit' => false));
		if (!$theirCommunityRows) {
			continue;
		}
		$overlap = 0;
		foreach ($theirCommunityRows as $r) {
			if (isset($myCommunityIds[intval($r->relation_from)])) {
				$overlap++;
			}
		}
		if ($overlap > 0) {
			$communityOverlap[$candidateGuid] = $overlap;
		}
	}
}

// Real combined re-rank — mutual friends weighted 3x a mutual
// community, both are genuine counted overlaps, never a guessed score.
$combined = array();
foreach ($mutualCount as $candidateGuid => $count) {
	$communityCount = isset($communityOverlap[$candidateGuid]) ? $communityOverlap[$candidateGuid] : 0;
	$combined[$candidateGuid] = ($count * 3) + $communityCount;
}
arsort($combined);

$out = array();
$shown = 0;
foreach ($combined as $candidateGuid => $score) {
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
		'guid'                    => intval($user->guid),
		'username'                => (string) $user->username,
		'fullname'                => trim($user->first_name . ' ' . $user->last_name),
		'icon'                    => (string) $user->iconURL()->large,
		'mutual_count'            => intval($mutualCount[$candidateGuid]),
		'mutual_communities_count' => isset($communityOverlap[$candidateGuid]) ? intval($communityOverlap[$candidateGuid]) : 0,
	);
	$shown++;
}

ossn_api_json(array('people' => $out));
