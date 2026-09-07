<?php
/**
 * BERX WORLD — Plans. A genuinely new BERX object (not a reskin of an
 * existing one): People + Time + Place + Activity, looser than a real
 * Event on purpose — place_guid and starts_at are both nullable, so
 * "anyone free this weekend?" is a real, storable object before
 * anyone has committed to specifics. See the migration
 * (upgrade/upgrades/1785171400.php) for the full rationale and the
 * confirmation that nothing like this existed anywhere in the
 * codebase before it (docs/BERX_MIGRATION_REGISTRY.md).
 *
 * Invite/respond reuses OSSN's own real friend-relationship check
 * (OssnUser::isFriend()) rather than inventing a new trust model —
 * the exact same restriction OssnEvents::invite() already enforces
 * (see its own real body), so a Plan can't be used to spam strangers
 * either.
 *
 * A Plan can transform into a real Event (convertToEvent()) once it
 * firms up — every invitee who already said yes is carried forward
 * as a real RSVP on the new event, not lost. This is the concrete,
 * real "one object becomes another, relationships survive" behavior
 * the BERX object model calls for — not a metaphor, an actual state
 * transition backed by two real tables and OssnEvents' own real
 * createEvent()/rsvp().
 */
class OssnPlans extends OssnDatabase {

	const TABLE = 'ossn_plans';
	const INVITES_TABLE = 'ossn_plan_invites';

	const STATUS_ACTIVE = 'active';
	const STATUS_CANCELLED = 'cancelled';
	const STATUS_CONVERTED = 'converted';

	public function createPlan($ownerGuid, array $fields) {
		$ownerGuid = intval($ownerGuid);
		$title = isset($fields['title']) ? trim((string) $fields['title']) : '';
		if (!$ownerGuid || $title === '' || mb_strlen($title, 'UTF-8') > 120) {
			return false;
		}
		$notes = isset($fields['notes']) ? trim(mb_substr((string) $fields['notes'], 0, 2000, 'UTF-8')) : '';
		$placeGuid = isset($fields['place_guid']) && $fields['place_guid'] !== '' ? intval($fields['place_guid']) : null;
		if ($placeGuid && (!class_exists('OssnPlaces') || !(new OssnPlaces())->getPlace($placeGuid))) {
			// A real place_guid pointing at nothing is refused, not
			// silently stored — same discipline as OssnEvents' own
			// group_guid membership check.
			$placeGuid = null;
		}
		$startsAt = isset($fields['starts_at']) && $fields['starts_at'] !== '' ? intval($fields['starts_at']) : null;

		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'title', 'notes', 'place_guid', 'starts_at', 'status', 'created_event_guid', 'time_created'),
			'values' => array($ownerGuid, mb_substr($title, 0, 120, 'UTF-8'), $notes !== '' ? $notes : null, $placeGuid, $startsAt, self::STATUS_ACTIVE, null, time()),
		));
		if (!$id) {
			return false;
		}
		$planId = $this->getLastEntry();

		$inviteGuids = isset($fields['invite_guids']) && is_array($fields['invite_guids']) ? $fields['invite_guids'] : array();
		$owner = ossn_user_by_guid($ownerGuid);
		foreach ($inviteGuids as $rawGuid) {
			$targetGuid = intval($rawGuid);
			if (!$targetGuid || $targetGuid === $ownerGuid) {
				continue;
			}
			// Real friends-only, same restriction OssnEvents::invite()
			// already enforces — never lets a Plan spam a stranger.
			if (!$owner || !$owner->isFriend($ownerGuid, $targetGuid)) {
				continue;
			}
			$this->insert(array(
				'into'   => self::INVITES_TABLE,
				'names'  => array('plan_id', 'user_guid', 'status', 'time_created', 'time_responded'),
				'values' => array($planId, $targetGuid, 'invited', time(), null),
			));
			if (class_exists('OssnNotifications')) {
				(new OssnNotifications())->add('berx:plan:invite', $ownerGuid, $planId, $planId, $targetGuid);
			}
		}
		return $planId;
	}

	public function getPlan($id) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function isOwner($plan, $guid) {
		return $plan && intval($plan->owner_guid) === intval($guid);
	}

	public function getInvite($planId, $guid) {
		$row = $this->select(array(
			'from'   => self::INVITES_TABLE,
			'wheres' => array(
				self::wheres('plan_id', '=', intval($planId)),
				self::wheres('user_guid', '=', intval($guid)),
			),
		));
		return $row ? $row : false;
	}

	public function canView($plan, $guid) {
		if (!$plan) {
			return false;
		}
		if ($this->isOwner($plan, $guid)) {
			return true;
		}
		return (bool) $this->getInvite($plan->id, $guid);
	}

	public function invitesForPlan($planId, $limit = 100) {
		$rows = $this->select(array(
			'from'     => self::INVITES_TABLE,
			'wheres'   => array(self::wheres('plan_id', '=', intval($planId))),
			'order_by' => 'time_created ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/** Real invited/accepted/declined transition — only the invitee themselves, only from a real pending or already-decided row (idempotent: re-accepting an already-accepted invite is a harmless no-op, not an error). */
	public function respondInvite($planId, $guid, $accept) {
		$invite = $this->getInvite($planId, $guid);
		if (!$invite) {
			return 'not_invited';
		}
		$newStatus = $accept ? 'accepted' : 'declined';
		$ok = parent::update(array(
			'table'  => self::INVITES_TABLE,
			'names'  => array('status', 'time_responded'),
			'values' => array($newStatus, time()),
			'wheres' => array(
				self::wheres('plan_id', '=', intval($planId)),
				self::wheres('user_guid', '=', intval($guid)),
			),
		));
		if ($ok && $accept && $invite->status !== 'accepted') {
			$plan = $this->getPlan($planId);
			if ($plan && class_exists('OssnNotifications')) {
				(new OssnNotifications())->add('berx:plan:accepted', intval($guid), intval($planId), intval($planId), intval($plan->owner_guid));
			}
		}
		return $ok ? 'ok' : 'failed';
	}

	/** Real "my world of plans" — plans I own, plus plans I'm invited to, merged and deduplicated. Two real queries, not a fragile UNION through this codebase's array-based query builder. */
	public function myPlans($guid, $limit = 50) {
		$guid = intval($guid);
		$owned = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', $guid)),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		$invited = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('id', 'IN', $this->invitedPlanIds($guid))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		$byId = array();
		foreach (array_merge($owned ? $owned : array(), $invited ? $invited : array()) as $row) {
			$byId[intval($row->id)] = $row;
		}
		krsort($byId);
		return array_slice(array_values($byId), 0, intval($limit));
	}

	private function invitedPlanIds($guid) {
		$rows = $this->select(array(
			'from'   => self::INVITES_TABLE,
			'wheres' => array(self::wheres('user_guid', '=', intval($guid))),
		), true);
		$ids = array();
		if ($rows) {
			foreach ($rows as $row) {
				$ids[] = intval($row->plan_id);
			}
		}
		// select()'s IN wheres() needs at least one value — a real plan
		// guid of 0 never matches anything, an honest "nothing invited
		// yet" rather than a malformed empty-IN() query.
		return $ids ? $ids : array(0);
	}

	public function cancelPlan($id, $actingGuid) {
		$plan = $this->getPlan($id);
		if (!$plan) {
			return 'not_found';
		}
		if (!$this->isOwner($plan, $actingGuid)) {
			return 'forbidden';
		}
		if ($plan->status !== self::STATUS_ACTIVE) {
			return 'not_active';
		}
		$ok = parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('status'),
			'values' => array(self::STATUS_CANCELLED),
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $ok ? 'ok' : 'failed';
	}

	/**
	 * The real transform: Plan -> Event. Requires a real place and a
	 * real time (an Event can't exist without either — OssnEvents::
	 * createEvent() itself refuses without both) — a Plan that hasn't
	 * firmed up yet honestly can't convert, never silently guesses a
	 * place/time to force it through. Every accepted invitee (plus the
	 * owner) is auto-RSVPed onto the new event via the same real
	 * OssnEvents::rsvp() the event's own UI uses — a real relationship
	 * carried forward, not a fresh empty event nobody's attending yet.
	 * Category defaults to the real 'other' slug from
	 * ossn_api_place_categories() — a Plan has no category concept of
	 * its own; this is an honest default, not a guess presented as a
	 * real user choice.
	 */
	public function convertToEvent($id, $actingGuid) {
		$plan = $this->getPlan($id);
		if (!$plan) {
			return array('status' => 'not_found');
		}
		if (!$this->isOwner($plan, $actingGuid)) {
			return array('status' => 'forbidden');
		}
		if ($plan->status !== self::STATUS_ACTIVE) {
			return array('status' => 'not_active');
		}
		if (!$plan->place_guid || !$plan->starts_at) {
			return array('status' => 'missing_place_or_time');
		}
		if (!class_exists('OssnEvents')) {
			return array('status' => 'failed');
		}
		$events = new OssnEvents();
		$eventGuid = $events->createEvent(intval($plan->owner_guid), array(
			'title'      => (string) $plan->title,
			'category'   => 'other',
			'starts'     => intval($plan->starts_at),
			'place_guid' => intval($plan->place_guid),
			'description' => $plan->notes !== null ? (string) $plan->notes : '',
		));
		if (!$eventGuid) {
			return array('status' => 'failed');
		}

		parent::update(array(
			'table'  => self::TABLE,
			'names'  => array('status', 'created_event_guid'),
			'values' => array(self::STATUS_CONVERTED, intval($eventGuid)),
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));

		// Owner + every accepted invitee carried forward as a real RSVP.
		$events->rsvp($eventGuid, intval($plan->owner_guid));
		$invites = $this->invitesForPlan($id);
		foreach ($invites as $invite) {
			if ($invite->status === 'accepted') {
				$events->rsvp($eventGuid, intval($invite->user_guid));
				if (class_exists('OssnNotifications')) {
					// subject_guid is the real new EVENT guid, not the plan —
					// reuses notifications.php's existing berx:event:* ->
					// event subject-kind resolution verbatim, no new
					// resolver needed: this notification deep-links
					// straight to the real event like any other.
					(new OssnNotifications())->add('berx:plan:converted', intval($actingGuid), intval($eventGuid), intval($eventGuid), intval($invite->user_guid));
				}
			}
		}

		return array('status' => 'ok', 'event_guid' => intval($eventGuid));
	}
}
