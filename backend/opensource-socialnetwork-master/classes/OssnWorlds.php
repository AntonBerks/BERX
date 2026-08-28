<?php
/**
 * BERX WORLD — Worlds. The first-class container object: a real
 * "world" (a trip, a friend group, a neighborhood, a season) that
 * holds real BERX objects — places, events, plans, experiences — by
 * reference, plus a real membership list. Not a community/group
 * reskin: OssnGroup (components/OssnGroups/) is a deep OssnObject-
 * coupled stock OSSN concept with its own wall/discussion/roles model
 * — a World is BERX-native (shallow OssnDatabase only), has no wall
 * of its own, and exists specifically to compose EXISTING objects
 * together rather than host new content. See upgrade/upgrades/
 * 1785171700.php for the schema rationale.
 *
 * Membership reuses OssnPlans' exact invited/accepted/declined shape
 * (ossn_plan_invites -> ossn_world_members) — a proven real pattern,
 * not reinvented. A private world's invites are real-friends-only
 * (OssnUser::isFriend()), same restriction as Plans/Events; a public
 * world instead allows a direct self-join with no invite step, since
 * "public" already means "anyone can see it".
 */
class OssnWorlds extends OssnDatabase {

	const TABLE = 'ossn_worlds';
	const MEMBERS_TABLE = 'ossn_world_members';
	const ITEMS_TABLE = 'ossn_world_items';

	const VISIBILITY_PUBLIC = 'public';
	const VISIBILITY_PRIVATE = 'private';

	const ITEM_TYPES = array('place', 'event', 'plan', 'experience');

	public function createWorld($ownerGuid, array $fields) {
		$ownerGuid = intval($ownerGuid);
		$title = isset($fields['title']) ? trim((string) $fields['title']) : '';
		if (!$ownerGuid || $title === '' || mb_strlen($title, 'UTF-8') > 120) {
			return false;
		}
		$description = isset($fields['description']) ? trim(mb_substr((string) $fields['description'], 0, 2000, 'UTF-8')) : '';
		$visibility = isset($fields['visibility']) && $fields['visibility'] === self::VISIBILITY_PUBLIC ? self::VISIBILITY_PUBLIC : self::VISIBILITY_PRIVATE;
		$isTemporary = !empty($fields['is_temporary']) ? 1 : 0;
		$expiresAt = $isTemporary && !empty($fields['expires_at']) ? intval($fields['expires_at']) : null;

		$id = $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('owner_guid', 'title', 'description', 'visibility', 'is_temporary', 'expires_at', 'time_created'),
			'values' => array($ownerGuid, mb_substr($title, 0, 120, 'UTF-8'), $description !== '' ? $description : null, $visibility, $isTemporary, $expiresAt, time()),
		));
		if (!$id) {
			return false;
		}
		$worldId = $this->getLastEntry();

		// The owner is always a real accepted member, role='owner'.
		$this->insert(array(
			'into'   => self::MEMBERS_TABLE,
			'names'  => array('world_id', 'user_guid', 'role', 'status', 'time_created', 'time_responded'),
			'values' => array($worldId, $ownerGuid, 'owner', 'accepted', time(), time()),
		));

		if ($visibility === self::VISIBILITY_PRIVATE) {
			$inviteGuids = isset($fields['invite_guids']) && is_array($fields['invite_guids']) ? $fields['invite_guids'] : array();
			$owner = ossn_user_by_guid($ownerGuid);
			foreach ($inviteGuids as $rawGuid) {
				$targetGuid = intval($rawGuid);
				if (!$targetGuid || $targetGuid === $ownerGuid) {
					continue;
				}
				// Real friends-only invite — same restriction Plans/Events already enforce, never lets a World invite spam a stranger.
				if (!$owner || !$owner->isFriend($ownerGuid, $targetGuid)) {
					continue;
				}
				$this->insert(array(
					'into'   => self::MEMBERS_TABLE,
					'names'  => array('world_id', 'user_guid', 'role', 'status', 'time_created', 'time_responded'),
					'values' => array($worldId, $targetGuid, 'member', 'invited', time(), null),
				));
				if (class_exists('OssnNotifications')) {
					(new OssnNotifications())->add('berx:world:invite', $ownerGuid, $worldId, $worldId, $targetGuid);
				}
			}
		}
		return $worldId;
	}

	public function getWorld($id) {
		$row = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $row ? $row : false;
	}

	public function isOwner($world, $guid) {
		return $world && intval($world->owner_guid) === intval($guid);
	}

	public function getMembership($worldId, $guid) {
		$row = $this->select(array(
			'from'   => self::MEMBERS_TABLE,
			'wheres' => array(
				self::wheres('world_id', '=', intval($worldId)),
				self::wheres('user_guid', '=', intval($guid)),
			),
		));
		return $row ? $row : false;
	}

	public function isAcceptedMember($worldId, $guid) {
		$m = $this->getMembership($worldId, $guid);
		return (bool) ($m && $m->status === 'accepted');
	}

	public function canView($world, $guid) {
		if (!$world) {
			return false;
		}
		if ($world->visibility === self::VISIBILITY_PUBLIC) {
			return true;
		}
		return $this->isAcceptedMember($world->id, $guid);
	}

	public function membersForWorld($worldId, $limit = 100) {
		$rows = $this->select(array(
			'from'     => self::MEMBERS_TABLE,
			'wheres'   => array(self::wheres('world_id', '=', intval($worldId))),
			'order_by' => 'time_created ASC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	/** Real invited/accepted/declined transition, invitee only — same idempotent shape as OssnPlans::respondInvite(). */
	public function respondInvite($worldId, $guid, $accept) {
		$membership = $this->getMembership($worldId, $guid);
		if (!$membership || $membership->role === 'owner') {
			return 'not_invited';
		}
		$newStatus = $accept ? 'accepted' : 'declined';
		$ok = parent::update(array(
			'table'  => self::MEMBERS_TABLE,
			'names'  => array('status', 'time_responded'),
			'values' => array($newStatus, time()),
			'wheres' => array(
				self::wheres('world_id', '=', intval($worldId)),
				self::wheres('user_guid', '=', intval($guid)),
			),
		));
		if ($ok && $accept && $membership->status !== 'accepted') {
			$world = $this->getWorld($worldId);
			if ($world && class_exists('OssnNotifications')) {
				(new OssnNotifications())->add('berx:world:joined', intval($guid), intval($worldId), intval($worldId), intval($world->owner_guid));
			}
		}
		return $ok ? 'ok' : 'failed';
	}

	/** Public worlds only — a direct real accepted join, no invite required (the whole point of "public"). */
	public function joinWorld($worldId, $guid) {
		$world = $this->getWorld($worldId);
		if (!$world) {
			return 'not_found';
		}
		if ($world->visibility !== self::VISIBILITY_PUBLIC) {
			return 'forbidden';
		}
		$existing = $this->getMembership($worldId, $guid);
		if ($existing) {
			return $existing->status === 'accepted' ? 'ok' : 'failed';
		}
		$ok = $this->insert(array(
			'into'   => self::MEMBERS_TABLE,
			'names'  => array('world_id', 'user_guid', 'role', 'status', 'time_created', 'time_responded'),
			'values' => array(intval($worldId), intval($guid), 'member', 'accepted', time(), time()),
		));
		if ($ok && class_exists('OssnNotifications')) {
			(new OssnNotifications())->add('berx:world:joined', intval($guid), intval($worldId), intval($worldId), intval($world->owner_guid));
		}
		return $ok ? 'ok' : 'failed';
	}

	public function leaveWorld($worldId, $guid) {
		$membership = $this->getMembership($worldId, $guid);
		if (!$membership) {
			return 'not_member';
		}
		if ($membership->role === 'owner') {
			// Real, honest constraint — a World always needs an owner; no ownership-transfer flow exists yet (disclosed follow-up), so the owner deletes the world instead of leaving it ownerless.
			return 'owner_cannot_leave';
		}
		$ok = parent::delete(array(
			'from'   => self::MEMBERS_TABLE,
			'wheres' => array(
				self::wheres('world_id', '=', intval($worldId)),
				self::wheres('user_guid', '=', intval($guid)),
			),
		));
		return $ok ? 'ok' : 'failed';
	}

	/** Real "my worlds" — worlds I own, plus worlds I'm an accepted member of, merged and deduplicated. Same two-query pattern as OssnPlans::myPlans(). */
	public function myWorlds($guid, $limit = 50) {
		$guid = intval($guid);
		$owned = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('owner_guid', '=', $guid)),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		$memberRows = $this->select(array(
			'from'   => self::MEMBERS_TABLE,
			'wheres' => array(
				self::wheres('user_guid', '=', $guid),
				self::wheres('status', '=', 'accepted'),
				self::wheres('role', '!=', 'owner'),
			),
		), true);
		$memberWorldIds = array();
		if ($memberRows) {
			foreach ($memberRows as $row) {
				$memberWorldIds[] = intval($row->world_id);
			}
		}
		$member = $this->select(array(
			'from'     => self::TABLE,
			'wheres'   => array(self::wheres('id', 'IN', $memberWorldIds ? $memberWorldIds : array(0))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		$byId = array();
		foreach (array_merge($owned ? $owned : array(), $member ? $member : array()) as $row) {
			$byId[intval($row->id)] = $row;
		}
		krsort($byId);
		return array_slice(array_values($byId), 0, intval($limit));
	}

	/**
	 * Attach an EXISTING real object to a world by reference. Any
	 * accepted member can add — same "any attendee can contribute"
	 * openness Life Moments already uses for its source contexts — but
	 * every item is independently re-verified for real existence AND,
	 * for the two private object types (plan/experience), that the
	 * acting user can actually view it (OssnPlans::canView() /
	 * OssnExperiences::participantStatus()) before it's ever attached
	 * — a world can never be used to leak a private plan/experience's
	 * existence to members who have no real relationship to it.
	 */
	public function addItem($worldId, $actingGuid, $itemType, $itemId) {
		$world = $this->getWorld($worldId);
		if (!$world) {
			return 'not_found';
		}
		if (!$this->isAcceptedMember($worldId, $actingGuid)) {
			return 'forbidden';
		}
		$itemType = (string) $itemType;
		$itemId = intval($itemId);
		if (!in_array($itemType, self::ITEM_TYPES, true) || !$itemId) {
			return 'invalid_item';
		}

		if (!$this->realItemExistsAndVisible($itemType, $itemId, $actingGuid)) {
			return 'invalid_item';
		}

		$existing = $this->select(array(
			'from'   => self::ITEMS_TABLE,
			'wheres' => array(
				self::wheres('world_id', '=', intval($worldId)),
				self::wheres('item_type', '=', $itemType),
				self::wheres('item_id', '=', $itemId),
			),
		));
		if ($existing) {
			return 'ok';
		}
		$ok = $this->insert(array(
			'into'   => self::ITEMS_TABLE,
			'names'  => array('world_id', 'item_type', 'item_id', 'added_by_guid', 'time_created'),
			'values' => array(intval($worldId), $itemType, $itemId, intval($actingGuid), time()),
		));
		return $ok ? 'ok' : 'failed';
	}

	private function realItemExistsAndVisible($itemType, $itemId, $actingGuid) {
		if ($itemType === 'place') {
			return class_exists('OssnPlaces') && (bool) (new OssnPlaces())->getPlace($itemId);
		}
		if ($itemType === 'event') {
			return class_exists('OssnEvents') && (bool) (new OssnEvents())->getEvent($itemId);
		}
		if ($itemType === 'plan') {
			if (!class_exists('OssnPlans')) {
				return false;
			}
			$plans = new OssnPlans();
			$plan = $plans->getPlan($itemId);
			return (bool) ($plan && $plans->canView($plan, $actingGuid));
		}
		if ($itemType === 'experience') {
			if (!class_exists('OssnExperiences')) {
				return false;
			}
			$experiences = new OssnExperiences();
			$experience = $experiences->get($itemId);
			if (!$experience) {
				return false;
			}
			$isOwner = intval($experience->owner_guid) === intval($actingGuid);
			return $isOwner || $experiences->participantStatus($itemId, $actingGuid) === 'accepted';
		}
		return false;
	}

	public function removeItem($worldId, $actingGuid, $itemType, $itemId) {
		$world = $this->getWorld($worldId);
		if (!$world) {
			return 'not_found';
		}
		$item = $this->select(array(
			'from'   => self::ITEMS_TABLE,
			'wheres' => array(
				self::wheres('world_id', '=', intval($worldId)),
				self::wheres('item_type', '=', (string) $itemType),
				self::wheres('item_id', '=', intval($itemId)),
			),
		));
		if (!$item) {
			return 'not_found';
		}
		$canRemove = $this->isOwner($world, $actingGuid) || intval($item->added_by_guid) === intval($actingGuid);
		if (!$canRemove) {
			return 'forbidden';
		}
		$ok = parent::delete(array(
			'from'   => self::ITEMS_TABLE,
			'wheres' => array(self::wheres('id', '=', intval($item->id))),
		));
		return $ok ? 'ok' : 'failed';
	}

	public function itemsForWorld($worldId, $limit = 100) {
		$rows = $this->select(array(
			'from'     => self::ITEMS_TABLE,
			'wheres'   => array(self::wheres('world_id', '=', intval($worldId))),
			'order_by' => 'time_created DESC',
			'limit'    => intval($limit),
		), true);
		return $rows ? $rows : array();
	}

	public function deleteWorld($id, $actingGuid) {
		$world = $this->getWorld($id);
		if (!$world) {
			return 'not_found';
		}
		if (!$this->isOwner($world, $actingGuid)) {
			return 'forbidden';
		}
		parent::delete(array(
			'from'   => self::ITEMS_TABLE,
			'wheres' => array(self::wheres('world_id', '=', intval($id))),
		));
		parent::delete(array(
			'from'   => self::MEMBERS_TABLE,
			'wheres' => array(self::wheres('world_id', '=', intval($id))),
		));
		$ok = parent::delete(array(
			'from'   => self::TABLE,
			'wheres' => array(self::wheres('id', '=', intval($id))),
		));
		return $ok ? 'ok' : 'failed';
	}
}
