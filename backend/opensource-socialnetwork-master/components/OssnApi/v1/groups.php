<?php
/**
 * BERX API v1 — Group Chat.
 *
 * Wraps classes/OssnGroupChat.php, a real multi-participant
 * conversation entity — NOT OssnMessages (OSSN core's 1:1 from/to
 * primitive, no group concept anywhere in it). Real-time is POLLING,
 * same disclosed model as 1:1 typing/unread (conversations.php's own
 * header) — no WebSocket infrastructure exists in BERX.
 *
 * Every write route re-derives the acting user's real membership/role
 * from the database on every request via the model's own methods
 * (isActiveMember/isAdmin) — never trusted from the client. The model
 * returns typed string failures ('forbidden', 'not_found', ...) which
 * this file maps to the matching HTTP status, so the mapping lives in
 * exactly one place per failure kind.
 */

function ossn_api_group_user_brief($guid) {
	$u = ossn_user_by_guid(intval($guid));
	if (!$u) {
		return null;
	}
	return array(
		'guid'     => intval($u->guid),
		'username' => (string) $u->username,
		'fullname' => trim($u->first_name . ' ' . $u->last_name),
		'icon'     => (string) $u->iconURL()->large,
	);
}

function ossn_api_group_message_json($row, $model, $viewerGuid) {
	$deleted = intval($row->deleted) === 1;
	$reply = null;
	if (!$deleted && $row->reply_to_id) {
		$original = $model->getMessage($row->reply_to_id);
		if ($original && intval($original->deleted) !== 1) {
			$reply = array(
				'id'     => intval($original->id),
				'sender' => ossn_api_group_user_brief($original->sender_guid),
				'text'   => mb_substr((string) $original->text, 0, 140),
			);
		}
	}
	return array(
		'id'              => intval($row->id),
		'conversation_id' => intval($row->conversation_id),
		'sender'          => ossn_api_group_user_brief($row->sender_guid),
		'text'            => $deleted ? null : (string) $row->text,
		'deleted'         => $deleted,
		'reply_to'        => $reply,
		'time_created'    => intval($row->time_created),
		'time_edited'     => $row->time_edited ? intval($row->time_edited) : null,
		'reaction_count'  => $deleted ? 0 : $model->reactionCount($row->id),
		'reacted_by_me'   => $deleted ? false : $model->reactedByMe($row->id, $viewerGuid),
	);
}

function ossn_api_group_conversation_json($row, $model, $viewerGuid) {
	$participants = array();
	foreach ($model->participants($row->id) as $p) {
		$user = ossn_api_group_user_brief($p->user_guid);
		if ($user) {
			$user['role'] = (string) $p->role;
			$participants[] = $user;
		}
	}
	$mine = $model->myParticipant($row->id, $viewerGuid);
	$lastMessages = $model->messages($row->id, 1);
	$lastMessage = $lastMessages ? end($lastMessages) : null;
	return array(
		'id'              => intval($row->id),
		'name'            => (string) $row->name,
		'description'     => $row->description !== null ? (string) $row->description : null,
		'cover_url'       => $row->cover_guid ? ossn_site_url("media/get/{$row->cover_guid}") : null,
		'creator_guid'    => intval($row->creator_guid),
		'context_type'    => $row->context_type !== null ? (string) $row->context_type : null,
		'context_guid'    => $row->context_guid !== null ? intval($row->context_guid) : null,
		'time_created'    => intval($row->time_created),
		'participants'    => $participants,
		'participant_count' => count($participants),
		'my_role'         => $mine ? (string) $mine->role : null,
		'muted'           => $mine && $mine->muted_until ? intval($mine->muted_until) > time() : false,
		'unread_count'    => $model->unreadCount($row->id, $viewerGuid),
		'last_message'    => $lastMessage ? ossn_api_group_message_json($lastMessage, $model, $viewerGuid) : null,
	);
}

$model = new OssnGroupChat();

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'context' | conversation id
$segment1 = isset($segments[1]) ? $segments[1] : null; // type (under 'context') | 'messages' | 'participants' | 'read' | 'typing' | 'leave' | 'mute' | 'accept' | 'decline' | 'requests'
$segment2 = isset($segments[2]) ? $segments[2] : null; // guid (under 'context') | message id | participant guid
$segment3 = isset($segments[3]) ? $segments[3] : null; // 'react' | 'pin'

/* ---------------- List / create ---------------- */

if ($segment0 === null && $method === 'GET') {
	$rows = $model->listForUser($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_group_conversation_json($row, $model, $api_user_guid);
	}
	ossn_api_json(array('groups' => $out));
}

// The real "message requests" list — every group this account has been
// invited to but not yet accepted or declined.
if ($segment0 === 'requests' && $segment1 === null && $method === 'GET') {
	$rows = $model->pendingInvitesForUser($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$json = ossn_api_group_conversation_json($row, $model, $api_user_guid);
		$json['invited_at'] = intval($row->invited_at);
		$out[] = $json;
	}
	ossn_api_json(array('requests' => $out));
}

// Real "context everywhere" lookup: the groups already tied to one
// real BERX entity (Community/Event/Experience/Circle/Trip), so a
// contextual "Group Chat" entry point finds the existing group
// instead of creating duplicates every time it's opened.
if ($segment0 === 'context' && $segment1 !== null && $segment2 !== null && $method === 'GET') {
	$rows = $model->forContext($segment1, intval($segment2), $api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_group_conversation_json($row, $model, $api_user_guid);
	}
	ossn_api_json(array('groups' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$name = input('name');
	$description = input('description');
	$participantsInput = input('participant_guids'); // comma-separated real user guids
	$contextType = input('context_type') ?: null;
	$contextGuid = input('context_guid');
	$participantGuids = array();
	if ($participantsInput) {
		foreach (explode(',', (string) $participantsInput) as $g) {
			if (ctype_digit(trim($g))) {
				$participantGuids[] = intval(trim($g));
			}
		}
	}
	$result = $model->create($api_user_guid, $name, $description, $participantGuids, $contextType, $contextGuid ? intval($contextGuid) : null);
	if ($result === 'invalid_name') {
		ossn_api_error('validation_error', 'name is required (max 120 chars)', 422);
	}
	if ($result === 'invalid_context') {
		ossn_api_error('validation_error', 'Invalid context_type', 422);
	}
	if ($result === 'too_few_participants') {
		ossn_api_error('validation_error', 'A group needs at least 2 other real participants', 422);
	}
	if ($result === 'too_many_participants') {
		ossn_api_error('validation_error', 'Too many participants', 422);
	}
	if ($result === 'invalid_participant') {
		ossn_api_error('validation_error', 'One of the participants is not a real user', 422);
	}
	if ($result === 'failed' || !$result) {
		ossn_api_error('create_failed', 'Could not create group', 500);
	}
	$row = $model->get($result);
	// Real notification to every founding member except the creator —
	// same berx:{namespace}:{action} convention every other BERX
	// notification uses (see posts.php/events.php's own additions).
	if (class_exists('OssnNotifications')) {
		foreach ($model->participants($result) as $p) {
			if (intval($p->user_guid) !== intval($api_user_guid)) {
				(new OssnNotifications())->add('berx:group:added', intval($api_user_guid), intval($result), intval($result), intval($p->user_guid));
			}
		}
	}
	ossn_api_json(array('group' => ossn_api_group_conversation_json($row, $model, $api_user_guid)));
}

/* ---------------- One conversation ---------------- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->isActiveMember($row->id, $api_user_guid)) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$json = ossn_api_group_conversation_json($row, $model, $api_user_guid);
	$json['pinned_messages'] = array();
	foreach ($model->pinnedMessages($row->id) as $pin) {
		$message = $model->getMessage($pin->message_id);
		if ($message) {
			$json['pinned_messages'][] = ossn_api_group_message_json($message, $model, $api_user_guid);
		}
	}
	ossn_api_json(array('group' => $json));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'PATCH') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->rename($row->id, $api_user_guid, input('name'), input('description') !== false ? input('description') : null);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a group admin can edit this group', 403);
	}
	if ($result === 'invalid_name') {
		ossn_api_error('validation_error', 'name is required (max 120 chars)', 422);
	}
	ossn_api_json(array('group' => ossn_api_group_conversation_json($model->get($row->id), $model, $api_user_guid)));
}

/* ---------------- Membership ---------------- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'participants' && $segment2 === null && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->addParticipant($row->id, $api_user_guid, input('user_guid'));
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a group admin can add members', 403);
	}
	if ($result === 'invalid_participant') {
		ossn_api_error('validation_error', 'Not a real user', 422);
	}
	if ($result === 'already_member') {
		ossn_api_error('validation_error', 'Already a member or already invited', 422);
	}
	if ($result === 'group_full') {
		ossn_api_error('validation_error', 'Group is full', 422);
	}
	if (class_exists('OssnNotifications')) {
		(new OssnNotifications())->add('berx:group:invited', intval($api_user_guid), $row->id, $row->id, intval(input('user_guid')));
	}
	ossn_api_json(array('group' => ossn_api_group_conversation_json($model->get($row->id), $model, $api_user_guid)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'participants' && $segment2 !== null && $method === 'DELETE') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->removeParticipant($row->id, $api_user_guid, $segment2);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a group admin can remove members', 403);
	}
	if ($result === 'use_leave') {
		ossn_api_error('validation_error', 'Use POST /groups/{id}/leave to remove yourself', 422);
	}
	if ($result === 'not_a_member') {
		ossn_api_error('not_found', 'Not a member of this group', 404);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'leave' && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->leave($row->id, $api_user_guid);
	if ($result === 'not_a_member') {
		ossn_api_error('not_found', 'Not a member of this group', 404);
	}
	ossn_api_json(array('status' => 'ok'));
}

// Message request accept/decline — the pending-invite half of
// addParticipant() above.
if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'accept' && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->acceptInvite($row->id, $api_user_guid);
	if ($result === 'no_pending_invite') {
		ossn_api_error('not_found', 'No pending invite to this group', 404);
	}
	ossn_api_json(array('group' => ossn_api_group_conversation_json($model->get($row->id), $model, $api_user_guid)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'decline' && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$result = $model->declineInvite($row->id, $api_user_guid);
	if ($result === 'no_pending_invite') {
		ossn_api_error('not_found', 'No pending invite to this group', 404);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'mute' && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	// A duration in seconds from now, or absent/0 to unmute — same
	// simple contract as everywhere else in BERX that mutes something
	// for a while rather than forever-by-default.
	$forSeconds = input('duration_seconds');
	$until = ($forSeconds && is_numeric($forSeconds) && intval($forSeconds) > 0) ? time() + intval($forSeconds) : null;
	$result = $model->setMuted($row->id, $api_user_guid, $until);
	if ($result === 'not_a_member') {
		ossn_api_error('not_found', 'Not a member of this group', 404);
	}
	ossn_api_json(array('status' => 'ok', 'muted_until' => $until));
}

/* ---------------- Messages ---------------- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 === null && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->isActiveMember($row->id, $api_user_guid)) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$before = input('before');
	$limit = input('limit');
	$rows = $model->messages($row->id, ($limit && is_numeric($limit)) ? min(200, intval($limit)) : 50, ($before && is_numeric($before)) ? intval($before) : null);
	$out = array();
	foreach ($rows as $m) {
		$out[] = ossn_api_group_message_json($m, $model, $api_user_guid);
	}
	ossn_api_json(array('messages' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 === null && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$replyTo = input('reply_to_id');
	$result = $model->sendMessage($row->id, $api_user_guid, input('text'), ($replyTo && is_numeric($replyTo)) ? intval($replyTo) : null);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not a member of this group', 403);
	}
	if ($result === 'empty_text') {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	if ($result === 'invalid_reply') {
		ossn_api_error('validation_error', 'Invalid reply_to_id', 422);
	}
	$message = $model->getMessage($result);
	ossn_api_json(array('message' => ossn_api_group_message_json($message, $model, $api_user_guid)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 !== null && $segment3 === null && $method === 'PATCH') {
	$result = $model->editMessage($segment2, $api_user_guid, input('text'));
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Message not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not your message', 403);
	}
	if ($result === 'empty_text') {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$message = $model->getMessage($segment2);
	ossn_api_json(array('message' => ossn_api_group_message_json($message, $model, $api_user_guid)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 !== null && $segment3 === null && $method === 'DELETE') {
	$result = $model->deleteMessage($segment2, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Message not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not your message', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 !== null && $segment3 === 'react' && $method === 'POST') {
	$result = $model->toggleReaction($segment2, $api_user_guid);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not a member of this group', 403);
	}
	ossn_api_json(array('reacted' => (bool) $result, 'reaction_count' => $model->reactionCount($segment2)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 !== null && $segment3 === 'pin' && $method === 'POST') {
	$result = $model->pin(intval($segment0), $api_user_guid, $segment2);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a group admin can pin messages', 403);
	}
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Message not found', 404);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'messages' && $segment2 !== null && $segment3 === 'pin' && $method === 'DELETE') {
	$result = $model->unpin(intval($segment0), $api_user_guid, $segment2);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Only a group admin can unpin messages', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

/* ---------------- Read receipts / typing ---------------- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'read' && $method === 'POST') {
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$upTo = input('message_id');
	$result = $model->markRead($row->id, $api_user_guid, ($upTo && is_numeric($upTo)) ? intval($upTo) : 0);
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not a member of this group', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'typing' && $method === 'GET') {
	$row = $model->get(intval($segment0));
	if (!$row || !$model->isActiveMember($row->id, $api_user_guid)) {
		ossn_api_error('not_found', 'Group not found', 404);
	}
	$out = array();
	foreach ($model->typingUsers($row->id, $api_user_guid) as $t) {
		$user = ossn_api_group_user_brief($t->user_guid);
		if ($user) {
			$out[] = $user;
		}
	}
	ossn_api_json(array('typing' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'typing' && $method === 'POST') {
	$model->setTyping(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown group action', 404);
