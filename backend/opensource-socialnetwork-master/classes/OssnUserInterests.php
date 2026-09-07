<?php
/**
 * BERX User Interests — the real store behind onboarding's interest
 * picker and behind "для вас" ranking.
 *
 * The vocabulary is NOT a new taxonomy: every slug written here is
 * validated against ossn_api_place_categories() — the same whitelist
 * GET /places/categories and GET /events/categories already serve — so
 * a chosen interest means exactly the same thing everywhere in BERX.
 *
 * Reads are batched by design: forGuids() answers a whole page of
 * users in one query, for the same reason OssnCreator::creatorGuids()
 * exists (see its header) — a per-user lookup inside a list render is
 * an N+1 waiting to happen.
 */
class OssnUserInterests extends OssnDatabase {

		const TABLE = 'ossn_user_interests';

		/** A single account cannot meaningfully "be into" everything. */
		const MAX_PER_USER = 12;

		/**
		 * The real, shared category whitelist. Returns slug => label.
		 * Falls back to an empty map if the API bootstrap that owns the
		 * list is not loaded, so this class never invents its own copy of
		 * the taxonomy — an unvalidatable write is refused instead.
		 */
		public static function vocabulary() {
				if (!function_exists('ossn_api_place_categories')) {
						return array();
				}
				$out = array();
				foreach (ossn_api_place_categories() as $row) {
						$out[(string) $row['slug']] = (string) $row['label'];
				}
				return $out;
		}

		public static function isValidCategory($slug) {
				$vocab = self::vocabulary();
				return isset($vocab[(string) $slug]);
		}

		/** Real chosen slugs for one user, in the order they were saved. */
		public function get($userGuid) {
				$userGuid = intval($userGuid);
				if (!$userGuid) {
						return array();
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'params'   => array('category'),
						'wheres'   => array(self::wheres('user_guid', '=', $userGuid)),
						'order_by' => 'id ASC',
				), true);
				$out = array();
				if ($rows) {
						foreach ($rows as $row) {
								$out[] = (string) $row->category;
						}
				}
				return $out;
		}

		/**
		 * Which of these users chose which interests — ONE query for a
		 * whole page. Returns guid => array of slugs.
		 */
		public function forGuids(array $userGuids) {
				$ids = array_values(array_unique(array_filter(array_map('intval', $userGuids))));
				if (empty($ids)) {
						return array();
				}
				$rows = $this->select(array(
						'from'     => self::TABLE,
						'params'   => array('user_guid', 'category'),
						'wheres'   => array(self::wheres('user_guid', 'IN', implode(',', $ids))),
						'order_by' => 'id ASC',
				), true);
				$out = array();
				if ($rows) {
						foreach ($rows as $row) {
								$guid = intval($row->user_guid);
								if (!isset($out[$guid])) {
										$out[$guid] = array();
								}
								$out[$guid][] = (string) $row->category;
						}
				}
				return $out;
		}

		/**
		 * Replace a user's whole interest set with $categories.
		 *
		 * Every slug is checked against the shared whitelist first and an
		 * unknown one makes the WHOLE call fail — a partial save would
		 * leave the user looking at a picker whose state no longer matches
		 * what the server holds. Returns the saved slugs, or false when
		 * validation rejected the input.
		 */
		public function set($userGuid, array $categories) {
				$userGuid = intval($userGuid);
				if (!$userGuid) {
						return false;
				}
				$clean = array();
				foreach ($categories as $slug) {
						$slug = trim((string) $slug);
						if ($slug === '') {
								continue;
						}
						if (!self::isValidCategory($slug)) {
								return false;
						}
						if (!in_array($slug, $clean, true)) {
								$clean[] = $slug;
						}
				}
				if (count($clean) > self::MAX_PER_USER) {
						return false;
				}
				// Replace, not merge: the picker sends the user's full current
				// selection, so a slug that is absent was deliberately removed.
				$this->delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
				));
				$now = time();
				foreach ($clean as $slug) {
						$this->insert(array(
								'into'   => self::TABLE,
								'names'  => array('user_guid', 'category', 'time_created'),
								'values' => array($userGuid, $slug, $now),
						));
				}
				return $clean;
		}
}
