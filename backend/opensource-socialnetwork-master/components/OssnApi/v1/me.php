<?php
/**
 * BERX API v1 — Me / Sessions / Delete account.
 * components/OssnApi/ossn_com.php's dispatcher has already validated
 * the bearer token by the time this file runs — $api_user_guid is a
 * real, verified guid, never null here (this resource is not on the
 * public whitelist).
 *
 * NO SESSION BRIDGE ANYWHERE IN THIS FILE. Every OssnUser instance used
 * below comes from OssnUser::getUser() (a pure DB fetch keyed on the
 * guid we already trust) or is a fresh, guid-scoped instance for a
 * write — never from ossn_loggedin_user()/$_SESSION. That's a
 * deliberate difference from OssnPhotos::AddPhoto() and
 * OssnPoke::addPoke() (documented elsewhere as needing an explicit
 * session bridge): those two internally call ossn_loggedin_user()
 * themselves, so the caller has no choice but to populate the session
 * first. OssnFile::addFile() and OssnUser::save()/resetPassword()
 * below do not — confirmed by reading their real implementations
 * before writing this file, not assumed by pattern.
 */

/**
 * `reputation` — Future Identity (see docs/BERX_FUTURE_LAYER_SPEC.md),
 * same real live COUNT()s as profiles.php's own addition, for the
 * caller's own account. No invented score.
 */
function ossn_api_me_reputation($guid) {
	$guid = intval($guid);
	$db = new OssnDatabase();
	$reviewsRow = $db->select(array('from' => 'ossn_place_reviews', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('author_guid', '=', $guid))));
	$tripsRow = $db->select(array('from' => 'ossn_trips', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$experiencesRow = $db->select(array('from' => 'ossn_experiences', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$eventsGoing = class_exists('OssnEvents') ? intval(ossn_get_relationships(array('from' => $guid, 'type' => 'event:going', 'count' => true))) : 0;
	return array(
		'places_reviewed'     => $reviewsRow ? intval($reviewsRow->cnt) : 0,
		'events_going'        => $eventsGoing,
		'trips_created'       => $tripsRow ? intval($tripsRow->cnt) : 0,
		'experiences_created' => $experiencesRow ? intval($experiencesRow->cnt) : 0,
	);
}

function ossn_api_me_to_json($user) {
	return array(
		'guid'         => intval($user->guid),
		'username'     => (string) $user->username,
		'fullname'     => trim($user->first_name . ' ' . $user->last_name),
		'email'        => (string) $user->email,
		// ->large is 100x100 (see ossn_user_image_sizes()) — the closest
		// existing size to a generic profile-icon use, there is no
		// "medium" defined.
		'icon_url'     => (string) $user->iconURL()->large,
		'profile_url'  => (string) $user->profileURL(),
		'time_created' => intval($user->time_created),
		'reputation'   => ossn_api_me_reputation($user->guid),
	);
}

/** Real fetch, guid-scoped — never trusts anything the client asserts about itself. */
function ossn_api_me_fetch($guid) {
	$u = new OssnUser();
	$u->guid = intval($guid);
	return $u->getUser();
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;
$segment2 = isset($segments[2]) ? $segments[2] : null;

if ($segment0 === null && $method === 'GET') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}
	ossn_api_json(ossn_api_me_to_json($user));
}

if ($segment0 === null && $method === 'PATCH') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}

	// input() returns false|string — false both when a field is absent
	// AND when it was sent empty (see libraries/ossn.lib.input.php's
	// real final `return false;`), never null. A `!== null` check would
	// have silently treated every "field omitted" case as "field sent
	// as false" and clobbered it — checked against the real function
	// body before writing these, not assumed from other examples.
	$firstname = input('firstname');
	$lastname  = input('lastname');
	$email     = input('email');
	$password  = input('password');

	$changedProfile = false;
	if ($firstname) {
		$user->first_name = $firstname;
		$changedProfile = true;
	}
	if ($lastname) {
		$user->last_name = $lastname;
		$changedProfile = true;
	}
	if ($email) {
		$user->email = $email;
		$user->type  = 'user';
		if (!$user->isEmail()) {
			ossn_api_error('invalid_email', 'Invalid email', 422);
		}
		$changedProfile = true;
	}
	if ($changedProfile) {
		$user->type = 'user';
		if (!$user->save()) {
			ossn_api_error('update_failed', 'Could not update profile', 500);
		}
	}

	if ($password) {
		$user->password = $password;
		if (!$user->isPassword()) {
			ossn_api_error('invalid_password', 'Invalid password', 422);
		}
		if (!$user->resetPassword($password)) {
			ossn_api_error('update_failed', 'Could not update password', 500);
		}
	}

	$fresh = ossn_api_me_fetch($api_user_guid);
	ossn_api_json(ossn_api_me_to_json($fresh));
}

if ($segment0 === 'avatar' && $method === 'POST') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}

	// Field name 'userphoto' matches the real web upload action exactly
	// (components/OssnProfile/actions/photo/upload.php's
	// $file->setFile('userphoto')) and client.ts's uploadAvatar().
	$file = new OssnFile();
	$file->owner_guid = $user->guid;
	$file->type       = 'user';
	$file->subtype    = 'profile:photo';
	$file->setFile('userphoto');
	$file->setPath('profile/photo/');
	if (function_exists('ossn_file_is_cdn_storage_enabled') && ossn_file_is_cdn_storage_enabled()) {
		$file->setStore('cdn');
	}
	$file->setExtension(array('jpg', 'png', 'jpeg', 'jfif', 'gif', 'webp'));

	$fileguid = $file->addFile();
	if (!$fileguid) {
		ossn_api_error('upload_failed', $file->getFileUploadError($file->error), 422);
	}

	$user->data->icon_time = time();
	$user->data->icon_guid = $fileguid;
	$user->save();

	if (isset($file->file['tmp_name'])) {
		$guid      = $user->guid;
		$file_name = $file->newfilename;
		foreach (ossn_user_image_sizes() as $size => $params) {
			$params  = explode('x', $params);
			$width   = $params[1];
			$height  = $params[0];
			$resized = ossn_resize_image($file->file['tmp_name'], $width, $height, true);
			if (!function_exists('ossn_file_is_cdn_storage_enabled') || !ossn_file_is_cdn_storage_enabled()) {
				file_put_contents(ossn_get_userdata("user/{$guid}/profile/photo/{$size}_{$file_name}"), $resized);
			} else {
				$dirlocalpath = "user/{$guid}/profile/photo/";
				$filename     = "{$size}_{$file_name}";
				$cdn          = new \CDNStorage\Controller($dirlocalpath, $fileguid);
				$cdn->mimeType = mime_content_type($file->file['tmp_name']);
				$cdn->upload($resized, $filename, 'public-read', false);
			}
		}
	}

	$profile = new OssnProfile();
	$profile->addPhotoWallPost($user->guid, $fileguid);

	$fresh = ossn_api_me_fetch($api_user_guid);
	ossn_api_json(array('status' => 'ok', 'icon_url' => (string) $fresh->iconURL()->large));
}

if ($segment0 === 'sessions' && $segment1 === null && $method === 'GET') {
	$tokenModel = new OssnApiToken();
	ossn_api_json(array('sessions' => $tokenModel->listSessions($api_user_guid)));
}

if ($segment0 === 'sessions' && $segment1 !== null && $segment2 === 'revoke' && $method === 'POST') {
	$tokenModel = new OssnApiToken();
	$ok = $tokenModel->revokeSessionById(intval($segment1), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_found'));
}

if ($segment0 === 'delete' && $method === 'POST') {
	$password = input('password');
	if (!$password) {
		ossn_api_error('validation_error', 'Password is required', 422);
	}
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}

	// Real re-authentication against the account's current password —
	// not merely "a valid bearer token is present". Matches the same
	// authenticate() path /auth/login uses, keyed by the real stored
	// username so a client can't smuggle a different identity in here.
	$check = new OssnUser();
	$check->username = $user->username;
	$check->password = $password;
	if (!$check->authenticate()) {
		ossn_api_error('invalid_credentials', 'Incorrect password', 401);
	}

	$deleteTarget = new OssnUser();
	$deleteTarget->guid = intval($api_user_guid);
	if (!$deleteTarget->deleteUser()) {
		ossn_api_error('delete_failed', 'Could not delete account', 500);
	}

	// The calling token is revoked too — this client is immediately
	// logged out, matching client.ts's deleteAccount() clearing its
	// local token unconditionally right after this call succeeds.
	$rawToken = ossn_api_bearer_token();
	if ($rawToken !== null) {
		$tokenModel = new OssnApiToken();
		$tokenModel->revokeByRawToken($rawToken);
	}

	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown me action', 404);
