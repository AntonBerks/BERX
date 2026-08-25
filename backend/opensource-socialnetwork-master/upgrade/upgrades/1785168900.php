<?php
/**
 * BERX — Collections.
 *
 * A user-owned, named container for saved things (places, events,
 * posts). NOT a duplicate of the existing per-type save mechanisms:
 * Places already has its own real save/unsave via the
 * 'berx:place:saved' relation, and that stays as the fast "bookmark
 * this one thing" path. Collections is the organizing layer on top —
 * many named lists, each holding mixed item types.
 *
 * WHY TWO TABLES. A collection's identity (name, owner, visibility)
 * changes independently of its contents, and contents are a
 * many-to-many-ish set with per-item timestamps. Cramming items into
 * a serialized column on the collection row would make "which
 * collections contain place X" unanswerable by a query.
 *
 * WHY NOT ossn_entities. Collections need a real composite uniqueness
 * guarantee (one item appears at most once per collection) and an
 * indexed lookup by (item_type, item_guid). The entity/metadata
 * pattern gives neither without a full scan.
 *
 * visibility: 1 = private (owner only), 2 = public. Matches OSSN's own
 * OSSN_PRIVATE/OSSN_PUBLIC constant values deliberately, so the two
 * concepts don't drift apart numerically.
 *
 * item_type is a server-validated whitelist ('place','event','post')
 * enforced in OssnCollections, never a free-form client string.
 *
 * Idempotent — same guard pattern as every prior BERX migration.
 */

set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.1');

$db = new OssnDatabase();

$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_collections'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
CREATE TABLE `ossn_collections` (
  `id` bigint NOT NULL,
  `owner_guid` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `visibility` int NOT NULL DEFAULT 1,
  `time_created` int NOT NULL,
  `time_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_collections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_owner` (`owner_guid`),
  ADD KEY `index_visibility` (`visibility`);

ALTER TABLE `ossn_collections`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

CREATE TABLE `ossn_collection_items` (
  `id` bigint NOT NULL,
  `collection_id` bigint NOT NULL,
  `item_type` varchar(24) COLLATE utf8mb4_general_ci NOT NULL,
  `item_guid` bigint NOT NULL,
  `time_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ossn_collection_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_item_per_collection` (`collection_id`, `item_type`, `item_guid`),
  ADD KEY `index_collection` (`collection_id`),
  ADD KEY `index_item` (`item_type`, `item_guid`);

ALTER TABLE `ossn_collection_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
";
	ossn_run_sql_script($sql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation',
	'website'  => ossn_site_url(),
	'email'    => ossn_site_settings('owner_email'),
	'version'  => '10.1',
));
$factory->connect();
