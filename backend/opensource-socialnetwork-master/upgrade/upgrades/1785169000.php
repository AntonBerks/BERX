<?php
/**
 * BERX — Circles.
 *
 * User-controlled privacy groups (Friends/Family/Work/Travel/Close
 * Friends/Custom) a person builds from their OWN real friends, for
 * later use scoping who can see what. This migration and class build
 * the real management layer (create/edit/delete a circle, add/remove
 * members) — NOT a new identity or social-graph system: circle
 * membership is validated against OssnUser::isFriend() at insert
 * time, so a circle can only ever contain people who are already a
 * confirmed real friend. Wiring circles into post/story visibility
 * scoping is a separate, larger change (touches OssnWall's real
 * privacy logic) and is not done in this pass — recorded honestly in
 * BERX_PROGRESS.md rather than silently implied by this table
 * existing.
 *
 * ossn_circles.kind: NULL for user-named custom circles, or one of a
 * small server-recognized set ('family','work','travel') for the
 * common presets — still just a label, not special access logic.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.2');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_circles'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_circles` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_general_ci NOT NULL,
  `kind` varchar(24) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_circles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`);

ALTER TABLE `ossn_circles`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_circle_members` (
  `id` bigint NOT NULL,
  `circle_id` bigint NOT NULL,
  `member_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_circle_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_member_per_circle` (`circle_id`, `member_guid`),
  ADD KEY `index_circle` (`circle_id`);

ALTER TABLE `ossn_circle_members`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.2',
));
$factory->connect();
