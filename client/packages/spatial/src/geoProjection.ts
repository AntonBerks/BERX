/**
 * Real coordinates, in the one world.
 *
 * A place is somewhere. Until now the world could only stand entities
 * where their RELATIONS put them, so two restaurants on the same street
 * were as far apart as the graph felt like putting them. This projects
 * a latitude and longitude into the canonical world's own X/Y/Z.
 *
 * It is a presentation transform, not a second coordinate system: the
 * domain keeps degrees, the world keeps units, and this is the only
 * place that converts between them. Nothing here decides WHERE the
 * origin is — the caller does, once — because an origin that moved with
 * whatever arrived last would slide the whole world every time a place
 * was ingested.
 *
 * Local equirectangular rather than a full geodesic projection: over
 * the few kilometres a person can see from inside a world this is
 * accurate to well under a metre, and it is exactly invertible, which
 * a gate can check.
 */
import type {BerxSpatialGeoAnchor, BerxVec3} from './world';

/** WGS-84 equatorial radius, in metres. */
export const BERX_EARTH_RADIUS_M = 6_378_137;

/**
 * How many real metres one BERX world unit represents.
 *
 * Entities are drawn a few units across, so at 200 m/unit a place is
 * about the size of a city block and a walkable neighbourhood fills the
 * frame. It is a property of the world's scale, not of any one screen.
 */
export const BERX_GEO_METRES_PER_UNIT = 200;

const RAD = Math.PI / 180;

/**
 * Where a coordinate stands, relative to an origin, in world units.
 *
 * North is -Z: the camera looks down -Z, so moving north reads as
 * moving away into the world rather than toward the viewer. Y is left
 * at 0 — altitude is not something the servers report, and lifting
 * entities off a plane by an invented height would be inventing a fact.
 */
export function berxProjectGeo(
	coordinate: BerxSpatialGeoAnchor,
	origin: BerxSpatialGeoAnchor,
	metresPerUnit: number = BERX_GEO_METRES_PER_UNIT,
): BerxVec3 {
	const scale = Math.max(1e-6, metresPerUnit);
	const eastM = BERX_EARTH_RADIUS_M * (coordinate.lng - origin.lng) * RAD * Math.cos(origin.lat * RAD);
	const northM = BERX_EARTH_RADIUS_M * (coordinate.lat - origin.lat) * RAD;
	return {x: eastM / scale, y: 0, z: -northM / scale};
}

/** The inverse, so a point in the world can name the place it stands on. */
export function berxUnprojectGeo(
	point: BerxVec3,
	origin: BerxSpatialGeoAnchor,
	metresPerUnit: number = BERX_GEO_METRES_PER_UNIT,
): BerxSpatialGeoAnchor {
	const scale = Math.max(1e-6, metresPerUnit);
	const eastM = point.x * scale;
	const northM = -point.z * scale;
	return {
		lat: origin.lat + (northM / BERX_EARTH_RADIUS_M) / RAD,
		lng: origin.lng + (eastM / (BERX_EARTH_RADIUS_M * Math.cos(origin.lat * RAD))) / RAD,
	};
}

/**
 * Great-circle distance in metres — the real one, not the projection's.
 *
 * Kept separate on purpose: a gate that measured the projection with
 * the projection's own arithmetic would only prove it agrees with
 * itself.
 */
export function berxGeoDistanceMetres(a: BerxSpatialGeoAnchor, b: BerxSpatialGeoAnchor): number {
	const lat1 = a.lat * RAD;
	const lat2 = b.lat * RAD;
	const h = Math.sin((lat2 - lat1) / 2) ** 2
		+ Math.cos(lat1) * Math.cos(lat2) * Math.sin(((b.lng - a.lng) * RAD) / 2) ** 2;
	return 2 * BERX_EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
