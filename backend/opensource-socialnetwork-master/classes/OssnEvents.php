<?php
/**
 * BERX Events — same real OssnObject pattern as OssnPlaces
 * (type='user', subtype='ossnevent'), no new base table for the
 * entity itself (see docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §3.5).
 *
 * "Going" attendance reuses the existing `ossn_relationships` table
 * (type 'event:going') — no new table, same mechanism OssnPlaces uses
 * for save/unsave and core already uses for 'friend:request'.
 *
 * Geo: an event has NO independent lat/lng input in the real client
 * contract (client.ts's createEvent()/updateEvent() only accept
 * `location` free text and an optional `placeGuid`) — so an event is
 * only indexed in OssnGeo (for Nearby) when it's linked to a real
 * Place that itself has coordinates. An event with no place, or a
 * place with no coordinates, honestly gets no map pin rather than a
 * guessed one.
 *
 * Method naming avoids update()/delete() — see the documented
 * OssnDatabase self-recursion bug history this session.
 */
class OssnEvents extends OssnObject {

	const SUBTYPE = 'ossnevent';
	const GOING_RELATION = 'event:going';

	/* ---------------- Create / read ---------------- */

	/**
	 * @param int   $ownerGuid
	 * @param array $fields title, category (required), starts (required,
	 *              unix ts or parseable string), ends, description,
	 *              location, place_guid, capacity
	 * @return int|false new event guid
	 */
	public function createEvent($ownerGuid, array $fields) {
		$ownerGuid = intval($ownerGuid);
		$title     = isset($fields['title']) ? trim((string) $fields['title']) : '';
		$category  = isset($fields['category']) ? trim((string) $fields['category']) : '';
		$starts    = isset($fields['starts']) ? self::parseTime($fields['starts']) : null;
		if (!$ownerGuid || $title === '' || $category === '' || !$starts) {
			return false;
		}
		$ends = isset($fields['ends']) ? self::parseTime($fields['ends']) : null;
		if ($ends !== null && $ends <= $starts) {
			// Same honest rejection as OssnPlaceHours::replaceSchedule()'s
			// close<=open guard — a nonsense interval is refused, not
			// silently stored.
			return false;
		}

		$this->owner_guid  = $ownerGuid;
		$this->type        = 'user';
		$this->subtype     = self::SUBTYPE;
		$this->title       = mb_substr($title, 0, 255, 'UTF-8');
		$this->description = isset($fields['description']) ? trim((string) $fields['description']) : '';

		$placeGuid = isset($fields['place_guid']) ? intval($fields['place_guid']) : 0;

		$this->data->category   = mb_substr($category, 0, 100, 'UTF-8');
		$this->data->starts     = $starts;
		$this->data->ends       = $ends ? $ends : 0;
		$this->data->location   = isset($fields['location']) ? trim((string) $fields['location']) : '';
		$this->data->place_guid = $placeGuid;
		$this->data->capacity   = isset($fields['capacity']) ? max(0, intval($fields['capacity'])) : 0;
		$this->data->cover_guid = 0;

		$guid = $this->addObject();
		if (!$guid) {
			return false;
		}
		$this->indexLocation($guid, $placeGuid);
		return $guid;
	}

	public function getEvent($guid, $viewerGuid = null) {
		$guid = intval($guid);
		if (!$guid) {
			return false;
		}
		$this->object_guid = $guid;
		$event = $this->getObjectById();
		// Same real guard OssnGroup::getGroup()/OssnPlaces::getPlace()
		// already use: getObjectById() fetches by guid alone.
		if (!$event || !isset($event->subtype) || $event->subtype !== self::SUBTYPE) {
			return false;
		}
		return $this->hydrate($event, $viewerGuid);
	}

	/**
	 * @param array $params q, category, past(bool), limit
	 *
	 * Filtering by starts/ends is done in PHP after a bounded fetch
	 * (like OssnGeo::near()'s box-then-exact-pass), not as a raw SQL
	 * comparison against ossn_entities_metadata.value — that column is
	 * TEXT, and comparing it numerically in SQL would silently do a
	 * lexicographic string compare instead. Real, disclosed scale
	 * limit: the pre-filter fetch is capped at 200 events.
	 */
	public function listEvents(array $params, $viewerGuid = null) {
		$search = array(
			'subtype'    => self::SUBTYPE,
			'type'       => 'user',
			'limit'      => 200,
			'page_limit' => false,
		);
		if (!empty($params['q'])) {
			$search['title'] = (string) $params['q'];
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
		$wantPast = !empty($params['past']);
		$out = array();
		foreach ($objects as $object) {
			if (!isset($object->subtype) || $object->subtype !== self::SUBTYPE) {
				continue;
			}
			$hydrated = $this->hydrate($object, $viewerGuid);
			if ($wantPast !== $hydrated->has_ended) {
				continue;
			}
			$out[] = $hydrated;
		}
		usort($out, function ($a, $b) use ($wantPast) {
			return $wantPast ? ($b->starts <=> $a->starts) : ($a->starts <=> $b->starts);
		});
		$limit = isset($params['limit']) ? intval($params['limit']) : 30;
		return array_slice($out, 0, $limit);
	}

	/** @return array real PHP array of hydrated events the user has RSVP'd to, soonest first */
	public function goingEvents($userGuid, $viewerGuid = null) {
		$rows = ossn_get_relationships(array('from' => intval($userGuid), 'type' => self::GOING_RELATION, 'limit' => 100, 'page_limit' => false));
		if (!$rows) {
			return array();
		}
		$out = array();
		foreach ($rows as $row) {
			$event = $this->getEvent($row->relation_to, $viewerGuid);
			if ($event) {
				$out[] = $event;
			}
		}
		usort($out, function ($a, $b) {
			return $a->starts <=> $b->starts;
		});
		return $out;
	}

	/* ---------------- Update / delete ---------------- */

	public function canEditEvent($event, $actingGuid) {
		if (!$event || !$actingGuid) {
			return false;
		}
		if (ossn_isAdminLoggedin()) {
			return true;
		}
		return intval($event->owner_guid) === intval($actingGuid);
	}

	/** @return string 'ok'|'not_found'|'forbidden'|'invalid' */
	public function updateEvent($guid, $actingGuid, array $fields) {
		$event = $this->getEvent($guid);
		if (!$event) {
			return 'not_found';
		}
		if (!$this->canEditEvent($event, $actingGuid)) {
			return 'forbidden';
		}

		$title       = array_key_exists('title', $fields) ? trim((string) $fields['title']) : $event->title;
		$description = array_key_exists('description', $fields) ? trim((string) $fields['description']) : $event->description;
		if ($title === '') {
			return 'invalid';
		}
		$starts = array_key_exists('starts', $fields) ? self::parseTime($fields['starts']) : $event->starts;
		if (!$starts) {
			return 'invalid';
		}
		$ends = array_key_exists('ends', $fields) ? self::parseTime($fields['ends']) : $event->ends;
		if ($ends !== null && $ends <= $starts) {
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
		$this->data->starts = $starts;
		$this->data->ends   = $ends ? $ends : 0;
		if (array_key_exists('location', $fields)) {
			$this->data->location = trim((string) $fields['location']);
		}
		$placeChanged = array_key_exists('place_guid', $fields);
		if ($placeChanged) {
			$this->data->place_guid = intval($fields['place_guid']);
		}
		if (array_key_exists('capacity', $fields)) {
			$this->data->capacity = max(0, intval($fields['capacity']));
		}

		$ok = $this->updateObject(array('title', 'description'), array(mb_substr($title, 0, 255, 'UTF-8'), $description), intval($guid));
		if (!$ok) {
			return 'invalid';
		}
		if ($placeChanged) {
			$this->indexLocation(intval($guid), intval($fields['place_guid']));
		}
		return 'ok';
	}

	/** @return string 'ok'|'not_found'|'forbidden' */
	public function deleteEvent($guid, $actingGuid) {
		$event = $this->getEvent($guid);
		if (!$event) {
			return 'not_found';
		}
		if (!$this->canEditEvent($event, $actingGuid)) {
			return 'forbidden';
		}
		$guid = intval($guid);
		(new OssnGeo())->deleteLocation($guid);
		parent::delete(array(
			'from'   => 'ossn_relationships',
			'wheres' => array(
				self::wheres('relation_to', '=', $guid),
				self::wheres('type', '=', self::GOING_RELATION),
			),
		));
		return $this->deleteObject($guid) ? 'ok' : 'not_found';
	}

	/* ---------------- RSVP / attendance (real relation, no new table) ---------------- */

	public function isGoing($eventGuid, $userGuid) {
		if (!$userGuid) {
			return false;
		}
		return ossn_relation_exists(intval($userGuid), intval($eventGuid), self::GOING_RELATION);
	}

	public function attendeeCount($eventGuid) {
		$c = ossn_get_relationships(array('to' => intval($eventGuid), 'type' => self::GOING_RELATION, 'count' => true));
		return $c ? intval($c) : 0;
	}

	/**
	 * Real rows (relation_from = attendee guid) — resolved to user
	 * JSON by the caller (events.php), same file-split as places.php's
	 * review-author resolution.
	 *
	 * @return array
	 */
	public function attendees($eventGuid, $limit = 50) {
		$rows = ossn_get_relationships(array('to' => intval($eventGuid), 'type' => self::GOING_RELATION, 'limit' => intval($limit), 'page_limit' => false));
		return $rows ? $rows : array();
	}

	/**
	 * @return string 'ok'|'not_found'|'ended'|'already_going'|'full'|'rsvp_failed'
	 * Matches BerxRsvpErrorCode in client/packages/api/src/types.ts
	 * ('forbidden' is part of that union but never returned here — no
	 * private/invite-only event concept exists yet in this slice; a
	 * disclosed gap, not a fabricated rule).
	 */
	public function rsvp($eventGuid, $userGuid) {
		$event = $this->getEvent($eventGuid);
		if (!$event) {
			return 'not_found';
		}
		if ($event->has_ended) {
			return 'ended';
		}
		if ($this->isGoing($eventGuid, $userGuid)) {
			return 'already_going';
		}
		if ($event->capacity !== null) {
			// Recounted immediately before insert — matches client.ts's
			// documented "capacity is re-counted server-side immediately
			// before insert" guarantee, not a stale count from $event.
			if ($this->attendeeCount($eventGuid) >= $event->capacity) {
				return 'full';
			}
		}
		if (!ossn_add_relation(intval($userGuid), intval($eventGuid), self::GOING_RELATION)) {
			return 'rsvp_failed';
		}
		// Real EARN wiring — reason keyed per real event, so re-RSVPing
		// this SAME event (after a cancel) never re-earns, but a real
		// RSVP to a DIFFERENT event does. Reuses OssnPoints, never a
		// parallel reward mechanism.
		if (class_exists('OssnPoints')) {
			(new OssnPoints())->award(intval($userGuid), 10, 'rsvp_event:' . intval($eventGuid), intval($eventGuid), true);
		}
		return 'ok';
	}

	public function cancelRsvp($eventGuid, $userGuid) {
		return (bool) ossn_delete_relationship(array(
			'from' => intval($userGuid),
			'to'   => intval($eventGuid),
			'type' => self::GOING_RELATION,
		));
	}

	/**
	 * Real, server-enforced friendship check — never trusts the caller.
	 * Deliberately does NOT persist an invite record or send a
	 * notification: no 'event:invite' notification type/hook exists
	 * yet (registering one is its own small slice, not bundled here —
	 * see OssnNotifications::add()'s real dependency on a registered
	 * 'notification:add' hook per type). The real, working part of
	 * this contract — that only an actual friend can be targeted — is
	 * enforced here.
	 *
	 * @return string 'ok'|'not_found'|'forbidden'
	 */
	public function invite($eventGuid, $actingGuid, $targetGuid) {
		$event = $this->getEvent($eventGuid);
		if (!$event) {
			return 'not_found';
		}
		$acting = ossn_user_by_guid($actingGuid);
		if (!$acting || !$acting->isFriend(intval($actingGuid), intval($targetGuid))) {
			return 'forbidden';
		}
		return 'ok';
	}

	public function setCover($guid, $actingGuid, $assetGuid) {
		$event = $this->getEvent($guid);
		if (!$event) {
			return 'not_found';
		}
		if (!$this->canEditEvent($event, $actingGuid)) {
			return 'forbidden';
		}
		$this->data = new stdClass();
		$this->data->cover_guid = intval($assetGuid);
		$ok = $this->updateObject(array('title', 'description'), array($event->title, $event->description), intval($guid));
		return $ok ? 'ok' : 'forbidden';
	}

	/* ---------------- Internal ---------------- */

	private static function parseTime($v) {
		if ($v === null || $v === '') {
			return null;
		}
		if (is_numeric($v)) {
			return intval($v);
		}
		$ts = strtotime((string) $v);
		return $ts !== false ? $ts : null;
	}

	private function indexLocation($eventGuid, $placeGuid) {
		$geo = new OssnGeo();
		$geo->deleteLocation($eventGuid);
		if ($placeGuid && class_exists('OssnPlaces')) {
			$place = (new OssnPlaces())->getPlace($placeGuid);
			if ($place && $place->lat !== null && $place->lng !== null) {
				$geo->setLocation($eventGuid, 'event', $place->lat, $place->lng);
			}
		}
	}

	/**
	 * Field set matches BerxEvent in client/packages/api/src/types.ts
	 * exactly. has_ended: when a real `ends` is set, that's the
	 * boundary; an event with no explicit end is considered ended once
	 * its own start time passes (a point-in-time event, not an
	 * all-day guess).
	 */
	private function hydrate($event, $viewerGuid = null) {
		$event->category = isset($event->category) ? (string) $event->category : null;
		$event->starts   = isset($event->starts) ? intval($event->starts) : 0;
		$event->ends     = !empty($event->ends) ? intval($event->ends) : null;
		$event->location = !empty($event->location) ? (string) $event->location : null;
		$capacity         = isset($event->capacity) ? intval($event->capacity) : 0;
		$event->capacity  = $capacity > 0 ? $capacity : null;

		$placeGuid = !empty($event->place_guid) ? intval($event->place_guid) : 0;
		$event->place = null;
		if ($placeGuid && class_exists('OssnPlaces')) {
			$place = (new OssnPlaces())->getPlace($placeGuid);
			if ($place) {
				$event->place = array('guid' => intval($place->guid), 'title' => (string) $place->title);
			}
		}
		unset($event->place_guid);

		$coverGuid = !empty($event->cover_guid) ? intval($event->cover_guid) : 0;
		// Same inline route as OssnPlaces::hydrate() — ossn_api_media_asset_url()
		// only exists when media.php itself is the loaded v1 resource.
		$event->cover_url = $coverGuid ? ossn_site_url("media/get/{$coverGuid}") : null;
		unset($event->cover_guid);

		$event->attendee_count = $this->attendeeCount($event->guid);
		$event->seats_left     = $event->capacity !== null ? max(0, $event->capacity - $event->attendee_count) : null;
		$event->has_ended      = $event->ends !== null ? (time() > $event->ends) : (time() > $event->starts);
		$event->is_going       = $this->isGoing($event->guid, $viewerGuid);

		$event->owner_guid = intval($event->owner_guid);
		$event->guid       = intval($event->guid);

		return $event;
	}
}
