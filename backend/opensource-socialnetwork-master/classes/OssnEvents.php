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
	 *              location, place_guid, group_guid, capacity
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

		// MAX BUILD -- real Communities <-> Events connection: an event
		// can be tagged as hosted by a real community, same idea as
		// place_guid. Requires the organizer to actually be a real member
		// (OssnGroup::isMember(), real 'group:join:approve' relation) —
		// never lets a stranger's event masquerade as community-hosted.
		$groupGuid = isset($fields['group_guid']) ? intval($fields['group_guid']) : 0;
		if ($groupGuid && (!class_exists('OssnGroup') || !(new OssnGroup())->isMember($groupGuid, $ownerGuid))) {
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
		$this->data->group_guid = $groupGuid;
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

	/**
	 * MAX BUILD — "Business + Places + Moments + Events + Offers +
	 * Reputation = one real-world business ecosystem": a business could
	 * already CREATE an event tied to their place (place_guid on
	 * create/update), but had no way to see those events on their own
	 * dashboard. Same entities_pairs metadata-filter mechanism
	 * listEvents() already uses for category, just filtering on
	 * place_guid instead — no new query pattern.
	 * @return array real PHP array of upcoming (not-ended) hydrated events at this place, soonest first
	 */
	public function upcomingByPlace($placeGuid, $limit = 10) {
		$objects = $this->searchObject(array(
			'subtype'       => self::SUBTYPE,
			'type'          => 'user',
			'limit'         => 200,
			'page_limit'    => false,
			'entities_pairs' => array(
				array('name' => 'place_guid', 'value' => (string) intval($placeGuid)),
			),
		));
		if (!$objects) {
			return array();
		}
		$out = array();
		foreach ($objects as $object) {
			if (!isset($object->subtype) || $object->subtype !== self::SUBTYPE) {
				continue;
			}
			$hydrated = $this->hydrate($object);
			if ($hydrated->has_ended) {
				continue;
			}
			$out[] = $hydrated;
		}
		usort($out, function ($a, $b) {
			return $a->starts <=> $b->starts;
		});
		return array_slice($out, 0, intval($limit));
	}

	/**
	 * MAX BUILD -- real Communities <-> Events connection: a community's
	 * real hosted events (group_guid on create/update), same
	 * entities_pairs metadata-filter mechanism upcomingByPlace() already
	 * uses, just filtering on group_guid instead — no new query pattern.
	 * @return array real PHP array of upcoming (not-ended) hydrated events hosted by this community, soonest first
	 */
	public function upcomingByGroup($groupGuid, $limit = 10) {
		$objects = $this->searchObject(array(
			'subtype'       => self::SUBTYPE,
			'type'          => 'user',
			'limit'         => 200,
			'page_limit'    => false,
			'entities_pairs' => array(
				array('name' => 'group_guid', 'value' => (string) intval($groupGuid)),
			),
		));
		if (!$objects) {
			return array();
		}
		$out = array();
		foreach ($objects as $object) {
			if (!isset($object->subtype) || $object->subtype !== self::SUBTYPE) {
				continue;
			}
			$hydrated = $this->hydrate($object);
			if ($hydrated->has_ended) {
				continue;
			}
			$out[] = $hydrated;
		}
		usort($out, function ($a, $b) {
			return $a->starts <=> $b->starts;
		});
		return array_slice($out, 0, intval($limit));
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

	/** MAX BUILD -- real fix, same class of bug found/fixed elsewhere this session: ossn_isAdminLoggedin() reads $_SESSION, never populated for a bearer-token API request. */
	public function canEditEvent($event, $actingGuid) {
		if (!$event || !$actingGuid) {
			return false;
		}
		if (ossn_api_is_admin($actingGuid)) {
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
		if (array_key_exists('group_guid', $fields)) {
			$newGroupGuid = intval($fields['group_guid']);
			// Same real membership guard as createEvent() — an owner can't
			// retroactively tag their event onto a community they aren't
			// actually in.
			if ($newGroupGuid && (!class_exists('OssnGroup') || !(new OssnGroup())->isMember($newGroupGuid, $actingGuid))) {
				return 'invalid';
			}
			$this->data->group_guid = $newGroupGuid;
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
		// Real GO->owner notification. Own-event RSVP can't reach here
		// (isGoing()/relation checks aside, OssnNotifications::add()
		// itself safely no-ops when owner_guid==poster_guid anyway).
		(new OssnNotifications())->add('berx:event:rsvp', intval($userGuid), intval($eventGuid), null);
		return 'ok';
	}

	const CHECKIN_RELATION = 'event:checkin';

	/**
	 * BERX WORLD — real Checkpoint: RSVP only ever proves INTENT
	 * ("said they'd go"); this proves real, geo-verified ATTENDANCE
	 * ("was actually there") — the same distance-check discipline as
	 * OssnPlaces::checkIn(), reused rather than duplicated, applied to
	 * the event's own real indexed location (OssnGeo::getLocation(),
	 * set at creation by indexLocation() from either a real place_guid
	 * or a real free-text location that never got geocoded — the
	 * latter has no coordinates, so a check-in on it is honestly
	 * refused as unverifiable, never silently trusted).
	 *
	 * One real check-in per (user, event) — unlike a Place (which is
	 * meaningfully revisited many times), a single Event has exactly
	 * one moment of arrival, so this is a real existence check, not a
	 * time-window cooldown.
	 *
	 * @return array {ok:bool, reason?:string, distance_m?:float}
	 */
	public function checkIn($eventGuid, $userGuid, $lat, $lng) {
		if (!OssnGeo::isValidLat($lat) || !OssnGeo::isValidLng($lng)) {
			return array('ok' => false, 'reason' => 'invalid_coordinates');
		}
		$event = $this->getEvent($eventGuid);
		if (!$event) {
			return array('ok' => false, 'reason' => 'not_found');
		}
		if (!$this->isGoing($eventGuid, $userGuid)) {
			// Real semantics: you can only check in to an event you're
			// actually RSVPed to — a checkpoint without an RSVP would be
			// attendance nobody claimed intent for.
			return array('ok' => false, 'reason' => 'not_going');
		}
		if (intval($event->starts) > time()) {
			return array('ok' => false, 'reason' => 'not_started');
		}
		if (ossn_relation_exists(intval($userGuid), intval($eventGuid), self::CHECKIN_RELATION)) {
			return array('ok' => false, 'reason' => 'already_checked_in');
		}
		$geo = class_exists('OssnGeo') ? new OssnGeo() : null;
		$location = $geo ? $geo->getLocation($eventGuid) : false;
		if (!$location) {
			return array('ok' => false, 'reason' => 'no_location');
		}
		$distanceKm = OssnGeo::distanceKm(floatval($lat), floatval($lng), floatval($location->lat), floatval($location->lng));
		$distanceM = $distanceKm * 1000;
		// Same real 300m radius as OssnPlaces::checkIn() — read from
		// its own constant when the class is loaded rather than
		// duplicating the magic number, falling back to the identical
		// literal only if it somehow isn't (defensive, matches
		// OssnExperiences' own class_exists('OssnPlaces') guard style).
		$radiusM = class_exists('OssnPlaces') ? OssnPlaces::CHECKIN_RADIUS_METERS : 300;
		if ($distanceM > $radiusM) {
			return array('ok' => false, 'reason' => 'too_far', 'distance_m' => round($distanceM, 1));
		}
		if (!ossn_add_relation(intval($userGuid), intval($eventGuid), self::CHECKIN_RELATION)) {
			return array('ok' => false, 'reason' => 'save_failed');
		}
		return array('ok' => true, 'distance_m' => round($distanceM, 1));
	}

	public function hasCheckedIn($eventGuid, $userGuid) {
		return ossn_relation_exists(intval($userGuid), intval($eventGuid), self::CHECKIN_RELATION);
	}

	/** Real attendee-of-record list — who ACTUALLY showed up, not who said they would. Same shape as OssnPlaces::checkinsForPlace(). */
	public function checkinsForEvent($eventGuid, $limit = 200) {
		$rows = ossn_get_relationships(array('to' => intval($eventGuid), 'type' => self::CHECKIN_RELATION, 'limit' => intval($limit), 'page_limit' => false, 'order_by' => 'r.time DESC'));
		return $rows ? $rows : array();
	}

	public function cancelRsvp($eventGuid, $userGuid) {
		$ok = (bool) ossn_delete_relationship(array(
			'from' => intval($userGuid),
			'to'   => intval($eventGuid),
			'type' => self::GOING_RELATION,
		));
		// BERX WORLD MAX BUILD — a cancelled RSVP frees exactly one real
		// seat; promote the real earliest waitlisted person into it
		// immediately, same transaction turn, never left to a batch job.
		if ($ok) {
			$this->promoteNextWaitlisted($eventGuid);
		}
		return $ok;
	}

	/* ---------------- Waitlist (real table — capacity is a real, finite constraint, not a soft UI state) ---------------- */

	const WAITLIST_TABLE = 'ossn_event_waitlist';

	public function waitlistCount($eventGuid) {
		$row = $this->select(array(
			'from'   => self::WAITLIST_TABLE,
			'params' => array('COUNT(*) AS c'),
			'wheres' => array(self::wheres('event_guid', '=', intval($eventGuid))),
		));
		return $row ? intval($row->c) : 0;
	}

	public function isWaitlisted($eventGuid, $userGuid) {
		if (!$userGuid) {
			return false;
		}
		$row = $this->select(array(
			'from'   => self::WAITLIST_TABLE,
			'wheres' => array(
				self::wheres('event_guid', '=', intval($eventGuid)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
		return (bool) $row;
	}

	/** 1-based real position, derived from join order — never stored, never drifts. */
	public function waitlistPosition($eventGuid, $userGuid) {
		$mine = $this->select(array(
			'from'   => self::WAITLIST_TABLE,
			'wheres' => array(
				self::wheres('event_guid', '=', intval($eventGuid)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
		if (!$mine) {
			return null;
		}
		$earlier = $this->select(array(
			'from'   => self::WAITLIST_TABLE,
			'params' => array('COUNT(*) AS c'),
			'wheres' => array(
				self::wheres('event_guid', '=', intval($eventGuid)),
				self::wheres('time_created', '<', intval($mine->time_created)),
			),
		));
		return ($earlier ? intval($earlier->c) : 0) + 1;
	}

	/**
	 * @return string 'ok'|'not_found'|'ended'|'already_going'|'already_waitlisted'|'not_full'
	 * A waitlist only makes sense once the event is real-full — joining
	 * one for an event with open seats would just be a confusing detour
	 * around the real rsvp() path, so it's rejected, not silently
	 * accepted.
	 */
	public function joinWaitlist($eventGuid, $userGuid) {
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
		if ($event->capacity === null || $this->attendeeCount($eventGuid) < $event->capacity) {
			return 'not_full';
		}
		if ($this->isWaitlisted($eventGuid, $userGuid)) {
			return 'already_waitlisted';
		}
		$ok = $this->insert(array(
			'into'   => self::WAITLIST_TABLE,
			'names'  => array('event_guid', 'user_guid', 'time_created'),
			'values' => array(intval($eventGuid), intval($userGuid), time()),
		));
		return $ok ? 'ok' : 'rsvp_failed';
	}

	public function leaveWaitlist($eventGuid, $userGuid) {
		return (bool) $this->delete(array(
			'from'   => self::WAITLIST_TABLE,
			'wheres' => array(
				self::wheres('event_guid', '=', intval($eventGuid)),
				self::wheres('user_guid', '=', intval($userGuid)),
			),
		));
	}

	/**
	 * Promotes the single earliest real waitlist entry into a real
	 * RSVP — called from cancelRsvp() itself, one promotion per freed
	 * seat. Skips (and drops) any stale row for someone who is somehow
	 * already going, rather than double-booking a seat.
	 */
	private function promoteNextWaitlisted($eventGuid) {
		$next = $this->select(array(
			'from'     => self::WAITLIST_TABLE,
			'wheres'   => array(self::wheres('event_guid', '=', intval($eventGuid))),
			'order_by' => 'time_created ASC',
		));
		if (!$next) {
			return;
		}
		$this->leaveWaitlist($eventGuid, $next->user_guid);
		if ($this->isGoing($eventGuid, $next->user_guid)) {
			return;
		}
		if (!ossn_add_relation(intval($next->user_guid), intval($eventGuid), self::GOING_RELATION)) {
			return;
		}
		$event = $this->getEvent($eventGuid);
		if ($event) {
			// poster_guid = the event's real owner (a real, non-empty
			// actor id for a system-triggered notice) — owner_guid is
			// overridden to the promoted user via notification_owner, the
			// same real passthrough already used by 'berx:event:invite'.
			(new OssnNotifications())->add('berx:event:waitlist:promoted', intval($event->owner_guid), intval($eventGuid), intval($eventGuid), intval($next->user_guid));
		}
	}

	/**
	 * Real, server-enforced friendship check — never trusts the caller.
	 * Real notification too, now that a 'berx:event:invite' hook is
	 * registered (ossn_com.php) — owner_guid is the invitee directly
	 * (notification_owner), not resolved from the event.
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
		(new OssnNotifications())->add('berx:event:invite', intval($actingGuid), intval($eventGuid), intval($eventGuid), intval($targetGuid));
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

		// MAX BUILD -- real Communities <-> Events connection, same
		// hydration idiom as place above.
		$groupGuid = !empty($event->group_guid) ? intval($event->group_guid) : 0;
		$event->group = null;
		if ($groupGuid && class_exists('OssnGroup')) {
			$group = (new OssnGroup())->getGroup($groupGuid);
			if ($group) {
				$event->group = array('guid' => intval($group->guid), 'title' => (string) $group->title);
			}
		}
		unset($event->group_guid);

		$coverGuid = !empty($event->cover_guid) ? intval($event->cover_guid) : 0;
		// Same inline route as OssnPlaces::hydrate() — ossn_api_media_asset_url()
		// only exists when media.php itself is the loaded v1 resource.
		$event->cover_url = $coverGuid ? ossn_site_url("media/get/{$coverGuid}") : null;
		unset($event->cover_guid);

		$event->attendee_count = $this->attendeeCount($event->guid);
		$event->seats_left     = $event->capacity !== null ? max(0, $event->capacity - $event->attendee_count) : null;
		$event->has_ended      = $event->ends !== null ? (time() > $event->ends) : (time() > $event->starts);
		$event->is_going       = $this->isGoing($event->guid, $viewerGuid);
		// BERX WORLD MAX BUILD — real waitlist state, same viewer-scoped
		// idiom as is_going: never a client guess, always the real row.
		$event->is_waitlisted  = $this->isWaitlisted($event->guid, $viewerGuid);
		$event->waitlist_count = $this->waitlistCount($event->guid);
		// BERX WORLD — real Checkpoint state, same viewer-scoped idiom:
		// is_going is intent, has_checked_in is proven attendance.
		$event->has_checked_in = $viewerGuid ? $this->hasCheckedIn($event->guid, $viewerGuid) : false;

		$event->owner_guid = intval($event->owner_guid);
		$event->guid       = intval($event->guid);

		return $event;
	}
}
