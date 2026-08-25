<?php
/**
 * BERX Settings — Devices & Sessions.
 * $vars['sessions']: array of ossn_api_tokens rows (false = OssnApi inactive)
 *
 * Real data only: every row here is a live, non-revoked, non-expired
 * API token actually issued to this account by OssnApiToken::issueToken()
 * (mobile/desktop app logins). There is no "current web session" row —
 * OSSN's own PHP session cookie isn't tracked in this table, so listing
 * one here would be either fabricated or misleadingly incomplete.
 */
$sessions = isset($vars['sessions']) ? $vars['sessions'] : array();
?>
<div class="berx-settings-section">
	<h3 class="berx-settings-section-title"><?php echo ossn_print('berx:settings:devices:title'); ?></h3>
	<p class="berx-settings-section-note"><?php echo ossn_print('berx:settings:devices:note'); ?></p>

	<?php if ($sessions === false) { ?>
		<div class="berx-settings-empty">
			<p><?php echo ossn_print('berx:settings:devices:unavailable'); ?></p>
		</div>
	<?php } elseif (empty($sessions)) { ?>
		<div class="berx-settings-empty">
			<p><?php echo ossn_print('berx:settings:devices:empty'); ?></p>
		</div>
	<?php } else { ?>
		<div class="berx-settings-devices-list">
			<?php foreach ($sessions as $row) {
				$label = !empty($row->device_label) ? $row->device_label : ossn_print('berx:settings:devices:unnamed');
				$last  = !empty($row->time_last_used) ? ossn_user_friendly_time($row->time_last_used) : ossn_print('berx:settings:devices:never:used');
			?>
				<div class="berx-settings-device">
					<div class="berx-settings-device-icon"><i class="fa fa-mobile-alt"></i></div>
					<div class="berx-settings-device-info">
						<strong><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></strong>
						<span class="berx-settings-device-meta">
							<?php echo ossn_print('berx:settings:devices:signed:in', array(ossn_user_friendly_time($row->time_created))); ?>
							&middot;
							<?php echo ossn_print('berx:settings:devices:last:used', array($last)); ?>
						</span>
					</div>
					<form method="post" action="<?php echo ossn_site_url('action/user/session/revoke', true); ?>"
					      onsubmit="return confirm(<?php echo htmlspecialchars(json_encode(ossn_print('berx:settings:devices:revoke:confirm'), JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8'); ?>);">
						<input type="hidden" name="id" value="<?php echo intval($row->id); ?>" />
						<button type="submit" class="berx-settings-device-revoke"><?php echo ossn_print('berx:settings:devices:revoke'); ?></button>
					</form>
				</div>
			<?php } ?>
		</div>
	<?php } ?>
</div>
