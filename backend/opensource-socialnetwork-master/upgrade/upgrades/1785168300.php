<?php
/**
 * BERX — add optional coordinates to BERX Match profiles, for real
 * distance filtering. Opt-in and hidden by default (hide_location=1)
 * even once set — a user must explicitly reveal it, same privacy
 * default posture as hide_age/hide_city.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_dating_profiles' AND COLUMN_NAME = 'latitude'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	ossn_run_sql_script("
ALTER TABLE `ossn_dating_profiles`
  ADD COLUMN `hide_location` tinyint(1) NOT NULL DEFAULT 1 AFTER `hide_city`,
  ADD COLUMN `latitude` decimal(9,6) DEFAULT NULL AFTER `hide_location`,
  ADD COLUMN `longitude` decimal(9,6) DEFAULT NULL AFTER `latitude`;
");
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
