<?php
/**
 * BERX WORLD MAX BUILD — Event Waitlist.
 *
 * Real closes-a-real-gap feature: `OssnEvents::rsvp()` already
 * returned a real 'full' status once capacity was hit (see
 * classes/OssnEvents.php's own doc comment), but a full event was
 * simply a dead end — no way to queue for a freed seat. This table
 * plus the same-batch edits to OssnEvents.php (joinWaitlist()/
 * leaveWaitlist()/promoteNextWaitlisted(), the latter called for real
 * from cancelRsvp() itself) make "full" the start of a real queue, not
 * a wall.
 *
 * `position` is NOT stored — it's always derived at read time from
 * `time_created ASC` order (a real COUNT() of earlier rows), so it can
 * never drift out of sync with actual join order.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.20');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_event_waitlist'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_event_waitlist` (
  `id` bigint NOT NULL,
  `event_guid` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_event_waitlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event_user` (`event_guid`, `user_guid`),
  ADD KEY `index_event_order` (`event_guid`, `time_created`);

ALTER TABLE `ossn_event_waitlist`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.20',
));
$factory->connect();
