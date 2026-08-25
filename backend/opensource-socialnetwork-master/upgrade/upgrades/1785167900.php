<?php
/**
 * BERX — add Stories (OssnStories component).
 * Idempotent: checks for the tables/row before creating them, safe to
 * run against a database that already has them (e.g. a fresh install
 * that already includes them in opensource-socialnetwork.sql).
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.0');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_stories'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_stories` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `storage_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `caption` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_created` int NOT NULL,
  `time_expires` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_stories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner_guid` (`owner_guid`),
  ADD KEY `index_time_expires` (`time_expires`);

ALTER TABLE `ossn_stories`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_stories_views` (
  `id` bigint NOT NULL,
  `story_id` bigint NOT NULL,
  `viewer_guid` bigint NOT NULL,
  `time_viewed` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_stories_views`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `index_unique_view` (`story_id`,`viewer_guid`),
  ADD KEY `index_viewer_guid` (`viewer_guid`);

ALTER TABLE `ossn_stories_views`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$db->statement("SELECT COUNT(*) AS c FROM `ossn_components` WHERE `com_id` = 'OssnStories'");
$db->execute();
$registered = $db->fetch();

if (!$registered || intval($registered->c) === 0) {
	$db->statement("INSERT INTO `ossn_components` (`com_id`, `active`) VALUES ('OssnStories', 1)");
	$db->execute();
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.0',
));
$factory->connect();
