<?php
/**
 * BERX API v1 — Video. NOT a new content type: a video is a real
 * OssnWall post with a real video-type OssnMediaAssets asset attached
 * via context ('post', post_guid). Pure read/listing layer — creation
 * reuses POST /posts + POST /media + POST /media/{guid}/attach
 * directly (see client.ts's own comment on this), deletion reuses the
 * real DELETE /posts/{id} in posts.php.
 */

function ossn_api_video_asset_row_for_post($postGuid) {
	$mediaModel = new OssnMediaAssets();
	$rows = $mediaModel->listByContext('post', intval($postGuid));
	foreach ($rows as $row) {
		if ($row->media_type === OssnMediaAssets::TYPE_VIDEO) {
			return $row;
		}
	}
	return null;
}

function ossn_api_video_post_json($post, $asset) {
	$base = ossn_api_media_post_base_json($post);
	$base['video'] = array(
		'asset_guid'       => intval($asset->id),
		'url'              => ossn_api_media_asset_url($asset->id),
		'width'            => $asset->width !== null ? intval($asset->width) : null,
		'height'           => $asset->height !== null ? intval($asset->height) : null,
		'duration_seconds' => $asset->duration_seconds !== null ? intval($asset->duration_seconds) : null,
	);
	return $base;
}

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	$mediaModel = new OssnMediaAssets();
	if ($userGuid) {
		$assets = $mediaModel->listByOwnerAndMediaType(intval($userGuid), OssnMediaAssets::TYPE_VIDEO, 'post');
	} else {
		$limit  = intval(input('limit')) ?: 20;
		$offset = intval(input('offset')) ?: 0;
		$assets = $mediaModel->listByMediaType(OssnMediaAssets::TYPE_VIDEO, 'post', $limit, $offset);
	}
	$wall = new OssnWall();
	$out = array();
	foreach ($assets as $asset) {
		if (!$asset->context_guid) {
			continue;
		}
		$post = $wall->GetPost(intval($asset->context_guid));
		if ($post) {
			$out[] = ossn_api_video_post_json($post, $asset);
		}
	}
	ossn_api_json(array('videos' => $out));
}

if ($segment0 !== null && $method === 'GET') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Video not found', 404);
	}
	$asset = ossn_api_video_asset_row_for_post($post->guid);
	if (!$asset) {
		ossn_api_error('not_found', 'No video attached to this post', 404);
	}
	ossn_api_json(ossn_api_video_post_json($post, $asset));
}

ossn_api_error('not_found', 'Unknown videos action', 404);
