<?php
/**
 * BERX account settings — profile edit form.
 * Theme override of OssnProfile's forms/OssnProfile/edit.
 *
 * FORM CONTRACT PRESERVED EXACTLY. actions/edit.php reads these POST
 * names and nothing else: firstname, lastname, username, email,
 * password, language, plus whatever ossn_prepare_user_fields() emits.
 * Notably the original renders `username` TWICE — a readonly visible
 * input and a hidden one after it — and PHP keeps the LAST value, so
 * the hidden field is what actually submits. Both are kept, in the
 * same order; dropping either changes what the action receives.
 * The surrounding <form>, its action, method and security token are
 * emitted by ossn_view_form() outside this view and are untouched.
 *
 * REAL DEFECT FIXED: the username input carried an inline
 * style="background:#E8E9EA" — a hardcoded light-grey box that no
 * stylesheet could override on BERX's dark surface. Replaced with a
 * proper "locked field" treatment that still reads as non-editable.
 *
 * Only real settings appear here. OSSN registers exactly two account
 * sections engine-wide (basic + blocking), so this file does not
 * invent privacy/notification/device panels that have no backend.
 */
$user = $params['user'];
?>
<div class="berx-settings-form">

	<section class="berx-settings-group">
		<h4 class="berx-settings-group-title"><?php echo ossn_print('basic:settings'); ?></h4>

		<div class="berx-field-row">
			<div class="berx-field">
				<label for="berx-firstname"><?php echo ossn_print('first:name'); ?></label>
				<input id="berx-firstname" type='text' name="firstname" value="<?php echo $user->first_name; ?>"/>
			</div>
			<div class="berx-field">
				<label for="berx-lastname"><?php echo ossn_print('last:name'); ?></label>
				<input id="berx-lastname" type='text' name="lastname" value="<?php echo $user->last_name; ?>"/>
			</div>
		</div>

		<div class="berx-field">
			<label for="berx-username"><?php echo ossn_print('username'); ?></label>
			<?php // readonly by design in OSSN — usernames are not editable here. ?>
			<input id="berx-username" class="berx-field-locked" type='text' name="username"
			       value="<?php echo $user->username; ?>" readonly="readonly"/>
			<small class="berx-field-hint"><?php echo ossn_print('berx:settings:username:locked'); ?></small>
		</div>

		<div class="berx-field">
			<label for="berx-email"><?php echo ossn_print('email'); ?></label>
			<input id="berx-email" type='text' name="email" value="<?php echo $user->email; ?>"/>
		</div>

		<div class="berx-field">
			<label for="berx-password"><?php echo ossn_print('password'); ?></label>
			<input id="berx-password" type='password' name="password" value="" autocomplete="new-password"/>
			<small class="berx-field-hint"><?php echo ossn_print('berx:settings:password:hint'); ?></small>
		</div>
	</section>

	<?php
	$fields = ossn_prepare_user_fields($user);
	if ($fields) {
		echo '<section class="berx-settings-group berx-settings-custom-fields">';
		$vars          = array();
		$vars['items'] = $fields;
		$vars['label'] = true;
		echo ossn_plugin_view('user/fields/item', $vars);
		echo '</section>';
	}
	?>

	<section class="berx-settings-group">
		<div class="berx-field">
			<label><?php echo ossn_print('language'); ?></label>
			<?php
			//profile edit form shows wrong default language #546
			$userlanguage = ossn_site_settings('language');
			echo ossn_plugin_view('input/dropdown', array(
				'name'    => 'language',
				'value'   => $userlanguage,
				'options' => ossn_get_installed_translations(false),
			));
			?>
		</div>
	</section>

	<?php // Must stay AFTER the readonly field above — see note at top. ?>
	<input type="hidden" value="<?php echo $user->username; ?>" name="username"/>

	<div class="berx-settings-actions">
		<input type="submit" class="btn btn-primary" value="<?php echo ossn_print('save'); ?>"/>
	</div>
</div>
