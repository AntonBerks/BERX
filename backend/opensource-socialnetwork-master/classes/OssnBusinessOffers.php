<?php
/**
 * BERX WORLD MAX BUILD — Business Offers. Real loyalty/promotion
 * primitive, deliberately not a payment/coupon system (no real
 * payment infrastructure exists here — see this class's own migration
 * comment, upgrade/upgrades/1785170500.php, for the full reasoning).
 * An offer is redeemed in two real steps: a user CLAIMS it (creates a
 * real, unique-per-user row — "I intend to use this"), then the
 * business marks it FULFILLED when the customer actually shows up
 * (same real in-person verification model Nearby Now's own real
 * check-in system uses, not a fake automatic success).
 *
 * No self-recursion risk: this class deliberately never defines
 * update()/delete() (the exact bug class documented in
 * BERX_PROGRESS.md across OssnCollections/OssnCircles/OssnTrips) —
 * every mutating method has its own distinct name.
 *
 * MAX BUILD — Trust & Safety: claim() is rate-limited (10/60s per
 * caller) via the same real relation-row sliding-window pattern
 * OssnDating::isActionRateLimited() already proved, closing a real
 * "offer griefing" DoS (rapid-fire claim() exhausting a capped
 * offer's max_redemptions before genuine customers get a chance) —
 * distinct from the double-claim the unique index already blocks.
 */
class OssnBusinessOffers extends OssnDatabase {

	const TABLE = 'ossn_business_offers';
	const REDEMPTIONS_TABLE = 'ossn_business_offer_redemptions';

	/** Owner/team/admin only — reuses OssnBusiness::canManage() (real, fixed to a session-free admin check earlier this session), never a duplicate permission check. */
	public function createOffer($place, $actingGuid, array $fields) {
		if (!class_exists('OssnBusiness') || !(new OssnBusiness())->canManage($place, $actingGuid)) {
			return 'forbidden';
		}
		$title = trim((string) ($fields['title'] ?? ''));
		if ($title === '' || mb_strlen($title, 'UTF-8') > 120) {
			return 'invalid_title';
		}
		$description = isset($fields['description']) ? mb_substr((string) $fields['description'], 0, 1000, 'UTF-8') : '';
		$maxRedemptions = isset($fields['max_redemptions']) && $fields['max_redemptions'] !== '' ? max(1, intval($fields['max_redemptions'])) : null;
		$endsAt = isset($fields['ends_at']) && $fields['ends_at'] !== '' ? intval($fields['ends_at']) : null;

		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('place_guid', 'title', 'description', 'max_redemptions', 'redemptions_count', 'ends_at', 'active', 'time_created'),
			'values' => array(intval($place->guid), $title, $description !== '' ? $description : null, $maxRedemptions, 0, $endsAt, 1, time()),
		));
		return $id ? $this->getLastEntry() : 'failed';
	}

	public function getOffer($id) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function isActive($offer) {
		if (!$offer || !intval($offer->active)) {
			return false;
		}
		if ($offer->ends_at !== null && intval($offer->ends_at) < time()) {
			return false;
		}
		if ($offer->max_redemptions !== null && intval($offer->redemptions_count) >= intval($offer->max_redemptions)) {
			return false;
		}
		return true;
	}

	/** Real, live query — every result is genuinely still claimable right now, never a stale cached flag. */
	public function listActiveForPlace($placeGuid, $limit = 20) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('place_guid', '=', intval($placeGuid)),
				self::wheres('active', '=', 1),
			),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		$out = array();
		if ($rows) {
			foreach ($rows as $row) {
				if ($this->isActive($row)) {
					$out[] = $row;
				}
			}
		}
		return $out;
	}

	/** Owner/team/admin only — every offer for a place, including inactive/expired/exhausted ones, for the real business dashboard. */
	public function listAllForPlace($place, $actingGuid, $limit = 50) {
		if (!class_exists('OssnBusiness') || !(new OssnBusiness())->canManage($place, $actingGuid)) {
			return false;
		}
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('place_guid', '=', intval($place->guid))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function getRedemption($offerId, $userGuid) {
		$row = $this->select(array(
			'from'   => self::REDEMPTIONS_TABLE,
			'wheres' => array(
				self::wheres('offer_id', '=', intval($offerId)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
		return $row ? $row : false;
	}

	/**
	 * Real abuse guard — without this, a script could rapid-fire claim()
	 * across many different capped offers and exhaust a business's real
	 * max_redemptions before genuine customers get a chance (a real
	 * "offer griefing" DoS, distinct from the double-claim the unique
	 * index already blocks). Same real sliding-window pattern already
	 * proven by OssnDating::isActionRateLimited() — a real relation row
	 * per attempt, no new table.
	 */
	const ACTION_RELATION = 'offer:claim:action';
	const ACTION_WINDOW_SECONDS = 60;
	const ACTION_MAX = 10;

	private function isClaimRateLimited($guid) {
		$since = time() - self::ACTION_WINDOW_SECONDS;
		$count = intval(ossn_get_relationships(array(
			'from'   => intval($guid),
			'type'   => self::ACTION_RELATION,
			'count'  => true,
			'wheres' => "r.time >= {$since}",
		)));
		return $count >= self::ACTION_MAX;
	}

	/** Recorded for EVERY real claim attempt, success or no-op — same real intent as OssnDating::recordAction(). */
	private function recordClaimAttempt($guid, $offerId) {
		ossn_add_relation(intval($guid), intval($offerId), self::ACTION_RELATION);
	}

	/**
	 * Real claim — the unique index on (offer_id, user_guid) is the
	 * actual guarantee against a double-claim, not just this
	 * in-PHP check (a real race between two near-simultaneous
	 * requests still can't double-insert).
	 */
	public function claim($offerId, $userGuid) {
		if ($this->isClaimRateLimited($userGuid)) {
			return 'rate_limited';
		}
		$offer = $this->getOffer($offerId);
		if (!$offer || !$this->isActive($offer)) {
			$this->recordClaimAttempt($userGuid, $offerId);
			return 'not_available';
		}
		if ($this->getRedemption($offerId, $userGuid)) {
			$this->recordClaimAttempt($userGuid, $offerId);
			return 'already_claimed';
		}
		$this->recordClaimAttempt($userGuid, $offerId);
		$id = $this->insert(array(
			'into'   => self::REDEMPTIONS_TABLE,
			'names'  => array('offer_id', 'user_guid', 'fulfilled', 'time_created'),
			'values' => array(intval($offerId), intval($userGuid), 0, time()),
		));
		if (!$id) {
			return 'failed';
		}
		parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('redemptions_count'),
			'values' => array(intval($offer->redemptions_count) + 1),
			'wheres' => array(self::wheres('id', '=', intval($offerId))),
		));
		return 'ok';
	}

	/** Real in-person fulfillment — owner/team/admin only, marks a real claim used. Never auto-fulfilled: a claim alone doesn't prove the customer showed up. */
	public function fulfill($offerId, $userGuid, $place, $actingGuid) {
		if (!class_exists('OssnBusiness') || !(new OssnBusiness())->canManage($place, $actingGuid)) {
			return 'forbidden';
		}
		$redemption = $this->getRedemption($offerId, $userGuid);
		if (!$redemption) {
			return 'not_claimed';
		}
		if (intval($redemption->fulfilled)) {
			return 'already_fulfilled';
		}
		$ok = parent::update(array(
			'table'  => self::REDEMPTIONS_TABLE,
			'names'  => array('fulfilled', 'time_fulfilled'),
			'values' => array(1, time()),
			'wheres' => array(
				self::wheres('offer_id', '=', intval($offerId)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
		return $ok ? 'ok' : 'failed';
	}

	/** Owner/team/admin only. */
	public function deactivateOffer($offerId, $place, $actingGuid) {
		if (!class_exists('OssnBusiness') || !(new OssnBusiness())->canManage($place, $actingGuid)) {
			return false;
		}
		return (bool) parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('active'),
			'values' => array(0),
			'wheres' => array(self::wheres('id', '=', intval($offerId))),
		));
	}

	/** Real claimant list for the owner dashboard — who claimed, who actually showed up. */
	public function redemptionsForOffer($offerId, $place, $actingGuid, $limit = 100) {
		if (!class_exists('OssnBusiness') || !(new OssnBusiness())->canManage($place, $actingGuid)) {
			return false;
		}
		$rows = $this->select(array(
			'from'     => self::REDEMPTIONS_TABLE,
			'wheres'   => array(self::wheres('offer_id', '=', intval($offerId))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}
}
