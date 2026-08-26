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
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'users'|'places'|'events'|'communities'

if ($method !== 'GET' || $segment0 === null) {
	ossn_api_error('not_found', 'Unknown search route', 404);
}

$q = trim((string) input('q'));
if ($q === '') {
	ossn_api_error('validation_error', 'q is required', 422);
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
			'guid'      => intval($row->guid),
			'title'     => (string) $row->title,
			'category'  => $row->category,
			'cover_url' => $row->cover_url,
			'rating'    => $row->rating,
		);
	}
	ossn_api_json(array('places' => $out));
}

if ($segment0 === 'events') {
	if (!class_exists('OssnEvents')) {
		ossn_api_json(array('events' => array()));
	}
	$rows = (new OssnEvents())->listEvents(array('q' => $q, 'limit' => 20));
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'guid'      => intval($row->guid),
			'title'     => (string) $row->title,
			'category'  => $row->category,
			'starts'    => $row->starts,
			'cover_url' => $row->cover_url,
		);
	}
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
				'guid'    => intval($row->guid),
				'title'   => (string) $row->title,
				'owner'   => $owner ? (string) $owner->username : null,
				'members' => $memberCount ? intval($memberCount) : 0,
			);
		}
	}
	ossn_api_json(array('communities' => $out));
}

ossn_api_error('not_found', 'Unknown search scope', 404);
