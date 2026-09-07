<?php
/**
 * BERX WORLD MAX BUILD — Post Drafts.
 *
 * Real save-for-later, not a client-only unsent-text cache: a draft
 * survives an app restart or a device switch (same account, same
 * bearer token reaches it from anywhere) because it's a real row, not
 * AsyncStorage. `visibility` is stored so a draft restores the exact
 * audience choice the author had picked, never silently defaulting
 * back to public. Publishing a draft (components/OssnApi/v1/posts.php's
 * own /drafts/{id}/publish route) reuses the real POST /posts path
 * verbatim — a published draft is a real post like any other, not a
 * separate content type.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.23');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_post_drafts'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_post_drafts` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `visibility` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'public',
  `time_created` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_post_drafts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`);

ALTER TABLE `ossn_post_drafts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.23',
));
$factory->connect();
