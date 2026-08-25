<?php
/**
 * BERX theme override of components/OssnGroups/plugins/default/forms/OssnGroups/edit.php
 * Adds a category <select>, pre-selected to the group's current category
 * (persisted separately by OssnCommunities). Everything else unchanged.
 */
$group = $params['group'];
$open  = "";
$close = "";
$current_category = null;
if (class_exists('OssnCommunityCategory')) {
	$cat = new OssnCommunityCategory;
	$current_category = $cat->getCategory($group->guid);
}
$categories = class_exists('OssnCommunityCategory') ? OssnCommunityCategory::categories() : array();
?>
<label><?php echo ossn_print('group:name'); ?></label>
<input type="text" name="groupname" value="<?php echo $group->title; ?>"/>
<label><?php echo ossn_print('group:desc'); ?></label>

<textarea name="groupdesc"><?php echo $group->description; ?></textarea>
<br/>

<?php if (!empty($categories)) { ?>
<label><?php echo ossn_print('communities:category'); ?></label>
<select name="category">
	<?php foreach ($categories as $slug => $label) { ?>
		<option value="<?php echo $slug; ?>" <?php echo ($slug === $current_category) ? 'selected' : ''; ?>><?php echo htmlspecialchars($label, ENT_QUOTES, 'UTF-8'); ?></option>
	<?php } ?>
</select>
<br/>
<?php } ?>

<label><?php echo ossn_print('privacy'); ?></label>
<select name="membership">
    <?php
    if ($group->membership == OSSN_PUBLIC) {
        $open = 'selected';
        $close = '';
    } elseif ($group->membership == OSSN_PRIVATE) {
        $close = 'selected';
        $open = '';
    }
    ?>
    <option value='2' <?php echo $open; ?>> <?php echo ossn_print('public'); ?> </option>
    <option value='1' <?php echo $close; ?>> <?php echo ossn_print('close'); ?> </option>
</select>
<input type="hidden" name="group" value="<?php echo $group->guid; ?>"/>
<input type="submit" value="<?php echo ossn_print('save'); ?>" class="btn btn-success btn-sm"/>
<a class="btn btn-warning btn-sm" href="<?php echo ossn_site_url("action/group/cover/delete?guid={$group->guid}", true);?>"><i class="fa fa-trash"></i><?php echo ossn_print('group:delete:cover');?></a>
<?php
	echo ossn_plugin_view('output/url', array(
			'text' => ossn_print('delete'),
			'href' => ossn_site_url("action/group/delete?guid=$group->guid"),
			'class' => 'btn btn-danger btn-sm delete-group ossn-make-sure',
			'action' => true,
	));
