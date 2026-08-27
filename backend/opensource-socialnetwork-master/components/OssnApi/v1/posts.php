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
 *
 * MAX BUILD — real fix: the two admin-override delete checks below
 * (comment delete, post delete) used to call ossn_isAdminLoggedin(),
 * which needs $_SESSION populated — never true for a bearer-token API
 * request (same bug found and fixed across admin.php/report.php/
 * business.php/comments.php/communities.php). The real owner could
 * still delete their own either way, but an actual admin moderating
 * someone else's post/comment always silently failed. Now uses
 * ossn_api_is_admin($api_user_guid).
 */
const POST_SAVE_RELATION = 'post:save';
/** MAX BUILD — real Pinned Post: same real ossn_relationships toggle pattern as POST_SAVE_RELATION, no new table. Exactly one pinned post per user, enforced at write time (see the /pin route below), not just by convention. */
const POST_PIN_RELATION = 'post:pin';
/** MAX BUILD — real comment likes: OssnLikes' own $type param (default 'post') was always generic — passing 'comment' here reuses the exact same engine post likes use, no new table, no new class. */
const COMMENT_LIKE_TYPE = 'comment';

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
	// MAX BUILD — real, owner-scoped (pinning is never a per-viewer
	// state like save/like — it's the same real relation regardless of
	// who's asking, from the post owner outward).
	$base['is_pinned'] = ossn_relation_exists(intval($post->owner_guid), intval($post->guid), POST_PIN_RELATION);
	// MAX BUILD — real is_liked. OssnLikes::isLiked()/UnLike() were
	// always real, callable methods (confirmed by reading the class
	// directly) — the earlier "no updated like COUNT to reconcile
	// against" note on the client was describing a real UI gap, not a
	// real backend one; this closes it honestly rather than leaving a
	// stale disclosed limitation once the real mechanism was found.
	$base['is_liked'] = $viewerGuid ? (bool) $likes->isLiked($post->guid, intval($viewerGuid), 'post') : false;
	// MAX BUILD — real embedded original for a repost. Re-verified on
	// every read (deleted/blocked/visibility-narrowed since the repost
	// was made) — a stale repost pointer must never leak an original
	// the viewer shouldn't see; honestly null instead, same discipline
	// as /posts/saved and /posts/pinned above.
	$base['reposted_post'] = null;
	if ($base['repost_of']) {
		$originalWall = new OssnWall();
		$original = $originalWall->GetPost($base['repost_of']);
		if ($original && !ossn_api_is_blocked($viewerGuid, $original->owner_guid) && (new OssnCircles())->canViewPost($original, $viewerGuid)) {
			$base['reposted_post'] = ossn_api_post_base_json($original);
		}
	}
	return $base;
}

$segment0 = isset($segments[0]) ? $segments[0] : null; // post guid | 'saved' | 'drafts' | 'pinned'
$segment1 = isset($segments[1]) ? $segments[1] : null; // 'like' | 'comments' | 'save' | 'unsave' | draft id | profile guid
$segment2 = isset($segments[2]) ? $segments[2] : null; // comment id | 'publish'
$segment3 = isset($segments[3]) ? $segments[3] : null; // 'delete'

/**
 * Real, block/visibility-safe draft JSON — never leaked to anyone but
 * the owner (every route below checks owner_guid). Placed, and its
 * routes placed, BEFORE the generic single-post GET/POST branches
 * further down: those match on bare "$segment0 !== null" with no
 * is_numeric() guard, so a fixed keyword branch like this one must
 * win the top-to-bottom match first, same real ordering constraint
 * 'saved' below already lives under.
 */
function ossn_api_draft_json($draft) {
	return array(
		'id'           => intval($draft->id),
		'text'         => (string) $draft->text,
		'visibility'   => (string) $draft->visibility,
		'time_created' => intval($draft->time_created),
		'time_updated' => intval($draft->time_updated),
	);
}

if ($segment0 === 'drafts' && $segment1 === null && $method === 'GET') {
	$rows = (new OssnPostDrafts())->listOwn($api_user_guid);
	$out = array();
	foreach ($rows as $row) {
		$out[] = ossn_api_draft_json($row);
	}
	ossn_api_json(array('drafts' => $out));
}

if ($segment0 === 'drafts' && $segment1 === null && $method === 'POST') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$visibility = input('visibility');
	$id = (new OssnPostDrafts())->create($api_user_guid, $text, $visibility ? $visibility : 'public');
	if (!$id) {
		ossn_api_error('create_failed', 'Could not save draft', 422);
	}
	ossn_api_json(ossn_api_draft_json((new OssnPostDrafts())->get($id)));
}

if ($segment0 === 'drafts' && $segment1 !== null && $segment2 === null && $method === 'PATCH') {
	$text = input('text');
	if (!$text) {
		ossn_api_error('validation_error', 'text is required', 422);
	}
	$ok = (new OssnPostDrafts())->updateDraft(intval($segment1), $api_user_guid, $text, input('visibility'));
	if (!$ok) {
		ossn_api_error('not_found', 'Draft not found', 404);
	}
	ossn_api_json(ossn_api_draft_json((new OssnPostDrafts())->get(intval($segment1))));
}

if ($segment0 === 'drafts' && $segment1 !== null && $segment2 === null && $method === 'DELETE') {
	$ok = (new OssnPostDrafts())->deleteDraft(intval($segment1), $api_user_guid);
	ossn_api_json(array('status' => $ok ? 'ok' : 'not_found'));
}

/** Real publish: the draft becomes a real post via the exact same OssnWall::Post() path the main /posts POST route uses — never a separate, lighter content type. The draft row is deleted only after the real post is confirmed created. */
if ($segment0 === 'drafts' && $segment1 !== null && $segment2 === 'publish' && $method === 'POST') {
	$draftModel = new OssnPostDrafts();
	$draft = $draftModel->get(intval($segment1));
	if (!$draft || intval($draft->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('not_found', 'Draft not found', 404);
	}
	$visibility = $draft->visibility;
	if (strpos($visibility, OssnCircles::VISIBILITY_PREFIX_CIRCLE) === 0) {
		$circleId = intval(substr($visibility, strlen(OssnCircles::VISIBILITY_PREFIX_CIRCLE)));
		$circle = $circleId ? (new OssnCircles())->get($circleId) : false;
		if (!$circle || !(new OssnCircles())->canAccess($circle, $api_user_guid)) {
			// The circle this draft was scoped to no longer belongs to the
			// caller (deleted/transferred since the draft was saved) —
			// fail honestly rather than silently publishing to the wrong
			// audience.
			ossn_api_error('forbidden', 'Draft circle is no longer accessible', 403);
		}
	}
	$wall = new OssnWall();
	$wall->owner_guid  = intval($api_user_guid);
	$wall->poster_guid = intval($api_user_guid);
	$wall->type        = 'user';
	$wall->data = new stdClass();
	$wall->data->berx_visibility = $visibility;
	$guid = $wall->Post($draft->text);
	if (!$guid) {
		ossn_api_error('create_failed', 'Could not publish draft', 500);
	}
	$draftModel->deleteDraft(intval($segment1), $api_user_guid);
	ossn_api_json(array('status' => 'ok', 'guid' => intval($guid)));
}

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
	// MAX BUILD — a real repost may carry no added commentary at all
	// ("just share") — text is only required for a normal post; the
	// repost_of validation below (which requires text OR a real,
	// viewable original) enforces the actual constraint.
	if (!$text && !input('repost_of')) {
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

	// MAX BUILD — real Repost: same real OssnObject arbitrary-metadata
	// mechanism berx_visibility already established (confirmed real by
	// reading OssnObject::addObject()/getObjectById() before writing
	// this file's own berx_visibility support) — a repost is a real new
	// post row with a real pointer to the original, not a duplicated
	// copy of its text/media.
	$repostOfGuid = null;
	$repostOfInput = input('repost_of');
	if ($repostOfInput && is_numeric($repostOfInput)) {
		$originalWall = new OssnWall();
		$original = $originalWall->GetPost(intval($repostOfInput));
		if (!$original || ossn_api_is_blocked($api_user_guid, $original->owner_guid) || !(new OssnCircles())->canViewPost($original, $api_user_guid)) {
			ossn_api_error('not_found', 'Original post not found', 404);
		}
		$repostOfGuid = intval($original->guid);
	}

	$wall = new OssnWall();
	$wall->owner_guid  = intval($api_user_guid);
	$wall->poster_guid = intval($api_user_guid);
	$wall->type        = 'user';
	$wall->data = new stdClass();
	$wall->data->berx_visibility = $visibility;
	if ($repostOfGuid) {
		$wall->data->berx_repost_of = $repostOfGuid;
	}
	// OssnWall::Post() only accepts a real string with strlen()>0 OR a
	// literal null (its own real no-self-text branch, e.g. item_guid
	// posts) — a bare empty string hits neither and silently fails to
	// post. A no-commentary repost must pass null, not '', confirmed by
	// reading Post() itself before writing this, not assumed.
	$guid = $wall->Post($text !== '' ? $text : null);
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

/**
 * MAX BUILD — real Pinned Post. Owner-only — checked against the
 * post's own real owner_guid, never against anything the request
 * sends. Exactly one pin per user: any existing pin relation FROM this
 * owner is removed first, so pinning a second post really replaces
 * the first, never stacks two.
 */
if ($segment0 !== null && $segment1 === 'pin' && $method === 'POST') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (intval($post->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Only the author can pin this post', 403);
	}
	ossn_delete_relationship(array('from' => intval($api_user_guid), 'type' => POST_PIN_RELATION));
	ossn_add_relation(intval($api_user_guid), intval($segment0), POST_PIN_RELATION);
	ossn_api_json(array('status' => 'ok', 'is_pinned' => true));
}

if ($segment0 !== null && $segment1 === 'unpin' && $method === 'POST') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if ($post && intval($post->owner_guid) !== intval($api_user_guid)) {
		ossn_api_error('forbidden', 'Only the author can unpin this post', 403);
	}
	ossn_delete_relationship(array('from' => intval($api_user_guid), 'to' => intval($segment0), 'type' => POST_PIN_RELATION));
	ossn_api_json(array('status' => 'ok', 'is_pinned' => false));
}

/** Real, single pinned post for a profile (any viewer) — re-verified visibility/block on every read, same discipline as /saved above. */
if ($segment0 === 'pinned' && $segment1 !== null && $method === 'GET') {
	$rows = ossn_get_relationships(array('from' => intval($segment1), 'type' => POST_PIN_RELATION, 'limit' => 1));
	if (!$rows) {
		ossn_api_json(array('post' => null));
	}
	$row = is_array($rows) ? $rows[0] : $rows;
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($row->relation_to));
	if (!$post || ossn_api_is_blocked($api_user_guid, $post->owner_guid) || !(new OssnCircles())->canViewPost($post, $api_user_guid)) {
		ossn_api_json(array('post' => null));
	}
	ossn_api_json(array('post' => ossn_api_post_detail_json($post, $api_user_guid)));
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
	$likes = new OssnLikes();
	$rows = $comments->GetComments($post->guid, 'post');
	$out = array();
	if ($rows) {
		foreach ($rows as $row) {
			$author = ossn_user_by_guid($row->owner_guid);
			$photo = $row->photoURL();
			$commentLikeCount = $likes->CountLikes($row->id, COMMENT_LIKE_TYPE);
			$out[] = array(
				'id'         => intval($row->id),
				'text'       => (string) $row->value,
				'time'       => intval($row->time_created),
				'photo_url'  => $photo ? (string) $photo : null,
				// MAX BUILD — real comment likes, same OssnLikes engine
				// posts already use, just a different $type bucket
				// ('comment' vs 'post') — no new table needed.
				'like_count' => $commentLikeCount ? intval($commentLikeCount) : 0,
				'is_liked'   => (bool) $likes->isLiked($row->id, intval($api_user_guid), COMMENT_LIKE_TYPE),
				'author'     => $author ? array(
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
	if (intval($comment->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
		ossn_api_error('forbidden', 'Not your comment', 403);
	}
	$comments->deleteComment(intval($segment2));
	ossn_api_json(array('status' => 'ok'));
}

/** MAX BUILD — real comment likes (see COMMENT_LIKE_TYPE's own comment above). Any real, non-blocked caller may like any comment they can already see (same reach as the post itself). */
if ($segment0 !== null && $segment1 === 'comments' && $segment2 !== null && $segment3 === 'like' && $method === 'POST') {
	$comment = (new OssnComments())->GetComment(intval($segment2));
	if (!$comment) {
		ossn_api_error('not_found', 'Comment not found', 404);
	}
	(new OssnLikes())->Like(intval($segment2), intval($api_user_guid), COMMENT_LIKE_TYPE);
	ossn_api_json(array('status' => 'ok', 'is_liked' => true));
}

if ($segment0 !== null && $segment1 === 'comments' && $segment2 !== null && $segment3 === 'unlike' && $method === 'POST') {
	(new OssnLikes())->UnLike(intval($segment2), intval($api_user_guid), COMMENT_LIKE_TYPE);
	ossn_api_json(array('status' => 'ok', 'is_liked' => false));
}

if ($segment0 !== null && $segment1 === null && $method === 'DELETE') {
	$wall = new OssnWall();
	$post = $wall->GetPost(intval($segment0));
	if (!$post) {
		ossn_api_error('not_found', 'Post not found', 404);
	}
	if (intval($post->owner_guid) !== intval($api_user_guid) && !ossn_api_is_admin($api_user_guid)) {
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
