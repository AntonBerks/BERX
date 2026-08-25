<?php
/**
 * BERX — revoke one of the caller's own API sessions/devices.
 * Ownership is enforced INSIDE OssnApiToken::revokeSessionById() (both
 * the row id AND the caller's own guid are in the WHERE clause), so a
 * crafted id belonging to another account's session matches zero rows
 * rather than someone else's device.
 */
$user = ossn_loggedin_user();
if (!$user) {
	redirect(REF);
}

if (!class_exists('OssnApiToken')) {
	ossn_trigger_message(ossn_print('berx:settings:devices:unavailable'), 'error');
	redirect(REF);
}

$id = intval(input('id'));
if (!$id) {
	redirect(REF);
}

$tokens = new OssnApiToken();
if ($tokens->revokeSessionById($id, $user->guid)) {
	ossn_trigger_message(ossn_print('berx:settings:devices:revoked'), 'success');
} else {
	ossn_trigger_message(ossn_print('berx:settings:devices:revoke:fail'), 'error');
}
redirect(REF);
