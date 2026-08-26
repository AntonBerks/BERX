<?php
/**
 * BERX API v1 — Life Graph. See docs/BERX_FUTURE_LAYER_SPEC.md for
 * the full architecture. No new class, no new table: real composition
 * over already-real OssnPlaces/OssnEvents/OssnTrips/OssnExperiences/
 * OssnGroup/OssnPoints and ossn_relationships. Every number in
 * `summary` is a live COUNT(), decoupled from the (bounded) edge list
 * below it — same honesty rule as wrapped.php, never a truncated
 * array length presented as a total.
 *
 * v1 scope: GET /lifegraph/me only — own graph, always full. A
 * `met_person` edge only ever surfaces a real friend (never a
 * stranger's attendance), per the spec's privacy rule.
 */

if ($method !== 'GET' || (isset($segments[0]) && $segments[0] !== 'me')) {
	ossn_api_error('not_found', 'Unknown lifegraph route', 404);
}

$userGuid = intval($api_user_guid);
$perCategory = 20;
$edges = array();

/* ---- saved / going-or-attended (ossn_relationships) ---- */

$attendedEventIds = array();
if (class_exists('OssnPlaces')) {
	$places = new OssnPlaces();
	$rows = ossn_get_relationships(array('from' => $userGuid, 'type' => 'place:save', 'limit' => $perCategory, 'page_limit' => false));
	if ($rows) {
		foreach ($rows as $r) {
			$p = $places->getPlace($r->relation_to);
			if ($p) {
				$edges[] = array('type' => 'saved_place', 'target_type' => 'place', 'target_guid' => intval($p->guid), 'target_title' => (string) $p->title, 'time' => intval($r->time));
			}
		}
	}
}

if (class_exists('OssnEvents')) {
	$eventsModel = new OssnEvents();
	$rows = ossn_get_relationships(array('from' => $userGuid, 'type' => 'event:going', 'limit' => $perCategory, 'page_limit' => false));
	if ($rows) {
		foreach ($rows as $r) {
			$e = $eventsModel->getEvent($r->relation_to);
			if (!$e) {
				continue;
			}
			$edges[] = array('type' => $e->has_ended ? 'attended_event' : 'going_event', 'target_type' => 'event', 'target_guid' => intval($e->guid), 'target_title' => (string) $e->title, 'time' => intval($r->time));
			if ($e->has_ended) {
				$attendedEventIds[] = intval($e->guid);
			}
		}
	}
}

/* ---- reviewed places (ossn_place_reviews, direct — no per-author list method exists on OssnPlaces, and adding one just for this read isn't worth a wider API surface) ---- */

if (class_exists('OssnPlaces')) {
	$reviewRows = (new OssnDatabase())->select(array(
		'from'     => 'ossn_place_reviews',
		'wheres'   => array(OssnDatabase::wheres('author_guid', '=', $userGuid)),
		'order_by' => 'time_created DESC',
		'limit'    => $perCategory,
	), true);
	if ($reviewRows) {
		$places = new OssnPlaces();
		foreach ($reviewRows as $row) {
			$p = $places->getPlace($row->place_guid);
			if ($p) {
				$edges[] = array('type' => 'reviewed_place', 'target_type' => 'place', 'target_guid' => intval($p->guid), 'target_title' => (string) $p->title, 'time' => intval($row->time_created));
			}
		}
	}
}

/* ---- joined communities (relation_to = member, relation_from = group — real direction confirmed via OssnGroup::createGroup()'s own ossn_add_relation() call) ---- */

$groupRows = ossn_get_relationships(array('to' => $userGuid, 'type' => 'group:join:approve', 'limit' => $perCategory, 'page_limit' => false));
if ($groupRows) {
	foreach ($groupRows as $r) {
		$group = ossn_get_group_by_guid($r->relation_from);
		if ($group) {
			$edges[] = array('type' => 'joined_community', 'target_type' => 'community', 'target_guid' => intval($group->guid), 'target_title' => (string) $group->title, 'time' => intval($r->time));
		}
	}
}

/* ---- created trips / experiences ---- */

if (class_exists('OssnTrips')) {
	$trips = (new OssnTrips())->listByOwner($userGuid, $userGuid);
	if ($trips) {
		foreach ($trips as $t) {
			$edges[] = array('type' => 'created_trip', 'target_type' => 'trip', 'target_guid' => intval($t->id), 'target_title' => (string) $t->title, 'time' => intval($t->time_created));
		}
	}
}
if (class_exists('OssnExperiences')) {
	$experiences = (new OssnExperiences())->listByOwner($userGuid, $userGuid);
	if ($experiences) {
		foreach ($experiences as $ex) {
			$edges[] = array('type' => 'created_experience', 'target_type' => 'experience', 'target_guid' => intval($ex->id), 'target_title' => (string) $ex->title, 'time' => intval($ex->time_created));
		}
	}
}

/* ---- earned rewards ---- */

if (class_exists('OssnPoints')) {
	$history = (new OssnPoints())->history($userGuid, $perCategory);
	if ($history) {
		foreach ($history as $h) {
			$edges[] = array('type' => 'earned_reward', 'target_type' => 'reward', 'target_guid' => null, 'target_title' => (string) $h->reason, 'amount' => intval($h->delta), 'time' => intval($h->time_created));
		}
	}
}

/* ---- met_person: real friends who co-attended an event the caller attended. Bounded by attended events (already capped above) x each event's attendee list (already capped at 50 by OssnEvents::attendees()). Never a stranger. ---- */

if (class_exists('OssnEvents') && $attendedEventIds) {
	$eventsModel = new OssnEvents();
	$seen = array();
	foreach ($attendedEventIds as $eventGuid) {
		if (count($seen) >= $perCategory) {
			break;
		}
		$attendeeRows = $eventsModel->attendees($eventGuid, 50);
		foreach ($attendeeRows as $row) {
			$otherGuid = intval($row->relation_from);
			if ($otherGuid === $userGuid || isset($seen[$otherGuid])) {
				continue;
			}
			$acting = ossn_user_by_guid($userGuid);
			if (!$acting || !$acting->isFriend($userGuid, $otherGuid)) {
				continue;
			}
			$other = ossn_user_by_guid($otherGuid);
			if (!$other) {
				continue;
			}
			$seen[$otherGuid] = true;
			$edges[] = array(
				'type'         => 'met_person',
				'target_type'  => 'person',
				'target_guid'  => $otherGuid,
				'target_title' => trim($other->first_name . ' ' . $other->last_name),
				'context_guid' => $eventGuid,
				'time'         => intval($row->time),
			);
			if (count($seen) >= $perCategory) {
				break;
			}
		}
	}
}

usort($edges, function ($a, $b) {
	return $b['time'] <=> $a['time'];
});
$edges = array_slice($edges, 0, 60);

/* ---- live summary — decoupled real COUNT()s, never the (capped) edge list lengths above ---- */

$db = new OssnDatabase();

$placesSavedCount = intval(ossn_get_relationships(array('from' => $userGuid, 'type' => 'place:save', 'count' => true)));
$eventsGoingCount = intval(ossn_get_relationships(array('from' => $userGuid, 'type' => 'event:going', 'count' => true)));
$communitiesJoinedCount = intval(ossn_get_relationships(array('to' => $userGuid, 'type' => 'group:join:approve', 'count' => true)));

$reviewCountRow = $db->select(array('from' => 'ossn_place_reviews', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('author_guid', '=', $userGuid))));
$tripsCountRow = $db->select(array('from' => 'ossn_trips', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $userGuid))));
$experiencesCountRow = $db->select(array('from' => 'ossn_experiences', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $userGuid))));

ossn_api_json(array(
	'edges'   => $edges,
	'summary' => array(
		'places_saved'        => $placesSavedCount,
		'places_reviewed'     => $reviewCountRow ? intval($reviewCountRow->cnt) : 0,
		'events_going'        => $eventsGoingCount,
		'communities_joined'  => $communitiesJoinedCount,
		'trips_created'       => $tripsCountRow ? intval($tripsCountRow->cnt) : 0,
		'experiences_created' => $experiencesCountRow ? intval($experiencesCountRow->cnt) : 0,
		// No real total exists for 'connections met' — it's derived
		// (co-attendance x friendship), not a single indexed table to
		// COUNT(), and computing the true lifetime figure would mean an
		// unbounded scan over every event ever attended. Rather than
		// present a capped-list length as if it were a real total
		// (dishonest — same rule as every other number here), this is
		// simply omitted from summary; the real edges are still visible
		// in `edges` (type: 'met_person') for whatever's in this bounded read.
	),
));
