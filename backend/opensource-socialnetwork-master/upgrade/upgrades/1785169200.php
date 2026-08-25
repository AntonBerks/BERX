<?php
/**
 * BERX — Experiences.
 *
 * An Experience = a real Place or Event + a schedule + real
 * participants. Distinct from a Trip (a multi-stop, multi-day
 * itinerary) and from a bare Event RSVP (Events already have their
 * own attendee/RSVP system) — an Experience is a SMALLER, host-curated
 * plan anchored to exactly one Place or Event, with an explicit
 * invited-participant list rather than open RSVP.
 *
 * Deliberately NO ticket/payment/reservation columns: that lifecycle
 * (Ticket Type -> Inventory -> Order -> Payment -> Issued Ticket ->
 * QR -> Check-in) requires real payment infrastructure that does not
 * exist anywhere in this codebase. Building it here would mean
 * fabricating a purchase flow — explicitly forbidden. This table is
 * honestly scoped to what's real: a scheduled plan with real people.
 *
 * ossn_experiences.place_guid / event_guid: exactly one is set, never
 * both, never neither — enforced in OssnExperiences::create(), not
 * just documented here.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.4');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_experiences'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_experiences` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `place_guid` bigint DEFAULT NULL,
  `event_guid` bigint DEFAULT NULL,
  `scheduled_start` int NOT NULL,
  `scheduled_end` int DEFAULT NULL,
  `visibility` int NOT NULL DEFAULT 1,
  `time_created` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_experiences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_event` (`event_guid`),
  ADD KEY `index_schedule` (`scheduled_start`);

ALTER TABLE `ossn_experiences`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_experience_participants` (
  `id` bigint NOT NULL,
  `experience_id` bigint NOT NULL,
  `member_guid` bigint NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'invited',
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_experience_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant_per_experience` (`experience_id`, `member_guid`),
  ADD KEY `index_experience` (`experience_id`);

ALTER TABLE `ossn_experience_participants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.4',
));
$factory->connect();
