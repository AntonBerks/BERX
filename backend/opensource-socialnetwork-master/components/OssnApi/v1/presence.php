<?php
/**
 * BERX API v1 — Presence (Live Presence foundation). No new class, no
 * new table, no new tracking mechanism: `ossn_users.last_activity` is
 * already real and already live — core's own update_last_activity()
 * is called unconditionally from system/start.php on every request
 * (confirmed by reading it, not assumed), so it already fires for
 * bearer-token API requests exactly like it does for the web app.
 * "Online" uses OssnUser::isOnline()'s own real 100s threshold.
 *
 * Scope of this slice: friends only (the real Social Graph edge that
 * already exists) — a broader "who's online" beyond real friends has
 * no privacy model defined yet in this codebase, so it's not built as
 * a guess.
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown presence route', 404);
}

$rows = (new OssnUser())->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));

$now = time();
$out = array();
if ($rows) {
	foreach ($rows as $row) {
		$lastActivity = isset($row->last_activity) ? intval($row->last_activity) : 0;
		// Same real threshold as OssnUser::isOnline() (100s) — not
		// re-derived, just applied directly since these rows already
		// carry last_activity (searchUsers() selects real u.*).
		if ($lastActivity <= 0 || $lastActivity <= $now - 100) {
			continue;
		}
		$out[] = array(
			'guid'        => intval($row->guid),
			'username'    => (string) $row->username,
			'fullname'    => trim($row->first_name . ' ' . $row->last_name),
			'icon'        => (string) $row->iconURL()->large,
			'last_active' => $lastActivity,
		);
	}
}

ossn_api_json(array('online' => $out));
