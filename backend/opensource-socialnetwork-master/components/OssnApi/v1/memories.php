<?php
/**
 * BERX API v1 — Memories ("on this day"). No new class, no new table:
 * pure read over the real, existing OssnWall::getPosterPosts() (posts
 * actually authored by the caller, via the real `poster_guid`
 * metadata filter — distinct from `owner_guid`, which is whose wall a
 * post lands on). Matches client.ts's memories() and types.ts's
 * BerxMemory.
 *
 * Scope of this slice: type 'post' only. BerxMemoryType also allows
 * 'photo', deliberately not populated yet — a photo's real owner_guid
 * is its ALBUM (OssnPhotos::AddPhoto() sets owner_guid=$album, not the
 * user), so listing a user's own photos across every album needs one
 * bounded pass per album (OssnAlbums::GetAlbums() -> per-album
 * photos) — a real, small follow-up slice, not bundled here. An empty
 * 'photo' result is an honest gap, not a fabricated one.
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown memories route', 404);
}

$posts = (new OssnWall())->getPosterPosts($api_user_guid);
$today = getdate();
$out = array();
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
usort($out, function ($a, $b) {
	return $a['years_ago'] <=> $b['years_ago'];
});

ossn_api_json(array('memories' => $out));
