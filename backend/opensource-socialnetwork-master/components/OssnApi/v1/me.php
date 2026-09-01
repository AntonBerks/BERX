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
	$checkinsCount = class_exists('OssnPlaces') ? intval(ossn_get_relationships(array('from' => $guid, 'type' => OssnPlaces::CHECKIN_RELATION, 'count' => true))) : 0;
	// BERX WORLD — same real COUNT() pattern, kept identical to
	// profiles.php's own reputation block so neither goes stale
	// relative to the other.
	$momentsRow = $db->select(array('from' => 'ossn_moments', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$memoriesRow = $db->select(array('from' => 'ossn_memories', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$plansRow = $db->select(array('from' => 'ossn_plans', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$worldsRow = $db->select(array('from' => 'ossn_worlds', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	// BERX WORLD — same real COUNT() pattern, kept identical to
	// profiles.php's own reputation block so neither goes stale
	// relative to the other. owner_guid on ossn_post_polls is real,
	// denormalized data (see upgrade/upgrades/1785172100.php's own
	// header) — never a join through OssnObject metadata just to
	// count polls.
	$pollsRow = $db->select(array('from' => 'ossn_post_polls', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	return array(
		'places_reviewed'     => $reviewsRow ? intval($reviewsRow->cnt) : 0,
		'events_going'        => $eventsGoing,
		'trips_created'       => $tripsRow ? intval($tripsRow->cnt) : 0,
		'experiences_created' => $experiencesRow ? intval($experiencesRow->cnt) : 0,
		'checkins_count'      => $checkinsCount,
		'moments_created'     => $momentsRow ? intval($momentsRow->cnt) : 0,
		'memories_saved'      => $memoriesRow ? intval($memoriesRow->cnt) : 0,
		'plans_created'       => $plansRow ? intval($plansRow->cnt) : 0,
		'worlds_created'      => $worldsRow ? intval($worldsRow->cnt) : 0,
		'polls_created'       => $pollsRow ? intval($pollsRow->cnt) : 0,
	);
}

function ossn_api_me_to_json($user) {
	return array(
		'guid'         => intval($user->guid),
		'username'     => (string) $user->username,
		'fullname'     => trim($user->first_name . ' ' . $user->last_name),
		// MAX BUILD — exposed alongside the existing combined `fullname`
		// (kept as-is, still used everywhere else) so a real profile
		// editor can pre-fill the two fields updateProfile() actually
		// accepts separately, instead of guessing a split point in
		// `fullname` on the client.
		'first_name'   => (string) $user->first_name,
		'last_name'    => (string) $user->last_name,
		'email'        => (string) $user->email,
		// ->large is 100x100 (see ossn_user_image_sizes()) — the closest
		// existing size to a generic profile-icon use, there is no
		// "medium" defined.
		'icon_url'     => (string) $user->iconURL()->large,
		// MAX BUILD — real profile cover photo (OssnProfile::getCoverURL(),
		// classes/OssnProfile.php — the same real mechanism the web UI's
		// own profile header already uses). Null, never a transparent
		// placeholder URL dressed up as a real cover, until the user
		// actually uploads one — matches OssnUser::getProfileCover()'s
		// own real gate.
		'cover_url'    => ossn_api_me_cover_url($user),
		'profile_url'  => (string) $user->profileURL(),
		'time_created' => intval($user->time_created),
		'reputation'   => ossn_api_me_reputation($user->guid),
		// MAX BUILD — real signal for admin-only client UI (Admin
		// screens like admin.php's own unvalidated-users queue and
		// report.php's moderation queue were fully real but had no
		// entry point anywhere, since the client had no way to know
		// who's an admin to gate the menu item on). Uses
		// ossn_api_is_admin() (ossn_com.php), not ossn_isAdminLoggedin()
		// — the latter needs $_SESSION populated, which no bearer-token
		// API request ever does; this field only controls what the
		// client OFFERS to show, the server re-checks independently on
		// every actual admin route.
		'is_admin'     => ossn_api_is_admin($user->guid),
	);
}

/** Real gate matching OssnUser::getProfileCover()'s own check — a user with no uploaded cover gets null, never a transparent-placeholder URL. */
function ossn_api_me_cover_url($user) {
	if (!$user || empty($user->cover_guid) || !class_exists('OssnProfile')) {
		return null;
	}
	$url = (new OssnProfile())->getCoverURL($user);
	return $url ? (string) $url : null;
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

/**
 * MAX BUILD — real Remove Avatar. OssnPhotos::deleteProfilePhoto() was
 * always real (also deletes every resized copy on disk, confirmed by
 * reading its full body) but had zero UI caller anywhere — a user
 * could set an avatar but never remove it back to the default. Same
 * real "only clear icon_guid if this was actually still the current
 * photo" check as the native web action.
 */
if ($segment0 === 'avatar' && $method === 'DELETE') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user || empty($user->icon_guid)) {
		ossn_api_error('not_found', 'No avatar to delete', 404);
	}
	if (class_exists('OssnPhotos')) {
		$photos = new OssnPhotos();
		$photos->photoid = intval($user->icon_guid);
		$photos->deleteProfilePhoto();
	}
	$user->data->icon_time = time();
	$user->data->icon_guid = false;
	$user->save();
	$fresh = ossn_api_me_fetch($api_user_guid);
	ossn_api_json(array('status' => 'ok', 'icon_url' => (string) $fresh->iconURL()->large));
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

/**
 * MAX BUILD — real Profile Cover Photo. Wraps the exact real,
 * already-shipped mechanism the web UI's own profile header uses
 * (components/OssnProfile/actions/cover/upload.php) — subtype
 * 'profile:cover', field 'coverphoto', the same max-1500px-then-2000px
 * resize rule, OssnProfile::ResetCoverPostition() +
 * ::addPhotoWallPost() (a real "changed their cover photo" wall post,
 * same as the avatar upload right above). No session bridge needed —
 * neither OssnFile::addFile() nor OssnProfile's methods here call
 * ossn_loggedin_user() internally (confirmed by reading both before
 * writing this, per this file's own header note on that constraint).
 */
if ($segment0 === 'cover' && $method === 'POST') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}

	$file = new OssnFile();
	$file->owner_guid = $user->guid;
	$file->type       = 'user';
	$file->subtype    = 'profile:cover';
	// Field name 'coverphoto' matches the real web upload action exactly.
	$file->setFile('coverphoto');
	$file->setPath('profile/cover/');
	if (function_exists('ossn_file_is_cdn_storage_enabled') && ossn_file_is_cdn_storage_enabled()) {
		$file->setStore('cdn');
	}
	$file->setExtension(array('jpg', 'png', 'jpeg', 'jfif', 'gif', 'webp'));

	// Same real dimension rule as the native action: cap the working
	// image at 1500x1500 (preserving aspect ratio), and only THEN, if
	// that capped width still comes out under 1200px, ask for a larger
	// 2000x2000 working copy instead.
	if (isset($file->file['tmp_name']) && is_file($file->file['tmp_name'])) {
		$dim = @getimagesize($file->file['tmp_name']);
		if ($dim && $dim[0] > 0) {
			$maxW = 1500;
			$maxH = 1500;
			$ratio = $dim[1] / $dim[0];
			$w = $maxW;
			$h = $w * $ratio;
			if ($h > $maxH) {
				$h = $maxH;
				$w = (int) round($h / $ratio);
			}
			if ($w < 1200) {
				$file->setImageDim(2000, 2000, false);
			}
		}
	}

	$fileguid = $file->addFile();
	if (!$fileguid) {
		ossn_api_error('upload_failed', $file->getFileUploadError($file->error), 422);
	}

	$user->data->cover_time = time();
	$user->data->cover_guid = $fileguid;
	$user->save();

	if (class_exists('OssnProfile')) {
		$profile = new OssnProfile();
		$profile->ResetCoverPostition($user->guid);
		$profile->addPhotoWallPost($user->guid, $fileguid, 'cover:photo');
	}

	$fresh = ossn_api_me_fetch($api_user_guid);
	ossn_api_json(array('status' => 'ok', 'cover_url' => ossn_api_me_cover_url($fresh)));
}

if ($segment0 === 'cover' && $method === 'DELETE') {
	$user = ossn_api_me_fetch($api_user_guid);
	if (!$user || empty($user->cover_guid)) {
		ossn_api_error('not_found', 'No cover photo to delete', 404);
	}
	if (class_exists('OssnPhotos')) {
		$photos = new OssnPhotos();
		$photos->photoid = intval($user->cover_guid);
		$photos->deleteProfileCoverPhoto();
	}
	$user->data->cover_time = time();
	$user->data->cover_guid = false;
	$user->save();
	ossn_api_json(array('status' => 'ok'));
}

/**
 * MAX BUILD — real Referrals: see classes/OssnReferrals.php's own
 * header. `code` is derived, not stored (base36 of the caller's own
 * real guid) — nothing here is a secret.
 */
if ($segment0 === 'referral' && $method === 'GET') {
	if (!class_exists('OssnReferrals')) {
		ossn_api_error('not_found', 'Referrals not available', 404);
	}
	$model = new OssnReferrals();
	ossn_api_json(array(
		'code'           => OssnReferrals::codeFor($api_user_guid),
		'referred_count' => $model->referredCount($api_user_guid),
	));
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
