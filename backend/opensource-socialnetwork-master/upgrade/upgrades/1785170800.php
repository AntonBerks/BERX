<?php
/**
 * BERX WORLD MAX BUILD — real message editing. Closes a real, honestly
 * disclosed gap: ConversationScreen.tsx's own header said "Message
 * editing still does not exist in the OSSN core" -- confirmed true
 * before building this (grepped every class for an edit/update-message
 * method first, found none). `edited`/`time_edited` are real
 * disclosure fields, never silently overwriting a message's history --
 * the recipient can always see it was changed, same honesty standard
 * as every other real feature this session.
 *
 * Idempotent -- same ADD-COLUMN-if-missing guard pattern as
 * 1785168700.php.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.18');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_messages' AND COLUMN_NAME = 'edited'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "ALTER TABLE `ossn_messages`
		ADD `edited` tinyint NOT NULL DEFAULT 0,
		ADD `time_edited` int DEFAULT NULL;";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
		'callback' => 'installation',
		'website'  => ossn_site_url(),
		'email'    => ossn_site_settings('owner_email'),
		'version'  => '10.18',
));
$factory->connect();
