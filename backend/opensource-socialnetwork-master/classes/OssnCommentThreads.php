<?php
/**
 * BERX WORLD — Comment Threading. A real BERX-native companion layer
 * over stock OSSN's flat comments (OssnComments/OssnAnnotation) — see
 * upgrade/upgrades/1785171900.php for the full schema rationale and
 * why this is deliberately a separate table, never a change to
 * OssnAnnotation's own storage.
 */
class OssnCommentThreads extends OssnDatabase {

	const TABLE = 'ossn_comment_replies';

	/** Real row — the caller must have already re-verified $parentCommentId is a real comment on the same post before calling this (see posts.php's own create-comment route). */
	public function setParent($commentId, $parentCommentId, $postGuid) {
		return (bool) $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('comment_id', 'parent_comment_id', 'post_guid', 'time_created'),
			'values' => array(intval($commentId), intval($parentCommentId), intval($postGuid), time()),
		));
	}

	/** Real map of every real reply on this post — commentId => parentCommentId. One bounded query for the whole thread, not an N+1 per comment. */
	public function parentsForPost($postGuid, $limit = 500) {
		$rows = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('post_guid', '=', intval($postGuid))),
			'limit'  => intval($limit),
		), true);
		$map = array();
		if ($rows) {
			foreach ($rows as $row) {
				$map[intval($row->comment_id)] = intval($row->parent_comment_id);
			}
		}
		return $map;
	}
}
