<?php
/**
 * BERX API v1 — Communities. Wraps the real, core OssnGroup class —
 * no new domain class, no new table. `membership` (privacy) comes
 * back as a direct top-level property on a fetched object
 * (getObjectById() merges real entity metadata onto the object itself,
 * confirmed by reading its real body before writing this — NOT nested
 * under ->data for an already-fetched object, unlike the create-time
 * $this->data->membership = ... assignment).
 *
 * MAX BUILD — real fix: every admin-override check below used to call
 * ossn_isAdminLoggedin(), which needs $_SESSION populated — never
 * true for a bearer-token API request (same bug found and fixed
 * across admin.php/report.php/business.php/comments.php). The real
 * group owner could still act either way, but an actual admin
 * moderating a group they don't own always silently failed on every
 * one of these 7 checks. Now uses ossn_api_is_admin($api_user_guid).
 */

function ossn_api_group_json($group, $viewerGuid) {
	$isMember = false;
	if ($group && $viewerGuid) {
		$m = new OssnGroup();
		$isMember = (bool) $m->isMember($group->guid, $viewerGuid);
	}
	$privacy = isset($group->membership) ? intval($group->membership) : OSSN_PUBLIC;
	return array(
		'guid'        => intval($group->guid),
		'name'        => (string) $group->title,
		'description' => (string) $group->description,
		'owner_guid'  => intval($group->owner_guid),
		'privacy'     => $privacy === OSSN_PRIVATE ? 'private' : 'public',
		'is_member'   => $isMember,
	);
}

function ossn_api_group_member_json($userGuid, $ownerGuid) {
	$user = ossn_user_by_guid($userGuid);
	if (!$user) {
		return null;
	}
	return array(
		'guid'     => intval($user->guid),
		'username' => (string) $user->username,
		'fullname' => trim($user->first_name . ' ' . $user->last_name),
		'icon'     => (string) $user->iconURL()->large,
		'is_owner' => intval($userGuid) === intval($ownerGuid),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // guid | 'mine'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'join'|'leave'|'requests'|'moderators'|'members'
$segment2 = isset($segments[2]) ? $segments[2] : null; // user guid | action
$segment3 = isset($segments[3]) ? $segments[3] : null; // 'approve'|'decline'

$model = new OssnGroup();

if ($segment0 === null && $method === 'GET') {
	$q = input('q');
	$rows = $model->searchGroups($q ? $q : '');
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_group_json($row, $api_user_guid);
		}
	}
	ossn_api_json(array('communities' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$name = input('name');
	$description = input('description');
	$privacy = input('privacy') === 'private' ? OSSN_PRIVATE : OSSN_PUBLIC;
	if (!$name) {
		ossn_api_error('validation_error', 'name is required', 422);
	}
	$create = new OssnGroup();
	$ok = $create->createGroup(array(
		'name'        => $name,
		'description' => $description ? $description : '',
		'privacy'     => $privacy,
		'owner_guid'  => intval($api_user_guid),
	));
	if (!$ok) {
		ossn_api_error('create_failed', 'Could not create community', 500);
	}
	ossn_api_json(array('guid' => intval($create->getGuid())));
}

if ($segment0 === 'mine' && $method === 'GET') {
	$userModel = new OssnUser();
	$userModel->guid = intval($api_user_guid);
	$user = $userModel->getUser();
	if (!$user) {
		ossn_api_error('not_found', 'User not found', 404);
	}
	$rows = $model->getMyGroups($user);
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_group_json($row, $api_user_guid);
		}
	}
	ossn_api_json(array('communities' => $out));
}

if ($segment0 !== null && $segment0 !== 'mine' && $segment1 === null && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	ossn_api_json(ossn_api_group_json($group, $api_user_guid));
}

if ($segment0 !== null && $segment1 === null && $method === 'PATCH') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Not your community', 403);
	}
	$name = input('name');
	$description = input('description');
	if (!$name) {
		$name = $group->title;
	}
	$ok = $model->updateGroup($name, $description !== false ? $description : $group->description, intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'update_failed'));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Not your community', 403);
	}
	$ok = $model->deleteGroup(intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'delete_failed'));
}

if ($segment0 !== null && $segment1 === 'join' && $method === 'POST') {
	$ok = $model->sendRequest(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'already_requested'));
}

if ($segment0 !== null && $segment1 === 'leave' && $method === 'POST') {
	$ok = $model->deleteMember(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_a_member'));
}

if ($segment0 !== null && $segment1 === 'requests' && $segment2 === null && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	$reqModel = new OssnGroup();
	$reqModel->guid = intval($segment0);
	$isModerator = $reqModel->isModerator(intval($api_user_guid));
	if (intval($group->owner_guid) !== intval($api_user_guid) && !$isModerator && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Not authorized', 403);
	}
	$users = $reqModel->getMembersRequests();
	$out = array();
	if ($users) {
		foreach ($users as $u) {
			if ($u) {
				$out[] = array(
					'guid'     => intval($u->guid),
					'username' => (string) $u->username,
					'fullname' => trim($u->first_name . ' ' . $u->last_name),
					'icon'     => (string) $u->iconURL()->large,
				);
			}
		}
	}
	ossn_api_json(array('requests' => $out));
}

if ($segment0 !== null && $segment1 === 'requests' && $segment2 !== null && $segment3 === 'approve' && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Not authorized', 403);
	}
	$ok = $model->approveRequest(intval($segment2), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 !== null && $segment1 === 'requests' && $segment2 !== null && $segment3 === 'decline' && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Not authorized', 403);
	}
	$ok = $model->deleteMember(intval($segment2), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 !== null && $segment1 === 'moderators' && $segment2 === null && $method === 'GET') {
	$rows = ossn_get_relationships(array('from' => intval($segment0), 'type' => 'group:moderator', 'page_limit' => false));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$u = ossn_user_by_guid($row->relation_to);
			if ($u) {
				$out[] = array(
					'guid'     => intval($u->guid),
					'username' => (string) $u->username,
					'fullname' => trim($u->first_name . ' ' . $u->last_name),
					'icon'     => (string) $u->iconURL()->large,
				);
			}
		}
	}
	ossn_api_json(array('moderators' => $out));
}

if ($segment0 !== null && $segment1 === 'moderators' && $segment2 !== null && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	$memberModel = new OssnGroup();
	if (!$memberModel->isMember(intval($segment0), intval($segment2))) {
		ossn_api_error('not_a_member', 'Target is not a member of this community', 422);
	}
	$ok = ossn_add_relation(intval($segment0), intval($segment2), 'group:moderator');
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 !== null && $segment1 === 'moderators' && $segment2 !== null && $method === 'DELETE') {
	$group = $model->getGroup(intval($segment0));
	if (!$group || (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid))) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	$ok = ossn_delete_relationship(array('from' => intval($segment0), 'to' => intval($segment2), 'type' => 'group:moderator'));
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

if ($segment0 !== null && $segment1 === 'members' && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	$memberModel = new OssnGroup();
	$memberModel->guid = intval($segment0);
	$rows = $memberModel->getMembers();
	$out = array();
	if ($rows) {
		foreach ($rows as $u) {
			if ($u) {
				$m = ossn_api_group_member_json($u->guid, $group->owner_guid);
				if ($m) {
					$out[] = $m;
				}
			}
		}
	}
	ossn_api_json(array('members' => $out));
}

ossn_api_error('not_found', 'Unknown communities action', 404);
