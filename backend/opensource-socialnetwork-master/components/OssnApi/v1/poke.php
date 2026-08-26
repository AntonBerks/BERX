<?php
/**
 * BERX API v1 — Poke. OssnPoke::addPoke()'s own internal block check
 * (OssnBlock::UserBlockCheck()) reads ossn_loggedin_user() — the
 * dispatcher never populates that, so it would silently no-op (never
 * actually block) if relied on. Re-checked explicitly here with real
 * user objects before calling addPoke(), same real, disclosed fix
 * this exact endpoint needed before (see
 * docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §4).
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 !== null && $method === 'POST') {
	if (ossn_api_is_blocked($api_user_guid, $segment0)) {
		ossn_api_error('forbidden', 'Cannot poke this user', 403);
	}
	$poke = new OssnPoke();
	$poke->addPoke(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown poke action', 404);
