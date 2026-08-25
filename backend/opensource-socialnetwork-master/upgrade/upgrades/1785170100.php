<?php
/**
 * BERX — Structured opening hours.
 *
 * The existing `hours` field on a Place is free text ("Пн-Пт 10-22"),
 * which is why Nearby Now's "open now" filter was honestly marked
 * BLOCKED — free text can't be reliably parsed server-side. This adds
 * real structured hours so that filter can become genuinely correct.
 *
 * One row per real open interval. A place open 10:00-22:00 Mon-Fri is
 * 5 rows; a place with a lunch break is 2 rows for that day; a place
 * closed on Sunday simply has no Sunday row. Times are stored as
 * minutes-from-midnight (0-1440) in the PLACE'S OWN local time —
 * timezone handling is deliberately NOT faked here (no real per-place
 * timezone data exists yet), so "open now" compares against server
 * local time and that limitation is disclosed, not hidden.
 *
 * The free-text `hours` field is left untouched and still displayed —
 * this is additive, nothing existing breaks.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.12');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_place_hours'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_place_hours` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `weekday` tinyint NOT NULL,
  `open_minute` smallint NOT NULL,
  `close_minute` smallint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_place_hours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_place_day` (`place_guid`, `weekday`);

ALTER TABLE `ossn_place_hours`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.12',
));
$factory->connect();
