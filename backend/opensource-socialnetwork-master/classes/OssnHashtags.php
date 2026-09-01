<?php
/**
 * BERX WORLD — Hashtags. A genuinely missing core social-network
 * primitive — see upgrade/upgrades/1785171800.php for the schema
 * rationale and the confirmation nothing like this existed before it.
 * BERX-native (shallow OssnDatabase only), same shape as every other
 * domain class this session added.
 *
 * Extraction is real: `#([\p{L}\p{N}_]+)` (Unicode letters/numbers/
 * underscore — this is a Russian-language app, Cyrillic hashtags are
 * real, not an edge case to special-case around), lowercased via
 * mb_strtolower() so #Питер and #питер are the same real tag, capped
 * at 60 chars. A post with the same tag twice in its text still
 * produces exactly one row (the table's own real UNIQUE KEY, not a
 * PHP-side dedupe that a race could defeat).
 */
class OssnHashtags extends OssnDatabase {

	const TABLE = 'ossn_post_hashtags';
	const MAX_TAG_LENGTH = 60;

	public static function extractTags($text) {
		$text = (string) $text;
		if ($text === '' || !preg_match_all('/#([\p{L}\p{N}_]+)/u', $text, $matches)) {
			return array();
		}
		$tags = array();
		foreach ($matches[1] as $raw) {
			$tag = mb_strtolower(mb_substr($raw, 0, self::MAX_TAG_LENGTH, 'UTF-8'), 'UTF-8');
			if ($tag !== '') {
				$tags[$tag] = true;
			}
		}
		return array_keys($tags);
	}

	/** Real rows, one per (post, tag) — the table's own UNIQUE KEY makes a duplicate insert a real no-op, not a caught exception this method needs to handle specially. */
	public function extractAndStore($postGuid, $ownerGuid, $text) {
		$tags = self::extractTags($text);
		if (!$tags) {
			return array();
		}
		$postGuid = intval($postGuid);
		$ownerGuid = intval($ownerGuid);
		$now = time();
		foreach ($tags as $tag) {
			$this->insert(array(
				'into'   => self::TABLE,
				'names'  => array('post_guid', 'hashtag', 'owner_guid', 'time_created'),
				'values' => array($postGuid, $tag, $ownerGuid, $now),
			));
		}
		return $tags;
	}

	/** Real re-index for an edited post — deletes every existing row for this post first, then re-extracts the current text, so a removed tag actually stops matching rather than lingering as a stale row. */
	public function replaceForPost($postGuid, $ownerGuid, $text) {
		$postGuid = intval($postGuid);
		parent::delete(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('post_guid', '=', $postGuid)),
		));
		return $this->extractAndStore($postGuid, $ownerGuid, $text);
	}

	/** Real post guids carrying this tag, newest first — the caller still owns real visibility filtering (block + circles), same as any other post read in this codebase. */
	public function postGuidsForTag($tag, $limit = 50) {
		$tag = mb_strtolower(trim((string) $tag), 'UTF-8');
		if ($tag === '') {
			return array();
		}
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('hashtag', '=', $tag)),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		if (!$rows) {
			return array();
		}
		$guids = array();
		foreach ($rows as $row) {
			$guids[] = intval($row->post_guid);
		}
		return $guids;
	}

	/**
	 * Real prefix/substring search over actually-used tags, grouped so
	 * a tag used on 50 posts appears once with a real post_count, not
	 * 50 times — same LIKE convention OssnDating::search() already
	 * uses for its own free-text search.
	 */
	public function searchTags($q, $limit = 20) {
		$q = mb_strtolower(trim((string) $q), 'UTF-8');
		if ($q === '') {
			return array();
		}
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'params'   => array('hashtag', 'COUNT(DISTINCT post_guid) as post_count'),
			'wheres'   => array(self::wheres('hashtag', 'LIKE', '%' . $q . '%')),
			'group_by' => 'hashtag',
			'order_by' => 'post_count DESC',
			'limit'    => intval($limit),
		), true);
		if (!$rows) {
			return array();
		}
		$out = array();
		foreach ($rows as $row) {
			$out[] = array('hashtag' => (string) $row->hashtag, 'post_count' => intval($row->post_count));
		}
		return $out;
	}

	/**
	 * Real trending — distinct real posts per tag over a bounded recent
	 * window, no invented score, same honesty rule as every other
	 * Trending rail in this codebase (Places/Events/Communities).
	 */
	public function trending($days = 7, $limit = 20) {
		$cutoff = time() - (intval($days) * 86400);
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'params'   => array('hashtag', 'COUNT(DISTINCT post_guid) as post_count'),
			'wheres'   => array(self::wheres('time_created', '>=', $cutoff)),
			'group_by' => 'hashtag',
			'order_by' => 'post_count DESC',
			'limit'    => intval($limit),
		), true);
		if (!$rows) {
			return array();
		}
		$out = array();
		foreach ($rows as $row) {
			$out[] = array('hashtag' => (string) $row->hashtag, 'post_count' => intval($row->post_count));
		}
		return $out;
	}
}
