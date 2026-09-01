<?php
/**
 * BERX API v1 — Social Map. See docs/BERX_FUTURE_LAYER_SPEC.md. No new
 * class, no new table, no new person-location data: real OssnGeo pins
 * for Places/Events (lightweight — guid/title/category/lat/lng, not
 * the full hydrated record; a client follows up with getPlace()/
 * getEvent() for detail, same split nearby.php already uses) + the
 * real friends-online layer (same logic as presence.php — not pinned
 * on the map, since no real friend location exists or is exposed;
 * shown as a plain list alongside it).
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown socialmap route', 404);
}

$lat = input('lat');
$lng = input('lng');
if ($lat === false || $lng === false || !OssnGeo::isValidLat($lat) || !OssnGeo::isValidLng($lng)) {
	ossn_api_error('validation_error', 'lat and lng are required', 422);
}
$radiusParam = input('radius_km');
$radiusKm = ($radiusParam !== false && is_numeric($radiusParam)) ? floatval($radiusParam) : 5;

$geo = new OssnGeo();

$placePins = array();
if (class_exists('OssnPlaces')) {
	$placesModel = new OssnPlaces();
	foreach ($geo->near(floatval($lat), floatval($lng), $radiusKm, 'place', 60) as $row) {
		$place = $placesModel->getPlace($row->object_guid);
		if ($place) {
			// cover_url comes straight off the place the model already loaded —
			// the map markers render the place's own real photo rather than a dot.
			$placePins[] = array(
				'guid'      => intval($place->guid),
				'title'     => (string) $place->title,
				'category'  => $place->category,
				'cover_url' => isset($place->cover_url) ? $place->cover_url : null,
				'lat'       => $place->lat,
				'lng'       => $place->lng,
			);
		}
	}
}

$eventPins = array();
if (class_exists('OssnEvents')) {
	$eventsModel = new OssnEvents();
	foreach ($geo->near(floatval($lat), floatval($lng), $radiusKm, 'event', 60) as $row) {
		$event = $eventsModel->getEvent($row->object_guid);
		if ($event && !$event->has_ended) {
			$eventPins[] = array('guid' => intval($event->guid), 'title' => (string) $event->title, 'starts' => $event->starts, 'lat' => floatval($row->lat), 'lng' => floatval($row->lng));
		}
	}
}

$friendsOnline = array();
$rows = (new OssnUser())->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));
$now = time();
if ($rows) {
	foreach ($rows as $row) {
		$lastActivity = isset($row->last_activity) ? intval($row->last_activity) : 0;
		if ($lastActivity <= 0 || $lastActivity <= $now - 100) {
			continue;
		}
		$friendsOnline[] = array(
			'guid'     => intval($row->guid),
			'username' => (string) $row->username,
			'fullname' => trim($row->first_name . ' ' . $row->last_name),
			'icon'     => (string) $row->iconURL()->large,
		);
	}
}

ossn_api_json(array(
	'places'         => $placePins,
	'events'         => $eventPins,
	'friends_online' => $friendsOnline,
	'radius_km'      => $radiusKm,
));
