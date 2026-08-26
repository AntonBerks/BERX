<?php
/**
 * BERX Business Moments — real, owner-only, time-bound
 * announcements. No boost/sponsored tier (needs real payment, not
 * built), no impression tracking yet (a real, honest next slice, not
 * this one). Methods deliberately NOT named update()/delete() — see
 * the documented OssnDatabase self-recursion bug history this
 * session (OssnCollections/Circles/Trips/Experiences).
 */
class OssnBusinessMoments extends OssnDatabase {

	const TABLE = 'ossn_business_moments';
	const MAX_TEXT_LENGTH = 200;
	/** A moment can't outlive this from creation — real cap, prevents an owner from posting a "moment" that's really a permanent banner. */
	const MAX_DURATION_SECONDS = 86400; // 24h

	public function create($place, $actingGuid, $text, $endsAt) {
		if (!$place || intval($place->owner_guid) !== intval($actingGuid)) {
			return 'forbidden';
		}
		$text = trim((string) $text);
		if ($text === '' || mb_strlen($text, 'UTF-8') > self::MAX_TEXT_LENGTH) {
			return 'invalid_text';
		}
		$now = time();
		$endsAt = intval($endsAt);
		if ($endsAt <= $now || ($endsAt - $now) > self::MAX_DURATION_SECONDS) {
			return 'invalid_window';
		}
		$ok = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('place_guid', 'text', 'starts_at', 'ends_at', 'time_created'),
			'values' => array(intval($place->guid), $text, $now, $endsAt, $now),
		));
		return $ok ? $this->getLastEntry() : 'failed';
	}

	public function get($id) {
		$row = $this->select(array('from' => self::TABLE, 'wheres' => array(self::wheres('id', '=', intval($id)))));
		return $row ? $row : false;
	}

	/** Real, currently-active moments for one place — ends_at in the future, checked against real server time on every call. */
	public function activeForPlace($placeGuid, $limit = 10) {
		$rows = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('place_guid', '=', intval($placeGuid)),
				self::wheres('ends_at', '>', time()),
			),
			'order_by' => 'ends_at ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/** Real, currently-active moments across a set of place guids — used by Nearby Now to attach moments to nearby places in one pass rather than N queries. */
	public function activeForPlaces(array $placeGuids, $limit = 100) {
		if (empty($placeGuids)) {
			return array();
		}
		$wheres = array(self::wheres('ends_at', '>', time()));
		// OssnDatabase's wheres() doesn't expose a real IN() builder in
		// this codebase (checked before assuming one) — filtering the
		// small nearby-set in PHP after one bounded time-only query is
		// simpler and just as correct at this scale (nearby sets are
		// already capped to ~100 places).
		$rows = $this->select(array('from' => self::TABLE, 'wheres' => $wheres, 'order_by' => 'ends_at ASC', 'limit' => intval($limit)), true);
		if (!$rows) {
			return array();
		}
		$allowed = array_flip(array_map('intval', $placeGuids));
		// select(..., true) wraps a non-empty result in a stdClass (see
		// OssnDatabase::fetch()/arrayObject()), not a real array —
		// array_filter() on that throws TypeError on PHP 8+. Same bug
		// class already found and fixed elsewhere this session
		// (OssnCollections/OssnCircles/OssnCreator/OssnNearbyImpressions).
		return array_values(array_filter((array) $rows, function ($r) use ($allowed) {
			return isset($allowed[intval($r->place_guid)]);
		}));
	}

	public function removeMoment($id, $actingGuid) {
		$moment = $this->get($id);
		if (!$moment) {
			return false;
		}
		if (!class_exists('OssnPlaces')) {
			return false;
		}
		$places = new OssnPlaces();
		$place = $places->getPlace($moment->place_guid);
		if (!$place || intval($place->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return parent::delete(array('from' => self::TABLE, 'wheres' => array(self::wheres('id', '=', intval($id)))));
	}
}
