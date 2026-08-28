<?php
/**
 * BERX WORLD — Plans. A genuinely new BERX-native object, not a
 * redesign of an existing one: People + Time + Place + Activity,
 * looser than a real Event (no fixed time/place required — "let's do
 * something" before anyone has committed to specifics) and able to
 * become a real Event once it firms up. Nothing in this schema
 * exists anywhere else in the codebase — confirmed against
 * docs/BERX_MIGRATION_REGISTRY.md before creating it.
 *
 * Real human problem: coordinating "who's free / where / when" today
 * means either creating a full Event (title, place, fixed time — too
 * much ceremony for "anyone want to grab coffee Saturday?") or just
 * messaging people with no shared, trackable object at all (no RSVP
 * state, nothing to convert into a real Event once it firms up). A
 * Plan is real middle ground: an owner, optional place_guid/starts_at
 * (both nullable — a real Plan can exist before either is decided),
 * and real per-invitee RSVP state (ossn_plan_invites), same
 * invited/accepted/declined shape OSSN's own friend request system
 * already uses elsewhere in this codebase, not a new one invented
 * from nothing.
 *
 * created_event_guid is the real transform-to-Event pointer — once a
 * Plan's invitees have actually confirmed and a real place/time
 * exist, the owner can convert it into a real OssnEvents row
 * (components/OssnApi/v1/plans.php's own /convert route) without
 * losing the Plan's own history; status becomes 'converted', never
 * deleted.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.24');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_plans'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_plans` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `place_guid` bigint DEFAULT NULL,
  `starts_at` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_event_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_status` (`status`),
  ADD KEY `index_place` (`place_guid`);

ALTER TABLE `ossn_plans`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_plan_invites` (
  `id` bigint NOT NULL,
  `plan_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'invited',
  `time_created` int NOT NULL,
  `time_responded` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_plan_invites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_plan_user` (`plan_id`, `user_guid`),
  ADD KEY `index_plan` (`plan_id`),
  ADD KEY `index_user` (`user_guid`);

ALTER TABLE `ossn_plan_invites`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.24',
));
$factory->connect();
