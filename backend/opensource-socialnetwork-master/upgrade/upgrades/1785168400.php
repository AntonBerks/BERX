<?php
/**
 * BERX — add OssnApi (BERX API v1 bearer-token auth layer).
 * Idempotent: checks for the table/component row before creating them.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_api_tokens'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_api_tokens` (
  `id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_general_ci NOT NULL,
  `device_label` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_created` int NOT NULL,
  `time_last_used` int DEFAULT NULL,
  `time_expires` int NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_api_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `index_unique_token_hash` (`token_hash`),
  ADD KEY `index_user_guid` (`user_guid`);

ALTER TABLE `ossn_api_tokens`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$db->statement("SELECT COUNT(*) AS c FROM `ossn_components` WHERE `com_id` = 'OssnApi'");
$db->execute();
$registered = $db->fetch();

if (!$registered || intval($registered->c) === 0) {
	$db->statement("INSERT INTO `ossn_components` (`com_id`, `active`) VALUES ('OssnApi', 1)");
	$db->execute();
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
