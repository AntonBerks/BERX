<?php
/**
 * BERX API v1 — Business Moments (Business Live). No new class, no
 * new table: routing + JSON over the already-real OssnBusinessMoments
 * (owner-only, max 24h, capped text) and OssnPlaces (ownership).
 * Matches client.ts's createBusinessMoment()/deleteBusinessMoment()/
 * placeMoments() and types.ts's BerxBusinessMoment field-for-field.
 */

function ossn_api_moment_json($row) {
	return array(
		'id'         => intval($row->id),
		'place_guid' => intval($row->place_guid),
		'text'       => (string) $row->text,
		'starts_at'  => intval($row->starts_at),
		'ends_at'    => intval($row->ends_at),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'places' | moment id
$segment1 = isset($segments[1]) ? $segments[1] : null; // place guid (under 'places')

$moments = new OssnBusinessMoments();

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $method === 'GET') {
	$rows = $moments->activeForPlace(intval($segment1), 20);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_moment_json($row);
	}
	ossn_api_json(array('moments' => $out));
}

if ($segment0 === 'places' && $segment1 !== null && is_numeric($segment1) && $method === 'POST') {
	if (!class_exists('OssnPlaces')) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$place = (new OssnPlaces())->getPlace($segment1);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$text = input('text');
	$endsAt = input('ends_at');
	if (!$text || !$endsAt || !is_numeric($endsAt)) {
		ossn_api_error('validation_error', 'text and ends_at are required', 422);
	}
	$result = $moments->create($place, $api_user_guid, $text, intval($endsAt));
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to post moments for this place', 403);
	}
	if ($result === 'invalid_text' || $result === 'invalid_window' || $result === 'failed') {
		ossn_api_error('validation_error', 'Invalid moment', 422);
	}
	ossn_api_json(array('id' => intval($result)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	$ok = $moments->removeMoment($segment0, $api_user_guid);
	if (!$ok) {
		ossn_api_error('forbidden', 'Not allowed to delete this moment', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown moments route', 404);
