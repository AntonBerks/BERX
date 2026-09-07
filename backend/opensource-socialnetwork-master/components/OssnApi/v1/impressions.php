<?php
/**
 * BERX API v1 — Nearby impression actions. No new class/table: real
 * OssnNearbyImpressions::record() (already built, already used by
 * places.php's business dashboard summary — this is what actually
 * feeds it real numbers). 'shown' is recorded server-side inside
 * GET /nearby itself; this covers the real client-performed actions.
 */

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'places'
$segment1 = isset($segments[1]) ? $segments[1] : null; // place guid
$segment2 = isset($segments[2]) ? $segments[2] : null; // 'action'

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $segment2 === 'action' && $method === 'POST') {
	$action = input('action');
	if (!in_array($action, OssnNearbyImpressions::VALID_ACTIONS, true) || $action === 'shown') {
		// 'shown' is server-recorded only (GET /nearby), never client-claimed.
		ossn_api_error('validation_error', 'Invalid action', 422);
	}
	$ok = (new OssnNearbyImpressions())->record($segment1, $api_user_guid, $action);
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

ossn_api_error('not_found', 'Unknown impressions route', 404);
