/**
 * Compositions — named arrangements a region can put its world into.
 *
 * WHY THIS EXISTS. Until now BERX had exactly one way to place things:
 * berxRelationalLayout, which derives every coordinate from the real
 * relations between entities. That is the R dimension and it is right —
 * but it is not the whole answer, because some regions have a SHAPE
 * that is part of what they mean:
 *
 *   a first choice is a ring you stand in the middle of;
 *   a life is a core with its own orbits around it;
 *   a conversation is a line between two people with what was said
 *   strung along it;
 *   one thing being considered is a stage, with the alternatives behind.
 *
 * Those are the arrangements the product design asks for, and they are
 * arrangements of THE SAME WORLD — not screens. Every one of them is a
 * function from the entities and their relations to coordinates, which
 * is why it belongs here, in the platform-free core, and reaches
 * WebGL2, WebGPU and the native renderer through the same draw list as
 * everything else. A composition implemented as a DOM layout would
 * exist on the web and nowhere else, and would be a second world.
 *
 * DETERMINISTIC, like everything else that places things: no
 * Math.random anywhere. The same entities in the same region land in
 * the same coordinates on every run, on every platform — which is what
 * lets a viewer return to a place and find it where they left it, and
 * what lets a gate predict where a thing will be.
 */
import {berxRelationalLayout, berxRelationalWeight, berxStableAngle} from './relational';
import type {BerxSpatialObject, BerxSpatialRelation, BerxVec3} from './world';

export type BerxComposition =
	/** Position from the relations themselves. The default, and the world's own. */
	| 'relational'
	/** The viewer at the centre, choices evenly around them, all facing in. */
	| 'ring'
	/** One subject at the centre, everything else on concentric orbits. */
	| 'orbits'
	/** Two ends and what passes between them, strung along the line. */
	| 'thread'
	/** One thing considered, the alternatives behind it in depth. */
	| 'stage';

export const BERX_COMPOSITIONS: readonly BerxComposition[] = [
	'relational', 'ring', 'orbits', 'thread', 'stage',
] as const;

export interface BerxCompositionOptions {
	/** The entity the arrangement is built around. */
	rootId?: string;
	/** Metres. What "near" means for this arrangement. */
	radius?: number;
	/** Metres the arrangement rises above and below its own plane. */
	rise?: number;
}

/** How wide each arrangement stands by default, in metres. */
const RADIUS: Readonly<Record<BerxComposition, number>> = Object.freeze({
	relational: 0,
	/* an arm's reach plus a step: close enough to be a choice, far
	   enough that four of them do not touch */
	ring: 4.2,
	orbits: 3.4,
	thread: 5.5,
	stage: 3.0,
});

/**
 * What each region's world is shaped like.
 *
 * A region is not a screen, so this is not a route table: it says what
 * the SAME world does when the viewer is standing in that part of it.
 * Regions with no shape of their own stay relational, which is the
 * honest default — an arrangement imposed on a graph that does not have
 * one is decoration.
 */
const BY_REGION: Readonly<Record<string, BerxComposition>> = Object.freeze({
	world: 'relational',
	now: 'orbits',
	discover: 'relational',
	person: 'orbits',
	place: 'stage',
	event: 'orbits',
	experience: 'stage',
	community: 'relational',
	collection: 'stage',
	conversation: 'thread',
	create: 'ring',
	signals: 'orbits',
	self: 'orbits',
});

export function berxCompositionFor(region: string): BerxComposition {
	return BY_REGION[region] ?? 'relational';
}

/**
 * Place every entity, in the arrangement this region calls for.
 *
 * Falls back to the relational layout for `relational` and for anything
 * an arrangement cannot place — a ring with one entity in it is a
 * relational layout with extra steps, and pretending otherwise would
 * put a lone object at an arbitrary angle for no reason.
 */
export function berxComposeLayout(
	composition: BerxComposition,
	objects: readonly BerxSpatialObject[],
	relations: readonly BerxSpatialRelation[],
	options: BerxCompositionOptions = {},
): Map<string, BerxVec3> {
	if (composition === 'relational' || objects.length === 0) {
		return berxRelationalLayout(objects, relations, {rootId: options.rootId});
	}
	const radius = options.radius ?? RADIUS[composition];
	const rise = options.rise ?? 1.15;
	const root = options.rootId ? objects.find((o) => o.id === options.rootId) : undefined;
	const others = objects.filter((o) => o.id !== root?.id);
	const positions = new Map<string, BerxVec3>();
	/* the arrangement is built around the origin, and the root is the
	   origin: a viewer standing in their own ring stands at its centre */
	if (root) positions.set(root.id, {x: 0, y: 0, z: 0});

	switch (composition) {
		case 'ring': {
			/**
			 * Evenly spaced, in a fixed order, all at one height.
			 *
			 * Ordered by id rather than by array position: the same four
			 * choices must sit in the same four places whatever order the
			 * server sent them in, or a viewer who has learned where
			 * "create" is finds it somewhere else next time.
			 */
			const ordered = [...others].sort((a, b) => a.id.localeCompare(b.id));
			ordered.forEach((object, i) => {
				const angle = (i / Math.max(1, ordered.length)) * Math.PI * 2;
				positions.set(object.id, {
					x: Math.cos(angle) * radius,
					/* a slight lift so the ring is a ring and not a floor */
					y: Math.sin(angle * 2) * rise * 0.25,
					z: Math.sin(angle) * radius,
				});
			});
			break;
		}

		case 'orbits': {
			/**
			 * Concentric rings, and which ring a thing is on is decided by
			 * how strongly it is connected — not by when it arrived.
			 *
			 * Three rings, because a fourth is not legible from inside: at
			 * this radius the far one already reads as "background", and a
			 * distinction the eye cannot make is not a distinction.
			 */
			const ranked = [...others].sort((a, b) => {
				const wa = berxRelationalWeight(a.id, relations);
				const wb = berxRelationalWeight(b.id, relations);
				if (wa !== wb) return wb - wa;
				return a.id.localeCompare(b.id);
			});
			const rings = 3;
			const perRing = Math.max(1, Math.ceil(ranked.length / rings));
			ranked.forEach((object, i) => {
				const ring = Math.min(rings - 1, Math.floor(i / perRing));
				const withinRing = i % perRing;
				const inThisRing = Math.min(perRing, ranked.length - ring * perRing);
				/* each ring is offset by its own stable angle, so two rings
				   never line up into a spoke */
				const angle =
					(withinRing / Math.max(1, inThisRing)) * Math.PI * 2 + berxStableAngle(`ring:${ring}`);
				const r = radius * (1 + ring * 0.75);
				positions.set(object.id, {
					x: Math.cos(angle) * r,
					/* rings sit at different heights, so a ring behind is
					   visible over a ring in front rather than hidden by it */
					y: (ring - 1) * rise * 0.6,
					z: Math.sin(angle) * r,
				});
			});
			break;
		}

		case 'thread': {
			/**
			 * Two ends, and what passed between them strung along the line.
			 *
			 * The ends are the two most strongly connected entities — in a
			 * conversation, the two people. Everything else is spread
			 * evenly between them in the order it exists, which for
			 * messages is the order they were said.
			 */
			const ends = [...others]
				.sort((a, b) => berxRelationalWeight(b.id, relations) - berxRelationalWeight(a.id, relations) || a.id.localeCompare(b.id))
				.slice(0, 2);
			/**
			 * In the order it HAPPENED, not the order it arrived.
			 *
			 * The first version strung these along the line in array order,
			 * which meant the same conversation rearranged itself whenever
			 * the server returned its messages in a different order — a
			 * 5.5m shift, measured, and exactly the failure relational.ts
			 * warns about: an entity that moves when nothing about it
			 * changed cannot be navigated back to. Time first, because for
			 * a conversation that IS the order; id as the tiebreak, so
			 * things with no time of their own still land somewhere fixed.
			 */
			const when = (o: BerxSpatialObject) => o.time?.at ?? o.time?.startsAt ?? Number.POSITIVE_INFINITY;
			const between = others
				.filter((o) => !ends.some((e) => e.id === o.id))
				.sort((a, b) => (when(a) - when(b)) || a.id.localeCompare(b.id));
			ends.forEach((object, i) => {
				positions.set(object.id, {x: i === 0 ? -radius : radius, y: 0, z: 0});
			});
			between.forEach((object, i) => {
				const t = (i + 1) / (between.length + 1);
				positions.set(object.id, {
					x: -radius + t * radius * 2,
					/* alternating sides of the line, so a thread reads as an
					   exchange rather than as a queue */
					y: (i % 2 === 0 ? 1 : -1) * rise * 0.45,
					z: (i % 2 === 0 ? 1 : -1) * radius * 0.22,
				});
			});
			break;
		}

		case 'stage': {
			/**
			 * One thing in front, the alternatives behind it in depth.
			 *
			 * Depth rather than a row, because a row makes every option
			 * equal and a stage does not: what is being considered is
			 * nearer, larger and unoccluded, and what else there is stands
			 * behind it, still visible, still reachable.
			 */
			const ordered = [...others].sort((a, b) => {
				const wa = berxRelationalWeight(a.id, relations);
				const wb = berxRelationalWeight(b.id, relations);
				if (wa !== wb) return wb - wa;
				return a.id.localeCompare(b.id);
			});
			ordered.forEach((object, i) => {
				/* fanned slightly to alternating sides so the ones behind
				   are not hidden exactly behind the one in front */
				const side = i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * radius * 0.38;
				positions.set(object.id, {
					x: side,
					y: i === 0 ? 0 : -rise * 0.2 * Math.ceil(i / 2),
					z: -i * radius * 0.85,
				});
			});
			break;
		}
	}

	/* Anything the arrangement did not place keeps its relational
	   position: a composition is a shape for what it understands, not a
	   licence to lose an entity. */
	if (positions.size < objects.length) {
		const fallback = berxRelationalLayout(objects, relations, {rootId: options.rootId});
		for (const object of objects) {
			if (!positions.has(object.id)) {
				const at = fallback.get(object.id);
				if (at) positions.set(object.id, at);
			}
		}
	}
	return positions;
}
