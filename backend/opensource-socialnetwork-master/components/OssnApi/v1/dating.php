<?php
/**
 * BERX API v1 — Dating / Match. Wraps the new, real OssnDating class.
 *
 * MAX BUILD — photo upload/streaming/cross-user-listing are now real
 * (OssnDating::addPhoto()/storagePath(), matching the comment this
 * file previously carried — "added the same day a real client method
 * ships"). GET .../media is private-by-default and token-gated: this
 * whole resource already requires a valid bearer token before this
 * file is even included (not on the dispatcher's public whitelist),
 * and the real per-photo access check still happens via
 * canViewPhoto() (owner OR a real granted access row) — same model as
 * stories.php's own media route.
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

if ($segment0 === 'photos' && !isset($segments[1]) && $method === 'GET') {
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

/**
 * Another user's photo list — `can_view` is the real, per-photo
 * canViewPhoto() result (owner is never the caller here, so this is
 * always the "am I the owner OR do I hold a granted access row"
 * check), not the client's guess. Never returns the file itself —
 * only the id a client then requests /media or /photo-request with.
 */
if ($segment0 === 'photos' && isset($segments[1]) && $segments[1] === 'user' && isset($segments[2]) && $method === 'GET') {
	$rows = $model->ownPhotos(intval($segments[2]));
	$out = array();
	foreach ($rows as $row) {
		$out[] = array(
			'id'        => intval($row->id),
			'mime_type' => (string) $row->mime_type,
			'can_view'  => $model->canViewPhoto($row, $api_user_guid),
		);
	}
	ossn_api_json(array('photos' => $out));
}

if ($segment0 === 'photos' && $method === 'POST') {
	if (!isset($_FILES['photo']) || !isset($_FILES['photo']['tmp_name'])) {
		ossn_api_error('validation_error', 'photo file is required', 422);
	}
	$originalName = isset($_FILES['photo']['name']) ? (string) $_FILES['photo']['name'] : '';
	$id = $model->addPhoto($api_user_guid, $_FILES['photo']['tmp_name'], $originalName);
	if (!$id) {
		ossn_api_error('upload_failed', 'Could not upload photo — check format (JPEG/PNG/WebP/GIF)', 422);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 === 'photos' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'media' && $method === 'GET') {
	$photo = $model->getPhoto(intval($segments[1]));
	if (!$photo || !$model->canViewPhoto($photo, $api_user_guid)) {
		ossn_api_error('not_found', 'Photo not found', 404);
	}
	$path = $model->storagePath($photo);
	if (!is_file($path)) {
		ossn_api_error('not_found', 'Photo file missing', 404);
	}
	header('Content-Type: ' . $photo->mime_type);
	header('Content-Length: ' . filesize($path));
	readfile($path);
	exit;
}

if ($segment0 === 'photos' && isset($segments[1]) && $segments[1] !== 'user' && !isset($segments[2]) && $method === 'DELETE') {
	$ok = $model->deletePhoto(intval($segments[1]), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 === 'interests' && $method === 'POST') {
	$other = input('user');
	if (!$other) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$result = $model->like($api_user_guid, intval($other));
	// MAX BUILD — real, distinguishable 429 now that isActionRateLimited()
	// exists — previously every failure looked identical to the client
	// (see DatingDiscoverScreen.tsx's own now-stale disclosed-limitation
	// comment about this exact ambiguity).
	if ($result['status'] === 'rate_limited') {
		ossn_api_error('rate_limited', 'Too many dating actions — try again in a minute', 429);
	}
	ossn_api_json($result);
}

if ($segment0 === 'pass' && $method === 'POST') {
	$other = input('user');
	if (!$other) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$result = $model->pass($api_user_guid, intval($other));
	if ($result === 'rate_limited') {
		ossn_api_error('rate_limited', 'Too many dating actions — try again in a minute', 429);
	}
	ossn_api_json(array('status' => $result === 'ok' ? 'ok' : 'failed'));
}

if ($segment0 === 'boost' && $method === 'POST') {
	$result = $model->boostProfile($api_user_guid);
	if ($result['status'] !== 'ok') {
		$status = $result['status'] === 'no_profile' ? 404 : ($result['status'] === 'insufficient_balance' ? 402 : 422);
		ossn_api_error($result['status'], 'Could not boost profile', $status);
	}
	ossn_api_json(array('status' => 'ok', 'boosted_until' => $result['boosted_until']));
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

/**
 * MAX BUILD — real Dating <-> Places connection: "Идеи для свидания".
 * A real mutual match is required (isMutual(), same guard every other
 * match-scoped route in this file relies on) — never suggestible
 * against a stranger. Real top-rated places within 10km of the
 * caller's own real dating-profile coordinates (OssnGeo::near(), same
 * bounding-box+haversine query nearby.php already uses), sorted by
 * real rating, never a guessed "romantic spot" list.
 */
if ($segment0 === 'date-ideas' && $method === 'GET') {
	$otherGuid = input('match');
	if (!$otherGuid || !is_numeric($otherGuid)) {
		ossn_api_error('validation_error', 'match is required', 422);
	}
	$otherGuid = intval($otherGuid);
	if (!$model->isMutual($api_user_guid, $otherGuid)) {
		ossn_api_error('forbidden', 'Not a mutual match', 403);
	}
	$myProfile = $model->getProfile($api_user_guid);
	if (!$myProfile || $myProfile->latitude === null || $myProfile->longitude === null) {
		ossn_api_error('no_location', 'Set your dating location first', 422);
	}
	$out = array();
	if (class_exists('OssnGeo') && class_exists('OssnPlaces')) {
		$geo = new OssnGeo();
		$placesModel = new OssnPlaces();
		$rows = $geo->near(floatval($myProfile->latitude), floatval($myProfile->longitude), 10, 'place', 60);
		foreach ($rows as $row) {
			$place = $placesModel->getPlace($row->object_guid);
			if (!$place) {
				continue;
			}
			$out[] = array(
				'guid'          => intval($place->guid),
				'title'         => (string) $place->title,
				'category'      => $place->category !== null ? (string) $place->category : null,
				'cover_url'     => $place->cover_url,
				'rating'        => $place->rating,
				'rating_count'  => $place->rating_count,
				'distance_km'   => $row->distance,
			);
		}
		// Real rating first (a genuine "worth going to" signal), distance as tiebreak — never a random/guessed order.
		usort($out, function ($a, $b) {
			return ($b['rating'] <=> $a['rating']) ?: ($a['distance_km'] <=> $b['distance_km']);
		});
		$out = array_slice($out, 0, 10);
	}
	ossn_api_json(array('places' => $out));
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

/** MAX BUILD — real list backing a revoke UI; photo-revoke's access_id had no way to be discovered by the owner until now. */
if ($segment0 === 'photo-access' && $method === 'GET') {
	$rows = $model->listGrantedAccess($api_user_guid);
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
	ossn_api_json(array('access' => $out));
}

ossn_api_error('not_found', 'Unknown dating action', 404);
