<?php
/**
 * BERX Search results page.
 * Theme override of OssnSearch's search/pages/search.
 *
 * The original rendered only `$params['contents']` inside two bare
 * divs — no search field on the search page itself (the only input
 * lived in the topbar/sidebar), no query context, and a "no results"
 * state that arrived as an unstyled bare string.
 *
 * REAL BACKEND ONLY. ossn_search_page() dispatches on the
 * ('search', "type:{$type}") hook, and exactly three handlers are
 * registered engine-wide:
 *   users  -> OssnProfile   (profile_search_handler)
 *   groups -> OssnGroups    (groups_search_handler)
 *   dating -> OssnDating    (ossn_dating_search_handler)
 * So there are no Posts/Reels/Places/Events tabs here: those hooks do
 * not exist, and a tab pointing at a missing hook renders an empty
 * page. Tabs themselves are still rendered by the engine's own
 * ('search','left') menu hook in the layout — not duplicated here.
 *
 * Pagination is whatever each handler already appended via
 * ossn_view_pagination() — page-based, not infinite scroll. Nothing
 * here changes that contract.
 */
$query = input('q');
$type  = input('type');
if (empty($type)) {
	$type = 'users';
}

// Handlers return this exact string when a search yields nothing;
// comparing against it is what lets a real empty state be rendered
// instead of a bare sentence floating on the page.
$no_result   = ossn_print('ossn:search:no:result');
$contents    = isset($params['contents']) ? $params['contents'] : '';
$is_no_match = (trim($contents) === trim($no_result));
$has_query   = (isset($query) && trim($query) !== '');
?>
<div class="ossn-search-page berx-search">

	<div class="berx-search-hero">
		<form class="berx-search-form" method="get" action="<?php echo ossn_site_url('search'); ?>" role="search">
			<i class="fa fa-search berx-search-icon" aria-hidden="true"></i>
			<input type="text" name="q" autocomplete="off"
			       value="<?php echo htmlspecialchars((string) $query, ENT_QUOTES, 'UTF-8'); ?>"
			       placeholder="<?php echo ossn_print('ossn:search'); ?>"
			       aria-label="<?php echo ossn_print('ossn:search'); ?>" />
			<?php // Keep the active tab when re-submitting, so refining a
			      // query doesn't silently throw the user back to People. ?>
			<input type="hidden" name="type" value="<?php echo htmlspecialchars($type, ENT_QUOTES, 'UTF-8'); ?>" />
			<button type="submit" class="btn btn-primary"><?php echo ossn_print('ossn:search'); ?></button>
		</form>

		<?php if ($has_query) { ?>
			<p class="berx-search-context">
				<?php echo ossn_print('search:result', array(
					'<strong>' . htmlspecialchars((string) $query, ENT_QUOTES, 'UTF-8') . '</strong>'
				)); ?>
			</p>
		<?php } ?>
	</div>

	<div class="search-data berx-search-results">
		<?php if ($is_no_match) { ?>
			<div class="berx-search-empty">
				<i class="fa fa-search" aria-hidden="true"></i>
				<h3><?php echo $no_result; ?></h3>
				<p><?php echo ossn_print('berx:search:empty:hint'); ?></p>
			</div>
		<?php } elseif (!$has_query && trim($contents) === '') { ?>
			<div class="berx-search-empty berx-search-idle">
				<i class="fa fa-compass" aria-hidden="true"></i>
				<h3><?php echo ossn_print('berx:search:idle:title'); ?></h3>
				<p><?php echo ossn_print('berx:search:idle:text'); ?></p>
				<a class="btn btn-primary" href="<?php echo ossn_site_url('discover'); ?>">
					<?php echo ossn_print('discover:title'); ?>
				</a>
			</div>
		<?php } else { ?>
			<?php echo $contents; ?>
		<?php } ?>
	</div>
</div>
