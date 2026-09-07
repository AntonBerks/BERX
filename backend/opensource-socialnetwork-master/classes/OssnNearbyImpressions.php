<?php
/**
 * BERX Nearby Impressions — real event log. Real 'shown'/'opened'/
 * 'saved'/'route' actions only, recorded when they actually happen
 * client-side (see nearby.php's real record branch and each real
 * client call site). Every count exposed anywhere is a live COUNT()
 * against these rows — no derived/cached/estimated number, same
 * principle as OssnCreator's profile-view log this session.
 */
class OssnNearbyImpressions extends OssnDatabase {

	const TABLE = 'ossn_nearby_impressions';
	const VALID_ACTIONS = array('shown', 'opened', 'saved', 'route');

	public function record($placeGuid, $viewerGuid, $action) {
		$placeGuid = intval($placeGuid);
		if (!$placeGuid || !in_array($action, self::VALID_ACTIONS, true)) {
			return false;
		}
		return $this->insert(array(
			'into'   => self::TABLE,
			'names'  => array('place_guid', 'viewer_guid', 'action', 'time_created'),
			'values' => array($placeGuid, $viewerGuid ? intval($viewerGuid) : null, (string) $action, time()),
		));
	}

	/** Real count for one place + one action — the only source of any number the owner ever sees. */
	public function countFor($placeGuid, $action) {
		$rows = $this->select(array(
			'from'   => self::TABLE,
			'wheres' => array(
				self::wheres('place_guid', '=', intval($placeGuid)),
				self::wheres('action', '=', (string) $action),
			),
		), true);
		// select(..., true) wraps a non-empty result in a stdClass (see
		// OssnDatabase::fetch()/arrayObject()), not a real indexed array —
		// count() on that throws TypeError on PHP 8+. Same bug class
		// already found and fixed this session in OssnCollections::
		// itemCount()/OssnCircles::memberCount()/OssnCreator::
		// recentExperiences(); (array)-cast is the established fix.
		return $rows ? count((array) $rows) : 0;
	}

	/** Real counts for every real action, in one call — avoids 4 separate round-trips from the dashboard. */
	public function summaryFor($placeGuid) {
		$out = array();
		foreach (self::VALID_ACTIONS as $action) {
			$out[$action] = $this->countFor($placeGuid, $action);
		}
		return $out;
	}
}
