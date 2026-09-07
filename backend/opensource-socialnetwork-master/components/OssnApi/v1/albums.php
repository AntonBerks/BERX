<?php
/**
 * BERX API v1 — Albums. Wraps the real, core OssnAlbums/OssnPhotos
 * classes. AddPhoto() internally checks
 * `$this->album->album->owner_guid == ossn_loggedin_user()->guid` —
 * the dispatcher never populates that, so it needs the same real
 * session-bridge fix as GET /feed, scoped to this one call.
 */

function ossn_api_album_json($row) {
	return array(
		'guid'         => intval($row->guid),
		'title'        => (string) $row->title,
		'owner_guid'   => intval($row->owner_guid),
		'access'       => isset($row->data->access) ? intval($row->data->access) : null,
		'time_created' => intval($row->time_created),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // album guid
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'photos'
$segment2 = isset($segments[2]) ? $segments[2] : null; // photo guid

$model = new OssnAlbums();

if ($segment0 === null && $method === 'GET') {
	$userGuid = input('user');
	if (!$userGuid) {
		ossn_api_error('validation_error', 'user is required', 422);
	}
	$rows = $model->GetAlbums(intval($userGuid));
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_album_json($row);
		}
	}
	ossn_api_json(array('albums' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$title = input('title');
	if (!$title) {
		ossn_api_error('validation_error', 'title is required', 422);
	}
	$access = input('access') === 'private' ? OSSN_PRIVATE : OSSN_PUBLIC;
	if (!$model->CreateAlbum($api_user_guid, $title, $access)) {
		ossn_api_error('create_failed', 'Could not create album', 500);
	}
	ossn_api_json(array('guid' => intval($model->getObjectId())));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$detail = $model->GetAlbum(intval($segment0));
	if (!$detail || !isset($detail->album)) {
		ossn_api_error('not_found', 'Album not found', 404);
	}
	$out = ossn_api_album_json($detail->album);
	$photos = array();
	if ($detail->photos) {
		foreach ($detail->photos as $photo) {
			$url = $photo->getURL();
			if ($url) {
				$photos[] = array('guid' => intval($photo->guid), 'url' => (string) $url);
			}
		}
	}
	$out['photos'] = $photos;
	ossn_api_json($out);
}

/**
 * MAX BUILD -- real Delete Album. OssnAlbums::deleteAlbum() was
 * always real (also cleans up every photo in it, wall posts, and
 * notifications — confirmed by reading its full body) but had zero
 * UI caller anywhere in this codebase; only single-photo delete
 * existed before this. Needs the same real $_SESSION['OSSN_USER']
 * bridge as AddPhoto() above (deleteAlbum() calls ossn_loggedin_user()
 * internally) — ownership is still re-checked here first, at the API
 * layer, before that bridge is ever set.
 */
if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$detail = $model->GetAlbum(intval($segment0));
	if (!$detail || !isset($detail->album)) {
		ossn_api_error('not_found', 'Album not found', 404);
	}
	if (intval($detail->album->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Not your album', 403);
	}
	$userModel = new OssnUser();
	$userModel->guid = intval($api_user_guid);
	$user = $userModel->getUser();
	$_SESSION['OSSN_USER'] = $user;
	$ok = $model->deleteAlbum(intval($segment0));
	unset($_SESSION['OSSN_USER']);
	ossn_api_json(array('status' => $ok ? 'ok' : 'delete_failed'));
}

if ($segment0 !== null && $segment1 === 'photos' && $segment2 === null && $method === 'POST') {
	$access = input('access') === 'private' ? OSSN_PRIVATE : OSSN_PUBLIC;

	$detail = $model->GetAlbum(intval($segment0));
	if (!$detail || !isset($detail->album) || intval($detail->album->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Not your album', 403);
	}

	$userModel = new OssnUser();
	$userModel->guid = intval($api_user_guid);
	$user = $userModel->getUser();
	$photos = new OssnPhotos();
	$_SESSION['OSSN_USER'] = $user;
	$fileGuid = $photos->AddPhoto(intval($segment0), 'photo', $access);
	unset($_SESSION['OSSN_USER']);

	if (!$fileGuid) {
		ossn_api_error('upload_failed', 'Could not upload photo', 422);
	}
	ossn_api_json(array('guid' => intval($fileGuid)));
}

if ($segment0 !== null && $segment1 === 'photos' && $segment2 !== null && $method === 'DELETE') {
	$detail = $model->GetAlbum(intval($segment0));
	if (!$detail || !isset($detail->album) || intval($detail->album->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Not your album', 403);
	}
	$photos = new OssnPhotos();
	$photos->photoid = intval($segment2);
	$ok = $photos->deleteAlbumPhoto();
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_found'));
}

ossn_api_error('not_found', 'Unknown albums action', 404);
