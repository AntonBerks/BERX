<?php
/**
 * BERX — group owner demotes a moderator back to a regular member.
 * Owner-only, same reasoning as add.php.
 */
$user = ossn_loggedin_user();
if (!$user) {
	redirect(REF);
}

$group_guid = input('group');
$target_guid = intval(input('user'));
$group = ossn_get_group_by_guid($group_guid);
if (!$group) {
	ossn_trigger_message(ossn_print('member:add:error'), 'error');
	redirect(REF);
}
if ($group->owner_guid !== $user->guid && !ossn_isAdminLoggedin()) {
	ossn_trigger_message(ossn_print('member:add:error'), 'error');
	redirect(REF);
}

$ok = ossn_delete_relationship(array(
	'from' => $group->guid,
	'to'   => $target_guid,
	'type' => 'group:moderator',
));
if ($ok) {
	ossn_trigger_message(ossn_print('berx:group:moderator:removed'), 'success');
} else {
	ossn_trigger_message(ossn_print('berx:group:moderator:error'), 'error');
}
redirect(REF);
