<?php
/**
 * BERX API v1 — Stories. Wraps the new, real OssnStories class. The
 * media route (GET .../media) is private-by-default and token-gated —
 * this whole resource already requires a valid bearer token before
 * this file is even included (it's not on the dispatcher's public
 * whitelist), so no extra gate is needed for that alone; the real,
 * additional per-story access check still happens via
 * checkStoryAccess() below (owner/active/not-blocked).
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;
$segment2 = isset($segments[2]) ? $segments[2] : null;

$model = new OssnStories();

if ($segment0 === null && $method === 'GET') {
	$groups = $model->listActiveForViewer($api_user_guid);
	$out = array();
	foreach ($groups as $ownerGuid => $rows) {
		$owner = ossn_user_by_guid($ownerGuid);
		$stories = array();
		foreach ($rows as $row) {
			$stories[] = array(
				'id'           => intval($row->id),
				'caption'      => $row->caption !== null ? (string) $row->caption : '',
				'time_created' => intval($row->time_created),
				'mime_type'    => (string) $row->mime_type,
			);
		}
		$out[] = array(
			'owner_guid'     => intval($ownerGuid),
			'owner_username' => $owner ? (string) $owner->username : null,
			'stories'        => $stories,
		);
	}
	ossn_api_json(array('feed' => $out));
}

if ($segment0 === 'own' && $method === 'GET') {
	$rows = $model->listOwnActive($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'id'           => intval($row->id),
			'caption'      => $row->caption !== null ? (string) $row->caption : '',
			'time_created' => intval($row->time_created),
			'mime_type'    => (string) $row->mime_type,
			'time_expires' => intval($row->time_expires),
		);
	}
	ossn_api_json(array('stories' => $out));
}

if ($segment0 === null && $method === 'POST') {
	if (!isset($_FILES['story']) || !isset($_FILES['story']['tmp_name'])) {
		ossn_api_error('validation_error', 'story file is required', 422);
	}
	$caption = input('caption');
	$eventGuid = input('event_guid');
	$id = $model->addStory($api_user_guid, $_FILES['story']['tmp_name'], $caption ? $caption : '', $eventGuid ? intval($eventGuid) : null);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not create story', 422);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 !== null && $segment1 === 'view' && $method === 'POST') {
	$story = $model->get(intval($segment0));
	if (!$story || !$model->checkStoryAccess($story, $api_user_guid)) {
		ossn_api_error('not_found', 'Story not found', 404);
	}
	$model->markViewed(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'delete' && $method === 'POST') {
	$ok = $model->deleteStory(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'media' && $method === 'GET') {
	$story = $model->get(intval($segment0));
	if (!$story || !$model->checkStoryAccess($story, $api_user_guid)) {
		ossn_api_error('not_found', 'Story not found', 404);
	}
	$path = $model->storagePath($story);
	if (!is_file($path)) {
		ossn_api_error('not_found', 'Story media missing', 404);
	}
	header('Content-Type: ' . $story->mime_type);
	header('Content-Length: ' . filesize($path));
	readfile($path);
	exit;
}

if ($segment0 === 'event' && $segment1 !== null && $method === 'GET') {
	$rows = $model->listForEvent(intval($segment1), $api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$owner = ossn_user_by_guid($row->owner_guid);
		$out[] = array(
			'id'             => intval($row->id),
			'owner_guid'     => intval($row->owner_guid),
			'owner_username' => $owner ? (string) $owner->username : null,
			'caption'        => $row->caption !== null ? (string) $row->caption : '',
			'time_created'   => intval($row->time_created),
			'mime_type'      => (string) $row->mime_type,
		);
	}
	ossn_api_json(array('stories' => $out));
}

ossn_api_error('not_found', 'Unknown stories action', 404);
