<?php
/**
 * BERX Notifications — full history.
 * Theme override of OssnNotifications' notifications/pages/all.
 *
 * Reproduces the original's data logic exactly (same searchNotifications()
 * calls, same toTemplate() rendering, same ossn_view_pagination()) —
 * the only addition is two REAL, already-backed controls that had no
 * entry point on this page:
 *   - "Mark all as read"  -> action/notification/mark/allread
 *     (already existed, already wired into the topbar dropdown, just
 *     never appeared on the full-history page itself)
 *   - "Delete all"        -> action/notification/delete-all (new,
 *     built this pass on OssnNotifications::deleteNotification())
 * Per-item delete and mark-as-read-on-click keep working exactly as
 * before: toTemplate()'s output already contains the real
 * .ossn-notif-delete-item control and read-tracking link, both
 * untouched here.
 */
$get = new OssnNotifications;
$notifications = $get->searchNotifications(array(
	'owner_guid' => ossn_loggedin_user()->guid,
	'offset'     => input('offset', '', 1),
	'order_by'   => 'n.guid DESC',
));
$count = $get->searchNotifications(array(
	'owner_guid' => ossn_loggedin_user()->guid,
	'count'      => true,
));

$confirm_js = 'return confirm(' . json_encode(ossn_print('berx:notifications:delete:all:confirm'), JSON_UNESCAPED_UNICODE) . ');';
?>
<div class="berx-notifications-page">
	<div class="berx-notifications-page-head">
		<h1><?php echo ossn_print('notifications'); ?></h1>
		<?php if (!empty($notifications)) { ?>
			<div class="berx-notifications-page-actions">
				<a href="<?php echo ossn_site_url('action/notification/mark/allread', true); ?>" class="berx-notif-action-btn">
					<?php echo ossn_print('ossn:notifications:mark:as:read'); ?>
				</a>
				<a href="<?php echo ossn_site_url('action/notification/delete-all', true); ?>"
				   class="berx-notif-action-btn berx-notif-action-danger"
				   onclick="<?php echo htmlspecialchars($confirm_js, ENT_QUOTES, 'UTF-8'); ?>">
					<?php echo ossn_print('berx:notifications:delete:all'); ?>
				</a>
			</div>
		<?php } ?>
	</div>

	<?php if (empty($notifications)) { ?>
		<div class="ossn-no-notification"><?php echo ossn_print('ossn:notification:no:notification'); ?></div>
	<?php } else { ?>
		<div class="ossn-notifications-all ossn-notification-page">
			<?php foreach ($notifications as $item) {
				echo $item->toTemplate();
			} ?>
		</div>
		<?php echo ossn_view_pagination($count); ?>
	<?php } ?>
</div>
