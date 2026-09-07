<?php
/**
 * BERX Realtime — the credential and the channel authorization behind
 * the WebSocket transport (backend/scripts/berx-realtime-server.php).
 *
 * This class is the ONLY thing that decides whether a socket may exist
 * and what it may hear. The socket server itself holds no policy: it
 * asks here, and refuses whatever it is not told to allow. That is
 * deliberate — a second, socket-shaped copy of the visibility rules is
 * how a realtime layer ends up leaking what the HTTP API refuses.
 *
 * TOKENS. Short-lived (TTL_SECONDS), single-purpose, minted only by an
 * already-bearer-authenticated request (components/OssnApi/v1/
 * realtime.php). The raw value is returned exactly once; only its
 * sha256 is stored — same rule as OssnApiToken, for the same reason:
 * a socket credential travels through a URL or a first frame, which
 * are logged in places an Authorization header is not.
 *
 * CHANNELS. `kind:id`, and every kind is authorized against a REAL row
 * at subscribe time, never against a stored grant:
 *
 *   self:{guid}          your own guid, and only your own
 *   person:{guid}        yourself, or someone OssnUser::isFriend() says
 *                        you are really friends with
 *   place:{guid}         a real place object (public by nature — the
 *                        same objects GET /places serves to anyone)
 *   event:{guid}         a real event object, same reasoning
 *   community:{guid}     a group OssnGroup::isMember() says you joined
 *   conversation:{id}    a conversation OssnGroupChat::isActiveMember()
 *                        says you are an active participant of
 *   world:{id}           a world OssnWorlds::canView() admits you to
 *
 * A subscription that is not authorized is refused, not silently
 * dropped: a client that believes it is subscribed and hears nothing
 * cannot tell that apart from a quiet channel.
 */
class OssnRealtime extends OssnDatabase {

	const TABLE = 'ossn_realtime_tokens';

	/**
	 * Five minutes. Long enough to open a socket after the HTTP call
	 * that minted it — including a slow network and a retry — and short
	 * enough that a leaked one is worth nothing by the time it is read
	 * out of a log. The socket, once open, outlives its token: the
	 * credential authenticates the handshake, it is not a session.
	 */
	const TTL_SECONDS = 300;

	/** Every channel kind the transport knows. Anything else is refused. */
	const KINDS = array('self', 'person', 'place', 'event', 'community', 'conversation', 'world');

	/**
	 * Mint a realtime credential for an already-authenticated user.
	 * Returns array('token' => raw, 'expires_at' => unix) — the only
	 * moment the raw token exists — or false.
	 */
	public function mintToken($userGuid) {
		$userGuid = intval($userGuid);
		if (!$userGuid) {
			return false;
		}
		$raw  = bin2hex(random_bytes(32));
		$now  = time();
		$expires = $now + self::TTL_SECONDS;
		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('user_guid', 'token_hash', 'time_created', 'time_expires', 'revoked'),
			'values' => array($userGuid, hash('sha256', $raw), $now, $expires, 0),
		));
		if (!$id) {
			return false;
		}
		return array('token' => $raw, 'expires_at' => $expires);
	}

	/**
	 * Validate a raw realtime token and BURN it: a credential that
	 * opened one socket must not open a second. Returns the real
	 * user_guid, or false.
	 */
	public function claimToken($rawToken) {
		$rawToken = (string) $rawToken;
		if ($rawToken === '') {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('token_hash', '=', hash('sha256', $rawToken)),
				self::wheres('revoked', '=', 0),
			),
		));
		if (!$row) {
			return false;
		}
		if (intval($row->time_expires) <= time() || $row->time_used !== null) {
			return false;
		}
		/* Burn before answering. If this update fails the token stays
		   unusable rather than becoming reusable. */
		$burned = parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('time_used', 'revoked'),
			'values' => array(time(), 1),
			'wheres' => array(
				self::wheres('id', '=', intval($row->id)),
				self::wheres('revoked', '=', 0),
			),
		));
		if (!$burned) {
			return false;
		}
		return intval($row->user_guid);
	}

	/** Ends every unused credential a user holds — what a logout needs. */
	public function revokeForUser($userGuid) {
		return parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('revoked'),
			'values' => array(1),
			'wheres' => array(
				self::wheres('user_guid', '=', intval($userGuid)),
				self::wheres('revoked', '=', 0),
			),
		));
	}

	/** Splits `kind:id` without trusting either half. */
	public static function parseChannel($channel) {
		$channel = (string) $channel;
		$at = strpos($channel, ':');
		if ($at === false || $at === 0) {
			return false;
		}
		$kind = substr($channel, 0, $at);
		$id   = substr($channel, $at + 1);
		if (!in_array($kind, self::KINDS, true)) {
			return false;
		}
		if ($id === '' || !ctype_digit($id)) {
			return false;
		}
		return array('kind' => $kind, 'id' => intval($id), 'channel' => $kind . ':' . intval($id));
	}

	/**
	 * May $userGuid listen to $channel right now? Answered from real
	 * rows every time it is asked.
	 */
	public function authorizeChannel($userGuid, $channel) {
		$userGuid = intval($userGuid);
		$parsed = self::parseChannel($channel);
		if (!$userGuid || !$parsed) {
			return false;
		}
		$id = $parsed['id'];
		switch ($parsed['kind']) {
			case 'self':
				return $id === $userGuid;

			case 'person':
				if ($id === $userGuid) {
					return true;
				}
				$user = new OssnUser();
				return (bool) $user->isFriend($userGuid, $id);

			case 'place':
			case 'event':
				$object = new OssnObject();
				$object->guid = $id;
				$loaded = $object->getObject();
				return $loaded && (string) $loaded->type === 'object' && (string) $loaded->subtype === $parsed['kind'];

			case 'community':
				if (!class_exists('OssnGroup')) {
					return false;
				}
				$group = new OssnGroup();
				return (bool) $group->isMember($id, $userGuid);

			case 'conversation':
				if (!class_exists('OssnGroupChat')) {
					return false;
				}
				$chat = new OssnGroupChat();
				return (bool) $chat->isActiveMember($id, $userGuid);

			case 'world':
				if (!class_exists('OssnWorlds')) {
					return false;
				}
				$worlds = new OssnWorlds();
				$world = $worlds->getWorld($id);
				return $world && $worlds->canView($world, $userGuid);
		}
		return false;
	}

	/**
	 * Authorize a whole list at once. Returns
	 * array('granted' => [...], 'refused' => [...]) — both halves, so
	 * the client is told what it did NOT get rather than left to infer
	 * it from silence.
	 */
	public function authorizeChannels($userGuid, array $channels) {
		$granted = array();
		$refused = array();
		foreach ($channels as $channel) {
			$parsed = self::parseChannel($channel);
			$name = $parsed ? $parsed['channel'] : (string) $channel;
			if ($parsed && $this->authorizeChannel($userGuid, $name)) {
				if (!in_array($name, $granted, true)) {
					$granted[] = $name;
				}
			} elseif (!in_array($name, $refused, true)) {
				$refused[] = $name;
			}
		}
		return array('granted' => $granted, 'refused' => $refused);
	}
}
