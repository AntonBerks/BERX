<?php
/**
 * BERX API v1 — Poke. OssnPoke::addPoke()'s own internal block check
 * (OssnBlock::UserBlockCheck()) reads ossn_loggedin_user() — the
 * dispatcher never populates that, so it would silently no-op (never
 * actually block) if relied on. Re-checked explicitly here with real
 * user objects before calling addPoke(), same real, disclosed fix
 * this exact endpoint needed before (see
 * docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §4).
 *
 * MAX BUILD — Trust & Safety: OssnPoke::addPoke() (core OSSN, left
 * unmodified) has no dedup or cooldown of its own — a straight INSERT
 * into ossn_notifications every call. Now that this session is wiring
 * a real UI button to it, an unguarded repeat-tap could flood one
 * specific real person's notifications — a real per-target spam
 * vector, not the "your own dashboard/DB" class of gap check-in/claim
 * closed. Guarded here at the API layer (same real relationship-
 * count-window idea as the other rate limits this session, applied to
 * ossn_notifications directly since a "poke" isn't a relation row):
 * one real poke per (poker, target) pair per 24h.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 !== null && $method === 'POST') {
	if (ossn_api_is_blocked($api_user_guid, $segment0)) {
		ossn_api_error('forbidden', 'Cannot poke this user', 403);
	}
	$cooldownSeconds = 86400;
	$since = time() - $cooldownSeconds;
	$db = new OssnDatabase();
	$recent = $db->select(array(
		'from'   => 'ossn_notifications',
		'wheres' => array(
			OssnDatabase::wheres('type', '=', 'ossnpoke:poke'),
			OssnDatabase::wheres('poster_guid', '=', intval($api_user_guid)),
			OssnDatabase::wheres('owner_guid', '=', intval($segment0)),
			OssnDatabase::wheres('time_created', '>=', $since),
		),
	));
	if ($recent) {
		ossn_api_error('rate_limited', 'You already poked this user recently', 429);
	}
	$poke = new OssnPoke();
	$poke->addPoke(intval($api_user_guid), intval($segment0));
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown poke action', 404);
