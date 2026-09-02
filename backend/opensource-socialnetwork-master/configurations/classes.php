<?php
/**
 * Open Source Social Network
 *
 * @package   Open Source Social Network (OSSN)
 * @author    OSSN Core Team <info@openteknik.com>
 * @copyright (C) OpenTeknik LLC
 * @license   Open Source Social Network License (OSSN LICENSE)  http://www.opensource-socialnetwork.org/licence
 * @link      https://www.opensource-socialnetwork.org/
 */
$OssnClasses = array(
		'DynamicCacheKeyNotExists',
		'DynamicCaching',
		'Memcached',
		'Redis',
		'Session',
		'Factory',
		'SiteException',
		'DatabaseException',
		'Base',
		'Translit',
		'Mail',
		'Pagination',
		'Database',
		'Site',
		'Entities',
		'User',
		'Object',
		'Annotation',
		'Themes',
		'File',
		'Components',
		'Menu',
		'Image',
		'JWT',
		// BERX: coordinate index behind Places/Events map + nearby.
		// Core classes are registered by explicit list, not autoloaded
		// from the directory — a file dropped into classes/ without
		// this entry simply never loads.
		'Geo',
		// BERX Collections — named user-owned lists of saved items.
		'Collections',
		// BERX Circles — user-owned privacy groups built from real friends.
		'Circles',
		// BERX Trips — real itineraries built from Places/Events.
		'Trips',
		// BERX Experiences — a real Place/Event + schedule + invited friends.
		'Experiences',
		// BERX Creator — real profile extension + content aggregation + view log.
		'Creator',
		// BERX Media Assets — generic metadata/attach layer on real OssnFile storage.
		'MediaAssets',
		// BERX Business — real place claims + owner review replies.
		'Business',
		// BERX Business Moments — real time-bound business announcements.
		'BusinessMoments',
		// BERX WORLD MAX BUILD — Business Offers: real loyalty/promotion
		// claim+fulfill primitive, no payment infrastructure.
		'BusinessOffers',
		// BERX Nearby Impressions — real 'shown/opened/saved/route' event log.
		'NearbyImpressions',
		// BERX Future Core — Event Layer (append-only domain signal log).
		'Signals',
		// BERX Place Hours — real structured opening intervals.
		'PlaceHours',
		// BERX API Token — bearer-token auth for the stateless /api/v1
		// layer (never touches $_SESSION). Restored 2026-08-26 after
		// the .gitignore bug fixed in commit f915ff4 — see
		// docs/BERX_SOURCE_INVENTORY_2026-08-26.md.
		'ApiToken',
		// BERX Points — server-authoritative balance/level/history +
		// real daily streak (ossn_points_balance/ossn_points_log,
		// streak columns added in upgrade/upgrades/1785170300.php).
		'Points',
		// BERX Report — moderation queue (ossn_reports, already
		// migrated in upgrade/upgrades/1785168200.php).
		'Report',
		// BERX Dating / Match — schema already existed in the base
		// install SQL (ossn_dating_profiles/interests/passes/photos/
		// photo_access); this class was the missing logic layer.
		'Dating',
		// BERX Stories — schema already existed (ossn_stories/
		// ossn_stories_views, event_guid extension in
		// upgrade/upgrades/1785170000.php).
		'Stories',
		// BERX Places — the real-world entity foundation for BERX
		// World/NOW/Business/Trips/Experiences/Search. Same real
		// OssnObject/ossn_object pattern OssnGroup already uses in
		// production; the only genuinely new table is
		// ossn_place_reviews (upgrade/upgrades/1785170400.php).
		'Places',
		// BERX Events — same OssnObject pattern as Places. "Going"
		// attendance reuses the existing ossn_relationships table
		// (type 'event:going') — no new table at all.
		'Events',
		// BERX User Interests — the real store behind onboarding's
		// interest step (ossn_user_interests,
		// upgrade/upgrades/1785172200.php). Vocabulary is the shared
		// place-category whitelist, not a second taxonomy.
		'UserInterests',
		// BERX Group Chat — real multi-participant conversations, NOT
		// built on OssnMessages (OSSN core's from/to-pair primitive — see
		// classes/OssnGroupChat.php's own header for why). Own tables,
		// upgrade/upgrades/1785172300.php.
		'GroupChat',
);
foreach ($OssnClasses as $class) {
		$loadClass['Ossn' . $class] = ossn_route()->classes . "Ossn{$class}.php";
}
$loadClass['MemoryCaching'] = ossn_route()->classes . 'interfaces/MemoryCaching.php';
ossn_register_class($loadClass);