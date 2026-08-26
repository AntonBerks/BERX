<?php
/**
 * BERX API v1 — Block. Wraps the real, core OssnBlock class.
 * `from` is always the caller's own token identity, never accepted
 * from the request body.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;

$model = new OssnBlock();

if ($segment0 === null && $method === 'GET') {
	$userModel = new OssnUser();
	$userModel->guid = intval($api_user_guid);
	$user = $userModel->getUser();
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}
	// OssnBlock::getBlocking() is a real, but session-dependent, static
	// method — it internally reads ossn_loggedin_user()->guid with no
	// parameter to pass a guid explicitly (confirmed by reading its
	// real body before writing this). Same real, disclosed session-
	// bridge class of fix as GET /feed needed — scoped to this one call.
	$_SESSION['OSSN_USER'] = $user;
	$rows = OssnBlock::getBlocking();
	unset($_SESSION['OSSN_USER']);

	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$blocked = ossn_user_by_guid($row->relation_to);
			if ($blocked) {
				$out[] = array(
					'guid'     => intval($blocked->guid),
					'username' => (string) $blocked->username,
					'fullname' => trim($blocked->first_name . ' ' . $blocked->last_name),
					'icon'     => (string) $blocked->iconURL()->large,
				);
			}
		}
	}
	ossn_api_json(array('blocked' => $out));
}

if ($segment0 !== null && $method === 'POST') {
	$model->addBlock(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $method === 'DELETE') {
	$model->removeBlock(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown block action', 404);
