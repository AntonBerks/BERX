<?php
/**
 * BERX — add OssnReport (shared content-report queue).
 * Idempotent: checks for the table/component row before creating them.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_reports'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_reports` (
  `id` bigint NOT NULL,
  `reporter_guid` bigint NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `target_guid` bigint NOT NULL,
  `reason` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `note` varchar(1000) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `time_created` int NOT NULL,
  `time_reviewed` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_target` (`target_type`,`target_guid`),
  ADD KEY `index_status` (`status`),
  ADD KEY `index_reporter` (`reporter_guid`);

ALTER TABLE `ossn_reports`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$db->statement("SELECT COUNT(*) AS c FROM `ossn_components` WHERE `com_id` = 'OssnReport'");
$db->execute();
$registered = $db->fetch();

if (!$registered || intval($registered->c) === 0) {
	$db->statement("INSERT INTO `ossn_components` (`com_id`, `active`) VALUES ('OssnReport', 1)");
	$db->execute();
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
