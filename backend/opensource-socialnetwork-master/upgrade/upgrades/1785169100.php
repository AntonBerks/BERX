<?php
/**
 * BERX — Trips.
 *
 * A named itinerary an owner builds from real Places/Events, with
 * real friends as participants. Same architectural family as
 * Collections (owner-scoped container + item rows) but with two
 * differences that earn it a separate domain rather than reuse:
 * items are ordered by day (trip planning is inherently sequential),
 * and trips have participants (a trip is planned WITH people, a
 * collection is just saved FOR yourself).
 *
 * ossn_trips: owner-scoped trip shell (title, date range, visibility).
 * ossn_trip_stops: real place/event references, ordered by
 *   (day_number, sort_order) — day_number is 1-based, relative to the
 *   trip's start_date, not an absolute calendar date, so a trip
 *   without confirmed dates yet can still be planned day-by-day.
 * ossn_trip_participants: real friends only (enforced in the class,
 *   same as Circles) — a trip is never plannable with an arbitrary
 *   non-friend guid.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.3');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_trips'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_trips` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `start_date` int DEFAULT NULL,
  `end_date` int DEFAULT NULL,
  `visibility` int NOT NULL DEFAULT 1,
  `time_created` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_visibility` (`visibility`);

ALTER TABLE `ossn_trips`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_trip_stops` (
  `id` bigint NOT NULL,
  `trip_id` bigint NOT NULL,
  `item_type` varchar(24) COLLATE utf8mb4_general_ci NOT NULL,
  `item_guid` bigint NOT NULL,
  `day_number` int NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  `note` varchar(280) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_trip_stops`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_trip` (`trip_id`),
  ADD KEY `index_trip_day` (`trip_id`, `day_number`, `sort_order`);

ALTER TABLE `ossn_trip_stops`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_trip_participants` (
  `id` bigint NOT NULL,
  `trip_id` bigint NOT NULL,
  `member_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_trip_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant_per_trip` (`trip_id`, `member_guid`),
  ADD KEY `index_trip` (`trip_id`);

ALTER TABLE `ossn_trip_participants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.3',
));
$factory->connect();
