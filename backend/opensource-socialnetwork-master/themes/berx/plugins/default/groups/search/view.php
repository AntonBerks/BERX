<?php
/**
 * BERX community search results.
 * Theme override of OssnGroups' groups/search/view.
 *
 * REAL DEFECT FIXED: the original rendered a single static asset,
 * components/OssnGroups/images/search_group.png, as the thumbnail for
 * EVERY group — identical grey icon on every row — even though groups
 * that have uploaded a cover expose it via $group->coverURL(). Real
 * cover imagery is used here when it exists; groups without one get a
 * deterministic monogram derived from their own title (same treatment
 * as Discover) rather than a shared placeholder.
 *
 * Everything else is preserved: the same iteration over
 * $params['groups'], the same group URL, the same owner attribution,
 * and the .group-search-items / .group-name / .ossn-group-search-by
 * classes the existing CSS targets. Pagination is still appended by
 * groups_search_handler() after this view.
 */
if (!function_exists('berx_group_monogram')) {
	function berx_group_monogram($name) {
		$name = trim((string) $name);
		$letter = $name === '' ? '?' : mb_strtoupper(mb_substr($name, 0, 1, 'UTF-8'), 'UTF-8');
		$hue = hexdec(substr(md5($name), 0, 2)) % 360;
		return '<span class="berx-monogram" style="--berx-monogram-hue:' . intval($hue) . '">'
			. htmlspecialchars($letter, ENT_QUOTES, 'UTF-8')
			. '</span>';
	}
}

if ($params['groups']) {
	echo "<div class='group-search-items'>";
	foreach ($params['groups'] as $group) {
		$owner = ossn_user_by_guid($group->owner_guid);
		$cover = method_exists($group, 'coverURL') ? $group->coverURL() : false;
		$members = method_exists($group, 'getMembers') ? $group->getMembers(true) : 0;
		$group_url = ossn_site_url() . 'group/' . $group->guid;
		?>
		<div class="row">
			<div class="col-lg-2 col-sm-2 col-4">
				<a class="berx-group-result-media" href="<?php echo $group_url; ?>">
					<?php if (!empty($cover)) { ?>
						<img src="<?php echo $cover; ?>"
						     alt="<?php echo htmlspecialchars($group->title, ENT_QUOTES, 'UTF-8'); ?>"
						     loading="lazy" />
					<?php } else { ?>
						<?php echo berx_group_monogram($group->title); ?>
					<?php } ?>
				</a>
			</div>
			<div class="col-lg-10 col-sm-10 col-8">
				<div class="group-search-details">
					<a class="group-name" href="<?php echo $group_url; ?>"><?php echo $group->title; ?></a>
					<p class="ossn-group-search-by">
						<?php echo ossn_print('ossn:group:by'); ?>
						<?php if ($owner) { ?>
							<a href="<?php echo $owner->profileURL(); ?>"><?php echo $owner->fullname; ?></a>
						<?php } ?>
					</p>
					<p class="berx-group-result-meta">
						<i class="fa fa-users" aria-hidden="true"></i>
						<?php echo intval($members); ?> <?php echo ossn_print('discover:members'); ?>
					</p>
				</div>
			</div>
		</div>
		<?php
	}
	echo "</div>";
}
