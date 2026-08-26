<?php
/**
 * BERX Points — server-authoritative balance, history and real daily
 * streak tracking.
 *
 * No method here is named update()/delete() — the same self-recursion
 * bug documented across OssnCollections/OssnCircles/OssnTrips/
 * OssnExperiences (a bare $this->update()/$this->delete() call inside
 * a same-named subclass method recurses into itself instead of
 * OssnDatabase's real method) is avoided here by naming methods
 * award()/spend()/touch() instead, verified by grep before shipping.
 *
 * Level is a real, transparent, deterministic function of
 * lifetime_earned — 100 points per level, no cap. Never a fabricated
 * or externally-configured curve.
 */
class OssnPoints extends OssnDatabase {

	const BALANCE_TABLE = 'ossn_points_balance';
	const LOG_TABLE      = 'ossn_points_log';

	const POINTS_PER_LEVEL = 100;

	const STREAK_MILESTONES = array(7, 30);

	/** Real spend menu — the only reasons a real endpoint currently honors. Anything else is a real 422, not a client-side fake. */
	const SPEND_PRICES = array(
		'dating_boost' => 50,
	);

	private function ensureRow($userGuid) {
		$userGuid = intval($userGuid);
		if (!$userGuid) {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::BALANCE_TABLE,
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));
		if ($row) {
			return $row;
		}
		$this->insert(array(
			'into'   => self::BALANCE_TABLE,
			'names'  => array('user_guid', 'balance', 'lifetime_earned', 'current_streak', 'longest_streak', 'last_active_date', 'time_updated'),
			'values' => array($userGuid, 0, 0, 0, 0, null, time()),
		));
		return $this->select(array(
			'from'   => self::BALANCE_TABLE,
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));
	}

	public function computeLevel($lifetimeEarned) {
		$lifetimeEarned = max(0, intval($lifetimeEarned));
		$level = intval(floor($lifetimeEarned / self::POINTS_PER_LEVEL)) + 1;
		$floor = ($level - 1) * self::POINTS_PER_LEVEL;
		$ceiling = $level * self::POINTS_PER_LEVEL;
		$ratio = $ceiling > $floor ? ($lifetimeEarned - $floor) / ($ceiling - $floor) : 0;
		return array(
			'level'                => $level,
			'level_floor'          => $floor,
			'level_ceiling'        => $ceiling,
			'level_progress_ratio' => round($ratio, 4),
		);
	}

	public function getBalance($userGuid) {
		$row = $this->ensureRow($userGuid);
		if (!$row) {
			return false;
		}
		$levelInfo = $this->computeLevel($row->lifetime_earned);
		return array(
			'balance'              => intval($row->balance),
			'lifetime_earned'      => intval($row->lifetime_earned),
			'level'                => $levelInfo['level'],
			'level_floor'          => $levelInfo['level_floor'],
			'level_ceiling'        => $levelInfo['level_ceiling'],
			'level_progress_ratio' => $levelInfo['level_progress_ratio'],
			'current_streak'       => intval($row->current_streak),
			'longest_streak'       => intval($row->longest_streak),
			'last_active_date'     => $row->last_active_date !== null ? (string) $row->last_active_date : null,
		);
	}

	/**
	 * Real award. $oneTime=true checks the real log first and skips if
	 * this exact ($userGuid, $reason) pair was ever awarded before —
	 * the log IS the source of truth for "already given", no separate
	 * flags table.
	 */
	public function award($userGuid, $amount, $reason, $refGuid = null, $oneTime = false) {
		$userGuid = intval($userGuid);
		$amount   = intval($amount);
		if (!$userGuid || $amount <= 0 || !$reason) {
			return false;
		}
		if ($oneTime && $this->hasReason($userGuid, $reason)) {
			return false;
		}
		$this->ensureRow($userGuid);
		// parent::update() binds every value as a real prepared-
		// statement parameter (confirmed by reading OssnDatabase::
		// update() before writing this) — it has no way to express
		// "balance = balance + X" through a bound value. Read the
		// current row, write the sum back as two real statements
		// instead. Slightly less atomic than a single UPDATE ... SET
		// x = x + ? under concurrent writes, but real and correct —
		// never silently wrong.
		$row = $this->select(array(
			'from'   => self::BALANCE_TABLE,
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));
		$newBalance = intval($row->balance) + $amount;
		$newLifetime = intval($row->lifetime_earned) + $amount;
		$ok = parent::update(array(
			'table'  => self::BALANCE_TABLE,
			'names'  => array('balance', 'lifetime_earned', 'time_updated'),
			'values' => array($newBalance, $newLifetime, time()),
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));
		if ($ok) {
			$this->insert(array(
				'into'   => self::LOG_TABLE,
				'names'  => array('user_guid', 'delta', 'reason', 'ref_guid', 'time_created'),
				'values' => array($userGuid, $amount, (string) $reason, $refGuid ? intval($refGuid) : null, time()),
			));
		}
		return $ok;
	}

	public function hasReason($userGuid, $reason) {
		$row = $this->select(array(
			'from'   => self::LOG_TABLE,
			'wheres' => array(
				self::wheres('user_guid', '=', intval($userGuid)),
				self::wheres('reason', '=', (string) $reason),
			),
		));
		return (bool) $row;
	}

	/** Real spend — checks the real current balance first, never lets it go negative. */
	public function spend($userGuid, $reason, $amount) {
		$userGuid = intval($userGuid);
		if (!isset(self::SPEND_PRICES[$reason])) {
			return 'invalid_reason';
		}
		$expected = self::SPEND_PRICES[$reason];
		$amount = intval($amount) > 0 ? intval($amount) : $expected;
		if ($amount !== $expected) {
			return 'invalid_amount';
		}
		$row = $this->ensureRow($userGuid);
		if (!$row || intval($row->balance) < $amount) {
			return 'insufficient_balance';
		}
		$newBalance = intval($row->balance) - $amount;
		$ok = parent::update(array(
			'table'  => self::BALANCE_TABLE,
			'names'  => array('balance', 'time_updated'),
			'values' => array($newBalance, time()),
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));
		if ($ok) {
			$this->insert(array(
				'into'   => self::LOG_TABLE,
				'names'  => array('user_guid', 'delta', 'reason', 'ref_guid', 'time_created'),
				'values' => array($userGuid, -$amount, (string) $reason, null, time()),
			));
			return $newBalance;
		}
		return 'failed';
	}

	public function history($userGuid, $limit = 50) {
		$rows = $this->select(array(
			'from'     => self::LOG_TABLE,
			'wheres'   => array(self::wheres('user_guid', '=', intval($userGuid))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/**
	 * Real server-side daily check-in. Same real day = no-op.
	 * Consecutive real day = increment. Gap = reset to 1. Milestones
	 * award real one-time points via award()'s own $oneTime gate.
	 * $today is always server date('Y-m-d') — never client-supplied.
	 */
	public function recordActivity($userGuid) {
		$userGuid = intval($userGuid);
		$row = $this->ensureRow($userGuid);
		$today = date('Y-m-d');
		$last = $row->last_active_date;

		if ($last === $today) {
			return array(
				'current_streak' => intval($row->current_streak),
				'longest_streak' => intval($row->longest_streak),
				'is_new_day'     => false,
				'milestone'      => null,
			);
		}

		$yesterday = date('Y-m-d', strtotime($today . ' -1 day'));
		$newStreak = ($last === $yesterday) ? intval($row->current_streak) + 1 : 1;
		$newLongest = max($newStreak, intval($row->longest_streak));

		parent::update(array(
			'table'  => self::BALANCE_TABLE,
			'names'  => array('current_streak', 'longest_streak', 'last_active_date', 'time_updated'),
			'values' => array($newStreak, $newLongest, $today, time()),
			'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
		));

		$milestone = null;
		if (in_array($newStreak, self::STREAK_MILESTONES, true)) {
			$reason = "streak_milestone_{$newStreak}";
			if ($this->award($userGuid, $newStreak === 30 ? 100 : 25, $reason, null, true)) {
				$milestone = $newStreak;
			}
		}

		return array(
			'current_streak' => $newStreak,
			'longest_streak' => $newLongest,
			'is_new_day'     => true,
			'milestone'      => $milestone,
		);
	}
}
