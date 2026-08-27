<?php
/**
 * BERX WORLD — Business Offers.
 *
 * Real loyalty/promotion primitive for the Business ecosystem
 * (directive: "Businesses should connect to... Offers... Loyalty...
 * Rewards"). Deliberately NOT a payment/coupon-code-redemption-for-
 * money system — no real payment infrastructure exists in this
 * environment, and inventing one would mean fake transactions,
 * explicitly forbidden. An Offer here is a real, server-tracked
 * promise a business makes ("first 20 people today get X"), redeemed
 * in person by the business staff tapping "Отметить как использовано"
 * in the app when the customer shows up — same honest, no-payment-
 * needed shape as a punch card, not a fake purchase flow.
 *
 * ossn_business_offers: place-scoped offer (title/description,
 *   optional max_redemptions, optional expiry, active flag).
 * ossn_business_offer_redemptions: one real row per real claim — a
 *   real unique index on (offer_id, user_guid) makes "one claim per
 *   user per offer" a database guarantee, not just an application
 *   check (same discipline as ossn_place_reviews' own uniq_place_author).
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.15');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_business_offers'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_business_offers` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `max_redemptions` int DEFAULT NULL,
  `redemptions_count` int NOT NULL DEFAULT 0,
  `ends_at` int DEFAULT NULL,
  `active` tinyint NOT NULL DEFAULT 1,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_business_offers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_place` (`place_guid`),
  ADD KEY `index_active` (`active`);

ALTER TABLE `ossn_business_offers`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_business_offer_redemptions` (
  `id` bigint NOT NULL,
  `offer_id` bigint NOT NULL,
  `user_guid` bigint NOT NULL,
  `fulfilled` tinyint NOT NULL DEFAULT 0,
  `time_created` int NOT NULL,
  `time_fulfilled` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_business_offer_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_offer_user` (`offer_id`, `user_guid`),
  ADD KEY `index_offer` (`offer_id`);

ALTER TABLE `ossn_business_offer_redemptions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.15',
));
$factory->connect();
