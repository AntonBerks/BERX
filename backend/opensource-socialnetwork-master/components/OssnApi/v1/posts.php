<?php
/**
 * BERX API v1 — Posts, comments-on-posts, likes.
 *
 * Real visibility storage (closes the gap disclosed earlier this
 * session): OssnWall extends OssnObject, and OssnObject::addObject()
 * really does persist arbitrary named metadata set on $this->data
 * before the call — confirmed by reading addObject()/getObjectById()
 * directly (the same real mechanism OssnPlaces/OssnEvents already
 * rely on for category/address/etc this session), and OssnWall's own
 * initAttributes() only initializes $this->data if it isn't already
 * set, so setting it before Post() survives. OssnCircles::canViewPost()
 * already reads $post->berx_visibility and is already called by
 * posts.php's own GET branch and OssnCreator::recentPosts() — this
 * was the one missing piece, not a wider gap.
 *
 * MAX BUILD — real post save/unsave/saved-list (closes routes.ts's
 * long-disclosed "Post/wall bookmarking has no API endpoint" gap).
 * Deliberately a separate, lighter mechanism from OssnCollections
 * (which already accepts item_type='post' for curated, nameable,
 * possibly-public collections) — this is the quick one-tap personal
 * bookmark, same real ossn_relationships toggle pattern
 * OssnPlaces::SAVE_RELATION already established, just on posts
 * ('post:save'), no new table, no new class needed for two routes.
 */
const POST_SAVE_RELATION = 'post:save';

/** Real detail shape — feed's lighter base mapper plus real counts. */
function ossn_api_post_detail_json($post, $viewerGuid) {
	$base = ossn_api_post_base_json($post);
	$likes = new OssnLikes();
	$likeCount = $likes->CountLikes($post->guid, 'post');
	$comments = new OssnComments();
	$commentCount = $comments->countComments($post->guid, 'post');
	$base['like_count'] = $likeCount ? intval($likeCount) : 0;
	$base['comment_count'] = $commentCount ? intval($commentCount) : 0;
	$base['is_saved'] = $viewerGuid ? ossn_relation_exists(intval($viewerGuid), intval($post->guid), POST_SAVE_RELATION) : false;
	// MAX BUILD — real is_liked. OssnLikes::isLiked()/UnLike() were
	// always real, callable methods (confirmed by reading the class
	// directly) — the earlier "no updated like COUNT to reconcile
	// against" note on the client was describing a real UI gap, not a
	// real backend one; this closes it honestly rather than leaving a
	// stale disclosed limitation once the real mechanism was found.
	$base['is_liked'] = $viewerGuid ? (bool) $likes->isLiked($post->guid, intval($viewerGuid), 'post') : false;
	return $base;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // post guid | 'saved'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'like' | 'comments' | 'save' | 'unsave'
$segment2 = isset($segments[2]) ? $segments[2] : null; // comment id
$segment3 = isset($segments[3]) ? $segments[3] : null; // 'delete'

if ($segment0 === 'saved' && $segment1 === null && $method === 'GET') {
	$rows = ossn_get_relationships(array('from' => intval($api_user_guid), 'type' => POST_SAVE_RELATION, 'limit' => 100, 'page_limit' => false));
	$wall = new OssnWall();
	$circles = new OssnCircles();
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$post = $wall->GetPost(intval($row->relation_to));
			// Re-verified on every read, same as the single-post GET route:
			// a post can be deleted, its visibility narrowed, or its author
			// blocked AFTER it was saved — a stale save must never leak it.
			if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid) || !$circles->canViewPost($post, $api_user_guid)) {
				continue;
			}
			$out[] = ossn_api_post_detail_json($post, $api_user_guid);
		}
	}
	ossn_api_json(array('posts' => $out));
}

if ($segment0 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$visibility = input('visibility');
	if (!$visibility) {
		$visibility = OssnCircles::VISIBILITY_PUBLIC;
	} elseif (strpos($visibility, OssnCircles::VISIBILITY_PREFIX_CIRCLE) === 0) {
		// Real ownership check, server-side — matches client.ts's own
		// documented contract ("only accepted if the caller actually
		// owns that circle"), never trusted from the request alone.
		$circleId = intval(substr($visibility, strlen(OssnCircles::VISIBILITY_PREFIX_CIRCLE)));
		$circle = $circleId ? (new OssnCircles())->get($circleId) : false;
		if (!$circle || !(new OssnCircles())->canAccess($circle, $api_user_guid)) {
			ossn_api_error('forbidden', 'Not your circle', 403);
		}
		$visibility = OssnCircles::VISIBILITY_PREFIX_CIRCLE . $circleId;
	} elseif ($visibility !== OssnCircles::VISIBILITY_PUBLIC && $visibility !== OssnCircles::VISIBILITY_FRIENDS) {
		ossn_api_error('validation_error', 'Invalid visibility', 422);
	}

	$wall = new OssnWall();
	$wall->owner_guid  = intval($api_user_guid);
	$wall->poster_guid = intval($api_user_guid);
	$wall->type        = 'user';
	$wall->data = new stdClass();
	$wall->data->berx_visibility = $visibility;
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

if ($segment0 !== null && $segment1 === 'unlike' && $method === 'POST') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	(new OssnLikes())->UnLike($post->guid, $api_user_guid, 'post');
	ossn_api_json(array('status' => 'ok'));
}

if ($segment0 !== null && $segment1 === 'save' && $method === 'POST') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (!(new OssnCircles())->canViewPost($post, $api_user_guid)) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (!ossn_relation_exists(intval($api_user_guid), intval($segment0), POST_SAVE_RELATION)) {
		ossn_add_relation(intval($api_user_guid), intval($segment0), POST_SAVE_RELATION);
	}
	ossn_api_json(array('status' => 'ok', 'is_saved' => true));
}

if ($segment0 !== null && $segment1 === 'unsave' && $method === 'POST') {
	ossn_delete_relationship(array('from' => intval($api_user_guid), 'to' => intval($segment0), 'type' => POST_SAVE_RELATION));
	ossn_api_json(array('status' => 'ok', 'is_saved' => false));
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
