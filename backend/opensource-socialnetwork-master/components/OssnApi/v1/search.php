<?php
/**
 * BERX API v1 — Search (users/places/events/communities scopes). No
 * new class, no new table: routing over already-real OssnUser::
 * searchUsers(), OssnPlaces::listPlaces(), OssnEvents::listEvents(),
 * OssnGroup::searchGroups() (the exact method communities.php already
 * uses). Results here are intentionally lighter than the full
 * Places/Events list endpoints (guid/title/category/cover/rating
 * only) — the dispatcher loads exactly one v1 file per request, so
 * this file can't reuse places.php's/events.php's own JSON builder
 * functions; a client follows up with getPlace()/getEvent() for the
 * full record. Matches client.ts's searchPlaces()/searchEvents()/
 * searchCommunities() (existing) and the documented /search/users
 * scope, field-for-field against types.ts.
 *
 * MAX BUILD -- "Discover + Nearby + Social Map + Events = one
 * contextual discovery engine": places/events results now carry the
 * same real friends_count social-relevance signal Nearby Now already
 * has (ossn_api_friend_relevance_place_count()/_event_count(), moved
 * to ossn_com.php this session so both files can use them), and are
 * re-sorted friends-first -- a text match a friend actually engaged
 * with outranks an unconnected one, same relevance idea as Personal
 * World/Dynamic Discovery, just applied to search instead of
 * proximity. Ties keep their original relevance order (stable sort).
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'users'|'places'|'events'|'communities'

if ($method !== 'GET' || $segment0 === null) {
	ossn_api_error('not_found', 'Unknown search route', 404);
}

$q = trim((string) input('q'));
if ($q === '') {
	ossn_api_error('validation_error', 'q is required', 422);
}

$friendIds = array();
$friendRows = (new OssnUser())->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));
if ($friendRows) {
	foreach ($friendRows as $f) {
		$friendIds[intval($f->guid)] = true;
	}
}

if ($segment0 === 'users') {
	$rows = (new OssnUser())->searchUsers(array('keyword' => $q, 'limit' => 20, 'page_limit' => false));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = array(
				'guid'     => intval($row->guid),
				'username' => (string) $row->username,
				'fullname' => trim($row->first_name . ' ' . $row->last_name),
			);
		}
	}
	ossn_api_json(array('users' => $out));
}

if ($segment0 === 'places') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_json(array('places' => array()));
	}
	$rows = (new OssnPlaces())->listPlaces(array('q' => $q, 'limit' => 20));
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'guid'          => intval($row->guid),
			'title'         => (string) $row->title,
			'category'      => $row->category,
			'cover_url'     => $row->cover_url,
			'rating'        => $row->rating,
			'friends_count' => ossn_api_friend_relevance_place_count(intval($row->guid), $friendIds),
		);
	}
	// Friends-first, stable — ties keep listPlaces()'s own relevance order.
	usort($out, function ($a, $b) {
		return $b['friends_count'] <=> $a['friends_count'];
	});
	ossn_api_json(array('places' => $out));
}

if ($segment0 === 'events') {
	if (!class_exists('OssnEvents')) {
		ossn_api_json(array('events' => array()));
	}
	$eventsModel = new OssnEvents();
	$rows = $eventsModel->listEvents(array('q' => $q, 'limit' => 20));
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'guid'          => intval($row->guid),
			'title'         => (string) $row->title,
			'category'      => $row->category,
			'starts'        => $row->starts,
			'cover_url'     => $row->cover_url,
			'friends_count' => ossn_api_friend_relevance_event_count($eventsModel, intval($row->guid), $friendIds),
		);
	}
	// Friends-first, stable — ties keep listEvents()'s own relevance order.
	usort($out, function ($a, $b) {
		return $b['friends_count'] <=> $a['friends_count'];
	});
	ossn_api_json(array('events' => $out));
}

if ($segment0 === 'communities') {
	$model = new OssnGroup();
	$rows = $model->searchGroups($q, array('limit' => 20, 'page_limit' => false));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$owner = ossn_user_by_guid($row->owner_guid);
			$countModel = new OssnGroup();
			$countModel->guid = $row->guid;
			$memberCount = $countModel->getMembers(true);
			$out[] = array(
				'guid'          => intval($row->guid),
				'title'         => (string) $row->title,
				'owner'         => $owner ? (string) $owner->username : null,
				'members'       => $memberCount ? intval($memberCount) : 0,
				'friends_count' => ossn_api_friend_relevance_group_count(intval($row->guid), $friendIds),
			);
		}
	}
	// Friends-first, stable — same real relevance signal as places/events above.
	usort($out, function ($a, $b) {
		return $b['friends_count'] <=> $a['friends_count'];
	});
	ossn_api_json(array('communities' => $out));
}

ossn_api_error('not_found', 'Unknown search scope', 404);
