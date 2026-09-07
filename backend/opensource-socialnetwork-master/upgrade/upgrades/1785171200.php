<?php
/**
 * BERX WORLD MAX BUILD — Referrals.
 *
 * Real invite tracking, not a vanity share link: `ossn_referrals`
 * records exactly one real referrer per new user, set once at
 * registration time (auth.php's /register branch) and never
 * overwritten. The actual points reward only fires on that referred
 * user's first successful, ACTIVATED login (auth.php's /login branch
 * already gates on real email activation before issuing a token) —
 * a registration alone proves nothing, a real login through this API
 * does. `OssnPoints::award(..., oneTime=true)` (already real, already
 * shipped) is the reward dedup, keyed per referred user — no separate
 * "rewarded" flag needed here.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.22');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_referrals'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_referrals` (
  `id` bigint NOT NULL,
  `referred_guid` bigint NOT NULL,
  `referrer_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_referrals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_referred` (`referred_guid`),
  ADD KEY `index_referrer` (`referrer_guid`);

ALTER TABLE `ossn_referrals`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.22',
));
$factory->connect();
