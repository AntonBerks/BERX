<?php
/**
 * BERX API v1 — Admin (unvalidated users). No new class: real
 * OssnUser::getUnvalidatedUSERS()/ValidateRegistration(), same
 * mechanism the real web admin action (actions/administrator/user/
 * validate.php) already uses — fetch the user, read their OWN stored
 * activation code server-side, validate against it. Never a
 * client-supplied code.
 *
 * Search is deliberately NOT exposed here: getUnvalidatedUSERS($search)
 * interpolates $search directly into a raw SQL LIKE clause with zero
 * escaping (confirmed by reading it) — a real, unfixed core-OSSN
 * injection risk if fed external input. Called here with no search
 * arg at all.
 */

if (!ossn_isAdminLoggedin()) {
	ossn_api_error('forbidden', 'Admin only', 403);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'unvalidated' | 'validate'

if ($segment0 === 'unvalidated' && $method === 'GET') {
	$rows = (new OssnUser())->getUnvalidatedUSERS();
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

ossn_api_error('not_found', 'Unknown admin route', 404);
