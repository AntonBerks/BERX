<?php
/**
 * BERX API v1 — Feed. MAX BUILD — real friends-aggregated, ranked feed.
 * Two real bugs fixed here, found by reading OssnObject::searchObject()/
 * OssnDatabase::generateLimit() bodies (not assumed from method names):
 *
 * 1. Offset-validation crash-to-empty (the real one, previously
 *    unnoticed): searchObject() validates its 'offset' as a 1-BASED
 *    PAGE number against range(1, ceil(limit/page_limit)) and returns
 *    false outright for any offset outside that range. The client
 *    always calls api.feed(limit, 0) — a real, literal 0 — which is
 *    never in that range, so GetUserPosts() silently returned false
 *    and the Feed screen showed empty for every user, every time.
 *    Fixed by never routing pagination through that validation at
 *    all: page_limit=>false bypasses generateLimit() entirely — the
 *    exact working pattern already used by friends.php's own
 *    getFriends(['page_limit'=>false]) — fetching one flat, bounded
 *    candidate pool that THIS file paginates itself with a plain
 *    0-based array_slice(), matching the client's real offset=0
 *    convention exactly. No client change needed.
 * 2. Own-wall-only scope: GetUserPosts() filters strictly on
 *    owner_guid = caller — confirmed by reading its real query, not
 *    the misleading name (its own friend-guid list was computed and
 *    handed to a hook nothing in this codebase uses). A real
 *    friends-aggregating method already existed and was simply never
 *    called from the API: OssnWall::getFriendsPosts() — real query,
 *    filters poster_guid IN (friends + self + admins) AND visibility
 *    IN (PUBLIC, FRIENDS), same live method components/OssnWall's own
 *    siteactivity.php plugin already uses for the "friends" wall mode.
 *    This closes the gap docs/BERX_FUTURE_CORE.md recorded as
 *    "самый большой продуктовый пробел" (FEED / DISCOVERY — ПРИМИТИВНЫЙ).
 *
 * Ranking: a transparent, no-AI gravity function (per
 * docs/BERX_FUTURE_CORE.md's own rule — "Ranking — прозрачная весовая
 * функция, а не магия") over the SAME real signals posts.php already
 * records for every post (like/comment/share/save — see OssnSignals):
 * score = (engagementScore + 1) / (age_hours + 2)^1.6. The "+1" means
 * a brand-new post from a friend with zero engagement yet still ranks
 * near the top on recency alone — never buried under old popular
 * posts, and never silently dropped for having no engagement.
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown feed action', 404);
}

$limit = intval(input('limit'));
if ($limit <= 0) {
	$limit = 20;
}
$limit  = min($limit, 50);
$offset = max(0, intval(input('offset')));

$userModel = new OssnUser();
$userModel->guid = intval($api_user_guid);
$user = $userModel->getUser();
if (!$user) {
	ossn_api_error('not_found', 'User not found', 404);
}

// getFriendsPosts() reads ossn_loggedin_user()/$_SESSION internally (it
// takes no $user param) — the dispatcher never populates $_SESSION, so
// without this bridge it would see no logged-in user at all and return
// false. Same real, disclosed bridge already used by /me/avatar (see
// docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §4). Read-only, scoped to
// this one call, unset immediately after.
$_SESSION['OSSN_USER'] = $user;
$wall = new OssnWall();
// Flat, bounded candidate pool — see file header point 1. Deep enough
// to rank and paginate several pages without a second full pass;
// capped so one request can never pull the entire friends wall.
$poolSize = min(300, max(120, ($offset + $limit) * 4));
$posts = $wall->getFriendsPosts(array('limit' => $poolSize, 'page_limit' => false, 'distinct' => true));
unset($_SESSION['OSSN_USER']);

// BERX WORLD — real feed Mute (components/OssnApi/v1/mute.php). One
// bounded query for the caller's own real mute list, then a plain
// PHP-side filter — same shape as every other real per-viewer
// visibility rule in this file, never touching the friendship or
// visibility itself, only what THIS caller's own feed shows.
$mutedGuids = array();
$muteRows = ossn_get_relationships(array('from' => intval($api_user_guid), 'type' => 'user:mute', 'limit' => false));
if ($muteRows) {
	foreach ($muteRows as $muteRow) {
		$mutedGuids[intval($muteRow->relation_to)] = true;
	}
}
if ($mutedGuids && $posts) {
	$posts = array_values(array_filter($posts, function ($post) use ($mutedGuids) {
		return !isset($mutedGuids[intval($post->poster_guid)]);
	}));
}

$scored = array();
$signals = class_exists('OssnSignals') ? new OssnSignals() : null;
$now = time();
if ($posts) {
	foreach ($posts as $post) {
		$ageHours = max(0, ($now - intval($post->time_created)) / 3600);
		$engagement = $signals ? $signals->engagementScore('post', intval($post->guid), 14 * 24 * 3600) : 0;
		$post->berx_feed_score = ($engagement + 1) / pow($ageHours + 2, 1.6);
		$scored[] = $post;
	}
	usort($scored, function ($a, $b) {
		return $b->berx_feed_score <=> $a->berx_feed_score;
	});
}

$page = array_slice($scored, $offset, $limit);

/**
 * BERX SPATIAL — real engagement counts on the NOW screen's own media
 * units (the floating action rail needs REAL numbers, never invented
 * ones). The long-standing reason feed items carried no counts was
 * N+1: two extra queries per post. That reason is addressed rather
 * than ignored — these are THREE bounded, batched queries for the
 * WHOLE page (likes grouped, the caller's own likes, comments
 * grouped), not two per item. Any post with no rows simply resolves
 * to 0, which is a real count, not a placeholder.
 */
$pageGuids = array();
foreach ($page as $post) {
	$pageGuids[] = intval($post->guid);
}

$likeCounts = array();
$commentCounts = array();
$myLikes = array();
$mediaCovers = array();
$mediaCounts = array();
if ($pageGuids) {
	$db = new OssnDatabase();
	$guidList = implode(',', $pageGuids);

	$likeRows = $db->select(array(
		'from'     => 'ossn_likes',
		'params'   => array('subject_id', 'COUNT(*) as c'),
		'wheres'   => array(
			OssnDatabase::wheres('type', '=', 'post'),
			OssnDatabase::wheres('subject_id', 'IN', $guidList),
		),
		'group_by' => 'subject_id',
	), true);
	if ($likeRows) {
		foreach ($likeRows as $row) {
			$likeCounts[intval($row->subject_id)] = intval($row->c);
		}
	}

	$mineRows = $db->select(array(
		'from'   => 'ossn_likes',
		'params' => array('subject_id'),
		'wheres' => array(
			OssnDatabase::wheres('type', '=', 'post'),
			OssnDatabase::wheres('guid', '=', intval($api_user_guid)),
			OssnDatabase::wheres('subject_id', 'IN', $guidList),
		),
	), true);
	if ($mineRows) {
		foreach ($mineRows as $row) {
			$myLikes[intval($row->subject_id)] = true;
		}
	}

	// BERX SPATIAL — photography is a first-class layer on NOW, so the
	// feed carries the post's real attached cover image. Same batching
	// rule: ONE query for the whole page over the real, already-existing
	// ossn_media_assets table (no new storage), keeping the first image
	// per post. Media URLs on this route are already public-by-URL (see
	// media.php's own header) — nothing new is exposed here.
	$mediaRows = $db->select(array(
		'from'     => 'ossn_media_assets',
		'params'   => array('id', 'context_guid', 'media_type'),
		'wheres'   => array(
			OssnDatabase::wheres('context_type', '=', 'post'),
			OssnDatabase::wheres('context_guid', 'IN', $guidList),
		),
		'order_by' => 'time_created ASC',
	), true);
	if ($mediaRows) {
		foreach ($mediaRows as $row) {
			$ctx = intval($row->context_guid);
			$mediaCounts[$ctx] = isset($mediaCounts[$ctx]) ? $mediaCounts[$ctx] + 1 : 1;
			if (!isset($mediaCovers[$ctx]) && (string) $row->media_type === 'image') {
				$mediaCovers[$ctx] = ossn_site_url('media/get/' . intval($row->id));
			}
		}
	}

	$commentRows = $db->select(array(
		'from'     => 'ossn_annotations',
		'params'   => array('subject_guid', 'COUNT(*) as c'),
		'wheres'   => array(
			OssnDatabase::wheres('type', '=', 'comments:post'),
			OssnDatabase::wheres('subject_guid', 'IN', $guidList),
		),
		'group_by' => 'subject_guid',
	), true);
	if ($commentRows) {
		foreach ($commentRows as $row) {
			$commentCounts[intval($row->subject_guid)] = intval($row->c);
		}
	}
}

/**
 * Real creator status for the whole page in ONE query
 * (OssnCreator::creatorGuids()). isCreator() is a per-user lookup, so
 * badging each byline with it would have re-introduced exactly the N+1
 * the counts above were batched to avoid.
 */
$creatorGuids = array();
if ($page && class_exists('OssnCreator')) {
	$posterGuids = array();
	foreach ($page as $post) {
		$posterGuids[] = intval($post->poster_guid);
	}
	$creatorGuids = (new OssnCreator())->creatorGuids($posterGuids);
}

$items = array();
foreach ($page as $post) {
	$item = ossn_api_post_base_json($post, $api_user_guid);
	$guid = intval($post->guid);
	$item['like_count'] = isset($likeCounts[$guid]) ? $likeCounts[$guid] : 0;
	$item['comment_count'] = isset($commentCounts[$guid]) ? $commentCounts[$guid] : 0;
	$item['is_liked'] = isset($myLikes[$guid]);
	$item['media_url'] = isset($mediaCovers[$guid]) ? $mediaCovers[$guid] : null;
	$item['media_count'] = isset($mediaCounts[$guid]) ? $mediaCounts[$guid] : 0;
	$item['poster_is_creator'] = isset($creatorGuids[intval($post->poster_guid)]);
	$items[] = $item;
}

ossn_api_json(array('items' => $items, 'limit' => $limit, 'offset' => $offset));
