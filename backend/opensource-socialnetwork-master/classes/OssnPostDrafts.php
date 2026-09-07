<?php
/**
 * BERX WORLD MAX BUILD — Post Drafts. Real save-for-later, own table
 * (see upgrade/upgrades/1785171300.php's own header for why not a
 * client-only cache). Strictly owner-only, no admin override needed
 * — a draft is never anyone else's content until it's actually
 * published as a real post.
 */
class OssnPostDrafts extends OssnDatabase {

	const TABLE = 'ossn_post_drafts';

	public function create($ownerGuid, $text, $visibility = 'public') {
		$ownerGuid = intval($ownerGuid);
		$text = trim((string) $text);
		if (!$ownerGuid || $text === '') {
			return false;
		}
		$now = time();
		$ok = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'text', 'visibility', 'time_created', 'time_updated'),
			'values' => array($ownerGuid, mb_substr($text, 0, 5000, 'UTF-8'), (string) $visibility, $now, $now),
		));
		return $ok ? $this->getLastEntry() : false;
	}

	public function get($id) {
		$id = intval($id);
		if (!$id) {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', $id)),
		));
		return $row ? $row : false;
	}

	public function listOwn($ownerGuid) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', intval($ownerGuid))),
			'order_by' => 'time_updated DESC',
		), true);
		return (array) $rows;
	}

	/** Named updateDraft(), not update() — same self-recursion bug class documented across OssnCircles/OssnCollections/OssnTrips (a bare same-named override calling $this->update() would recurse into itself instead of OssnDatabase's real method). */
	public function updateDraft($id, $actingGuid, $text, $visibility = null) {
		$draft = $this->get($id);
		if (!$draft || intval($draft->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		$text = trim((string) $text);
		if ($text === '') {
			return false;
		}
		return (bool) $this->update(array(
			'table'  => self::TABLE,
			'names'  => array('text', 'visibility', 'time_updated'),
			'values' => array(mb_substr($text, 0, 5000, 'UTF-8'), (string) ($visibility !== null ? $visibility : $draft->visibility), time()),
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}

	/** Named deleteDraft(), same naming discipline as updateDraft() above. */
	public function deleteDraft($id, $actingGuid) {
		$draft = $this->get($id);
		if (!$draft || intval($draft->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return (bool) $this->delete(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}
}
