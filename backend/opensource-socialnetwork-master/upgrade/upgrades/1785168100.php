<?php
/**
 * BERX — add BERX Match Pass/Skip tracking (ossn_dating_passes).
 * Idempotent: checks for the table before creating it, safe to run
 * against a database that already has it (fresh installs get it
 * directly from opensource-socialnetwork.sql).
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_dating_passes'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_dating_passes` (
  `id` bigint NOT NULL,
  `from_guid` bigint NOT NULL,
  `to_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_dating_passes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `index_unique_pass` (`from_guid`,`to_guid`),
  ADD KEY `index_from_guid` (`from_guid`);

ALTER TABLE `ossn_dating_passes`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
