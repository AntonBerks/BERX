<?php
/**
 * BERX API v1 — Places. The real-world entity foundation everything
 * else in BERX World/NOW/Business/Trips/Experiences/Search points at
 * (see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §3.5, §6, §8 step 5).
 * All domain logic lives in classes/OssnPlaces.php — this file is
 * routing + JSON shaping only, same split as every other v1 resource.
 *
 * `business`/team/subscription/hours/moments/claims (the separate
 * top-level `business` resource, /business/places/{guid}/team etc.)
 * are deliberately NOT wired here — see ossn_com.php's resource
 * whitelist comment. Only the business/* sub-branches that live under
 * /places/{guid}/business/* (enable/disable/verify/dashboard) are, per
 * client.ts's own grouping.
 */

function ossn_api_place_review_json($row) {
	$author = ossn_user_by_guid($row->author_guid);
	$reply = null;
	if (class_exists('OssnBusiness')) {
		$replyRow = (new OssnBusiness())->getReply($row->id);
		if ($replyRow) {
			$reply = array('text' => (string) $replyRow->text, 'time_created' => intval($replyRow->time_created));
		}
	}
	return array(
		'guid'        => intval($row->id),
		'rating'      => intval($row->rating),
		'text'        => (string) $row->text,
		'time'        => intval($row->time_created),
		'author'      => $author ? array(
			'guid'     => intval($author->guid),
			'username' => (string) $author->username,
			'fullname' => trim($author->first_name . ' ' . $author->last_name),
			'icon'     => (string) $author->iconURL()->large,
		) : null,
		'owner_reply' => $reply,
	);
}

// ossn_api_place_categories() moved to ossn_com.php (the always-loaded
// bootstrap) — events.php needs the exact same curated list for
// GET /events/categories (same BerxPlaceCategory shape), and only one
// v1/*.php is ever include()'d per request, so a function needed by
// more than one resource file can't live in either one.

$segment0 = isset($segments[0]) ? $segments[0] : null; // guid | 'categories' | 'saved' | 'nearby'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'reviews' | 'business' | 'save' | 'unsave' | 'cover'
$segment2 = isset($segments[2]) ? $segments[2] : null; // 'enable' | 'disable' | 'verify' | 'dashboard'

$model = new OssnPlaces();

/* ---- fixed-keyword branches (checked before the numeric-guid branches) ---- */

if ($segment0 === 'categories' && $segment1 === null && $method === 'GET') {
	ossn_api_json(array('categories' => ossn_api_place_categories()));
}

if ($segment0 === 'saved' && $segment1 === null && $method === 'GET') {
	ossn_api_json(array('places' => $model->savedPlaces($api_user_guid, $api_user_guid)));
}

if ($segment0 === 'nearby' && $segment1 === null && $method === 'GET') {
	$lat = input('lat');
	$lng = input('lng');
	if ($lat === false || $lng === false || !OssnGeo::isValidLat($lat) || !OssnGeo::isValidLng($lng)) {
		ossn_api_error('validation_error', 'lat and lng are required', 422);
	}
	$radius = input('radius');
	$radiusKm = ($radius !== false && is_numeric($radius)) ? floatval($radius) : 5;
	$rows = (new OssnGeo())->near(floatval($lat), floatval($lng), $radiusKm, 'place', 60);
	$out = array();
	foreach ($rows as $row) {
		$place = $model->getPlace($row->object_guid, $api_user_guid);
		if ($place) {
			$place->distance_km = $row->distance;
			$out[] = $place;
		}
	}
	ossn_api_json(array('places' => $out, 'radius_km' => $radiusKm));
}

if ($segment0 === null && $method === 'GET') {
	$rows = $model->listPlaces(array(
		'q'        => input('q') ?: null,
		'category' => input('category') ?: null,
		'limit'    => 30,
	), $api_user_guid);
	ossn_api_json(array('places' => $rows));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	$category = input('category');
	if (!$title || !$category) {
		ossn_api_error('validation_error', 'title and category are required', 422);
	}
	$fields = array(
		'title'       => $title,
		'category'    => $category,
		'description' => input('description') ?: '',
		'address'     => input('address') ?: '',
		'phone'       => input('phone') ?: '',
		'website'     => input('website') ?: '',
		'hours'       => input('hours') ?: '',
		'price'       => input('price') !== false ? intval(input('price')) : 0,
	);
	$lat = input('lat');
	$lng = input('lng');
	if ($lat !== false && $lng !== false) {
		$fields['lat'] = floatval($lat);
		$fields['lng'] = floatval($lng);
	}
	$guid = $model->createPlace($api_user_guid, $fields);
	if (!$guid) {
		ossn_api_error('validation_error', 'Could not create place', 422);
	}
	ossn_api_json(array('guid' => intval($guid)));
}

/* ---- numeric-guid branches ---- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$place = $model->getPlace($segment0, $api_user_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	ossn_api_json($place);
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'PATCH') {
	$fields = array();
	foreach (array('title', 'description', 'category', 'website', 'address', 'phone', 'hours') as $key) {
		$v = input($key);
		if ($v !== false) {
			$fields[$key] = $v;
		}
	}
	if (input('price') !== false) {
		$fields['price'] = intval(input('price'));
	}
	if (input('lat') !== false && input('lng') !== false) {
		$fields['lat'] = floatval(input('lat'));
		$fields['lng'] = floatval(input('lng'));
	}
	$result = $model->updatePlace($segment0, $api_user_guid, $fields);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to edit this place', 403);
	}
	if ($result === 'invalid') {
		ossn_api_error('validation_error', 'Invalid fields', 422);
	}
	ossn_api_json($model->getPlace($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	$result = $model->deletePlace($segment0, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to delete this place', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'reviews' && $method === 'GET') {
	$rows = $model->reviews($segment0);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_place_review_json($row);
	}
	ossn_api_json(array('reviews' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'reviews' && $method === 'POST') {
	$rating = input('rating');
	if ($rating === false || !is_numeric($rating)) {
		ossn_api_error('validation_error', 'rating is required', 422);
	}
	$result = $model->addReview($segment0, $api_user_guid, intval($rating), input('review') ?: '');
	if ($result === 'invalid') {
		ossn_api_error('validation_error', 'Invalid place or rating', 422);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Cannot review your own place', 403);
	}
	if ($result === 'duplicate') {
		ossn_api_error('conflict', 'Already reviewed this place', 409);
	}
	ossn_api_json(array('guid' => intval($result)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'save' && $method === 'POST') {
	$place = $model->getPlace($segment0);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	$model->savePlace($segment0, $api_user_guid);
	ossn_api_json(array('status' => 'ok', 'is_saved' => true));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'unsave' && $method === 'POST') {
	$model->unsavePlace($segment0, $api_user_guid);
	ossn_api_json(array('status' => 'ok', 'is_saved' => false));
}

/**
 * MAX BUILD — real geo-verified check-in (the "verify" step of
 * discover/plan/go/participate/verify/review/earn/remember). Server
 * re-verifies distance itself via OssnPlaces::checkIn() — the client
 * only supplies its own device coordinates, never a claimed result.
 * One real point award per (user, place, day) via the same
 * OssnPoints one-time-reason mechanism missions/reviews already use.
 */
if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'checkin' && $method === 'POST') {
	$lat = input('lat');
	$lng = input('lng');
	if ($lat === false || $lng === false) {
		ossn_api_error('validation_error', 'lat and lng are required', 422);
	}
	$result = $model->checkIn($segment0, $api_user_guid, floatval($lat), floatval($lng));
	if (!$result['ok']) {
		$status = $result['reason'] === 'not_found' ? 404 : ($result['reason'] === 'too_far' ? 422 : 400);
		// ossn_api_error() only ever returns {error, message} — no room
		// for a separate structured field, so the real distance (when
		// known) is embedded directly in the message text itself.
		$message = $result['reason'] === 'too_far'
			? 'Слишком далеко: ' . round($result['distance_m']) . ' м от места'
			: 'Check-in not verified: ' . $result['reason'];
		ossn_api_error($result['reason'], $message, $status);
	}
	$today = date('Y-m-d');
	$awarded = (new OssnPoints())->award($api_user_guid, 8, "checkin:{$segment0}:{$today}", intval($segment0), true);
	ossn_api_json(array('status' => 'ok', 'distance_m' => $result['distance_m'], 'points_awarded' => $awarded ? 8 : 0));
}

if ($segment0 === 'checkins' && $segment1 === null && $method === 'GET') {
	$rows = $model->recentCheckins($api_user_guid, 20);
	$out = array();
	foreach ($rows as $row) {
		$out[] = array('place' => $row['place'], 'time' => $row['time']);
	}
	ossn_api_json(array('checkins' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'cover' && $method === 'POST') {
	$place = $model->getPlace($segment0);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if (!$model->canEditPlace($place, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to edit this place', 403);
	}
	$file = new OssnFile();
	$file->owner_guid = intval($api_user_guid);
	$file->type       = 'berx_media';
	$file->subtype    = 'place:cover';
	// Field name 'cover' matches client.ts's uploadPlaceCover() multipart field.
	$file->setFile('cover');
	$file->setPath('media/');
	if (function_exists('ossn_file_is_cdn_storage_enabled') && ossn_file_is_cdn_storage_enabled()) {
		$file->setStore('cdn');
	}
	$file->setExtension(array('jpg', 'jpeg', 'jfif', 'gif', 'png', 'webp'));
	$fileGuid = $file->addFile();
	if (!$fileGuid) {
		ossn_api_error('upload_failed', $file->getFileUploadError($file->error), 422);
	}
	$mime = isset($file->file['type']) ? $file->file['type'] : '';
	$width = null;
	$height = null;
	if (isset($file->file['tmp_name']) && is_file($file->file['tmp_name'])) {
		$dim = @getimagesize($file->file['tmp_name']);
		if ($dim) {
			$width = $dim[0];
			$height = $dim[1];
		}
	}
	$assets = new OssnMediaAssets();
	$assets->create($fileGuid, $api_user_guid, OssnMediaAssets::TYPE_IMAGE, $mime, $width, $height);
	$assets->attach($fileGuid, $api_user_guid, 'place', intval($segment0));
	$model->setCover($segment0, $api_user_guid, $fileGuid);
	$fresh = $model->getPlace($segment0);
	ossn_api_json(array('status' => 'ok', 'cover_url' => $fresh ? $fresh->cover_url : null));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'business' && $segment2 === 'enable' && $method === 'POST') {
	$result = $model->setBusinessEnabled($segment0, $api_user_guid, true);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed', 403);
	}
	ossn_api_json($model->getPlace($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'business' && $segment2 === 'disable' && $method === 'POST') {
	$result = $model->setBusinessEnabled($segment0, $api_user_guid, false);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed', 403);
	}
	ossn_api_json($model->getPlace($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'business' && $segment2 === 'verify' && $method === 'POST') {
	$result = $model->setVerified($segment0, true);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	ossn_api_json($model->getPlace($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'business' && $segment2 === 'verify' && $method === 'DELETE') {
	$result = $model->setVerified($segment0, false);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Admin only', 403);
	}
	ossn_api_json($model->getPlace($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'business' && $segment2 === 'dashboard' && $method === 'GET') {
	$place = $model->getPlace($segment0, $api_user_guid);
	if (!$place) {
		ossn_api_error('not_found', 'Place not found', 404);
	}
	if (!$model->canEditPlace($place, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed', 403);
	}
	$reviewRows = $model->reviews($segment0, 5);
	$recentReviews = array();
	foreach ($reviewRows as $row) {
		$recentReviews[] = ossn_api_place_review_json($row);
	}
	$impressions = class_exists('OssnNearbyImpressions') ? (new OssnNearbyImpressions())->summaryFor($segment0) : null;
	// MAX BUILD — "Business + Places + Moments + Events + Offers +
	// Reputation = one real-world business ecosystem": the dashboard
	// already showed reviews/impressions/subscription; now also shows
	// the business's own upcoming events at this place, and real
	// customer activity (who actually, geo-verified, checked in) —
	// owner-only, gated by the same canEditPlace() check above.
	$upcomingEvents = class_exists('OssnEvents') ? (new OssnEvents())->upcomingByPlace($segment0, 10) : array();
	$recentCheckins = $model->checkinsForPlace($segment0, 20);
	ossn_api_json(array(
		'place_guid'         => intval($segment0),
		'is_business'        => $place->is_business,
		'verified'           => $place->verified,
		'rating'             => $place->rating,
		'rating_count'       => $place->rating_count,
		'recent_reviews'     => $recentReviews,
		'nearby_impressions' => $impressions,
		'upcoming_events'    => $upcomingEvents,
		'recent_checkins'    => $recentCheckins,
	));
}

ossn_api_error('not_found', 'Unknown places route', 404);
