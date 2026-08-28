<?php
/**
 * BERX WORLD — Life Moments. Deliberately NOT named "Moment"/
 * OssnMoments to avoid any confusion with the existing, completely
 * different OssnBusinessMoments (a business's real time-bound flash
 * announcement, max 24h — components/OssnApi/v1/moments.php already
 * owns the 'moments' API resource name for that). This is a distinct
 * class, table, and API resource ('lifemoments').
 *
 * A Life Moment is NOT another Post: no likes/comments/reshare, no
 * place in the main feed. It's a real, lightweight, timestamped
 * capture scoped to a real live/recent BERX context — the raw
 * material a later Memory can surface. Real WHO (owner), WHERE
 * (resolved from the source), WHEN (time_created), WHAT (text), WITH
 * WHOM (real people tags, own table), SOURCE (source_type/source_id).
 *
 * Every source type requires real, verified presence — never just
 * "I say I was there":
 *   event_checkin  -> OssnEvents::hasCheckedIn() (real geo-verified attendance)
 *   experience     -> owner or a real accepted OssnExperiences participant
 *   place_checkin  -> a real ossn_relationships 'place:checkin' row for this user+place
 *
 * "With whom" tags are validated, not trusted: only people who were
 * themselves ALSO really connected to the same source can be tagged
 * — an invalid guid is silently dropped, same graceful pattern
 * OssnPlans::createPlan()'s invite_guids already uses, never a hard
 * error over one bad id in a list.
 */
class OssnLifeMoments extends OssnDatabase {

	const TABLE = 'ossn_moments';
	const PEOPLE_TABLE = 'ossn_moment_people';

	const SOURCE_EVENT_CHECKIN = 'event_checkin';
	const SOURCE_EXPERIENCE = 'experience';
	const SOURCE_PLACE_CHECKIN = 'place_checkin';

	public static function isValidSourceType($type) {
		return in_array((string) $type, array(self::SOURCE_EVENT_CHECKIN, self::SOURCE_EXPERIENCE, self::SOURCE_PLACE_CHECKIN), true);
	}

	/**
	 * @return array{status:string, id?:int}
	 */
	public function create($ownerGuid, $sourceType, $sourceId, $text, array $withGuids = array()) {
		$ownerGuid = intval($ownerGuid);
		$sourceId = intval($sourceId);
		$text = trim((string) $text);
		if (!$ownerGuid || !self::isValidSourceType($sourceType) || !$sourceId || $text === '' || mb_strlen($text, 'UTF-8') > 500) {
			return array('status' => 'invalid');
		}

		$verified = $this->verifyPresence($sourceType, $sourceId, $ownerGuid);
		if ($verified === false) {
			return array('status' => 'forbidden');
		}
		list($placeGuid, $realCoPresentGuids) = $verified;

		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'text', 'source_type', 'source_id', 'place_guid', 'time_created'),
			'values' => array($ownerGuid, mb_substr($text, 0, 500, 'UTF-8'), (string) $sourceType, $sourceId, $placeGuid, time()),
		));
		if (!$id) {
			return array('status' => 'failed');
		}
		$momentId = $this->getLastEntry();

		// Real "with whom" — only real, verified co-present people, the
		// caller's own submitted guesses filtered against that real set.
		$validTags = array_values(array_intersect(array_map('intval', $withGuids), $realCoPresentGuids));
		foreach (array_unique($validTags) as $taggedGuid) {
			if ($taggedGuid === $ownerGuid) {
				continue;
			}
			$this->insert(array(
				'into'   => self::PEOPLE_TABLE,
				'names'  => array('moment_id', 'user_guid', 'time_created'),
				'values' => array($momentId, $taggedGuid, time()),
			));
			if (class_exists('OssnNotifications')) {
				(new OssnNotifications())->add('berx:moment:tag', $ownerGuid, intval($momentId), intval($momentId), $taggedGuid);
			}
		}

		return array('status' => 'ok', 'id' => intval($momentId));
	}

	/**
	 * Real presence check + real place resolution + real set of who
	 * else was verifiably there, in one pass (so create() never trusts
	 * the caller's own $withGuids beyond intersecting it against this).
	 *
	 * @return array{0:?int,1:int[]}|false
	 */
	private function verifyPresence($sourceType, $sourceId, $ownerGuid) {
		if ($sourceType === self::SOURCE_EVENT_CHECKIN) {
			if (!class_exists('OssnEvents')) {
				return false;
			}
			$events = new OssnEvents();
			if (!$events->hasCheckedIn($sourceId, $ownerGuid)) {
				return false;
			}
			$event = $events->getEvent($sourceId);
			$placeGuid = ($event && !empty($event->place['guid'])) ? intval($event->place['guid']) : null;
			$coPresent = array();
			foreach ($events->checkinsForEvent($sourceId) as $checkin) {
				$coPresent[] = intval($checkin->relation_from);
			}
			return array($placeGuid, $coPresent);
		}

		if ($sourceType === self::SOURCE_EXPERIENCE) {
			if (!class_exists('OssnExperiences')) {
				return false;
			}
			$experiences = new OssnExperiences();
			$experience = $experiences->get($sourceId);
			if (!$experience) {
				return false;
			}
			$isOwner = intval($experience->owner_guid) === intval($ownerGuid);
			$myStatus = $experiences->participantStatus($sourceId, $ownerGuid);
			if (!$isOwner && $myStatus !== 'accepted') {
				return false;
			}
			$placeGuid = !empty($experience->place_guid) ? intval($experience->place_guid) : null;
			if (!$placeGuid && !empty($experience->event_guid) && class_exists('OssnEvents')) {
				$event = (new OssnEvents())->getEvent($experience->event_guid);
				if ($event && !empty($event->place['guid'])) {
					$placeGuid = intval($event->place['guid']);
				}
			}
			$coPresent = array(intval($experience->owner_guid));
			foreach ($experiences->participants($sourceId) as $participant) {
				if ($participant->status === 'accepted') {
					$coPresent[] = intval($participant->member_guid);
				}
			}
			return array($placeGuid, $coPresent);
		}

		if ($sourceType === self::SOURCE_PLACE_CHECKIN) {
			if (!class_exists('OssnPlaces') || !function_exists('ossn_relation_exists')) {
				return false;
			}
			if (!ossn_relation_exists(intval($ownerGuid), intval($sourceId), OssnPlaces::CHECKIN_RELATION)) {
				return false;
			}
			$coPresent = array();
			foreach ((new OssnPlaces())->checkinsForPlace($sourceId, 50) as $row) {
				// checkinsForPlace() returns real hydrated arrays (guid/
				// username/...), not raw relationship rows — a different
				// real shape than checkinsForEvent(), confirmed by
				// reading its own body rather than assumed identical.
				if (isset($row['guid'])) {
					$coPresent[] = intval($row['guid']);
				}
			}
			return array(intval($sourceId), $coPresent);
		}

		return false;
	}

	/** Public wrapper over the same real presence check create() uses — never expose a source's moments (e.g. a private Experience's) to someone who wasn't really connected to it. */
	public function canViewSource($sourceType, $sourceId, $viewerGuid) {
		return $this->verifyPresence($sourceType, $sourceId, $viewerGuid) !== false;
	}

	public function getMoment($id) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function peopleForMoment($momentId, $limit = 50) {
		$rows = $this->select(array(
			'from'     => self::PEOPLE_TABLE,
			'wheres'   => array(self::wheres('moment_id', '=', intval($momentId))),
			'order_by' => 'time_created ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/** Real, live feed of moments attached to one source — what an Event/Experience page shows while it's happening, and what a Memory later surfaces (same real rows, never copied). */
	public function momentsForSource($sourceType, $sourceId, $limit = 50) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(
				self::wheres('source_type', '=', (string) $sourceType),
				self::wheres('source_id', '=', intval($sourceId)),
			),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function myMoments($guid, $limit = 50) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', intval($guid))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function deleteMoment($id, $actingGuid) {
		$moment = $this->getMoment($id);
		if (!$moment || intval($moment->owner_guid) !== intval($actingGuid)) {
			return false;
		}
		parent::delete(array(
			'from'   => self::PEOPLE_TABLE,
			'wheres' => array(self::wheres('moment_id', '=', intval($id))),
		));
		return (bool) parent::delete(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}
}
