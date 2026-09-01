<?php
/**
 * BERX API v1 — Future Identity (Max Build).
 *
 * ARCHITECTURE DECISION (short): "Future Identity" composes Profile +
 * Life Graph counts + Reputation + real progression into ONE response
 * — no new table. Achievements and interests are PURELY DERIVED at
 * read time from data that already exists (ossn_place_reviews,
 * ossn_relationships edges, ossn_points_balance, OssnUser::getFriends)
 * — the same real-COUNT()-not-invented-score discipline as
 * lifegraph.php/me.php's own reputation block. An achievement is a
 * deterministic threshold on a real number, never a stored badge row,
 * so there is nothing to backfill or get out of sync.
 *
 * Interests: derived from the actual categories of places the caller
 * has saved or reviewed (both real signals, already used elsewhere in
 * the Future Layer) — not a fake "AI-inferred" interest, pure
 * frequency counting over real activity, capped at 100 places each so
 * the cost stays bounded even for very active accounts.
 */

function ossn_api_identity_tier($value, array $thresholds) {
	$tier = 0;
	foreach ($thresholds as $i => $t) {
		if ($value >= $t) {
			$tier = $i + 1;
		}
	}
	$next = null;
	foreach ($thresholds as $t) {
		if ($value < $t) {
			$next = $t;
			break;
		}
	}
	return array('tier' => $tier, 'next_threshold' => $next);
}

function ossn_api_identity_achievement($key, $labels, $value, array $thresholds) {
	$r = ossn_api_identity_tier($value, $thresholds);
	return array(
		'key'            => $key,
		'value'          => intval($value),
		'tier'           => $r['tier'],
		// $labels[0] is the achievement's own name (shown even at tier 0,
		// so a not-yet-started achievement is still visible, not hidden —
		// real progression needs a visible target). $labels[$tier] for
		// tier>0 is the earned title.
		'label'          => (string) $labels[0],
		'tier_label'     => $r['tier'] > 0 ? (string) $labels[$r['tier']] : null,
		'next_threshold' => $r['next_threshold'],
	);
}

function ossn_api_identity_compose($guid) {
	$guid = intval($guid);
	$db = new OssnDatabase();

	$pointsModel = new OssnPoints();
	$balance = $pointsModel->getBalance($guid);
	if (!$balance) {
		$balance = array('balance' => 0, 'lifetime_earned' => 0, 'level' => 1, 'current_streak' => 0, 'longest_streak' => 0);
	}

	$checkinsCount = class_exists('OssnPlaces') ? intval(ossn_get_relationships(array('from' => $guid, 'type' => OssnPlaces::CHECKIN_RELATION, 'count' => true))) : 0;
	$reviewCountRow = $db->select(array('from' => 'ossn_place_reviews', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('author_guid', '=', $guid))));
	$tripsRow = $db->select(array('from' => 'ossn_trips', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$experiencesRow = $db->select(array('from' => 'ossn_experiences', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));

	$placesReviewed = $reviewCountRow ? intval($reviewCountRow->cnt) : 0;
	$tripsCreated = $tripsRow ? intval($tripsRow->cnt) : 0;
	$experiencesCreated = $experiencesRow ? intval($experiencesRow->cnt) : 0;
	$placesSaved = intval(ossn_get_relationships(array('from' => $guid, 'type' => 'place:save', 'count' => true)));
	$eventsGoing = class_exists('OssnEvents') ? intval(ossn_get_relationships(array('from' => $guid, 'type' => 'event:going', 'count' => true))) : 0;
	$communitiesJoined = intval(ossn_get_relationships(array('to' => $guid, 'type' => 'group:join:approve', 'count' => true)));

	// BERX WORLD — same real COUNT() pattern, folded in alongside the
	// original set (kept identical to profiles.php/me.php's own
	// reputation blocks so none of the three go stale relative to the
	// others).
	$plansRow = $db->select(array('from' => 'ossn_plans', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$momentsRow = $db->select(array('from' => 'ossn_moments', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$memoriesRow = $db->select(array('from' => 'ossn_memories', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$worldsRow = $db->select(array('from' => 'ossn_worlds', 'params' => array('COUNT(*) as cnt'), 'wheres' => array(OssnDatabase::wheres('owner_guid', '=', $guid))));
	$plansCreated = $plansRow ? intval($plansRow->cnt) : 0;
	$momentsCreated = $momentsRow ? intval($momentsRow->cnt) : 0;
	$memoriesSaved = $memoriesRow ? intval($memoriesRow->cnt) : 0;
	$worldsCreated = $worldsRow ? intval($worldsRow->cnt) : 0;

	$userModel = new OssnUser();
	$friendRows = $userModel->getFriends($guid, array('limit' => 2000, 'page_limit' => false));
	$friendsCount = $friendRows ? count($friendRows) : 0;

	// Interests — derived from real category metadata on places the
	// caller actually engaged with (saved or reviewed), deduped by
	// place guid so one place doesn't count twice.
	$categoryCounts = array();
	$seenPlaceGuids = array();
	if (class_exists('OssnPlaces')) {
		$placesModel = new OssnPlaces();
		$savedRows = ossn_get_relationships(array('from' => $guid, 'type' => 'place:save', 'limit' => 100, 'page_limit' => false));
		if ($savedRows) {
			foreach ($savedRows as $row) {
				$seenPlaceGuids[intval($row->relation_to)] = true;
			}
		}
		$reviewedRows = $db->select(array('from' => 'ossn_place_reviews', 'params' => array('place_guid'), 'wheres' => array(OssnDatabase::wheres('author_guid', '=', $guid)), 'limit' => 100), true);
		if ($reviewedRows) {
			foreach ($reviewedRows as $row) {
				$seenPlaceGuids[intval($row->place_guid)] = true;
			}
		}
		foreach (array_keys($seenPlaceGuids) as $placeGuid) {
			$place = $placesModel->getPlace($placeGuid);
			if ($place && !empty($place->category)) {
				$cat = (string) $place->category;
				$categoryCounts[$cat] = isset($categoryCounts[$cat]) ? $categoryCounts[$cat] + 1 : 1;
			}
		}
	}
	arsort($categoryCounts);
	$interests = array();
	$i = 0;
	foreach ($categoryCounts as $cat => $cnt) {
		if ($i >= 5) {
			break;
		}
		$interests[] = array('category' => $cat, 'count' => $cnt);
		$i++;
	}

	$achievements = array(
		ossn_api_identity_achievement('explorer', array('Исследователь мест', 'Новичок', 'Исследователь', 'Знаток', 'Легенда мест'), $placesReviewed, array(1, 5, 15, 50)),
		ossn_api_identity_achievement('curator', array('Куратор коллекции', 'Собиратель', 'Куратор', 'Архивариус'), $placesSaved, array(5, 20, 50)),
		ossn_api_identity_achievement('socialite', array('Завсегдатай событий', 'Гость', 'Завсегдатай', 'Душа компании'), $eventsGoing, array(1, 5, 15)),
		ossn_api_identity_achievement('planner', array('Планировщик поездок', 'Планировщик', 'Штурман'), $tripsCreated, array(1, 5)),
		ossn_api_identity_achievement('creator', array('Автор впечатлений', 'Автор', 'Создатель'), $experiencesCreated, array(1, 5)),
		ossn_api_identity_achievement('connected', array('Социальный граф', 'Знакомый', 'Общительный', 'Хаб'), $friendsCount, array(5, 20, 50)),
		ossn_api_identity_achievement('consistent', array('Стабильность', 'Стабильный', 'Непоколебимый'), intval($balance['longest_streak']), array(7, 30)),
		ossn_api_identity_achievement('versatile', array('Разносторонность', 'Разносторонний', 'Универсал'), count($categoryCounts), array(3, 6)),
		ossn_api_identity_achievement('wanderer', array('Странник', 'В пути', 'Странник', 'Кочевник'), $checkinsCount, array(1, 10, 30)),
		// BERX WORLD — real thresholds over this session's own new
		// objects, same honest tier pattern as every achievement above
		// (a real count crossing a real threshold, never an invented score).
		ossn_api_identity_achievement('organizer', array('Организатор', 'Инициатор', 'Организатор', 'Заводила'), $plansCreated, array(1, 5, 15)),
		ossn_api_identity_achievement('chronicler', array('Хроники моментов', 'Летописец', 'Хранитель памяти'), $momentsCreated + $memoriesSaved, array(5, 25)),
		ossn_api_identity_achievement('worldbuilder', array('Строитель миров', 'Строитель', 'Архитектор миров'), $worldsCreated, array(1, 3)),
	);

	return array(
		'level'              => intval($balance['level']),
		'balance'            => intval($balance['balance']),
		'lifetime_earned'    => intval($balance['lifetime_earned']),
		'current_streak'     => intval($balance['current_streak']),
		'longest_streak'     => intval($balance['longest_streak']),
		'reputation'         => array(
			'places_reviewed'     => $placesReviewed,
			'places_saved'        => $placesSaved,
			'events_going'        => $eventsGoing,
			'communities_joined'  => $communitiesJoined,
			'trips_created'       => $tripsCreated,
			'experiences_created' => $experiencesCreated,
			'friends_count'       => $friendsCount,
			'checkins_count'      => $checkinsCount,
			'plans_created'       => $plansCreated,
			'moments_created'     => $momentsCreated,
			'memories_saved'      => $memoriesSaved,
			'worlds_created'      => $worldsCreated,
		),
		'interests'          => $interests,
		'achievements'       => $achievements,
	);
}

$segment0 = isset($segments[0]) ? $segments[0] : null;

if ($segment0 === 'me' && $method === 'GET') {
	ossn_api_json(array('identity' => ossn_api_identity_compose($api_user_guid)));
}

ossn_api_error('not_found', 'Unknown identity action', 404);
