<?php
/**
 * BERX — group owner promotes a member to moderator.
 * Owner-only (a moderator cannot appoint another moderator — that
 * would let a moderator escalate their own group's structure, which
 * only the real owner should control). Target must be a real,
 * confirmed member first (checked via isMember()), not just anyone.
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
if (!$group->isMember($group->guid, $target_guid)) {
	ossn_trigger_message(ossn_print('berx:group:moderator:notmember'), 'error');
	redirect(REF);
}

if (ossn_add_relation($group->guid, $target_guid, 'group:moderator')) {
	ossn_trigger_message(ossn_print('berx:group:moderator:added'), 'success');
} else {
	ossn_trigger_message(ossn_print('berx:group:moderator:error'), 'error');
}
redirect(REF);
