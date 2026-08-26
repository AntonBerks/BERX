<?php
/**
 * BERX API v1 — Dating / Match. Wraps the new, real OssnDating class.
 * Photo UPLOAD is deliberately not exposed here — client.ts has no
 * corresponding method yet (only list/delete of already-uploaded
 * photos), so nothing here would be reachable; added the same day a
 * real client method ships, not before.
 */

function ossn_api_dating_card_json($row) {
	return array(
		'guid'      => intval($row->guid),
		'pseudonym' => (string) $row->pseudonym,
		'age'       => $row->age !== null ? intval($row->age) : null,
		'city'      => $row->city !== null ? (string) $row->city : null,
		'goal'      => $row->goal !== null ? (string) $row->goal : null,
		'bio'       => (string) $row->bio,
		'interests' => (string) $row->interests,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;

$model = new OssnDating();

if ($segment0 === 'discover' && $method === 'GET') {
	$limit  = intval(input('limit')) ?: 20;
	$offset = intval(input('offset')) ?: 0;
	$rows = $model->discover($api_user_guid, $limit, $offset);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_dating_card_json($row);
	}
	ossn_api_json(array('profiles' => $out, 'limit' => $limit, 'offset' => $offset));
}

if ($segment0 === 'profile' && $method === 'POST') {
	$pseudonym = input('pseudonym');
	if (!$pseudonym) {
		ossn_api_error('validation_error', 'pseudonym is required', 422);
	}
	$fields = array('pseudonym' => $pseudonym);
	foreach (array('age', 'city', 'goal', 'bio', 'interests') as $f) {
		$v = input($f);
		if ($v !== false) {
			$fields[$f] = $v;
		}
	}
	$ok = $model->saveProfile($api_user_guid, $fields);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not save profile', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 === 'profile' && $method === 'GET') {
	$row = $model->getProfile($api_user_guid);
	if (!$row) {
		ossn_api_error('not_found', 'No dating profile yet', 404);
	}
	ossn_api_json(array(
		'guid'      => intval($row->guid),
		'pseudonym' => (string) $row->pseudonym,
		'age'       => $row->age !== null ? intval($row->age) : null,
		'city'      => $row->city !== null ? (string) $row->city : null,
		'goal'      => $row->goal !== null ? (string) $row->goal : null,
		'bio'       => $row->bio !== null ? (string) $row->bio : null,
		'interests' => $row->interests !== null ? (string) $row->interests : null,
	));
}

if ($segment0 === 'search' && $method === 'GET') {
	$q = input('q');
	$limit  = intval(input('limit')) ?: 20;
	$offset = intval(input('offset')) ?: 0;
	$rows = $model->search($api_user_guid, $q ? $q : '', $limit, $offset);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_dating_card_json($row);
	}
	ossn_api_json(array('profiles' => $out, 'limit' => $limit, 'offset' => $offset));
}

if ($segment0 === 'unmatch' && $method === 'POST') {
	$other = input('user');
	if (!$other) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$ok = $model->unmatch($api_user_guid, intval($other));
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_matched'));
}

if ($segment0 === 'photos' && $method === 'GET') {
	$rows = $model->ownPhotos($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'id'            => intval($row->id),
			'original_name' => (string) $row->original_name,
			'mime_type'     => (string) $row->mime_type,
			'time_created'  => intval($row->time_created),
		);
	}
	ossn_api_json(array('photos' => $out));
}

if ($segment0 === 'photos' && isset($segments[1]) && $method === 'DELETE') {
	$ok = $model->deletePhoto(intval($segments[1]), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 === 'interests' && $method === 'POST') {
	$other = input('user');
	if (!$other) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$result = $model->like($api_user_guid, intval($other));
	ossn_api_json($result);
}

if ($segment0 === 'pass' && $method === 'POST') {
	$other = input('user');
	if (!$other) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$ok = $model->pass($api_user_guid, intval($other));
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 === 'undo' && $method === 'POST') {
	$restored = $model->undoLastPass($api_user_guid);
	ossn_api_json(array('status' => $restored !== null ? 'ok' : 'nothing_to_undo', 'restored_guid' => $restored));
}

if ($segment0 === 'matches' && $method === 'GET') {
	$guids = $model->matches($api_user_guid);
	$out = array();
	foreach ($guids as $guid) {
		$user = ossn_user_by_guid($guid);
		if ($user) {
			$out[] = array(
				'guid'     => intval($user->guid),
				'username' => (string) $user->username,
				'fullname' => trim($user->first_name . ' ' . $user->last_name),
			);
		}
	}
	ossn_api_json(array('matches' => $out));
}

if ($segment0 === 'location' && $method === 'PATCH') {
	$fields = array();
	if (($v = input('latitude')) !== false) {
		$fields['latitude'] = $v === '' ? null : floatval($v);
	}
	if (($v = input('longitude')) !== false) {
		$fields['longitude'] = $v === '' ? null : floatval($v);
	}
	if (($v = input('hide_location')) !== false) {
		$fields['hide_location'] = $v === '1';
	}
	// Real precondition, not enforced redundantly here: updateLocation()
	// UPDATEs by guid — with no existing profile row it affects 0 rows
	// and parent::update() still returns true (a real, non-fatal no-op),
	// so this genuinely only does something once POST /dating/profile
	// has been called at least once. Matches saveProfile()'s own header
	// comment: profile creation is the one dating call that works
	// before a profile exists; every other one needs it first.
	$ok = $model->updateLocation($api_user_guid, $fields);
	ossn_api_json(array('status' => $ok ? 'ok' : 'no_dating_profile'));
}

if ($segment0 === 'privacy' && $method === 'PATCH') {
	$fields = array();
	foreach (array('hide_profile', 'hide_online', 'hide_age', 'hide_city', 'invisible_mode') as $f) {
		$v = input($f);
		if ($v !== false) {
			$fields[$f] = $v === '1';
		}
	}
	$ok = $model->updatePrivacy($api_user_guid, $fields);
	ossn_api_json(array('status' => $ok ? 'ok' : 'no_dating_profile'));
}

if ($segment0 === 'photo-request' && $method === 'POST') {
	$photoId = input('photo_id');
	if (!$photoId) {
		ossn_api_error('validation_error', 'photo_id is required', 422);
	}
	$ok = $model->requestPhotoAccess(intval($photoId), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 === 'photo-respond' && $method === 'POST') {
	$accessId = input('access_id');
	$grant = input('grant') === '1';
	if (!$accessId) {
		ossn_api_error('validation_error', 'access_id is required', 422);
	}
	$ok = $model->respondPhotoAccess(intval($accessId), $api_user_guid, $grant);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 === 'photo-revoke' && $method === 'POST') {
	$accessId = input('access_id');
	if (!$accessId) {
		ossn_api_error('validation_error', 'access_id is required', 422);
	}
	$ok = $model->revokeAccess(intval($accessId), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 === 'photo-requests' && $method === 'GET') {
	$rows = $model->listIncomingRequests($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$requester = ossn_user_by_guid($row->requester_guid);
		if ($requester) {
			$out[] = array(
				'access_id' => intval($row->id),
				'photo_id'  => intval($row->photo_id),
				'requester' => array(
					'guid'     => intval($requester->guid),
					'username' => (string) $requester->username,
					'fullname' => trim($requester->first_name . ' ' . $requester->last_name),
					'icon'     => (string) $requester->iconURL()->large,
				),
			);
		}
	}
	ossn_api_json(array('requests' => $out));
}

ossn_api_error('not_found', 'Unknown dating action', 404);
