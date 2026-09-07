<?php
/**
 * BERX API v1 — Circles. OssnCircles is fully real and complete (see
 * classes/OssnCircles.php) — thin REST wrapper only. No public tier —
 * canAccess() covers both read and write, strictly owner-only.
 */

function ossn_api_circle_json($row) {
	$model = new OssnCircles();
	return array(
		'id'           => intval($row->id),
		'name'         => (string) $row->name,
		'kind'         => $row->kind !== null && $row->kind !== '' ? (string) $row->kind : null,
		'owner_guid'   => intval($row->owner_guid),
		'member_count' => $model->memberCount($row->id),
		'time_created' => intval($row->time_created),
	);
}

function ossn_api_circle_member_json($memberGuid) {
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

$segment0 = isset($segments[0]) ? $segments[0] : null; // circle id
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'members'
$segment2 = isset($segments[2]) ? $segments[2] : null; // member guid

$model = new OssnCircles();

if ($segment0 === null && $method === 'GET') {
	$rows = $model->listByOwner($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_circle_json($row);
	}
	ossn_api_json(array('circles' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$name = input('name');
	if (!$name) {
		ossn_api_error('validation_error', 'name is required', 422);
	}
	$kind = input('kind');
	$id = $model->create($api_user_guid, $name, $kind ? $kind : null);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not create circle', 500);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->canAccess($row, $api_user_guid)) {
		ossn_api_error('not_found', 'Circle not found', 404);
	}
	$detail = ossn_api_circle_json($row);
	$members = array();
	foreach ($model->members($row->id) as $memberRow) {
		$m = ossn_api_circle_member_json($memberRow->member_guid);
		if ($m) {
			$members[] = $m;
		}
	}
	$detail['members'] = $members;
	ossn_api_json($detail);
}

if ($segment0 !== null && $segment1 === null && $method === 'PATCH') {
	$name = input('name');
	if (!$name) {
		ossn_api_error('validation_error', 'name is required', 422);
	}
	$ok = $model->rename(intval($segment0), $api_user_guid, $name);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not rename circle', 403);
	}
	$row = $model->get(intval($segment0));
	ossn_api_json(ossn_api_circle_json($row));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$ok = $model->deleteCircle(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'members' && $segment2 !== null && $method === 'POST') {
	$result = $model->addMember(intval($segment0), $api_user_guid, intval($segment2));
	if ($result !== true) {
		$status = $result === 'forbidden' ? 403 : ($result === 'not_a_friend' ? 422 : 409);
		ossn_api_error((string) $result, 'Could not add member', $status);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'members' && $segment2 !== null && $method === 'DELETE') {
	$ok = $model->removeMember(intval($segment0), $api_user_guid, intval($segment2));
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

ossn_api_error('not_found', 'Unknown circles action', 404);
