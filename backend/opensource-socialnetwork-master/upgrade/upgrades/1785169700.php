<?php
/**
 * BERX — Streak. Extends the existing ossn_points_balance table
 * (one row per user already exists there) rather than a new table —
 * streak is per-user state alongside the balance it already tracks.
 *
 * last_active_date is stored as 'YYYY-MM-DD', always computed from
 * PHP's server date() — never accepted from the client. See
 * OssnPoints::recordActivity() for the real anti-abuse logic.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.8');

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
	'version'  => '10.8',
));
$factory->connect();
