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
 */

function ossn_api_notification_json($row) {
	return array(
		'guid'         => intval($row->guid),
		'type'         => (string) $row->type,
		'poster_guid'  => intval($row->poster_guid),
		'subject_guid' => intval($row->subject_guid),
		'item_guid'    => $row->item_guid !== null ? intval($row->item_guid) : null,
		'viewed'       => $row->viewed !== null,
		'time_created' => intval($row->time_created),
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
