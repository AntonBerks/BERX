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

		$existing = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('owner_guid', '=', $actingGuid),
				self::wheres('source_type', '=', self::SOURCE_EXPERIENCE),
				self::wheres('source_id', '=', intval($experienceId)),
			),
		));
		if ($existing) {
			return array('status' => 'ok', 'id' => intval($existing->id));
		}

		$placeGuid = $this->resolvePlaceGuid($experience);

		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'title', 'notes', 'source_type', 'source_id', 'place_guid', 'happened_at', 'time_created'),
			'values' => array($actingGuid, (string) $experience->title, null, self::SOURCE_EXPERIENCE, intval($experienceId), $placeGuid, intval($experience->scheduled_start), time()),
		));
		if (!$id) {
			return array('status' => 'failed');
		}
		$memoryId = $this->getLastEntry();

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
		foreach (array_unique(array_map('intval', $peopleGuids)) as $personGuid) {
			$this->insert(array(
				'into'   => self::PARTICIPANTS_TABLE,
				'names'  => array('memory_id', 'user_guid', 'time_created'),
				'values' => array($memoryId, $personGuid, time()),
			));
		}

		return array('status' => 'ok', 'id' => intval($memoryId));
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
