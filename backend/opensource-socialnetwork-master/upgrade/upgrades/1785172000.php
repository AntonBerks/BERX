<?php
/**
 * BERX WORLD — Post Polls. No stock OSSN polls plugin exists anywhere
 * in this codebase (confirmed by directory listing before writing a
 * line of code) — a large-scale social network needs a real way to
 * ask a question and see real, counted answers, not just text. Two
 * real BERX-native tables (OssnDatabase-only, same shape as every
 * other BERX-invented domain this session added — see
 * docs/BERX_MIGRATION_REGISTRY.md):
 *
 * ossn_post_polls: one real row per poll — post_guid is UNIQUE (a
 *   post has at most one poll), options_json is the real ordered
 *   option list (2-6 entries, validated server-side before storage),
 *   ends_at is optional (null = never expires).
 *
 * ossn_post_poll_votes: one real row per (post, voter) — UNIQUE KEY
 *   on (post_guid, voter_guid) enforces exactly one live vote per
 *   voter at the DB level, not just convention. Revoting deletes the
 *   old row first (see OssnPolls::vote()), so this is never a stale
 *   duplicate.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_post_polls'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_post_polls` (
  `id` bigint NOT NULL,
  `post_guid` bigint NOT NULL,
  `options_json` text NOT NULL,
  `ends_at` int DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_post_polls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_post` (`post_guid`);

ALTER TABLE `ossn_post_polls`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$db2 = new OssnDatabase();
$db2->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_post_poll_votes'");
$db2->execute();
$exists2 = $db2->fetch();

if (!$exists2 || intval($exists2->c) === 0) {
	$sql2 = "
CREATE TABLE `ossn_post_poll_votes` (
  `id` bigint NOT NULL,
  `post_guid` bigint NOT NULL,
  `voter_guid` bigint NOT NULL,
  `option_index` int NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_post_poll_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_vote` (`post_guid`,`voter_guid`),
  ADD KEY `index_post` (`post_guid`);

ALTER TABLE `ossn_post_poll_votes`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql2);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
