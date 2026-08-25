<?php
/**
 * BERX Experiences — a real Place or Event + a schedule + real,
 * invited participants who can accept or decline.
 *
 * IMPORTANT: this class defines its own update()/delete() with
 * different signatures than OssnDatabase's — every internal call uses
 * parent::update()/parent::delete() explicitly, never $this-> (see
 * the same note in OssnTrips/OssnCollections/OssnCircles; this is
 * now the fourth class following this rule, applied correctly from
 * the start).
 *
 * NO TICKET/PAYMENT LIFECYCLE. Deliberately absent — that requires
 * real payment infrastructure this codebase doesn't have. An
 * Experience here is a scheduled plan with real people, not a
 * purchasable product.
 *
 * PARTICIPANT MODEL differs from Trips/Circles: participants are
 * INVITED (status starts 'invited') and can accept/decline
 * themselves — matching how a curated experience actually works
 * (the host proposes, invitees respond), rather than the host simply
 * adding already-confirmed members.
 */
class OssnExperiences extends OssnDatabase {

		const TABLE              = 'ossn_experiences';
		const PARTICIPANTS_TABLE = 'ossn_experience_participants';

		const VISIBILITY_PRIVATE = 1;
		const VISIBILITY_PUBLIC  = 2;

		const STATUS_INVITED  = 'invited';
		const STATUS_ACCEPTED = 'accepted';
		const STATUS_DECLINED = 'declined';

		public static function isValidVisibility($visibility) {
				return in_array(intval($visibility), array(self::VISIBILITY_PRIVATE, self::VISIBILITY_PUBLIC), true);
		}

		/** Resolves and validates the anchor — exactly one of place/event, and it must really exist. */
		private static function resolveAnchor($placeGuid, $eventGuid) {
				$placeGuid = $placeGuid ? intval($placeGuid) : null;
				$eventGuid = $eventGuid ? intval($eventGuid) : null;
				if (($placeGuid && $eventGuid) || (!$placeGuid && !$eventGuid)) {
						return false;
				}
				if ($placeGuid) {
						if (!class_exists('OssnPlaces')) {
								return false;
						}
						$model = new OssnPlaces;
						return $model->getPlace($placeGuid) ? array('place_guid' => $placeGuid, 'event_guid' => null) : false;
				}
				if (!class_exists('OssnEvents')) {
						return false;
				}
				$model = new OssnEvents;
				return $model->getEvent($eventGuid) ? array('place_guid' => null, 'event_guid' => $eventGuid) : false;
		}

		/* ---------------- Experiences ---------------- */

		public function create($ownerGuid, $title, $description, $placeGuid, $eventGuid, $scheduledStart, $scheduledEnd = null, $visibility = self::VISIBILITY_PRIVATE) {
				$ownerGuid = intval($ownerGuid);
				$title     = trim((string) $title);
				$scheduledStart = intval($scheduledStart);
				if (!$ownerGuid || $title === '' || mb_strlen($title, 'UTF-8') > 120 || !$scheduledStart) {
						return false;
				}
				$anchor = self::resolveAnchor($placeGuid, $eventGuid);
				if ($anchor === false) {
						return false;
				}
				if (!self::isValidVisibility($visibility)) {
						$visibility = self::VISIBILITY_PRIVATE;
				}
				$now = time();
				$ok = $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('owner_guid', 'title', 'description', 'place_guid', 'event_guid', 'scheduled_start', 'scheduled_end', 'visibility', 'time_created', 'time_updated'),
						'values' => array($ownerGuid, $title, (string) $description, $anchor['place_guid'], $anchor['event_guid'], $scheduledStart, $scheduledEnd ? intval($scheduledEnd) : null, intval($visibility), $now, $now),
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

		public function participantStatus($experienceId, $userGuid) {
				$row = $this->select(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(
								self::wheres('experience_id', '=', intval($experienceId)),
								self::wheres('member_guid', '=', intval($userGuid)),
						),
				));
				return $row ? $row->status : null;
		}

		public function canView($experience, $viewerGuid) {
				if (!$experience) {
						return false;
				}
				if (intval($experience->visibility) === self::VISIBILITY_PUBLIC) {
						return true;
				}
				if (ossn_isAdminLoggedin()) {
						return true;
				}
				if (intval($experience->owner_guid) === intval($viewerGuid)) {
						return true;
				}
				return $this->participantStatus($experience->id, $viewerGuid) !== null;
		}

		/** Owner or admin only — invited participants respond via respondInvite(), never edit the plan itself. */
		public function canEdit($experience, $actingGuid) {
				if (!$experience || !$actingGuid) {
						return false;
				}
				if (ossn_isAdminLoggedin()) {
						return true;
				}
				return intval($experience->owner_guid) === intval($actingGuid);
		}

		public function listByOwner($ownerGuid, $viewerGuid) {
				$ownerGuid = intval($ownerGuid);
				if (!$ownerGuid) {
						return array();
				}
				$wheres = array(self::wheres('owner_guid', '=', $ownerGuid));
				if (intval($viewerGuid) !== $ownerGuid && !ossn_isAdminLoggedin()) {
						$wheres[] = self::wheres('visibility', '=', self::VISIBILITY_PUBLIC);
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'wheres'   => $wheres,
						'order_by' => 'scheduled_start ASC',
				), true);
				return $rows ? $rows : array();
		}

		/** Experiences $viewerGuid has been invited to (any status), regardless of owner. */
		public function listForParticipant($viewerGuid) {
				$viewerGuid = intval($viewerGuid);
				if (!$viewerGuid) {
						return array();
				}
				$memberships = $this->select(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(self::wheres('member_guid', '=', $viewerGuid)),
				), true);
				if (!$memberships) {
						return array();
				}
				$out = array();
				foreach ($memberships as $m) {
						$exp = $this->get($m->experience_id);
						if ($exp) {
								$out[] = $exp;
						}
				}
				return $out;
		}

		public function update($id, $actingGuid, array $fields) {
				$experience = $this->get($id);
				if (!$this->canEdit($experience, $actingGuid)) {
						return false;
				}
				$names  = array();
				$values = array();
				if (isset($fields['title'])) {
						$title = trim((string) $fields['title']);
						if ($title === '' || mb_strlen($title, 'UTF-8') > 120) {
								return false;
						}
						$names[]  = 'title';
						$values[] = $title;
				}
				if (isset($fields['description'])) {
						$names[]  = 'description';
						$values[] = (string) $fields['description'];
				}
				if (isset($fields['visibility'])) {
						if (!self::isValidVisibility($fields['visibility'])) {
								return false;
						}
						$names[]  = 'visibility';
						$values[] = intval($fields['visibility']);
				}
				if (isset($fields['scheduled_start'])) {
						$start = intval($fields['scheduled_start']);
						if (!$start) {
								return false;
						}
						$names[]  = 'scheduled_start';
						$values[] = $start;
				}
				if (array_key_exists('scheduled_end', $fields)) {
						$names[]  = 'scheduled_end';
						$values[] = $fields['scheduled_end'] ? intval($fields['scheduled_end']) : null;
				}
				if (empty($names)) {
						return false;
				}
				$names[]  = 'time_updated';
				$values[] = time();

				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => $names,
						'values' => $values,
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		public function delete($id, $actingGuid) {
				$experience = $this->get($id);
				if (!$this->canEdit($experience, $actingGuid)) {
						return false;
				}
				parent::delete(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(self::wheres('experience_id', '=', intval($id))),
				));
				return parent::delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		/* ---------------- Participants ---------------- */

		/** Owner invites a real confirmed friend — same constraint as Circles/Trips. */
		public function invite($experienceId, $actingGuid, $memberGuid) {
				$experience = $this->get($experienceId);
				if (!$this->canEdit($experience, $actingGuid)) {
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
				if ($this->participantStatus($experienceId, $memberGuid) !== null) {
						return 'already_invited';
				}
				$ok = $this->insert(array(
						'into'   => self::PARTICIPANTS_TABLE,
						'names'  => array('experience_id', 'member_guid', 'status', 'time_created'),
						'values' => array(intval($experienceId), $memberGuid, self::STATUS_INVITED, time()),
				));
				return $ok ? true : 'failed';
		}

		/**
		 * The invited person themselves accepts/declines — $actingGuid
		 * must equal the participant row's own member_guid, never the
		 * owner acting on someone else's behalf.
		 */
		public function respondInvite($experienceId, $actingGuid, $accept) {
				$status = $this->participantStatus($experienceId, $actingGuid);
				if ($status === null) {
						return false;
				}
				return parent::update(array(
						'table'  => self::PARTICIPANTS_TABLE,
						'names'  => array('status'),
						'values' => array($accept ? self::STATUS_ACCEPTED : self::STATUS_DECLINED),
						'wheres' => array(
								self::wheres('experience_id', '=', intval($experienceId)),
								self::wheres('member_guid', '=', intval($actingGuid)),
						),
				));
		}

		/** Owner removes an invitee, OR the invitee removes themselves — same "self or owner" rule as leaving vs. kicking. */
		public function removeParticipant($experienceId, $actingGuid, $memberGuid) {
				$experience = $this->get($experienceId);
				$memberGuid = intval($memberGuid);
				$isOwner = $this->canEdit($experience, $actingGuid);
				$isSelf  = intval($actingGuid) === $memberGuid;
				if (!$isOwner && !$isSelf) {
						return false;
				}
				return parent::delete(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(
								self::wheres('experience_id', '=', intval($experienceId)),
								self::wheres('member_guid', '=', $memberGuid),
						),
				));
		}

		public function participants($experienceId, $limit = 200) {
				$rows = $this->select(array(
						'from'     => self::PARTICIPANTS_TABLE,
						'wheres'   => array(self::wheres('experience_id', '=', intval($experienceId))),
						'order_by' => 'time_created ASC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}
}
