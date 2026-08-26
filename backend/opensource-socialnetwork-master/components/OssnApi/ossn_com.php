<?php
/**
 * BERX API — `/api/v1` dispatcher.
 *
 * Restored 2026-08-26. This component (and OssnReport, see
 * components/OssnReport/) genuinely existed and ran before — the two
 * migrations that ship their DB schema (upgrade/upgrades/1785168400.php,
 * 1785168200.php) already insert 'OssnApi'/'OssnReport' rows into
 * ossn_components. What was lost was only the PHP source, silently
 * dropped by an inherited upstream-OSSN .gitignore rule that
 * blanket-ignored `/components/*` (fixed in commit f915ff4). Rebuilt
 * here against the real, already-existing schema and domain classes —
 * see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md for the full plan this
 * follows.
 *
 * ROUTING. installation/configs/htaccess.dist already rewrites
 * `/api/v1/places/123` to `index.php?h=api&p=v1/places/123`, which
 * OSSN's own ossn_load_page() turns into a call to the function
 * registered below for handler `api`, with `$page = ['v1','places','123']`
 * (see libraries/ossn.lib.page.php). This mirrors the exact real,
 * already-working precedent in this codebase:
 * themes/berx/ossn_theme.php's `ossn_register_page('media',
 * 'ossn_berx_media_page_handler')`.
 *
 * ONE RESOURCE FILE PER REQUEST. The dispatcher `include`s exactly one
 * matched `v1/{resource}.php` file. Because PHP's `include` shares the
 * including function's local scope, every v1/*.php file below can
 * directly read `$segments` (the path parts after `v1/{resource}/`,
 * as a plain indexed array — conventionally destructured into
 * `$segment0`, `$segment1`, ... at the top of each file), `$method`
 * (the real HTTP method) and `$api_user_guid` (the authenticated
 * caller's real guid, or null for the public `auth` resource) without
 * any global state or a second require.
 *
 * AUTH IS A SINGLE CHOKE POINT. Every resource except `auth` requires a
 * valid, non-revoked, non-expired bearer token BEFORE its file is even
 * included — enforced once, here, not re-implemented per file. `auth`
 * is public because that's where a token is minted in the first place;
 * individual auth.php actions (e.g. logout) that need the caller's own
 * identity read `$api_user_guid` themselves, same as everywhere else —
 * it's simply allowed to be null there.
 *
 * NO SESSION BRIDGE. This dispatcher never touches $_SESSION. Any
 * wrapped core method that internally calls ossn_loggedin_user()/
 * ossn_isLoggedin() needs an explicit per-call workaround in the v1
 * file that calls it — never assume a core method "just works" here
 * because it works on the web. (Real, disclosed precedent: OssnPoke's
 * addPoke() and OssnPhotos's AddPhoto() both needed this.)
 */

define('__OSSN_API__', ossn_route()->com . 'OssnApi/');

ossn_register_callback('ossn', 'init', 'ossn_api_init');

function ossn_api_init() {
	ossn_register_page('api', 'ossn_api_dispatch');
}

/**
 * Real notification routing for Places/Events — the mobile client
 * (NotificationsScreen.tsx) already had real handling for these exact
 * type strings ('berx:place:review'/'berx:place:comment'/
 * 'berx:event:rsvp'/'berx:event:comment'/'berx:event:invite',
 * subject_guid = the place/event guid) before any backend emitted
 * them — same "client written ahead of a lost backend" pattern as
 * OssnPlaces/OssnEvents themselves. OssnNotifications::add() is a
 * real no-op unless a 'notification:add' hook is registered for the
 * exact type (confirmed by reading ossn_call_hook(): with none
 * registered it returns the passed $returnvalue=false, so add()
 * immediately bails) — registered here, once, in the always-loaded
 * bootstrap, same real extension point OssnGroups already uses for
 * its own comment notifications.
 */
function ossn_api_notify_place_owner($hook, $type, $return, $params) {
	if (!class_exists('OssnPlaces')) {
		return false;
	}
	$place = (new OssnPlaces())->getPlace($params['subject_guid']);
	if (!$place) {
		return false;
	}
	$params['owner_guid'] = intval($place->owner_guid);
	return $params;
}
ossn_add_hook('notification:add', 'berx:place:review', 'ossn_api_notify_place_owner');
ossn_add_hook('notification:add', 'berx:place:comment', 'ossn_api_notify_place_owner');

function ossn_api_notify_event_owner($hook, $type, $return, $params) {
	if (!class_exists('OssnEvents')) {
		return false;
	}
	$event = (new OssnEvents())->getEvent($params['subject_guid']);
	if (!$event) {
		return false;
	}
	$params['owner_guid'] = intval($event->owner_guid);
	return $params;
}
ossn_add_hook('notification:add', 'berx:event:rsvp', 'ossn_api_notify_event_owner');
ossn_add_hook('notification:add', 'berx:event:comment', 'ossn_api_notify_event_owner');

/** owner_guid is already supplied as notification_owner by the caller (a specific invitee) — real passthrough, nothing to resolve. */
function ossn_api_notify_passthrough($hook, $type, $return, $params) {
	return $params;
}
ossn_add_hook('notification:add', 'berx:event:invite', 'ossn_api_notify_passthrough');

/**
 * Real resource whitelist. Never build an include path from the URL
 * directly — only a name that resolves through this fixed map ever
 * reaches `include`. Grows one entry per implementation wave; a
 * resource not listed here 404s exactly like an unimplemented one
 * would with a raw file_exists() check, so there is nothing to leave
 * "temporarily" unlisted.
 */
function ossn_api_v1_resources() {
	return array(
		// Wave 0
		'auth'          => __OSSN_API__ . 'v1/auth.php',
		'me'            => __OSSN_API__ . 'v1/me.php',
		// Wave 1 — domains with already-complete backend logic, no new
		// domain class needed (see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §8)
		'feed'          => __OSSN_API__ . 'v1/feed.php',
		'posts'         => __OSSN_API__ . 'v1/posts.php',
		'collections'   => __OSSN_API__ . 'v1/collections.php',
		'circles'       => __OSSN_API__ . 'v1/circles.php',
		'trips'         => __OSSN_API__ . 'v1/trips.php',
		'experiences'   => __OSSN_API__ . 'v1/experiences.php',
		'creator'       => __OSSN_API__ . 'v1/creator.php',
		'media'         => __OSSN_API__ . 'v1/media.php',
		'videos'        => __OSSN_API__ . 'v1/videos.php',
		'tracks'        => __OSSN_API__ . 'v1/tracks.php',
		'notifications' => __OSSN_API__ . 'v1/notifications.php',
		'conversations' => __OSSN_API__ . 'v1/conversations.php',
		'friends'       => __OSSN_API__ . 'v1/friends.php',
		'friend'        => __OSSN_API__ . 'v1/friend.php',
		'albums'        => __OSSN_API__ . 'v1/albums.php',
		'block'         => __OSSN_API__ . 'v1/block.php',
		'poke'          => __OSSN_API__ . 'v1/poke.php',
		'profiles'      => __OSSN_API__ . 'v1/profiles.php',
		'messagesearch' => __OSSN_API__ . 'v1/messagesearch.php',
		// Wave 2 — new lightweight domain classes over already-existing
		// schema, plus a thin REST wrapper over the already-real
		// OssnGroup (communities).
		'points'        => __OSSN_API__ . 'v1/points.php',
		'report'        => __OSSN_API__ . 'v1/report.php',
		'communities'   => __OSSN_API__ . 'v1/communities.php',
		'dating'        => __OSSN_API__ . 'v1/dating.php',
		'stories'       => __OSSN_API__ . 'v1/stories.php',
		// Wave 3 — the real-world entity foundation. OssnPlaces now
		// exists (classes/OssnPlaces.php); places.php also serves its
		// own /business/* sub-branches (enable/disable/verify/dashboard).
		'places'        => __OSSN_API__ . 'v1/places.php',
		'events'        => __OSSN_API__ . 'v1/events.php',
		// BERX NOW / Personal Radar foundation — pure composition over
		// OssnGeo+OssnPlaces+OssnEvents+OssnBusinessMoments+OssnPlaceHours,
		// no new class or table.
		'nearby'        => __OSSN_API__ . 'v1/nearby.php',
		// Memories ("on this day") — pure read over the real, existing
		// OssnWall::getPosterPosts(), no new class or table.
		'memories'      => __OSSN_API__ . 'v1/memories.php',
		// Wrapped — real COUNT() aggregates over already-real data, no
		// new class or table.
		'wrapped'       => __OSSN_API__ . 'v1/wrapped.php',
		// Live Presence — real ossn_users.last_activity (already kept
		// live by core's update_last_activity(), called from
		// system/start.php on every request) + real OssnUser::getFriends().
		'presence'      => __OSSN_API__ . 'v1/presence.php',
		// Daily Missions — real completion checks over already-real
		// data, reward via existing OssnPoints::award(oneTime=true), no
		// new table (date-suffixed reason string is the dedupe key).
		'missions'      => __OSSN_API__ . 'v1/missions.php',
		// Business Live — routing over already-real OssnBusinessMoments/
		// OssnPlaces, no new class or table.
		'moments'       => __OSSN_API__ . 'v1/moments.php',
		// Nearby impression actions — feeds places.php's business
		// dashboard real 'shown'/'opened'/'saved'/'route' counts.
		'impressions'   => __OSSN_API__ . 'v1/impressions.php',
		// Business (top-level: claims/team/subscription/hours) — routing
		// over already-real OssnBusiness/OssnPlaceHours/OssnPlaces.
		'business'      => __OSSN_API__ . 'v1/business.php',
		// Search — users/places/events/communities scopes, over already-
		// real OssnUser/OssnPlaces/OssnEvents/OssnGroup query methods.
		'search'        => __OSSN_API__ . 'v1/search.php',
		// Comments on Places/Events — real OssnComments, annotation
		// type 'comments:place'/'comments:event', separate from
		// posts.php's own comment endpoints (different backing model).
		'comments'      => __OSSN_API__ . 'v1/comments.php',
		// Admin — unvalidated users, real OssnUser methods, admin-only.
		'admin'         => __OSSN_API__ . 'v1/admin.php',
		// Future Layer foundation — see docs/BERX_FUTURE_LAYER_SPEC.md.
		// Pure composition over already-real domain classes/relations,
		// no new table.
		'lifegraph'     => __OSSN_API__ . 'v1/lifegraph.php',
		// 'business' (the SEPARATE top-level resource — /business/
		// places/{guid}/team|subscription|hours|claim|moments|
		// impressions) still deliberately NOT listed: those branches
		// use the already-real OssnBusiness/OssnPlaceHours/
		// OssnBusinessMoments/OssnNearbyImpressions classes as-is, but
		// wiring them is its own small vertical slice, not bundled
		// into this one.
	);
}

/**
 * Real page-handler entry point, matching this codebase's own
 * established signature (see ossn_berx_media_page_handler($pages) in
 * themes/berx/ossn_theme.php).
 */
function ossn_api_dispatch($pages) {
	header('Content-Type: application/json; charset=utf-8');

	$version = isset($pages[0]) ? $pages[0] : '';
	if ($version !== 'v1') {
		ossn_api_error('not_found', 'Unknown API version', 404);
	}

	$resource = isset($pages[1]) ? $pages[1] : '';
	$resources = ossn_api_v1_resources();
	if ($resource === '' || !isset($resources[$resource])) {
		ossn_api_error('not_found', 'Unknown resource', 404);
	}
	$file = $resources[$resource];
	if (!file_exists($file)) {
		// Whitelisted but not shipped yet — a real 501, not a silent 404
		// that would look like "this was never planned".
		ossn_api_error('not_implemented', 'Resource not implemented yet', 501);
	}

	$segments = array_slice($pages, 2);
	$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';

	// PHP only auto-populates $_POST/$_REQUEST for POST bodies. PATCH
	// and DELETE requests carrying a real
	// application/x-www-form-urlencoded body (every PATCH this API
	// makes — see client/packages/api/src/client.ts's request()) are
	// otherwise invisible to the real, unmodified input() helper every
	// v1 file uses. Fixed once, here, so no individual file has to
	// know about this quirk.
	if ($method === 'PATCH' || $method === 'DELETE') {
		$raw = file_get_contents('php://input');
		if ($raw !== false && $raw !== '') {
			$parsed = array();
			parse_str($raw, $parsed);
			if ($parsed) {
				$_REQUEST = array_merge($_REQUEST, $parsed);
			}
		}
	}

	$api_user_guid = null;
	if ($resource !== 'auth') {
		$token = ossn_api_bearer_token();
		if ($token === null) {
			ossn_api_error('unauthorized', 'Missing bearer token', 401);
		}
		$tokenModel = new OssnApiToken();
		$api_user_guid = $tokenModel->validateToken($token);
		if (!$api_user_guid) {
			ossn_api_error('unauthorized', 'Invalid or expired token', 401);
		}
	}

	include $file;
	exit;
}

/**
 * Real bearer-token extraction. Authorization is the primary channel;
 * X-Api-Token is the documented fallback for hosting configurations
 * that strip Authorization before PHP sees it (installation/configs/
 * htaccess.dist already carries a real, disclosed-as-unverified rule
 * to pass it through for mod_fcgid — this fallback is the safety net
 * if that rule isn't active on a given deployment). The client always
 * sends both (see client.ts's getAuthHeaders()), so either working is
 * enough.
 */
function ossn_api_bearer_token() {
	$header = null;
	if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
		$header = $_SERVER['HTTP_AUTHORIZATION'];
	} elseif (function_exists('getallheaders')) {
		foreach (getallheaders() as $name => $value) {
			if (strcasecmp($name, 'Authorization') === 0) {
				$header = $value;
				break;
			}
		}
	}
	if ($header && preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
		return trim($m[1]);
	}
	if (!empty($_SERVER['HTTP_X_API_TOKEN'])) {
		return trim($_SERVER['HTTP_X_API_TOKEN']);
	}
	return null;
}

/**
 * Real response contract this API follows: a FLAT JSON body, success
 * or failure conveyed by the HTTP status code — matching
 * client/packages/core/src/index.ts's BerxApiClient.request() (it does
 * `return json as T` on 2xx, `throw new BerxApiError(status, json)`
 * otherwise) and BerxApiErrorBody = {error, message?}. This is a
 * deliberate departure from the {ok,data,meta} envelope sketched in
 * docs/BERX_NEXT_ARCHITECTURE/docs/api/API_ARCHITECTURE.md — ~90
 * already-built mobile screens are written against the flat shape, and
 * rewriting them is not part of this plan (see
 * docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §1).
 */
function ossn_api_json($data, $status = 200) {
	http_response_code($status);
	echo json_encode($data);
	exit;
}

function ossn_api_error($code, $message = '', $status = 400) {
	http_response_code($status);
	echo json_encode(array('error' => $code, 'message' => $message));
	exit;
}

/**
 * Shared post-row mapper — real OssnObject fields only (guid,
 * description, owner_guid, time_created; the entity system stores post
 * TEXT in `description`, not a `text` column). Used by both feed.php
 * and posts.php, which is why it lives here rather than in either
 * file — the dispatcher only ever includes one v1/*.php per request,
 * so a helper needed by more than one file has to live in the always-
 * loaded bootstrap. Matches BerxFeedItem's field set exactly;
 * posts.php adds like_count/comment_count on top for the single-post
 * BerxPostDetail shape, deliberately not included here (feed avoids an
 * N+1 count query per item — see BerxPostDetail's own doc comment in
 * client/packages/api/src/types.ts).
 */
/**
 * Shared base for BerxVideoPost/BerxTrackPost — used by both
 * videos.php and tracks.php (same reason ossn_api_post_base_json()
 * lives here: only one v1/*.php loads per request). A video/track is
 * a real OssnWall post with a real OssnMediaAssets asset attached via
 * context ('post', post_guid) — never a separate content type.
 */
function ossn_api_media_post_base_json($post) {
	$owner = ossn_user_by_guid($post->owner_guid);
	$likes = new OssnLikes();
	$comments = new OssnComments();
	return array(
		'post_guid'      => intval($post->guid),
		'text'           => (string) $post->description,
		'owner_guid'     => intval($post->owner_guid),
		'owner_username' => $owner ? (string) $owner->username : null,
		'owner_icon'     => $owner ? (string) $owner->iconURL()->large : null,
		'time_created'   => intval($post->time_created),
		'like_count'     => ($c = $likes->CountLikes($post->guid, 'post')) ? intval($c) : 0,
		'comment_count'  => ($c = $comments->countComments($post->guid, 'post')) ? intval($c) : 0,
	);
}

/**
 * Shared item-resolver for Collections/Trips/Experiences items —
 * 'place'/'event' gracefully degrade to null (not a fatal error) until
 * OssnPlaces/OssnEvents exist (Wave 3), same class_exists() guard
 * those domain classes already use internally for itemExists(). 'post'
 * resolves now, via the real, already-existing OssnWall. Returns
 * array('title'=>string,'image_url'=>string|null) or null if the
 * referenced item no longer exists.
 */
function ossn_api_resolve_item($type, $guid) {
	$guid = intval($guid);
	if (!$guid) {
		return null;
	}
	if ($type === 'post') {
		$wall = new OssnWall();
		$post = $wall->GetPost($guid);
		if (!$post) {
			return null;
		}
		$text = (string) $post->description;
		return array(
			'title'     => mb_strlen($text, 'UTF-8') > 60 ? mb_substr($text, 0, 60, 'UTF-8') . '…' : $text,
			'image_url' => null,
		);
	}
	if ($type === 'place' && class_exists('OssnPlaces')) {
		$model = new OssnPlaces();
		$place = $model->getPlace($guid);
		if (!$place) {
			return null;
		}
		return array('title' => (string) $place->title, 'image_url' => isset($place->cover_url) ? $place->cover_url : null);
	}
	if ($type === 'event' && class_exists('OssnEvents')) {
		$model = new OssnEvents();
		$event = $model->getEvent($guid);
		if (!$event) {
			return null;
		}
		return array('title' => (string) $event->title, 'image_url' => isset($event->cover_url) ? $event->cover_url : null);
	}
	// Place/Event not built yet in this environment — honest, non-fatal
	// placeholder rather than a crash. Becomes real automatically once
	// Wave 3 ships, with no change needed here.
	return array('title' => ucfirst((string) $type), 'image_url' => null);
}

/**
 * Shared block-check — real, used by every read/write path that
 * exposes one user's content/messages to another (posts, comments,
 * conversations). Lives here (not in one v1 file) because more than
 * one resource needs it and only one v1/*.php loads per request.
 */
function ossn_api_is_blocked($viewerGuid, $ownerGuid) {
	if (intval($viewerGuid) === intval($ownerGuid)) {
		return false;
	}
	// OssnBlock::isBlocked($usera, $userb) reads ->guid off each
	// argument (confirmed by reading its real body: `@param object
	// $usera` and `isset($usera->guid)`) — it does NOT accept raw
	// guids. Passing ints here would make isset($int->guid) silently
	// false and isBlocked() always return false, never actually
	// checking anything. Minimal stdClass stand-ins are enough; the
	// method never reads anything else off either argument.
	$a = new stdClass();
	$a->guid = intval($viewerGuid);
	$b = new stdClass();
	$b->guid = intval($ownerGuid);
	return (bool) OssnBlock::isBlocked($a, $b);
}

/**
 * Starter, curated category taxonomy shared by Places AND Events
 * (both use the real client.ts/types.ts `BerxPlaceCategory` shape) —
 * not an enforced enum: createPlace()/createEvent() and their update
 * branches accept any non-empty category string, same as OssnGroup
 * never enforcing a closed tag list. Lives here (not in places.php or
 * events.php) because both resources need it and only one v1/*.php
 * loads per request.
 */
function ossn_api_place_categories() {
	return array(
		array('slug' => 'restaurant', 'label' => 'Restaurant'),
		array('slug' => 'cafe', 'label' => 'Cafe'),
		array('slug' => 'bar', 'label' => 'Bar'),
		array('slug' => 'hotel', 'label' => 'Hotel'),
		array('slug' => 'shop', 'label' => 'Shop'),
		array('slug' => 'beauty', 'label' => 'Beauty'),
		array('slug' => 'fitness', 'label' => 'Fitness'),
		array('slug' => 'entertainment', 'label' => 'Entertainment'),
		array('slug' => 'culture', 'label' => 'Culture'),
		array('slug' => 'nature', 'label' => 'Nature & Outdoors'),
		array('slug' => 'services', 'label' => 'Services'),
		array('slug' => 'other', 'label' => 'Other'),
	);
}

function ossn_api_post_base_json($post) {
	$owner = ossn_user_by_guid($post->owner_guid);
	return array(
		'guid'           => intval($post->guid),
		'text'           => (string) $post->description,
		'owner_guid'     => intval($post->owner_guid),
		'owner_username' => $owner ? (string) $owner->username : null,
		'time_created'   => intval($post->time_created),
	);
}
