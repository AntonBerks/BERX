<?php
/**
 * BERX theme override of components/OssnGroups/plugins/default/groups/pages/about.php
 * Adds the category badge above the description. Falls back silently
 * (no badge) if OssnCommunities isn't active or the group has no category yet.
 */
$category_label = null;
if (class_exists('OssnCommunityCategory') && isset($params['group'])) {
	$cat = new OssnCommunityCategory;
	$slug = $cat->getCategory($params['group']->guid);
	if ($slug) {
		$all = OssnCommunityCategory::categories();
		$category_label = $all[$slug] ?? null;
	}
}
?>
<div class="row">
	<div class="col-lg-12">
		<?php if ($category_label) { ?>
			<span class="berx-category-badge"><?php echo htmlspecialchars($category_label, ENT_QUOTES, 'UTF-8'); ?></span>
		<?php } ?>
		<?php echo nl2br($params['group']->description); ?>
	</div>
</div>
