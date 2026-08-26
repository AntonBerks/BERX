<?php
/**
 * BERX API v1 — Nearby Now (BERX NOW / Personal Radar foundation).
 * No new class, no new table — pure composition over already-real
 * OssnGeo (map index), OssnPlaces/OssnEvents (entities, built this
 * session), OssnBusinessMoments (active place announcements) and
 * OssnPlaceHours (structured open/closed). Matches client.ts's
 * nearbyNow() and types.ts's BerxNearbyNow/BerxNearbyPlaceItem/
 * BerxNearbyEventItem field-for-field.
 *
 * open_now_available is a literal `false` in the real client type —
 * hours data is user-entered and network-wide coverage is genuinely
 * partial, so the capability is never advertised as complete even
 * though the open_now filter below does real filtering with whatever
 * structured hours exist.
 */

$lat = input('lat');
$lng = input('lng');
if ($lat === false || $lng === false || !OssnGeo::isValidLat($lat) || !OssnGeo::isValidLng($lng)) {
	ossn_api_error('validation_error', 'lat and lng are required', 422);
}
$radiusParam = input('radius_km');
$radiusKm = ($radiusParam !== false && is_numeric($radiusParam)) ? floatval($radiusParam) : 5;
$today = input('today') === '1';
$openNow = input('open_now') === '1';

$geo = new OssnGeo();
$placesModel = class_exists('OssnPlaces') ? new OssnPlaces() : null;
$eventsModel = class_exists('OssnEvents') ? new OssnEvents() : null;
$hoursModel = new OssnPlaceHours();

$placeRows = $placesModel ? $geo->near(floatval($lat), floatval($lng), $radiusKm, 'place', 60) : array();
$placeGuids = array();
foreach ($placeRows as $row) {
	$placeGuids[] = intval($row->object_guid);
}
$moments = $placeGuids ? (new OssnBusinessMoments())->activeForPlaces($placeGuids) : array();
$momentsByPlace = array();
foreach ($moments as $m) {
	$momentsByPlace[intval($m->place_guid)][] = array(
		'id'      => intval($m->id),
		'text'    => (string) $m->text,
		'ends_at' => intval($m->ends_at),
	);
}

$outPlaces = array();
foreach ($placeRows as $row) {
	$place = $placesModel->getPlace($row->object_guid);
	if (!$place) {
		continue;
	}
	$isOpenNow = $hoursModel->isOpenAt($place->guid);
	if ($openNow && $isOpenNow !== true) {
		continue;
	}
	// 'shown' is recorded here, server-side, per client.ts's own
	// documented contract — never client-claimed (see impressions.php).
	(new OssnNearbyImpressions())->record($place->guid, $api_user_guid, 'shown');
	$outPlaces[] = array(
		'guid'        => intval($place->guid),
		'title'       => (string) $place->title,
		'category'    => $place->category,
		'cover_url'   => $place->cover_url,
		'distance_km' => floatval($row->distance),
		'moments'     => isset($momentsByPlace[intval($place->guid)]) ? $momentsByPlace[intval($place->guid)] : array(),
		'is_open_now' => $isOpenNow,
	);
}

$outEvents = array();
if ($eventsModel) {
	$eventRows = $geo->near(floatval($lat), floatval($lng), $radiusKm, 'event', 60);
	$todayStr = date('Y-m-d');
	foreach ($eventRows as $row) {
		$event = $eventsModel->getEvent($row->object_guid);
		if (!$event || $event->has_ended) {
			continue;
		}
		if ($today && date('Y-m-d', $event->starts) !== $todayStr) {
			continue;
		}
		$outEvents[] = array(
			'guid'        => intval($event->guid),
			'title'       => (string) $event->title,
			'starts'      => intval($event->starts),
			'place_guid'  => $event->place ? intval($event->place['guid']) : 0,
			'distance_km' => floatval($row->distance),
		);
	}
}

ossn_api_json(array(
	'places'              => $outPlaces,
	'events'              => $outEvents,
	'open_now_available'  => false,
));
