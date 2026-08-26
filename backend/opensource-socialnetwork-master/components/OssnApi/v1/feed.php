<?php
/**
 * BERX API v1 — Feed. Honest scope: the caller's own wall, chronological
 * — OssnWall::GetUserPosts() has no friends-aggregation or ranking
 * wired up by default (confirmed by reading its real implementation:
 * the query filters strictly on `owner_guid = $user->guid`; the
 * friends-guid list it computes is only ever handed to a hook for
 * something else to use, nothing in this codebase currently does).
 * Matches the real, disclosed state recorded in docs/BERX_FUTURE_CORE.md
 * ("FEED / DISCOVERY — ПРИМИТИВНЫЙ ... Чистая хронология").
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown feed action', 404);
}

$limit  = intval(input('limit'));
$offset = intval(input('offset'));
if ($limit <= 0) {
	$limit = 20;
}

$userModel = new OssnUser();
$userModel->guid = intval($api_user_guid);
$user = $userModel->getUser();
if (!$user) {
	ossn_api_error('not_found', 'User not found', 404);
}

// GetUserPosts() internally branches on ossn_isLoggedin()/
// ossn_loggedin_user() to decide whether to apply the public-only
// visibility filter. The dispatcher never populates $_SESSION, so
// without this bridge every API caller would look "logged out" to
// that check and have their OWN non-public posts hidden from their
// OWN feed. Same real, disclosed class of fix as OssnPhotos::AddPhoto()
// needed for /me/avatar — see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §4.
// Read-only, scoped to this one call, unset immediately after.
$_SESSION['OSSN_USER'] = $user;
$wall = new OssnWall();
$posts = $wall->GetUserPosts($user, array('limit' => $limit, 'offset' => $offset));
unset($_SESSION['OSSN_USER']);

$items = array();
if ($posts) {
	foreach ($posts as $post) {
		$items[] = ossn_api_post_base_json($post);
	}
}

ossn_api_json(array('items' => $items, 'limit' => $limit, 'offset' => $offset));
