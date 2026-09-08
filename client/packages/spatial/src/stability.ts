/**
 * BERX TEMPORAL STABILITY — decisions that do not flicker.
 *
 * A renderer makes several yes/no decisions per frame from continuous
 * quantities: is this object near enough for full geometry, does it fit
 * in the budget, can this device afford the expensive tier. Every one of
 * them was a bare threshold, and a bare threshold applied to a quantity
 * that WOBBLES is a decision that flips every frame.
 *
 * That is what flicker is. Not a rendering artefact — a decision
 * boundary. An object standing at exactly eighteen metres while the
 * camera breathes swaps its geometry sixty times a second; an object at
 * rank N of an N-object budget appears and vanishes; a device measured at
 * 49 then 51 frames a second changes its entire render quality twice a
 * second. None of those is visible in a still frame, and all of them are
 * unmissable in motion.
 *
 * THE FIX IS ALWAYS THE SAME SHAPE and it is worth saying once: a state
 * that has been entered is harder to leave than it was to enter. Not a
 * smoothing filter, which would add lag to every decision including the
 * ones that should be instant, and not a longer average, which only
 * moves the frequency the flicker happens at. A BAND: cross the
 * threshold to change, then travel back across a wider one to change
 * back.
 *
 * DETERMINISM SURVIVES IT. Everything here is a pure function of the
 * previous state and the current value, so the same sequence of frames
 * produces the same sequence of decisions on every backend and in every
 * run — which is what lets a gate drive a camera along a path and
 * predict what should have happened.
 */

/**
 * How far past the LOD distance an object must travel before its
 * geometry changes back, in metres.
 *
 * Two metres on an eighteen-metre threshold. Small enough that nobody
 * can see the LOD changing at the wrong distance, large enough that no
 * plausible camera wobble spans it: a hand-held drift is centimetres,
 * and an object crossing two metres is genuinely going somewhere.
 */
export const BERX_LOD_HYSTERESIS = 2;

/**
 * The geometry an object should use, given what it used last frame.
 *
 * `previous` undefined means it was not drawn last frame and there is
 * nothing to be sticky about: a bare threshold is exactly right for
 * something appearing for the first time.
 */
export function berxStableLod(distance: number, threshold: number, previous?: 0 | 1): 0 | 1 {
	if (previous === undefined) return distance > threshold ? 1 : 0;
	/* Reduced already: stay reduced until it comes well inside. */
	if (previous === 1) return distance > threshold - BERX_LOD_HYSTERESIS ? 1 : 0;
	/* Full already: stay full until it goes well outside. */
	return distance > threshold + BERX_LOD_HYSTERESIS ? 1 : 0;
}

/**
 * How much nearer an object already being drawn is treated as being,
 * when the budget sorts by distance.
 *
 * The budget keeps the nearest N. Two objects a hair apart at rank N and
 * N+1 swap places on the smallest camera movement, and one of them
 * vanishes while the other appears — every frame. This makes the
 * incumbent slightly harder to displace, which is the same band as
 * above expressed in the units the sort actually uses.
 *
 * A metre and a half: less than the LOD band, because being dropped from
 * the frame is a bigger event than losing a few triangles and should
 * take a little less provocation to undo.
 */
export const BERX_BUDGET_HYSTERESIS = 1.5;

/**
 * The distance the budget's sort should use for one object.
 *
 * Not the distance the object IS at — the distance it competes at. An
 * object already on screen competes as though it were slightly nearer,
 * so a tie does not flip on noise.
 */
export function berxBudgetDistance(distance: number, wasDrawn: boolean): number {
	return wasDrawn ? distance - BERX_BUDGET_HYSTERESIS : distance;
}

/**
 * How many consecutive frames must agree before the render tier moves.
 *
 * A tier change is the most visible decision in the runtime — the march
 * halves its resolution, the shadow map quarters, a third of the motes
 * leave — so it is also the one that must never happen on a single noisy
 * sample. Twelve frames is a fifth of a second: fast enough that a
 * device genuinely struggling is helped almost immediately, slow enough
 * that one long frame during a texture upload cannot trigger it.
 */
export const BERX_TIER_SETTLE_FRAMES = 12;

export interface BerxTierSettling<T extends string> {
	/** The tier in force. Changes only when the run below completes. */
	tier: T;
	/** What the evidence has been proposing, and for how many frames. */
	proposed: T;
	frames: number;
}

/** The starting point: in force, with nothing proposed against it. */
export function berxTierSettled<T extends string>(tier: T): BerxTierSettling<T> {
	return {tier, proposed: tier, frames: 0};
}

/**
 * One frame's evidence, folded into the settling state.
 *
 * Pure, so a gate can drive a whole sequence of proposals through it and
 * check the result — which is how "a flapping measurement never changes
 * the tier" becomes a thing that is proved rather than asserted.
 *
 * The run RESETS on disagreement rather than decaying. A device
 * alternating between two tiers is not a device that has quietly become
 * the second one; it is a device on the boundary, and the right answer
 * on a boundary is to stay where you are.
 */
export function berxSettleTier<T extends string>(
	state: BerxTierSettling<T>,
	evidence: T,
): BerxTierSettling<T> {
	if (evidence === state.tier) return {tier: state.tier, proposed: state.tier, frames: 0};
	if (evidence !== state.proposed) return {tier: state.tier, proposed: evidence, frames: 1};
	const frames = state.frames + 1;
	if (frames >= BERX_TIER_SETTLE_FRAMES) return {tier: evidence, proposed: evidence, frames: 0};
	return {tier: state.tier, proposed: evidence, frames};
}

/**
 * What one frame hands the next.
 *
 * Deliberately small and deliberately NOT the frame: a renderer that
 * remembered its last frame's pixels would be a renderer with a history,
 * and this world is a function of its state. What is carried is only the
 * few decisions that would otherwise be made twice from scratch and come
 * out differently — which object had which geometry, and which ones were
 * on screen at all.
 */
export interface BerxFrameMemory {
	/** Object id to the geometry it was drawn with. */
	lod: Record<string, 0 | 1>;
	/** Object ids that made it past the budget. */
	drawn: string[];
}

export const BERX_NO_MEMORY: BerxFrameMemory = Object.freeze({lod: {}, drawn: []});

/** The memory a frame leaves behind, from what it drew. */
export function berxRememberFrame(items: readonly {id: string; lod: 0 | 1}[]): BerxFrameMemory {
	const lod: Record<string, 0 | 1> = {};
	for (const i of items) lod[i.id] = i.lod;
	return {lod, drawn: items.map((i) => i.id)};
}
