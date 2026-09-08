/**
 * What you can do with the thing you are looking at, in the world.
 *
 * BERX has no buttons. An action is a small object standing beside the
 * entity it acts on — pickable by the same ray, occluded by the same
 * depth buffer, gone when nothing is focused. It is not a toolbar and
 * it is not a menu: it belongs to one entity, it appears where that
 * entity is, and it disappears with it.
 *
 * Affordances are not world entities. A person, a place and a moment
 * are things that exist; "attend" is something you can do to one, and
 * putting it in the world graph would make the graph lie about what
 * BERX contains. So the ring is computed per frame from the focused
 * object and the affordances the domain says it has.
 */
import type {BerxSpatialAffordance} from './socialActions';
import type {BerxSpatialCameraState} from './spatialCamera';
import {cameraBasis} from './spatialInteraction';
import type {BerxSpatialObject, BerxVec3} from './world';

export interface BerxActionSlot {
	affordance: BerxSpatialAffordance;
	/** Where it stands, in world space. */
	position: BerxVec3;
	/** Half-height of its quad, in world units. */
	halfHeight: number;
	/**
	 * The one the keyboard would activate.
	 *
	 * Carried on the slot so the focus ring is a thing in the WORLD —
	 * a larger, brighter quad standing where the action stands — rather
	 * than a browser outline drawn around a canvas that contains
	 * everything equally.
	 */
	focused: boolean;
}

/** How much larger the focused slot stands. Enough to read at a glance. */
export const BERX_SLOT_FOCUS_SCALE = 1.35;

/** How far out from the entity's own edge the ring sits. */
const RING_GAP = 0.55;
const SLOT_HEIGHT = 0.26;
/**
 * World units of width per character, at a slot's own height.
 *
 * Taken from the label rasteriser: one line of the world's font at
 * `pixelHeight` comes back a little over half as wide per character as
 * it is tall, plus its padding. Nothing here rasterises anything — this
 * is only enough to keep two names from occupying the same place.
 */
const WIDTH_PER_CHARACTER = 0.58;

/**
 * The ring, laid out beneath and around the focused entity.
 *
 * An arc rather than a full circle: actions behind an object cannot be
 * read, and a ring you have to orbit to use is a worse control than a
 * button. The arc opens toward the camera, spread by how many there
 * are, and it sits below the entity so it never covers its face or its
 * name.
 *
 * Returns nothing when there is nothing focused, and nothing for an
 * object with no affordances — an empty ring is not drawn.
 */
/**
 * How far the ring stands from the object it belongs to.
 *
 * A camera that frames only the object crops the ring off the bottom
 * of the screen — which is what focusing a person did: the actions
 * were placed correctly and half of them were off-frame. This is the
 * one number that has to be shared for the camera to know better, and
 * it is the same calculation the placement uses.
 */
export function berxActionRingRadius(
	object: BerxSpatialObject | undefined,
	affordances: readonly BerxSpatialAffordance[],
): number {
	if (!object || affordances.length === 0) return 0;
	const longest = affordances.reduce((n, a) => Math.max(n, a.label.trim().length), 1);
	const needed = longest * SLOT_HEIGHT * WIDTH_PER_CHARACTER;
	return Math.max(
		Math.max(object.transform.scale.x, object.transform.scale.y) * 0.5 + RING_GAP,
		(needed * affordances.length) / (Math.PI * 1.35),
	);
}

export function berxActionRing(
	object: BerxSpatialObject | undefined,
	camera: BerxSpatialCameraState,
	affordances: readonly BerxSpatialAffordance[],
): BerxActionSlot[] {
	if (!object || affordances.length === 0) return [];
	const basis = cameraBasis(camera);
	if (!basis) return [];
	const drop = object.transform.scale.y * 0.5 + SLOT_HEIGHT * 1.4;

	/**
	 * How wide the words actually are.
	 *
	 * The ring used to space its slots by a fixed angle, which put
	 * «Событие», «Пойду» and «Поделиться» on top of each other — the
	 * spacing knew how many actions there were and nothing about how
	 * long their names are. Nobody here can measure glyphs, but the
	 * label is right there, and its length is a good enough proxy: the
	 * arc is sized so the longest name fits in its own share of it.
	 *
	 * `WIDTH_PER_CHARACTER` is in world units at SLOT_HEIGHT, measured
	 * from the label rasteriser's own output rather than guessed — its
	 * glyphs average a little over half their height in width.
	 */
	const longest = affordances.reduce((n, a) => Math.max(n, a.label.trim().length), 1);
	const needed = longest * SLOT_HEIGHT * WIDTH_PER_CHARACTER;
	/* wide enough that the words do not touch, and never closer in than
	   the object's own edge */
	const radius = berxActionRingRadius(object, affordances);
	/* the arc widens with the count but never wraps past the sides */
	const perSlot = Math.min(0.9, needed / Math.max(radius * 1.35, 0.001));
	const spread = Math.min(Math.PI * 0.9, perSlot * Math.max(1, affordances.length - 1));
	const start = -spread / 2;
	const step = affordances.length > 1 ? spread / (affordances.length - 1) : 0;
	return affordances.map((affordance, index) => {
		const angle = start + step * index;
		const across = Math.sin(angle) * radius * 1.35;
		const under = Math.cos(angle) * radius * 0.35;
		return {
			affordance,
			position: {
				x: object.transform.position.x + basis.right.x * across - basis.up.x * (drop + under),
				y: object.transform.position.y + basis.right.y * across - basis.up.y * (drop + under),
				z: object.transform.position.z + basis.right.z * across - basis.up.z * (drop + under),
			},
			/* The focused slot stands larger, in world units — geometry, so
			   every renderer already honours it without a shader knowing
			   what focus is. */
			halfHeight: SLOT_HEIGHT * 0.5 * (affordance.state === 'focus' ? BERX_SLOT_FOCUS_SCALE : 1),
			focused: affordance.state === 'focus',
		};
	});
}

/**
 * Which action a point on the screen is over.
 *
 * The slots are camera-facing quads, so the test is done in the
 * camera's own plane: project the ray's direction against each slot's
 * offset from the eye. Nearest wins, as everywhere else.
 */
export function pickActionSlot(
	slots: readonly BerxActionSlot[],
	camera: BerxSpatialCameraState,
	rayDirection: BerxVec3,
	aspect: number,
): BerxActionSlot | undefined {
	const basis = cameraBasis(camera);
	if (!basis) return undefined;
	let best: BerxActionSlot | undefined;
	let bestDistance = Infinity;
	for (const slot of slots) {
		const d = {
			x: slot.position.x - camera.position.x,
			y: slot.position.y - camera.position.y,
			z: slot.position.z - camera.position.z,
		};
		const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
		if (along <= 0) continue;
		/* where the slot's centre lands on the ray, and where the ray is */
		const scale = along / Math.max(1e-4, rayDirection.x * basis.forward.x + rayDirection.y * basis.forward.y + rayDirection.z * basis.forward.z);
		const hit = {x: rayDirection.x * scale, y: rayDirection.y * scale, z: rayDirection.z * scale};
		const dx = (hit.x - d.x) * basis.right.x + (hit.y - d.y) * basis.right.y + (hit.z - d.z) * basis.right.z;
		const dy = (hit.x - d.x) * basis.up.x + (hit.y - d.y) * basis.up.y + (hit.z - d.z) * basis.up.z;
		/* the quad is as wide as its text is long; the caller sizes it,
		   and a generous width here is honest about a small target */
		if (Math.abs(dx) <= slot.halfHeight * 4 * aspect && Math.abs(dy) <= slot.halfHeight * 1.6 && along < bestDistance) {
			bestDistance = along;
			best = slot;
		}
	}
	return best;
}
