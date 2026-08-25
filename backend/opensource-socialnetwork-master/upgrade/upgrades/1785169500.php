<?php
/**
 * BERX — Business.
 *
 * Two real, small tables, no duplication of Places' own storage:
 *
 * ossn_place_claims: a real request-and-admin-approval flow for a
 * user to claim ownership of an EXISTING real place (one created by
 * someone else, or an unclaimed listing). Deliberately NOT an
 * auto-verification system — there is no real business registry or
 * email-domain check available here, and faking one would violate
 * the standing no-fake-verification rule. Approval is a real admin
 * action (ossn_isAdminLoggedin()), the same manual-review pattern
 * already used for Admin Unvalidated Users and Community join
 * requests elsewhere in BERX — not invented for this feature.
 *
 * ossn_place_review_replies: a real, owner-only reply to a review.
 * Kept as its own small table rather than Places' updateObject()-
 * backed metadata store (confirmed real, via ossn_entities_metadata,
 * used for is_business/verified/website/etc.) — a reply is scoped to
 * one REVIEW (needs review_guid/place_guid/author_guid tracked
 * together), which doesn't fit that store's one-value-per-place-key
 * shape. Same reasoning as every other new domain this session using
 * its own table for its own real entity.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.6');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_place_claims'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_place_claims` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `requester_guid` bigint NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_guid` bigint DEFAULT NULL,
  `time_created` int NOT NULL,
  `time_reviewed` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_place_claims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_requester` (`requester_guid`),
  ADD KEY `index_status` (`status`);

ALTER TABLE `ossn_place_claims`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_place_review_replies` (
  `id` bigint NOT NULL,
  `review_guid` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `author_guid` bigint NOT NULL,
  `text` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `time_created` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_place_review_replies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reply_per_review` (`review_guid`),
  ADD KEY `index_place` (`place_guid`);

ALTER TABLE `ossn_place_review_replies`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.6',
));
$factory->connect();
