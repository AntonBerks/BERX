<?php
/**
 * BERX theme override of components/OssnGroups/plugins/default/forms/OssnGroups/add.php
 * Adds a category <select> (persisted separately by OssnCommunities via
 * the real 'group'/'add' lifecycle callback — see components/OssnCommunities/ossn_com.php).
 * Everything else here is unchanged from the original OSSN form.
 */
$categories = class_exists('OssnCommunityCategory') ? OssnCommunityCategory::categories() : array();
?>
<div>
<label><?php echo ossn_print('group:name'); ?></label>
<input type="text" name="groupname"/>
<input type="submit" class="ossn-hidden" id="ossn-group-submit"/>
</div>
<?php if (!empty($categories)) { ?>
<div class="berx-group-category-field">
	<label><?php echo ossn_print('communities:category'); ?></label>
	<select name="category">
		<?php foreach ($categories as $slug => $label) { ?>
			<option value="<?php echo $slug; ?>"><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></option>
		<?php } ?>
	</select>
</div>
<?php } ?>
<div class="group-add-privacy">
<?php
echo ossn_plugin_view('input/privacy', array(
		'options' => array(
		    OSSN_PUBLIC =>	 ossn_print('public') . ' ('. ossn_print('privacy:group:public').')',
		    OSSN_PRIVATE =>  ossn_print('close') . ' ('. ossn_print('privacy:group:close').')',
		 ),
));
?>
</div>
