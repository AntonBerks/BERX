<?php
/**
 * BERX WORLD MAX BUILD — real user ban/suspend, closing the one
 * report.php target_type that returned a real, honest 501 ('user' had
 * no removal/action mechanism anywhere in this codebase — confirmed
 * by grepping for any enabled/banned/suspended column or method
 * before writing this, not assumed missing). ossn_users had no
 * status column at all beyond `activation` (email-validation only,
 * a distinct concept — repurposing it would conflate "never verified
 * their email" with "an admin suspended this account").
 *
 * `banned` is enforced at the single real request choke point
 * (ossn_com.php's bearer-token resolution, right after
 * OssnApiToken::validateToken() — see that file's own comment) so
 * banning takes effect immediately on every existing session's very
 * next request, not just new logins. `ban_reason`/`banned_at` are
 * real accountability fields, populated by OssnUser::ban(), never
 * left blank.
 *
 * Idempotent — same ADD-COLUMN-if-missing guard pattern as
 * 1785168700.php (boosted_until on ossn_dating_profiles).
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.16');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_users' AND COLUMN_NAME = 'banned'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "ALTER TABLE `ossn_users`
		ADD `banned` tinyint NOT NULL DEFAULT 0,
		ADD `ban_reason` text COLLATE utf8mb4_general_ci DEFAULT NULL,
		ADD `banned_at` int DEFAULT NULL,
		ADD `banned_by` bigint DEFAULT NULL;";
	ossn_run_sql_script($sql);
	ossn_run_sql_script("ALTER TABLE `ossn_users` ADD KEY `index_banned` (`banned`);");
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.16',
));
$factory->connect();
