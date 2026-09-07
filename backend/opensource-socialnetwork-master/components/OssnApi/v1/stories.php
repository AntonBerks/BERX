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

	// Page-wide, not per-story: collect every id first, ask once which of
	// them this viewer has already seen.
	$allIds = array();
	foreach ($groups as $rows) {
		foreach ($rows as $row) {
			$allIds[] = intval($row->id);
		}
	}
	$seen = $model->viewedIds($allIds, $api_user_guid);

	$out = array();
	foreach ($groups as $ownerGuid => $rows) {
		$owner = ossn_user_by_guid($ownerGuid);
		$stories = array();
		$hasUnseen = false;
		foreach ($rows as $row) {
			$id = intval($row->id);
			if (!isset($seen[$id])) {
				$hasUnseen = true;
			}
			$stories[] = array(
				'id'           => $id,
				'caption'      => $row->caption !== null ? (string) $row->caption : '',
				'time_created' => intval($row->time_created),
				'mime_type'    => (string) $row->mime_type,
			);
		}
		$out[] = array(
			'owner_guid'     => intval($ownerGuid),
			'owner_username' => $owner ? (string) $owner->username : null,
			// The owner's own real avatar — already loaded above, and the
			// same iconURL() every other endpoint returns. The rail was
			// drawing initials because this was simply never sent.
			'owner_icon'     => $owner ? (string) $owner->iconURL()->large : null,
			'has_unseen'     => $hasUnseen,
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
			'id'             => intval($row->id),
			'caption'        => $row->caption !== null ? (string) $row->caption : '',
			'time_created'   => intval($row->time_created),
			'mime_type'      => (string) $row->mime_type,
			'time_expires'   => intval($row->time_expires),
			'is_highlighted' => !empty($row->is_highlighted),
			'viewer_count'   => $model->viewerCount(intval($row->id)),
		);
	}
	ossn_api_json(array('stories' => $out));
}

/**
 * MAX BUILD — Story Highlights. Owner-only toggle; real, persists past
 * the 24h expiry. See classes/OssnStories.php's own header for the
 * exact access-control mechanism this activates.
 */
if ($segment0 !== null && $segment1 === 'highlight' && $method === 'POST') {
	$enabledRaw = input('enabled');
	$enabled = $enabledRaw === '1' || $enabledRaw === 'true' || $enabledRaw === true;
	$ok = $model->setHighlighted(intval($segment0), $api_user_guid, $enabled);
	if (!$ok) {
		ossn_api_error('forbidden', 'Not allowed to highlight this story', 403);
	}
	ossn_api_json(array('status' => 'ok', 'is_highlighted' => $enabled));
}

/** Real, block-aware — see OssnStories::listHighlights()'s own header. */
if ($segment0 === 'highlights' && $segment1 !== null && $method === 'GET') {
	$rows = $model->listHighlights(intval($segment1), $api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'id'           => intval($row->id),
			'caption'      => $row->caption !== null ? (string) $row->caption : '',
			'time_created' => intval($row->time_created),
			'mime_type'    => (string) $row->mime_type,
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

/**
 * MAX BUILD — real "Кто посмотрел" (who viewed my story).
 * OssnStories::markViewed() has always written a real row here on
 * every real story open (see the POST .../view route above) — this
 * is the first read-back of that data, via the new listViewers()/
 * viewerCount() (classes/OssnStories.php). Owner-only: the story's
 * own viewer list is private to whoever posted it, same as every
 * real platform with this feature.
 */
if ($segment0 !== null && $segment1 === 'viewers' && $method === 'GET') {
	$story = $model->get(intval($segment0));
	if (!$story || intval($story->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view this list', 403);
	}
	$rows = $model->listViewers(intval($segment0));
	$out = array();
	foreach ($rows as $row) {
		$viewer = ossn_user_by_guid(intval($row->viewer_guid));
		$out[] = array(
			'guid'        => intval($row->viewer_guid),
			'username'    => $viewer ? (string) $viewer->username : null,
			'time_viewed' => intval($row->time_viewed),
		);
	}
	ossn_api_json(array('viewers' => $out, 'count' => $model->viewerCount(intval($segment0))));
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
