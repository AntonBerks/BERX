<?php
/**
 * BERX API v1 — Media Assets: generic upload/metadata/attach layer on
 * top of the real OssnFile storage system (never duplicates its real
 * resize/MIME/CDN logic). Real, disclosed limit: OssnFile::mimeTypes()
 * (core, unmodified) only whitelists image/jpeg, image/png, image/gif,
 * image/webp, audio/mpeg (.mp3) and video/mp4 (.mp4) — confirmed by
 * reading the real whitelist before writing this, not assumed. A
 * webm/m4a/wav/ogg upload is genuinely rejected by core, not a bug
 * here to route around.
 *
 * Read (`GET /media/{guid}`, and the actual byte-streaming
 * `/media/get/{guid}` route) is public-by-guid — same real trust model
 * already established and running for Place/Event covers via
 * themes/berx/ossn_theme.php's ossn_berx_media_page_handler(). Write
 * operations (upload/delete/attach/detach) are bearer-token +
 * ownership gated here.
 */

function ossn_api_media_asset_url($assetGuid) {
	// The real streaming route already exists —
	// themes/berx/ossn_theme.php's ossn_berx_media_page_handler(),
	// registered as page handler 'media' → /media/get/{guid}. Not
	// re-registered here, just referenced.
	return ossn_site_url("media/get/{$assetGuid}");
}

function ossn_api_media_asset_json($row) {
	return array(
		// ossn_media_assets.id IS the real OssnFile guid, reused
		// directly (see OssnMediaAssets::create()) — there is no
		// separate `guid` column on this table.
		'guid'             => intval($row->id),
		'owner_guid'       => intval($row->owner_guid),
		'media_type'       => (string) $row->media_type,
		'mime'             => (string) $row->mime,
		'width'            => isset($row->width) && $row->width !== null ? intval($row->width) : null,
		'height'           => isset($row->height) && $row->height !== null ? intval($row->height) : null,
		// No real transcode/probe pipeline exists in this environment —
		// never estimated, always honestly null for video/audio.
		'duration_seconds' => isset($row->duration_seconds) && $row->duration_seconds !== null ? intval($row->duration_seconds) : null,
		'status'           => (string) $row->status,
		'context_type'     => isset($row->context_type) ? ($row->context_type !== null ? (string) $row->context_type : null) : null,
		'context_guid'     => isset($row->context_guid) && $row->context_guid !== null ? intval($row->context_guid) : null,
		'url'              => ossn_api_media_asset_url($row->id),
		'time_created'     => intval($row->time_created),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;
$segment1 = isset($segments[1]) ? $segments[1] : null;
$segment2 = isset($segments[2]) ? $segments[2] : null;
$segment3 = isset($segments[3]) ? $segments[3] : null;

if ($segment0 === null && $method === 'POST') {
	$file = new OssnFile();
	$file->owner_guid = intval($api_user_guid);
	$file->type       = 'berx_media';
	$file->subtype    = 'media_asset';
	$file->setFile('file');
	$file->setPath('media/');
	if (function_exists('ossn_file_is_cdn_storage_enabled') && ossn_file_is_cdn_storage_enabled()) {
		$file->setStore('cdn');
	}
	$file->setExtension(array('jpg', 'jpeg', 'jfif', 'gif', 'png', 'webp', 'mp4', 'mp3'));

	$fileGuid = $file->addFile();
	if (!$fileGuid) {
		ossn_api_error('upload_failed', $file->getFileUploadError($file->error), 422);
	}

	$ext = strtolower($file->extension);
	if (in_array($ext, array('jpg', 'jpeg', 'jfif', 'gif', 'png', 'webp'), true)) {
		$mediaType = OssnMediaAssets::TYPE_IMAGE;
	} elseif ($ext === 'mp4') {
		$mediaType = OssnMediaAssets::TYPE_VIDEO;
	} else {
		$mediaType = OssnMediaAssets::TYPE_AUDIO;
	}

	$width = null;
	$height = null;
	if ($mediaType === OssnMediaAssets::TYPE_IMAGE && isset($file->file['tmp_name']) && is_file($file->file['tmp_name'])) {
		$dim = @getimagesize($file->file['tmp_name']);
		if ($dim) {
			$width  = $dim[0];
			$height = $dim[1];
		}
	}

	$mime = isset($file->file['type']) ? $file->file['type'] : '';
	$model = new OssnMediaAssets();
	$model->create($fileGuid, $api_user_guid, $mediaType, $mime, $width, $height);

	$row = $model->get($fileGuid);
	if (!$row) {
		ossn_api_error('create_failed', 'Could not record media asset', 500);
	}
	ossn_api_json(ossn_api_media_asset_json($row));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$model = new OssnMediaAssets();
	$row = $model->get(intval($segment0));
	if (!$row) {
		ossn_api_error('not_found', 'Media asset not found', 404);
	}
	ossn_api_json(ossn_api_media_asset_json($row));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$model = new OssnMediaAssets();
	$ok = $model->removeAsset(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'attach' && $method === 'POST') {
	$contextType = input('context_type');
	$contextGuid = input('context_guid');
	if (!$contextType || !$contextGuid) {
		ossn_api_error('validation_error', 'context_type and context_guid are required', 422);
	}
	$model = new OssnMediaAssets();
	$ok = $model->attach(intval($segment0), $api_user_guid, $contextType, intval($contextGuid));
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 !== null && $segment1 === 'detach' && $method === 'POST') {
	$model = new OssnMediaAssets();
	$ok = $model->detach(intval($segment0), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'forbidden'));
}

if ($segment0 === 'context' && $segment1 !== null && $segment2 !== null && $method === 'GET') {
	$model = new OssnMediaAssets();
	$rows = $model->listByContext($segment1, intval($segment2));
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_media_asset_json($row);
	}
	ossn_api_json(array('media' => $out));
}

ossn_api_error('not_found', 'Unknown media action', 404);
