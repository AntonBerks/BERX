<?php
/**
 * BERX — Points: Streak columns.
 *
 * Extends the existing `ossn_points_balance` (does not create a new
 * table) with real day-based streak tracking:
 *   current_streak    — consecutive real days with activity
 *   longest_streak     — real high-water mark, never decreases
 *   last_active_date   — 'YYYY-MM-DD', server date only, never
 *                         client-supplied
 *
 * Idempotent — same guard pattern as every prior BERX migration
 * (check INFORMATION_SCHEMA before altering, safe to run more than
 * once).
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_points_balance' AND COLUMN_NAME = 'current_streak'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
ALTER TABLE `ossn_points_balance`
  ADD COLUMN `current_streak` int NOT NULL DEFAULT 0,
  ADD COLUMN `longest_streak` int NOT NULL DEFAULT 0,
  ADD COLUMN `last_active_date` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL;
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
