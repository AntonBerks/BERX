<?php
/**
 * BERX — generic Media Assets (Media Foundation).
 *
 * NOT a duplicate storage system. `ossn_media_assets.id` IS the real
 * OssnFile guid — this table adds metadata OssnFile has no columns
 * for (media_type, dimensions, duration, processing status, and a
 * real attach/detach relationship to whatever content references it)
 * on top of a file that already really exists in ossn_entities via
 * OssnFile::addFile(). One row per real uploaded file, never
 * fabricated.
 *
 * HONEST SCOPE ON PROCESSING: status starts and stays 'stored' for
 * every asset — this environment has no real transcoding/thumbnail
 * pipeline (no confirmed ffmpeg/ffprobe on the server), so nothing
 * is ever marked 'processed' or given a fabricated duration. width/
 * height ARE populated for images (real getimagesize(), a PHP core
 * function, no external dependency) — that's the one piece of real
 * metadata extractable without external tooling. duration_seconds
 * stays NULL for every video/audio asset until a real transcoding
 * pipeline exists to measure it honestly.
 *
 * context_type/context_guid: NULL until the asset is explicitly
 * attached to something (a post, a creator profile, etc.) via the
 * real attach endpoint — an uploaded-but-unattached asset is a real,
 * valid, honest state (e.g. mid-composition), not an error.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.6');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_media_assets'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_media_assets` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `media_type` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `mime` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'stored',
  `context_type` varchar(24) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `context_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_media_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_context` (`context_type`, `context_guid`);
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.6',
));
$factory->connect();
