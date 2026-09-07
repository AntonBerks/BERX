<?php
/**
 * BERX API v1 — Tracks. Same architecture as Video: a track is a real
 * OssnWall post with a real audio-type OssnMediaAssets asset attached
 * via context ('post', post_guid) — not a new content type, no
 * copyrighted-catalog, no licensing metadata. Structurally parallel to
 * videos.php rather than generalizing it, matching this codebase's own
 * per-resource-file convention (places.php/events.php are separate
 * files too, not one generic "content.php").
 */

function ossn_api_track_asset_row_for_post($postGuid) {
	$mediaModel = new OssnMediaAssets();
	$rows = $mediaModel->listByContext('post', intval($postGuid));
	foreach ($rows as $row) {
		if ($row->media_type === OssnMediaAssets::TYPE_AUDIO) {
			return $row;
		}
	}
	return null;
}

function ossn_api_track_post_json($post, $asset) {
	$base = ossn_api_media_post_base_json($post);
	$base['track'] = array(
		'asset_guid'       => intval($asset->id),
		'url'              => ossn_api_media_asset_url($asset->id),
		'duration_seconds' => $asset->duration_seconds !== null ? intval($asset->duration_seconds) : null,
	);
	return $base;
}

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	$mediaModel = new OssnMediaAssets();
	if ($userGuid) {
		$assets = $mediaModel->listByOwnerAndMediaType(intval($userGuid), OssnMediaAssets::TYPE_AUDIO, 'post');
	} else {
		$limit  = intval(ossn_api_page('limit')) ?: 20;
		$offset = intval(ossn_api_page('offset')) ?: 0;
		$assets = $mediaModel->listByMediaType(OssnMediaAssets::TYPE_AUDIO, 'post', $limit, $offset);
	}
	$wall = new OssnWall();
	$out = array();
	foreach ($assets as $asset) {
		if (!$asset->context_guid) {
			continue;
		}
		$post = $wall->GetPost(intval($asset->context_guid));
		if ($post) {
			$out[] = ossn_api_track_post_json($post, $asset);
		}
	}
	ossn_api_json(array('tracks' => $out));
}

if ($segment0 !== null && $method === 'GET') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Track not found', 404);
	}
	$asset = ossn_api_track_asset_row_for_post($post->guid);
	if (!$asset) {
		ossn_api_error('not_found', 'No track attached to this post', 404);
	}
	ossn_api_json(ossn_api_track_post_json($post, $asset));
}

ossn_api_error('not_found', 'Unknown tracks action', 404);
