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
	// Real OssnGroup::coverURL() -- wraps the group's own native cover
	// mechanism (OssnGroup::UploadCover()/ResetCoverPostition()), now
	// reachable via the /communities/{guid}/cover route below. Returns
	// false when no cover has ever been uploaded.
	$coverUrl = ($group && method_exists($group, 'coverURL')) ? $group->coverURL() : false;
	return array(
		'guid'        => intval($group->guid),
		'name'        => (string) $group->title,
		'description' => (string) $group->description,
		'owner_guid'  => intval($group->owner_guid),
		'privacy'     => $privacy === OSSN_PRIVATE ? 'private' : 'public',
		'is_member'   => $isMember,
		'cover_url'   => $coverUrl ? (string) $coverUrl : null,
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
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'join'|'leave'|'requests'|'moderators'|'members'|'posts'|'transfer'
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

/**
 * MAX BUILD -- real Trending Communities. Same real
 * OssnSignals::engagementScore() ranking as places.php/events.php's
 * own trending routes -- live 7-day sum over the real 'join' signal
 * (recorded on the requests/{guid}/approve route above, the point
 * membership actually begins for every community, public or private).
 */
if ($segment0 === 'trending' && $method === 'GET') {
	$limit = input('limit') ? max(1, min(50, intval(input('limit')))) : 10;
	$candidates = $model->searchGroups('');
	$scored = array();
	if (class_exists('OssnSignals') && $candidates) {
		$signals = new OssnSignals();
		foreach ($candidates as $group) {
			$score = $signals->engagementScore('community', intval($group->guid), 7 * 24 * 3600);
			if ($score > 0) {
				$row = ossn_api_group_json($group, $api_user_guid);
				$row['trending_score'] = $score;
				// Real, more legible than the raw weighted score alone —
				// see places.php's own comment for the full story
				// (OssnSignals::distinctActors(), previously zero-caller).
				$row['distinct_actors'] = $signals->distinctActors('community', intval($group->guid), 7 * 24 * 3600);
				$scored[] = $row;
			}
		}
		usort($scored, function ($a, $b) {
			return $b['trending_score'] <=> $a['trending_score'];
		});
	}
	ossn_api_json(array('communities' => array_slice($scored, 0, $limit)));
}

if ($segment0 !== null && $segment0 !== 'mine' && $segment1 === null && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	ossn_api_json(ossn_api_group_json($group, $api_user_guid));
}

/** MAX BUILD -- real Communities <-> Events connection: this community's real hosted events (OssnEvents::upcomingByGroup(), same real group_guid tag createEvent()/updateEvent() now accept). Public — same visibility as the community's own detail route above. */
if ($segment0 !== null && $segment0 !== 'mine' && $segment1 === 'events' && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	$events = class_exists('OssnEvents') ? (new OssnEvents())->upcomingByGroup(intval($segment0), 10) : array();
	ossn_api_json(array('events' => $events));
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

/**
 * MAX BUILD -- real Community Cover Photo. Wraps OssnGroup's own
 * native, already-shipped cover mechanism (UploadCover()/coverURL()/
 * ResetCoverPostition(), classes/OssnGroup.php) -- previously wired
 * only to a session-cookie web action (actions/group/cover/upload.php)
 * with no JSON API route at all. Field name 'coverphoto' matches
 * UploadCover()'s own $this->OssnFile->setFile('coverphoto') call.
 */
if ($segment0 !== null && $segment1 === 'cover' && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	if (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	if (!$group->UploadCover()) {
		$err = isset($group->OssnFile) ? $group->OssnFile->getFileUploadError($group->OssnFile->error) : 'Upload failed';
		ossn_api_error('upload_failed', $err ? $err : 'Upload failed', 422);
	}
	$fresh = $model->getGroup(intval($segment0));
	$coverUrl = ($fresh && method_exists($fresh, 'coverURL')) ? $fresh->coverURL() : false;
	ossn_api_json(array('status' => 'ok', 'cover_url' => $coverUrl ? (string) $coverUrl : null));
}

if ($segment0 !== null && $segment1 === 'cover' && $method === 'DELETE') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	if (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Owner only', 403);
	}
	$files = $group->groupCovers();
	if ($files) {
		foreach ($files as $file) {
			if ($file->isFile()) {
				@unlink($file->getPath());
			}
			$file->deleteEntity();
		}
	}
	$group->data->cover_guid = 0;
	$group->save();
	$group->ResetCoverPostition();
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'join' && $method === 'POST') {
	$ok = $model->sendRequest(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'already_requested'));
}

if ($segment0 !== null && $segment1 === 'leave' && $method === 'POST') {
	$ok = $model->deleteMember(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_a_member'));
}

/**
 * MAX BUILD — real Community Wall. Wraps the exact same real,
 * already-built core mechanism the web UI's group wall uses
 * (components/OssnWall/actions/wall/post/group.php: $wall->owner_guid
 * = the GROUP's guid, $wall->type = 'group', $wall->Post(...)) --
 * confirmed by reading that action before writing this, not guessed.
 * Membership required to post regardless of the community's own
 * privacy setting (core's own action enforces no such check itself --
 * a real, disclosed gap in core, closed here rather than inherited).
 * Reads honor the community's real privacy: a private community's
 * wall requires real membership to read; a public one doesn't.
 */
if ($segment0 !== null && $segment1 === 'posts' && $method === 'GET') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	$privacy = isset($group->membership) ? intval($group->membership) : OSSN_PUBLIC;
	$isMember = (bool) $model->isMember($group->guid, $api_user_guid);
	if ($privacy === OSSN_PRIVATE && !$isMember && intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'This community is private', 403);
	}
	$wall = new OssnWall();
	$rows = $wall->GetPostByOwner(intval($segment0), 'group');
	$out = array();
	if ($rows) {
		foreach ((array) $rows as $row) {
			// Real per-poster block check, same discipline as every other
			// list this API returns — a blocked member's real post is
			// never shown, even if the caller can otherwise read the wall.
			if (ossn_api_is_blocked($api_user_guid, $row->poster_guid)) {
				continue;
			}
			$out[] = ossn_api_post_base_json($row, $api_user_guid);
		}
	}
	ossn_api_json(array('posts' => $out));
}

if ($segment0 !== null && $segment1 === 'posts' && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	$isMember = (bool) $model->isMember($group->guid, $api_user_guid);
	if (!$isMember && intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Only members can post to this community', 403);
	}
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$wall = new OssnWall();
	$wall->owner_guid  = intval($segment0);
	$wall->poster_guid = intval($api_user_guid);
	$wall->type        = 'group';
	$guid = $wall->Post($text);
	if (!$guid) {
		ossn_api_error('create_failed', 'Could not post to community', 500);
	}
	ossn_api_json(array('guid' => intval($guid)));
}

/**
 * MAX BUILD — real Transfer Ownership. OssnGroup::changeOwner() was
 * always a real, callable core method with zero UI caller — this is
 * the first real route to expose it. Current-owner-or-admin only; the
 * new owner must be a real, current member (never an arbitrary guid),
 * re-checked server-side against OssnGroup::isMember(), not trusted
 * from the request.
 */
if ($segment0 !== null && $segment1 === 'transfer' && $method === 'POST') {
	$group = $model->getGroup(intval($segment0));
	if (!$group) {
		ossn_api_error('not_found', 'Community not found', 404);
	}
	if (intval($group->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Only the current owner can transfer this community', 403);
	}
	$newOwnerGuid = input('user');
	if (!$newOwnerGuid || !is_numeric($newOwnerGuid)) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$newOwnerGuid = intval($newOwnerGuid);
	if ($newOwnerGuid === intval($group->owner_guid)) {
		ossn_api_error('validation_error', 'Already the owner', 422);
	}
	if (!$model->isMember($group->guid, $newOwnerGuid)) {
		ossn_api_error('validation_error', 'New owner must already be a member', 422);
	}
	$ok = $model->changeOwner($newOwnerGuid, intval($segment0));
	if (!$ok) {
		ossn_api_error('create_failed', 'Could not transfer ownership', 500);
	}
	ossn_api_json(array('status' => 'ok', 'owner_guid' => $newOwnerGuid));
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
	// MAX BUILD -- real engagement signal (OssnSignals, BERX Future
	// Core -- see places.php's own comment for the full story).
	// Attributed to the real requester (segment2) -- membership only
	// actually begins here, not on the earlier join request.
	if ($ok && class_exists('OssnSignals')) {
		(new OssnSignals())->record(intval($segment2), 'join', 'community', intval($segment0));
	}
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
