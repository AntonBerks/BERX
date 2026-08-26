<?php
/**
 * BERX Places — the real-world entity behind Discover/NOW/Business/
 * Trips/Experiences/Search. Built as a real OssnObject subtype
 * ('ossnplace'), the exact same OssnObject/ossn_object/entities-
 * metadata pattern OssnGroup ('ossngroup') already uses in production
 * — confirmed by reading components/OssnGroups/classes/OssnGroup.php
 * before writing this, not assumed. No new base table for the entity
 * itself (see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §3.5) — only
 * `ossn_place_reviews` is genuinely new (migration 1785170400.php).
 *
 * Coordinates live ONLY in OssnGeo (ossn_geo_index), never duplicated
 * into place metadata — one source of truth, per OssnGeo's own doc
 * comment ("the index can never drift from the entity it mirrors").
 *
 * Method naming avoids update()/delete() — see the documented
 * OssnDatabase self-recursion bug history this session (OssnCollections/
 * OssnCircles/OssnTrips/OssnExperiences/OssnBusiness).
 */
class OssnPlaces extends OssnObject {

	const SUBTYPE = 'ossnplace';
	const SAVE_RELATION = 'place:save';

	/* ---------------- Create / read ---------------- */

	/**
	 * @param int   $ownerGuid
	 * @param array $fields title(required), category(required),
	 *              description, address, phone, website, hours, price,
	 *              lat, lng (lat/lng optional but must arrive together)
	 * @return int|false new place guid
	 */
	public function createPlace($ownerGuid, array $fields) {
		$ownerGuid = intval($ownerGuid);
		$title     = isset($fields['title']) ? trim((string) $fields['title']) : '';
		$category  = isset($fields['category']) ? trim((string) $fields['category']) : '';
		if (!$ownerGuid || $title === '' || $category === '') {
			return false;
		}

		$this->owner_guid = $ownerGuid;
		$this->type       = 'user';
		$this->subtype    = self::SUBTYPE;
		$this->title      = mb_substr($title, 0, 255, 'UTF-8');
		$this->description = isset($fields['description']) ? trim((string) $fields['description']) : '';

		$this->data->category      = mb_substr($category, 0, 100, 'UTF-8');
		$this->data->address       = isset($fields['address']) ? trim((string) $fields['address']) : '';
		$this->data->phone         = isset($fields['phone']) ? trim((string) $fields['phone']) : '';
		$this->data->website       = isset($fields['website']) ? trim((string) $fields['website']) : '';
		$this->data->hours         = isset($fields['hours']) ? trim((string) $fields['hours']) : '';
		$this->data->price         = isset($fields['price']) ? intval($fields['price']) : 0;
		$this->data->is_business   = 0;
		$this->data->business_type = '';
		$this->data->verified      = 0;
		$this->data->cover_guid    = 0;

		$guid = $this->addObject();
		if (!$guid) {
			return false;
		}

		if (isset($fields['lat']) && isset($fields['lng']) && OssnGeo::isValidLat($fields['lat']) && OssnGeo::isValidLng($fields['lng'])) {
			(new OssnGeo())->setLocation($guid, 'place', $fields['lat'], $fields['lng']);
		}

		return $guid;
	}

	/**
	 * @param int      $guid
	 * @param int|null $viewerGuid for is_saved; null when caller has no
	 *                 real viewer context (e.g. ossn_api_resolve_item()).
	 * @return object|false hydrated place (see hydrate())
	 */
	public function getPlace($guid, $viewerGuid = null) {
		$guid = intval($guid);
		if (!$guid) {
			return false;
		}
		$this->object_guid = $guid;
		$place = $this->getObjectById();
		// Real OSSN precedent for this exact guard: OssnGroup::getGroup()
		// checks subtype the same way — getObjectById() fetches by guid
		// alone, so a guid belonging to a different subtype must be
		// rejected here, not returned as a place.
		if (!$place || !isset($place->subtype) || $place->subtype !== self::SUBTYPE) {
			return false;
		}
		return $this->hydrate($place, $viewerGuid);
	}

	/**
	 * @param array    $params q (title search), category, owner_guid, limit
	 * @param int|null $viewerGuid
	 * @return array real PHP array of hydrated places
	 */
	public function listPlaces(array $params, $viewerGuid = null) {
		$search = array(
			'subtype'    => self::SUBTYPE,
			'type'       => 'user',
			'limit'      => isset($params['limit']) ? intval($params['limit']) : 30,
			'page_limit' => false,
		);
		if (!empty($params['q'])) {
			$search['title'] = (string) $params['q'];
		}
		if (!empty($params['owner_guid'])) {
			$search['owner_guid'] = intval($params['owner_guid']);
		}
		if (!empty($params['category'])) {
			$search['entities_pairs'] = array(
				array('name' => 'category', 'value' => (string) $params['category']),
			);
		}
		$objects = $this->searchObject($search);
		if (!$objects) {
			return array();
		}
		$out = array();
		foreach ($objects as $object) {
			if (!isset($object->subtype) || $object->subtype !== self::SUBTYPE) {
				continue;
			}
			$out[] = $this->hydrate($object, $viewerGuid);
		}
		return $out;
	}

	/* ---------------- Update / delete ---------------- */

	public function canEditPlace($place, $actingGuid) {
		if (!$place || !$actingGuid) {
			return false;
		}
		if (ossn_isAdminLoggedin()) {
			return true;
		}
		if (intval($place->owner_guid) === intval($actingGuid)) {
			return true;
		}
		// A business place can also be managed by its real team
		// (OssnBusiness — already built, reused as-is, not duplicated).
		if (!empty($place->is_business) && class_exists('OssnBusiness')) {
			return (new OssnBusiness())->canManage($place, $actingGuid);
		}
		return false;
	}

	/**
	 * Partial update — only keys actually present in $fields are
	 * touched, matching client.ts's updatePlace() "only send what
	 * changed" contract.
	 *
	 * @return string 'ok'|'not_found'|'forbidden'|'invalid'
	 */
	public function updatePlace($guid, $actingGuid, array $fields) {
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		if (!$this->canEditPlace($place, $actingGuid)) {
			return 'forbidden';
		}

		$title       = array_key_exists('title', $fields) ? trim((string) $fields['title']) : $place->title;
		$description = array_key_exists('description', $fields) ? trim((string) $fields['description']) : $place->description;
		if ($title === '') {
			return 'invalid';
		}

		$this->data = new stdClass();
		if (array_key_exists('category', $fields)) {
			$category = trim((string) $fields['category']);
			if ($category === '') {
				return 'invalid';
			}
			$this->data->category = mb_substr($category, 0, 100, 'UTF-8');
		}
		if (array_key_exists('address', $fields)) {
			$this->data->address = trim((string) $fields['address']);
		}
		if (array_key_exists('phone', $fields)) {
			$this->data->phone = trim((string) $fields['phone']);
		}
		if (array_key_exists('website', $fields)) {
			$this->data->website = trim((string) $fields['website']);
		}
		if (array_key_exists('hours', $fields)) {
			$this->data->hours = trim((string) $fields['hours']);
		}
		if (array_key_exists('price', $fields)) {
			$this->data->price = intval($fields['price']);
		}

		$ok = $this->updateObject(array('title', 'description'), array(mb_substr($title, 0, 255, 'UTF-8'), $description), intval($guid));
		if (!$ok) {
			return 'invalid';
		}

		if (array_key_exists('lat', $fields) && array_key_exists('lng', $fields)) {
			if (OssnGeo::isValidLat($fields['lat']) && OssnGeo::isValidLng($fields['lng'])) {
				(new OssnGeo())->setLocation(intval($guid), 'place', $fields['lat'], $fields['lng']);
			}
		}
		return 'ok';
	}

	/** @return string 'ok'|'not_found'|'forbidden' */
	public function deletePlace($guid, $actingGuid) {
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		if (!$this->canEditPlace($place, $actingGuid)) {
			return 'forbidden';
		}
		$guid = intval($guid);
		// Reviews and geo-index are NOT cleaned up by OssnObject::
		// deleteObject() (it only clears ossn_object + this object's own
		// entities/metadata) — explicit here, matching client.ts's own
		// documented "deletes the place's reviews and geo-index entry
		// server-side too" contract for DELETE /places/{guid}.
		parent::delete(array(
			'from'   => 'ossn_place_reviews',
			'wheres' => array(self::wheres('place_guid', '=', $guid)),
		));
		(new OssnGeo())->deleteLocation($guid);
		return $this->deleteObject($guid) ? 'ok' : 'not_found';
	}

	/* ---------------- Save / unsave (real friend-style relation, no new table) ---------------- */

	public function isSaved($guid, $userGuid) {
		if (!$userGuid) {
			return false;
		}
		return ossn_relation_exists(intval($userGuid), intval($guid), self::SAVE_RELATION);
	}

	public function savePlace($guid, $userGuid) {
		if ($this->isSaved($guid, $userGuid)) {
			return true;
		}
		return (bool) ossn_add_relation(intval($userGuid), intval($guid), self::SAVE_RELATION);
	}

	public function unsavePlace($guid, $userGuid) {
		return (bool) ossn_delete_relationship(array(
			'from' => intval($userGuid),
			'to'   => intval($guid),
			'type' => self::SAVE_RELATION,
		));
	}

	/** @return array real PHP array of hydrated places the user saved */
	public function savedPlaces($userGuid, $viewerGuid = null) {
		// page_limit=false bypasses ossn_get_relationships()'s default
		// 10-per-page gate (confirmed via OssnDatabase::generateLimit():
		// with page_limit===false it returns false, and the caller then
		// uses the raw 'limit' value directly) — without it this would
		// silently cap at 10 saved places instead of the 100 asked for.
		$rows = ossn_get_relationships(array('from' => intval($userGuid), 'type' => self::SAVE_RELATION, 'limit' => 100, 'page_limit' => false));
		if (!$rows) {
			return array();
		}
		$out = array();
		foreach ($rows as $row) {
			$place = $this->getPlace($row->relation_to, $viewerGuid);
			if ($place) {
				$out[] = $place;
			}
		}
		return $out;
	}

	/* ---------------- Reviews (ossn_place_reviews — the one genuinely new table) ---------------- */

	/** @return int|string new review id, or 'forbidden'|'duplicate'|'invalid' */
	public function addReview($placeGuid, $authorGuid, $rating, $text = '') {
		$place = $this->getPlace($placeGuid);
		if (!$place) {
			return 'invalid';
		}
		$rating = intval($rating);
		if ($rating < 1 || $rating > 5) {
			return 'invalid';
		}
		if (intval($place->owner_guid) === intval($authorGuid)) {
			// A place owner reviewing their own place would make rating
			// meaningless as a trust signal — real 403, not silently allowed.
			return 'forbidden';
		}
		if ($this->hasReviewed($placeGuid, $authorGuid)) {
			return 'duplicate';
		}
		$ok = $this->insert(array(
			'into'   => 'ossn_place_reviews',
			'names'  => array('place_guid', 'author_guid', 'rating', 'text', 'time_created'),
			'values' => array(intval($placeGuid), intval($authorGuid), $rating, mb_substr(trim((string) $text), 0, 2000, 'UTF-8'), time()),
		));
		if (!$ok) {
			return 'invalid';
		}
		$id = $this->getLastEntry();
		// Real EARN wiring — the review itself IS the one-time reward
		// trigger (reason keyed on the review's own real, unique id), not
		// a second, separate claim step. Reuses OssnPoints, never a
		// parallel reward mechanism.
		if (class_exists('OssnPoints')) {
			(new OssnPoints())->award(intval($authorGuid), 15, "place_review:{$id}", $id, true);
		}
		return $id;
	}

	public function hasReviewed($placeGuid, $authorGuid) {
		$row = $this->select(array(
			'from'   => 'ossn_place_reviews',
			'wheres' => array(
				self::wheres('place_guid', '=', intval($placeGuid)),
				self::wheres('author_guid', '=', intval($authorGuid)),
			),
		));
		return (bool) $row;
	}

	/** @return array real PHP array of raw review rows, newest first */
	public function reviews($placeGuid, $limit = 50) {
		$rows = $this->select(array(
			'from'     => 'ossn_place_reviews',
			'wheres'   => array(self::wheres('place_guid', '=', intval($placeGuid))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? (array) $rows : array();
	}

	/** @return array ['rating'=>float 0-5 rounded to 1 decimal, 'count'=>int] — always a real live aggregate, never cached. */
	public function ratingSummary($placeGuid) {
		$row = $this->select(array(
			'from'   => 'ossn_place_reviews',
			'params' => array('AVG(rating) as avg_rating', 'COUNT(*) as cnt'),
			'wheres' => array(self::wheres('place_guid', '=', intval($placeGuid))),
		));
		if (!$row || !intval($row->cnt)) {
			return array('rating' => 0.0, 'count' => 0);
		}
		return array('rating' => round(floatval($row->avg_rating), 1), 'count' => intval($row->cnt));
	}

	/** Raw review row by id — used by business.php to resolve a review's place before checking OssnBusiness::canReply(). @return object|false */
	public function reviewById($id) {
		$row = $this->select(array(
			'from'   => 'ossn_place_reviews',
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	const VALID_BUSINESS_TYPES = array('restaurant', 'cafe', 'bar', 'hotel', 'shop', 'beauty', 'fitness', 'entertainment', 'events', 'services', 'creators', 'other');

	/** @return string 'ok'|'not_found'|'forbidden'|'invalid' */
	public function setBusinessType($guid, $actingGuid, $type) {
		if (!in_array((string) $type, self::VALID_BUSINESS_TYPES, true)) {
			return 'invalid';
		}
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		if (!$this->canEditPlace($place, $actingGuid)) {
			return 'forbidden';
		}
		$this->data = new stdClass();
		$this->data->business_type = (string) $type;
		$ok = $this->updateObject(array('title', 'description'), array($place->title, $place->description), intval($guid));
		return $ok ? 'ok' : 'forbidden';
	}

	/* ---------------- Business (thin — reuses already-existing OssnBusiness for claims/team/subscription) ---------------- */

	/** @return string 'ok'|'not_found'|'forbidden' */
	public function setBusinessEnabled($guid, $actingGuid, $enabled) {
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		if (!$this->canEditPlace($place, $actingGuid)) {
			return 'forbidden';
		}
		$this->data = new stdClass();
		$this->data->is_business = $enabled ? 1 : 0;
		$ok = $this->updateObject(array('title', 'description'), array($place->title, $place->description), intval($guid));
		return $ok ? 'ok' : 'forbidden';
	}

	/** Admin-only — enforced here, not just left to the caller. @return string 'ok'|'not_found'|'forbidden' */
	public function setVerified($guid, $verified) {
		if (!ossn_isAdminLoggedin()) {
			return 'forbidden';
		}
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		$this->data = new stdClass();
		$this->data->verified = $verified ? 1 : 0;
		$ok = $this->updateObject(array('title', 'description'), array($place->title, $place->description), intval($guid));
		return $ok ? 'ok' : 'forbidden';
	}

	public function setCover($guid, $actingGuid, $assetGuid) {
		$place = $this->getPlace($guid);
		if (!$place) {
			return 'not_found';
		}
		if (!$this->canEditPlace($place, $actingGuid)) {
			return 'forbidden';
		}
		$this->data = new stdClass();
		$this->data->cover_guid = intval($assetGuid);
		$ok = $this->updateObject(array('title', 'description'), array($place->title, $place->description), intval($guid));
		return $ok ? 'ok' : 'forbidden';
	}

	/* ---------------- Hydration ---------------- */

	/**
	 * Merges OssnGeo coordinates + real cover URL + real rating
	 * aggregate + is_saved onto the raw getObjectById()/searchObject()
	 * result. Field set matches BerxPlace in client/packages/api/src/
	 * types.ts exactly.
	 */
	private function hydrate($place, $viewerGuid = null) {
		$geo = (new OssnGeo())->getLocation($place->guid);
		$place->lat = $geo ? floatval($geo->lat) : null;
		$place->lng = $geo ? floatval($geo->lng) : null;

		$place->category      = isset($place->category) ? (string) $place->category : null;
		$place->address       = !empty($place->address) ? (string) $place->address : null;
		$place->phone         = !empty($place->phone) ? (string) $place->phone : null;
		$place->website       = !empty($place->website) ? (string) $place->website : null;
		$place->hours         = !empty($place->hours) ? (string) $place->hours : null;
		$place->price         = isset($place->price) && $place->price !== '' ? intval($place->price) : null;
		$place->is_business    = !empty($place->is_business);
		$place->business_type  = !empty($place->business_type) ? (string) $place->business_type : null;
		$place->verified       = !empty($place->verified);

		$coverGuid = !empty($place->cover_guid) ? intval($place->cover_guid) : 0;
		// NOT ossn_api_media_asset_url() — that helper is defined inside
		// v1/media.php, and only one v1/*.php is ever include()'d per
		// request (see ossn_com.php's dispatcher doc comment), so it
		// does not exist on a places.php request. Same real streaming
		// route (themes/berx/ossn_theme.php's ossn_berx_media_page_handler(),
		// page handler 'media' -> /media/get/{guid}), built inline here
		// instead of depending on media.php ever being loaded.
		$place->cover_url = $coverGuid ? ossn_site_url("media/get/{$coverGuid}") : null;
		unset($place->cover_guid);

		$rating = $this->ratingSummary($place->guid);
		$place->rating       = $rating['rating'];
		$place->rating_count = $rating['count'];

		$place->is_saved = $this->isSaved($place->guid, $viewerGuid);
		$place->owner_guid = intval($place->owner_guid);
		$place->guid = intval($place->guid);

		return $place;
	}
}
