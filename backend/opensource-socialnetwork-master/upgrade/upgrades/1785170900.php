<?php
/**
 * BERX WORLD MAX BUILD — Notification Preferences.
 *
 * Real, enforced opt-out per notification category — not a UI toggle
 * that does nothing server-side. `ossn_notification_prefs` stores only
 * the rows a user has explicitly turned OFF (absence of a row = ON,
 * the honest default); `OssnNotifications::add()` itself now consults
 * this table before inserting a real notification row (see the same-
 * batch edit to components/OssnNotifications/classes/OssnNotifications.php),
 * so muting a category actually stops the notification from being
 * created, not just from being displayed.
 *
 * `pref_type` matches the real notification type strings already in
 * use across the codebase (berx:place:review, berx:event:rsvp,
 * dating:match, ossnpoke:poke, ...) — no separate taxonomy invented.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.19');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_notification_prefs'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_notification_prefs` (
  `id` bigint NOT NULL,
  `guid` bigint NOT NULL,
  `pref_type` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_notification_prefs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_guid_type` (`guid`, `pref_type`);

ALTER TABLE `ossn_notification_prefs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.19',
));
$factory->connect();
