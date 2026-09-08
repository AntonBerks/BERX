/**
 * WHEN SOMEONE REACHES INTO THE WORLD.
 *
 * A touch is not a click. A click is an event with a target and no
 * place; a touch happens somewhere, at a distance, with a duration, and
 * the difference is the whole reason this file is not three lines of
 * `onPress -> playAnimation`.
 *
 * TWO RULES, AND EVERYTHING HERE FOLLOWS FROM THEM.
 *
 * A gesture is a CAUSE, not a command. It goes through the same closed
 * union the world's own events go through — berxCoreCause — so there is
 * exactly one way the Core can be moved, and a hand has no more
 * privilege than a server answering. The alternative is a second path
 * that drifts from the first, and then a Core that behaves differently
 * depending on who asked, which is how a system stops feeling like one
 * thing.
 *
 * And the response is LOCAL. The field is drawn toward where the hand
 * was, coherence rises around that point, and reach contracts to it —
 * because attention is somewhere. A global flash on touch is the
 * "click -> animation" this is meant to replace: it says something
 * happened without saying where, which is exactly the information a
 * spatial interface has and a flat one does not.
 *
 * NOTHING HERE COMPLETES ANYTHING. A gesture that begins a write leaves
 * the Core in `acting`, and only a real answer from a real server can
 * move it to `success`. That is enforced in berxActionGraph and is the
 * reason a press does not get to look like a result.
 */
import type {BerxVec3} from '../world';
import type {BerxCoreField} from './berxCore';

/**
 * What a hand can do to a world that has depth.
 *
 * Deliberately not "tap" and "long press": those are names for how long
 * a finger was on glass. These are names for what someone was doing.
 */
export type BerxGestureKind =
	/** Moved toward something without committing. The spatial hover. */
	| 'reach'
	/** Settled on it. Attention, held. */
	| 'hold'
	/** Committed. The moment a plan starts. */
	| 'press'
	/** Let go without committing. */
	| 'release'
	/** Moved something, or moved through the space. */
	| 'draw';

export interface BerxSpatialGesture {
	kind: BerxGestureKind;
	/** Where in the world it happened. Not a screen coordinate. */
	at: BerxVec3;
	/** The entity it landed on, when it landed on one. */
	objectId?: string;
	/**
	 * How hard, 0..1, where the platform can tell — and 0.5 where it
	 * cannot, which is most of them. Never inferred from duration: a long
	 * press is a long press, not a hard one, and conflating them is how
	 * an interface starts guessing at intent it was not given.
	 */
	force: number;
	/** How long it has been going on. */
	durationS: number;
}

/**
 * How far a touch's influence reaches, in metres.
 *
 * Small. A hand affects the space around it, not the room: the whole
 * value of a local response is lost the moment it covers everything.
 */
export const BERX_TOUCH_RADIUS = 0.9;

/**
 * The field, disturbed where the hand is.
 *
 * The offset moves toward the touch and the reach contracts around it,
 * both scaled by how far away it happened — a gesture across the room
 * barely registers, one at arm's length is most of the field. That
 * falloff is the difference between a spatial response and a global one
 * wearing a position.
 *
 * Returned as a new TARGET-space nudge rather than an animation: the
 * caller hands it to the same integrator everything else uses, so a
 * touch decays exactly the way a state change does and there is no
 * second timeline to cancel when the next one arrives.
 */
export function berxTouchField(
	field: BerxCoreField,
	gesture: BerxSpatialGesture,
	/** Where the field currently sits, to measure the reach against. */
	origin: BerxVec3 = field.offset,
): BerxCoreField {
	const dx = gesture.at.x - origin.x;
	const dy = gesture.at.y - origin.y;
	const dz = gesture.at.z - origin.z;
	const d = Math.hypot(dx, dy, dz);
	/* 1 at the field's centre, 0 beyond the touch radius. Linear rather
	   than a curve: a curve here would be a choice with no reason behind
	   it, and this quantity is not one anybody will look at closely. */
	const near = Math.max(0, 1 - d / (BERX_TOUCH_RADIUS * 3));
	if (near <= 0) return field;

	const force = Math.max(0, Math.min(1, gesture.force));
	/* A press commits and a reach does not, so they pull by different
	   amounts. `draw` is continuous and must not accumulate into a shove. */
	const weight = gesture.kind === 'press' ? 1 : gesture.kind === 'hold' ? 0.7
		: gesture.kind === 'draw' ? 0.35 : 0.5;
	const pull = near * weight * (0.35 + 0.4 * force);

	return {
		...field,
		/* Attention gathers where the hand is. */
		coherence: Math.min(1, field.coherence + 0.18 * pull),
		/* And contracts around it: a touched field is a smaller field. */
		reach: field.reach * (1 - 0.3 * pull),
		/* Barely. A body that visibly recoils from a finger is a
		   character reacting; this is a space acknowledging. */
		deform: Math.min(0.22, field.deform + 0.06 * pull),
		offset: {
			x: field.offset.x + dx * 0.25 * pull,
			y: field.offset.y + dy * 0.25 * pull,
			z: field.offset.z + dz * 0.25 * pull,
		},
	};
}

/**
 * Where a gesture puts the Core, expressed as one of the world's own
 * causes.
 *
 * Returns a `BerxCoreCause` rather than a state, deliberately: the
 * gesture does not get to decide, it gets to say what happened and the
 * one function that maps causes to states decides. A hand is an event in
 * the world like any other.
 *
 * `press` returns undefined on purpose and it is the most important line
 * in the file. Committing is not a state — it is the START of a plan,
 * and what the Core does next is whatever that plan does. A press that
 * moved the Core by itself would be `click -> animation`: a system
 * showing a result before it has one.
 */
export function berxGestureCause(gesture: BerxSpatialGesture): {kind: 'presence'; near: boolean} | undefined {
	switch (gesture.kind) {
		case 'reach':
		case 'hold':
		case 'draw':
			return {kind: 'presence', near: true};
		case 'release':
			return {kind: 'presence', near: true};
		case 'press':
			return undefined;
		default:
			return undefined;
	}
}

/**
 * What a hand should feel, if the platform can do it.
 *
 * A gesture's own confirmation, separate from the Core's state changes:
 * this is the moment of contact, which happens whether or not anything
 * follows. `press` is the only one with weight, because it is the only
 * one that commits.
 */
export function berxTouchHaptic(gesture: BerxSpatialGesture): 'none' | 'contact' | 'commit' {
	if (gesture.kind === 'press') return 'commit';
	if (gesture.kind === 'hold' && gesture.durationS > 0.25) return 'contact';
	return 'none';
}
