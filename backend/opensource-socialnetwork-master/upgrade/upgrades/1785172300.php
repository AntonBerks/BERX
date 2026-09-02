<?php
/**
 * BERX — Group Conversations.
 *
 * A real multi-participant messaging entity — NOT built on top of
 * OssnMessages (components/OssnMessages/classes/OssnMessages.php),
 * which is OSSN core's private-message primitive and is strictly a
 * from/to PAIR at every layer (send($from,$to,...), get($from,$to),
 * countUNREAD($to)...) — confirmed by reading its real body before
 * writing this, not assumed. There is no group concept anywhere in
 * that class to extend; a group needs its own participant set, its
 * own roles, and messages that belong to a CONVERSATION rather than
 * to a sender/recipient pair. Same real-table pattern this session's
 * other BERX-native entities already use (see ossn_circles/
 * ossn_circle_members, upgrade/upgrades/1785169000.php).
 *
 * `context_type`/`context_guid` are what let a group be created FROM
 * a real BERX entity — Community → Group Chat, Event → Group Chat,
 * Experience/Circle/Trip → Group Chat — and later be found again from
 * that entity (GET /groups/context/{type}/{guid}). Both nullable: a
 * group created directly from a Direct Message ("start a group with
 * these people") has no such context and that is a real, valid state,
 * not a missing field.
 *
 * ossn_group_message_reads stores one row per (conversation, user)
 * holding the last message id that user has read — not one row per
 * message per user, which would explode with participant count the
 * same way ossn_stories_views was deliberately NOT modeled that way
 * for a wide broadcast. Unread count is COUNT(*) of messages newer
 * than that pointer, computed at read time.
 *
 * Reactions are a single real toggle (liked / not liked) per
 * (message, user) — the same binary convention every other BERX
 * reaction already uses (posts, comments — see posts.php's own
 * /like route). A second, richer emoji-reaction taxonomy invented
 * only for group messages would be an inconsistent, one-off pattern
 * rather than a real product decision.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.27');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_group_conversations'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_group_conversations` (
  `id` bigint NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `cover_guid` bigint DEFAULT NULL,
  `creator_guid` bigint NOT NULL,
  `context_type` varchar(24) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `context_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL,
  `time_updated` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_group_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_creator` (`creator_guid`),
  ADD KEY `index_context` (`context_type`, `context_guid`);

ALTER TABLE `ossn_group_conversations`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_group_participants` (
  `id` bigint NOT NULL,
  `conversation_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `role` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'member',
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `muted_until` int DEFAULT NULL,
  `time_joined` int NOT NULL,
  `time_left` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_group_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`conversation_id`, `user_guid`),
  ADD KEY `index_conversation` (`conversation_id`),
  ADD KEY `index_user` (`user_guid`);

ALTER TABLE `ossn_group_participants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_group_messages` (
  `id` bigint NOT NULL,
  `conversation_id` bigint NOT NULL,
  `sender_guid` bigint NOT NULL,
  `text` text COLLATE utf8mb4_general_ci,
  `reply_to_id` bigint DEFAULT NULL,
  `time_created` int NOT NULL,
  `time_edited` int DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_group_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_conversation_time` (`conversation_id`, `time_created`),
  ADD KEY `index_sender` (`sender_guid`);

ALTER TABLE `ossn_group_messages`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_group_message_reads` (
  `conversation_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `last_read_message_id` bigint NOT NULL DEFAULT 0,
  `time_updated` int NOT NULL,
  PRIMARY KEY (`conversation_id`, `user_guid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ossn_group_message_reactions` (
  `message_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `time_created` int NOT NULL,
  PRIMARY KEY (`message_id`, `user_guid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ossn_group_pinned_messages` (
  `conversation_id` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `pinned_by` bigint NOT NULL,
  `time_created` int NOT NULL,
  PRIMARY KEY (`conversation_id`, `message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ossn_group_typing` (
  `conversation_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `time_updated` int NOT NULL,
  PRIMARY KEY (`conversation_id`, `user_guid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.27',
));
$factory->connect();
