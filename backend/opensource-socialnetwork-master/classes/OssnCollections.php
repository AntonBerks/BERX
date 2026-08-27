<?php
/**
 * BERX Collections — user-owned named lists of saved items.
 *
 * AUTHORIZATION MODEL (enforced here, not in the API layer, so the
 * web and API surfaces can never drift):
 *  - create/update/delete/addItem/removeItem: owner only (or admin).
 *    Every mutating method takes an explicit $actingGuid and checks it
 *    against the STORED owner_guid, never against anything a caller
 *    asserts about itself.
 *  - read: owner sees everything; anyone else sees only visibility =
 *    VISIBILITY_PUBLIC. There is no "shared with specific people"
 *    tier — that would need its own table, and a half-built ACL is
 *    worse than an honest two-state one.
 *
 * ITEM TYPES are a hard whitelist. 'place'/'event' resolve against the
 * real OssnPlaces/OssnEvents classes and 'post' against OssnWall, so
 * an item can only be added if the referenced object actually exists —
 * a collection can never contain a dangling guid at insert time.
 * (Items whose target is deleted LATER are filtered on read rather
 * than silently 404-ing the whole collection.)
 */
class OssnCollections extends OssnDatabase {

		const TABLE       = 'ossn_collections';
		const ITEMS_TABLE = 'ossn_collection_items';

		const VISIBILITY_PRIVATE = 1;
		const VISIBILITY_PUBLIC  = 2;

		/** Server-side whitelist. A client-supplied type outside this set is rejected. */
		public static function itemTypes() {
				return array('place', 'event', 'post');
		}

		public static function isValidItemType($type) {
				return in_array((string) $type, self::itemTypes(), true);
		}

		public static function isValidVisibility($visibility) {
				return in_array(intval($visibility), array(self::VISIBILITY_PRIVATE, self::VISIBILITY_PUBLIC), true);
		}

		/**
		 * Confirm the referenced object really exists before letting it
		 * into a collection.
		 */
		public static function itemExists($type, $guid) {
				$guid = intval($guid);
				if (!$guid || !self::isValidItemType($type)) {
						return false;
				}
				if ($type === 'place') {
						if (!class_exists('OssnPlaces')) {
								return false;
						}
						$model = new OssnPlaces;
						return (bool) $model->getPlace($guid);
				}
				if ($type === 'event') {
						if (!class_exists('OssnEvents')) {
								return false;
						}
						$model = new OssnEvents;
						return (bool) $model->getEvent($guid);
				}
				if ($type === 'post') {
						if (!class_exists('OssnWall')) {
								return false;
						}
						$model = new OssnWall;
						return (bool) $model->GetPost($guid);
				}
				return false;
		}

		/* ---------------- Collections ---------------- */

		public function create($ownerGuid, $title, $description = '', $visibility = self::VISIBILITY_PRIVATE) {
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
						'names'  => array('owner_guid', 'title', 'description', 'visibility', 'time_created', 'time_updated'),
						'values' => array($ownerGuid, $title, (string) $description, intval($visibility), $now, $now),
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
		 * Whether $viewerGuid may READ this collection.
		 */
		/**
		 * MAX BUILD -- real fix, same class of bug found/fixed elsewhere
		 * this session: ossn_isAdminLoggedin() reads $_SESSION, never
		 * populated for a bearer-token API request.
		 */
		public function canView($collection, $viewerGuid) {
				if (!$collection) {
						return false;
				}
				if (intval($collection->visibility) === self::VISIBILITY_PUBLIC) {
						return true;
				}
				if (ossn_api_is_admin($viewerGuid)) {
						return true;
				}
				return intval($collection->owner_guid) === intval($viewerGuid);
		}

		/**
		 * Whether $actingGuid may MUTATE this collection. Owner or admin
		 * only — public visibility grants read, never write.
		 */
		public function canEdit($collection, $actingGuid) {
				if (!$collection || !$actingGuid) {
						return false;
				}
				if (ossn_api_is_admin($actingGuid)) {
						return true;
				}
				return intval($collection->owner_guid) === intval($actingGuid);
		}

		/**
		 * Collections owned by $ownerGuid, filtered for what
		 * $viewerGuid is allowed to see.
		 */
		public function listByOwner($ownerGuid, $viewerGuid, $limit = 50) {
				$ownerGuid = intval($ownerGuid);
				if (!$ownerGuid) {
						return array();
				}
				$wheres = array(self::wheres('owner_guid', '=', $ownerGuid));
				// Someone viewing another user's collections only ever sees
				// public ones — enforced in the QUERY, not by filtering a
				// fuller result set in PHP afterwards.
				if (intval($viewerGuid) !== $ownerGuid && !ossn_api_is_admin($viewerGuid)) {
						$wheres[] = self::wheres('visibility', '=', self::VISIBILITY_PUBLIC);
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'wheres'   => $wheres,
						'order_by' => 'time_updated DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		public function update($id, $actingGuid, array $fields) {
				$collection = $this->get($id);
				if (!$this->canEdit($collection, $actingGuid)) {
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
				$collection = $this->get($id);
				if (!$this->canEdit($collection, $actingGuid)) {
						return false;
				}
				// Items go first — leaving orphaned rows pointing at a
				// deleted collection would make the items table grow
				// forever and break "which collections contain X".
				parent::delete(array(
						'from'   => self::ITEMS_TABLE,
						'wheres' => array(self::wheres('collection_id', '=', intval($id))),
				));
				return parent::delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('id', '=', intval($id))),
				));
		}

		/* ---------------- Items ---------------- */

		public function addItem($collectionId, $actingGuid, $itemType, $itemGuid) {
				$collection = $this->get($collectionId);
				if (!$this->canEdit($collection, $actingGuid)) {
						return 'forbidden';
				}
				if (!self::isValidItemType($itemType)) {
						return 'invalid_type';
				}
				if (!self::itemExists($itemType, $itemGuid)) {
						return 'item_not_found';
				}
				if ($this->hasItem($collectionId, $itemType, $itemGuid)) {
						// The DB unique key would reject this anyway; checking
						// first turns a driver error into a clean, typed result.
						return 'already_added';
				}
				$ok = $this->insert(array(
						'into'   => self::ITEMS_TABLE,
						'names'  => array('collection_id', 'item_type', 'item_guid', 'time_created'),
						'values' => array(intval($collectionId), (string) $itemType, intval($itemGuid), time()),
				));
				if (!$ok) {
						return 'failed';
				}
				$this->touch($collectionId);
				return true;
		}

		public function hasItem($collectionId, $itemType, $itemGuid) {
				$row = $this->select(array(
						'from'   => self::ITEMS_TABLE,
						'wheres' => array(
								self::wheres('collection_id', '=', intval($collectionId)),
								self::wheres('item_type', '=', (string) $itemType),
								self::wheres('item_guid', '=', intval($itemGuid)),
						),
				));
				return (bool) $row;
		}

		public function removeItem($collectionId, $actingGuid, $itemType, $itemGuid) {
				$collection = $this->get($collectionId);
				if (!$this->canEdit($collection, $actingGuid)) {
						return false;
				}
				$ok = parent::delete(array(
						'from'   => self::ITEMS_TABLE,
						'wheres' => array(
								self::wheres('collection_id', '=', intval($collectionId)),
								self::wheres('item_type', '=', (string) $itemType),
								self::wheres('item_guid', '=', intval($itemGuid)),
						),
				));
				if ($ok) {
						$this->touch($collectionId);
				}
				return $ok;
		}

		public function items($collectionId, $limit = 200) {
				$rows = $this->select(array(
						'from'     => self::ITEMS_TABLE,
						'wheres'   => array(self::wheres('collection_id', '=', intval($collectionId))),
						'order_by' => 'time_created DESC',
						'limit'    => intval($limit),
				), true);
				return $rows ? $rows : array();
		}

		public function itemCount($collectionId) {
				// Same real bug class as OssnCircles::memberCount() — see its
				// comment. items() returns a real array only on the empty
				// branch; a non-empty result is select(..., true)'s stdClass
				// wrapper, and count() on that throws TypeError on PHP 8+.
				return count((array) $this->items($collectionId, 1000));
		}

		/** Keeps time_updated meaningful as "last time contents changed". */
		private function touch($collectionId) {
				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => array('time_updated'),
						'values' => array(time()),
						'wheres' => array(self::wheres('id', '=', intval($collectionId))),
				));
		}
}
