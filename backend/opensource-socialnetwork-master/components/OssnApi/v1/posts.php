<?php
/**
 * BERX API v1 — Posts, comments-on-posts, likes.
 *
 * KNOWN, DISCLOSED GAP (not silently faked): createPost() accepts a
 * `visibility` field (matching client.ts's real BerxPostVisibility
 * param) but does NOT yet persist it. OssnCircles::canViewPost() reads
 * $post->berx_visibility, but wall posts are OssnObject rows, not
 * OssnEntities rows — there is no existing, verified real mechanism in
 * this codebase to attach arbitrary named metadata to an OssnObject
 * (ossn_entities_metadata is id/guid/value with no name column; it
 * belongs to the separate Entities system OssnUser uses via
 * get_entities(), not confirmed to apply to Object rows). Building
 * real storage for this needs its own verified slice, not a guess
 * squeezed into this file. Every post is therefore treated as public
 * for now — canViewPost() is still called below (correctly falls back
 * to VISIBILITY_PUBLIC when berx_visibility is absent), so this
 * activates automatically and correctly the day real storage for it
 * ships, with zero change needed here.
 */

/** Real detail shape — feed's lighter base mapper plus real counts. */
function ossn_api_post_detail_json($post, $viewerGuid) {
	$base = ossn_api_post_base_json($post);
	$likes = new OssnLikes();
	$likeCount = $likes->CountLikes($post->guid, 'post');
	$comments = new OssnComments();
	$commentCount = $comments->countComments($post->guid, 'post');
	$base['like_count'] = $likeCount ? intval($likeCount) : 0;
	$base['comment_count'] = $commentCount ? intval($commentCount) : 0;
	return $base;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // post guid
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'like' | 'comments'
$segment2 = isset($segments[2]) ? $segments[2] : null; // comment id
$segment3 = isset($segments[3]) ? $segments[3] : null; // 'delete'

if ($segment0 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	// visibility intentionally read-but-not-stored — see file header.
	$visibility = input('visibility');

	$wall = new OssnWall();
	$wall->owner_guid  = intval($api_user_guid);
	$wall->poster_guid = intval($api_user_guid);
	$wall->type        = 'user';
	$guid = $wall->Post($text);
	if (!$guid) {
		ossn_api_error('create_failed', 'Could not create post', 500);
	}
	ossn_api_json(array('guid' => intval($guid)));
}

if ($segment0 !== null && $segment1 === null && $method === 'GET') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post || $post->guid != intval($segment0)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (ossn_api_is_blocked($api_user_guid, $post->owner_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	$circles = new OssnCircles();
	if (!$circles->canViewPost($post, $api_user_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	ossn_api_json(ossn_api_post_detail_json($post, $api_user_guid));
}

if ($segment0 !== null && $segment1 === 'like' && $method === 'POST') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	$likes = new OssnLikes();
	$likes->Like($post->guid, $api_user_guid, 'post');
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'comments' && $segment2 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	$comments = new OssnComments();
	$id = $comments->PostComment($post->guid, $api_user_guid, $text, 'post');
	if (!$id) {
		ossn_api_error('create_failed', 'Could not post comment', 500);
	}
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'comments' && $segment2 === null && $method === 'GET') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	$comments = new OssnComments();
	$rows = $comments->GetComments($post->guid, 'post');
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$author = ossn_user_by_guid($row->owner_guid);
			$photo = $row->photoURL();
			$out[] = array(
				'id'        => intval($row->id),
				'text'      => (string) $row->value,
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
	}
	ossn_api_json(array('comments' => $out));
}

if ($segment0 !== null && $segment1 === 'comments' && $segment2 !== null && $segment3 === 'delete' && $method === 'POST') {
	$comments = new OssnComments();
	$comment = $comments->GetComment(intval($segment2));
	if (!$comment) {
		ossn_api_error('not_found', 'Comment not found', 404);
	}
	if (intval($comment->owner_guid) !== intval($api_user_guid) && !ossn_isAdminLoggedin()) {
		ossn_api_error('forbidden', 'Not your comment', 403);
	}
	$comments->deleteComment(intval($segment2));
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (intval($post->owner_guid) !== intval($api_user_guid) && !ossn_isAdminLoggedin()) {
		ossn_api_error('forbidden', 'Not your post', 403);
	}
	// A video/track/attachment post is a real OssnWall post with a real
	// OssnMediaAssets row attached via context ('post', guid) — clean
	// those up too so a deleted post never leaves an orphaned file.
	if (class_exists('OssnMediaAssets')) {
		$mediaModel = new OssnMediaAssets();
		$attached = $mediaModel->listByContext('post', $post->guid);
		if ($attached) {
			foreach ($attached as $asset) {
				// NOTE: ossn_media_assets.id IS the real OssnFile guid,
				// reused directly (see OssnMediaAssets::create()) — the row
				// has no separate `guid` column, confirmed by reading the
				// class before writing this.
				$mediaModel->removeAsset($asset->id, $api_user_guid);
			}
		}
	}
	$wall->deletePost($post->guid);
	ossn_api_json(array('status' => 'ok'));
}

ossn_api_error('not_found', 'Unknown posts action', 404);
