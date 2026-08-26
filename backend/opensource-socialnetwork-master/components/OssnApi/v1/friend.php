<?php
/**
 * BERX API v1 — Friend (send/confirm/remove). OSSN's real model is
 * mutual confirmed friendship (sendRequest()/deleteFriend() via real
 * relations) — no one-directional "follow" concept exists anywhere in
 * this backend.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === null) {
	ossn_api_error('not_found', 'Unknown friend action', 404);
}

if ($method === 'POST') {
	// Covers BOTH "send a new request" and "confirm the other side's
	// pending request" — real ossn_add_friend() behavior, matching the
	// real web action exactly.
	ossn_add_friend(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

if ($method === 'DELETE') {
	// Also cancels a pending (not-yet-mutual) request — real
	// ossn_remove_friend() handles both cases.
	ossn_remove_friend(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown friend action', 404);
