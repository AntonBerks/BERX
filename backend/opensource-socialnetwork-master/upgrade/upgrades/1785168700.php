<?php
/**
 * BERX — add boosted_until to ossn_dating_profiles, the real backing
 * field for the 'dating_boost' points-spend option (points.php +
 * dating.php's /dating/boost action). Idempotent.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_dating_profiles' AND COLUMN_NAME = 'boosted_until'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "ALTER TABLE `ossn_dating_profiles` ADD `boosted_until` int NOT NULL DEFAULT 0;";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
