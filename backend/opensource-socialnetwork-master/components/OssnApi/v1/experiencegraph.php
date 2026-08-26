<?php
/**
 * BERX API v1 — Experience Graph. See docs/BERX_FUTURE_LAYER_SPEC.md.
 * The graph AROUND one Place/Event (complements Life Graph, which is
 * the graph around one PERSON). No new class/table: real friends who
 * saved/reviewed a place, or are going to an event — computed by
 * intersecting the caller's real friend list (OssnUser::getFriends())
 * with the place/event's real relation rows, same bounded personal-
 * scale pattern as lifegraph.php's met_person. Never exposes a
 * stranger's activity as belonging to the caller's graph — only
 * real friends surface here.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'place' | 'event'
$segment1 = isset($segments[1]) ? $segments[1] : null; // guid

if ($method !== 'GET' || !in_array($segment0, array('place', 'event'), true) || !$segment1 || !is_numeric($segment1)) {
	ossn_api_error('not_found', 'Unknown experiencegraph route', 404);
}

$targetGuid = intval($segment1);
$userGuid = intval($api_user_guid);

$friendRows = (new OssnUser())->getFriends($userGuid, array('limit' => 2000, 'page_limit' => false));
$friendIds = array();
if ($friendRows) {
	foreach ($friendRows as $f) {
		$friendIds[intval($f->guid)] = $f;
	}
}

function ossn_api_experiencegraph_friend_json($f) {
	return array(
		'guid'     => intval($f->guid),
		'username' => (string) $f->username,
		'fullname' => trim($f->first_name . ' ' . $f->last_name),
		'icon'     => (string) $f->iconURL()->large,
	);
}

if ($segment0 === 'place') {
	if (!class_exists('OssnPlaces') || !(new OssnPlaces())->getPlace($targetGuid)) {
		ossn_api_error('not_found', 'Place not found', 404);
	}

	$friendsSaved = array();
	$saveRows = ossn_get_relationships(array('to' => $targetGuid, 'type' => 'place:save', 'limit' => 200, 'page_limit' => false));
	if ($saveRows) {
		foreach ($saveRows as $r) {
			$guid = intval($r->relation_from);
			if (isset($friendIds[$guid])) {
				$friendsSaved[] = ossn_api_experiencegraph_friend_json($friendIds[$guid]);
			}
		}
	}

	$friendsReviewed = array();
	$reviewRows = (new OssnDatabase())->select(array(
		'from'   => 'ossn_place_reviews',
		'wheres' => array(OssnDatabase::wheres('place_guid', '=', $targetGuid)),
		'limit'  => 200,
	), true);
	if ($reviewRows) {
		foreach ($reviewRows as $row) {
			$guid = intval($row->author_guid);
			if (isset($friendIds[$guid])) {
				$friendsReviewed[] = ossn_api_experiencegraph_friend_json($friendIds[$guid]);
			}
		}
	}

	ossn_api_json(array('target_type' => 'place', 'target_guid' => $targetGuid, 'friends_saved' => $friendsSaved, 'friends_reviewed' => $friendsReviewed));
}

// event
if (!class_exists('OssnEvents') || !(new OssnEvents())->getEvent($targetGuid)) {
	ossn_api_error('not_found', 'Event not found', 404);
}
$friendsGoing = array();
$attendeeRows = (new OssnEvents())->attendees($targetGuid, 200);
foreach ($attendeeRows as $r) {
	$guid = intval($r->relation_from);
	if (isset($friendIds[$guid])) {
		$friendsGoing[] = ossn_api_experiencegraph_friend_json($friendIds[$guid]);
	}
}
ossn_api_json(array('target_type' => 'event', 'target_guid' => $targetGuid, 'friends_going' => $friendsGoing));
