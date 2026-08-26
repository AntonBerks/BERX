<?php
/**
 * BERX API v1 — Wrapped. No new class, no new table: real COUNT()
 * aggregates over the caller's own already-real data (OssnWall posts,
 * ossn_trips, ossn_experiences, ossn_relationships 'event:going'/
 * 'place:save'). Matches client.ts's wrapped() and types.ts's
 * BerxWrapped. Every number is a live query, never cached/estimated —
 * same principle already established for OssnCreator's view log and
 * OssnNearbyImpressions.
 */

if ($method !== 'GET') {
	ossn_api_error('not_found', 'Unknown wrapped route', 404);
}

$period = input('period') === 'week' ? 'week' : 'month';
$days = $period === 'week' ? 7 : 30;
$cutoff = time() - ($days * 86400);
$userGuid = intval($api_user_guid);

$postsCreated = 0;
$posts = (new OssnWall())->getPosterPosts($userGuid);
if ($posts) {
	foreach ($posts as $post) {
		if (intval($post->time_created) >= $cutoff) {
			$postsCreated++;
		}
	}
}

$db = new OssnDatabase();

$tripsRow = $db->select(array(
	'from'   => 'ossn_trips',
	'params' => array('COUNT(*) as cnt'),
	'wheres' => array(
		OssnDatabase::wheres('owner_guid', '=', $userGuid),
		OssnDatabase::wheres('time_created', '>=', $cutoff),
	),
));
$tripsCreated = $tripsRow ? intval($tripsRow->cnt) : 0;

$expRow = $db->select(array(
	'from'   => 'ossn_experiences',
	'params' => array('COUNT(*) as cnt'),
	'wheres' => array(
		OssnDatabase::wheres('owner_guid', '=', $userGuid),
		OssnDatabase::wheres('time_created', '>=', $cutoff),
	),
));
$experiencesCount = $expRow ? intval($expRow->cnt) : 0;

// Raw 'wheres' string passthrough — same real support already used by
// OssnObject::searchObject()/OssnEntities::get_entities() elsewhere in
// this codebase (checked via ossn_get_relationships()'s own body, not
// assumed): appended alongside the from/type array wheres before the
// count branch runs.
$eventsGoing = intval(ossn_get_relationships(array(
	'from'   => $userGuid,
	'type'   => 'event:going',
	'count'  => true,
	'wheres' => "r.time >= {$cutoff}",
)));
$placesSaved = intval(ossn_get_relationships(array(
	'from'   => $userGuid,
	'type'   => 'place:save',
	'count'  => true,
	'wheres' => "r.time >= {$cutoff}",
)));

$total = $postsCreated + $tripsCreated + $experiencesCount + $eventsGoing + $placesSaved;

ossn_api_json(array(
	'period'            => $period,
	'insufficient_data' => $total === 0,
	'posts_created'     => $postsCreated,
	'trips_created'     => $tripsCreated,
	'experiences_count' => $experiencesCount,
	'events_going'      => $eventsGoing,
	'places_saved'      => $placesSaved,
));
