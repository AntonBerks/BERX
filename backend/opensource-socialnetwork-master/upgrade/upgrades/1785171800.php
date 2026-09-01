<?php
/**
 * BERX WORLD — Hashtags. A genuinely missing core social-network
 * primitive, confirmed by grep before writing a line of code that no
 * hashtag concept existed anywhere in this codebase (no table, no
 * class, no route — unlike @mentions, which turned out to already be
 * fully wired end-to-end except its own trigger).
 *
 * ossn_post_hashtags: one real row per (post, tag) pair, extracted
 *   from the post's own real text at creation time (see
 *   OssnHashtags::extractAndStore()) — never a guessed or inferred
 *   tag. owner_guid is duplicated onto this table (not just reachable
 *   via a join) so trending/lookup queries never need to touch
 *   ossn_wall_wall_entity at all for the common case.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_post_hashtags'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_post_hashtags` (
  `id` bigint NOT NULL,
  `post_guid` bigint NOT NULL,
  `hashtag` varchar(60) COLLATE utf8mb4_general_ci NOT NULL,
  `owner_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_post_hashtags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_post_hashtag` (`post_guid`, `hashtag`),
  ADD KEY `index_hashtag` (`hashtag`),
  ADD KEY `index_owner` (`owner_guid`);

ALTER TABLE `ossn_post_hashtags`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
