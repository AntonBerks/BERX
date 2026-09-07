<?php
/**
 * BERX API v1 — Trips. OssnTrips is fully real and complete (see
 * classes/OssnTrips.php) — thin REST wrapper only.
 */

function ossn_api_trip_json($row, $viewerGuid) {
	$model = new OssnTrips();
	return array(
		'id'           => intval($row->id),
		'title'        => (string) $row->title,
		'description'  => (string) $row->description,
		'visibility'   => intval($row->visibility) === OssnTrips::VISIBILITY_PUBLIC ? 'public' : 'private',
		'owner_guid'   => intval($row->owner_guid),
		'is_own'       => intval($row->owner_guid) === intval($viewerGuid),
		'start_date'   => $row->start_date !== null ? intval($row->start_date) : null,
		'end_date'     => $row->end_date !== null ? intval($row->end_date) : null,
		// (array) cast: stops() returns a real array only when empty —
		// a non-empty result is select(..., true)'s stdClass wrapper
		// (see the fix + comment on OssnCollections::itemCount()/
		// OssnCircles::memberCount() for why a bare count() would throw).
		'stop_count'   => count((array) $model->stops($row->id, 1000)),
		'time_updated' => intval($row->time_updated),
	);
}

function ossn_api_trip_stop_json($row) {
	$resolved = ossn_api_resolve_item($row->item_type, $row->item_guid);
	return array(
		'stop_id'    => intval($row->id),
		'item_type'  => (string) $row->item_type,
		'item_guid'  => intval($row->item_guid),
		'title'      => $resolved ? $resolved['title'] : '(deleted)',
		'image_url'  => $resolved ? $resolved['image_url'] : null,
		'day_number' => intval($row->day_number),
		'note'       => $row->note !== null ? (string) $row->note : null,
	);
}

function ossn_api_trip_participant_json($memberGuid) {
	$user = ossn_user_by_guid($memberGuid);
	if (!$user) {
		return null;
	}
	return array(
		'guid'     => intval($user->guid),
		'username' => (string) $user->username,
		'fullname' => trim($user->first_name . ' ' . $user->last_name),
		'icon'     => (string) $user->iconURL()->large,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'stops' | 'participants'
$segment2 = isset($segments[2]) ? $segments[2] : null;

$model = new OssnTrips();

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	if ($userGuid) {
		$rows = $model->listByOwner(intval($userGuid), $api_user_guid);
	} else {
		$owned = $model->listByOwner($api_user_guid, $api_user_guid);
		$asParticipant = $model->listForParticipant($api_user_guid);
		// NOT array_merge($owned, $asParticipant): both are select(...,
		// true)'s real return value when non-empty — arrayObject()'s
		// stdClass wrapper, not a PHP array (see the fix + comment on
		// OssnCollections::itemCount() for why). array_merge() on a
		// stdClass throws a TypeError on PHP 8+. foreach works on
		// either shape, so merge that way instead.
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
		$out[] = ossn_api_trip_json($row, $api_user_guid);
	}
	ossn_api_json(array('trips' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	if (!$title) {
		ossn_api_error('validation_error', 'title is required', 422);
	}
	$description = input('description');
	$visibility = input('visibility') === 'public' ? OssnTrips::VISIBILITY_PUBLIC : OssnTrips::VISIBILITY_PRIVATE;
	$startDate = input('start_date');
	$endDate = input('end_date');
	$id = $model->create($api_user_guid, $title, $description ? $description : '', $visibility, $startDate ? intval($startDate) : null, $endDate ? intval($endDate) : null);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not create trip', 500);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->canView($row, $api_user_guid)) {
		ossn_api_error('not_found', 'Trip not found', 404);
	}
	$detail = ossn_api_trip_json($row, $api_user_guid);
	$stops = array();
	foreach ($model->stops($row->id) as $stopRow) {
		$stops[] = ossn_api_trip_stop_json($stopRow);
	}
	$participants = array();
	foreach ($model->participants($row->id) as $partRow) {
		$p = ossn_api_trip_participant_json($partRow->member_guid);
		if ($p) {
			$participants[] = $p;
		}
	}
	$detail['stops'] = $stops;
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
	if (($v = input('visibility')) !== false) {
		$fields['visibility'] = $v === 'public' ? OssnTrips::VISIBILITY_PUBLIC : OssnTrips::VISIBILITY_PRIVATE;
	}
	if (($v = input('start_date')) !== false) {
		$fields['start_date'] = $v === '' ? null : intval($v);
	}
	if (($v = input('end_date')) !== false) {
		$fields['end_date'] = $v === '' ? null : intval($v);
	}
	$ok = $model->update(intval($segment0), $api_user_guid, $fields);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not update trip', 422);
	}
	$row = $model->get(intval($segment0));
	ossn_api_json(ossn_api_trip_json($row, $api_user_guid));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$ok = $model->delete(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'stops' && $segment2 === null && $method === 'POST') {
	$itemType = input('item_type');
	$itemGuid = input('item_guid');
	$dayNumber = input('day_number');
	$note = input('note');
	if (!$itemType || !$itemGuid) {
		ossn_api_error('validation_error', 'item_type and item_guid are required', 422);
	}
	$result = $model->addStop(intval($segment0), $api_user_guid, $itemType, intval($itemGuid), $dayNumber ? intval($dayNumber) : 1, $note ? $note : '');
	if ($result !== true) {
		$status = $result === 'forbidden' ? 403 : ($result === 'item_not_found' ? 404 : 422);
		ossn_api_error((string) $result, 'Could not add stop', $status);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'stops' && $segment2 !== null && $method === 'DELETE') {
	$ok = $model->removeStop(intval($segment2), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'participants' && $segment2 !== null && $method === 'POST') {
	$result = $model->addParticipant(intval($segment0), $api_user_guid, intval($segment2));
	if ($result !== true) {
		$status = $result === 'forbidden' ? 403 : ($result === 'not_a_friend' ? 422 : 409);
		ossn_api_error((string) $result, 'Could not add participant', $status);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'participants' && $segment2 !== null && $method === 'DELETE') {
	$ok = $model->removeParticipant(intval($segment0), $api_user_guid, intval($segment2));
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

ossn_api_error('not_found', 'Unknown trips action', 404);
