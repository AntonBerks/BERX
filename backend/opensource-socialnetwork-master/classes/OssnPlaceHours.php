<?php
/**
 * BERX Structured opening hours — real intervals, real "open now".
 *
 * TIMEZONE LIMITATION, DISCLOSED NOT HIDDEN: no real per-place
 * timezone data exists in BERX yet, so isOpenAt() compares against
 * the SERVER's local time. For a single-region deployment this is
 * correct; for a genuinely global one it needs a real timezone
 * column per place. Documented rather than silently wrong.
 *
 * Method naming avoids update()/delete() — see the documented
 * OssnDatabase self-recursion bug history this session.
 */
class OssnPlaceHours extends OssnDatabase {

	const TABLE = 'ossn_place_hours';

	public static function isValidWeekday($d) {
		return is_numeric($d) && intval($d) >= 0 && intval($d) <= 6; // 0=Sunday, matching PHP date('w')
	}

	public static function isValidMinute($m) {
		return is_numeric($m) && intval($m) >= 0 && intval($m) <= 1440;
	}

	public function forPlace($placeGuid) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('place_guid', '=', intval($placeGuid))),
			'order_by' => 'weekday ASC, open_minute ASC',
		), true);
		return $rows ? $rows : array();
	}

	/**
	 * Replaces a place's whole schedule in one call — owner-only.
	 * $intervals: array of ['weekday'=>0-6,'open'=>minutes,'close'=>minutes].
	 * Replace-all (not incremental) because a schedule is edited as a
	 * whole in the UI; partial updates would leave stale rows behind.
	 */
	public function replaceSchedule($place, $actingGuid, array $intervals) {
		if (!$place || intval($place->owner_guid) !== intval($actingGuid)) {
			return 'forbidden';
		}
		foreach ($intervals as $i) {
			if (!isset($i['weekday'], $i['open'], $i['close'])) {
				return 'invalid';
			}
			if (!self::isValidWeekday($i['weekday']) || !self::isValidMinute($i['open']) || !self::isValidMinute($i['close'])) {
				return 'invalid';
			}
			if (intval($i['close']) <= intval($i['open'])) {
				// Past-midnight closing (e.g. 22:00-02:00) would need a
				// real cross-day model — rejected rather than silently
				// stored as a nonsense interval.
				return 'invalid_interval';
			}
		}
		parent::delete(array('from' => self::TABLE, 'wheres' => array(self::wheres('place_guid', '=', intval($place->guid)))));
		$now = time();
		foreach ($intervals as $i) {
			$this->insert(array(
				'into'   => self::TABLE,
				'names'  => array('place_guid', 'weekday', 'open_minute', 'close_minute', 'time_created'),
				'values' => array(intval($place->guid), intval($i['weekday']), intval($i['open']), intval($i['close']), $now),
			));
		}
		return true;
	}

	/**
	 * Real open/closed check. Returns null (not false) when the place
	 * has NO structured hours at all — "unknown" and "closed" are
	 * genuinely different, and callers must not show "closed" for a
	 * place that simply hasn't entered its hours.
	 */
	public function isOpenAt($placeGuid, $timestamp = null) {
		$rows = $this->forPlace($placeGuid);
		if (empty($rows)) {
			return null;
		}
		$ts = $timestamp === null ? time() : intval($timestamp);
		$weekday = intval(date('w', $ts));
		$minute  = intval(date('G', $ts)) * 60 + intval(date('i', $ts));
		foreach ($rows as $r) {
			if (intval($r->weekday) === $weekday && $minute >= intval($r->open_minute) && $minute < intval($r->close_minute)) {
				return true;
			}
		}
		return false;
	}
}
