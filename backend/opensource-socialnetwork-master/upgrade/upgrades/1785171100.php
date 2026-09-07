<?php
/**
 * BERX WORLD MAX BUILD — Story Highlights.
 *
 * `is_highlighted` on `ossn_stories`: a real, owner-only flag that
 * keeps ONE story visible past its 24h `time_expires` on the owner's
 * own profile — same table, no parallel storage, no duplicated media.
 * `OssnStories::checkStoryAccess()`/`listHighlights()` (same-batch
 * edits to classes/OssnStories.php) are the real enforcement: a
 * highlighted story stays readable by anyone who could see it while
 * active (owner always; blocked viewers never), an un-highlighted
 * expired one stays exactly as inaccessible as before this change.
 *
 * Idempotent — same ADD-COLUMN-if-missing guard pattern as
 * 1785168700.php.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.21');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_stories' AND COLUMN_NAME = 'is_highlighted'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "ALTER TABLE `ossn_stories` ADD `is_highlighted` tinyint(1) NOT NULL DEFAULT 0;";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.21',
));
$factory->connect();
