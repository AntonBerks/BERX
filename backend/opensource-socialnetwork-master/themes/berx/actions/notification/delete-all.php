<?php
/**
 * BERX — permanently delete ALL of the caller's own notifications.
 *
 * Real gap found by inspecting OssnNotifications: clearAll() only ever
 * sets viewed='' (marks read, matching the "notification/mark/allread"
 * action that already exists and is already wired into the topbar),
 * it never deletes a row. deleteNotification() supports exactly this —
 * passing only 'owner_guid' deletes every notification for that
 * owner — but nothing in the component ever called it that way.
 * Registered from the theme (goblue's own action-registration pattern,
 * same as group/member/remove.php and user/session/revoke.php earlier
 * this session) so OssnNotifications itself stays untouched.
 */
$user = ossn_loggedin_user();
if (!$user) {
	redirect(REF);
}

$notifications = new OssnNotifications();
if ($notifications->deleteNotification(array('owner_guid' => $user->guid))) {
	ossn_trigger_message(ossn_print('berx:notifications:deleted:all'), 'success');
} else {
	// A genuinely empty inbox also lands here (nothing matched to
	// delete), which isn't a real failure — worded accordingly rather
	// than as an error.
	ossn_trigger_message(ossn_print('berx:notifications:deleted:none'), 'success');
}
redirect('notifications/all');
