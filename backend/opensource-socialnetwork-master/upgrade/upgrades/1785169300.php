<?php
/**
 * BERX — Creator.
 *
 * NOT a duplicate identity or content system. Creator Mode is a real
 * flag + a small profile extension (category, bio) on an EXISTING
 * OssnUser — content itself is never duplicated: Creator Posts/Albums/
 * Events/Experiences are the same real rows already owned by that
 * user in OssnWall/OssnAlbums/OssnEvents/OssnExperiences, only
 * queried with an owner_guid filter (the same established pattern
 * already used by every one of those classes elsewhere in BERX).
 *
 * ossn_creator_profile_views: REAL event log, one row per profile
 * view. This is the honest foundation for future analytics — no
 * aggregate/derived numbers are stored or faked; every count shown
 * anywhere is a live COUNT() against these real rows, never a
 * fabricated or estimated figure.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.5');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_creator_profiles'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_creator_profiles` (
  `user_guid` bigint NOT NULL,
  `category` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bio` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_enabled` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_creator_profiles`
  ADD PRIMARY KEY (`user_guid`);

CREATE TABLE `ossn_creator_profile_views` (
  `id` bigint NOT NULL,
  `creator_guid` bigint NOT NULL,
  `viewer_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_creator_profile_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_creator` (`creator_guid`),
  ADD KEY `index_creator_time` (`creator_guid`, `time_created`);

ALTER TABLE `ossn_creator_profile_views`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.5',
));
$factory->connect();
