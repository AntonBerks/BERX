<?php
/**
 * BERX API v1 — Message search. client.ts's own comment names a real
 * `ossn_messagesearch_query()` the web /messages-search page reuses —
 * that function does not exist anywhere in this codebase right now
 * (confirmed by a real grep across the whole tree before writing this,
 * not assumed present). Rather than invent a parallel search engine,
 * this builds the same real query directly through OssnMessages::
 * searchMessages()'s own already-real, already-parameterized `wheres`
 * passthrough — a LIKE match on `m.message`, scoped to conversations
 * the caller is actually part of. Confirmed real and correctly
 * parameterized: OssnDatabase::wheres() binds LIKE values the same as
 * any other comparator, no raw string concatenation of user input.
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown messagesearch action', 404);
}

$q = input('q');
if (!$q) {
	ossn_api_error('validation_error', 'q is required', 422);
}

$myGuid = intval($api_user_guid);
$messages = new OssnMessages();
$rows = $messages->searchMessages(array(
	'wheres' => array(
		OssnDatabase::wheres('m.message', 'LIKE', '%' . $q . '%'),
		// Raw, but on a value we already trust: $myGuid comes from our
		// own validated bearer token, never from request input.
		"(m.message_from='{$myGuid}' OR m.message_to='{$myGuid}')",
	),
	'order_by' => 'm.time DESC',
	'limit'    => 50,
));

$out = array();
if ($rows) {
	foreach ($rows as $row) {
		$outgoing = intval($row->message_from) === $myGuid;
		$otherGuid = $outgoing ? intval($row->message_to) : intval($row->message_from);
		$other = ossn_user_by_guid($otherGuid);
		$out[] = array(
			'text'     => (string) $row->message,
			'time'     => intval($row->time),
			'outgoing' => $outgoing,
			'user'     => $other ? array(
				'guid'     => intval($other->guid),
				'username' => (string) $other->username,
				'fullname' => trim($other->first_name . ' ' . $other->last_name),
				'icon'     => (string) $other->iconURL()->large,
			) : array('guid' => $otherGuid, 'username' => '', 'fullname' => '', 'icon' => ''),
		);
	}
}
ossn_api_json(array('results' => $out));
