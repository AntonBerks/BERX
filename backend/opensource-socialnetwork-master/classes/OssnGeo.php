<?php
/**
 * BERX Geo — the coordinate index behind map and "nearby".
 *
 * Backed by the real ossn_geo_index table (migration 1785168800.php),
 * one row per geolocated object, with a composite index on (lat, lng).
 *
 * QUERY STRATEGY: a bounding box on the indexed columns narrows the
 * candidate set (an index range scan, not a table scan), then the
 * exact great-circle distance is computed in PHP and anything outside
 * the true radius is dropped. A bounding box alone would return the
 * corners of a square — visibly wrong near the radius edge — so the
 * second pass is not optional.
 *
 * The box is computed from the radius rather than hardcoded: one
 * degree of latitude is ~111.045 km everywhere, but one degree of
 * LONGITUDE shrinks with cos(latitude). Using a fixed longitude
 * delta would silently under-search near the poles and over-search at
 * the equator.
 */
class OssnGeo extends OssnDatabase {

		const TABLE = 'ossn_geo_index';

		/** Earth mean radius, km. */
		const EARTH_KM = 6371.0088;

		public static function isValidLat($lat) {
				return is_numeric($lat) && $lat >= -90 && $lat <= 90;
		}

		public static function isValidLng($lng) {
				return is_numeric($lng) && $lng >= -180 && $lng <= 180;
		}

		/**
		 * Insert or update the coordinates for one object. Called from
		 * the place/event save actions, so the index can never drift
		 * from the entity it mirrors.
		 *
		 * @param int    $object_guid
		 * @param string $object_type 'place' | 'event'
		 */
		public function setLocation($object_guid, $object_type, $lat, $lng) {
				$object_guid = intval($object_guid);
				if (!$object_guid || !self::isValidLat($lat) || !self::isValidLng($lng)) {
						return false;
				}
				$this->deleteLocation($object_guid);

				$params['into']   = self::TABLE;
				$params['names']  = array('object_guid', 'object_type', 'lat', 'lng', 'time_updated');
				$params['values'] = array(
						$object_guid,
						(string) $object_type,
						(float) $lat,
						(float) $lng,
						time(),
				);
				return $this->insert($params);
		}

		/**
		 * Remove an object from the index — called on delete, and
		 * whenever coordinates are cleared, so the map never shows a
		 * pin for something that no longer exists there.
		 */
		public function deleteLocation($object_guid) {
				$params['from']   = self::TABLE;
				$params['wheres'] = array(
						self::wheres('object_guid', '=', intval($object_guid)),
				);
				return $this->delete($params);
		}

		public function getLocation($object_guid) {
				$params['from']   = self::TABLE;
				$params['wheres'] = array(
						self::wheres('object_guid', '=', intval($object_guid)),
				);
				$row = $this->select($params);
				return $row ? $row : false;
		}

		/**
		 * Objects within $radius_km of a point.
		 *
		 * @param float  $lat
		 * @param float  $lng
		 * @param float  $radius_km
		 * @param string $object_type optional filter ('place'|'event')
		 * @param int    $limit       cap on returned rows
		 *
		 * @return array of rows with an added ->distance (km), nearest first
		 */
		public function near($lat, $lng, $radius_km = 5, $object_type = false, $limit = 60) {
				if (!self::isValidLat($lat) || !self::isValidLng($lng)) {
						return array();
				}
				$lat       = (float) $lat;
				$lng       = (float) $lng;
				$radius_km = (float) $radius_km;
				if ($radius_km <= 0 || $radius_km > 20000) {
						$radius_km = 5;
				}

				// Bounding box. Latitude degrees are constant; longitude
				// degrees shrink by cos(lat), so the box must widen as you
				// approach the poles or it under-searches.
				$lat_delta = $radius_km / 111.045;
				$cos       = cos(deg2rad($lat));
				// Guard against a division by ~0 at the poles, where a
				// radius covers every longitude.
				$lng_delta = (abs($cos) < 0.000001) ? 180.0 : ($radius_km / (111.045 * $cos));
				$lng_delta = abs($lng_delta);

				$wheres = array(
						self::wheres('lat', '>=', $lat - $lat_delta),
						self::wheres('lat', '<=', $lat + $lat_delta),
						self::wheres('lng', '>=', $lng - $lng_delta),
						self::wheres('lng', '<=', $lng + $lng_delta),
				);
				if ($object_type) {
						$wheres[] = self::wheres('object_type', '=', (string) $object_type);
				}

				$params['from']   = self::TABLE;
				$params['wheres'] = $wheres;
				// Pull more than $limit because the box is larger than the
				// circle; the exact pass below trims it back.
				$params['limit']  = intval($limit) * 4;
				$rows = $this->select($params, true);
				if (!$rows) {
						return array();
				}

				$out = array();
				foreach ($rows as $row) {
						$distance = self::distanceKm($lat, $lng, $row->lat, $row->lng);
						if ($distance > $radius_km) {
								continue; // inside the box, outside the circle
						}
						$row->distance = round($distance, 2);
						$out[] = $row;
				}
				usort($out, function ($a, $b) {
						return $a->distance <=> $b->distance;
				});
				return array_slice($out, 0, intval($limit));
		}

		/**
		 * Great-circle distance in km (haversine).
		 */
		public static function distanceKm($lat1, $lng1, $lat2, $lng2) {
				$lat1 = deg2rad((float) $lat1);
				$lng1 = deg2rad((float) $lng1);
				$lat2 = deg2rad((float) $lat2);
				$lng2 = deg2rad((float) $lng2);

				$dlat = $lat2 - $lat1;
				$dlng = $lng2 - $lng1;

				$a = sin($dlat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($dlng / 2) ** 2;
				return 2 * self::EARTH_KM * asin(min(1.0, sqrt($a)));
		}

		/**
		 * All indexed rows of a type, for a whole-map view.
		 * Bounded by $limit so a map request can never pull the table.
		 */
		public function allOfType($object_type, $limit = 300) {
				$params['from']   = self::TABLE;
				$params['wheres'] = array(
						self::wheres('object_type', '=', (string) $object_type),
				);
				$params['limit'] = intval($limit);
				$rows = $this->select($params, true);
				return $rows ? $rows : array();
		}
}
