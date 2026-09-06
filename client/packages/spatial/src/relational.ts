/**
 * R — the social graph as world topology.
 *
 * Where a thing sits in BERX is decided by what it is related to, not
 * by a list index and never by a random number. A moment sits near the
 * person who made it and near the place it happened at; people a
 * viewer is close to stand closer; an event orbits its venue. Move the
 * relationships and the world rearranges, because the arrangement
 * *is* the relationships.
 *
 * Two properties this guarantees, both checkable:
 *
 * **Deterministic.** The same graph produces the same coordinates,
 * every time, on every machine. Nothing here calls Math.random. A
 * world that shuffles itself between renders is not a place, and an
 * entity that moves when nothing about it changed cannot be navigated
 * back to.
 *
 * **Derived.** Every coordinate traces to a real relation with a real
 * strength. Nothing is scattered to fill space or nudged to look
 * composed.
 */
import type {BerxSpatialObject, BerxSpatialRelation, BerxVec3} from './world';

/**
 * A stable angle for an id: the same entity always sits in the same
 * direction from its anchor, so returning to a world finds it where it
 * was left. FNV-1a, because it needs to be stable across machines and
 * across runs, which `hashCode`-style sums are not once ids get long.
 */
export function berxStableAngle(id: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < id.length; i++) {
		hash ^= id.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return (hash / 0x100000000) * Math.PI * 2;
}

/** How near a relation pulls, before its own strength is applied. */
const RELATION_RADIUS: Record<BerxSpatialRelation['type'], number> = {
	/* contained things sit inside their container */
	contains: 1.6,
	/* a thing at a place stands with it */
	'located-at': 2.4,
	/* the author is the closest relation a moment has */
	'created-by': 2.0,
	attending: 3.0,
	messages: 2.2,
	shares: 3.4,
	related: 4.0,
};

/** How far apart entities with no relation at all are held. */
const UNRELATED_RING = 9.5;

export interface BerxRelationalLayoutOptions {
	/**
	 * The entity the viewer is; everything is arranged around it. Its
	 * own relations decide the first ring, so a world is always someone's
	 * world rather than a view from nowhere.
	 */
	rootId?: string;
	/** Vertical spread of a ring, so entities do not collapse into a line. */
	rise?: number;
}

/**
 * Place every object from the relations between them.
 *
 * Breadth-first from the root: each entity is placed on a ring around
 * whichever already-placed entity it is most strongly related to, at a
 * radius that relation earns, in a direction fixed by its own id.
 * Entities the graph does not reach stand on an outer ring — present,
 * addressable, and honestly distant rather than hidden.
 */
export function berxRelationalLayout(
	objects: readonly BerxSpatialObject[],
	relations: readonly BerxSpatialRelation[],
	options: BerxRelationalLayoutOptions = {},
): Map<string, BerxVec3> {
	const rise = options.rise ?? 1.15;
	const positions = new Map<string, BerxVec3>();
	if (objects.length === 0) return positions;

	/* strongest edge first, so an entity lands on the relation that
	   actually defines it rather than on whichever was seen first */
	const edges = new Map<string, {other: string; type: BerxSpatialRelation['type']; strength: number}[]>();
	const add = (from: string, to: string, type: BerxSpatialRelation['type'], strength: number) => {
		const list = edges.get(from) ?? [];
		list.push({other: to, type, strength});
		edges.set(from, list);
	};
	for (const relation of relations) {
		add(relation.from, relation.to, relation.type, relation.strength);
		add(relation.to, relation.from, relation.type, relation.strength);
	}
	for (const list of edges.values()) {
		list.sort((a, b) => b.strength - a.strength || a.other.localeCompare(b.other));
	}

	const byId = new Map(objects.map((o) => [o.id, o]));

	/**
	 * Grow the world outward from a seed, following relations.
	 *
	 * Each entity lands on a ring around whichever already-placed
	 * entity it is most strongly related to, at a radius that relation
	 * earns, in a direction fixed by its own id.
	 */
	const placedAround = new Map<string, number>();
	const grow = (seedId: string, seedAt: BerxVec3) => {
		positions.set(seedId, seedAt);
		const queue = [seedId];
		while (queue.length > 0) {
			const currentId = queue.shift()!;
			const origin = positions.get(currentId)!;
			for (const edge of edges.get(currentId) ?? []) {
				if (positions.has(edge.other) || !byId.has(edge.other)) continue;
				/* strength pulls in: a strong relation is a near one */
				const radius = RELATION_RADIUS[edge.type] / Math.max(0.25, Math.min(1, edge.strength));
				const angle = berxStableAngle(edge.other);
				/* neighbours of the same anchor step outward rather than
				   stacking on one radius when their angles happen to be close */
				const rank = placedAround.get(currentId) ?? 0;
				placedAround.set(currentId, rank + 1);
				const spread = radius + rank * 0.42;
				positions.set(edge.other, {
					x: origin.x + Math.cos(angle) * spread,
					y: origin.y + Math.sin(angle * 1.7) * rise,
					z: origin.z + Math.sin(angle) * spread,
				});
				queue.push(edge.other);
			}
		}
	};

	const rootId = options.rootId && byId.has(options.rootId) ? options.rootId : [...byId.keys()].sort()[0];
	grow(rootId, {x: 0, y: 0, z: 0});

	/**
	 * Whatever the viewer's own component never reached.
	 *
	 * Not scattered onto a ring one by one: an entity with no path to
	 * the viewer is far away, but the things related to *it* are still
	 * next to it. So each remaining component is seeded on an outer ring
	 * and then grown by exactly the same rules — a place you have no
	 * connection to is distant, and the event happening at it is beside
	 * it where it belongs. Seeds are taken in id order so a world with
	 * several islands is still the same world every time.
	 */
	let island = 0;
	for (const object of [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))) {
		if (positions.has(object.id)) continue;
		const angle = berxStableAngle(object.id);
		const ring = UNRELATED_RING + Math.floor(island / 8) * 4.5;
		island++;
		grow(object.id, {
			x: Math.cos(angle) * ring,
			y: Math.sin(angle * 1.7) * rise,
			z: Math.sin(angle) * ring,
		});
	}

	return positions;
}

/**
 * How important an entity is to the viewer, from the graph alone.
 *
 * Sum of the strengths of its relations, normalised. Used for scale
 * and for level of detail — a person with many ties to the viewer is
 * larger and stays detailed for longer, which is a fact about the
 * social graph rather than a design preference.
 */
export function berxRelationalWeight(id: string, relations: readonly BerxSpatialRelation[]): number {
	let total = 0;
	for (const relation of relations) {
		if (relation.from === id || relation.to === id) total += Math.max(0, relation.strength);
	}
	return total === 0 ? 0 : 1 - 1 / (1 + total);
}
