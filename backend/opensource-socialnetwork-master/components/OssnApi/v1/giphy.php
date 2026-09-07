<?php
/**
 * BERX API v1 — Giphy search/trending. Wraps the real, core
 * OssnGiphy class (components/OssnGiphy/classes/OssnGiphy.php) —
 * already fully built (server-side curl proxy to api.giphy.com,
 * admin-configured API key via Settings → Giphy) but wired only to a
 * session-cookie web action (actions/search.php) with no JSON API
 * route at all.
 *
 * `available: false` is a real, honest signal — OssnGiphy::giphyClient()
 * itself returns false with no API key configured
 * (ossn_giphy_api_key()), same as this codebase's other
 * optional-integration checks (e.g. ossn_file_is_cdn_storage_enabled()).
 * Never silently shown as "no results" when the real reason is
 * "not configured" — the client tells those two apart.
 *
 * Deliberately NOT the same shape as OssnGiphy::getThumbs() (that
 * method only extracts a small preview thumbnail via regex, built for
 * the web comment-box hover preview) — this returns both a real thumb
 * AND a real send-able gif_url per result, since BERX actually lets
 * the user send the GIF (via the same real attachment upload path
 * ConversationScreen already uses), not just preview it.
 */

function ossn_api_giphy_item_json($item) {
	if (!is_array($item) || empty($item['id']) || empty($item['images'])) {
		return null;
	}
	$images = $item['images'];
	$full = isset($images['fixed_height']['url']) ? $images['fixed_height']['url']
		: (isset($images['downsized_medium']['url']) ? $images['downsized_medium']['url']
		: (isset($images['original']['url']) ? $images['original']['url'] : null));
	$thumb = isset($images['fixed_width_small']['url']) ? $images['fixed_width_small']['url']
		: (isset($images['fixed_height_small']['url']) ? $images['fixed_height_small']['url'] : $full);
	if (!$full) {
		return null;
	}
	return array(
		'id'        => (string) $item['id'],
		'thumb_url' => (string) $thumb,
		'gif_url'   => (string) $full,
		'width'     => isset($images['fixed_height']['width']) ? intval($images['fixed_height']['width']) : null,
		'height'    => isset($images['fixed_height']['height']) ? intval($images['fixed_height']['height']) : null,
	);
}

function ossn_api_giphy_results_json($data) {
	$out = array();
	if (is_array($data) && !empty($data['data']) && is_array($data['data'])) {
		foreach ($data['data'] as $item) {
			$row = ossn_api_giphy_item_json($item);
			if ($row) {
				$out[] = $row;
			}
		}
	}
	return $out;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'search' | 'trending'

if (!class_exists('OssnGiphy') || !function_exists('ossn_giphy_api_key') || !ossn_giphy_api_key()) {
	ossn_api_json(array('available' => false, 'results' => array()));
}

if ($segment0 === 'search' && $method === 'GET') {
	$q = input('q');
	if (!$q) {
		ossn_api_error('validation_error', 'q is required', 422);
	}
	$giphy = new OssnGiphy();
	$data = $giphy->getSearch($q);
	ossn_api_json(array('available' => true, 'results' => ossn_api_giphy_results_json($data)));
}

if ($segment0 === 'trending' && $method === 'GET') {
	$giphy = new OssnGiphy();
	$data = $giphy->getTrending();
	ossn_api_json(array('available' => true, 'results' => ossn_api_giphy_results_json($data)));
}

ossn_api_error('not_found', 'Unknown giphy action', 404);
