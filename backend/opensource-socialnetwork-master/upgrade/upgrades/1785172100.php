<?php
/**
 * BERX — Post Polls: adds a denormalized owner_guid to ossn_post_polls.
 * The real poll creator is already knowable by joining through the
 * post's own entity metadata, but every other "*_created" reputation
 * count in this codebase (Trips, Experiences, Moments, Memories,
 * Plans, Worlds — see me.php/profiles.php/identity.php's own
 * reputation blocks) is a single real COUNT(*) WHERE owner_guid = ...
 * against its own domain table, not a join through OssnWall/
 * OssnObject. Adding the same column here keeps polls_created on that
 * same simple, fast, established shape instead of being the one
 * exception that needs a heavier query. Nullable + backfilled to 0 is
 * impossible to get right for rows that already exist without a real
 * join anyway, so existing rows (if any) are backfilled via the exact
 * join this migration exists to avoid needing at read time from then
 * on.
 * Idempotent — same guard pattern as every prior BERX migration.
 */
set_time_limit(0);
ossn_generate_server_config('apache');
ossn_version_upgrade('10.26');

$db = new OssnDatabase();
$db->statement("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ossn_post_polls' AND COLUMN_NAME = 'owner_guid'");
$db->execute();
$exists = $db->fetch();

if (!$exists || intval($exists->c) === 0) {
	$sql = "
ALTER TABLE `ossn_post_polls`
  ADD COLUMN `owner_guid` bigint DEFAULT NULL,
  ADD KEY `index_owner` (`owner_guid`);
";
	ossn_run_sql_script($sql);

	// Real one-time backfill for any poll created before this column
	// existed. poster_guid is not a native ossn_object column — it's
	// real arbitrary object metadata (OssnObject::addObject() walks
	// $this->data and writes each property as its own real
	// ossn_entities row — owner_guid=the post's own guid, type=
	// 'object', subtype=the property name — with the actual value in
	// a second ossn_entities_metadata row keyed to THAT metadata
	// entity's own guid, confirmed by reading addObject()/
	// OssnEntities::add() directly before writing this, not guessed).
	// Joined once here so no future read ever needs this two-table
	// join again.
	$backfillSql = "
UPDATE `ossn_post_polls` p
JOIN `ossn_entities` e ON e.owner_guid = p.post_guid AND e.type = 'object' AND e.subtype = 'poster_guid'
JOIN `ossn_entities_metadata` em ON em.guid = e.guid
SET p.owner_guid = CAST(em.value AS UNSIGNED)
WHERE p.owner_guid IS NULL;
";
	ossn_run_sql_script($backfillSql);
}

$factory = new OssnFactory(array(
	'callback' => 'installation', 'website' => ossn_site_url(),
	'email' => ossn_site_settings('owner_email'), 'version' => '10.26',
));
$factory->connect();
