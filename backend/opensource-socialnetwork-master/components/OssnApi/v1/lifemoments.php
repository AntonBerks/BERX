<?php
/**
 * BERX API v1 — Life Moments (classes/OssnLifeMoments.php). Named
 * 'lifemoments', not 'moments' — that resource name is already real
 * and already means something completely different (Business
 * Moments, components/OssnApi/v1/moments.php). See OssnLifeMoments'
 * own header for the full rationale.
 *
 * Routes:
 *   POST /lifemoments                             create
 *   GET  /lifemoments/for-source/{type}/{id}       real live feed for one source
 *   GET  /lifemoments/mine                         caller's own moments
 *   GET  /lifemoments/{id}                         one moment — closes the real
 *                                                   "berx:moment:tag notification
 *                                                   has nowhere to go" gap; same
 *                                                   real canViewSource() gate as
 *                                                   for-source above
 *   DELETE /lifemoments/{id}                       owner only
 */

function ossn_api_moment_json($moment, $model) {
	$owner = ossn_user_by_guid($moment->owner_guid);
	$people = array();
	foreach ($model->peopleForMoment($moment->id) as $tag) {
		$user = ossn_user_by_guid($tag->user_guid);
		$people[] = array(
			'guid'     => intval($tag->user_guid),
			'username' => $user ? (string) $user->username : null,
			'icon'     => $user ? (string) $user->iconURL()->large : null,
		);
	}
	return array(
		'id'            => intval($moment->id),
		'owner_guid'    => intval($moment->owner_guid),
		'owner_username' => $owner ? (string) $owner->username : null,
		'owner_icon'    => $owner ? (string) $owner->iconURL()->large : null,
		'text'          => (string) $moment->text,
		'source_type'   => (string) $moment->source_type,
		'source_id'     => intval($moment->source_id),
		'place_guid'    => $moment->place_guid !== null ? intval($moment->place_guid) : null,
		'time_created'  => intval($moment->time_created),
		'people'        => $people,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'for-source' | 'mine' | moment id
$segment1 = isset($segments[1]) ? $segments[1] : null; // source type | moment id (for DELETE, unused here)
$segment2 = isset($segments[2]) ? $segments[2] : null; // source id

$model = new OssnLifeMoments();

if ($segment0 === null && $method === 'POST') {
	$withGuids = array();
	$rawWith = (string) input('with_guids');
	if ($rawWith !== '') {
		foreach (explode(',', $rawWith) as $g) {
			$g = trim($g);
			if (is_numeric($g)) {
				$withGuids[] = intval($g);
			}
		}
	}
	$result = $model->create($api_user_guid, input('source_type'), input('source_id'), input('text'), $withGuids);
	if ($result['status'] === 'forbidden') {
		ossn_api_error('forbidden', 'You were not really part of this — a Moment can only be saved by someone who was actually there', 403);
	}
	if ($result['status'] !== 'ok') {
		ossn_api_error('validation_error', 'Could not save this moment', 422);
	}
	ossn_api_json(array('id' => intval($result['id'])));
}

if ($segment0 === 'for-source' && $segment1 !== null && $segment2 !== null && is_numeric($segment2) && $method === 'GET') {
	if (!$model->canViewSource($segment1, $segment2, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view moments for this source', 403);
	}
	$out = array();
	foreach ($model->momentsForSource($segment1, $segment2, 50) as $row) {
		$out[] = ossn_api_moment_json($row, $model);
	}
	ossn_api_json(array('moments' => $out));
}

if ($segment0 === 'mine' && $segment1 === null && $method === 'GET') {
	$limit = ossn_api_page('limit') ? max(1, min(100, intval(ossn_api_page('limit')))) : 50;
	$out = array();
	foreach ($model->myMoments($api_user_guid, $limit) as $row) {
		$out[] = ossn_api_moment_json($row, $model);
	}
	ossn_api_json(array('moments' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$moment = $model->getMoment($segment0);
	if (!$moment) {
		ossn_api_error('not_found', 'Moment not found', 404);
	}
	if (!$model->canViewSource($moment->source_type, $moment->source_id, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view this moment', 403);
	}
	ossn_api_json(array('moment' => ossn_api_moment_json($moment, $model)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	if (!$model->deleteMoment($segment0, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to delete this moment', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown lifemoments action', 404);
