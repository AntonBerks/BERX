<?php
/**
 * BERX API v1 — Admin (unvalidated users). No new class: real
 * OssnUser::getUnvalidatedUSERS()/ValidateRegistration(), same
 * mechanism the real web admin action (actions/administrator/user/
 * validate.php) already uses — fetch the user, read their OWN stored
 * activation code server-side, validate against it. Never a
 * client-supplied code.
 *
 * BERX WORLD MAX BUILD — real fix: getUnvalidatedUSERS($search) used
 * to interpolate $search directly into a raw SQL LIKE clause with
 * zero escaping — a real, previously-disclosed core-OSSN injection
 * primitive, reachable via the classic web admin search box
 * (system/plugins/.../unvalidated.php). Fixed at the source
 * (OssnUser::getUnvalidatedUSERS()) by delegating to searchUsers()'s
 * own already-safe, parameterized 'keyword' path instead of hand-
 * building wheres — confirmed real (bound `?` placeholders via
 * OssnDatabase::wheres()/wheresGroup()) by reading buildWheresContent()
 * directly before trusting it. Search is now real and exposed here.
 *
 * MAX BUILD — real fix: this used to gate on ossn_isAdminLoggedin(),
 * which reads $_SESSION['OSSN_USER'] — but this dispatcher never
 * populates a session for bearer-token requests (see ossn_com.php's
 * own header). Every real admin request through the mobile app was
 * silently rejected as 403 regardless of who was calling. Now uses
 * ossn_api_is_admin($api_user_guid) — a real guid-scoped DB lookup,
 * no session needed.
 */

if (!ossn_api_is_admin($api_user_guid)) {
	ossn_api_error('forbidden', 'Admin only', 403);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'unvalidated' | 'validate'

if ($segment0 === 'unvalidated' && $method === 'GET') {
	$q = input('q');
	$rows = (new OssnUser())->getUnvalidatedUSERS($q ? $q : '');
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = array(
				'guid'         => intval($row->guid),
				'username'     => (string) $row->username,
				'fullname'     => trim($row->first_name . ' ' . $row->last_name),
				'email'        => (string) $row->email,
				'time_created' => intval($row->time_created),
			);
		}
	}
	ossn_api_json(array('users' => $out));
}

if ($segment0 === 'validate' && $method === 'POST') {
	$guidsRaw = input('guids');
	if (!$guidsRaw) {
		ossn_api_error('validation_error', 'guids is required', 422);
	}
	$results = array();
	foreach (explode(',', $guidsRaw) as $guid) {
		$guid = trim($guid);
		if (!is_numeric($guid)) {
			continue;
		}
		$user = ossn_user_by_guid(intval($guid));
		if (!$user) {
			$results[$guid] = 'not_found';
			continue;
		}
		$results[$guid] = $user->ValidateRegistration($user->activation) ? 'ok' : 'error';
	}
	ossn_api_json(array('results' => $results));
}

/**
 * MAX BUILD -- real user ban/suspend (OssnUser::ban()/unban(), see
 * classes/OssnUser.php's own header comment). This file already gates
 * on ossn_api_is_admin($api_user_guid) at the very top, so no separate
 * check is needed here.
 */
if ($segment0 === 'ban' && $method === 'POST') {
	$userGuid = input('user_guid');
	if (!$userGuid || !is_numeric($userGuid)) {
		ossn_api_error('validation_error', 'user_guid is required', 422);
	}
	$reason = input('reason');
	$ok = (new OssnUser())->ban(intval($userGuid), $api_user_guid, $reason ? $reason : '');
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 === 'unban' && $method === 'POST') {
	$userGuid = input('user_guid');
	if (!$userGuid || !is_numeric($userGuid)) {
		ossn_api_error('validation_error', 'user_guid is required', 422);
	}
	$ok = (new OssnUser())->unban(intval($userGuid), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

ossn_api_error('not_found', 'Unknown admin route', 404);
