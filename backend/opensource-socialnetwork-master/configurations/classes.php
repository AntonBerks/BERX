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
		// BERX Nearby Impressions — real 'shown/opened/saved/route' event log.
		'NearbyImpressions',
		// BERX Future Core — Event Layer (append-only domain signal log).
		'Signals',
		// BERX Place Hours — real structured opening intervals.
		'PlaceHours',
);
foreach ($OssnClasses as $class) {
		$loadClass['Ossn' . $class] = ossn_route()->classes . "Ossn{$class}.php";
}
$loadClass['MemoryCaching'] = ossn_route()->classes . 'interfaces/MemoryCaching.php';
ossn_register_class($loadClass);