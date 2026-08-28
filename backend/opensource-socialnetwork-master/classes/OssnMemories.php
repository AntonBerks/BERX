<?php
/**
 * BERX WORLD — Memories, real. Confirmed before writing this: the
 * only thing this codebase had called "Memories" before
 * (components/OssnApi/v1/memories.php's own GET / route) is a pure,
 * derived "on this day" scan over posts/photos/checkins — exactly
 * "old photos," and that route is untouched by this class, still
 * real and still useful for its own purpose.
 *
 * This is a DIFFERENT, additive thing: a real, PERSISTED Memory a
 * user deliberately saves from a real BERX Experience they were
 * actually part of — capturing WHO (real accepted participants at
 * save time, own table, not a denormalized blob — same discipline as
 * OssnPlans' invites), WHERE (the experience's real place, resolved
 * through its event anchor when it has one), WHEN (the experience's
 * own real scheduled_start), and WHAT (the experience's own real
 * title/description). Nothing here is inferred, generated, or
 * guessed — every field traces to a real row this user was really
 * connected to.
 *
 * source_type/source_id is deliberately source-agnostic (only
 * 'experience' wired in this pass) so extending to Event/Trip/Plan
 * later is a real, scoped addition to createFrom*(), not a schema
 * change or a redesign.
 *
 * A memory can only be saved for something that has actually
 * happened (scheduled_start <= now()) — an honest guard against
 * "memorializing" the future, and only by someone who was actually
 * there (the experience's owner or a real accepted participant), one
 * real memory per (owner, source) — the DB unique index makes that a
 * guarantee, not just an application check.
 */
class OssnMemories extends OssnDatabase {

	const TABLE = 'ossn_memories';
	const PARTICIPANTS_TABLE = 'ossn_memory_participants';

	const SOURCE_EXPERIENCE = 'experience';
	const SOURCE_EVENT_CHECKIN = 'event_checkin';

	/**
	 * @return array{status:string, id?:int}
	 */
	public function createFromExperience($experienceId, $actingGuid) {
		if (!class_exists('OssnExperiences')) {
			return array('status' => 'failed');
		}
		$experiences = new OssnExperiences();
		$experience = $experiences->get($experienceId);
		if (!$experience) {
			return array('status' => 'not_found');
		}

		$actingGuid = intval($actingGuid);
		$isOwner = intval($experience->owner_guid) === $actingGuid;
		$participantStatus = $experiences->participantStatus($experienceId, $actingGuid);
		if (!$isOwner && $participantStatus !== 'accepted') {
			return array('status' => 'forbidden');
		}

		if (intval($experience->scheduled_start) > time()) {
			return array('status' => 'not_happened_yet');
		}

		$existing = $this->findExisting($actingGuid, self::SOURCE_EXPERIENCE, $experienceId);
		if ($existing) {
			return array('status' => 'ok', 'id' => intval($existing->id));
		}

		$placeGuid = $this->resolvePlaceGuid($experience);

		$memoryId = $this->insertMemory($actingGuid, (string) $experience->title, self::SOURCE_EXPERIENCE, $experienceId, $placeGuid, intval($experience->scheduled_start));
		if (!$memoryId) {
			return array('status' => 'failed');
		}

		// Real snapshot of who was actually there — every accepted
		// participant plus the owner, at the moment this memory is
		// saved. Deliberately never re-derived later: if the source
		// experience's participant list changes afterward (someone
		// removed, etc.), this memory's own history doesn't silently
		// rewrite itself.
		$peopleGuids = array($experience->owner_guid);
		foreach ($experiences->participants($experienceId) as $participant) {
			if ($participant->status === 'accepted') {
				$peopleGuids[] = $participant->member_guid;
			}
		}
		$this->insertParticipants($memoryId, $peopleGuids);

		return array('status' => 'ok', 'id' => intval($memoryId));
	}

	/**
	 * BERX WORLD — real Checkpoint -> Memory. Only for someone who
	 * really, geo-verifiedly checked in (OssnEvents::hasCheckedIn()) —
	 * a stronger, more honest guard than the Experience path's
	 * accepted-participant check, since attendance here is proven, not
	 * self-reported. WHO is every OTHER real attendee who also checked
	 * in — people actually confirmed present, not everyone who merely
	 * RSVPed (a real, meaningfully more honest "with whom" than the
	 * event's own attendee list would be).
	 *
	 * @return array{status:string, id?:int}
	 */
	public function createFromEventCheckin($eventGuid, $actingGuid) {
		if (!class_exists('OssnEvents')) {
			return array('status' => 'failed');
		}
		$events = new OssnEvents();
		$event = $events->getEvent($eventGuid, $actingGuid);
		if (!$event) {
			return array('status' => 'not_found');
		}
		$actingGuid = intval($actingGuid);
		if (!$events->hasCheckedIn($eventGuid, $actingGuid)) {
			return array('status' => 'forbidden');
		}

		$existing = $this->findExisting($actingGuid, self::SOURCE_EVENT_CHECKIN, $eventGuid);
		if ($existing) {
			return array('status' => 'ok', 'id' => intval($existing->id));
		}

		$placeGuid = !empty($event->place['guid']) ? intval($event->place['guid']) : null;
		$memoryId = $this->insertMemory($actingGuid, (string) $event->title, self::SOURCE_EVENT_CHECKIN, $eventGuid, $placeGuid, intval($event->starts));
		if (!$memoryId) {
			return array('status' => 'failed');
		}

		$peopleGuids = array($actingGuid);
		foreach ($events->checkinsForEvent($eventGuid) as $checkin) {
			$peopleGuids[] = $checkin->relation_from;
		}
		$this->insertParticipants($memoryId, $peopleGuids);

		return array('status' => 'ok', 'id' => intval($memoryId));
	}

	private function findExisting($ownerGuid, $sourceType, $sourceId) {
		return $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('owner_guid', '=', intval($ownerGuid)),
				self::wheres('source_type', '=', (string) $sourceType),
				self::wheres('source_id', '=', intval($sourceId)),
			),
		));
	}

	private function insertMemory($ownerGuid, $title, $sourceType, $sourceId, $placeGuid, $happenedAt) {
		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'title', 'notes', 'source_type', 'source_id', 'place_guid', 'happened_at', 'time_created'),
			'values' => array(intval($ownerGuid), $title, null, (string) $sourceType, intval($sourceId), $placeGuid, intval($happenedAt), time()),
		));
		return $id ? $this->getLastEntry() : false;
	}

	private function insertParticipants($memoryId, array $guids) {
		foreach (array_unique(array_map('intval', $guids)) as $personGuid) {
			$this->insert(array(
				'into'   => self::PARTICIPANTS_TABLE,
				'names'  => array('memory_id', 'user_guid', 'time_created'),
				'values' => array($memoryId, $personGuid, time()),
			));
		}
	}

	private function resolvePlaceGuid($experience) {
		if (!empty($experience->place_guid)) {
			return intval($experience->place_guid);
		}
		if (!empty($experience->event_guid) && class_exists('OssnEvents')) {
			$event = (new OssnEvents())->getEvent($experience->event_guid);
			if ($event && !empty($event->place['guid'])) {
				return intval($event->place['guid']);
			}
		}
		return null;
	}

	public function getMemory($id) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function canView($memory, $guid) {
		return $memory && intval($memory->owner_guid) === intval($guid);
	}

	public function participantsForMemory($memoryId, $limit = 100) {
		$rows = $this->select(array(
			'from'     => self::PARTICIPANTS_TABLE,
			'wheres'   => array(self::wheres('memory_id', '=', intval($memoryId))),
			'order_by' => 'time_created ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function myMemories($guid, $limit = 50) {
		$rows = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', intval($guid))),
			'order_by' => 'happened_at DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/** Owner-only, real annotation — a memory's title/timeline stay a true record of the source, only the personal caption is editable. */
	public function updateNotes($id, $actingGuid, $notes) {
		$memory = $this->getMemory($id);
		if (!$memory || !$this->canView($memory, $actingGuid)) {
			return false;
		}
		return (bool) parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('notes'),
			'values' => array(trim(mb_substr((string) $notes, 0, 2000, 'UTF-8')) ?: null),
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
	}
}
