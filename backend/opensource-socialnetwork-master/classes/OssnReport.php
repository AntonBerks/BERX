<?php
/**
 * BERX Report — content/user moderation queue. Schema already existed
 * and was already migrated (upgrade/upgrades/1785168200.php, which
 * also already registers 'OssnReport' in ossn_components — confirming
 * this component genuinely ran before being lost to the .gitignore bug
 * fixed in commit f915ff4).
 *
 * No method here is named update()/delete() — same self-recursion
 * class of bug documented across the other BERX classes this session;
 * avoided by naming submit()/setStatus() instead.
 */
class OssnReport extends OssnDatabase {

	const TABLE = 'ossn_reports';

	const STATUS_PENDING  = 'pending';
	const STATUS_REVIEWED = 'reviewed';
	const STATUS_DISMISSED = 'dismissed';

	const VALID_TARGET_TYPES = array('dating_profile', 'post', 'comment', 'user', 'group');
	const VALID_REASONS = array('spam', 'fake_profile', 'harassment', 'inappropriate_content', 'underage', 'other');

	public static function isValidTargetType($type) {
		return in_array((string) $type, self::VALID_TARGET_TYPES, true);
	}

	public static function isValidReason($reason) {
		return in_array((string) $reason, self::VALID_REASONS, true);
	}

	public function submit($reporterGuid, $targetType, $targetGuid, $reason, $note = '') {
		$reporterGuid = intval($reporterGuid);
		$targetGuid   = intval($targetGuid);
		if (!$reporterGuid || !$targetGuid || !self::isValidTargetType($targetType) || !self::isValidReason($reason)) {
			return false;
		}
		$ok = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('reporter_guid', 'target_type', 'target_guid', 'reason', 'note', 'status', 'time_created'),
			'values' => array($reporterGuid, (string) $targetType, $targetGuid, (string) $reason, mb_substr((string) $note, 0, 1000, 'UTF-8'), self::STATUS_PENDING, time()),
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

	/** Admin only — enforced by the caller (report.php), not re-checked here so this class stays a pure data layer, same convention as OssnBusiness::pendingClaims(). */
	public function listPending($limit = 100) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('status', '=', self::STATUS_PENDING)),
			'order_by' => 'time_created ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function setStatus($id, $status, $adminGuid = null) {
		if (!in_array($status, array(self::STATUS_REVIEWED, self::STATUS_DISMISSED), true)) {
			return false;
		}
		return parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('status', 'time_reviewed'),
			'values' => array($status, time()),
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}
}
