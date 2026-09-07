/**
 * What the world does while the voice speaks.
 *
 * The assistant emits moments; this turns them into world state. Two
 * separate files on purpose: the assistant knows about a conversation
 * and nothing about space, and this knows about space and nothing about
 * what is being said. A voice that reached into the renderer would be a
 * voice that only existed on one platform.
 *
 * Everything below writes ENERGY and POSITION on real entities — the
 * same fields a live event writes — so the flare travels through the
 * ordinary draw list to WebGL2, WebGPU and the native backend. There is
 * no voice-specific rendering path anywhere, and there is no DOM.
 *
 * ON BERX ENERGY. The palette reserves #4FD6E8 for what is live NOW,
 * and energy is raised only by something really happening. A line being
 * spoken about a choice, at the moment it is spoken, is exactly that:
 * it is the most present thing in the room, and it returns to nothing
 * the instant the line ends. What would break the rule is leaving it
 * lit afterwards, which is why `speaking: false` zeroes it rather than
 * fading it over a second.
 */
import {berxSpatialId} from './berxVoiceIds';
import type {BerxVoiceMoment} from './BerxVoiceAssistant';
import {BERX_INTENT_OBJECT, type BerxIntent} from './berxPhrases';
import type {BerxSpatialObject, BerxSpatialRelation, BerxVec3} from '../world';

/** The four choices, as real entities in the world. */
export interface BerxRegistrationScene {
	objects: BerxSpatialObject[];
	relations: BerxSpatialRelation[];
	/** The one the viewer is: the silhouette they arrive as. */
	viewerId: string;
}

/** The silhouette a person arrives as, before they are anyone. */
export const BERX_ARRIVAL_ID = 'person:arrival';

const INTENTS: readonly BerxIntent[] = ['love', 'friendship', 'creation', 'search'];

/** A letter already said. Present, not shouting. */
export const BERX_LETTER_SETTLED = 0.42;
/** The letter being said right now. The brightest thing in the name. */
export const BERX_LETTER_SAID = 0.75;

/**
 * The registration world.
 *
 * A silhouette, and four things around it. The RING composition places
 * them (see composition.ts) — this only says what they are, which is
 * the division that lets the same four choices be arranged differently
 * on a watch without any of this changing.
 *
 * They are ordinary spatial objects, so everything the world already
 * does applies to them for free: they are lit by the same key light,
 * they cast the same shadows, they are picked by the same ray, they
 * carry the same action ring.
 */
export function berxRegistrationScene(now: number = Date.now()): BerxRegistrationScene {
	const objects: BerxSpatialObject[] = [
		{
			id: BERX_ARRIVAL_ID,
			kind: 'person',
			label: undefined,
			transform: {position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
			material: {material: 'skin', emissive: 0, metalness: 0.05, roughness: 0.62, opacity: 1, transmission: 0},
			visible: true,
			interactive: false,
			focusable: false,
			/* not lit: a person who has not chosen anything yet is not
			   "happening", and lighting them would spend the accent on the
			   most common object in the frame */
			energy: 0,
			depth: 0,
			createdAt: now,
			updatedAt: now,
		},
		...INTENTS.map((intent) => ({
			id: BERX_INTENT_OBJECT[intent],
			kind: 'create' as const,
			label: undefined,
			transform: {position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 0.85, y: 0.85, z: 0.85}},
			material: {material: 'glass' as const, emissive: 0, metalness: 0.1, roughness: 0.28, opacity: 0.92, transmission: 0.35},
			visible: true,
			interactive: true,
			focusable: true,
			energy: 0,
			depth: 1,
			createdAt: now,
			updatedAt: now,
		})),
	];

	/* Every choice belongs to the person considering it. That is what
	   makes the ring a ring around THEM rather than four things that
	   happen to be nearby — the composition reads these relations. */
	const relations: BerxSpatialRelation[] = INTENTS.map((intent) => ({
		id: `arrival→${intent}`,
		from: BERX_ARRIVAL_ID,
		to: BERX_INTENT_OBJECT[intent],
		type: 'related' as const,
		strength: 1,
	}));

	return {objects, relations, viewerId: BERX_ARRIVAL_ID};
}

/**
 * Apply one moment to the world.
 *
 * Returns the objects that changed, so a caller ingests only those. The
 * world is not rebuilt for a syllable.
 *
 * SCOPE, and it was a real bug before it was a comment. A moment owns
 * exactly two entities: the one it is about, and the one the previous
 * moment was about. It does NOT own the energy of everything else in
 * the room — an earlier version zeroed every object that was lit, which
 * meant the welcome line ("Добро пожаловать домой, Анна"), being about
 * no sphere in particular, put out the name it had just finished
 * writing in light. Anything else glowing is somebody else's state:
 * a live event, a person speaking, a place that is busy right now.
 */
export function berxApplyVoiceMoment(
	moment: BerxVoiceMoment,
	objects: readonly BerxSpatialObject[],
	now: number = Date.now(),
	previouslyLit?: string,
): BerxSpatialObject[] {
	const changed: BerxSpatialObject[] = [];
	for (const object of objects) {
		let wanted: number;
		if (moment.objectId === object.id) wanted = moment.speaking ? moment.energy : 0;
		else if (previouslyLit === object.id) wanted = 0;
		else continue;
		if (Math.abs(object.energy - wanted) < 1e-6) continue;
		/* updatedAt moves because this really is a state change on the
		   entity — the temporal projection must see it as recent, the same
		   as it would for a like arriving from the server */
		changed.push({...object, energy: wanted, updatedAt: now});
	}
	return changed;
}

/**
 * The name, written in the world in light.
 *
 * One entity per letter, standing in a line at the viewer's own height,
 * each lit in turn as the voice says the name back. Real spatial
 * objects rather than a text overlay, which is what lets the name be
 * walked around, be occluded by what is in front of it, and exist at
 * all in a headset.
 *
 * `progress` is 0..1 across the whole name: at 0.5, half the letters
 * are lit. Deterministic — the same name and the same progress give the
 * same world, which is what lets a gate predict it.
 */
export function berxNameInLight(
	name: string,
	progress: number,
	origin: BerxVec3 = {x: 0, y: 0.2, z: -1.2},
	now: number = Date.now(),
): BerxSpatialObject[] {
	const letters = [...name.trim()];
	if (letters.length === 0) return [];
	/* one letter every 0.42m: close enough to read as a word, far enough
	   that two letters never intersect at this scale */
	const spacing = 0.42;
	const width = (letters.length - 1) * spacing;
	const lit = Math.max(0, Math.min(1, progress)) * letters.length;
	return letters.map((letter, i) => ({
		id: berxSpatialId('letter', `${i}`),
		kind: 'moment' as const,
		label: letter,
		transform: {
			position: {x: origin.x - width / 2 + i * spacing, y: origin.y, z: origin.z},
			rotation: {x: 0, y: 0, z: 0},
			scale: {x: 0.3, y: 0.36, z: 0.06},
		},
		material: {material: 'glass' as const, emissive: 0.08, metalness: 0.05, roughness: 0.2, opacity: 0.95, transmission: 0.2},
		visible: true,
		interactive: false,
		focusable: false,
		/* A letter lights the instant the voice reaches it and then settles;
		   the one being said now is brighter than the ones already said,
		   which is what makes this read as a name being spoken rather than
		   as a word appearing. Written this way round on purpose: the
		   obvious `lit - i` ramp makes the letter currently being said the
		   DIMMEST thing in the name, which is backwards. */
		energy: lit >= i + 1 ? BERX_LETTER_SETTLED : lit > i ? BERX_LETTER_SETTLED + (BERX_LETTER_SAID - BERX_LETTER_SETTLED) * (lit - i) : 0,
		depth: 1,
		createdAt: now,
		updatedAt: now,
	}));
}
