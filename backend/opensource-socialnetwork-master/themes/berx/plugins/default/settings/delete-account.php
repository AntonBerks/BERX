<?php
/**
 * BERX Settings — Delete Account.
 *
 * Honest scope: OSSN core has no "pause/deactivate" concept — only
 * OssnUser::deleteUser(), which is PERMANENT (drops the user row, all
 * owned entities, annotations, relations and uploaded files). This
 * screen is built around exactly that, not a soft-delete that doesn't
 * exist. The confirmation step requires re-entering the current
 * password — the same real authenticate() check OssnApiToken::issueToken()
 * uses for login — so a hijacked but still-open browser tab can't
 * delete the account without the password.
 */
?>
<div class="berx-settings-section">
	<h3 class="berx-settings-section-title berx-settings-danger-title"><?php echo ossn_print('berx:settings:delete:title'); ?></h3>
	<p class="berx-settings-section-note"><?php echo ossn_print('berx:settings:delete:warning'); ?></p>

	<ul class="berx-settings-delete-list">
		<li><?php echo ossn_print('berx:settings:delete:point:posts'); ?></li>
		<li><?php echo ossn_print('berx:settings:delete:point:media'); ?></li>
		<li><?php echo ossn_print('berx:settings:delete:point:places'); ?></li>
		<li><?php echo ossn_print('berx:settings:delete:point:irreversible'); ?></li>
	</ul>

	<form method="post" action="<?php echo ossn_site_url('action/user/account/delete', true); ?>"
	      class="berx-settings-delete-form"
	      onsubmit="return confirm(<?php echo htmlspecialchars(json_encode(ossn_print('berx:settings:delete:confirm')), ENT_QUOTES, 'UTF-8'); ?>);">
		<label for="berx-delete-password"><?php echo ossn_print('berx:settings:delete:password:label'); ?></label>
		<input type="password" id="berx-delete-password" name="password" required autocomplete="current-password" />
		<button type="submit" class="berx-settings-delete-btn"><?php echo ossn_print('berx:settings:delete:submit'); ?></button>
	</form>
</div>
