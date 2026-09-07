<?php
/**
 * BERX API v1 — Realtime.
 *
 * The HTTP half of the WebSocket transport. A socket cannot carry an
 * Authorization header (the browser WebSocket constructor takes none),
 * so the 90-day bearer token must never reach one. This route is the
 * exchange: an already-bearer-authenticated request mints a
 * short-lived, single-use credential (OssnRealtime::TTL_SECONDS) that
 * is good for opening exactly one socket and nothing else.
 *
 *   POST   /api/v1/realtime/token        mint one
 *   DELETE /api/v1/realtime/token        revoke every unused one
 *   POST   /api/v1/realtime/authorize    ask, over HTTP, what a channel
 *                                        list would be granted — the
 *                                        same answer the socket gives,
 *                                        from the same code
 *
 * The `url` returned with a token comes from the real site setting
 * `berx_realtime_url` and is null when the deployment has not set one.
 * It is never derived from the site URL by guessing a port: a client
 * that dials a guessed endpoint fails in a way that looks like the
 * server is down, rather than like it is unconfigured.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null;
$realtime = new OssnRealtime();

if ($segment0 === 'token' && $method === 'POST') {
	$minted = $realtime->mintToken($api_user_guid);
	if (!$minted) {
		ossn_api_error('mint_failed', 'Could not mint a realtime token', 500);
	}
	/* NOT ossn_site_settings(): that helper only ever sees the fixed
	   reserved list in OssnSite::reservedNames() (theme, site_name,
	   language, …) — read before writing this, not assumed from the
	   name. A deployment setting outside that list is read with
	   OssnSite::getSettings(), which queries the row. */
	$url = (new OssnSite())->getSettings('berx_realtime_url');
	ossn_api_json(array(
		'token'      => $minted['token'],
		'expires_at' => intval($minted['expires_at']),
		'url'        => ($url !== false && $url !== null && $url !== '') ? (string) $url : null,
		'protocol'   => 'berx-realtime-1',
	));
}

if ($segment0 === 'token' && $method === 'DELETE') {
	$realtime->revokeForUser($api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 === 'authorize' && $method === 'POST') {
	$channels = input('channels');
	if (is_string($channels)) {
		/* one channel, or a comma-separated list — the same shape the
		   socket's own subscribe frame accepts */
		$channels = array_filter(array_map('trim', explode(',', $channels)), 'strlen');
	}
	if (!is_array($channels)) {
		ossn_api_error('validation_error', 'channels is required', 422);
	}
	if (count($channels) > 64) {
		ossn_api_error('validation_error', 'Too many channels in one request', 422);
	}
	$decision = $realtime->authorizeChannels($api_user_guid, $channels);
	ossn_api_json(array(
		'granted' => $decision['granted'],
		'refused' => $decision['refused'],
	));
}

ossn_api_error('not_found', 'Unknown realtime action', 404);
