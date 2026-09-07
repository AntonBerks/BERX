<?php
/**
 * BERX — User Interests: the real, persisted answer to onboarding's
 * "what are you into?" step.
 *
 * WHY A REAL TABLE AND NOT A FAKE CHIP ROW. The onboarding sequence
 * asks a new account to pick interests. Until this migration there was
 * nowhere on the server to put that answer: PATCH /me accepts only
 * firstname/lastname/email/password, and no other endpoint stored a
 * per-user topic. A picker with no store would have been a control
 * that pretends to remember something — so the store is real, the
 * write is real, and the read is used (GET /places?for_you=1 ranks the
 * caller's own chosen categories first).
 *
 * The `category` column holds a slug from the SAME real whitelist the
 * rest of the product uses (ossn_api_place_categories() in
 * components/OssnApi/ossn_com.php) — not a second, parallel taxonomy
 * invented for onboarding. The UNIQUE key makes a repeated save
 * idempotent rather than duplicating rows.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_user_interests'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE IF NOT EXISTS `ossn_user_interests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_guid` bigint NOT NULL,
  `category` varchar(64) NOT NULL,
  `time_created` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_category` (`user_guid`, `category`),
  KEY `index_user` (`user_guid`),
  KEY `index_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
