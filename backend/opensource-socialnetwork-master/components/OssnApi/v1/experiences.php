<?php
/**
 * BERX API v1 — Experiences. OssnExperiences is fully real and
 * complete (see classes/OssnExperiences.php) — thin REST wrapper only.
 * create() genuinely fails until Places/Events exist (Wave 3) — its
 * real resolveAnchor() needs one of them to validate the anchor
 * against (see class_exists() guards read directly from that class
 * before writing this file) — a real, typed error, not a crash.
 */

function ossn_api_experience_json($row, $viewerGuid) {
	$model = new OssnExperiences();
	$anchor = null;
	if ($row->place_guid) {
		$resolved = ossn_api_resolve_item('place', $row->place_guid);
		if ($resolved) {
			$anchor = array('type' => 'place', 'guid' => intval($row->place_guid), 'title' => $resolved['title'], 'image_url' => $resolved['image_url']);
		}
	} elseif ($row->event_guid) {
		$resolved = ossn_api_resolve_item('event', $row->event_guid);
		if ($resolved) {
			$anchor = array('type' => 'event', 'guid' => intval($row->event_guid), 'title' => $resolved['title'], 'image_url' => $resolved['image_url']);
		}
	}
	$myStatus = $model->participantStatus($row->id, $viewerGuid);
	return array(
		'id'              => intval($row->id),
		'title'           => (string) $row->title,
		'description'     => (string) $row->description,
		'anchor'          => $anchor,
		'visibility'      => intval($row->visibility) === OssnExperiences::VISIBILITY_PUBLIC ? 'public' : 'private',
		'owner_guid'      => intval($row->owner_guid),
		'is_own'          => intval($row->owner_guid) === intval($viewerGuid),
		'scheduled_start' => intval($row->scheduled_start),
		'scheduled_end'   => $row->scheduled_end !== null ? intval($row->scheduled_end) : null,
		'my_status'       => $myStatus,
	);
}

function ossn_api_experience_participant_json($row) {
	$user = ossn_user_by_guid($row->member_guid);
	if (!$user) {
		return null;
	}
	return array(
		'guid'     => intval($user->guid),
		'username' => (string) $user->username,
		'fullname' => trim($user->first_name . ' ' . $user->last_name),
		'icon'     => (string) $user->iconURL()->large,
		'status'   => (string) $row->status,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'invite' | 'respond' | 'participants'
$segment2 = isset($segments[2]) ? $segments[2] : null;

$model = new OssnExperiences();

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	if ($userGuid) {
		$rows = $model->listByOwner(intval($userGuid), $api_user_guid);
	} else {
		$owned = $model->listByOwner($api_user_guid, $api_user_guid);
		$asParticipant = $model->listForParticipant($api_user_guid);
		// NOT array_merge(): see the identical fix + comment in trips.php
		// — both can be arrayObject()'s stdClass wrapper, not a real
		// array, and array_merge() on that throws TypeError on PHP 8+.
		$byId = array();
		foreach ($owned as $row) {
			$byId[$row->id] = $row;
		}
		foreach ($asParticipant as $row) {
			$byId[$row->id] = $row;
		}
		$rows = array_values($byId);
	}
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_experience_json($row, $api_user_guid);
	}
	ossn_api_json(array('experiences' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	$scheduledStart = input('scheduled_start');
	if (!$title || !$scheduledStart) {
		ossn_api_error('validation_error', 'title and scheduled_start are required', 422);
	}
	$description = input('description');
	$placeGuid = input('place_guid');
	$eventGuid = input('event_guid');
	$scheduledEnd = input('scheduled_end');
	$visibility = input('visibility') === 'public' ? OssnExperiences::VISIBILITY_PUBLIC : OssnExperiences::VISIBILITY_PRIVATE;

	$id = $model->create(
		$api_user_guid,
		$title,
		$description ? $description : '',
		$placeGuid ? intval($placeGuid) : null,
		$eventGuid ? intval($eventGuid) : null,
		intval($scheduledStart),
		$scheduledEnd ? intval($scheduledEnd) : null,
		$visibility
	);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not create experience — needs exactly one real place or event anchor', 422);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->canView($row, $api_user_guid)) {
		ossn_api_error('not_found', 'Experience not found', 404);
	}
	$detail = ossn_api_experience_json($row, $api_user_guid);
	$participants = array();
	foreach ($model->participants($row->id) as $partRow) {
		$p = ossn_api_experience_participant_json($partRow);
		if ($p) {
			$participants[] = $p;
		}
	}
	$detail['participants'] = $participants;
	ossn_api_json($detail);
}

if ($segment0 !== null && $segment1 === null && $method === 'PATCH') {
	$fields = array();
	if (($v = input('title')) !== false) {
		$fields['title'] = $v;
	}
	if (($v = input('description')) !== false) {
		$fields['description'] = $v;
	}
	if (($v = input('scheduled_start')) !== false) {
		$fields['scheduled_start'] = intval($v);
	}
	if (($v = input('scheduled_end')) !== false) {
		$fields['scheduled_end'] = $v === '' ? null : intval($v);
	}
	if (($v = input('visibility')) !== false) {
		$fields['visibility'] = $v === 'public' ? OssnExperiences::VISIBILITY_PUBLIC : OssnExperiences::VISIBILITY_PRIVATE;
	}
	$ok = $model->update(intval($segment0), $api_user_guid, $fields);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not update experience', 422);
	}
	$row = $model->get(intval($segment0));
	ossn_api_json(ossn_api_experience_json($row, $api_user_guid));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$ok = $model->delete(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'invite' && $segment2 !== null && $method === 'POST') {
	$result = $model->invite(intval($segment0), $api_user_guid, intval($segment2));
	if ($result !== true) {
		$status = $result === 'forbidden' ? 403 : ($result === 'not_a_friend' ? 422 : 409);
		ossn_api_error((string) $result, 'Could not invite', $status);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'respond' && $method === 'POST') {
	$accept = input('accept') === '1';
	$ok = $model->respondInvite(intval($segment0), $api_user_guid, $accept);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'participants' && $segment2 !== null && $method === 'DELETE') {
	$ok = $model->removeParticipant(intval($segment0), $api_user_guid, intval($segment2));
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

ossn_api_error('not_found', 'Unknown experiences action', 404);
