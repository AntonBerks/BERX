<?php
/**
 * BERX API v1 — Comments on Places/Events. No new class, no new
 * table: real, existing OssnComments (annotation-backed), same core
 * class posts.php uses for post comments, just a different `type`
 * bucket ('comments:place'/'comments:event' vs 'comments:post').
 * Separate from posts.php's comment endpoints — different backing
 * model, matches client.ts's own doc comment.
 *
 * REAL DETAIL confirmed by reading OssnAnnotation::searchAnnotation()
 * before writing this: a fetched comment's text is NOT under a
 * ->value or ->text property — it's merged onto a dynamic property
 * named literally by the annotation type ("comments:place" /
 * "comments:event"), since that's `$annotation->type => $annotation->value`
 * before the object is reconstructed. Read via a variable property
 * name here, not assumed.
 */

function ossn_api_object_comment_json($row, $type) {
	$author = ossn_user_by_guid($row->owner_guid);
	$textKey = "comments:{$type}";
	$photo = $row->photoURL();
	return array(
		'id'        => intval($row->id),
		'text'      => isset($row->$textKey) ? (string) $row->$textKey : '',
		'time'      => intval($row->time_created),
		'photo_url' => $photo ? (string) $photo : null,
		'author'    => $author ? array(
			'guid'     => intval($author->guid),
			'username' => (string) $author->username,
			'fullname' => trim($author->first_name . ' ' . $author->last_name),
			'icon'     => (string) $author->iconURL()->large,
		) : null,
	);
}

function ossn_api_commentable_subject_exists($type, $id) {
	if ($type === 'place') {
		return class_exists('OssnPlaces') && (new OssnPlaces())->getPlace($id);
	}
	if ($type === 'event') {
		return class_exists('OssnEvents') && (new OssnEvents())->getEvent($id);
	}
	return false;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // comment id
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'delete'

$model = new OssnComments();

if ($segment0 === null && $method === 'GET') {
	$type = input('type');
	$id = input('id');
	if (!in_array($type, array('place', 'event'), true) || !$id || !is_numeric($id)) {
		ossn_api_error('validation_error', 'type (place|event) and id are required', 422);
	}
	$rows = $model->GetComments(intval($id), $type);
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$out[] = ossn_api_object_comment_json($row, $type);
		}
	}
	$count = $model->countComments(intval($id), $type);
	ossn_api_json(array('comments' => $out, 'count' => $count ? intval($count) : 0));
}

if ($segment0 === null && $method === 'POST') {
	$type = input('type');
	$id = input('id');
	$text = input('comment');
	if (!in_array($type, array('place', 'event'), true) || !$id || !is_numeric($id) || !$text) {
		ossn_api_error('validation_error', 'type (place|event), id and comment are required', 422);
	}
	if (!ossn_api_commentable_subject_exists($type, intval($id))) {
		ossn_api_error('not_found', ucfirst($type) . ' not found', 404);
	}
	$commentId = $model->PostComment(intval($id), intval($api_user_guid), $text, $type);
	if (!$commentId) {
		ossn_api_error('validation_error', 'Could not post comment', 422);
	}
	ossn_api_json(array('id' => intval($commentId)));
}

if ($segment0 !== null && is_numeric($segment0) && $segment1 === 'delete' && $method === 'POST') {
	$comment = $model->GetComment(intval($segment0));
	if (!$comment) {
		ossn_api_error('not_found', 'Comment not found', 404);
	}
	// Author or admin only — enforced here against the comment's own
	// real owner_guid, never against anything the request itself sends.
	if (intval($comment->owner_guid) !== intval($api_user_guid) && !ossn_isAdminLoggedin()) {
		ossn_api_error('forbidden', 'Not allowed to delete this comment', 403);
	}
	$ok = $model->deleteComment(intval($segment0));
	ossn_api_json(array('status' => $ok ? 'ok' : 'failed'));
}

ossn_api_error('not_found', 'Unknown comments route', 404);
