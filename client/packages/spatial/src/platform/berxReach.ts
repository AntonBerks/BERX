/**
 * WHERE A HAND CAN ACTUALLY GET TO.
 *
 * A safe area is usually treated as padding — a number you subtract from
 * a layout so text does not go under a notch. In a spatial interface it
 * is something else entirely: it is a CONSTRAINT ON WHERE THINGS MAY
 * EXIST, because the Core and the action ring are not laid out, they are
 * placed in a world, and a world does not know that the bottom of the
 * screen is a home indicator.
 *
 * And there is a second constraint nobody encodes and everybody feels. A
 * thumb has a reach. On a phone held in one hand the bottom third is
 * comfortable, the middle is a stretch, and the top far corner needs the
 * other hand. Putting the thing a person acts on in the top corner is
 * not a style choice, it is asking for a second hand — and a product for
 * real social life is used one-handed, walking, in a bar, with a drink
 * in the other hand.
 *
 * VOICE-FIRST, NEVER VOICE-ONLY. The last part of this file is the
 * structural version of that promise: every intent the voice layer can
 * produce has a non-voice path, and the gate enumerates them. A voice
 * interface with a capability only reachable by speaking is unusable in
 * a loud room, unusable by someone who cannot speak, and unusable when
 * the recogniser is having a bad day — which is to say unusable at the
 * exact moments a social product is most needed.
 */
import type {BerxVec3} from '../world';
import type {BerxVoiceIntentKind} from '../voice/berxIntent';

/**
 * What the platform says is covered, in CSS pixels.
 *
 * Straight from env(safe-area-inset-*) on the web and from the window
 * insets on the platforms. Never guessed from a device name: a table of
 * notch sizes is a table that is wrong the week after it ships.
 */
export interface BerxSafeInsets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export const BERX_NO_INSETS: BerxSafeInsets = Object.freeze({top: 0, right: 0, bottom: 0, left: 0});

/**
 * How far up the screen a thumb reaches comfortably, as a fraction.
 *
 * 0.55 — a little over half. Measured the way everyone measures this:
 * by holding a phone. Below it is comfortable, above it is a stretch,
 * and the top corner opposite the holding hand needs the other one.
 */
export const BERX_THUMB_REACH = 0.55;

/**
 * How wide, from the holding side.
 *
 * A thumb sweeps an arc, so the far top corner is worse than the far
 * bottom one. 0.8 across the bottom, and the arc narrows going up — see
 * berxWithinReach, where the two combine.
 */
export const BERX_THUMB_SPAN = 0.8;

export interface BerxViewportReach {
	width: number;
	height: number;
	insets: BerxSafeInsets;
	/** Which hand is holding it, when the platform can say. */
	hand?: 'left' | 'right';
	/** False on anything not held: a desktop thumb has no reach. */
	handheld: boolean;
}

/**
 * Is this point somewhere the platform will let us draw?
 *
 * The first and simplest constraint, and it applies everywhere: a Core
 * under the home indicator is a Core with a bar through it.
 */
export function berxWithinSafeArea(x: number, y: number, v: BerxViewportReach): boolean {
	return x >= v.insets.left && x <= v.width - v.insets.right
		&& y >= v.insets.top && y <= v.height - v.insets.bottom;
}

/**
 * Is this point somewhere a thumb can actually get to?
 *
 * Only meaningful on something held. On a desktop this is always true,
 * and saying so is better than pretending a mouse has ergonomics — a
 * pointer reaches everywhere at the same cost, which is exactly why
 * desktop layouts taught everyone habits that fail on a phone.
 *
 * The shape is an arc, not a rectangle: the reachable width narrows as
 * the point rises, because a thumb pivots at its base. A rectangle would
 * call the far top corner reachable, and it is the one place on a phone
 * that genuinely is not.
 */
export function berxWithinReach(x: number, y: number, v: BerxViewportReach): boolean {
	if (!v.handheld) return true;
	if (!berxWithinSafeArea(x, y, v)) return false;
	const usableTop = v.insets.top;
	const usableBottom = v.height - v.insets.bottom;
	const usableHeight = Math.max(1, usableBottom - usableTop);
	/* 0 at the bottom of the usable area, 1 at the top. */
	const up = (usableBottom - y) / usableHeight;
	if (up > BERX_THUMB_REACH) return false;
	/* The arc: full span at the bottom, narrowing to nothing at the top
	   of the reach. */
	const span = BERX_THUMB_SPAN * (1 - up / BERX_THUMB_REACH * 0.55);
	const from = v.hand === 'left' ? v.insets.left : v.width - v.insets.right;
	const across = Math.abs(x - from) / Math.max(1, v.width);
	return across <= span;
}

/**
 * Where the Core should sit, given what is covered and who is holding
 * it.
 *
 * Returns a WORLD offset, because the Core lives in the world rather
 * than on the screen — this shifts it, it does not lay it out. The
 * numbers are small: a Core that jumped across the room because a phone
 * has a notch would be a Core reacting to the wrong thing entirely.
 *
 * The rule is one sentence: keep it clear of what is covered, and keep
 * it low enough to reach. Low, because a Core that has to be stretched
 * for is a Core people stop using.
 */
export function berxCorePlacement(v: BerxViewportReach, rest: BerxVec3): BerxVec3 {
	if (!v.handheld) return {...rest};
	const usableHeight = Math.max(1, v.height - v.insets.top - v.insets.bottom);
	/* A tall inset at the bottom — a home indicator, a keyboard — pushes
	   the Core UP in screen terms, which is DOWN in world y... no: the
	   Core sits in front of the viewer, so a covered bottom means it
	   should rise out of the covered strip. */
	const rise = (v.insets.bottom / usableHeight) * 0.4;
	/* And a covered top means there is less room above, so it comes down
	   a little rather than crowding the notch. */
	const drop = (v.insets.top / usableHeight) * 0.25;
	return {
		x: rest.x,
		y: rest.y + rise - drop,
		z: rest.z,
	};
}

/**
 * How a person does this WITHOUT SPEAKING.
 *
 * Every intent the voice layer can produce, and the thing a hand does
 * instead. Not a fallback bolted on: these are the primary interactions
 * for anybody in a loud room, anybody who does not want to talk to their
 * phone in public, and anybody the recogniser is failing today.
 *
 * The gate enumerates BerxVoiceIntentKind against this and fails on any
 * gap, so a capability cannot be added to the voice layer without a way
 * to reach it by hand.
 */
export const BERX_WITHOUT_VOICE: Readonly<Record<BerxVoiceIntentKind, string>> = Object.freeze({
	'now-nearby': 'the NOW region, which is a place in the world and reachable by travelling to it',
	'find-places': 'the place region, entered the same way',
	'find-events': 'the event region',
	'find-people': 'the person region',
	discover: 'the discover region',
	open: 'press the entity — the same gesture, at the same thing',
	dismiss: 'draw it away, or press its dismiss affordance in the action ring',
	refine: 'the affordances on what is already shown; refining is choosing again',
	back: 'the back gesture, which every platform already has',
	unknown: 'nothing to reach: no intent was formed, so there is nothing a hand would do instead',
});

/** Does every intent have a way through that does not need speaking? */
export function berxVoiceOptional(kinds: readonly BerxVoiceIntentKind[]): {ok: boolean; missing: string[]} {
	const missing = kinds.filter((k) => !BERX_WITHOUT_VOICE[k]);
	return {ok: missing.length === 0, missing};
}
