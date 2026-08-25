<?php
/**
 * BERX — Business team + subscription/trial.
 *
 * business_type itself needs NO new column: it reuses the exact
 * updateObject()-backed ossn_entities_metadata mechanism already
 * confirmed real for is_business/verified/website/phone/hours (see
 * OssnBusiness.php's header). Only two genuinely new real entities
 * need their own tables here:
 *
 * ossn_business_team: who can manage a business and with what role
 * (owner/manager/staff) — a real access-control list, not place
 * metadata (it's a set of relationships, not a single value).
 *
 * ossn_business_subscriptions: server-authoritative trial/plan state.
 * trial_started_at/trial_ends_at/status/plan are all set and read
 * server-side only — never trusted from the client. NO payment
 * columns (no card token, no invoice id, no charge amount) because
 * no real payment provider is integrated — this table is honestly
 * scoped to what's real: trial timing and an entitlement flag, ready
 * for a real provider to be wired in later without a schema rewrite.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.7');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_business_team'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_business_team` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `member_guid` bigint NOT NULL,
  `role` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'staff',
  `added_by_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_business_team`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_member_per_place` (`place_guid`, `member_guid`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_member` (`member_guid`);

ALTER TABLE `ossn_business_team`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_business_subscriptions` (
  `place_guid` bigint NOT NULL,
  `plan` varchar(24) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'business_monthly',
  `status` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'trial',
  `trial_started_at` int NOT NULL,
  `trial_ends_at` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_business_subscriptions`
  ADD PRIMARY KEY (`place_guid`),
  ADD KEY `index_status` (`status`);
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.7',
));
$factory->connect();
