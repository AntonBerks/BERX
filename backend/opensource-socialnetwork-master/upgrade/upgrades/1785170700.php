<?php
/**
 * BERX WORLD MAX BUILD — real dating-profile moderation. Closes the
 * last real gap in report.php's action route: target_type=
 * 'dating_profile' was a real, honest 501 (no removal mechanism
 * existed, same as target_type='user' was before OssnUser::ban()).
 *
 * Deliberately NOT a full row delete (unlike post/comment/group,
 * which are genuinely disposable content) — a dating profile carries
 * photos/interests/passes across four other real tables, and a full
 * cascading delete without a real MySQL runtime to verify it against
 * is a real, avoidable risk. `moderation_hidden` mirrors the already-
 * real `invisible_mode`/`hide_profile` filters discover()/search()
 * already apply, except this one is admin-only (the user's own
 * privacy toggles stay theirs to control; this is a separate,
 * reversible moderation action layered on top).
 *
 * Idempotent — same ADD-COLUMN-if-missing guard pattern as
 * 1785168700.php (boosted_until on this exact same table).
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.17');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_dating_profiles' AND COLUMN_NAME = 'moderation_hidden'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "ALTER TABLE `ossn_dating_profiles` ADD `moderation_hidden` tinyint NOT NULL DEFAULT 0;";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.17',
));
$factory->connect();
