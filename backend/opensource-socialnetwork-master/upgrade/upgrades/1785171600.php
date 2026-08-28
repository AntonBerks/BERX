<?php
/**
 * BERX WORLD — Life Moments. See classes/OssnLifeMoments.php's own
 * header for the full rationale and — importantly — why this is
 * named OssnLifeMoments/ossn_moments rather than reusing "Moment":
 * OssnBusinessMoments/ossn_business_moments already exists and is a
 * completely different concept (a business's real time-bound flash
 * announcement, max 24h). This is deliberately a distinct table and
 * a distinct class, not a rename or an extension of that one.
 *
 * ossn_moments: a real, lightweight, timestamped capture tied to a
 *   real live/recent BERX context (an event check-in, an experience,
 *   a place check-in) — the raw material a later Memory can surface,
 *   never a duplicate of a Post (no likes/comments/reshare — it's
 *   scoped to its source context, not the main feed).
 * ossn_moment_people: real "with whom" tags — only ever people who
 *   were verifiably ALSO connected to the same source (own table,
 *   not a denormalized blob — same discipline as every other real
 *   participant table this build added).
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_moments'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_moments` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `text` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `source_type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `source_id` bigint NOT NULL,
  `place_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_moments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_source` (`source_type`, `source_id`);

ALTER TABLE `ossn_moments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_moment_people` (
  `id` bigint NOT NULL,
  `moment_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_moment_people`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_moment_user` (`moment_id`, `user_guid`),
  ADD KEY `index_moment` (`moment_id`);

ALTER TABLE `ossn_moment_people`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
