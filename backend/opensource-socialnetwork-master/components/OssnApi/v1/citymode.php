<?php
/**
 * BERX API v1 — City Mode. See docs/BERX_FUTURE_LAYER_SPEC.md: a
 * radius-scoped summary header over the same real OssnGeo query
 * nearby.php already uses — not a new geo system. No new class/table.
 * Real, disclosed cap: counts are bounded by the same 60-row window
 * OssnGeo::near() already caps at (real "pulse of the city" numbers
 * at this data volume, not a true unbounded city-wide total — same
 * honesty rule as everywhere else in this layer).
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown citymode route', 404);
}

$lat = input('lat');
$lng = input('lng');
if ($lat === false || $lng === false || !OssnGeo::isValidLat($lat) || !OssnGeo::isValidLng($lng)) {
	ossn_api_error('validation_error', 'lat and lng are required', 422);
}
$radiusParam = input('radius_km');
$radiusKm = ($radiusParam !== false && is_numeric($radiusParam)) ? floatval($radiusParam) : 5;

$geo = new OssnGeo();

$placeRows = $geo->near(floatval($lat), floatval($lng), $radiusKm, 'place', 60);
$placesCount = count($placeRows);

$eventsCount = 0;
if (class_exists('OssnEvents')) {
	$eventsModel = new OssnEvents();
	foreach ($geo->near(floatval($lat), floatval($lng), $radiusKm, 'event', 60) as $row) {
		$event = $eventsModel->getEvent($row->object_guid);
		if ($event && !$event->has_ended) {
			$eventsCount++;
		}
	}
}

$momentsCount = 0;
$momentsOut = array();
if ($placeRows) {
	$placeGuids = array();
	foreach ($placeRows as $row) {
		$placeGuids[] = intval($row->object_guid);
	}
	$activeMoments = (new OssnBusinessMoments())->activeForPlaces($placeGuids, 200);
	$momentsCount = count($activeMoments);

	// MAX BUILD — "City + People + Places + Events + Moments = one
	// living environment": City Mode already counted active moments,
	// now it also surfaces the real ones (soonest-ending first, capped
	// at 10 for a real "live now" strip, not the full count). Same
	// activeForPlaces() rows nearby.php already trusts, just not
	// discarded down to a bare count here anymore.
	usort($activeMoments, function ($a, $b) {
		return intval($a->ends_at) <=> intval($b->ends_at);
	});
	$placesModel = new OssnPlaces();
	$shown = 0;
	foreach ($activeMoments as $m) {
		if ($shown >= 10) {
			break;
		}
		$place = $placesModel->getPlace(intval($m->place_guid));
		if (!$place) {
			continue;
		}
		$momentsOut[] = array(
			'id'         => intval($m->id),
			'text'       => (string) $m->text,
			'ends_at'    => intval($m->ends_at),
			'place_guid' => intval($m->place_guid),
			'place_title' => (string) $place->title,
		);
		$shown++;
	}
}

$friendsOnlineCount = 0;
$friendRows = (new OssnUser())->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));
if ($friendRows) {
	$now = time();
	foreach ($friendRows as $f) {
		$lastActivity = isset($f->last_activity) ? intval($f->last_activity) : 0;
		if ($lastActivity > 0 && $lastActivity > $now - 100) {
			$friendsOnlineCount++;
		}
	}
}

ossn_api_json(array(
	'radius_km'            => $radiusKm,
	'places_count'         => $placesCount,
	'events_count'         => $eventsCount,
	'active_moments_count' => $momentsCount,
	'moments'              => $momentsOut,
	'friends_online_count' => $friendsOnlineCount,
));
