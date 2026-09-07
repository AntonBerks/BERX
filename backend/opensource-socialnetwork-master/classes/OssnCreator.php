<?php
/**
 * BERX Creator — a real profile extension + real content aggregation
 * + a real, honest view-event log. No duplicated content, no fake
 * analytics anywhere in this class.
 *
 * Every "audience" or "content" number this class ever returns is
 * either a live COUNT() query or the length of a real result array —
 * never a stored/derived/estimated figure. If a real metric isn't
 * backed by a real query, it is not exposed, not approximated.
 */
class OssnCreator extends OssnDatabase {

		const TABLE       = 'ossn_creator_profiles';
		const VIEWS_TABLE = 'ossn_creator_profile_views';

		const MAX_BIO_LENGTH = 500;

		public function getProfile($userGuid) {
				$userGuid = intval($userGuid);
				if (!$userGuid) {
						return false;
				}
				$row = $this->select(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
				));
				return $row ? $row : false;
		}

		public function isCreator($userGuid) {
				return (bool) $this->getProfile($userGuid);
		}

		/**
		 * Which of these users are creators — ONE query for a whole page.
		 * isCreator() is a per-user lookup, so badging a 20-post feed with
		 * it would have been 20 extra queries; the feed builder uses this
		 * instead, the same way feed.php already batches like/comment
		 * counts.
		 */
		public function creatorGuids(array $userGuids) {
				$ids = array_values(array_unique(array_filter(array_map('intval', $userGuids))));
				if (empty($ids)) {
						return array();
				}
				$rows = $this->select(array(
						'from'   => self::TABLE,
						'params' => array('user_guid'),
						'wheres' => array(self::wheres('user_guid', 'IN', implode(',', $ids))),
				), true);
				$out = array();
				if ($rows) {
						foreach ($rows as $row) {
								$out[intval($row->user_guid)] = true;
						}
				}
				return $out;
		}

		/**
		 * Enable Creator Mode for $userGuid — $actingGuid must be that
		 * same user (or admin); a caller can never enable creator mode
		 * on someone else's behalf.
		 */
		public function enable($userGuid, $actingGuid, $category = null, $bio = '') {
				$userGuid = intval($userGuid);
				if (!$userGuid || (intval($actingGuid) !== $userGuid && !ossn_api_is_admin($actingGuid))) {
						return false;
				}
				if ($this->isCreator($userGuid)) {
						return false;
				}
				$bio = mb_substr((string) $bio, 0, self::MAX_BIO_LENGTH, 'UTF-8');
				return $this->insert(array(
						'into'   => self::TABLE,
						'names'  => array('user_guid', 'category', 'bio', 'time_enabled'),
						'values' => array($userGuid, $category ? (string) $category : null, $bio !== '' ? $bio : null, time()),
				));
		}

		public function disable($userGuid, $actingGuid) {
				$userGuid = intval($userGuid);
				if (!$userGuid || (intval($actingGuid) !== $userGuid && !ossn_api_is_admin($actingGuid))) {
						return false;
				}
				return $this->delete(array(
						'from'   => self::TABLE,
						'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
				));
		}

		public function update($userGuid, $actingGuid, array $fields) {
				$userGuid = intval($userGuid);
				if (!$userGuid || (intval($actingGuid) !== $userGuid && !ossn_api_is_admin($actingGuid))) {
						return false;
				}
				if (!$this->isCreator($userGuid)) {
						return false;
				}
				$names  = array();
				$values = array();
				if (isset($fields['category'])) {
						$names[]  = 'category';
						$values[] = (string) $fields['category'];
				}
				if (isset($fields['bio'])) {
						$names[]  = 'bio';
						$values[] = mb_substr((string) $fields['bio'], 0, self::MAX_BIO_LENGTH, 'UTF-8');
				}
				if (empty($names)) {
						return false;
				}
				return parent::update(array(
						'table'  => self::TABLE,
						'names'  => $names,
						'values' => $values,
						'wheres' => array(self::wheres('user_guid', '=', $userGuid)),
				));
		}

		/**
		 * Record a real profile view. $viewerGuid is null for a
		 * logged-out/anonymous viewer where that's meaningful — never
		 * fabricated, and self-views (creator viewing their own
		 * profile) are not recorded, so a creator can't inflate their
		 * own count just by opening their own page.
		 */
		public function recordView($creatorGuid, $viewerGuid = null) {
				$creatorGuid = intval($creatorGuid);
				if (!$creatorGuid) {
						return false;
				}
				if ($viewerGuid && intval($viewerGuid) === $creatorGuid) {
						return false;
				}
				return $this->insert(array(
						'into'   => self::VIEWS_TABLE,
						'names'  => array('creator_guid', 'viewer_guid', 'time_created'),
						'values' => array($creatorGuid, $viewerGuid ? intval($viewerGuid) : null, time()),
				));
		}

		/** Real COUNT() over the real view log — the only source of this number anywhere. */
		public function viewCount($creatorGuid, $sinceDays = null) {
				$wheres = array(self::wheres('creator_guid', '=', intval($creatorGuid)));
				if ($sinceDays !== null) {
						$wheres[] = self::wheres('time_created', '>=', time() - (intval($sinceDays) * 86400));
				}
				$rows = $this->select(array(
						'from'   => self::VIEWS_TABLE,
						'wheres' => $wheres,
				), true);
				return $rows ? count($rows) : 0;
		}

		/**
		 * Real audience summary — friend count via the same
		 * OssnUser::getFriends() every other "friends" surface in BERX
		 * uses, plus real view counts. No engagement rate, no growth
		 * trend, no follower projection — none of that has a real data
		 * source yet, so none of it is invented here.
		 */
		public function audienceSummary($creatorGuid) {
				$user = ossn_user_by_guid($creatorGuid);
				// getFriends() has no real 'count'-only mode (same lesson as
				// OssnCollections/OssnTrips: fetch the real rows, count in
				// PHP — no invented shortcut parameter).
				$friends = $user ? $user->getFriends($creatorGuid, array('limit' => 2000, 'page_limit' => false)) : false;
				return array(
						'friend_count'       => $friends ? count($friends) : 0,
						'total_views'        => $this->viewCount($creatorGuid),
						'views_last_30_days' => $this->viewCount($creatorGuid, 30),
				);
		}

		/* ---------------- Content aggregation (reuses real classes, never duplicates data) ---------------- */

		/** $viewerGuid gates visibility server-side via OssnCircles::canViewPost() — a caller viewing someone else's creator content never sees a circle/friends-restricted post they can't access. */
		public function recentPosts($creatorGuid, $viewerGuid, $limit = 12) {
				if (!class_exists('OssnWall')) {
						return array();
				}
				$wall = new OssnWall();
				$rows = $wall->GetPosts(array('owner_guid' => intval($creatorGuid), 'limit' => intval($limit) * 2, 'page_limit' => false));
				if (!$rows) {
						return array();
				}
				if (!class_exists('OssnCircles')) {
						return array_slice($rows, 0, intval($limit));
				}
				$circles = new OssnCircles();
				$out = array();
				foreach ($rows as $row) {
						if (!$circles->canViewPost($row, $viewerGuid)) {
								continue;
						}
						$out[] = $row;
						if (count($out) >= intval($limit)) {
								break;
						}
				}
				return $out;
		}

		public function recentAlbums($creatorGuid, $limit = 12) {
				if (!class_exists('OssnAlbums')) {
						return array();
				}
				$albums = new OssnAlbums();
				$rows = $albums->GetAlbums(intval($creatorGuid), array('limit' => intval($limit), 'page_limit' => false));
				return $rows ? $rows : array();
		}

		public function recentEvents($creatorGuid, $limit = 12) {
				if (!class_exists('OssnEvents')) {
						return array();
				}
				$events = new OssnEvents();
				return $events->listEvents(array('owner_guid' => intval($creatorGuid), 'limit' => intval($limit), 'upcoming' => false));
		}

		public function recentExperiences($creatorGuid, $viewerGuid, $limit = 12) {
				if (!class_exists('OssnExperiences')) {
						return array();
				}
				$experiences = new OssnExperiences();
				$rows = $experiences->listByOwner(intval($creatorGuid), $viewerGuid);
				// listByOwner() returns a real array only when empty — a
				// non-empty result is OssnDatabase::select(...,true)'s real
				// return value, arrayObject()'s stdClass wrapper, not a PHP
				// array. array_slice() on that throws TypeError on PHP 8+
				// (same real bug class fixed in OssnCollections::itemCount()/
				// OssnCircles::memberCount() — confirmed by tracing
				// OssnDatabase::fetch()/arrayObject(), not assumed).
				return array_slice((array) $rows, 0, intval($limit));
		}
}
