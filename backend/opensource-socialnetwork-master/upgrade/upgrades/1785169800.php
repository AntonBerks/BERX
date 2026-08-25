<?php
/**
 * BERX — Business Moments. A real, time-bound announcement a
 * business attaches to their own Place ("Happy hour 15:00-18:00
 * today"). Surfaced honestly in Nearby Now alongside real places —
 * NOT ad inventory, NOT boosted/sponsored (that needs a real payment
 * provider, not built here), just a real message with a real
 * expiry, owner-only to create.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.9');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_business_moments'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_business_moments` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `text` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `starts_at` int NOT NULL,
  `ends_at` int NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_business_moments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_active` (`ends_at`);

ALTER TABLE `ossn_business_moments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.9',
));
$factory->connect();
