<?php
/**
 * BERX API v1 — Daily Missions. No new class, no new table: real
 * completion checks over already-real data (OssnWall posts,
 * ossn_relationships 'place:save'/'event:going', ossn_place_reviews),
 * real reward via the existing OssnPoints::award(...,$oneTime=true) —
 * the SAME duplicate-prevention mechanism streak milestones already
 * use (OssnPoints::recordActivity()'s `hasReason()` check), just with
 * a date-suffixed reason string ("mission:{key}:{date}") instead of a
 * new completions table. `reason` is varchar(64); the longest real
 * key here ("mission:save_place:2026-08-26") is 29 chars, well inside
 * that.
 *
 * Missions are a fixed, real, in-code catalog (not a DB-configurable
 * system) — the smallest real slice, not speculative infrastructure
 * for a mission editor nobody asked for yet.
 */

function ossn_api_missions_catalog() {
	return array(
		'checkin'    => array('title' => 'Open BERX today', 'points' => 5),
		'post'       => array('title' => 'Share a post', 'points' => 10),
		'save_place' => array('title' => 'Save a place', 'points' => 10),
		'rsvp_event' => array('title' => 'RSVP to an event', 'points' => 10),
		'review'     => array('title' => 'Write a place review', 'points' => 15),
	);
}

/** Real, server-verified condition for each mission — never trusts the client. */
function ossn_api_mission_condition_met($key, $userGuid, $todayStart) {
	if ($key === 'checkin') {
		return true;
	}
	if ($key === 'post') {
		$posts = (new OssnWall())->getPosterPosts($userGuid);
		if ($posts) {
			foreach ($posts as $post) {
				if (intval($post->time_created) >= $todayStart) {
					return true;
				}
			}
		}
		return false;
	}
	if ($key === 'save_place') {
		return intval(ossn_get_relationships(array('from' => $userGuid, 'type' => 'place:save', 'count' => true, 'wheres' => "r.time >= {$todayStart}"))) > 0;
	}
	if ($key === 'rsvp_event') {
		return intval(ossn_get_relationships(array('from' => $userGuid, 'type' => 'event:going', 'count' => true, 'wheres' => "r.time >= {$todayStart}"))) > 0;
	}
	if ($key === 'review') {
		$row = (new OssnDatabase())->select(array(
			'from'   => 'ossn_place_reviews',
			'params' => array('COUNT(*) as cnt'),
			'wheres' => array(
				OssnDatabase::wheres('author_guid', '=', $userGuid),
				OssnDatabase::wheres('time_created', '>=', $todayStart),
			),
		));
		return $row && intval($row->cnt) > 0;
	}
	return false;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // mission key
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'claim'

$catalog = ossn_api_missions_catalog();
$userGuid = intval($api_user_guid);
$today = date('Y-m-d');
$todayStart = strtotime($today . ' 00:00:00');
$points = new OssnPoints();

if ($segment0 === null && $method === 'GET') {
	$out = array();
	foreach ($catalog as $key => $def) {
		$out[] = array(
			'key'       => $key,
			'title'     => $def['title'],
			'points'    => $def['points'],
			'completed' => $points->hasReason($userGuid, "mission:{$key}:{$today}"),
		);
	}
	ossn_api_json(array('date' => $today, 'missions' => $out));
}

if ($segment0 !== null && $segment1 === 'claim' && $method === 'POST') {
	if (!isset($catalog[$segment0])) {
		ossn_api_error('not_found', 'Unknown mission', 404);
	}
	if ($segment0 === 'checkin') {
		// The real streak system itself — never re-implemented, just
		// invoked, so a checkin claim is also a real streak day.
		(new OssnPoints())->recordActivity($userGuid);
	}
	if (!ossn_api_mission_condition_met($segment0, $userGuid, $todayStart)) {
		ossn_api_error('not_completed', 'Mission condition not met yet', 409);
	}
	$reason = "mission:{$segment0}:{$today}";
	$def = $catalog[$segment0];
	$ok = $points->award($userGuid, $def['points'], $reason, null, true);
	if (!$ok) {
		ossn_api_error('already_claimed', 'Mission already claimed today', 409);
	}
	ossn_api_json(array('status' => 'ok', 'points' => $def['points']));
}

ossn_api_error('not_found', 'Unknown missions route', 404);
