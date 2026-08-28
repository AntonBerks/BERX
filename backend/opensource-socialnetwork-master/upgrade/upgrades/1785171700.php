<?php
/**
 * BERX WORLD — Worlds. A genuinely new first-class BERX object: a
 * real container that holds other real BERX objects (places, events,
 * plans, experiences) plus a real membership list — "a world" as in
 * "my ski trip world" or "our neighborhood world", not a metaphor.
 * Confirmed via grep before writing a line of code that no
 * OssnWorld / ossn_worlds concept existed anywhere in this codebase
 * (docs/BERX_MIGRATION_REGISTRY.md discipline).
 *
 * ossn_worlds: the container itself. `visibility` is real and
 *   enforced (public = anyone can view + self-join; private = only
 *   real accepted members). `is_temporary`/`expires_at` are real,
 *   stored, and surfaced to the client honestly — v1 does not yet run
 *   a background job to auto-archive an expired world; that's real,
 *   disclosed follow-up work, not a fabricated "auto-expires" claim.
 * ossn_world_members: real owner/member rows with a real
 *   invited/accepted/declined lifecycle — same shape as
 *   ossn_plan_invites, reused deliberately, not reinvented.
 * ossn_world_items: a real, generic attachment of an EXISTING BERX
 *   object (place/event/plan/experience) to a world by reference
 *   (item_type + item_id) — never a copy of that object's data, same
 *   discipline as OssnMediaAssets' context_type/context_guid pattern.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_worlds'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_worlds` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(2000) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `visibility` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'private',
  `is_temporary` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` int DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_worlds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_visibility` (`visibility`);

ALTER TABLE `ossn_worlds`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_world_members` (
  `id` bigint NOT NULL,
  `world_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `role` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'member',
  `status` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'invited',
  `time_created` int NOT NULL,
  `time_responded` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_world_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_world_user` (`world_id`, `user_guid`),
  ADD KEY `index_world` (`world_id`),
  ADD KEY `index_user` (`user_guid`);

ALTER TABLE `ossn_world_members`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_world_items` (
  `id` bigint NOT NULL,
  `world_id` bigint NOT NULL,
  `item_type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` bigint NOT NULL,
  `added_by_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_world_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_world_item` (`world_id`, `item_type`, `item_id`),
  ADD KEY `index_world` (`world_id`);

ALTER TABLE `ossn_world_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
