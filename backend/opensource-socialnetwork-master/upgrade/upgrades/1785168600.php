<?php
/**
 * BERX — add ossn_points_balance and ossn_points_log for the points/
 * level/gamification system. Idempotent, same pattern as
 * 1785168500.php.
 *
 * ossn_points_balance: one row per user, current total. Kept as a
 * separate running total rather than SUM()-ing the log on every read
 * — a user's balance is checked on nearly every screen (header badge),
 * a running total avoids scanning the whole log each time.
 *
 * ossn_points_log: append-only ledger of every earn/spend event —
 * the actual source of truth for "why does this user have this many
 * points" and for a real history screen, not just the number.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_points_balance'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_points_balance` (
  `user_guid` bigint NOT NULL,
  `balance` int NOT NULL DEFAULT 0,
  `lifetime_earned` int NOT NULL DEFAULT 0,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_points_balance`
  ADD PRIMARY KEY (`user_guid`);
";
	ossn_run_sql_script($sql);
}

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_points_log'");
$db->execute();
$exists2 = $db->fetch();

if (!$exists2 || intval($exists2->c) === 0) {
	$sql2 = "
CREATE TABLE `ossn_points_log` (
  `id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `delta` int NOT NULL,
  `reason` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `ref_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_points_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_user_guid` (`user_guid`),
  ADD KEY `index_reason` (`reason`);

ALTER TABLE `ossn_points_log`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql2);
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.1',
));
$factory->connect();
