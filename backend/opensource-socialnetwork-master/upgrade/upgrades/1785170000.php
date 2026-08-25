<?php
/**
 * BERX — Event Story Wall. Extends the existing ossn_stories table
 * with a nullable event_guid — no second Stories storage system, no
 * new table. NULL = a normal, non-event story (every existing story
 * stays exactly as it was). Only a real RSVP'd attendee may create
 * an event story — checked server-side at every publish, in
 * OssnStories::addEventStory(), not just at screen-open time.
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.11');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_stories' AND COLUMN_NAME = 'event_guid'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
ALTER TABLE `ossn_stories`
  ADD COLUMN `event_guid` bigint DEFAULT NULL,
  ADD KEY `index_event_guid` (`event_guid`);
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.11',
));
$factory->connect();
