<?php
/**
 * BERX API v1 — Worlds. See classes/OssnWorlds.php for the full
 * domain rationale — a real first-class container object that holds
 * EXISTING real BERX objects (places, events, plans, experiences) by
 * reference, plus a real membership list.
 *
 * Routes:
 *   POST   /worlds                       create (owner + visibility + optional invite_guids)
 *   GET    /worlds/mine                  real "my worlds" (owned + accepted member)
 *   GET    /worlds/{id}                  detail — public, or a real accepted member/owner
 *   POST   /worlds/{id}/respond          {accept: bool} — invited member only
 *   POST   /worlds/{id}/join             public worlds only — direct self-join
 *   POST   /worlds/{id}/leave            member only (owner cannot leave)
 *   POST   /worlds/{id}/items            {item_type, item_id} — accepted member only
 *   DELETE /worlds/{id}/items/{type}/{id} owner or the item's original adder only
 *   DELETE /worlds/{id}                  owner only
 */

function ossn_api_world_json($world, $viewerGuid, $worldsModel) {
	$owner = ossn_user_by_guid($world->owner_guid);
	$membership = $worldsModel->getMembership($world->id, $viewerGuid);
	$isOwner = $worldsModel->isOwner($world, $viewerGuid);

	$members = array();
	// Same bounded-disclosure rule as plans.php's own invite list —
	// canView() already gated the whole request to a real member (or
	// anyone, for a public world), so a private world's roster is
	// never handed to an unrelated stranger.
	foreach ($worldsModel->membersForWorld($world->id) as $m) {
		$user = ossn_user_by_guid($m->user_guid);
		$members[] = array(
			'user_guid' => intval($m->user_guid),
			'username'  => $user ? (string) $user->username : null,
			'icon'      => $user ? (string) $user->iconURL()->large : null,
			'role'      => (string) $m->role,
			'status'    => (string) $m->status,
		);
	}

	$items = array();
	foreach ($worldsModel->itemsForWorld($world->id) as $item) {
		$items[] = ossn_api_world_item_json($item);
	}

	return array(
		'id'              => intval($world->id),
		'owner_guid'      => intval($world->owner_guid),
		'owner_username'  => $owner ? (string) $owner->username : null,
		'title'           => (string) $world->title,
		'description'     => $world->description !== null ? (string) $world->description : null,
		'visibility'      => (string) $world->visibility,
		'is_temporary'    => (bool) $world->is_temporary,
		'expires_at'      => $world->expires_at !== null ? intval($world->expires_at) : null,
		'time_created'    => intval($world->time_created),
		'is_owner'        => $isOwner,
		'my_status'       => $membership ? (string) $membership->status : ($world->visibility === 'public' ? 'not_member' : null),
		'members'         => $members,
		'items'           => $items,
	);
}

/** Real target title, resolved per item_type from the actual referenced object — never a copy of that object's data, always a live read. */
function ossn_api_world_item_json($item) {
	$title = null;
	if ($item->item_type === 'place' && class_exists('OssnPlaces')) {
		$place = (new OssnPlaces())->getPlace($item->item_id);
		$title = $place ? (string) $place->title : null;
	} elseif ($item->item_type === 'event' && class_exists('OssnEvents')) {
		$event = (new OssnEvents())->getEvent($item->item_id);
		$title = $event ? (string) $event->title : null;
	} elseif ($item->item_type === 'plan' && class_exists('OssnPlans')) {
		$plan = (new OssnPlans())->getPlan($item->item_id);
		$title = $plan ? (string) $plan->title : null;
	} elseif ($item->item_type === 'experience' && class_exists('OssnExperiences')) {
		$experience = (new OssnExperiences())->get($item->item_id);
		$title = $experience ? (string) $experience->title : null;
	}
	return array(
		'item_type'     => (string) $item->item_type,
		'item_id'       => intval($item->item_id),
		'title'         => $title,
		'added_by_guid' => intval($item->added_by_guid),
		'time_created'  => intval($item->time_created),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'mine' | world id
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'respond' | 'join' | 'leave' | 'items'
$segment2 = isset($segments[2]) ? $segments[2] : null; // items: item_type
$segment3 = isset($segments[3]) ? $segments[3] : null; // items: item_id

$worlds = new OssnWorlds();

if ($segment0 === null && $method === 'POST') {
	$inviteGuids = array();
	$rawInvites = (string) input('invite_guids');
	if ($rawInvites !== '') {
		foreach (explode(',', $rawInvites) as $g) {
			$g = trim($g);
			if (is_numeric($g)) {
				$inviteGuids[] = intval($g);
			}
		}
	}
	$id = $worlds->createWorld($api_user_guid, array(
		'title'        => input('title'),
		'description'  => input('description'),
		'visibility'   => input('visibility'),
		'is_temporary' => input('is_temporary') === '1',
		'expires_at'   => input('expires_at'),
		'invite_guids' => $inviteGuids,
	));
	if (!$id) {
		ossn_api_error('validation_error', 'title is required (max 120 chars)', 422);
	}
	ossn_api_json(array('id' => intval($id)));
}

if ($segment0 === 'mine' && $method === 'GET') {
	$limit = input('limit') ? max(1, min(100, intval(input('limit')))) : 50;
	$out = array();
	foreach ($worlds->myWorlds($api_user_guid, $limit) as $row) {
		$out[] = ossn_api_world_json($row, $api_user_guid, $worlds);
	}
	ossn_api_json(array('worlds' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$world = $worlds->getWorld($segment0);
	if (!$world) {
		ossn_api_error('not_found', 'World not found', 404);
	}
	if (!$worlds->canView($world, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view this world', 403);
	}
	ossn_api_json(array('world' => ossn_api_world_json($world, $api_user_guid, $worlds)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'respond' && $method === 'POST') {
	$accept = input('accept') === '1';
	$result = $worlds->respondInvite($segment0, $api_user_guid, $accept);
	if ($result === 'not_invited') {
		ossn_api_error('forbidden', 'You are not invited to this world', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not respond to world invite', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'join' && $method === 'POST') {
	$result = $worlds->joinWorld($segment0, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'World not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'This world is private — you need an invite', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not join world', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'leave' && $method === 'POST') {
	$result = $worlds->leaveWorld($segment0, $api_user_guid);
	if ($result === 'not_member') {
		ossn_api_error('forbidden', 'You are not a member of this world', 403);
	}
	if ($result === 'owner_cannot_leave') {
		ossn_api_error('validation_error', 'The owner cannot leave — delete the world instead', 422);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not leave world', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'items' && $segment2 === null && $method === 'POST') {
	$result = $worlds->addItem($segment0, $api_user_guid, input('item_type'), input('item_id'));
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'World not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a real accepted member can add to this world', 403);
	}
	if ($result === 'invalid_item') {
		ossn_api_error('validation_error', 'That item does not exist or you cannot view it', 422);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not add item to world', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'items' && $segment2 !== null && $segment3 !== null && $method === 'DELETE') {
	$result = $worlds->removeItem($segment0, $api_user_guid, $segment2, $segment3);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'World or item not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only the world owner or the person who added this item can remove it', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not remove item from world', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	$result = $worlds->deleteWorld($segment0, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'World not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only the world owner can delete it', 403);
	}
	if ($result !== 'ok') {
		ossn_api_error('failed', 'Could not delete world', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown worlds action', 404);
