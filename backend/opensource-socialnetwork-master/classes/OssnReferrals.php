<?php
/**
 * BERX WORLD MAX BUILD — Referrals. Real invite-code bookkeeping only
 * — no points logic lives here (that's auth.php's job, via the
 * already-real OssnPoints::award(), so referral rewards stay part of
 * the same one real points economy as every other reward, not a
 * parallel one). See upgrade/upgrades/1785171200.php for the full
 * mechanism this class activates.
 *
 * A referral code is NOT a stored secret — it's the referrer's own
 * real guid, base36-encoded for a shorter, friendlier string. Decoding
 * it back to a guid and checking that user actually exists is the
 * entire validation; there is nothing else to leak or guess, since a
 * guid is not sensitive (already exposed everywhere in this API).
 */
class OssnReferrals extends OssnDatabase {

	const TABLE = 'ossn_referrals';

	public static function codeFor($guid) {
		return base_convert((string) intval($guid), 10, 36);
	}

	/** @return int|false real, existing user guid, or false for a malformed/unknown code. */
	public static function resolveCode($code) {
		$code = trim((string) $code);
		if ($code === '' || !preg_match('/^[a-z0-9]+$/', $code)) {
			return false;
		}
		$guid = intval(base_convert($code, 36, 10));
		if (!$guid || !ossn_user_by_guid($guid)) {
			return false;
		}
		return $guid;
	}

	/** Real, one-referrer-per-user — the unique key on referred_guid makes a second call for the same user a real no-op, never a silent overwrite. */
	public function record($referredGuid, $referrerGuid) {
		$referredGuid = intval($referredGuid);
		$referrerGuid = intval($referrerGuid);
		if (!$referredGuid || !$referrerGuid || $referredGuid === $referrerGuid) {
			return false;
		}
		if ($this->getReferrer($referredGuid) !== false) {
			return false; // already recorded — real, not overwritten
		}
		return (bool) $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('referred_guid', 'referrer_guid', 'time_created'),
			'values' => array($referredGuid, $referrerGuid, time()),
		));
	}

	/** @return int|false the real referrer guid for this referred user, or false if none was ever recorded. */
	public function getReferrer($referredGuid) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('referred_guid', '=', intval($referredGuid))),
		));
		return $row ? intval($row->referrer_guid) : false;
	}

	public function referredCount($referrerGuid) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'params' => array('COUNT(*) AS c'),
			'wheres' => array(self::wheres('referrer_guid', '=', intval($referrerGuid))),
		));
		return $row ? intval($row->c) : 0;
	}
}
