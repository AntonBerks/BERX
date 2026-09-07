<?php
/**
 * BERX — Realtime transport: ossn_realtime_tokens.
 *
 * WHY A SECOND TOKEN TABLE. The bearer token in ossn_api_tokens is a
 * 90-day credential (OssnApiToken::DEFAULT_TTL_SECONDS) that the client
 * stores on the device. A WebSocket cannot carry an Authorization
 * header from a browser — the WebSocket constructor takes no headers —
 * so whatever authenticates a socket ends up in a URL or in the first
 * frame, which is exactly where a 90-day credential must never be. This
 * table holds a SHORT-LIVED, single-purpose credential minted by an
 * already-authenticated API call and good only for opening one socket.
 * Same discipline as the bearer token otherwise: the raw value is
 * handed out exactly once and only its sha256 is stored, so the table
 * is worthless to anyone who reads it.
 *
 * `revoked` exists for the same reason it does on ossn_api_tokens: a
 * logout has to be able to end a live socket, and deleting rows would
 * lose the record that it happened.
 *
 * No channel/subscription table. What a user may subscribe to is
 * derived from the real relationships that already exist (friendship,
 * membership, ownership) at the moment they ask — a stored channel
 * grant would keep answering yes after the friendship it was based on
 * ended. See OssnRealtime::authorizeChannel().
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.28');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_realtime_tokens'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_realtime_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_guid` bigint NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_general_ci NOT NULL,
  `time_created` int NOT NULL,
  `time_expires` int NOT NULL,
  `time_used` int DEFAULT NULL,
  `revoked` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token_hash` (`token_hash`),
  KEY `index_user` (`user_guid`),
  KEY `index_expiry` (`time_expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
";
	ossn_run_sql_script($sql);
}

/**
 * The loopback publish secret.
 *
 * A realtime layer that only carries client-to-client messages is not
 * a realtime product: what has to travel is what the SERVER did — a
 * post written, a message sent. The PHP request that does that work is
 * a different process from the socket server, so it needs a way in.
 * That way is one loopback line protocol guarded by this shared secret
 * (see backend/scripts/berx-realtime-server.php's BERX-PUBLISH branch
 * and ossn_api_realtime_publish() in components/OssnApi/ossn_com.php).
 *
 * Generated per installation with random_bytes — never a constant, and
 * never derived from anything else in the database, because a value
 * that can be recomputed from public facts is not a secret.
 */
$db->statement("SELECT COUNT(*) AS c FROM ossn_site_settings WHERE name = 'berx_realtime_secret'");
$db->execute();
$hasSecret = $db->fetch();
if (!$hasSecret || intval($hasSecret->c) === 0) {
	$db->statement("INSERT INTO `ossn_site_settings` (`name`, `value`) VALUES ('berx_realtime_secret', :secret)");
	$db->execute(array(':secret' => bin2hex(random_bytes(32))));
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.28',
));
$factory->connect();
