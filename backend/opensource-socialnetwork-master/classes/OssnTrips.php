<?php
/**
 * BERX Trips — real itineraries built from Places/Events, planned
 * with real friends.
 *
 * IMPORTANT (see BERX_PROGRESS.md "real bug" note from OssnCollections/
 * OssnCircles): this class defines its own update()/delete() with
 * different signatures than OssnDatabase's. Every internal call uses
 * parent::update()/parent::delete() explicitly — never $this-> — a
 * bare $this-> call would recurse into THIS class's own override
 * instead of the inherited database method.
 *
 * AUTHORIZATION:
 *  - canView: owner, any real participant, or anyone if visibility is
 *    public. A trip planned WITH someone must be visible TO them,
 *    unlike a Collection (which has no participant concept at all).
 *  - canEdit (stops/details): owner only, not participants — a
 *    shared itinerary is visible to the group but only the organizer
 *    edits it in this pass. (Collaborative editing is a real,
 *    reasonable future extension, not attempted here.)
 *  - participants: added by the owner, and (same rule as Circles)
 *    only from the owner's real confirmed friends.
 */
class OssnTrips extends OssnDatabase {

		const TABLE              = 'ossn_trips';
		const STOPS_TABLE        = 'ossn_trip_stops';
		const PARTICIPANTS_TABLE = 'ossn_trip_participants';

		const VISIBILITY_PRIVATE = 1;
		const VISIBILITY_PUBLIC  = 2;

		public static function itemTypes() {
				return array('place', 'event');
		}

		public static function isValidItemType($type) {
				return in_array((string) $type, self::itemTypes(), true);
		}

		public static function isValidVisibility($visibility) {
				return in_array(intval($visibility), array(self::VISIBILITY_PRIVATE, self::VISIBILITY_PUBLIC), true);
		}

		public static function itemExists($type, $guid) {
				$guid = intval($guid);
				if (!$guid || !self::isValidItemType($type)) {
						return false;
				}
				if ($type === 'place' && class_exists('OssnPlaces')) {
						$model = new OssnPlaces;
						return (bool) $model->getPlace($guid);
				}
				if ($type === 'event' && class_exists('OssnEvents')) {
						$model = new OssnEvents;
						return (bool) $model->getEvent($guid);
				}
				return false;
		}

		/* ---------------- Trips ---------------- */

		public function create($ownerGuid, $title, $description = '', $visibility = self::VISIBILITY_PRIVATE, $startDate = null, $endDate = null) {
				$ownerGuid = intval($ownerGuid);
				$title     = trim((string) $title);
				if (!$ownerGuid || $title === '' || mb_strlen($title, 'UTF-8') > 120) {
						return false;
				}
				if (!self::isValidVisibility($visibility)) {
						$visibility = self::VISIBILITY_PRIVATE;
				}
				$now = time();
				$ok = $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('owner_guid', 'title', 'description', 'visibility', 'start_date', 'end_date', 'time_created', 'time_updated'),
						'values' => array($ownerGuid, $title, (string) $description, intval($visibility), $startDate ? intval($startDate) : null, $endDate ? intval($endDate) : null, $now, $now),
				));
				if (!$ok) {
						return false;
				}
				$id = $this->getLastEntry();
				// Real EARN wiring — reason keyed on the trip's own real id,
				// reuses OssnPoints, never a parallel reward mechanism.
				if (class_exists('OssnPoints')) {
						(new OssnPoints())->award($ownerGuid, 10, "trip_created:{$id}", $id, true);
				}
				return $id;
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

		public function isParticipant($tripId, $userGuid) {
				$row = $this->select(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(
								self::wheres('trip_id', '=', intval($tripId)),
								self::wheres('member_guid', '=', intval($userGuid)),
						),
				));
				return (bool) $row;
		}

		/** MAX BUILD -- real fix, same class of bug found/fixed elsewhere this session: ossn_isAdminLoggedin() reads $_SESSION, never populated for a bearer-token API request. */
		public function canView($trip, $viewerGuid) {
				if (!$trip) {
						return false;
				}
				if (intval($trip->visibility) === self::VISIBILITY_PUBLIC) {
						return true;
				}
				if (ossn_api_is_admin($viewerGuid)) {
						return true;
				}
				if (intval($trip->owner_guid) === intval($viewerGuid)) {
						return true;
				}
				return $this->isParticipant($trip->id, $viewerGuid);
		}

		/** Owner or admin only — participants can view, never edit, in this pass. */
		public function canEdit($trip, $actingGuid) {
				if (!$trip || !$actingGuid) {
						return false;
				}
				if (ossn_api_is_admin($actingGuid)) {
						return true;
				}
				return intval($trip->owner_guid) === intval($actingGuid);
		}

		public function listByOwner($ownerGuid, $viewerGuid) {
				$ownerGuid = intval($ownerGuid);
				if (!$ownerGuid) {
						return array();
				}
				$wheres = array(self::wheres('owner_guid', '=', $ownerGuid));
				if (intval($viewerGuid) !== $ownerGuid && !ossn_api_is_admin($viewerGuid)) {
						$wheres[] = self::wheres('visibility', '=', self::VISIBILITY_PUBLIC);
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'wheres'   => $wheres,
						'order_by' => 'time_updated DESC',
				), true);
				return $rows ? $rows : array();
		}

		/** Trips $viewerGuid is a real participant of — regardless of who owns them. */
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
						$trip = $this->get($m->trip_id);
						if ($trip) {
								$out[] = $trip;
						}
				}
				return $out;
		}

		/**
		 * MAX BUILD — real fix: this was `update()`, which overrode
		 * OssnDatabase's own low-level `update()` with an incompatible
		 * signature. PHP 7 warned; PHP 8 makes it a fatal error the
		 * moment the class is loaded, so every API request that touched
		 * this class died — every trip write died before it began. The two were never the same
		 * operation anyway: one is "change this trip, if this caller may", the other is "run this
		 * SQL", and the parent's is still called below to do exactly
		 * that.
		 */
		public function updateTrip($id, $actingGuid, array $fields) {
				$trip = $this->get($id);
				if (!$this->canEdit($trip, $actingGuid)) {
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
				if (array_key_exists('start_date', $fields)) {
						$names[]  = 'start_date';
						$values[] = $fields['start_date'] ? intval($fields['start_date']) : null;
				}
				if (array_key_exists('end_date', $fields)) {
						$names[]  = 'end_date';
						$values[] = $fields['end_date'] ? intval($fields['end_date']) : null;
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

		/**
		 * MAX BUILD — real fix: this was `delete()`, which overrode
		 * OssnDatabase's own low-level `delete()` with an incompatible
		 * signature. PHP 7 warned; PHP 8 makes it a fatal error the
		 * moment the class is loaded, so every API request that touched
		 * this class died — every trip write died before it began. The two were never the same
		 * operation anyway: one is "delete this trip, if this caller may", the other is "run this
		 * SQL", and the parent's is still called below to do exactly
		 * that.
		 */
		public function deleteTrip($id, $actingGuid) {
				$trip = $this->get($id);
				if (!$this->canEdit($trip, $actingGuid)) {
						return false;
				}
				parent::delete(array(
						'from'   => self::STOPS_TABLE,
						'wheres' => array(self::wheres('trip_id', '=', intval($id))),
				));
				parent::delete(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(self::wheres('trip_id', '=', intval($id))),
				));
				return parent::delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		/* ---------------- Stops ---------------- */

		public function addStop($tripId, $actingGuid, $itemType, $itemGuid, $dayNumber = 1, $note = '') {
				$trip = $this->get($tripId);
				if (!$this->canEdit($trip, $actingGuid)) {
						return 'forbidden';
				}
				if (!self::isValidItemType($itemType)) {
						return 'invalid_type';
				}
				if (!self::itemExists($itemType, $itemGuid)) {
						return 'item_not_found';
				}
				$dayNumber = max(1, intval($dayNumber));

				// New stop goes after any existing stops on the same day.
				// select()'s 'count' param isn't a real feature anywhere
				// in this codebase (confirmed by checking OssnDatabase
				// itself and OssnCollections::itemCount(), which fetches
				// rows and counts in PHP) — matching that established
				// pattern here instead of a param that doesn't exist.
				$existingRows = $this->select(array(
						'from'   => self::STOPS_TABLE,
						'wheres' => array(
								self::wheres('trip_id', '=', intval($tripId)),
								self::wheres('day_number', '=', $dayNumber),
						),
				), true);
				$sortOrder = $existingRows ? count($existingRows) : 0;

				$ok = $this->insert(array(
						'into'   => self::STOPS_TABLE,
						'names'  => array('trip_id', 'item_type', 'item_guid', 'day_number', 'sort_order', 'note', 'time_created'),
						'values' => array(intval($tripId), (string) $itemType, intval($itemGuid), $dayNumber, $sortOrder, $note !== '' ? (string) $note : null, time()),
				));
				if (!$ok) {
						return 'failed';
				}
				$this->touch($tripId);
				return true;
		}

		public function removeStop($stopId, $actingGuid) {
				$stop = $this->select(array(
						'from'   => self::STOPS_TABLE,
						'wheres' => array(self::wheres('id', '=', intval($stopId))),
				));
				if (!$stop) {
						return false;
				}
				$trip = $this->get($stop->trip_id);
				if (!$this->canEdit($trip, $actingGuid)) {
						return false;
				}
				$ok = parent::delete(array(
						'from'   => self::STOPS_TABLE,
						'wheres' => array(self::wheres('id', '=', intval($stopId))),
				));
				if ($ok) {
						$this->touch($stop->trip_id);
				}
				return $ok;
		}

		public function stops($tripId, $limit = 500) {
				$rows = $this->select(array(
						'from'     => self::STOPS_TABLE,
						'wheres'   => array(self::wheres('trip_id', '=', intval($tripId))),
						'order_by' => 'day_number ASC, sort_order ASC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		private function touch($tripId) {
				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => array('time_updated'),
						'values' => array(time()),
						'wheres' => array(self::wheres('id', '=', intval($tripId))),
				));
		}

		/* ---------------- Participants ---------------- */

		/** Same constraint as OssnCircles::addMember() — real confirmed friends only. */
		public function addParticipant($tripId, $actingGuid, $memberGuid) {
				$trip = $this->get($tripId);
				if (!$this->canEdit($trip, $actingGuid)) {
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
				if ($this->isParticipant($tripId, $memberGuid)) {
						return 'already_participant';
				}
				$ok = $this->insert(array(
						'into'   => self::PARTICIPANTS_TABLE,
						'names'  => array('trip_id', 'member_guid', 'time_created'),
						'values' => array(intval($tripId), $memberGuid, time()),
				));
				return $ok ? true : 'failed';
		}

		public function removeParticipant($tripId, $actingGuid, $memberGuid) {
				$trip = $this->get($tripId);
				if (!$this->canEdit($trip, $actingGuid)) {
						return false;
				}
				return parent::delete(array(
						'from'   => self::PARTICIPANTS_TABLE,
						'wheres' => array(
								self::wheres('trip_id', '=', intval($tripId)),
								self::wheres('member_guid', '=', intval($memberGuid)),
						),
				));
		}

		public function participants($tripId, $limit = 200) {
				$rows = $this->select(array(
						'from'     => self::PARTICIPANTS_TABLE,
						'wheres'   => array(self::wheres('trip_id', '=', intval($tripId))),
						'order_by' => 'time_created ASC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}
}
