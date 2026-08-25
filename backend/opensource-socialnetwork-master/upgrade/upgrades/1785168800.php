<?php
/**
 * BERX — ossn_geo_index: the coordinate index that makes map and
 * "nearby" queries possible.
 *
 * WHY A SEPARATE TABLE. Places and Events already store lat/lng in
 * ossn_entities as strings, alongside every other entity value in the
 * system. A radius query against that means a full scan plus a CAST on
 * an unindexed, polymorphic column — fine for a demo, and it falls
 * over on the first few thousand records. This table holds one row per
 * geolocated object with real DOUBLE columns and a composite index on
 * (lat, lng), so a bounding-box query is an index range scan.
 *
 * WHY NOT MySQL POINT/SPATIAL. A SPATIAL index requires the column to
 * be NOT NULL and the engine/version to support it on InnoDB (5.7+).
 * Rather than gate BERX on the host's MySQL build, this uses plain
 * indexed DOUBLEs with a bounding-box prefilter and an exact distance
 * check in PHP on the (small) candidate set. Same results, no version
 * dependency. Migrating to SPATIAL later is additive.
 *
 * object_type is stored so one index can serve places, events and
 * anything added later, without a table per feature.
 *
 * Idempotent — same guard pattern as 1785168600.php.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_geo_index'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_geo_index` (
  `id` bigint NOT NULL,
  `object_guid` bigint NOT NULL,
  `object_type` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_geo_index`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_object` (`object_guid`),
  ADD KEY `index_latlng` (`lat`, `lng`),
  ADD KEY `index_type` (`object_type`);

ALTER TABLE `ossn_geo_index`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
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
