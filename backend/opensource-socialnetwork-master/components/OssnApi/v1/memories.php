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
 */

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
