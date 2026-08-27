<?php
/**
 * BERX Dating / Match. Schema already existed and was already
 * migrated (installation/sql/opensource-socialnetwork.sql —
 * ossn_dating_profiles/interests/passes/photos/photo_access) —
 * confirmed real, pre-existing, well-commented schema before writing
 * any of this class, not invented alongside it.
 *
 * A "match" is not its own row: it is the real, live fact that BOTH
 * directions of ossn_dating_interests exist for a pair — computed on
 * read, never cached, so it can never drift from the truth.
 *
 * No method here is named update()/delete() — same self-recursion
 * class of bug documented across the other BERX classes this session.
 *
 * MAX BUILD — "profile boost" is now real: a prior session already
 * added the boosted_until column via upgrade/upgrades/1785168700.php
 * (idempotent, confirmed by reading it) but boostProfile() itself,
 * discover()'s boosted-first ordering, and the /dating/boost route
 * were never actually written — this comment previously claimed the
 * column didn't exist, which was stale/false. boostProfile() spends
 * real points via OssnPoints::spend('dating_boost', 50 — the same
 * SPEND_PRICES entry points.php's own /spend route already
 * authorizes), never a client-claimed spend.
 */
class OssnDating extends OssnDatabase {

	const PROFILES_TABLE     = 'ossn_dating_profiles';
	const INTERESTS_TABLE    = 'ossn_dating_interests';
	const PASSES_TABLE       = 'ossn_dating_passes';
	const PHOTOS_TABLE       = 'ossn_dating_photos';
	const PHOTO_ACCESS_TABLE = 'ossn_dating_photo_access';

	const VALID_PHOTO_ACCESS_POLICIES = array('nobody', 'mutual', 'anyone');

	/* ---------------- Profile ---------------- */

	public function getProfile($guid) {
		$guid = intval($guid);
		if (!$guid) {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::PROFILES_TABLE,
			'wheres' => array(self::wheres('guid', '=', $guid)),
		));
		return $row ? $row : false;
	}

	public function hasProfile($guid) {
		return (bool) $this->getProfile($guid);
	}

	/** Create-or-update — the only dating endpoint callable before a profile exists. */
	public function saveProfile($guid, array $fields) {
		$guid = intval($guid);
		if (!$guid || !isset($fields['pseudonym']) || trim((string) $fields['pseudonym']) === '') {
			return false;
		}
		$pseudonym = mb_substr(trim((string) $fields['pseudonym']), 0, 100, 'UTF-8');
		$existing = $this->getProfile($guid);
		$now = time();
		if ($existing) {
			$names = array('pseudonym');
			$values = array($pseudonym);
			foreach (array('age', 'city', 'goal', 'bio', 'interests') as $f) {
				if (isset($fields[$f])) {
					$names[] = $f;
					$values[] = $f === 'age' ? intval($fields[$f]) : (string) $fields[$f];
				}
			}
			$names[] = 'time_updated';
			$values[] = $now;
			return parent::update(array(
				'table'  => self::PROFILES_TABLE,
				'names'  => $names,
				'values' => $values,
				'wheres' => array(self::wheres('guid', '=', $guid)),
			));
		}
		return $this->insert(array(
			'into'   => self::PROFILES_TABLE,
			'names'  => array('guid', 'pseudonym', 'age', 'city', 'goal', 'bio', 'interests', 'time_created', 'time_updated'),
			'values' => array(
				$guid,
				$pseudonym,
				isset($fields['age']) ? intval($fields['age']) : null,
				isset($fields['city']) ? (string) $fields['city'] : null,
				isset($fields['goal']) ? (string) $fields['goal'] : null,
				isset($fields['bio']) ? (string) $fields['bio'] : null,
				isset($fields['interests']) ? (string) $fields['interests'] : null,
				$now,
				$now,
			),
		));
	}

	public function updateLocation($guid, array $fields) {
		$names = array();
		$values = array();
		if (isset($fields['latitude'])) {
			$names[] = 'latitude';
			$values[] = $fields['latitude'] === null ? null : floatval($fields['latitude']);
		}
		if (isset($fields['longitude'])) {
			$names[] = 'longitude';
			$values[] = $fields['longitude'] === null ? null : floatval($fields['longitude']);
		}
		if (isset($fields['hide_location'])) {
			$names[] = 'hide_location';
			$values[] = $fields['hide_location'] ? 1 : 0;
		}
		if (empty($names)) {
			return false;
		}
		$names[] = 'time_updated';
		$values[] = time();
		return parent::update(array(
			'table'  => self::PROFILES_TABLE,
			'names'  => $names,
			'values' => $values,
			'wheres' => array(self::wheres('guid', '=', intval($guid))),
		));
	}

	public function updatePrivacy($guid, array $fields) {
		$names = array();
		$values = array();
		foreach (array('hide_profile', 'hide_online', 'hide_age', 'hide_city', 'invisible_mode') as $f) {
			if (isset($fields[$f])) {
				$names[] = $f;
				$values[] = $fields[$f] ? 1 : 0;
			}
		}
		if (empty($names)) {
			return false;
		}
		$names[] = 'time_updated';
		$values[] = time();
		return parent::update(array(
			'table'  => self::PROFILES_TABLE,
			'names'  => $names,
			'values' => $values,
			'wheres' => array(self::wheres('guid', '=', intval($guid))),
		));
	}

	/* ---------------- Discover / search ---------------- */

	private function excludedGuids($viewerGuid) {
		$viewerGuid = intval($viewerGuid);
		$excluded = array($viewerGuid);
		$interested = $this->select(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', $viewerGuid)),
		), true);
		foreach ((array) $interested as $row) {
			$excluded[] = intval($row->to_guid);
		}
		$passed = $this->select(array(
			'from'   => self::PASSES_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', $viewerGuid)),
		), true);
		foreach ((array) $passed as $row) {
			$excluded[] = intval($row->to_guid);
		}
		return array_unique($excluded);
	}

	/**
	 * OssnBlock::isBlocked($usera, $userb) reads ->guid off each
	 * argument (confirmed by reading its real body) — it does not
	 * accept raw guids. Minimal stdClass stand-ins are enough; the
	 * method never reads anything else off either argument.
	 */
	private function isBlockedPair($aGuid, $bGuid) {
		$a = new stdClass();
		$a->guid = intval($aGuid);
		$b = new stdClass();
		$b->guid = intval($bGuid);
		return (bool) OssnBlock::isBlocked($a, $b);
	}

	/**
	 * Real candidate list: excludes self, anyone already liked/passed,
	 * hidden/invisible profiles, and (both directions) blocked users.
	 * Ordered by real recent activity (time_updated DESC) — no
	 * distance/compatibility scoring exists, not faked as one.
	 */
	public function discover($viewerGuid, $limit = 20, $offset = 0) {
		$viewerGuid = intval($viewerGuid);
		$excluded = $this->excludedGuids($viewerGuid);
		$wheres = array(
			self::wheres('hide_profile', '=', 0),
			self::wheres('invisible_mode', '=', 0),
			self::wheres('guid', 'NOT IN', $excluded),
		);
		// Real boosted-first ordering: a still-active boost (boosted_until
		// in the future) sorts ahead of everything else, ties broken by
		// the existing recency order — the actual point of spending real
		// points on a boost, not decorative.
		$rows = $this->select(array(
			'from'     => self::PROFILES_TABLE,
			'wheres'   => $wheres,
			'order_by' => '(boosted_until > ' . time() . ') DESC, time_updated DESC',
			'limit'    => intval($limit),
			'offset'   => intval($offset) > 0 ? intval($offset) : 0,
		), true);
		$out = array();
		foreach ((array) $rows as $row) {
			if ($this->isBlockedPair($viewerGuid, $row->guid)) {
				continue;
			}
			$out[] = $row;
		}
		return $out;
	}

	/**
	 * @return array {status: 'ok', boosted_until: int} on success, or
	 *         {status: 'no_profile'|'insufficient_balance'|'failed'}
	 */
	public function boostProfile($guid) {
		$guid = intval($guid);
		if (!$this->hasProfile($guid)) {
			return array('status' => 'no_profile');
		}
		$result = (new OssnPoints())->spend($guid, 'dating_boost', OssnPoints::SPEND_PRICES['dating_boost']);
		if (!is_int($result)) {
			return array('status' => (string) $result);
		}
		// 30 minutes — the real, already-shipped UI copy on PointsScreen
		// ("Показ выше в Discover на 30 минут") promised this exact
		// duration before the backend existed to honor it.
		$boostedUntil = time() + (30 * 60);
		$ok = parent::update(array(
			'table'  => self::PROFILES_TABLE,
			'names'  => array('boosted_until'),
			'values' => array($boostedUntil),
			'wheres' => array(self::wheres('guid', '=', $guid)),
		));
		if (!$ok) {
			return array('status' => 'failed');
		}
		return array('status' => 'ok', 'boosted_until' => $boostedUntil);
	}

	public function search($viewerGuid, $q, $limit = 20, $offset = 0) {
		$excluded = $this->excludedGuids($viewerGuid);
		$rows = $this->select(array(
			'from'     => self::PROFILES_TABLE,
			'wheres'   => array(
				self::wheres('hide_profile', '=', 0),
				self::wheres('guid', 'NOT IN', $excluded),
				self::wheres('pseudonym', 'LIKE', '%' . $q . '%'),
			),
			'order_by' => 'time_updated DESC',
			'limit'    => intval($limit),
			'offset'   => intval($offset) > 0 ? intval($offset) : 0,
		), true);
		return (array) $rows;
	}

	/* ---------------- Like / pass / undo / matches ---------------- */

	public function isMutual($aGuid, $bGuid) {
		$ab = $this->select(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', intval($aGuid)), self::wheres('to_guid', '=', intval($bGuid))),
		));
		$ba = $this->select(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', intval($bGuid)), self::wheres('to_guid', '=', intval($aGuid))),
		));
		return (bool) ($ab && $ba);
	}

	public function like($fromGuid, $toGuid) {
		$fromGuid = intval($fromGuid);
		$toGuid   = intval($toGuid);
		if (!$fromGuid || !$toGuid || $fromGuid === $toGuid) {
			return array('status' => 'invalid', 'mutual' => false);
		}
		$existing = $this->select(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', $fromGuid), self::wheres('to_guid', '=', $toGuid)),
		));
		if (!$existing) {
			$this->insert(array(
				'into'   => self::INTERESTS_TABLE,
				'names'  => array('from_guid', 'to_guid', 'time_created'),
				'values' => array($fromGuid, $toGuid, time()),
			));
		}
		return array('status' => 'ok', 'mutual' => $this->isMutual($fromGuid, $toGuid));
	}

	public function pass($fromGuid, $toGuid) {
		$fromGuid = intval($fromGuid);
		$toGuid   = intval($toGuid);
		if (!$fromGuid || !$toGuid || $fromGuid === $toGuid) {
			return false;
		}
		$existing = $this->select(array(
			'from'   => self::PASSES_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', $fromGuid), self::wheres('to_guid', '=', $toGuid)),
		));
		if ($existing) {
			return true;
		}
		return (bool) $this->insert(array(
			'into'   => self::PASSES_TABLE,
			'names'  => array('from_guid', 'to_guid', 'time_created'),
			'values' => array($fromGuid, $toGuid, time()),
		));
	}

	/** Undoes the caller's own single most recent pass. */
	public function undoLastPass($guid) {
		$guid = intval($guid);
		$row = $this->select(array(
			'from'     => self::PASSES_TABLE,
			'wheres'   => array(self::wheres('from_guid', '=', $guid)),
			'order_by' => 'id DESC',
		));
		if (!$row) {
			return null;
		}
		parent::delete(array(
			'from'   => self::PASSES_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($row->id))),
		));
		return intval($row->to_guid);
	}

	/** Real mutual matches — computed live, both directions checked, never cached. */
	public function matches($guid) {
		$guid = intval($guid);
		$mine = $this->select(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', $guid)),
		), true);
		$out = array();
		foreach ((array) $mine as $row) {
			if ($this->isMutual($guid, $row->to_guid)) {
				$out[] = intval($row->to_guid);
			}
		}
		return $out;
	}

	public function unmatch($guid, $otherGuid) {
		if (!$this->isMutual($guid, $otherGuid)) {
			return false;
		}
		parent::delete(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', intval($guid)), self::wheres('to_guid', '=', intval($otherGuid))),
		));
		parent::delete(array(
			'from'   => self::INTERESTS_TABLE,
			'wheres' => array(self::wheres('from_guid', '=', intval($otherGuid)), self::wheres('to_guid', '=', intval($guid))),
		));
		return true;
	}

	/* ---------------- Photos ---------------- */

	public function ownPhotos($guid) {
		$rows = $this->select(array(
			'from'     => self::PHOTOS_TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', intval($guid))),
			'order_by' => 'time_created DESC',
		), true);
		return (array) $rows;
	}

	public function getPhoto($id) {
		$row = $this->select(array(
			'from'   => self::PHOTOS_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function deletePhoto($id, $actingGuid) {
		$photo = $this->getPhoto($id);
		if (!$photo || intval($photo->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return (bool) parent::delete(array(
			'from'   => self::PHOTOS_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}

	/* ---------------- Private photo access ---------------- */

	public function requestPhotoAccess($photoId, $requesterGuid) {
		$photo = $this->getPhoto($photoId);
		if (!$photo || intval($photo->owner_guid) === intval($requesterGuid)) {
			return false;
		}
		$existing = $this->select(array(
			'from'   => self::PHOTO_ACCESS_TABLE,
			'wheres' => array(self::wheres('photo_id', '=', intval($photoId)), self::wheres('requester_guid', '=', intval($requesterGuid))),
		));
		if ($existing) {
			return true;
		}
		return (bool) $this->insert(array(
			'into'   => self::PHOTO_ACCESS_TABLE,
			'names'  => array('photo_id', 'owner_guid', 'requester_guid', 'status', 'time_created'),
			'values' => array(intval($photoId), intval($photo->owner_guid), intval($requesterGuid), 'pending', time()),
		));
	}

	/** Only the real photo owner may grant/deny — never the requester. */
	public function respondPhotoAccess($accessId, $actingGuid, $grant) {
		$row = $this->select(array(
			'from'   => self::PHOTO_ACCESS_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($accessId))),
		));
		if (!$row || intval($row->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return (bool) parent::update(array(
			'table'  => self::PHOTO_ACCESS_TABLE,
			'names'  => array('status', 'time_responded'),
			'values' => array($grant ? 'granted' : 'denied', time()),
			'wheres' => array(self::wheres('id', '=', intval($accessId))),
		));
	}

	public function revokeAccess($accessId, $actingGuid) {
		$row = $this->select(array(
			'from'   => self::PHOTO_ACCESS_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($accessId))),
		));
		if (!$row || intval($row->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		return (bool) parent::update(array(
			'table'  => self::PHOTO_ACCESS_TABLE,
			'names'  => array('status', 'time_responded'),
			'values' => array('revoked', time()),
			'wheres' => array(self::wheres('id', '=', intval($accessId))),
		));
	}

	public function listIncomingRequests($ownerGuid) {
		$rows = $this->select(array(
			'from'     => self::PHOTO_ACCESS_TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', intval($ownerGuid)), self::wheres('status', '=', 'pending')),
			'order_by' => 'time_created DESC',
		), true);
		return (array) $rows;
	}

	public function canViewPhoto($photo, $viewerGuid) {
		if (!$photo) {
			return false;
		}
		if (intval($photo->owner_guid) === intval($viewerGuid)) {
			return true;
		}
		$access = $this->select(array(
			'from'   => self::PHOTO_ACCESS_TABLE,
			'wheres' => array(
				self::wheres('photo_id', '=', intval($photo->id)),
				self::wheres('requester_guid', '=', intval($viewerGuid)),
				self::wheres('status', '=', 'granted'),
			),
		));
		return (bool) $access;
	}
}
