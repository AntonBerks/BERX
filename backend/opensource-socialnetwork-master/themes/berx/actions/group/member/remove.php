<?php
/**
 * BERX — owner/admin removes a member from a community.
 *
 * OssnGroup::deleteMember() already existed and is exactly what
 * self-leave (components/OssnGroups/actions/group/member/request/cancel.php)
 * calls with the CALLER's own guid. This is the same method, called
 * with a TARGET guid, gated behind the same owner/admin/moderator
 * check components/OssnGroups/actions/group/member/request/approve.php
 * already uses — no new authorization model invented, no OssnGroups
 * file touched.
 *
 * isModerator() is included in the check for parity with approve.php,
 * but it is a permanent no-op today: it calls the 'group','is:moderator'
 * hook, which no component implements, so it always returns false.
 * Kept rather than dropped so this action starts working the moment a
 * real moderator system lands, with no edit needed here.
 */
$group_guid = input('group');
$user_guid  = intval(input('user'));

$group = ossn_get_group_by_guid($group_guid);
if (!$group) {
	ossn_trigger_message(ossn_print('member:add:error'), 'error');
	redirect(REF);
}

$caller = ossn_loggedin_user();
if (!$caller) {
	redirect(REF);
}

$is_permitted = ($group->owner_guid === $caller->guid)
	|| ossn_isAdminLoggedin()
	|| $group->isModerator($caller->guid);

if (!$is_permitted) {
	ossn_trigger_message(ossn_print('member:add:error'), 'error');
	redirect(REF);
}

// The owner can never be removed through this control — kicking the
// owner would leave the group ownerless, which OssnGroup has no
// transfer flow to recover from cleanly.
if ($user_guid === intval($group->owner_guid)) {
	ossn_trigger_message(ossn_print('berx:group:remove:owner'), 'error');
	redirect(REF);
}

$target = ossn_user_by_guid($user_guid);
if (!$target) {
	ossn_trigger_message(ossn_print('member:add:error'), 'error');
	redirect(REF);
}

$model = new OssnGroup;
if ($model->deleteMember($user_guid, $group->guid)) {
	ossn_trigger_message(ossn_print('berx:group:member:removed'), 'success');
} else {
	ossn_trigger_message(ossn_print('membership:cancel:fail'), 'error');
}
redirect(REF);
