<?php
/**
 * BERX — permanent account deletion.
 *
 * Password re-authentication uses the SAME real authenticate() check
 * OssnApiToken::issueToken() uses for login — never a client-supplied
 * username, always the current session's own username, so this can
 * only ever delete the account of whoever is actually logged in.
 *
 * deleteUser() is called on a freshly loaded OssnUser (via
 * ossn_user_by_guid()), matching the exact pattern the real admin
 * delete action (actions/administrator/user/delete.php) already uses
 * — not the raw session object, which is a plausible but unverified
 * shortcut.
 */
$viewer = ossn_loggedin_user();
if (!$viewer) {
	redirect(REF);
}

$password = (string) input('password');
if ($password === '') {
	ossn_trigger_message(ossn_print('berx:settings:delete:password:required'), 'error');
	redirect(REF);
}

$check = new OssnUser();
$check->username = $viewer->username;
$check->password = $password;
$authenticated = $check->authenticate();

if (!$authenticated || intval($authenticated->guid) !== intval($viewer->guid)) {
	ossn_trigger_message(ossn_print('berx:settings:delete:password:wrong'), 'error');
	redirect(REF);
}

$target = ossn_user_by_guid($viewer->guid);
if (!$target) {
	redirect(REF);
}

if ($target->deleteUser()) {
	// Real deletion succeeded — the session's own account no longer
	// exists, so it must end here rather than leaving a session alive
	// for a user row that is gone.
	ossn_logout();
	redirect('');
} else {
	ossn_trigger_message(ossn_print('berx:settings:delete:failed'), 'error');
	redirect(REF);
}
