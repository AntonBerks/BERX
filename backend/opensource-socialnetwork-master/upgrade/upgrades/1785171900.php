<?php
/**
 * BERX WORLD — Comment Threading. Another genuinely missing core
 * social-network primitive, confirmed by grep before writing a line
 * of code that no reply/parent concept existed anywhere for comments
 * (flat only). Comments themselves are stock OSSN (OssnComments,
 * OssnAnnotation-backed — see docs/BERX_MIGRATION_REGISTRY.md's own
 * LEGACY classification), so this is deliberately a real BERX-native
 * companion table layered ON TOP of the existing flat comment rows,
 * never a schema change to OssnAnnotation's own storage — same
 * "extend through the existing contract, don't reach into OSSN
 * internals" rule this registry already states.
 *
 * ossn_comment_replies: one real row per reply — comment_id is the
 *   real new comment's own real annotation id (OssnComments::
 *   PostComment()'s real return value), parent_comment_id is a real,
 *   independently re-verified (same post, real existing comment)
 *   target, never trusted from the client alone. post_guid is
 *   duplicated on here so the whole thread map for one post is one
 *   real query, not an N+1 per comment.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_comment_replies'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_comment_replies` (
  `id` bigint NOT NULL,
  `comment_id` bigint NOT NULL,
  `parent_comment_id` bigint NOT NULL,
  `post_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_comment_replies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_comment` (`comment_id`),
  ADD KEY `index_post` (`post_guid`),
  ADD KEY `index_parent` (`parent_comment_id`);

ALTER TABLE `ossn_comment_replies`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
