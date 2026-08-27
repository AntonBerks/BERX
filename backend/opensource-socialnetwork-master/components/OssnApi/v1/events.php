<?php
/**
 * BERX API v1 — Events. Same real OssnObject foundation as places.php
 * (see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §8 step 6). All domain
 * logic lives in classes/OssnEvents.php — this file is routing + JSON
 * shaping only, matching client.ts's Events methods and types.ts's
 * BerxEvent/BerxEventAttendee field-for-field.
 */

function ossn_api_event_attendee_json($row) {
	$user = ossn_user_by_guid($row->relation_from);
	if (!$user) {
		return null;
	}
	return array(
		'guid'     => intval($user->guid),
		'username' => (string) $user->username,
		'fullname' => trim($user->first_name . ' ' . $user->last_name),
		'icon'     => (string) $user->iconURL()->large,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // guid | 'categories' | 'going'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'attendees'|'rsvp'|'invite'|'cover'|'waitlist'
$segment2 = isset($segments[2]) ? $segments[2] : null; // 'cancel' (under rsvp or waitlist)

$model = new OssnEvents();

/* ---- fixed-keyword branches (checked before the numeric-guid branches) ---- */

if ($segment0 === 'categories' && $segment1 === null && $method === 'GET') {
	ossn_api_json(array('categories' => ossn_api_place_categories()));
}

/**
 * MAX BUILD -- real Trending Events. Same real OssnSignals
 * ('rsvp' recorded on the real RSVP route below) engagement ranking
 * as places.php's own GET /places/trending — see that file's own
 * comment for the full story. A live 7-day sum, never a
 * pre-baked/fake score; events with zero real signals in the window
 * are left out, not shown as a fake tie.
 */
if ($segment0 === 'trending' && $segment1 === null && $method === 'GET') {
	$limit = input('limit') ? max(1, min(50, intval(input('limit')))) : 10;
	$candidates = $model->listEvents(array('past' => false, 'limit' => 100), $api_user_guid);
	$scored = array();
	if (class_exists('OssnSignals') && $candidates) {
		$signals = new OssnSignals();
		foreach ($candidates as $event) {
			$score = $signals->engagementScore('event', intval($event->guid), 7 * 24 * 3600);
			if ($score > 0) {
				$event->trending_score = $score;
				$scored[] = $event;
			}
		}
		usort($scored, function ($a, $b) {
			return $b->trending_score <=> $a->trending_score;
		});
	}
	ossn_api_json(array('events' => array_slice($scored, 0, $limit)));
}

if ($segment0 === 'going' && $segment1 === null && $method === 'GET') {
	$events = $model->goingEvents($api_user_guid, $api_user_guid);
	// MAX BUILD — "shared activities": each of the caller's own
	// upcoming plans now also carries how many real friends are ALSO
	// going, a real nudge to coordinate (same friend-relevance
	// intersection ossn_api_friend_relevance_event_count() already
	// does for search/nearby, reused here — never a new computation).
	$friendRows = (new OssnUser())->getFriends($api_user_guid, array('limit' => 2000, 'page_limit' => false));
	$friendIds = array();
	if ($friendRows) {
		foreach ($friendRows as $f) {
			$friendIds[intval($f->guid)] = true;
		}
	}
	foreach ($events as $event) {
		$event->friends_going_count = ossn_api_friend_relevance_event_count($model, intval($event->guid), $friendIds);
	}
	ossn_api_json(array('events' => $events));
}

if ($segment0 === null && $method === 'GET') {
	$rows = $model->listEvents(array(
		'q'        => input('q') ?: null,
		'category' => input('category') ?: null,
		'past'     => input('past') ? true : false,
		'limit'    => 30,
	), $api_user_guid);
	ossn_api_json(array('events' => $rows));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	$category = input('category');
	$starts = input('starts');
	if (!$title || !$category || !$starts) {
		ossn_api_error('validation_error', 'title, category and starts are required', 422);
	}
	$fields = array(
		'title'       => $title,
		'category'    => $category,
		'starts'      => $starts,
		'description' => input('description') ?: '',
		'location'    => input('location') ?: '',
	);
	if (input('ends') !== false) {
		$fields['ends'] = input('ends');
	}
	if (input('place_guid') !== false) {
		$fields['place_guid'] = intval(input('place_guid'));
	}
	if (input('group_guid') !== false) {
		$fields['group_guid'] = intval(input('group_guid'));
	}
	if (input('capacity') !== false) {
		$fields['capacity'] = intval(input('capacity'));
	}
	$guid = $model->createEvent($api_user_guid, $fields);
	if (!$guid) {
		ossn_api_error('validation_error', 'Could not create event', 422);
	}
	ossn_api_json(array('guid' => intval($guid)));
}

/* ---- numeric-guid branches ---- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'GET') {
	$event = $model->getEvent($segment0, $api_user_guid);
	if (!$event) {
		ossn_api_error('not_found', 'Event not found', 404);
	}
	ossn_api_json($event);
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'PATCH') {
	$fields = array();
	foreach (array('title', 'description', 'category', 'starts', 'ends', 'location') as $key) {
		$v = input($key);
		if ($v !== false) {
			$fields[$key] = $v;
		}
	}
	if (input('place_guid') !== false) {
		$fields['place_guid'] = intval(input('place_guid'));
	}
	if (input('group_guid') !== false) {
		$fields['group_guid'] = intval(input('group_guid'));
	}
	if (input('capacity') !== false) {
		$fields['capacity'] = intval(input('capacity'));
	}
	$result = $model->updateEvent($segment0, $api_user_guid, $fields);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Event not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to edit this event', 403);
	}
	if ($result === 'invalid') {
		ossn_api_error('validation_error', 'Invalid fields', 422);
	}
	ossn_api_json($model->getEvent($segment0, $api_user_guid));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === null && $method === 'DELETE') {
	$result = $model->deleteEvent($segment0, $api_user_guid);
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Event not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Not allowed to delete this event', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'attendees' && $method === 'GET') {
	$rows = $model->attendees($segment0);
	$out = array();
	foreach ($rows as $row) {
		$json = ossn_api_event_attendee_json($row);
		if ($json) {
			$out[] = $json;
		}
	}
	ossn_api_json(array('attendees' => $out));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'rsvp' && $segment2 === null && $method === 'POST') {
	$result = $model->rsvp($segment0, $api_user_guid);
	$statusMap = array(
		'not_found'      => array('not_found', 'Event not found', 404),
		'ended'          => array('ended', 'Event has already ended', 409),
		'already_going'  => array('already_going', 'Already RSVPed to this event', 409),
		'full'           => array('full', 'Event is at capacity', 409),
		'rsvp_failed'    => array('rsvp_failed', 'Could not RSVP', 500),
	);
	if (isset($statusMap[$result])) {
		list($code, $message, $status) = $statusMap[$result];
		ossn_api_error($code, $message, $status);
	}
	// MAX BUILD -- real engagement signal (OssnSignals, BERX Future Core
	// -- see places.php's own comment for the full story). Best-effort.
	if (class_exists('OssnSignals')) {
		(new OssnSignals())->record($api_user_guid, 'rsvp', 'event', intval($segment0));
	}
	$fresh = $model->getEvent($segment0, $api_user_guid);
	ossn_api_json(array(
		'status'         => 'ok',
		'is_going'       => true,
		'seats_left'     => $fresh ? $fresh->seats_left : null,
		'attendee_count' => $fresh ? $fresh->attendee_count : 0,
	));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'rsvp' && $segment2 === 'cancel' && $method === 'POST') {
	$model->cancelRsvp($segment0, $api_user_guid);
	$fresh = $model->getEvent($segment0, $api_user_guid);
	ossn_api_json(array(
		'status'         => 'ok',
		'is_going'       => false,
		'seats_left'     => $fresh ? $fresh->seats_left : null,
		'attendee_count' => $fresh ? $fresh->attendee_count : 0,
	));
}

/* ---- Waitlist — real queue for a real-full event, see classes/OssnEvents.php's own header. ---- */

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'waitlist' && $segment2 === null && $method === 'POST') {
	$result = $model->joinWaitlist($segment0, $api_user_guid);
	$statusMap = array(
		'not_found'          => array('not_found', 'Event not found', 404),
		'ended'              => array('ended', 'Event has already ended', 409),
		'already_going'      => array('already_going', 'Already RSVPed to this event', 409),
		'not_full'           => array('not_full', 'Event still has open seats — RSVP directly', 409),
		'already_waitlisted' => array('already_waitlisted', 'Already on the waitlist', 409),
		'rsvp_failed'        => array('rsvp_failed', 'Could not join the waitlist', 500),
	);
	if (isset($statusMap[$result])) {
		list($code, $message, $status) = $statusMap[$result];
		ossn_api_error($code, $message, $status);
	}
	ossn_api_json(array(
		'status'          => 'ok',
		'is_waitlisted'   => true,
		'waitlist_position' => $model->waitlistPosition($segment0, $api_user_guid),
	));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'waitlist' && $segment2 === 'cancel' && $method === 'POST') {
	$model->leaveWaitlist($segment0, $api_user_guid);
	ossn_api_json(array('status' => 'ok', 'is_waitlisted' => false));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'invite' && $method === 'POST') {
	$userGuid = input('user');
	if (!$userGuid || !is_numeric($userGuid)) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$result = $model->invite($segment0, $api_user_guid, intval($userGuid));
	if ($result === 'not_found') {
		ossn_api_error('not_found', 'Event not found', 404);
	}
	if ($result === 'forbidden') {
		ossn_api_error('forbidden', 'Can only invite real friends', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'cover' && $method === 'POST') {
	$event = $model->getEvent($segment0);
	if (!$event) {
		ossn_api_error('not_found', 'Event not found', 404);
	}
	if (!$model->canEditEvent($event, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to edit this event', 403);
	}
	$file = new OssnFile();
	$file->owner_guid = intval($api_user_guid);
	$file->type       = 'berx_media';
	$file->subtype    = 'event:cover';
	// Field name 'cover' matches client.ts's uploadEventCover() multipart field.
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
	$assets->attach($fileGuid, $api_user_guid, 'event', intval($segment0));
	$model->setCover($segment0, $api_user_guid, $fileGuid);
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown events route', 404);
