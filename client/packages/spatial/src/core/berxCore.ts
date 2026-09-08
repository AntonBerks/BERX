/**
 * BERX CORE — the world's own state, made physical.
 *
 * Not a character, not an avatar, and specifically not an orb that
 * pulses while a machine thinks. The Core is what BERX looks like when
 * it is doing something, and the difference between that and an
 * assistant mascot is not stylistic — it is structural, and it is this
 * file's whole design.
 *
 * NO PRESETS, AND THAT IS THE POINT. The obvious way to build this is a
 * table of looks and a crossfade between them, and it is wrong for a
 * reason that survives any amount of polish: a crossfade between two
 * poses is an ANIMATION, and an animation is something that happens TO
 * an object. What makes something read as present rather than
 * decorative is that its motion is a consequence — the field is where it
 * is because of where it was and what is pulling it.
 *
 * So a state does not set an appearance. It sets TARGETS for physical
 * quantities, and the quantities are integrated toward them by a
 * critically-damped spring. Continuity is then a property of the
 * integrator rather than something a designer has to remember at every
 * one of the fifty-five transitions between eleven states. There is no
 * expression in this file for a discontinuous change, which is a
 * stronger guarantee than a convention.
 *
 * NOTHING MOVES WITHOUT A CAUSE. The field is a pure function of its
 * previous value, the target, and the elapsed time. There is no clock
 * term, no noise, no idle animation — so a Core at rest with nothing
 * happening converges and STOPS. That is the structural answer to
 * "никакого AI-theater": a breathing idle glow is not restraint applied
 * to a pulse, it is a pulse that was never written. The gate holds the
 * state still and asserts the field stops moving.
 *
 * THE QUANTITIES ARE REAL. Every one of them is consumed by something
 * that already exists in this runtime — the key light's intensity, the
 * volumetric march's density, a particle field's count and origin, the
 * spatial audio listener, the haptic engine. The Core is not drawn
 * beside the world; it is a set of parameters the world is rendered
 * with. Which is why "Core должен понимать изменение World State" is not
 * a feature to add later: it is the only way this is wired at all.
 */
import type {BerxVec3} from '../world';

/**
 * The eleven states, in the order a request moves through them.
 *
 * Ordered deliberately: the sequence IDLE → AWARE → LISTENING →
 * UNDERSTANDING → SEARCHING → DISCOVERING → ACTING → SPEAKING → SUCCESS
 * is one arc, and reading it top to bottom is reading what happens when
 * somebody talks to BERX. ERROR and RECOVERING are not a branch off the
 * end — they are where the arc goes when a step does not finish, and
 * RECOVERING leads back into it rather than to the start.
 */
export type BerxCoreState =
	/** Nothing is happening. The world is quiet and so is this. */
	| 'idle'
	/** Something could happen: a person moved, a hand came up, a hotword. */
	| 'aware'
	/** Someone is speaking. The field is shaped by what it hears. */
	| 'listening'
	/** The sound has stopped and is becoming meaning. */
	| 'understanding'
	/** The world is being asked. */
	| 'searching'
	/** It answered, and the answer is arriving. */
	| 'discovering'
	/** Something is being changed, and the server has not confirmed yet. */
	| 'acting'
	/** BERX is saying something. */
	| 'speaking'
	/** It finished. The tension resolves rather than a tick appearing. */
	| 'success'
	/** It did not. Presence is kept; a path is being looked for. */
	| 'error'
	/** Finding that path, with everything that was known still known. */
	| 'recovering';

export const BERX_CORE_STATES: readonly BerxCoreState[] = [
	'idle', 'aware', 'listening', 'understanding', 'searching',
	'discovering', 'acting', 'speaking', 'success', 'error', 'recovering',
] as const;

/**
 * The physical state of the Core, and of the world around it.
 *
 * Every field is a quantity something downstream really consumes. None
 * of them is "the animation frame" or "the current pose", because there
 * is no pose.
 */
export interface BerxCoreField {
	/**
	 * How much is happening, 0..1.
	 *
	 * Drives the key light's intensity and the energy particle field. It
	 * is NOT loudness and NOT importance: a long silent search has high
	 * energy, and a short confirmation has little.
	 */
	energy: number;
	/**
	 * How organised the field is, 0..1.
	 *
	 * The quantity that carries most of the meaning, and the one that
	 * separates the states a viewer would otherwise confuse. High
	 * coherence is attention — the field is one thing, held together,
	 * pointed. Low coherence is search — it is spread across the room,
	 * looking in several places. It falls in ERROR because a plan came
	 * apart, and it is the FIRST thing that comes back in RECOVERING,
	 * before anything brightens: gathering yourself precedes acting.
	 */
	coherence: number;
	/**
	 * How far the field extends into the room, in metres.
	 *
	 * IDLE draws in to almost nothing. AWARE reaches out — that is what
	 * being noticed feels like from the inside. SEARCHING reaches
	 * furthest, because the search is happening in the space rather than
	 * inside a spinner.
	 */
	reach: number;
	/** Light this puts into the world, 0..1, scaling the key. */
	luminance: number;
	/** Drive for the particle fields, 0..1: how much matter is in the air. */
	grain: number;
	/** Drive for the volumetric march, 0..1: how much the air holds. */
	haze: number;
	/**
	 * How far the body departs from a sphere, 0..1.
	 *
	 * Small numbers throughout. A Core that visibly writhes is a
	 * character; a Core that is almost, but not quite, still is present.
	 * The largest value in the table is 0.34 and it belongs to ERROR.
	 */
	deform: number;
	/**
	 * Where the field's centre sits relative to the viewer, in metres.
	 *
	 * Part of the state, not a layout constant: LISTENING comes slightly
	 * closer, SEARCHING moves out into the world it is searching, and
	 * SUCCESS settles back. Spatial position is one of the eight things
	 * the directive lists and it is the one most often left out.
	 */
	offset: BerxVec3;
}

/** Every quantity at rest. The world before anything has happened. */
export const BERX_CORE_REST: BerxCoreField = Object.freeze({
	energy: 0.06,
	coherence: 0.55,
	reach: 0.6,
	luminance: 0.12,
	grain: 0.1,
	haze: 0.2,
	deform: 0.02,
	offset: Object.freeze({x: 0, y: 0.2, z: -1.4}) as BerxVec3,
});

/**
 * What each state pulls the field toward.
 *
 * A target, never an appearance: the field may never reach any of these,
 * and usually does not, because the next state arrives first. That is
 * not a defect to tune out — it is why a fast exchange feels different
 * from a slow one without anything being written twice.
 */
const TARGETS: Readonly<Record<BerxCoreState, BerxCoreField>> = Object.freeze({
	idle: BERX_CORE_REST,
	/* Reaching out. Barely brighter, noticeably wider — being noticed is
	   a change in attention, not in volume. */
	aware: {energy: 0.16, coherence: 0.62, reach: 1.3, luminance: 0.2, grain: 0.16, haze: 0.26, deform: 0.05, offset: {x: 0, y: 0.22, z: -1.3}},
	/* Held together and close. The most coherent the field ever is:
	   listening is the one state that is entirely about one thing. */
	listening: {energy: 0.34, coherence: 0.93, reach: 1.0, luminance: 0.3, grain: 0.2, haze: 0.3, deform: 0.08, offset: {x: 0, y: 0.2, z: -1.15}},
	/* Sound becoming structure: energy rises while reach collapses
	   inward. Not a spinner — a signal being folded into something
	   smaller and denser than it arrived as. */
	understanding: {energy: 0.52, coherence: 0.86, reach: 0.7, luminance: 0.36, grain: 0.3, haze: 0.34, deform: 0.12, offset: {x: 0, y: 0.2, z: -1.2}},
	/* The space searches, not the Core. Coherence drops hard and reach
	   goes further than anywhere else: the field is in several places
	   because it is looking in several places. */
	searching: {energy: 0.68, coherence: 0.34, reach: 3.4, luminance: 0.42, grain: 0.52, haze: 0.5, deform: 0.16, offset: {x: 0, y: 0.3, z: -2.1}},
	/* Answers arriving and organising: reach stays wide while coherence
	   climbs back through it. The world composing itself. */
	discovering: {energy: 0.78, coherence: 0.66, reach: 2.8, luminance: 0.54, grain: 0.6, haze: 0.44, deform: 0.13, offset: {x: 0, y: 0.28, z: -1.9}},
	/* Committed and waiting on a server. Bright, tight, and NOT yet
	   resolved — this is the state that must not look like success,
	   because the server has not answered. */
	acting: {energy: 0.86, coherence: 0.9, reach: 1.4, luminance: 0.6, grain: 0.42, haze: 0.36, deform: 0.1, offset: {x: 0, y: 0.24, z: -1.35}},
	/* Speaking: energy in the field, coherence high, and the only state
	   whose deformation is driven from outside — see berxCoreSpeak. */
	speaking: {energy: 0.6, coherence: 0.88, reach: 1.2, luminance: 0.46, grain: 0.28, haze: 0.32, deform: 0.14, offset: {x: 0, y: 0.2, z: -1.2}},
	/* RESOLUTION, not celebration. Coherence at its highest, energy
	   FALLING, reach settling wide and calm: the tension goes out of the
	   space and what was found stays in it. No flash, because a flash is
	   an event and this is the end of one. */
	success: {energy: 0.3, coherence: 0.97, reach: 1.8, luminance: 0.34, grain: 0.22, haze: 0.24, deform: 0.03, offset: {x: 0, y: 0.22, z: -1.5}},
	/* Presence kept. Energy stays UP — something is still happening —
	   while coherence falls and deformation peaks: a plan came apart, and
	   the field shows that rather than turning red. Nothing here is a
	   colour change. */
	error: {energy: 0.5, coherence: 0.22, reach: 1.6, luminance: 0.28, grain: 0.3, haze: 0.42, deform: 0.34, offset: {x: 0, y: 0.18, z: -1.45}},
	/* Gathering. Coherence climbs first and hardest; brightness comes
	   back last. Looking for another way rather than starting again. */
	recovering: {energy: 0.44, coherence: 0.72, reach: 1.5, luminance: 0.3, grain: 0.26, haze: 0.34, deform: 0.1, offset: {x: 0, y: 0.2, z: -1.35}},
});

export function berxCoreTarget(state: BerxCoreState): BerxCoreField {
	return TARGETS[state];
}

/**
 * How fast the field follows, per transition.
 *
 * "Важнее самих состояний — переходы между ними", and this is where that
 * lives: the same two targets reached at different rates are different
 * experiences. A stiffness is a time constant in disguise — roughly, the
 * field covers most of the distance in 1/stiffness seconds.
 */
const DEFAULT_STIFFNESS = 4.2;

const TRANSITION_STIFFNESS: Readonly<Record<string, number>> = Object.freeze({
	/* Instant attention. Being noticed cannot lag, or it reads as the
	   system catching up rather than as it having been there. */
	'idle>aware': 9.0,
	'aware>listening': 8.0,
	/* The one deliberate hesitation in the whole machine, and it is
	   honest: understanding takes a moment, and pretending it does not
	   would be the fake-instant that makes people distrust the result. */
	'listening>understanding': 3.0,
	'understanding>searching': 6.5,
	/* Answers arrive at the speed the network gives them; the field
	   should not race ahead of them. */
	'searching>discovering': 3.6,
	'discovering>acting': 7.0,
	'acting>success': 2.6,
	/* Resolution is slow on purpose. A fast success is a notification. */
	'speaking>success': 2.4,
	/* Failure is NOT abrupt. A sharp drop would read as a crash; this is
	   a plan coming apart, which takes a moment to become apparent. */
	'acting>error': 2.2,
	'searching>error': 2.2,
	/* And recovery is slower still — the deliberate, unhurried gathering
	   that says the system is looking for another way rather than
	   flailing. */
	'error>recovering': 1.8,
	'recovering>searching': 5.0,
	'recovering>listening': 5.0,
});

export function berxCoreStiffness(from: BerxCoreState, to: BerxCoreState): number {
	return TRANSITION_STIFFNESS[`${from}>${to}`] ?? DEFAULT_STIFFNESS;
}

/** One quantity, moved toward its target. Exponential, so never overshoots. */
function follow(current: number, target: number, stiffness: number, dt: number): number {
	/* 1 - e^(-k t) rather than a linear step: the result is independent
	   of the frame rate, which matters because this runs at whatever
	   speed the device manages and a 30fps device must not reach its
	   targets at half the speed of a 60fps one. */
	const a = 1 - Math.exp(-stiffness * Math.max(0, dt));
	return current + (target - current) * a;
}

export interface BerxCoreMotion {
	state: BerxCoreState;
	/** Where it is coming from, which sets the rate. */
	previous: BerxCoreState;
	field: BerxCoreField;
}

export function berxCoreAt(state: BerxCoreState = 'idle'): BerxCoreMotion {
	return {state, previous: state, field: {...BERX_CORE_REST, offset: {...BERX_CORE_REST.offset}}};
}

/**
 * Advance the Core by dt seconds.
 *
 * The whole machine, and it is one function because there is nothing
 * else: no timeline, no keyframes, no "currently playing" clip to
 * cancel. A state change is a change of target, and the field carries on
 * from exactly where it was — which is what makes every one of the
 * fifty-five transitions continuous without any of them being written.
 */
export function berxCoreStep(motion: BerxCoreMotion, dt: number): BerxCoreMotion {
	const target = TARGETS[motion.state];
	const k = berxCoreStiffness(motion.previous, motion.state);
	const f = motion.field;
	return {
		...motion,
		field: {
			energy: follow(f.energy, target.energy, k, dt),
			coherence: follow(f.coherence, target.coherence, k, dt),
			reach: follow(f.reach, target.reach, k, dt),
			luminance: follow(f.luminance, target.luminance, k, dt),
			grain: follow(f.grain, target.grain, k, dt),
			haze: follow(f.haze, target.haze, k, dt),
			deform: follow(f.deform, target.deform, k, dt),
			offset: {
				x: follow(f.offset.x, target.offset.x, k, dt),
				y: follow(f.offset.y, target.offset.y, k, dt),
				z: follow(f.offset.z, target.offset.z, k, dt),
			},
		},
	};
}

/**
 * Move to a new state without touching the field.
 *
 * The field is deliberately untouched: that is what continuity IS. A
 * transition changes where the Core is going, never where it is.
 */
export function berxCoreEnter(motion: BerxCoreMotion, state: BerxCoreState): BerxCoreMotion {
	if (state === motion.state) return motion;
	return {state, previous: motion.state, field: motion.field};
}

/**
 * What a voice does to the field while it is being listened to.
 *
 * NOT volume driving scale, which is the thing every audio visualiser
 * has done since the nineties and which reads as a meter rather than as
 * attention. Different parts of the spectrum mean different things about
 * a room, so they move different quantities:
 *
 *   LOW    the body of a voice, and how close it is. Drives REACH — a
 *          near voice pulls the field in around it.
 *   MID    where speech actually lives. Drives COHERENCE: articulated
 *          sound gathers the field, noise does not.
 *   HIGH   consonants, sibilance, the edges of words. Drives GRAIN —
 *          the air responds to detail, finely, without the body moving.
 *
 * The consequence is the part worth having: two sounds of identical
 * loudness look different, because they ARE different. A voice gathers
 * the field; a door slamming at the same volume scatters it.
 *
 * Bands are 0..1 energies, normalised by the caller from whatever
 * analyser the platform has. This function does no smoothing — the
 * spring above already does it, and smoothing twice is lag.
 */
export function berxCoreListen(
	field: BerxCoreField,
	bands: {low: number; mid: number; high: number},
): BerxCoreField {
	const low = Math.max(0, Math.min(1, bands.low));
	const mid = Math.max(0, Math.min(1, bands.mid));
	const high = Math.max(0, Math.min(1, bands.high));
	return {
		...field,
		/* A near, full voice draws the field in; a distant thin one does
		   not. Bounded so no sound can collapse it entirely. */
		reach: field.reach * (1 - 0.35 * low),
		/* Articulation gathers. This is the term that makes a voice look
		   different from a noise of the same loudness. */
		coherence: Math.min(1, field.coherence + 0.12 * mid - 0.06 * (low - mid > 0 ? low - mid : 0)),
		grain: Math.min(1, field.grain + 0.3 * high),
		/* The body barely moves. Deformation follows the ENVELOPE, and
		   only a little: a Core that visibly flexes with every syllable is
		   a mouth, and this is not a face. */
		deform: Math.min(0.2, field.deform + 0.05 * mid),
		offset: {...field.offset},
	};
}

/**
 * What BERX's own voice does to the field while it speaks.
 *
 * The mirror of listening and deliberately weaker: the Core is the
 * source now, so the field carries the line rather than reacting to it.
 * One term, on deformation, following the envelope — enough that the
 * light in the room moves with the words, not enough to read as a mouth.
 */
export function berxCoreSpeak(field: BerxCoreField, envelope: number): BerxCoreField {
	const e = Math.max(0, Math.min(1, envelope));
	return {
		...field,
		deform: Math.min(0.24, field.deform + 0.1 * e),
		luminance: Math.min(1, field.luminance + 0.08 * e),
		offset: {...field.offset},
	};
}
