<?php
/**
 * BERX WORLD — real feed Mute. Same real ossn_relationships toggle
 * pattern POST_PIN_RELATION/COMMENT_PIN_RELATION already established
 * (posts.php), no new table. Deliberately a lighter, one-directional,
 * self-only concept than OssnBlock: muting someone never touches the
 * real friendship, never blocks messaging, never hides your own
 * profile from them or theirs from you — it only ever changes whose
 * posts appear in the muter's OWN feed (see feed.php's own filter).
 * `from` is always the caller's own token identity, never accepted
 * from the request body — same rule block.php already states.
 */
const MUTE_RELATION = 'user:mute';

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === null && $method === 'GET') {
	$rows = ossn_get_relationships(array('from' => intval($api_user_guid), 'type' => MUTE_RELATION, 'limit' => false));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$muted = ossn_user_by_guid(intval($row->relation_to));
			if ($muted) {
				$out[] = array(
					'guid'     => intval($muted->guid),
					'username' => (string) $muted->username,
					'fullname' => trim($muted->first_name . ' ' . $muted->last_name),
					'icon'     => (string) $muted->iconURL()->large,
				);
			}
		}
	}
	ossn_api_json(array('muted' => $out));
}

if ($segment0 !== null && $method === 'POST') {
	$targetGuid = intval($segment0);
	if ($targetGuid === intval($api_user_guid)) {
		ossn_api_error('validation_error', 'Cannot mute yourself', 422);
	}
	if (!ossn_user_by_guid($targetGuid)) {
		ossn_api_error('not_found', 'User not found', 404);
	}
	if (!ossn_relation_exists(intval($api_user_guid), $targetGuid, MUTE_RELATION)) {
		ossn_add_relation(intval($api_user_guid), $targetGuid, MUTE_RELATION);
	}
	ossn_api_json(array('status' => 'ok', 'is_muted' => true));
}

if ($segment0 !== null && $method === 'DELETE') {
	ossn_delete_relationship(array('from' => intval($api_user_guid), 'to' => intval($segment0), 'type' => MUTE_RELATION));
	ossn_api_json(array('status' => 'ok', 'is_muted' => false));
}

ossn_api_error('not_found', 'Unknown mute action', 404);
