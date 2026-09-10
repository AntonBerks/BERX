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
import {berxBoundingRadius} from './berxFraming';
import {berxDrawnHalfExtent} from './geometry';
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

/**
 * HOW FAR A RELATION HOLDS TWO THINGS APART, IN UNITS OF THEIR OWN SIZE.
 *
 * These used to be absolute metres — `related: 4.0`, divided by a
 * strength of 0.5, so eight metres — chosen with no reference to how big
 * the entities being placed actually are. Measured on the framing
 * fixture: entities with a bounding radius of 1.38 standing 7.73 apart,
 * spread over sixteen metres. Six diameters of empty space between one
 * thing and the next. No camera can make that read as a place: the
 * distance that contains it all is a distance at which everything in it
 * is tiny, which is why the world occupied 22% of a desktop frame and
 * 3.6% of a phone's.
 *
 * A place is not laid out that way. Things in a room stand roughly their
 * own size apart, and a bigger thing stands proportionally further from
 * its neighbour — so the unit here is the sum of the two entities' own
 * radii, and the number is how many of those the relation is worth. The
 * ORDER is unchanged, so a weaker kind of relation still reaches further
 * than a stronger one; only the scale is now the world's own rather than
 * an absolute nobody could relate to anything.
 *
 * Chosen against a measured objective, not by taste: the fit already
 * searches for the nearest distance that keeps every entity whole and
 * then backs off if coverage exceeds its target, so the layout only has
 * to be compact ENOUGH for the camera to find the band on the tightest
 * frame there is — a portrait phone. See verify:5d-framing.
 */
const RELATION_SEPARATION: Record<BerxSpatialRelation['type'], number> = {
	/* contained things sit inside their container */
	contains: 0.62,
	/* the author is the closest relation a moment has */
	'created-by': 0.78,
	messages: 0.85,
	/* a thing at a place stands with it */
	'located-at': 0.92,
	attending: 1.15,
	shares: 1.3,
	related: 1.55,
};

/**
 * How much further a weak relation reaches than a strong one.
 *
 * Dividing by strength — which is what this did — is a factor of FOUR
 * between a certainty and a guess, and it was the single biggest reason
 * the world was enormous: every relation the mappers emit at 0.5 was
 * placed at double its radius. Weaker still means further, which is the
 * thing worth keeping; it now means half again rather than four times.
 */
const WEAKNESS_REACH = 0.6;

/**
 * The closest two entities may ever stand, in units of their own radii.
 *
 * Bounding radii overestimate a flat panel, so surfaces touching at
 * `r_a + r_b` is already generous; this is the floor no relation, however
 * strong, may go inside. With the smallest entities in the world it is
 * still several times the 0.4 minimum separation the dimension gates
 * hold, so nothing can be placed on top of anything.
 */
const NEAREST_STANDING = 0.58;

/**
 * How much clear air two things keep between them, in world units.
 *
 * Not a picking tolerance and not a fudge: it is the difference between
 * two things standing next to each other and two things touching. Small,
 * because the arrangement has to stay compact enough to fill a frame.
 */
const BREATHING = 0.12;

/**
 * HOW THE RING IS SHAPED, AND WHY IT DEPENDS ON THE FRAME.
 *
 * Union coverage — the fraction of the frame actually standing on
 * something — settles the shape, and it is not a matter of taste:
 *
 *   A DEPTH CORRIDOR cannot fill a frame. Entities behind the nearest
 *   one are small in exact proportion to how far behind they are, so
 *   they contribute almost nothing, and the coverage is whatever the
 *   front entity happens to subtend. Measured: 27% on a desktop with
 *   the world running from 5 to 20 units deep.
 *
 *   A LINE ACROSS THE FRAME tops out near 16%. Five non-overlapping
 *   discs in a row occupy a strip a fifth as tall as it is wide, and a
 *   frame that contains the strip is four fifths empty by construction.
 *
 *   A BLOCK ACROSS BOTH FRAME AXES fills it. Five discs in a 3-and-2
 *   arrangement pack to about 78% of their own bounding box, and a fit
 *   that brings that box to the frame's edges lands well above the
 *   band — at which point the fit's own back-off brings it down to the
 *   middle of it. Which is the whole trick: the arrangement only has to
 *   be compact ENOUGH, and the camera does the rest.
 *
 * So the ring stands in the plane facing the viewer, and its long axis
 * follows the FRAME's long axis: across on a desktop, upward on a
 * portrait phone. The two axes cost different amounts — containing an
 * extent costs (extent + radius) / tan(half that axis's angle) — and a
 * phone is 0.46 as wide as it is tall, so the same world laid out
 * sideways costs it more than twice the distance. Depth keeps a real
 * share, because a world with no parallax is a poster; it is just no
 * longer where the arrangement mostly goes.
 */
const RING_SHAPE = {
	/**
	 * How big the ring is, as a fraction of the distance the relations
	 * themselves ask for.
	 *
	 * Derived, not chosen: five entities of radius r pack into a block
	 * about 3 discs by 2, so the arrangement wants a semi-axis near
	 * 3r along the frame's long side. With the relation distances this
	 * world produces — a related pair at half strength stands about
	 * 4.8 apart — that is a ring 0.74 of the relation radius. Every
	 * number in this file is checked by verify:5d-framing on four frame
	 * shapes at once, so a wrong one is visible immediately.
	 */
	size: 0.51,
	/**
	 * And into depth, which no frame charges for.
	 *
	 * Kept deliberately, and kept small. A world with no parallax is a
	 * poster; a world that is mostly depth is a corridor whose far end
	 * contributes nothing to the frame.
	 */
	depth: 0.25,
};

/** How far apart entities with no relation at all are held. */
const UNRELATED_RING = 9.5;
/** π(3−√5): successive multiples are as evenly spread as any count allows. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface BerxRelationalLayoutOptions {
	/**
	 * The frame this world will be seen in, as width / height.
	 *
	 * The arrangement's long axis follows the frame's long axis — see
	 * RING_SHAPE. Not a rendering concern leaking into the layout: how a
	 * place is arranged around you genuinely depends on the shape of the
	 * opening you are looking through it from, and pretending otherwise
	 * is what made a phone show a world occupying 3.6% of its screen.
	 *
	 * Omitted, a landscape frame is assumed, which is what a desktop is
	 * and what every non-visual caller effectively wants.
	 */
	aspect?: number;
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
	const rise = options.rise ?? 0.6;
	/**
	 * THE RING'S SHAPE IS THE FRAME'S SHAPE.
	 *
	 * Not "long axis follows the long axis" as a rule of thumb — the
	 * exact proportion. An arrangement whose bounding box has the
	 * frame's own aspect is the only one whose box can touch all four
	 * edges at once; any other proportion binds on one axis and leaves
	 * the other short, and the frame is empty by exactly that much. On a
	 * 1100x700 desktop a ring proportioned 1:1 leaves a third of the
	 * width unused however close the camera comes.
	 *
	 * `sqrt` on each side keeps the product constant, so changing the
	 * frame's shape RESHAPES the world rather than growing or shrinking
	 * it. Clamped, because a viewport one pixel wide is a real thing to
	 * be handed and not a reason to lay the world out in a line.
	 */
	const shape = Math.sqrt(Math.max(0.25, Math.min(4, options.aspect ?? 1.6)));
	const across = RING_SHAPE.size * shape;
	const upward = RING_SHAPE.size / shape;
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
	 * Grow the world outward from a seed, along the strongest relations.
	 *
	 * Not breadth-first. An entity is placed beside whichever placed
	 * entity it is most strongly related to — but only once nothing
	 * stronger is still coming: an event whose venue has not been placed
	 * yet waits for it rather than settling next to whoever happened to
	 * create it. That is what keeps the arrangement about the
	 * relationships rather than about traversal order.
	 *
	 * Deterministic throughout: strengths decide, and equal strengths
	 * are broken by id, so the same graph gives the same world every
	 * time on every machine.
	 */
	const placedAround = new Map<string, number>();
	/**
	 * Who each entity was placed beside, and how far from it.
	 *
	 * Kept so the angles can be EVENED OUT once the count is known — see
	 * the re-spacing pass at the end. The radius each entity earned is
	 * carried through untouched: only the direction, which never carried
	 * anything, is reassigned.
	 */
	const ring = new Map<string, {anchorId: string; radius: number; rise: number}>();
	const place = (id: string, at: BerxVec3) => {
		positions.set(id, at);
	};
	const beside = (anchorId: string, id: string, type: BerxSpatialRelation['type'], strength: number): BerxVec3 => {
		const origin = positions.get(anchorId)!;
		/**
		 * The unit is the two entities' OWN size — see
		 * RELATION_SEPARATION. A relation between two large things holds
		 * them proportionally further apart than the same relation
		 * between two small ones, which is how distance in a place
		 * actually works and is what makes the arrangement independent
		 * of whatever units the entities happen to be modelled in.
		 */
		const anchor = byId.get(anchorId);
		const self = byId.get(id);
		const reach = (anchor ? berxBoundingRadius(anchor) : 1) + (self ? berxBoundingRadius(self) : 1);
		/* strength pulls in: a strong relation is a near one */
		const weakness = 1 + (1 - Math.max(0.25, Math.min(1, strength))) * WEAKNESS_REACH;
		const radius = Math.max(reach * NEAREST_STANDING, reach * RELATION_SEPARATION[type] * weakness);
		/**
		 * WHICH WAY, WHEN NO DIRECTION IS MEANT.
		 *
		 * The DISTANCE carries the relation — strength pulls in — and it
		 * is untouched below. The ANGLE never carried anything: it is a
		 * hash of the id, chosen so the same graph lands the same way
		 * twice. Being meaningless, it was free to point anywhere, and
		 * on a horizontal plane "anywhere" is mostly INTO DEPTH.
		 *
		 * Squashing the circle toward the lateral axis was tried and
		 * REVERTED: it lifted desktop coverage but a wide arrangement
		 * cannot fit a portrait frame, and the phone fell from four
		 * entities wholly inside to one of three. Containment is not
		 * tradeable for coverage.
		 */
		/* neighbours of the same anchor step outward rather than stacking
		   on one radius when their angles happen to be close */
		const rank = placedAround.get(anchorId) ?? 0;
		placedAround.set(anchorId, rank + 1);
		/**
		 * And they are SPREAD around the anchor rather than each taking
		 * its own hash.
		 *
		 * Four things related to one person used to hash to four
		 * independent directions, which is four samples of a uniform
		 * distribution and behaves like it: on the framing fixture three
		 * of them landed within half a unit of each other and the fourth
		 * went to the far side, so the arrangement was both crowded and
		 * enormous. The golden angle is the standard answer — successive
		 * ranks are as far apart as any count allows, without needing to
		 * know the count in advance, which this does not.
		 *
		 * The anchor's own hash still sets where the spread STARTS, so
		 * two anchors do not lay their neighbours out identically, and
		 * the rank order is deterministic, so the same graph still gives
		 * the same world.
		 */
		const angle = berxStableAngle(anchorId) + rank * GOLDEN_ANGLE;
		/**
		 * A WORLD YOU TRAVEL INTO, NOT A WALL YOU STAND IN FRONT OF.
		 *
		 * The ring was circular in the horizontal plane, which spends the
		 * same amount of arrangement on the two axes — and those two axes
		 * cost completely different amounts to look at. Lateral spread is
		 * paid for directly in camera distance: containing it needs
		 * (spread + radius) / tan(half the HORIZONTAL angle), and on a
		 * portrait phone that angle is the narrow one. Depth is nearly
		 * free — the frustum widens as it goes, so something further away
		 * is easier to contain, not harder.
		 *
		 * Squashing the OTHER way, toward the lateral axis, was tried
		 * before this and reverted: it lifted desktop coverage and took
		 * the phone from four entities wholly inside to one of three. The
		 * conclusion drawn then was that the arrangement could not be
		 * changed; the conclusion available now is that it was being
		 * changed in the wrong direction.
		 *
		 * So relations run into depth. That is also the truer world: BERX
		 * is somewhere you move through, and the things related to what
		 * you are looking at stand ahead of and behind it rather than
		 * shoulder to shoulder across a frame.
		 */
		const lateral = Math.cos(angle) * across;
		const vertical = Math.sin(angle) * upward;
		/* and the step between neighbours of one anchor is in the same
		   unit, so a crowded anchor spreads by its own scale */
		const spread = radius + rank * reach * 0.22;
		ring.set(id, {anchorId, radius: spread, rise: Math.sin(angle * 2.3) * rise});
		return {
			x: origin.x + lateral * spread,
			y: origin.y + vertical * spread,
			/* depth is the third axis, and it is the one no frame charges
			   for: a real share of the arrangement, so the world has
			   parallax, without paying for it in camera distance */
			z: origin.z + Math.sin(angle * 1.7) * spread * RING_SHAPE.depth + Math.sin(angle * 2.3) * rise,
		};
	};

	const grow = (seedId: string, seedAt: BerxVec3) => {
		place(seedId, seedAt);
		const reachable = new Set<string>([seedId]);
		/* everything this component can eventually contain */
		const queue = [seedId];
		while (queue.length > 0) {
			const current = queue.shift()!;
			for (const edge of edges.get(current) ?? []) {
				if (!byId.has(edge.other) || reachable.has(edge.other)) continue;
				reachable.add(edge.other);
				queue.push(edge.other);
			}
		}

		while (true) {
			let chosen: {id: string; anchor: string; type: BerxSpatialRelation['type']; strength: number} | undefined;
			let fallback: typeof chosen;
			for (const id of [...reachable].sort()) {
				if (positions.has(id)) continue;
				let bestPlaced: typeof chosen;
				let bestAnyUnplaced = 0;
				for (const edge of edges.get(id) ?? []) {
					if (!byId.has(edge.other)) continue;
					if (positions.has(edge.other)) {
						if (!bestPlaced || edge.strength > bestPlaced.strength) {
							bestPlaced = {id, anchor: edge.other, type: edge.type, strength: edge.strength};
						}
					} else if (reachable.has(edge.other) && edge.strength > bestAnyUnplaced) {
						bestAnyUnplaced = edge.strength;
					}
				}
				if (!bestPlaced) continue;
				if (!fallback || bestPlaced.strength > fallback.strength) fallback = bestPlaced;
				/* something stronger is still coming for this entity */
				if (bestAnyUnplaced > bestPlaced.strength) continue;
				if (!chosen || bestPlaced.strength > chosen.strength) chosen = bestPlaced;
			}
			/* a cycle where everything is waiting on everything else: take
			   the strongest available rather than stalling */
			const next = chosen ?? fallback;
			if (!next) break;
			place(next.id, beside(next.anchor, next.id, next.type, next.strength));
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

	/**
	 * EVENLY, NOW THAT THE COUNT IS KNOWN.
	 *
	 * The golden angle was the right answer to the question the
	 * placement loop can ask: it places one entity at a time and does
	 * not know how many siblings are still coming, and successive golden
	 * multiples are as evenly spread as any count allows. But it is a
	 * SAMPLE of a uniform distribution, and four samples are not four
	 * even quarters: the angles come out 0, 52, 137, 275 — a 52-degree
	 * gap beside an 85 and a 137. Two entities half a chord apart
	 * overlap on the screen, wasting exactly the coverage they were
	 * spread out to gain, while the ring has to be wide enough to keep
	 * the crowded pair apart.
	 *
	 * By the time everything is placed the count IS known, so the angles
	 * are dealt out in equal shares. Measured on the framing fixture:
	 * this is worth about thirty points of coverage, because it is what
	 * lets the ring be small enough for the entities to be large without
	 * them landing on top of one another.
	 *
	 * Only the DIRECTION changes. Each entity keeps the radius its
	 * relation earned — so a strong relation is still a near one and a
	 * wider kind of relation still reaches further — and the order is by
	 * id, so the same graph still gives the same world on every machine.
	 */
	const siblings = new Map<string, string[]>();
	for (const [id, at] of ring) {
		const list = siblings.get(at.anchorId) ?? [];
		list.push(id);
		siblings.set(at.anchorId, list);
	}
	for (const [anchorId, children] of siblings) {
		const origin = positions.get(anchorId);
		if (!origin || children.length === 0) continue;
		children.sort();
		const phase = berxStableAngle(anchorId);
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const at = ring.get(child)!;
			const angle = phase + (i * Math.PI * 2) / children.length;
			positions.set(child, {
				x: origin.x + Math.cos(angle) * across * at.radius,
				y: origin.y + Math.sin(angle) * upward * at.radius,
				z: origin.z + Math.sin(angle * 1.7) * at.radius * RING_SHAPE.depth + at.rise,
			});
		}
	}
	/**
	 * AND NOTHING STANDS INSIDE ANYTHING ELSE.
	 *
	 * Compacting the arrangement until it fills a frame brought
	 * neighbours to about two units apart, and the things themselves are
	 * a unit and a half across, so boxes began to interpenetrate. That is
	 * wrong twice over. A person standing inside a message panel is not a
	 * place, and it makes "which entity is at this pixel" genuinely
	 * ambiguous: two boxes contain the drawn point and only the mesh —
	 * which the core deliberately does not know about — could say which.
	 * Measured, before this: the picker fell from 35 of 35 presses to 15
	 * of 22, and every failure was one overlapping box winning another's
	 * own pixel.
	 *
	 * The test is the REAL extent, not the bounding sphere. A bounding
	 * sphere of a moment's panel is 1.4 where the panel is 0.95 by 1.18
	 * by 0.001, so sphere separation would hold the world four times
	 * further apart than the shapes need — and the whole point of the
	 * compaction was to stop doing that. berxDrawnHalfExtent is what the
	 * renderer draws and what the picker tests, so it is what decides
	 * here too.
	 *
	 * Relaxation rather than a solve: a few passes of pushing overlapping
	 * pairs apart along the line between them. The root stays where it
	 * is — a viewer standing in their own world does not get shoved — and
	 * everything else moves the whole overlap rather than half, so a pair
	 * separates in one pass. Deterministic: pairs in id order, fixed
	 * count of passes.
	 */
	const movable = [...positions.keys()].filter((id) => id !== options.rootId).sort();
	const all = [...positions.keys()].sort();
	const halfOf = (id: string) => {
		const o = byId.get(id);
		return o ? berxDrawnHalfExtent(o.kind, o.transform.scale) : {x: 0.5, y: 0.5, z: 0.5};
	};
	for (let pass = 0; pass < 6; pass++) {
		let moved = false;
		for (const id of movable) {
			for (const other of all) {
				if (other === id) continue;
				const a = positions.get(id)!;
				const b = positions.get(other)!;
				const ha = halfOf(id), hb = halfOf(other);
				/* how deeply the two boxes interpenetrate on each axis;
				   a box pair only overlaps at all if every axis does */
				const ox = ha.x + hb.x + BREATHING - Math.abs(a.x - b.x);
				const oy = ha.y + hb.y + BREATHING - Math.abs(a.y - b.y);
				const oz = ha.z + hb.z + BREATHING - Math.abs(a.z - b.z);
				if (ox <= 0 || oy <= 0 || oz <= 0) continue;
				/* push along the line between the centres, by the least
				   distance that clears the deepest axis */
				let dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
				let d = Math.hypot(dx, dy, dz);
				if (d < 1e-6) {
					/* exactly coincident: any direction will do, and it has
					   to be a deterministic one */
					const angle = berxStableAngle(id);
					dx = Math.cos(angle); dy = 0; dz = Math.sin(angle); d = 1;
				}
				const push = Math.min(ox, oy, oz);
				positions.set(id, {x: a.x + (dx / d) * push, y: a.y + (dy / d) * push, z: a.z + (dz / d) * push});
				moved = true;
			}
		}
		if (!moved) break;
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
