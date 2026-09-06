/**
 * Being near something, as a fact the runtime acts on.
 *
 * Not physics for its own sake — BERX has nothing to drop and nothing
 * to collide. What it does have is distance that means something:
 * what is within reach of what you are with, and where the world ends.
 * Both change behaviour, which is the only reason either is here.
 */
import {interactionRadius} from './spatialInteraction';
import type {BerxSpatialObject, BerxVec3} from './world';

const distance = (a: BerxVec3, b: BerxVec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * Two entities whose interaction volumes meet.
 *
 * The volume is the object's own scale, which is what its geometry
 * actually occupies — so this is overlap in the world, not a guess
 * from ids or kinds.
 */
export function berxOverlaps(a: BerxSpatialObject, b: BerxSpatialObject): boolean {
	return distance(a.transform.position, b.transform.position) < interactionRadius(a) + interactionRadius(b);
}

/**
 * What is within reach of a point, nearest first.
 *
 * `radius` is in world units and is a real cutoff: something outside it
 * is not near, and saying so is more useful than a list ordered by
 * distance that never ends.
 */
export function berxNear(
	at: BerxVec3,
	objects: readonly BerxSpatialObject[],
	radius: number,
	options: {exclude?: string} = {},
): BerxSpatialObject[] {
	return objects
		.filter((o) => o.visible && o.id !== options.exclude && distance(at, o.transform.position) <= radius)
		.sort((a, b) => distance(at, a.transform.position) - distance(at, b.transform.position));
}

export interface BerxWorldBounds {
	min: BerxVec3;
	max: BerxVec3;
	centre: BerxVec3;
	/** Distance from the centre to the furthest entity, plus its own size. */
	radius: number;
}

/**
 * How big the world currently is.
 *
 * Derived from what is in it, so it grows as entities arrive and
 * shrinks when they leave. An empty world is a point at the origin,
 * which is honest: there is nowhere to be.
 */
export function berxWorldBounds(objects: readonly BerxSpatialObject[]): BerxWorldBounds {
	const visible = objects.filter((o) => o.visible);
	if (visible.length === 0) {
		const zero = {x: 0, y: 0, z: 0};
		return {min: {...zero}, max: {...zero}, centre: {...zero}, radius: 0};
	}
	const min = {x: Infinity, y: Infinity, z: Infinity};
	const max = {x: -Infinity, y: -Infinity, z: -Infinity};
	for (const o of visible) {
		const r = interactionRadius(o);
		min.x = Math.min(min.x, o.transform.position.x - r);
		min.y = Math.min(min.y, o.transform.position.y - r);
		min.z = Math.min(min.z, o.transform.position.z - r);
		max.x = Math.max(max.x, o.transform.position.x + r);
		max.y = Math.max(max.y, o.transform.position.y + r);
		max.z = Math.max(max.z, o.transform.position.z + r);
	}
	const centre = {x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2};
	let radius = 0;
	for (const o of visible) {
		radius = Math.max(radius, distance(centre, o.transform.position) + interactionRadius(o));
	}
	return {min, max, centre, radius};
}

/**
 * Keep a position inside the world it belongs to.
 *
 * A camera that can be flown arbitrarily far away leaves the viewer
 * looking at nothing with no way of knowing which direction anything
 * is in — which is not freedom, it is being lost. The margin is
 * generous: you can stand well outside the world and see all of it,
 * you just cannot leave it behind.
 *
 * Returns the input unchanged when it is already inside, so nothing
 * moves that did not need to.
 */
export function berxClampToWorld(position: BerxVec3, bounds: BerxWorldBounds, margin = 12): BerxVec3 {
	const limit = bounds.radius + margin;
	const d = distance(position, bounds.centre);
	if (d <= limit || d === 0) return position;
	const scale = limit / d;
	return {
		x: bounds.centre.x + (position.x - bounds.centre.x) * scale,
		y: bounds.centre.y + (position.y - bounds.centre.y) * scale,
		z: bounds.centre.z + (position.z - bounds.centre.z) * scale,
	};
}
