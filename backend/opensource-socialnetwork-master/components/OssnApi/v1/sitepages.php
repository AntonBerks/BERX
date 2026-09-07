<?php
/**
 * BERX API v1 — Site Pages (About / Terms / Privacy). Wraps the real,
 * core OssnSitePages class + its component's own valid-prefix and
 * language-fallback logic (components/OssnSitePages/ossn_com.php) —
 * OssnSitePages was already built, already has a real admin editor
 * (Settings → Site Pages) and a real public web route (`/site/{prefix}`),
 * but had zero API caller anywhere, so the mobile app could never show
 * its own configured About/Terms/Privacy content.
 *
 * Authenticated like every other resource here (this dispatcher has no
 * "public" resource concept beyond `auth` itself — see
 * components/OssnApi/ossn_com.php's dispatch function) — read from an
 * in-app Settings/Help screen, not a pre-login page.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // prefix

if ($segment0 !== null && $method === 'GET') {
	if (!class_exists('OssnSitePages')) {
		ossn_api_error('not_found', 'Site page not found', 404);
	}

	$validPrefixes = function_exists('ossn_site_pages_valid_pages_prefixes')
		? ossn_site_pages_valid_pages_prefixes()
		: array('about', 'terms', 'privacy');
	if (!in_array($segment0, $validPrefixes, true)) {
		ossn_api_error('not_found', 'Site page not found', 404);
	}

	$pages = new OssnSitePages();
	$language = ossn_site_settings('language');
	$page = $pages->getPrefix($segment0, $language);

	// Same real language-fallback the web route uses.
	if (!$page && function_exists('ossn_site_pages_fallback_language')) {
		$fallback = ossn_site_pages_fallback_language();
		if ($fallback) {
			$page = $pages->getPrefix($segment0, $fallback);
		}
	}

	if (!$page) {
		ossn_api_error('not_found', 'Site page not found', 404);
	}

	ossn_api_json(array(
		'prefix'  => (string) $segment0,
		'title'   => function_exists('ossn_print') ? (string) ossn_print('site:' . str_replace('-', ':', $segment0)) : $segment0,
		'content' => isset($page->description) ? html_entity_decode((string) $page->description) : '',
	));
}

ossn_api_error('not_found', 'Unknown site pages action', 404);
