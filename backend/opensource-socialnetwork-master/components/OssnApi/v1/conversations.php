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
 *
 * MAX BUILD — real read receipts. `viewed` was already a real,
 * already-maintained column (OssnMessages::markViewed(), already
 * called by this file's own POST .../read route, already called by
 * ConversationScreen.tsx on every thread open) — the full pipeline
 * was real end-to-end, it just never reached the JSON response or the
 * UI. Now it does.
 *
 * MAX BUILD — real Message Attachments. OssnMessages::send() already
 * uploads $_FILES['attachment'] internally and stores it via the
 * generic ossn_entities/ossn_entities_metadata mechanism (owner_guid
 * = message id, type='message', subtype='attachment_guid'|
 * 'attachment_name') — the exact real path the web UI's own message
 * composer already uses, just never wired to this JSON API before.
 * The download route itself (components/OssnMessages/ossn_com.php)
 * was already correct — checked 'file:attachment', matching what
 * OssnFile::addFile() actually persists (it always prepends 'file:'
 * to whatever subtype the caller set, before storing it — confirmed
 * by reading its real body, after an earlier pass here mistakenly
 * "fixed" that check based on the pre-addFile() subtype string).
 * DELETE now also uses the real OssnMessages::deleteMessage() (cleans
 * up the entity metadata rows + the attachment file/dir on disk)
 * instead of a bare row delete, so a removed attachment message
 * doesn't leave an orphaned file behind.
 */

function ossn_api_message_attachment($messages, $messageId) {
	$rows = $messages->searchEntities(array(
		'type'       => 'message',
		'owner_guid' => intval($messageId),
		'limit'      => false,
	));
	if (!$rows) {
		return null;
	}
	$meta = array();
	foreach ($rows as $r) {
		$meta[$r->subtype] = $r->value;
	}
	if (empty($meta['attachment_guid']) || empty($meta['attachment_name'])) {
		return null;
	}
	$name = (string) $meta['attachment_name'];
	$kind = null;
	if (str_starts_with($name, 'image:')) {
		$kind = 'image';
	} elseif (str_starts_with($name, 'file:')) {
		$kind = 'file';
	}
	$cleanName = str_replace(array('image:', 'file:'), '', $name);
	$pathInfo  = pathinfo($cleanName);
	$urlName   = class_exists('OssnTranslit') && isset($pathInfo['filename'])
		? OssnTranslit::urlize($pathInfo['filename'])
		: $cleanName;
	$ext = isset($pathInfo['extension']) ? $pathInfo['extension'] : '';
	return array(
		'type' => $kind,
		'name' => $cleanName,
		'url'  => ossn_site_url("messages/attachment/{$meta['attachment_guid']}/{$urlName}.{$ext}"),
	);
}

/**
 * Real light preview of a shared post — re-verified for THIS reader on
 * every read, never the stored copy blindly trusted back out: a
 * shared post can be deleted, blocked, or have its visibility
 * narrowed after the share, and a stale reference must never leak it.
 */
function ossn_api_message_shared_post($messages, $messageId, $viewerGuid) {
	$rows = $messages->searchEntities(array(
		'type'       => 'message',
		'owner_guid' => intval($messageId),
		'limit'      => false,
	));
	if (!$rows) {
		return null;
	}
	$postGuid = null;
	foreach ($rows as $r) {
		if ($r->subtype === 'shared_post_guid') {
			$postGuid = intval($r->value);
		}
	}
	if (!$postGuid) {
		return null;
	}
	$post = (new OssnWall())->GetPost($postGuid);
	if (!$post || ossn_api_is_blocked($viewerGuid, $post->owner_guid) || !(new OssnCircles())->canViewPost($post, $viewerGuid)) {
		return null;
	}
	$author = ossn_user_by_guid($post->owner_guid);
	$text = trim((string) $post->description);
	return array(
		'guid'            => intval($post->guid),
		'text'            => $text !== '' ? mb_substr($text, 0, 200) : null,
		'poster_username' => $author ? (string) $author->username : null,
		'poster_icon'     => $author ? (string) $author->iconURL()->large : null,
	);
}

/**
 * BERX WORLD — real "reply to a story" (Story reply always lands in
 * the story owner's DMs, same product convention every real platform
 * with stories uses). Same re-verify-on-every-read discipline as
 * ossn_api_message_shared_post() above — a story is deliberately
 * ephemeral (24h, OssnStories::isActive()) and can also be blocked or
 * deleted, so a stale reference must never leak it back out once it's
 * no longer real for THIS reader. checkStoryAccess() is the exact
 * same real gate the story media route and view-mark route already
 * use — never a separate, looser check invented for this one path.
 */
function ossn_api_message_shared_story($messages, $messageId, $viewerGuid) {
	$rows = $messages->searchEntities(array(
		'type'       => 'message',
		'owner_guid' => intval($messageId),
		'limit'      => false,
	));
	if (!$rows) {
		return null;
	}
	$storyId = null;
	foreach ($rows as $r) {
		if ($r->subtype === 'shared_story_guid') {
			$storyId = intval($r->value);
		}
	}
	if (!$storyId || !class_exists('OssnStories')) {
		return null;
	}
	$stories = new OssnStories();
	$story = $stories->get($storyId);
	if (!$story || !$stories->checkStoryAccess($story, $viewerGuid)) {
		return null;
	}
	$owner = ossn_user_by_guid($story->owner_guid);
	return array(
		'id'              => intval($story->id),
		'mime_type'       => (string) $story->mime_type,
		'caption'         => $story->caption !== null ? (string) $story->caption : null,
		'owner_guid'      => intval($story->owner_guid),
		'owner_username'  => $owner ? (string) $owner->username : null,
	);
}

function ossn_api_message_json($row, $messages, $viewerGuid) {
	return array(
		'id'          => intval($row->id),
		'from_guid'   => intval($row->message_from),
		'to_guid'     => intval($row->message_to),
		'text'        => (string) $row->message,
		'time'        => intval($row->time),
		'edited'      => !empty($row->edited),
		'time_edited' => $row->time_edited !== null ? intval($row->time_edited) : null,
		'viewed'      => !empty($row->viewed),
		'attachment'  => ossn_api_message_attachment($messages, $row->id),
		'shared_post' => ossn_api_message_shared_post($messages, $row->id, $viewerGuid),
		'shared_story' => ossn_api_message_shared_story($messages, $row->id, $viewerGuid),
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
		// MAX BUILD -- real bulk presence (OssnMessages::onlineStatus(),
		// zero prior UI caller). One query for the whole list instead of
		// N — collect every "with" guid first, then a single lookup.
		$withGuids = array();
		foreach ($chats as $chat) {
			$withGuids[] = intval($chat->message_from) === intval($api_user_guid) ? intval($chat->message_to) : intval($chat->message_from);
		}
		$onlineMap = $withGuids ? $messages->onlineStatus(implode(',', array_unique($withGuids))) : false;
		foreach ($chats as $chat) {
			$withGuid = intval($chat->message_from) === intval($api_user_guid) ? intval($chat->message_to) : intval($chat->message_from);
			$withUser = ossn_user_by_guid($withGuid);
			// Real, free — recentChat()'s own query already selects m.*
			// (confirmed by reading searchMessages() directly), so viewed
			// is already on this row, no extra query needed. Real "has
			// something new since you last opened this thread" signal:
			// the most recent message was sent TO me and I haven't
			// viewed it yet — not an exact unread count, but never fake.
			$hasUnread = intval($chat->message_to) === intval($api_user_guid) && empty($chat->viewed);
			$out[] = array(
				'with_guid'     => $withGuid,
				'with_username' => $withUser ? (string) $withUser->username : null,
				// The other participant's own real avatar. $withUser is already
				// loaded here, so this costs nothing — it was simply never sent,
				// which is why every conversation row drew an initial.
				'with_icon'     => $withUser ? (string) $withUser->iconURL()->large : null,
				'last_message'  => (string) $chat->message,
				'time'          => intval($chat->time),
				'has_unread'    => $hasUnread,
				'with_online'   => $onlineMap && isset($onlineMap[$withGuid]) ? (bool) $onlineMap[$withGuid] : false,
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
			$out[] = ossn_api_message_json($row, $messages, $api_user_guid);
		}
	}
	$withUser = ossn_user_by_guid(intval($segment0));
	$withOnline = $withUser instanceof OssnUser ? $withUser->isOnline(10) : false;
	ossn_api_json(array('messages' => $out, 'with_online' => (bool) $withOnline));
}

if ($segment0 !== null && $segment1 === 'messages' && $segment2 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	if (ossn_api_is_blocked($api_user_guid, $segment0)) {
		ossn_api_error('not_found', 'Conversation not found', 404);
	}
	// BERX WORLD — real "share post to conversation". Never trusted
	// from the client alone: re-fetched and re-checked (real post,
	// caller can actually still see it) before it's allowed to ride
	// along. Stored the exact same real way an attachment already is —
	// OssnMessages::send() walks every property on $this->data and
	// writes each as a real ossn_entities_metadata row keyed to the
	// new message (see OssnMessages::send()'s own attachment_guid/
	// attachment_name handling this mirrors) — no new table needed.
	$sharedPostGuid = intval(input('shared_post_guid'));
	if ($sharedPostGuid > 0) {
		$sharedPost = (new OssnWall())->GetPost($sharedPostGuid);
		if (!$sharedPost || ossn_api_is_blocked($api_user_guid, $sharedPost->owner_guid) || !(new OssnCircles())->canViewPost($sharedPost, $api_user_guid)) {
			ossn_api_error('validation_error', 'Invalid shared_post_guid', 422);
		}
		$messages->data->shared_post_guid = intval($sharedPost->guid);
	}
	// BERX WORLD — real "reply to a story" (see ossn_api_message_shared_
	// story()'s own header). Same never-trust-the-client discipline:
	// re-fetched and re-checked via the story's own real access gate.
	$sharedStoryGuid = intval(input('shared_story_guid'));
	if ($sharedStoryGuid > 0 && class_exists('OssnStories')) {
		$stories = new OssnStories();
		$sharedStory = $stories->get($sharedStoryGuid);
		if (!$sharedStory || !$stories->checkStoryAccess($sharedStory, $api_user_guid)) {
			ossn_api_error('validation_error', 'Invalid shared_story_guid', 422);
		}
		$messages->data->shared_story_guid = intval($sharedStory->id);
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
	// Real OssnMessages::deleteMessage() (was zero-caller before this) --
	// unlike a bare row delete, this also removes the entity metadata
	// rows and the attachment file/dir on disk, so a deleted attachment
	// message doesn't leave an orphaned upload behind.
	$messages->id = intval($segment2);
	$messages->deleteMessage();
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
