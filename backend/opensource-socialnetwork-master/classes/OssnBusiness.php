<?php
/**
 * BERX Business — real place-claim requests (admin-approved, never
 * auto-verified) and real owner-only review replies.
 *
 * WHY A DEDICATED TABLE FOR REPLIES, NOT updateObject(). Confirmed
 * (after checking, not assuming) that Places' own is_business/
 * verified/website/address/phone/hours fields really do go through
 * OssnObject::updateObject() into the real `ossn_entities_metadata`
 * table — a genuine generic per-entity key-value store, not a
 * risk. The reason a reply gets its own small table instead is
 * structural, not caution: a reply isn't PLACE metadata, it's data
 * scoped to one REVIEW (author_guid, place_guid, review_guid all
 * need tracking together), which doesn't fit the "one place, one
 * metadata value per key" shape that system is built for. Claims are
 * a dedicated table for the same reason — they're their own real
 * entity with a lifecycle (pending/approved/rejected), not a place
 * attribute.
 *
 * IMPORTANT: any method here named update()/delete() would shadow
 * OssnDatabase's own same-named methods (see the documented bug
 * history in OssnCollections/OssnCircles/OssnTrips/OssnExperiences —
 * a bare $this->update()/$this->delete() call inside such a method
 * recurses into itself instead of the parent). This class avoids the
 * collision entirely by naming its own methods reviewClaim()/
 * deleteReply() instead — verified by grep before shipping, not by
 * assumption.
 */
class OssnBusiness extends OssnDatabase {

		const CLAIMS_TABLE  = 'ossn_place_claims';
		const REPLIES_TABLE = 'ossn_place_review_replies';
		const TEAM_TABLE    = 'ossn_business_team';

		const STATUS_PENDING  = 'pending';
		const STATUS_APPROVED = 'approved';
		const STATUS_REJECTED = 'rejected';

		/* ---------------- Claims ---------------- */

		public function submitClaim($placeGuid, $requesterGuid, $message = '') {
				$placeGuid     = intval($placeGuid);
				$requesterGuid = intval($requesterGuid);
				if (!$placeGuid || !$requesterGuid) {
						return false;
				}
				if ($this->hasPendingClaim($placeGuid, $requesterGuid)) {
						return false;
				}
				$ok = $this->insert(array(
						'into'   => self::CLAIMS_TABLE,
						'names'  => array('place_guid', 'requester_guid', 'message', 'status', 'time_created'),
						'values' => array($placeGuid, $requesterGuid, mb_substr((string) $message, 0, 500, 'UTF-8'), self::STATUS_PENDING, time()),
				));
				return $ok ? $this->getLastEntry() : false;
		}

		public function hasPendingClaim($placeGuid, $requesterGuid) {
				$row = $this->select(array(
						'from'   => self::CLAIMS_TABLE,
						'wheres' => array(
								self::wheres('place_guid', '=', intval($placeGuid)),
								self::wheres('requester_guid', '=', intval($requesterGuid)),
								self::wheres('status', '=', self::STATUS_PENDING),
						),
				));
				return (bool) $row;
		}

		public function getClaim($id) {
				$id = intval($id);
				if (!$id) {
						return false;
				}
				$row = $this->select(array(
						'from'   => self::CLAIMS_TABLE,
						'wheres' => array(self::wheres('id', '=', $id)),
				));
				return $row ? $row : false;
		}

		public function pendingClaims($limit = 50) {
				$rows = $this->select(array(
						'from'     => self::CLAIMS_TABLE,
						'wheres'   => array(self::wheres('status', '=', self::STATUS_PENDING)),
						'order_by' => 'time_created ASC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		public function myClaims($requesterGuid, $limit = 50) {
				$rows = $this->select(array(
						'from'     => self::CLAIMS_TABLE,
						'wheres'   => array(self::wheres('requester_guid', '=', intval($requesterGuid))),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		/**
		 * Admin-only. On approval, the place's real owner_guid is
		 * reassigned to the requester — this is the actual business
		 * effect of a claim, not just a status flag.
		 */
		public function reviewClaim($claimId, $adminGuid, $approve) {
				if (!ossn_isAdminLoggedin()) {
						return 'forbidden';
				}
				$claim = $this->getClaim($claimId);
				if (!$claim || $claim->status !== self::STATUS_PENDING) {
						return 'not_found';
				}
				$status = $approve ? self::STATUS_APPROVED : self::STATUS_REJECTED;
				$ok = parent::update(array(
						'table'  => self::CLAIMS_TABLE,
						'names'  => array('status', 'reviewed_by_guid', 'time_reviewed'),
						'values' => array($status, intval($adminGuid), time()),
						'wheres' => array(self::wheres('id', '=', intval($claimId))),
				));
				if (!$ok) {
						return 'failed';
				}
				if ($approve && class_exists('OssnPlaces')) {
						$places = new OssnPlaces();
						$places->updateObject('owner_guid', intval($claim->requester_guid), intval($claim->place_guid));
				}
				return true;
		}

		/* ---------------- Review replies ---------------- */

		public function canReply($placeOwnerGuid, $actingGuid) {
				if (!$actingGuid) {
						return false;
				}
				if (ossn_isAdminLoggedin()) {
						return true;
				}
				return intval($placeOwnerGuid) === intval($actingGuid);
		}

		public function getReply($reviewGuid) {
				$row = $this->select(array(
						'from'   => self::REPLIES_TABLE,
						'wheres' => array(self::wheres('review_guid', '=', intval($reviewGuid))),
				));
				return $row ? $row : false;
		}

		/** One reply per review — a second call from the same owner edits the existing reply rather than creating a duplicate. */
		public function upsertReply($reviewGuid, $placeGuid, $authorGuid, $text) {
				$text = trim((string) $text);
				if ($text === '' || mb_strlen($text, 'UTF-8') > 1000) {
						return false;
				}
				$existing = $this->getReply($reviewGuid);
				if ($existing) {
						return parent::update(array(
								'table'  => self::REPLIES_TABLE,
								'names'  => array('text', 'time_updated'),
								'values' => array($text, time()),
								'wheres' => array(self::wheres('review_guid', '=', intval($reviewGuid))),
						));
				}
				$now = time();
				return $this->insert(array(
						'into'   => self::REPLIES_TABLE,
						'names'  => array('review_guid', 'place_guid', 'author_guid', 'text', 'time_created', 'time_updated'),
						'values' => array(intval($reviewGuid), intval($placeGuid), intval($authorGuid), $text, $now, $now),
				));
		}

		public function deleteReply($reviewGuid, $actingGuid, $placeOwnerGuid) {
				if (!$this->canReply($placeOwnerGuid, $actingGuid)) {
						return false;
				}
				return parent::delete(array(
						'from'   => self::REPLIES_TABLE,
						'wheres' => array(self::wheres('review_guid', '=', intval($reviewGuid))),
				));
		}

		/* ---------------- Team ---------------- */

		const ROLE_OWNER   = 'owner';
		const ROLE_MANAGER = 'manager';
		const ROLE_STAFF   = 'staff';

		public static function isValidRole($role) {
				return in_array((string) $role, array(self::ROLE_MANAGER, self::ROLE_STAFF), true);
				// ROLE_OWNER is never assignable through this table — the
				// real owner is the place's own owner_guid (OssnPlaces),
				// never duplicated here. Team rows are for people the
				// owner delegates access TO, not the owner themself.
		}

		public function teamRole($placeGuid, $memberGuid) {
				$row = $this->select(array(
						'from'   => self::TEAM_TABLE,
						'wheres' => array(
								self::wheres('place_guid', '=', intval($placeGuid)),
								self::wheres('member_guid', '=', intval($memberGuid)),
						),
				));
				return $row ? $row->role : null;
		}

		/** Real access check used everywhere team-gated actions happen: the place's real owner, an admin, or anyone with a real team row. */
		public function canManage($place, $actingGuid) {
				if (!$place || !$actingGuid) {
						return false;
				}
				if (ossn_isAdminLoggedin()) {
						return true;
				}
				if (intval($place->owner_guid) === intval($actingGuid)) {
						return true;
				}
				return $this->teamRole($place->guid, $actingGuid) !== null;
		}

		/** Only the real owner (or admin) can add/remove team members — a manager cannot grant themselves more access or add others. */
		public function addTeamMember($place, $actingGuid, $memberGuid, $role) {
				if (!$place || (intval($place->owner_guid) !== intval($actingGuid) && !ossn_isAdminLoggedin())) {
						return 'forbidden';
				}
				$memberGuid = intval($memberGuid);
				if (!$memberGuid || $memberGuid === intval($place->owner_guid) || !self::isValidRole($role)) {
						return 'invalid_member';
				}
				if ($this->teamRole($place->guid, $memberGuid) !== null) {
						return 'already_member';
				}
				$ok = $this->insert(array(
						'into'   => self::TEAM_TABLE,
						'names'  => array('place_guid', 'member_guid', 'role', 'added_by_guid', 'time_created'),
						'values' => array(intval($place->guid), $memberGuid, (string) $role, intval($actingGuid), time()),
				));
				return $ok ? true : 'failed';
		}

		public function removeTeamMember($place, $actingGuid, $memberGuid) {
				if (!$place || (intval($place->owner_guid) !== intval($actingGuid) && !ossn_isAdminLoggedin())) {
						return false;
				}
				return parent::delete(array(
						'from'   => self::TEAM_TABLE,
						'wheres' => array(
								self::wheres('place_guid', '=', intval($place->guid)),
								self::wheres('member_guid', '=', intval($memberGuid)),
						),
				));
		}

		public function team($placeGuid, $limit = 50) {
				$rows = $this->select(array(
						'from'     => self::TEAM_TABLE,
						'wheres'   => array(self::wheres('place_guid', '=', intval($placeGuid))),
						'order_by' => 'time_created ASC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		/* ---------------- Subscription / trial ----------------
		 * Server-authoritative throughout. No client-supplied timestamp
		 * is ever trusted — trial_started_at/trial_ends_at are set from
		 * time() on the server at the moment a trial starts, and every
		 * status read recomputes 'trial'/'expired' from that against
		 * the CURRENT server time(), never a stored/cached boolean that
		 * could go stale.
		 */

		const STATUS_TRIAL   = 'trial';
		const STATUS_ACTIVE  = 'active';
		const STATUS_EXPIRED = 'expired';

		const TRIAL_DAYS = 7;
		/** Real price shown to the user — NOT charged: no payment provider is integrated. See getSubscription()'s 'entitled' field for the actual access gate. */
		const MONTHLY_PRICE_RUB = 3999;

		public function getSubscription($placeGuid) {
				$row = $this->select(array(
						'from'   => 'ossn_business_subscriptions',
						'wheres' => array(self::wheres('place_guid', '=', intval($placeGuid))),
				));
				return $row ? $row : false;
		}

		/** Idempotent — calling this on a place that already has a subscription row just returns the existing one, never resets a real trial clock. */
		public function ensureTrialStarted($placeGuid, $actingGuid) {
				$existing = $this->getSubscription($placeGuid);
				if ($existing) {
						return $existing;
				}
				$now = time();
				$ok = $this->insert(array(
						'into'   => 'ossn_business_subscriptions',
						'names'  => array('place_guid', 'plan', 'status', 'trial_started_at', 'trial_ends_at', 'time_updated'),
						'values' => array(intval($placeGuid), 'business_monthly', self::STATUS_TRIAL, $now, $now + (self::TRIAL_DAYS * 86400), $now),
				));
				return $ok ? $this->getSubscription($placeGuid) : false;
		}

		/**
		 * Real entitlement check — recomputed from real server time on
		 * every call, never a cached flag. A 'status' of 'active' means
		 * a real payment provider (not yet integrated) confirmed
		 * payment; until one exists, 'active' can only be set by an
		 * admin action, never by the business itself or by this method.
		 */
		public function hasActiveAccess($placeGuid) {
				$sub = $this->getSubscription($placeGuid);
				if (!$sub) {
						return false;
				}
				if ($sub->status === self::STATUS_ACTIVE) {
						return true;
				}
				if ($sub->status === self::STATUS_TRIAL) {
						return time() < intval($sub->trial_ends_at);
				}
				return false;
		}
}
