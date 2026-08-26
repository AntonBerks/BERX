<?php
/**
 * BERX API Token — bearer-token issuance/validation for the stateless
 * /api/v1 layer.
 *
 * Deliberately independent of OssnSession/$_SESSION: the API dispatcher
 * (components/OssnApi/ossn_com.php) never populates
 * $_SESSION['OSSN_USER'], so every request re-authenticates here against
 * `ossn_api_tokens`, never against a cookie session. Any wrapped core
 * method that internally calls ossn_loggedin_user()/ossn_isLoggedin()
 * needs its own explicit workaround at the call site — this class only
 * answers "which user_guid does this bearer token belong to right now",
 * nothing more.
 *
 * Raw tokens are NEVER stored — only a sha256 hash (`token_hash`,
 * unique). The raw token is handed to the client exactly once, at
 * issue time (login/register), and the client is responsible for
 * storing it (see client/packages/core's BerxTokenStorage).
 *
 * Schema (already migrated, see upgrade/upgrades/1785168400.php and
 * 1785168500.php — not re-created here):
 *   ossn_api_tokens(id, user_guid, token_hash, device_label,
 *     time_created, time_last_used, time_expires, revoked)
 *   ossn_api_login_attempts(id, identifier, ip, time_created)
 */
class OssnApiToken extends OssnDatabase {

	const TABLE = 'ossn_api_tokens';
	const LOGIN_ATTEMPTS_TABLE = 'ossn_api_login_attempts';

	// 90 days — a long-lived mobile session, revocable per-device via
	// GET/POST /me/sessions, not a short web-style expiry.
	const DEFAULT_TTL_SECONDS = 7776000;

	// Matches API_SECURITY_MATRIX.md's documented real limit: 10
	// attempts / 15 minutes.
	const LOGIN_ATTEMPT_WINDOW_SECONDS = 900;
	const LOGIN_ATTEMPT_MAX = 10;

	/**
	 * Issue a new token for a real, already-authenticated $userGuid.
	 * Returns array('token' => raw, 'expires_at' => unix) — the ONLY
	 * time the raw token is ever available — or false.
	 */
	public function issueToken($userGuid, $deviceLabel = null, $ttlSeconds = self::DEFAULT_TTL_SECONDS) {
		$userGuid = intval($userGuid);
		if (!$userGuid) {
			return false;
		}
		$raw = bin2hex(random_bytes(32));
		$hash = hash('sha256', $raw);
		$now = time();
		$expires = $now + intval($ttlSeconds);
		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('user_guid', 'token_hash', 'device_label', 'time_created', 'time_expires', 'revoked'),
			'values' => array($userGuid, $hash, $deviceLabel !== null && $deviceLabel !== '' ? (string) $deviceLabel : null, $now, $expires, 0),
		));
		if (!$id) {
			return false;
		}
		return array('token' => $raw, 'expires_at' => $expires);
	}

	/**
	 * Validate a raw bearer token. Returns the real user_guid on
	 * success (and best-effort bumps time_last_used), or false.
	 */
	public function validateToken($rawToken) {
		$rawToken = (string) $rawToken;
		if ($rawToken === '') {
			return false;
		}
		$hash = hash('sha256', $rawToken);
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('token_hash', '=', $hash),
				self::wheres('revoked', '=', 0),
			),
		));
		if (!$row) {
			return false;
		}
		if (intval($row->time_expires) <= time()) {
			return false;
		}
		// Best-effort only — a failed "last used" bump must never fail
		// authentication itself.
		parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('time_last_used'),
			'values' => array(time()),
			'wheres' => array(self::wheres('id', '=', intval($row->id))),
		));
		return intval($row->user_guid);
	}

	/** Revokes exactly the token used to call it — real /auth/logout semantics. */
	public function revokeByRawToken($rawToken) {
		$hash = hash('sha256', (string) $rawToken);
		return parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('revoked'),
			'values' => array(1),
			'wheres' => array(self::wheres('token_hash', '=', $hash)),
		));
	}

	/**
	 * Real device/session list — GET /me/sessions. Field names match
	 * BerxSession exactly (client/packages/api/src/types.ts), which are
	 * NOT the raw DB column names — mapped explicitly here.
	 */
	public function listSessions($userGuid) {
		$userGuid = intval($userGuid);
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('user_guid', '=', $userGuid),
				self::wheres('revoked', '=', 0),
			),
			'order_by' => 'time_last_used DESC, time_created DESC',
		), true);
		$out = array();
		if ($rows) {
			foreach ($rows as $row) {
				$out[] = array(
					'id'           => intval($row->id),
					'device_label' => $row->device_label !== null ? (string) $row->device_label : null,
					'created_at'   => intval($row->time_created),
					'last_used_at' => $row->time_last_used !== null ? intval($row->time_last_used) : null,
					'expires_at'   => intval($row->time_expires),
				);
			}
		}
		return $out;
	}

	/**
	 * Ownership lives in the WHERE, not a separate check beforehand — a
	 * foreign id simply matches zero rows (standing project rule, see
	 * client/BERX_DECISIONS.md).
	 */
	public function revokeSessionById($id, $userGuid) {
		return parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('revoked'),
			'values' => array(1),
			'wheres' => array(
				self::wheres('id', '=', intval($id)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
	}

	/* ---------------- Login rate limiting ---------------- */

	/**
	 * Real limit: LOGIN_ATTEMPT_MAX attempts per identifier (the raw
	 * username/email as typed, lowercased) within the window — keyed on
	 * the identifier itself, NOT on a resolved user guid. Keying on a
	 * resolved guid would give an attacker unlimited free attempts
	 * against any username/email that doesn't exist yet, since it would
	 * never resolve to a guid to count against. IP is intentionally NOT
	 * part of the limiting decision (only recorded) — matches the real,
	 * disclosed reason in API_SECURITY_MATRIX.md: this server's
	 * REMOTE_ADDR may be a reverse-proxy IP, not the real client's.
	 */
	public function isLoginRateLimited($identifier) {
		$identifier = mb_strtolower(trim((string) $identifier), 'UTF-8');
		if ($identifier === '') {
			return true;
		}
		$since = time() - self::LOGIN_ATTEMPT_WINDOW_SECONDS;
		$row = $this->select(array(
			'from'   => self::LOGIN_ATTEMPTS_TABLE,
			'params' => array('COUNT(*) AS c'),
			'wheres' => array(
				self::wheres('identifier', '=', $identifier),
				self::wheres('time_created', '>', $since),
			),
		));
		return $row && intval($row->c) >= self::LOGIN_ATTEMPT_MAX;
	}

	/** Records one attempt — call after every login try, success or failure. */
	public function recordLoginAttempt($identifier, $ip) {
		$identifier = mb_strtolower(trim((string) $identifier), 'UTF-8');
		return $this->insert(array(
			'into'   => self::LOGIN_ATTEMPTS_TABLE,
			'names'  => array('identifier', 'ip', 'time_created'),
			'values' => array($identifier, (string) $ip, time()),
		));
	}
}
