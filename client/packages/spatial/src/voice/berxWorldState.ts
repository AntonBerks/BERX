/**
 * BERX SITUATION — what is true right now, in one object.
 *
 * NAMED `BerxSituation` RATHER THAN `BerxWorldState`, which the
 * directive calls it and which is already taken: runtime5d.ts uses that
 * name for a much narrower thing — which world the viewer is in and
 * where its camera sits. Prefixing this one to get around the clash
 * would have left two similar names meaning different things, which is
 * how a reader ends up importing the wrong one. A situation is the
 * better word anyway: where someone is, when, what is in front of them,
 * and what they just did.
 *
 * The voice layer and the runtime need the same answer to "where is this
 * person and what are they looking at", and the fastest way to build a
 * product that contradicts itself is to let them each work it out. So
 * this is the single reading, and everything downstream — intent
 * resolution, the action planner, what the voice says and what it
 * pointedly does not — takes it as its only source of context.
 *
 * IT INVENTS NOTHING. Every field is read from the world the app already
 * holds or is explicitly absent. A location the device has not given is
 * `undefined`, not a plausible city; a conversation nobody is in is
 * `undefined`, not an empty one. That distinction carries all the way to
 * the voice: "не знаю, где ты" is a true sentence and a guessed
 * neighbourhood is not.
 *
 * WHY "здесь" WORKS. A person looking at a place and asking "а что здесь
 * сегодня?" has already said which place — by looking at it. The word
 * `здесь` is a reference into this object, and resolving it is a lookup
 * rather than a guess. That is the whole reason a voice layer needs a
 * world state and not a chat history: the context is in the room, not in
 * the transcript.
 */
import type {BerxSpatialObject, BerxVec3} from '../world';
import type {BerxWorldRegion} from '../worldApp';
import type {BerxTemporalCursor} from '../temporal';

/**
 * Where the person physically is, when the device has said.
 *
 * Optional at every level, and that is deliberate: a device that has not
 * been given location permission has not got a rough guess to offer, it
 * has nothing. `nearbyNow` and `nearbyPlaces` both need real
 * coordinates, so an absent location is a real constraint on what can be
 * answered rather than something to paper over.
 */
export interface BerxPlaceInWorld {
	lat: number;
	lng: number;
	/** Metres, as the platform reported it. Large means "roughly". */
	accuracyM?: number;
	/** When it was taken. A fix from an hour ago is not where you are. */
	atMs: number;
}

/** One thing the person did, in the order they did it. */
export interface BerxRecentAction {
	/** What kind of thing happened: 'travel', 'focus', 'ask', 'act', 'dismiss'. */
	kind: string;
	/** The entity it was about, when it was about one. */
	objectId?: string;
	/** Free text for an ask: what was said. Never a summary of it. */
	detail?: string;
	atMs: number;
}

/**
 * How many recent actions are kept.
 *
 * Short on purpose. This is working memory for a conversation that is
 * happening now — "убери этот", "а второй?" — not a history of the
 * account. A longer window would tempt something downstream into
 * inferring habits from it, which is the line between context and
 * surveillance and is not a line to be near.
 */
export const BERX_RECENT_ACTIONS = 12;

export interface BerxSituation {
	/** The moment this reading was taken. */
	nowMs: number;
	/** Where in time the viewer stands, which is not the same as now. */
	cursor: BerxTemporalCursor;
	/** Where the person is, when the device has said. */
	location?: BerxPlaceInWorld;
	/** The region of the world they are in. The closest thing to a screen. */
	region: BerxWorldRegion;
	/**
	 * The entity the camera is with. What "здесь", "тут" and "это" mean.
	 * Undefined in a region-wide view, where those words mean nothing and
	 * the honest response is to ask which.
	 */
	focusId?: string;
	/** Everything currently drawn, nearest first. What "второй" counts. */
	visible: readonly BerxVisibleEntity[];
	/** The conversation the person is in, if they are in one. */
	conversationId?: string;
	/** The viewer's own entity. */
	viewerId?: string;
	/** What they just did, oldest first. */
	recent: readonly BerxRecentAction[];
	/**
	 * What the person has actually turned on.
	 *
	 * Not preferences inferred from behaviour — settings they set. The
	 * proactive rules read this and nothing else, which is what keeps
	 * "через час рядом начинается событие" on the right side of the line
	 * and "мне кажется, ты сегодня грустный" off it entirely.
	 */
	allowed: BerxWorldPermissions;
}

export interface BerxWorldPermissions {
	microphone: boolean;
	location: boolean;
	notifications: boolean;
	/** Whether the person has agreed to be shown to others as nearby. */
	presence: boolean;
}

export const BERX_NO_PERMISSIONS: BerxWorldPermissions = Object.freeze({
	microphone: false,
	location: false,
	notifications: false,
	presence: false,
});

/**
 * One entity as the voice layer needs to talk about it.
 *
 * A projection of BerxSpatialObject rather than the object itself: the
 * intent layer has no business with transforms and materials, and a
 * narrower type is a narrower set of things it can accidentally depend
 * on.
 */
export interface BerxVisibleEntity {
	id: string;
	kind: BerxSpatialObject['kind'];
	/** What it is called. Absent is absent — never "Untitled". */
	label?: string;
	/** How alive the world says it is, 0..1. */
	energy: number;
	/** Metres from the viewer. What "nearest" and "второй" order by. */
	distanceM: number;
}

/** Straight-line distance, the only ordering "второй" can honestly mean. */
function distance(a: BerxVec3, b: BerxVec3): number {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * What the world application knows, in the shape this layer needs.
 *
 * Takes the pieces rather than the app itself, so the state can be built
 * in a test, in a gate and in a runtime from the same function — and so
 * this module does not depend on the app, which depends on half the
 * core.
 */
export function berxSituation(input: {
	nowMs: number;
	cursor: BerxTemporalCursor;
	region: BerxWorldRegion;
	focusId?: string;
	viewerId?: string;
	conversationId?: string;
	objects: readonly BerxSpatialObject[];
	eye: BerxVec3;
	location?: BerxPlaceInWorld;
	recent?: readonly BerxRecentAction[];
	allowed?: BerxWorldPermissions;
}): BerxSituation {
	const visible: BerxVisibleEntity[] = input.objects
		.filter((o) => o.visible)
		.map((o) => ({
			id: o.id,
			kind: o.kind,
			label: o.label,
			energy: o.energy,
			distanceM: distance(input.eye, o.transform.position),
		}))
		.sort((a, b) => a.distanceM - b.distanceM);

	/* A location old enough to be somewhere else is not a location. Ten
	   minutes: long enough to survive a walk indoors and a lost fix,
	   short enough that "рядом" still means rядom. */
	const fresh = input.location && input.nowMs - input.location.atMs <= 10 * 60_000
		? input.location
		: undefined;

	return {
		nowMs: input.nowMs,
		cursor: {...input.cursor},
		location: fresh,
		region: input.region,
		focusId: input.focusId,
		visible,
		conversationId: input.conversationId,
		viewerId: input.viewerId,
		recent: (input.recent ?? []).slice(-BERX_RECENT_ACTIONS),
		allowed: input.allowed ?? BERX_NO_PERMISSIONS,
	};
}

/** The entity "здесь" / "это" / "тут" refers to, or nothing. */
export function berxHere(state: BerxSituation): BerxVisibleEntity | undefined {
	if (!state.focusId) return undefined;
	return state.visible.find((v) => v.id === state.focusId);
}

/**
 * The nth visible entity, one-based, as a person would count them.
 *
 * Ordered by distance, because that is the only ordering a person and
 * the runtime can both see. "Второй" means the second nearest thing in
 * front of you; it does not mean the second row of a list nobody is
 * looking at.
 */
export function berxNth(state: BerxSituation, n: number): BerxVisibleEntity | undefined {
	if (!Number.isInteger(n) || n < 1) return undefined;
	return state.visible[n - 1];
}

/**
 * Can this state answer a question that needs to know where you are?
 *
 * Both halves matter and they fail differently: permission refused is a
 * choice to respect and say so, a stale or missing fix is a condition to
 * wait out. The caller gets to tell the person which.
 */
export function berxCanAnswerNearby(state: BerxSituation): {ok: boolean; why?: 'permission' | 'no-fix'} {
	if (!state.allowed.location) return {ok: false, why: 'permission'};
	if (!state.location) return {ok: false, why: 'no-fix'};
	return {ok: true};
}
