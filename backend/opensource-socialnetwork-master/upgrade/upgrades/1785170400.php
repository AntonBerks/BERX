<?php
/**
 * BERX — Place reviews.
 *
 * The one genuinely new table Places needed (see
 * docs/BERX_API_V1_IMPLEMENTATION_PLAN.md §6, point 1) — the Place
 * entity itself reuses the existing OssnObject/ossn_object pattern,
 * same as OssnGroup, and needs no table of its own.
 *
 * One review per user per place (real unique index, not just an
 * application-level check) — matches client.ts's own documented
 * "one review per user per place" comment on createPlaceReview().
 * Owner replies already have a home: the pre-existing
 * `ossn_place_review_replies` table (OssnBusiness::upsertReply()),
 * keyed on this table's `id` as its `review_guid`.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.14');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_place_reviews'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_place_reviews` (
  `id` bigint NOT NULL,
  `place_guid` bigint NOT NULL,
  `author_guid` bigint NOT NULL,
  `rating` tinyint NOT NULL,
  `text` text COLLATE utf8mb4_general_ci,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_place_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_place_author` (`place_guid`, `author_guid`),
  ADD KEY `index_place` (`place_guid`);

ALTER TABLE `ossn_place_reviews`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.14',
));
$factory->connect();
