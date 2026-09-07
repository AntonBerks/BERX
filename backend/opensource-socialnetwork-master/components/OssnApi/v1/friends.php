<?php
/**
 * BERX API v1 — Friends (list). Wraps the real, core
 * OssnUser::getFriends() — returns a real PHP array (built via a real
 * foreach loop inside searchUsers(), confirmed by reading it before
 * writing this — no (array) cast needed here, unlike several
 * BERX-authored list*() methods elsewhere in this API).
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown friends action', 404);
}

$userModel = new OssnUser();
$rows = $userModel->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));

$out = array();
if ($rows) {
	foreach ($rows as $row) {
		$out[] = array(
			'guid'     => intval($row->guid),
			'username' => (string) $row->username,
			'fullname' => trim($row->first_name . ' ' . $row->last_name),
			'icon'     => (string) $row->iconURL()->large,
		);
	}
}
ossn_api_json(array('friends' => $out));
