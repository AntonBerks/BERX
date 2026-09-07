<?php
/**
 * BERX API v1 — Next. The forward-looking counterpart to lifegraph.php
 * (which looks back): real things that need the caller's attention or
 * are genuinely coming up. No new class, no new table — composition
 * over OssnPlans/OssnEvents/OssnWorlds, same discipline as
 * lifegraph.php itself.
 *
 * Deliberately THREE separate real lists, not one merged "feed" —
 * a pending Plan/World invite has no real "when" until it's decided,
 * an upcoming Event does. Forcing them into one sorted timeline would
 * fabricate a false single order; three honest buckets is the
 * accurate shape of "what's next".
 *
 * v1 scope: GET /next/mine only — own forward view, always full.
 */

if ($method !== 'GET' || (isset($segments[0]) && $segments[0] !== 'mine')) {
	ossn_api_error('not_found', 'Unknown next route', 404);
}

$userGuid = intval($api_user_guid);
$limit = 20;

/* ---- pending Plan invites — real rows I haven't answered yet ---- */

$pendingPlanInvites = array();
if (class_exists('OssnPlans')) {
	$plans = new OssnPlans();
	$inviteRows = (new OssnDatabase())->select(array(
		'from'     => 'ossn_plan_invites',
		'wheres'   => array(
			OssnDatabase::wheres('user_guid', '=', $userGuid),
			OssnDatabase::wheres('status', '=', 'invited'),
		),
		'order_by' => 'time_created DESC',
		'limit'    => $limit,
	), true);
	if ($inviteRows) {
		foreach ($inviteRows as $row) {
			$plan = $plans->getPlan($row->plan_id);
			if (!$plan || $plan->status !== OssnPlans::STATUS_ACTIVE) {
				continue;
			}
			$owner = ossn_user_by_guid($plan->owner_guid);
			$pendingPlanInvites[] = array(
				'id'             => intval($plan->id),
				'title'          => (string) $plan->title,
				'owner_guid'     => intval($plan->owner_guid),
				'owner_username' => $owner ? (string) $owner->username : null,
				'starts_at'      => $plan->starts_at !== null ? intval($plan->starts_at) : null,
				'time_created'   => intval($row->time_created),
			);
		}
	}
}

/* ---- pending World invites — real rows I haven't answered yet ---- */

$pendingWorldInvites = array();
if (class_exists('OssnWorlds')) {
	$worlds = new OssnWorlds();
	$memberRows = (new OssnDatabase())->select(array(
		'from'     => 'ossn_world_members',
		'wheres'   => array(
			OssnDatabase::wheres('user_guid', '=', $userGuid),
			OssnDatabase::wheres('status', '=', 'invited'),
		),
		'order_by' => 'time_created DESC',
		'limit'    => $limit,
	), true);
	if ($memberRows) {
		foreach ($memberRows as $row) {
			$world = $worlds->getWorld($row->world_id);
			if (!$world) {
				continue;
			}
			$owner = ossn_user_by_guid($world->owner_guid);
			$pendingWorldInvites[] = array(
				'id'             => intval($world->id),
				'title'          => (string) $world->title,
				'owner_guid'     => intval($world->owner_guid),
				'owner_username' => $owner ? (string) $owner->username : null,
				'time_created'   => intval($row->time_created),
			);
		}
	}
}

/* ---- upcoming Events — real RSVPs, not yet started, not yet checkpointed ---- */

$upcomingEvents = array();
if (class_exists('OssnEvents')) {
	$events = new OssnEvents();
	$rows = ossn_get_relationships(array('from' => $userGuid, 'type' => 'event:going', 'limit' => $limit, 'page_limit' => false));
	if ($rows) {
		foreach ($rows as $r) {
			$event = $events->getEvent($r->relation_to);
			if (!$event || $event->has_ended) {
				continue;
			}
			$place = ($event->place_guid && class_exists('OssnPlaces')) ? (new OssnPlaces())->getPlace($event->place_guid) : null;
			$upcomingEvents[] = array(
				'guid'            => intval($event->guid),
				'title'           => (string) $event->title,
				'starts'          => intval($event->starts),
				'place_guid'      => $event->place_guid ? intval($event->place_guid) : null,
				'place_title'     => $place ? (string) $place->title : null,
				'has_checked_in'  => $events->hasCheckedIn($event->guid, $userGuid),
			);
		}
	}
	usort($upcomingEvents, function ($a, $b) {
		return $a['starts'] <=> $b['starts'];
	});
}

ossn_api_json(array(
	'pending_plan_invites'  => $pendingPlanInvites,
	'pending_world_invites' => $pendingWorldInvites,
	'upcoming_events'       => $upcomingEvents,
));
