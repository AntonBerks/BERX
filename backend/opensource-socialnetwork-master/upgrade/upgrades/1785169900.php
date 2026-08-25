<?php
/**
 * BERX — Nearby impressions. One real row per real "this place was
 * shown to this viewer in Nearby Now" event. No aggregate/derived
 * numbers stored — every count anywhere is a live COUNT() against
 * these real rows, same principle as OssnCreator's profile-view log.
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.10');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_nearby_impressions'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_nearby_impressions` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `viewer_guid` bigint DEFAULT NULL,
  `action` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'shown',
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_nearby_impressions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_place_action` (`place_guid`, `action`);

ALTER TABLE `ossn_nearby_impressions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.10',
));
$factory->connect();
