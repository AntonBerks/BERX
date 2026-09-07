<?php
/**
 * BERX Circles — user-owned privacy groups built from real friends.
 *
 * Strictly private: only the owner (or admin) can ever read or write
 * a circle — there is no public/shared visibility tier, unlike
 * Collections. A circle is a personal organizing tool, not content.
 *
 * Membership is constrained to confirmed friends (OssnUser::isFriend())
 * at add-time — this is deliberate, not a limitation to work around:
 * circles exist to scope visibility to people the owner already has a
 * real relationship with, never to build a second, parallel contact
 * list of arbitrary users.
 */
class OssnCircles extends OssnDatabase {

		const TABLE         = 'ossn_circles';
		const MEMBERS_TABLE = 'ossn_circle_members';

		public static function isValidKind($kind) {
				if ($kind === null || $kind === '') {
						return true;
				}
				return in_array((string) $kind, array('family', 'work', 'travel', 'close_friends'), true);
		}

		public function create($ownerGuid, $name, $kind = null) {
				$ownerGuid = intval($ownerGuid);
				$name      = trim((string) $name);
				if (!$ownerGuid || $name === '' || mb_strlen($name, 'UTF-8') > 80) {
						return false;
				}
				if (!self::isValidKind($kind)) {
						$kind = null;
				}
				$ok = $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('owner_guid', 'name', 'kind', 'time_created'),
						'values' => array($ownerGuid, $name, $kind, time()),
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

		/**
		 * Strictly owner-or-admin — no read/write distinction, unlike
		 * Collections.
		 *
		 * MAX BUILD -- real fix, same class of bug found/fixed elsewhere
		 * this session: ossn_isAdminLoggedin() reads $_SESSION, never
		 * populated for a bearer-token API request.
		 */
		public function canAccess($circle, $actingGuid) {
				if (!$circle || !$actingGuid) {
						return false;
				}
				if (ossn_api_is_admin($actingGuid)) {
						return true;
				}
				return intval($circle->owner_guid) === intval($actingGuid);
		}

		public function listByOwner($ownerGuid) {
				$ownerGuid = intval($ownerGuid);
				if (!$ownerGuid) {
						return array();
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'wheres'   => array(self::wheres('owner_guid', '=', $ownerGuid)),
						'order_by' => 'time_created DESC',
				), true);
				return $rows ? $rows : array();
		}

		public function rename($id, $actingGuid, $name) {
				$circle = $this->get($id);
				if (!$this->canAccess($circle, $actingGuid)) {
						return false;
				}
				$name = trim((string) $name);
				if ($name === '' || mb_strlen($name, 'UTF-8') > 80) {
						return false;
				}
				return $this->update(array(
						'table'  => self::TABLE,
						'names'  => array('name'),
						'values' => array($name),
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		/**
		 * MAX BUILD — real fix: this was `delete()`, which overrode
		 * OssnDatabase's own low-level `delete()` with an incompatible
		 * signature. PHP 7 warned; PHP 8 makes it a fatal error the
		 * moment the class is loaded, so every API request that touched
		 * this class died — POST /api/v1/posts answered with a fatal error and an empty body. The two were never the same
		 * operation anyway: one is "delete this circle, if this caller may", the other is "run this
		 * SQL", and the parent's is still called below to do exactly
		 * that.
		 */
		public function deleteCircle($id, $actingGuid) {
				$circle = $this->get($id);
				if (!$this->canAccess($circle, $actingGuid)) {
						return false;
				}
				parent::delete(array(
						'from'   => self::MEMBERS_TABLE,
						'wheres' => array(self::wheres('circle_id', '=', intval($id))),
				));
				return parent::delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		/**
		 * Add a real friend to a circle. Returns a typed result string
		 * so the API layer can map to the right HTTP status without
		 * re-deriving the reason.
		 */
		public function addMember($circleId, $actingGuid, $memberGuid) {
				$circle = $this->get($circleId);
				if (!$this->canAccess($circle, $actingGuid)) {
						return 'forbidden';
				}
				$memberGuid = intval($memberGuid);
				if (!$memberGuid || $memberGuid === intval($actingGuid)) {
						return 'invalid_member';
				}
				$checker = new OssnUser();
				if (!$checker->isFriend($actingGuid, $memberGuid)) {
						return 'not_a_friend';
				}
				if ($this->isMember($circleId, $memberGuid)) {
						return 'already_member';
				}
				$ok = $this->insert(array(
						'into'   => self::MEMBERS_TABLE,
						'names'  => array('circle_id', 'member_guid', 'time_created'),
						'values' => array(intval($circleId), $memberGuid, time()),
				));
				return $ok ? true : 'failed';
		}

		public function isMember($circleId, $memberGuid) {
				$row = $this->select(array(
						'from'   => self::MEMBERS_TABLE,
						'wheres' => array(
								self::wheres('circle_id', '=', intval($circleId)),
								self::wheres('member_guid', '=', intval($memberGuid)),
						),
				));
				return (bool) $row;
		}

		public function removeMember($circleId, $actingGuid, $memberGuid) {
				$circle = $this->get($circleId);
				if (!$this->canAccess($circle, $actingGuid)) {
						return false;
				}
				return parent::delete(array(
						'from'   => self::MEMBERS_TABLE,
						'wheres' => array(
								self::wheres('circle_id', '=', intval($circleId)),
								self::wheres('member_guid', '=', intval($memberGuid)),
						),
				));
		}

		public function members($circleId, $limit = 500) {
				$rows = $this->select(array(
						'from'     => self::MEMBERS_TABLE,
						'wheres'   => array(self::wheres('circle_id', '=', intval($circleId))),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		public function memberCount($circleId) {
				// members() returns a real array only when EMPTY (see its own
				// `return $rows ? $rows : array();`) — a non-empty result is
				// select(..., true)'s real return value, arrayObject()'s
				// stdClass wrapper (numeric properties, not a PHP array).
				// count() on that throws TypeError on PHP 8+ (confirmed by
				// tracing OssnDatabase::fetch()/arrayObject() before writing
				// this fix, not assumed) — count() only ever worked here by
				// accident, on the empty-array branch. (array) cast first,
				// safe for both shapes.
				return count((array) $this->members($circleId, 2000));
		}

		/* ---------------- Post visibility ----------------
		 * Shared, server-side-only check used by every real post-read
		 * path (posts.php, feed.php, tracks.php, videos.php,
		 * collections.php, OssnCreator::recentPosts() callers) — one
		 * function, not six copies of the same logic. A post with no
		 * stored 'berx_visibility' metadata is 'public' (existing posts
		 * before this feature shipped stay exactly as visible as they
		 * always were — no silent lockout).
		 */

		const VISIBILITY_PUBLIC  = 'public';
		const VISIBILITY_FRIENDS = 'friends';
		const VISIBILITY_PREFIX_CIRCLE = 'circle:';

		public static function isValidVisibilityValue($value) {
				$value = (string) $value;
				if ($value === self::VISIBILITY_PUBLIC || $value === self::VISIBILITY_FRIENDS) {
						return true;
				}
				return strpos($value, self::VISIBILITY_PREFIX_CIRCLE) === 0 && ctype_digit(substr($value, strlen(self::VISIBILITY_PREFIX_CIRCLE)));
		}

		/**
		 * Real, server-side-only visibility gate. $post must have
		 * ->owner_guid and ->berx_visibility (absent/empty treated as
		 * public). Never trust a client-supplied "I'm allowed" flag —
		 * every caller re-derives this from real membership/friendship
		 * data on every read, no caching of the result across requests.
		 */
		public function canViewPost($post, $viewerGuid) {
				if (!$post) {
						return false;
				}
				if (intval($post->owner_guid) === intval($viewerGuid)) {
						return true;
				}
				// MAX BUILD -- real fix, same class of bug found/fixed
				// elsewhere this session.
				if (ossn_api_is_admin($viewerGuid)) {
						return true;
				}
				$visibility = (isset($post->berx_visibility) && $post->berx_visibility !== '') ? (string) $post->berx_visibility : self::VISIBILITY_PUBLIC;

				if ($visibility === self::VISIBILITY_PUBLIC) {
						return true;
				}
				if ($visibility === self::VISIBILITY_FRIENDS) {
						if (!class_exists('OssnUser')) {
								return false;
						}
						$checker = new OssnUser();
						return (bool) $checker->isFriend(intval($post->owner_guid), intval($viewerGuid));
				}
				if (strpos($visibility, self::VISIBILITY_PREFIX_CIRCLE) === 0) {
						$circle_id = intval(substr($visibility, strlen(self::VISIBILITY_PREFIX_CIRCLE)));
						if (!$circle_id) {
								return false;
						}
						return $this->isMember($circle_id, $viewerGuid);
				}
				// Unrecognized value — fail closed, never open.
				return false;
		}
}
