<?php
/**
 * BERX API v1 — Conversations, Messages, Typing. Wraps the real, core
 * OssnMessages + MessageTyping classes. Realtime is POLLING, not a
 * socket — no WebSocket infrastructure exists in BERX (see
 * docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §7, "Phase 2" deferred).
 *
 * MAX BUILD — real message editing (OssnMessages::editMessage()) now
 * exists, closing what was previously a real, honestly-disclosed gap
 * (ConversationScreen.tsx's own header used to say editing "does not
 * exist in the OSSN core"). Sender-only, real edited/time_edited
 * disclosure fields, never a silent rewrite.
 */

function ossn_api_message_json($row) {
	return array(
		'id'          => intval($row->id),
		'from_guid'   => intval($row->message_from),
		'to_guid'     => intval($row->message_to),
		'text'        => (string) $row->message,
		'time'        => intval($row->time),
		'edited'      => !empty($row->edited),
		'time_edited' => $row->time_edited !== null ? intval($row->time_edited) : null,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;
$segment2 = isset($segments[2]) ? $segments[2] : null;

$messages = new OssnMessages();

if ($segment0 === null && $method === 'GET') {
	// recentChat() builds its return value via a real foreach loop
	// (confirmed by reading its body) — safe to use directly, unlike
	// several BERX-authored list*() methods elsewhere in this API that
	// needed an (array) cast first.
	$chats = $messages->recentChat($api_user_guid);
	$out = array();
	if ($chats) {
		foreach ($chats as $chat) {
			$withGuid = intval($chat->message_from) === intval($api_user_guid) ? intval($chat->message_to) : intval($chat->message_from);
			$withUser = ossn_user_by_guid($withGuid);
			$out[] = array(
				'with_guid'     => $withGuid,
				'with_username' => $withUser ? (string) $withUser->username : null,
				'last_message'  => (string) $chat->message,
				'time'          => intval($chat->time),
			);
		}
	}
	ossn_api_json(array('conversations' => $out));
}

if ($segment0 === 'unread-count' && $method === 'GET') {
	$count = $messages->countUNREAD($api_user_guid);
	ossn_api_json(array('unread_count' => $count ? intval($count) : 0));
}

if ($segment0 !== null && $segment0 !== 'unread-count' && $segment1 === null && $method === 'GET') {
	if (ossn_api_is_blocked($api_user_guid, $segment0)) {
		ossn_api_error('not_found', 'Conversation not found', 404);
	}
	// get() builds via select(..., true) directly (confirmed by
	// reading its real body) — could be the arrayObject stdClass
	// wrapper when non-empty, but foreach works on either shape, so
	// no cast is needed for this read-only iteration.
	$rows = $messages->get($api_user_guid, intval($segment0));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_message_json($row);
		}
	}
	ossn_api_json(array('messages' => $out));
}

if ($segment0 !== null && $segment1 === 'messages' && $segment2 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	if (ossn_api_is_blocked($api_user_guid, $segment0)) {
		ossn_api_error('not_found', 'Conversation not found', 404);
	}
	$id = $messages->send($api_user_guid, intval($segment0), $text);
	if (!$id) {
		ossn_api_error('create_failed', 'Could not send message', 500);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'read' && $method === 'POST') {
	// Marks the OTHER user's messages TO ME as read — real markViewed()
	// semantics: ($from=$segment0, $to=me).
	$messages->markViewed(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'messages' && $segment2 !== null && $method === 'PATCH') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$result = $messages->editMessage(intval($segment2), $api_user_guid, $text);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Message not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not your message', 403);
	}
	if ($result === 'invalid') {
		ossn_api_error('validation_error', 'Invalid text', 422);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'messages' && $segment2 !== null && $method === 'DELETE') {
	$rows = $messages->getMessage(intval($segment2));
	if (!$rows) {
		ossn_api_error('not_found', 'Message not found', 404);
	}
	$row = is_array($rows) ? $rows[0] : $rows;
	if (intval($row->message_from) !== intval($api_user_guid) && intval($row->message_to) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Not your message', 403);
	}
	$messages->delete(array(
		'from'   => 'ossn_messages',
		'wheres' => array(OssnDatabase::wheres('id', '=', intval($segment2))),
	));
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'typing' && $method === 'GET') {
	$typing = new MessageTyping();
	$status = $typing->getStatus(intval($segment0), $api_user_guid);
	ossn_api_json(array('typing' => $status === 'yes'));
}

if ($segment0 !== null && $segment1 === 'typing' && $method === 'POST') {
	$typingFlag = input('typing') === '1';
	$typing = new MessageTyping();
	$typing->setStatus($api_user_guid, intval($segment0), $typingFlag ? 'yes' : 'no');
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown conversations action', 404);
