/**
 * Eight ways to travel — as ONE transition, not a second runtime.
 *
 * The temptation is to build a `BerxTransitionSystem` that owns a
 * camera, interpolates it and hands the result to a renderer. That is a
 * second source of truth: BerxSpatialCamera/BerxCameraTransition
 * already move the camera, Berx5DRuntime already owns the transition
 * state, and two systems interpolating the same camera is how a world
 * ends up with a pose nothing agrees on. So a transition here is a
 * SPEC — a shape the one existing transition takes — and nothing here
 * holds state or steps a clock.
 *
 * The second temptation is eight names for the same lerp. An effect
 * that changes nothing a renderer can observe is a label, so every kind
 * below differs in at least one thing that reaches pixels:
 *
 *   ease      how progress maps to the path — the pacing you feel
 *   arc       how far the camera leaves the straight line between the
 *             two poses, in metres, at the midpoint
 *   fov       a real multiplier on the field of view during the move,
 *             which is what makes a dolly-zoom a dolly-zoom
 *   opacity   what the world's surfaces do while it happens
 *   emissive  light added to everything, decaying
 *   scale     objects drawn larger or smaller for the duration
 *
 * The last three are applied in berxBuildDrawList — one place, so
 * WebGL2, WebGPU and the native backend all show the same transition
 * and the cross-renderer pixel comparison stays meaningful.
 */

export type BerxTransitionKind =
	| 'wormhole'
	| 'dissolve'
	| 'fold'
	| 'warp'
	| 'teleport'
	| 'flow'
	| 'bloom'
	| 'collapse';

export const BERX_TRANSITION_KINDS: readonly BerxTransitionKind[] = [
	'wormhole', 'dissolve', 'fold', 'warp', 'teleport', 'flow', 'bloom', 'collapse',
] as const;

/** What the world looks like at one instant of a transition. */
export interface BerxTransitionModulation {
	/** Multiplier on every surface's opacity. 1 is untouched. */
	opacity: number;
	/** Added to every surface's emissive term, 0..1. */
	emissive: number;
	/** Multiplier on every object's size. 1 is untouched. */
	scale: number;
	/** Multiplier on the camera's field of view. 1 is untouched. */
	fov: number;
}

export interface BerxTransitionSpec {
	readonly kind: BerxTransitionKind;
	/** Seconds. Real, and different per kind — pacing is the effect. */
	readonly durationSeconds: number;
	/** Metres the camera leaves the straight line at the midpoint. */
	readonly arcMetres: number;
	/** What it is for, so a new kind is a decision rather than a name. */
	readonly meaning: string;
	/** Progress → eased progress. Both ends are pinned: ease(0)=0, ease(1)=1. */
	readonly ease: (t: number) => number;
	/** Eased progress → what the world looks like. */
	readonly modulate: (t: number) => BerxTransitionModulation;
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
/**
 * A hill: exactly 0 at both ends, exactly 1 in the middle.
 *
 * `sin(πt)` is the obvious choice and is wrong here: sin(π) is
 * 1.2246e-16, not 0, so an effect built on it leaves a residue of
 * ~1e-17 emissive behind forever. Invisible, and still a transition
 * that never actually ends. 4t(1−t) is exactly zero at both ends in
 * floating point — measured, not assumed.
 */
const hill = (t: number) => {
	const c = clamp01(t);
	return 4 * c * (1 - c);
};
const smooth = (t: number) => {
	const c = clamp01(t);
	return c * c * (3 - 2 * c);
};
const none: BerxTransitionModulation = {opacity: 1, emissive: 0, scale: 1, fov: 1};

const SPECS: Readonly<Record<BerxTransitionKind, BerxTransitionSpec>> = Object.freeze({
	/**
	 * Distance collapsing. The field of view opens hard while the
	 * camera accelerates, which is a real dolly-zoom: the world at the
	 * edges rushes past and the thing ahead stays put.
	 */
	wormhole: {
		kind: 'wormhole',
		durationSeconds: 1.5,
		arcMetres: 0,
		meaning: 'distance collapses — for travel that crosses the world',
		ease: (t) => 1 - Math.pow(1 - clamp01(t), 4),
		modulate: (t) => ({opacity: 1, emissive: 0.18 * hill(t), scale: 1, fov: 1 + 0.55 * hill(t)}),
	},
	/**
	 * The world thins out and comes back. Nothing moves that would not
	 * have moved anyway — the only change is that surfaces stop hiding
	 * each other for a moment, which reads as passing through.
	 */
	dissolve: {
		kind: 'dissolve',
		durationSeconds: 1.0,
		arcMetres: 0,
		meaning: 'the world thins and reforms — for arriving somewhere unrelated',
		ease: smooth,
		modulate: (t) => ({opacity: 1 - 0.72 * hill(t), emissive: 0, scale: 1, fov: 1}),
	},
	/**
	 * The path bends over the top. A fold is the only kind that leaves
	 * the straight line by a large amount, so it is the one you can
	 * recognise from the camera path alone.
	 */
	fold: {
		kind: 'fold',
		durationSeconds: 1.2,
		arcMetres: 3.4,
		meaning: 'space folds over — for moving between two things side by side',
		ease: smooth,
		modulate: (t) => ({opacity: 1 - 0.2 * hill(t), emissive: 0, scale: 1, fov: 1 - 0.12 * hill(t)}),
	},
	/** Fast and hard. The shortest of the moving kinds. */
	warp: {
		kind: 'warp',
		durationSeconds: 0.8,
		arcMetres: 0.6,
		meaning: 'a hard jump — for a deliberate, known destination',
		ease: (t) => {
			const c = clamp01(t);
			return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
		},
		modulate: (t) => ({opacity: 1, emissive: 0.1 * hill(t), scale: 1 + 0.08 * hill(t), fov: 1 + 0.3 * hill(t)}),
	},
	/**
	 * Not a move: a cut, with a flash that decays after it.
	 *
	 * The camera is already there at 5% of a very short duration. The
	 * flash is what makes it legible as a jump rather than as a
	 * dropped frame — a cut with no acknowledgement is indistinguishable
	 * from a bug.
	 */
	teleport: {
		/* The one kind that is NOT the identity at t=0: the flash is the
		   cut itself, and a cut acknowledged one frame late reads as a
		   glitch. Every kind is the identity at t=1, including this one. */
		kind: 'teleport',
		durationSeconds: 0.28,
		arcMetres: 0,
		meaning: 'a cut, acknowledged — for returning somewhere already known',
		ease: (t) => (clamp01(t) < 0.05 ? 0 : 1),
		modulate: (t) => ({opacity: 1, emissive: 0.5 * Math.pow(1 - clamp01(t), 2), scale: 1, fov: 1}),
	},
	/**
	 * The slowest. Pacing is most of it — but not all of it, and the
	 * distinction matters: an effect whose only difference is duration
	 * looks identical in any single frame, which means it is a name
	 * rather than a thing. So flow also breathes the field of view
	 * open by a few degrees and lets it settle, which is what an
	 * unhurried move through time looks like from inside it. Small on
	 * purpose: this is the one that must never announce itself.
	 */
	flow: {
		kind: 'flow',
		durationSeconds: 2.0,
		arcMetres: 1.2,
		meaning: 'unhurried travel — for moving through time, not space',
		ease: (t) => {
			const c = clamp01(t);
			return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
		},
		modulate: (t) => ({opacity: 1, emissive: 0, scale: 1, fov: 1 + 0.07 * hill(t)}),
	},
	/** Light first, movement second — for arriving at something alive. */
	bloom: {
		kind: 'bloom',
		durationSeconds: 0.9,
		arcMetres: 0.4,
		meaning: 'light swells — for arriving at something happening now',
		ease: smooth,
		modulate: (t) => ({opacity: 1, emissive: 0.42 * hill(t), scale: 1 + 0.06 * hill(t), fov: 1}),
	},
	/**
	 * Everything draws in toward the destination, then releases.
	 *
	 * ITS OWN TWO TERMS USED TO CANCEL. The objects shrank by 22% and
	 * the field of view narrowed by 18% at the same instant, and a
	 * narrower field of view is the camera MAGNIFYING: at 60 degrees,
	 * 0.82 of the angle is 1.26 of the size. 0.78 x 1.26 is 0.98, so
	 * nothing measurably drew in — the world sat almost exactly the
	 * size it already was, and the slowest, most deliberate transition
	 * in the set was the one that showed the least.
	 *
	 * Measured, not reasoned: a real GPU readback counted 39,042 lit
	 * pixels mid-collapse against 37,232 in the untouched frame. The
	 * world was very slightly BIGGER while collapsing.
	 *
	 * So the scale now carries it, the narrowing is small enough to be
	 * the tunnel closing rather than a zoom, and a shallow fade takes
	 * the edges with it. Still nobody else's image: fold fades and
	 * narrows without shrinking, dissolve only fades, and this is the
	 * only one where the world itself gets smaller.
	 */
	collapse: {
		kind: 'collapse',
		durationSeconds: 0.7,
		arcMetres: 0,
		meaning: 'the world draws in — for going back, or closing something',
		ease: (t) => clamp01(t) * clamp01(t),
		modulate: (t) => ({opacity: 1 - 0.15 * hill(t), emissive: 0, scale: 1 - 0.22 * hill(t), fov: 1 - 0.06 * hill(t)}),
	},
});

export function berxTransitionSpec(kind: BerxTransitionKind): BerxTransitionSpec {
	return SPECS[kind];
}

/**
 * Which transition a piece of navigation deserves.
 *
 * One table, so travelling to a place feels the same wherever the
 * travel was started from — a keyboard, a pointer, an action ring or a
 * realtime event.
 */
export type BerxTravelReason =
	| 'travel'
	| 'travel-far'
	| 'back'
	| 'focus'
	| 'live'
	| 'time'
	| 'region'
	| 'return';

const REASONS: Readonly<Record<BerxTravelReason, BerxTransitionKind>> = Object.freeze({
	/* the ordinary case: somewhere else in the world you can see */
	travel: 'warp',
	/* far enough that the world between is worth showing collapsing */
	'travel-far': 'wormhole',
	back: 'collapse',
	/* focusing is not travelling; it is the gentlest thing there is */
	focus: 'flow',
	/* something is happening NOW — the one place light leads */
	live: 'bloom',
	/* moving along T rather than through XYZ */
	time: 'flow',
	/* a different kind of place entirely */
	region: 'dissolve',
	/* somewhere already known: no ceremony, just an acknowledged cut */
	return: 'teleport',
});

export function berxTransitionForTravel(reason: BerxTravelReason): BerxTransitionKind {
	return REASONS[reason];
}

/** Beyond this many metres a travel is a `travel-far`. */
export const BERX_FAR_TRAVEL_METRES = 14;

/**
 * The modulation at a given progress, or the identity when there is no
 * transition. Callers never branch on undefined.
 */
export function berxTransitionModulation(
	kind: BerxTransitionKind | undefined,
	progress: number,
): BerxTransitionModulation {
	if (!kind) return none;
	return SPECS[kind].modulate(clamp01(progress));
}

/**
 * Where the camera is along the path, including the arc.
 *
 * `up` is the world's up axis; an arc lifts the path off the straight
 * line between the two poses so the move is legible as a path rather
 * than as a slide. Deterministic: same inputs, same point, always.
 */
export function berxTransitionArcOffset(kind: BerxTransitionKind | undefined, easedProgress: number): number {
	if (!kind) return 0;
	return SPECS[kind].arcMetres * hill(easedProgress);
}
