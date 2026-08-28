<?php
/**
 * BERX API v1 — Memories ("on this day"). No new class, no new table:
 * pure read over the real, existing OssnWall::getPosterPosts() (posts
 * actually authored by the caller, via the real `poster_guid`
 * metadata filter — distinct from `owner_guid`, which is whose wall a
 * post lands on) and OssnAlbums/OssnPhotos for the photo type. Matches
 * client.ts's memories() and types.ts's BerxMemory.
 *
 * Photos: a photo's real owner_guid is its ALBUM (OssnPhotos::
 * AddPhoto() sets owner_guid=$album, not the user), so this walks the
 * caller's own real albums (OssnAlbums::GetAlbums(), already bounded
 * to their own account) and each album's real photos
 * (OssnPhotos::GetPhotos($albumGuid)) — one bounded pass per album,
 * same personal-scale N+1 already accepted elsewhere this session
 * (Events' per-item place resolution, Wrapped's trip/experience
 * counts). getFiles() (behind GetPhotos()) wraps a non-empty result
 * via arrayObject() same as OssnDatabase::fetch() — foreach-safe,
 * confirmed by reading it, never passed to count()/array_merge() here.
 *
 * MAX BUILD — real check-in memories ("remember" step of the
 * Experience lifecycle, closing the loop with "verify"): the same
 * real geo-verified place:checkin relationships (OssnPlaces::
 * checkIn()) surfaced here for prior-year same-day matches, bounded
 * to the caller's own most recent 500 check-ins (a real, disclosed
 * cap — same honesty rule as everywhere else in this layer, not a
 * true unbounded lifetime scan).
 *
 * BERX WORLD — real, PERSISTED Memories (classes/OssnMemories.php),
 * additive to the "on this day" route above, not a replacement for
 * it. New segment-routed sub-resource:
 *   POST /memories/from-experience/{id}   save a real Memory from an
 *                                         Experience the caller was
 *                                         actually part of
 *   GET  /memories/saved                  the caller's own saved
 *                                         Memories (real, chronological)
 *   GET  /memories/saved/{id}             one Memory's real detail
 *                                         (title/place/when/who)
 *   PATCH /memories/saved/{id}            edit the personal caption only
 */

function ossn_api_memory_json($memory, $memoriesModel) {
	$place = null;
	if ($memory->place_guid && class_exists('OssnPlaces')) {
		$p = (new OssnPlaces())->getPlace($memory->place_guid);
		$place = $p ? array('guid' => intval($p->guid), 'title' => (string) $p->title) : null;
	}
	$people = array();
	foreach ($memoriesModel->participantsForMemory($memory->id) as $participant) {
		$user = ossn_user_by_guid($participant->user_guid);
		$people[] = array(
			'guid'     => intval($participant->user_guid),
			'username' => $user ? (string) $user->username : null,
			'icon'     => $user ? (string) $user->iconURL()->large : null,
		);
	}
	return array(
		'id'          => intval($memory->id),
		'title'       => (string) $memory->title,
		'notes'       => $memory->notes !== null ? (string) $memory->notes : null,
		'source_type' => (string) $memory->source_type,
		'source_id'   => intval($memory->source_id),
		'place'       => $place,
		'happened_at' => intval($memory->happened_at),
		'time_created' => intval($memory->time_created),
		'people'      => $people,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // 'from-experience' | 'saved'
$segment1 = isset($segments[1]) ? $segments[1] : null; // experience id | 'mine' | memory id

if ($segment0 === 'from-experience' && $segment1 !== null && is_numeric($segment1) && $method === 'POST') {
	$memoriesModel = new OssnMemories();
	$result = $memoriesModel->createFromExperience($segment1, $api_user_guid);
	if ($result['status'] === 'not_found') {
		ossn_api_error('not_found', 'Experience not found', 404);
	}
	if ($result['status'] === 'forbidden') {
		ossn_api_error('forbidden', 'Only someone who was really part of this experience can save it as a memory', 403);
	}
	if ($result['status'] === 'not_happened_yet') {
		ossn_api_error('validation_error', 'This experience has not happened yet', 422);
	}
	if ($result['status'] !== 'ok') {
		ossn_api_error('failed', 'Could not save memory', 422);
	}
	ossn_api_json(array('id' => intval($result['id'])));
}

if ($segment0 === 'saved' && $segment1 === null && $method === 'GET') {
	$memoriesModel = new OssnMemories();
	$limit = input('limit') ? max(1, min(100, intval(input('limit')))) : 50;
	$rows = $memoriesModel->myMemories($api_user_guid, $limit);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_memory_json($row, $memoriesModel);
	}
	ossn_api_json(array('memories' => $out));
}

if ($segment0 === 'saved' && $segment1 !== null && is_numeric($segment1) && $method === 'GET') {
	$memoriesModel = new OssnMemories();
	$memory = $memoriesModel->getMemory($segment1);
	if (!$memory) {
		ossn_api_error('not_found', 'Memory not found', 404);
	}
	if (!$memoriesModel->canView($memory, $api_user_guid)) {
		ossn_api_error('forbidden', 'Not allowed to view this memory', 403);
	}
	ossn_api_json(array('memory' => ossn_api_memory_json($memory, $memoriesModel)));
}

if ($segment0 === 'saved' && $segment1 !== null && is_numeric($segment1) && $method === 'PATCH') {
	$memoriesModel = new OssnMemories();
	$ok = $memoriesModel->updateNotes($segment1, $api_user_guid, input('notes'));
	if (!$ok) {
		ossn_api_error('forbidden', 'Not allowed to edit this memory', 403);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown memories route', 404);
}

$today = getdate();
$out = array();

$posts = (new OssnWall())->getPosterPosts($api_user_guid);
if ($posts) {
	foreach ($posts as $post) {
		$d = getdate(intval($post->time_created));
		if ($d['mon'] === $today['mon'] && $d['mday'] === $today['mday'] && $d['year'] < $today['year']) {
			$out[] = array(
				'type'      => 'post',
				'guid'      => intval($post->guid),
				'years_ago' => $today['year'] - $d['year'],
				'time'      => intval($post->time_created),
				'text'      => (string) $post->description,
			);
		}
	}
}

$albums = (new OssnAlbums())->GetAlbums($api_user_guid);
if ($albums) {
	$photosModel = new OssnPhotos();
	foreach ($albums as $album) {
		$photos = $photosModel->GetPhotos($album->guid);
		if (!$photos) {
			continue;
		}
		foreach ($photos as $photo) {
			$d = getdate(intval($photo->time_created));
			if ($d['mon'] !== $today['mon'] || $d['mday'] !== $today['mday'] || $d['year'] >= $today['year']) {
				continue;
			}
			$url = $photo->getURL();
			if (!$url) {
				continue;
			}
			$out[] = array(
				'type'       => 'photo',
				'guid'       => intval($photo->guid),
				'years_ago'  => $today['year'] - $d['year'],
				'time'       => intval($photo->time_created),
				'url'        => (string) $url,
				'album_guid' => intval($album->guid),
			);
		}
	}
}

if (class_exists('OssnPlaces')) {
	$placesModel = new OssnPlaces();
	$checkinRows = ossn_get_relationships(array('from' => $api_user_guid, 'type' => OssnPlaces::CHECKIN_RELATION, 'limit' => 500, 'page_limit' => false));
	if ($checkinRows) {
		foreach ($checkinRows as $row) {
			$d = getdate(intval($row->time));
			if ($d['mon'] !== $today['mon'] || $d['mday'] !== $today['mday'] || $d['year'] >= $today['year']) {
				continue;
			}
			$place = $placesModel->getPlace($row->relation_to);
			if (!$place) {
				continue;
			}
			$out[] = array(
				'type'       => 'checkin',
				'guid'       => intval($place->guid),
				'years_ago'  => $today['year'] - $d['year'],
				'time'       => intval($row->time),
				'place_title' => (string) $place->title,
			);
		}
	}
}

usort($out, function ($a, $b) {
	return $a['years_ago'] <=> $b['years_ago'];
});

ossn_api_json(array('memories' => $out));
