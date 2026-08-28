<?php
/**
 * BERX API v1 — Notifications. Wraps the real, core OssnNotifications
 * class. Two real bugs in that core class's method contracts, found by
 * reading the actual bodies (not the doc comments) before writing this
 * file — worth flagging for anyone touching this class again later:
 *
 * 1. setViewed($guid) takes a $guid parameter but its real WHERE
 *    clause hardcodes $this->guid, not the local $guid variable after
 *    its own fallback assignment. Calling setViewed($someGuid) on a
 *    fresh instance updates ZERO rows and still returns true (update()
 *    returns true on successful execute() regardless of rows
 *    affected) — a silent no-op. Fixed at the call site here by
 *    setting ->guid on the instance BEFORE calling setViewed().
 * 2. deleteItem() only reads $this->guid too, has no $guid parameter
 *    at all — same fix needed if ever used (not used here;
 *    deleteNotification($params) is used instead, which does take a
 *    real params array and is the one method here confirmed to file
 *    IN via the value it's actually given).
 *
 * MAX BUILD — real "context chain" enrichment. Every real notification
 * row this codebase actually produces was found by reading, not
 * guessing: native OSSN wires 'like:post'/'comments:post'/
 * 'comments:post:group:wall'/'like:post:group:wall'/'wall:friends:tag'/
 * 'group:joinrequest' through its own old, stable notification
 * pipeline (components/OssnNotifications/ossn_com.php,
 * components/OssnComments/ossn_com.php) — real, already firing on
 * every real like/comment/tag/join-request BERX's own API routes
 * trigger, but the mobile client had no label or route for any of
 * them (NOTIFICATION_LABELS only covered the berx:, dating: and
 * ossnpoke:poke prefixes), so they rendered as a raw type string like
 * "comments:post". Fixed here at the source: every notification now
 * carries a real poster_username/poster_icon (poster_guid was already
 * real) and a real subject_title/subject_type resolved from
 * subject_guid's real meaning per type (confirmed per-type by reading
 * the exact hook that sets subject_guid — see each case below) — a
 * post's real text, a place/event/community's real title. A subject
 * that's been deleted since resolves to null, never an error; the
 * notification itself still shows with no context line, same
 * graceful-degradation convention already used elsewhere in this API
 * (e.g. posts.php's own /posts/saved route).
 */

function ossn_api_notification_actor($guid) {
	$user = ossn_user_by_guid(intval($guid));
	if (!$user) {
		return array('username' => null, 'icon' => null);
	}
	return array('username' => (string) $user->username, 'icon' => (string) $user->iconURL()->large);
}

/**
 * Real per-type subject resolution — subject_guid's actual meaning
 * (confirmed by reading the real hook/callsite that set it, not
 * assumed from the type string alone):
 *   like:post, comments:post, comments:post:group:wall,
 *   like:post:group:wall, wall:friends:tag, berx:place:comment    -> post guid
 *   berx:place:review, berx:place:checkin, berx:offer:claimed     -> place guid
 *   berx:event:rsvp, berx:event:comment, berx:event:invite,
 *   berx:event:waitlist:promoted, berx:event:checkin,
 *   berx:plan:converted                                            -> event guid
 *   (plan:converted's subject_guid is the real NEW event a Plan
 *   just became — OssnPlans::convertToEvent() — not the plan itself)
 *   group:joinrequest                                             -> community (group) guid
 *   berx:plan:invite, berx:plan:accepted                          -> plan guid
 *   berx:moment:tag                                                -> moment guid
 *   berx:world:invite, berx:world:joined                          -> world guid
 * Anything else (ossnpoke:poke, dating:*, unrecognized) has no
 * separate "subject" beyond the poster themselves — real null, never
 * a guessed title.
 */
function ossn_api_notification_subject($type, $subjectGuid) {
	if (!$subjectGuid) {
		return array('title' => null, 'kind' => null);
	}
	$subjectGuid = intval($subjectGuid);

	$isPostType = $type === 'like:post'
		|| $type === 'comments:post'
		|| $type === 'comments:post:group:wall'
		|| $type === 'like:post:group:wall'
		|| $type === 'wall:friends:tag'
		|| $type === 'berx:place:comment';
	if ($isPostType) {
		$wall = new OssnWall();
		$post = $wall->GetPost($subjectGuid);
		if ($post && isset($post->description)) {
			$text = trim((string) $post->description);
			return array('title' => $text !== '' ? mb_substr($text, 0, 80) : null, 'kind' => 'post');
		}
		return array('title' => null, 'kind' => 'post');
	}

	if ($type === 'berx:place:review' || $type === 'berx:place:checkin' || $type === 'berx:offer:claimed') {
		$place = class_exists('OssnPlaces') ? (new OssnPlaces())->getPlace($subjectGuid) : null;
		return array('title' => $place ? (string) $place->title : null, 'kind' => 'place');
	}

	// berx:plan:converted's subject_guid is deliberately the real NEW
	// EVENT guid it just created (see OssnPlans::convertToEvent()), so
	// it belongs in this event-resolution case, not a plan-specific one.
	if ($type === 'berx:event:rsvp' || $type === 'berx:event:comment' || $type === 'berx:event:invite' || $type === 'berx:event:waitlist:promoted' || $type === 'berx:event:checkin' || $type === 'berx:plan:converted') {
		$event = class_exists('OssnEvents') ? (new OssnEvents())->getEvent($subjectGuid) : null;
		return array('title' => $event ? (string) $event->title : null, 'kind' => 'event');
	}

	if ($type === 'group:joinrequest') {
		$group = class_exists('OssnGroup') ? (new OssnGroup())->getGroup($subjectGuid) : null;
		return array('title' => $group ? (string) $group->title : null, 'kind' => 'community');
	}

	// BERX Plans — invite/accepted point at the real plan itself.
	if ($type === 'berx:plan:invite' || $type === 'berx:plan:accepted') {
		$plan = class_exists('OssnPlans') ? (new OssnPlans())->getPlan($subjectGuid) : null;
		return array('title' => $plan ? (string) $plan->title : null, 'kind' => 'plan');
	}

	// BERX Life Moments — a moment has no title of its own; its real text is the closest honest analogue.
	if ($type === 'berx:moment:tag') {
		$moment = class_exists('OssnLifeMoments') ? (new OssnLifeMoments())->getMoment($subjectGuid) : null;
		if ($moment) {
			$text = trim((string) $moment->text);
			return array('title' => $text !== '' ? mb_substr($text, 0, 80) : null, 'kind' => 'moment');
		}
		return array('title' => null, 'kind' => 'moment');
	}

	// BERX Worlds — invite/joined both point at the real world itself.
	if ($type === 'berx:world:invite' || $type === 'berx:world:joined') {
		$world = class_exists('OssnWorlds') ? (new OssnWorlds())->getWorld($subjectGuid) : null;
		return array('title' => $world ? (string) $world->title : null, 'kind' => 'world');
	}

	return array('title' => null, 'kind' => null);
}

function ossn_api_notification_json($row) {
	$actor = ossn_api_notification_actor($row->poster_guid);
	$subject = ossn_api_notification_subject((string) $row->type, $row->subject_guid);
	return array(
		'guid'            => intval($row->guid),
		'type'            => (string) $row->type,
		'poster_guid'     => intval($row->poster_guid),
		'poster_username' => $actor['username'],
		'poster_icon'     => $actor['icon'],
		'subject_guid'    => intval($row->subject_guid),
		'item_guid'       => $row->item_guid !== null ? intval($row->item_guid) : null,
		'subject_title'   => $subject['title'],
		'subject_kind'    => $subject['kind'],
		'viewed'          => $row->viewed !== null,
		'time_created'    => intval($row->time_created),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;

$model = new OssnNotifications();

if ($segment0 === null && $method === 'GET') {
	$limit  = intval(input('limit')) ?: 20;
	$offset = intval(input('offset')) ?: 1;
	$unreadOnly = input('unread') === '1';

	$params = array(
		'owner_guid' => intval($api_user_guid),
		'limit'      => $limit,
		'page_limit' => $limit,
		'offset'     => $offset,
		'order_by'   => 'n.guid DESC',
	);
	if ($unreadOnly) {
		$params['viewed'] = false;
	}
	$rows = $model->searchNotifications($params);
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_notification_json($row);
		}
	}
	ossn_api_json(array('notifications' => $out, 'limit' => $limit, 'offset' => $offset));
}

if ($segment0 === 'unread-count' && $method === 'GET') {
	$count = $model->searchNotifications(array(
		'owner_guid' => intval($api_user_guid),
		'viewed'     => false,
		'count'      => true,
	));
	ossn_api_json(array('unread_count' => $count ? intval($count) : 0));
}

if ($segment0 === 'read-all' && $method === 'POST') {
	$model->clearAll($api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment0 !== 'unread-count' && $segment0 !== 'read-all' && isset($segments[1]) && $segments[1] === 'read' && $method === 'POST') {
	// Ownership enforced by matching both guid AND owner_guid in the
	// same delete/update-style query the class already uses elsewhere
	// — but setViewed() specifically needs ->guid set first (see file
	// header). Ownership is still verified: fetch first, check owner.
	$rows = $model->searchNotifications(array('guid' => intval($segment0), 'owner_guid' => intval($api_user_guid), 'limit' => 1));
	if (!$rows) {
		ossn_api_error('not_found', 'Notification not found', 404);
	}
	$model->guid = intval($segment0);
	$model->setViewed();
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment0 !== 'unread-count' && $segment0 !== 'read-all' && $method === 'DELETE') {
	$model->deleteNotification(array('guid' => intval($segment0), 'owner_guid' => intval($api_user_guid)));
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 === null && $method === 'DELETE') {
	$model->deleteNotification(array('owner_guid' => intval($api_user_guid)));
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown notifications action', 404);
