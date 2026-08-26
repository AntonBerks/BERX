<?php
/**
 * BERX API v1 — Collections. OssnCollections is fully real and
 * complete (see classes/OssnCollections.php) — this file is a thin
 * REST wrapper, all authorization stays inside the class.
 */

function ossn_api_collection_json($row, $viewerGuid) {
	$model = new OssnCollections();
	return array(
		'id'           => intval($row->id),
		'title'        => (string) $row->title,
		'description'  => (string) $row->description,
		'visibility'   => intval($row->visibility) === OssnCollections::VISIBILITY_PUBLIC ? 'public' : 'private',
		'owner_guid'   => intval($row->owner_guid),
		'is_own'       => intval($row->owner_guid) === intval($viewerGuid),
		'item_count'   => $model->itemCount($row->id),
		'time_updated' => intval($row->time_updated),
	);
}

function ossn_api_collection_item_json($row) {
	$resolved = ossn_api_resolve_item($row->item_type, $row->item_guid);
	return array(
		'item_type'  => (string) $row->item_type,
		'item_guid'  => intval($row->item_guid),
		'title'      => $resolved ? $resolved['title'] : '(deleted)',
		'image_url'  => $resolved ? $resolved['image_url'] : null,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // collection id
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'items'
$segment2 = isset($segments[2]) ? $segments[2] : null; // item type (remove) or nothing
$segment3 = isset($segments[3]) ? $segments[3] : null; // item guid (remove)

$model = new OssnCollections();

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	$ownerGuid = $userGuid ? intval($userGuid) : intval($api_user_guid);
	$rows = $model->listByOwner($ownerGuid, $api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_collection_json($row, $api_user_guid);
	}
	ossn_api_json(array('collections' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	if (!$title) {
		ossn_api_error('validation_error', 'title is required', 422);
	}
	$description = input('description');
	$visibility = input('visibility') === 'public' ? OssnCollections::VISIBILITY_PUBLIC : OssnCollections::VISIBILITY_PRIVATE;
	$id = $model->create($api_user_guid, $title, $description ? $description : '', $visibility);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not create collection', 500);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->canView($row, $api_user_guid)) {
		ossn_api_error('not_found', 'Collection not found', 404);
	}
	$detail = ossn_api_collection_json($row, $api_user_guid);
	$items = array();
	foreach ($model->items($row->id) as $itemRow) {
		$items[] = ossn_api_collection_item_json($itemRow);
	}
	$detail['items'] = $items;
	ossn_api_json($detail);
}

if ($segment0 !== null && $segment1 === null && $method === 'PATCH') {
	$fields = array();
	if (($v = input('title')) !== false) {
		$fields['title'] = $v;
	}
	if (($v = input('description')) !== false) {
		$fields['description'] = $v;
	}
	if (($v = input('visibility')) !== false) {
		$fields['visibility'] = $v === 'public' ? OssnCollections::VISIBILITY_PUBLIC : OssnCollections::VISIBILITY_PRIVATE;
	}
	$ok = $model->update(intval($segment0), $api_user_guid, $fields);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not update collection', 422);
	}
	$row = $model->get(intval($segment0));
	ossn_api_json(ossn_api_collection_json($row, $api_user_guid));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$ok = $model->delete(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'items' && $segment2 === null && $method === 'POST') {
	$itemType = input('item_type');
	$itemGuid = input('item_guid');
	if (!$itemType || !$itemGuid) {
		ossn_api_error('validation_error', 'item_type and item_guid are required', 422);
	}
	$result = $model->addItem(intval($segment0), $api_user_guid, $itemType, intval($itemGuid));
	if ($result !== true) {
		$status = $result === 'forbidden' ? 403 : ($result === 'item_not_found' ? 404 : 422);
		ossn_api_error((string) $result, 'Could not add item', $status);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'items' && $segment2 !== null && $segment3 !== null && $method === 'DELETE') {
	$ok = $model->removeItem(intval($segment0), $api_user_guid, $segment2, intval($segment3));
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

ossn_api_error('not_found', 'Unknown collections action', 404);
