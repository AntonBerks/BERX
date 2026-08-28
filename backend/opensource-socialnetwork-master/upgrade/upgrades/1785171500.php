<?php
/**
 * BERX WORLD — Memories, real (not "old photos"). See
 * classes/OssnMemories.php's own header for the full rationale.
 *
 * ossn_memories: one real, persisted memory per (owner, source) —
 *   NOT a derived "on this day" computation (memories.php's existing
 *   GET / route stays exactly as-is, unaffected — this is additive).
 *   source_type/source_id point at the real BERX object a memory was
 *   saved from (only 'experience' in this pass; the schema is
 *   source-agnostic on purpose so 'event'/'trip'/'plan' are a real,
 *   scoped follow-up, not a redesign, when their turn comes).
 * ossn_memory_participants: WHO was really there — a real snapshot of
 *   the source's actual accepted participants at save time, its own
 *   table (not a denormalized blob) so it stays a real, queryable
 *   relationship, same discipline as ossn_plan_invites.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.25');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_memories'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_memories` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `source_type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `source_id` bigint NOT NULL,
  `place_guid` bigint DEFAULT NULL,
  `happened_at` int NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_memories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_owner_source` (`owner_guid`, `source_type`, `source_id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_source` (`source_type`, `source_id`);

ALTER TABLE `ossn_memories`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_memory_participants` (
  `id` bigint NOT NULL,
  `memory_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_memory_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_memory_user` (`memory_id`, `user_guid`),
  ADD KEY `index_memory` (`memory_id`);

ALTER TABLE `ossn_memory_participants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.25',
));
$factory->connect();
