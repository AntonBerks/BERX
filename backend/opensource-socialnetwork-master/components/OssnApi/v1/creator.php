<?php
/**
 * BERX API v1 — Creator. OssnCreator is fully real and complete (see
 * classes/OssnCreator.php) — thin REST wrapper only. recentEvents()
 * honestly returns [] until OssnEvents exists (Wave 3) — a real
 * class_exists() guard inside OssnCreator itself, not faked here.
 */

function ossn_api_creator_profile_json($row, $viewerGuid) {
	$model = new OssnCreator();
	return array(
		'user_guid'    => intval($row->user_guid),
		'category'     => $row->category !== null ? (string) $row->category : null,
		'bio'          => $row->bio !== null ? (string) $row->bio : null,
		'is_own'       => intval($row->user_guid) === intval($viewerGuid),
		'time_enabled' => intval($row->time_enabled),
		'audience'     => $model->audienceSummary($row->user_guid),
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // username | 'enable' | 'disable'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'content' | 'view'

$model = new OssnCreator();

if ($segment0 === 'enable' && $method === 'POST') {
	$category = input('category');
	$bio = input('bio');
	$ok = $model->enable($api_user_guid, $api_user_guid, $category ? $category : null, $bio ? $bio : '');
	ossn_api_json(array('status' => $ok ? 'ok' : 'already_enabled'));
}

if ($segment0 === 'disable' && $method === 'POST') {
	$ok = $model->disable($api_user_guid, $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_enabled'));
}

if ($segment0 === null && $method === 'PATCH') {
	$fields = array();
	if (($v = input('category')) !== false) {
		$fields['category'] = $v;
	}
	if (($v = input('bio')) !== false) {
		$fields['bio'] = $v;
	}
	$ok = $model->update($api_user_guid, $api_user_guid, $fields);
	if (!$ok) {
		ossn_api_error('update_failed', 'Could not update creator profile', 422);
	}
	$row = $model->getProfile($api_user_guid);
	ossn_api_json(ossn_api_creator_profile_json($row, $api_user_guid));
}

if ($segment0 !== null && $segment0 !== 'enable' && $segment0 !== 'disable' && $segment1 === null && $method === 'GET') {
	$user = ossn_user_by_username($segment0);
	if (!$user || !$model->isCreator($user->guid)) {
		ossn_api_error('not_found', 'Creator not found', 404);
	}
	$row = $model->getProfile($user->guid);
	ossn_api_json(ossn_api_creator_profile_json($row, $api_user_guid));
}

if ($segment0 !== null && $segment1 === 'content' && $method === 'GET') {
	$user = ossn_user_by_username($segment0);
	if (!$user || !$model->isCreator($user->guid)) {
		ossn_api_error('not_found', 'Creator not found', 404);
	}

	$posts = array();
	foreach ($model->recentPosts($user->guid, $api_user_guid) as $post) {
		$posts[] = array('guid' => intval($post->guid), 'text' => (string) $post->description, 'time' => intval($post->time_created));
	}

	$albums = array();
	foreach ($model->recentAlbums($user->guid) as $album) {
		$albums[] = array('guid' => intval($album->guid), 'title' => (string) $album->title);
	}

	$events = array();
	foreach ($model->recentEvents($user->guid) as $event) {
		$events[] = array(
			'guid'      => intval($event->guid),
			'title'     => (string) $event->title,
			'starts'    => intval($event->starts),
			'image_url' => isset($event->cover_url) ? $event->cover_url : null,
		);
	}

	$experiences = array();
	foreach ($model->recentExperiences($user->guid, $api_user_guid) as $exp) {
		$anchorTitle = null;
		if ($exp->place_guid) {
			$resolved = ossn_api_resolve_item('place', $exp->place_guid);
			$anchorTitle = $resolved ? $resolved['title'] : null;
		} elseif ($exp->event_guid) {
			$resolved = ossn_api_resolve_item('event', $exp->event_guid);
			$anchorTitle = $resolved ? $resolved['title'] : null;
		}
		$experiences[] = array(
			'id'              => intval($exp->id),
			'title'           => (string) $exp->title,
			'anchor_title'    => $anchorTitle,
			'image_url'       => null,
			'scheduled_start' => intval($exp->scheduled_start),
		);
	}

	ossn_api_json(array('posts' => $posts, 'albums' => $albums, 'events' => $events, 'experiences' => $experiences));
}

if ($segment0 !== null && $segment1 === 'view' && $method === 'POST') {
	$user = ossn_user_by_username($segment0);
	if (!$user) {
		ossn_api_error('not_found', 'Creator not found', 404);
	}
	$model->recordView($user->guid, $api_user_guid);
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown creator action', 404);
