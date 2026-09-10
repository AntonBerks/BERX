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
import {berxCanActivate, type BerxSpatialAffordance, type BerxSocialActionState} from './socialActions';
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
	/**
	 * The half-width of the quad the renderer actually drew, in world
	 * units — set by the renderer after rasterising, and what the picker
	 * tests against.
	 *
	 * The picker used to test `halfHeight * 4 * aspect` with the
	 * VIEWPORT's aspect, so every slot got the same box whatever its
	 * label while the quads drawn were half that or a third again as
	 * wide. Now the box IS the quad.
	 */
	drawnHalfWidth?: number;
	/**
	 * The half-width the RING RESERVED for this slot, in world units.
	 *
	 * The same measured aspect the renderer draws with, taken at the
	 * largest half-height any state can reach — see BERX_SLOT_FOCUS_SCALE.
	 * The reservation is state-independent on purpose: a ring that
	 * re-spaced itself when the focus moved would slide its actions out
	 * from under the hand that was reaching for one.
	 *
	 * Nothing picks with it. It is what the layout guaranteed, so a gate
	 * can check the guarantee against where the slots actually stand.
	 */
	reservedHalfWidth: number;
	/** The affordance's state, so a renderer never re-derives it. */
	state: BerxSocialActionState;
	/** What the state does to this slot's brightness. */
	alpha: number;
}

/**
 * HOW EACH STATE STANDS IN THE WORLD.
 *
 * One table, in the core, so the three renderers cannot disagree about
 * what a pressed action looks like. Every state is a real difference in
 * GEOMETRY and brightness — size, height off the ring, alpha — because
 * an affordance is a thing in a space, and a state that existed only as
 * a colour swap would be a badge on a button.
 *
 * `lift` is what separates success from failure without a second
 * colour channel: what worked rises, what failed settles. Those are
 * opposite directions in a world, and they read as opposite without
 * anyone being told which is which.
 *
 * `hidden` has no entry because it never becomes a slot at all — see
 * berxActionRing. An affordance a person must not see must also be one
 * they cannot touch, and the only way to guarantee that is for it not
 * to be there.
 */
export interface BerxSlotPresentation {
	/** Multiplier on the slot's half-height. */
	readonly scale: number;
	/** 0..1, handed to the label quad. */
	readonly alpha: number;
	/** World units up (+) or down (-) from where the ring puts it. */
	readonly lift: number;
}

const PRESENTATION: Readonly<Record<BerxSocialActionState, BerxSlotPresentation>> = Object.freeze({
	/* at rest: present, legible, not competing with the entity */
	available: {scale: 1, alpha: 0.72, lift: 0},
	/* the keyboard is on it: the largest and brightest thing in the ring */
	focus: {scale: 1.35, alpha: 1, lift: 0},
	/* a pointer is over it */
	hover: {scale: 1.2, alpha: 0.92, lift: 0},
	/* a pointer is near it but not on it: it leans out to meet the hand */
	proximity: {scale: 1.08, alpha: 0.82, lift: 0.02},
	/* held down: pressed IN, which is what a finger does to a thing */
	press: {scale: 0.92, alpha: 1, lift: -0.03},
	/* the server has not answered. Dimmer and still — a thing waiting,
	   not a thing spinning */
	pending: {scale: 1, alpha: 0.5, lift: 0},
	/* it happened: it rises */
	success: {scale: 1.15, alpha: 1, lift: 0.06},
	/* it did not: it settles back down */
	failure: {scale: 1.15, alpha: 1, lift: -0.06},
	/* offered by the domain, not available here: small and faint, and
	   berxCanActivate refuses it */
	disabled: {scale: 0.88, alpha: 0.3, lift: 0},
	/* never reaches a slot; present so the table is total */
	hidden: {scale: 0, alpha: 0, lift: 0},
});

export function berxSlotPresentation(state: BerxSocialActionState): BerxSlotPresentation {
	return PRESENTATION[state];
}

/** How much larger the focused slot stands. Kept for the framing gate. */
export const BERX_SLOT_FOCUS_SCALE = PRESENTATION.focus.scale;

/** How far out from the entity's own edge the ring sits. */
const RING_GAP = 0.55;
const SLOT_HEIGHT = 0.26;
/**
 * How much empty world stands between two names in the ring.
 *
 * One slot-height. Not a tolerance and not padding around a hit box:
 * it is the distance at which two words read as two things rather than
 * as a strip of text, and it is the same number whatever the labels
 * are, so the ring's rhythm does not change with its contents.
 */
/**
 * How much nearer than a slot the world has to have drawn before the
 * slot counts as hidden. A quad has no thickness; this covers the
 * G-buffer's quantisation and nothing else. Same value the renderer
 * uses to drop a slot at its own centre — one number, one rule.
 */
const SLOT_DEPTH_BIAS = 0.05;

export const BERX_SLOT_GAP = SLOT_HEIGHT;
/**
 * How far round the ring may open, and how far out along the camera's
 * right its widest point reaches.
 *
 * An arc rather than a full circle — actions behind an object cannot be
 * read — and the widest it opens is what decides the SMALLEST radius
 * that can hold a given set of names.
 */
const ARC = Math.PI * 0.9;
const REACH = 1.35;
const DEPTH = 0.35;
/**
 * How wide a label is, in multiples of its own height — the quad's
 * aspect, from whoever rasterises the glyphs.
 *
 * Injected rather than computed here for the same reason `mediaFor` is:
 * measuring text needs a text shaper, this package has none, and a
 * second shaper in the core would be a second opinion about how wide a
 * word is. Returning undefined means there is nothing to draw.
 */
export type BerxLabelAspect = (label: string) => number | undefined;
/**
 * The fallback for a backend that rasterises no text.
 *
 * World units of width per character at a slot's own height, taken from
 * the label rasteriser's own output. It is an ESTIMATE and it is only
 * ever used where there is no measurement: the native backend draws no
 * glyphs, so it has none to measure. Everywhere a renderer can measure,
 * the measurement wins — the estimate was short for the longest name by
 * enough to overlap its neighbour.
 */
const WIDTH_PER_CHARACTER = 0.58;

const aspectFor = (label: string, measure?: BerxLabelAspect): number =>
	measure?.(label) ?? label.trim().length * WIDTH_PER_CHARACTER;

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
 * WHERE EVERY ACTION STANDS, AND HOW MUCH ROOM EACH ONE HAS.
 *
 * The one place the ring's geometry is decided. The radius the camera
 * frames by and the positions the renderers draw at come out of the
 * same call, so the two cannot describe different rings — they used to
 * be two functions computing the same estimate side by side.
 *
 * The arrangement is built the other way round from how it reads. It
 * starts from the WIDTHS: every name is measured, laid out left to
 * right with `BERX_SLOT_GAP` of empty world between neighbours, and
 * only then is the smallest radius found that can carry that span
 * within the arc. So the radius is a CONSEQUENCE of the words, never a
 * number turned up until the overlaps stopped.
 *
 * The room reserved is at BERX_SLOT_FOCUS_SCALE — the largest a slot
 * ever gets. Spacing by each slot's current size would re-lay the ring
 * out every time the focus moved, which is a world that slides away
 * from the hand reaching into it.
 *
 * Why the widths cannot simply be turned into an angle: `across` is
 * `sin(angle) * radius * REACH`, and sine flattens toward the ends of
 * the arc, so equal angles are NOT equal distances. The old spacing
 * divided a width by a radius and used the result as an angle, which
 * is why the outermost pairs ended up closest together. Here the
 * across-positions are chosen first and the angle is recovered from
 * each one.
 */
export interface BerxRingPlace {
	readonly affordance: BerxSpatialAffordance;
	/** Along the camera's right, from the object's centre. */
	readonly across: number;
	/** How far the arc has swung under the object at this point. */
	readonly under: number;
	/** Half the width this slot was given, at its largest. */
	readonly halfWidth: number;
}

export interface BerxRingGeometry {
	readonly radius: number;
	readonly places: readonly BerxRingPlace[];
}

export function berxRingGeometry(
	object: BerxSpatialObject | undefined,
	affordances: readonly BerxSpatialAffordance[],
	measure?: BerxLabelAspect,
): BerxRingGeometry {
	/* An affordance nobody may see is an affordance nobody may touch, so
	   `hidden` is dropped HERE — before it can take up room, before
	   there is a slot to draw OR to pick. Nothing downstream has to
	   remember the rule. */
	const visible = affordances.filter((a) => a.state !== 'hidden');
	if (!object || visible.length === 0) return {radius: 0, places: []};

	/* the tallest a slot ever stands, so the room it needs never
	   changes with what the hand is doing */
	const reserved = SLOT_HEIGHT * 0.5 * BERX_SLOT_FOCUS_SCALE;
	const halfWidths = visible.map((a) => reserved * aspectFor(a.label, measure));

	/* lay the names out in a line first: each one's own half-width, its
	   neighbour's, and the gap between them */
	const offsets: number[] = [0];
	for (let i = 1; i < visible.length; i++) {
		offsets.push(offsets[i - 1] + halfWidths[i - 1] + halfWidths[i] + BERX_SLOT_GAP);
	}
	const span = offsets[offsets.length - 1];
	const halfSpan = span * 0.5;

	/* then bend that line into the arc. The smallest radius whose widest
	   point reaches halfSpan is the radius; the object's own edge is a
	   floor under it, never a ceiling over it. */
	const edge = Math.max(object.transform.scale.x, object.transform.scale.y) * 0.5 + RING_GAP;
	const radius = Math.max(edge, halfSpan / (REACH * Math.sin(ARC * 0.5)));
	const reach = Math.max(1e-4, radius * REACH);

	return {
		radius,
		places: visible.map((affordance, index) => {
			const across = offsets[index] - halfSpan;
			/* the arc's own depth at this point: cos of the angle whose
			   sine put the slot here, without the round trip through
			   asin */
			const t = Math.min(1, Math.abs(across) / reach);
			return {affordance, across, under: Math.sqrt(1 - t * t) * radius * DEPTH, halfWidth: halfWidths[index]};
		}),
	};
}

/**
 * How far the ring stands from the object it belongs to.
 *
 * A camera that frames only the object crops the ring off the bottom
 * of the screen — which is what focusing a person did: the actions
 * were placed correctly and half of them were off-frame. This is the
 * one number that has to be shared for the camera to know better, and
 * it is the same calculation the placement uses, because it IS the
 * placement's calculation.
 */
export function berxActionRingRadius(
	object: BerxSpatialObject | undefined,
	affordances: readonly BerxSpatialAffordance[],
	measure?: BerxLabelAspect,
): number {
	return berxRingGeometry(object, affordances, measure).radius;
}

/**
 * The ring, laid out beneath and around the focused entity.
 *
 * An arc rather than a full circle: actions behind an object cannot be
 * read, and a ring you have to orbit to use is a worse control than a
 * button. The arc opens toward the camera, spread by how wide the
 * names are, and it sits below the entity so it never covers its face
 * or its own name.
 *
 * Returns nothing when there is nothing focused, and nothing for an
 * object with no affordances — an empty ring is not drawn.
 */
export function berxActionRing(
	object: BerxSpatialObject | undefined,
	camera: BerxSpatialCameraState,
	affordances: readonly BerxSpatialAffordance[],
	measure?: BerxLabelAspect,
): BerxActionSlot[] {
	if (!object) return [];
	const basis = cameraBasis(camera);
	if (!basis) return [];
	const {places} = berxRingGeometry(object, affordances, measure);
	if (places.length === 0) return [];
	const drop = object.transform.scale.y * 0.5 + SLOT_HEIGHT * 1.4;

	return places.map((place) => {
		const look = berxSlotPresentation(place.affordance.state);
		const down = drop + place.under - look.lift;
		return {
			affordance: place.affordance,
			position: {
				x: object.transform.position.x + basis.right.x * place.across - basis.up.x * down,
				y: object.transform.position.y + basis.right.y * place.across - basis.up.y * down,
				z: object.transform.position.z + basis.right.z * place.across - basis.up.z * down,
			},
			/* State as GEOMETRY, so every renderer honours it without a
			   shader knowing what a state is. */
			halfHeight: SLOT_HEIGHT * 0.5 * look.scale,
			reservedHalfWidth: place.halfWidth,
			focused: place.affordance.state === 'focus',
			state: place.affordance.state,
			alpha: look.alpha,
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
	/**
	 * WHAT THE WORLD ACTUALLY DREW AT THIS PIXEL.
	 *
	 * The renderer's own G-buffer depth, along the camera's forward
	 * axis — the same number `berxResolveByDepth` resolves an entity
	 * with, so the ring and the entities are picked against ONE
	 * authority rather than two.
	 *
	 * Without it a slot won any pixel its quad covered, whatever stood
	 * in front. The renderer already drops a slot the world drew over AT
	 * THE SLOT'S OWN CENTRE, and that is not the same test: a name is
	 * half a world unit wide, so a slot whose centre is clear can still
	 * have its far edge lying across an entity nearer to the eye. A
	 * press there landed on the action rather than on the thing the
	 * person could see, which is how "aim at collection:33, focus stays
	 * on community:501" happened — the ring of the entity focused a
	 * moment earlier reached across a neighbour.
	 *
	 * Undefined means the backend cannot say (no G-buffer, or nothing
	 * drawn there) and the ring is picked as before — the honest
	 * fallback, not a guess.
	 */
	drawnDepth?: number,
): BerxActionSlot | undefined {
	const basis = cameraBasis(camera);
	if (!basis) return undefined;
	let best: BerxActionSlot | undefined;
	let bestDistance = Infinity;
	for (const slot of slots) {
		/**
		 * DRAWN IS NOT THE SAME AS TOUCHABLE.
		 *
		 * A disabled action stands in the ring so a person can see that
		 * it exists and is not theirs to use. Picking it would make the
		 * ring lie: the same positive list `act` consults decides here,
		 * so the two cannot drift into disagreeing about what is
		 * actionable.
		 */
		if (!berxCanActivate(slot.affordance.state)) continue;
		const d = {
			x: slot.position.x - camera.position.x,
			y: slot.position.y - camera.position.y,
			z: slot.position.z - camera.position.z,
		};
		const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
		if (along <= 0) continue;
		/**
		 * Behind what the eye can see, at THIS pixel.
		 *
		 * A quad has no thickness, so the only slack needed is the
		 * G-buffer's own quantisation — the same bias the renderer uses
		 * when it drops a slot at its centre. Anything nearer than the
		 * slot at this pixel is standing in front of it, and a person
		 * pressing there is pressing on that.
		 */
		if (drawnDepth !== undefined && drawnDepth > 0 && along > drawnDepth + SLOT_DEPTH_BIAS) continue;
		/* where the slot's centre lands on the ray, and where the ray is */
		const scale = along / Math.max(1e-4, rayDirection.x * basis.forward.x + rayDirection.y * basis.forward.y + rayDirection.z * basis.forward.z);
		const hit = {x: rayDirection.x * scale, y: rayDirection.y * scale, z: rayDirection.z * scale};
		const dx = (hit.x - d.x) * basis.right.x + (hit.y - d.y) * basis.right.y + (hit.z - d.z) * basis.right.z;
		const dy = (hit.x - d.x) * basis.up.x + (hit.y - d.y) * basis.up.y + (hit.z - d.z) * basis.up.z;
		/* the quad is as wide as its text is long; the caller sizes it,
		   and a generous width here is honest about a small target */
		/**
		 * THE BOX IS THE QUAD, where the renderer measured one.
		 *
		 * `halfHeight * 4 * aspect` used the VIEWPORT's aspect, so every
		 * slot got the same 0.743 half-width regardless of its label
		 * while the quads drawn were 0.424 to 0.774 — up to 1.75x too
		 * wide. Neighbours stand 1.411 apart and the box spans 1.486, so
		 * all five overlapped: a press at one action's own pixel could
		 * be answered by the one beside it, and was.
		 *
		 * The fallback keeps the old bound for a renderer that has not
		 * measured a quad — the native backend rasterises no text, so it
		 * has no glyph to measure.
		 */
		const halfWidth = slot.drawnHalfWidth ?? slot.halfHeight * 4 * aspect;
		if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= slot.halfHeight * 1.6 && along < bestDistance) {
			bestDistance = along;
			best = slot;
		}
	}
	return best;
}

/**
 * The slots a ray comes NEAR without hitting.
 *
 * Proximity is the same geometry as picking with a wider box — the
 * SAME box, widened — rather than a second notion of nearness that
 * could disagree about where a slot is. `pickActionSlot` answers "which
 * one is under the hand"; this answers "which ones is the hand
 * approaching", and a world that leans toward a hand before it arrives
 * is the difference between a place and a diagram.
 */
export function berxNearActionSlots(
	slots: readonly BerxActionSlot[],
	camera: BerxSpatialCameraState,
	rayDirection: BerxVec3,
	aspect: number,
	widen = 2.6,
): string[] {
	const basis = cameraBasis(camera);
	if (!basis) return [];
	const near: string[] = [];
	for (const slot of slots) {
		const d = {
			x: slot.position.x - camera.position.x,
			y: slot.position.y - camera.position.y,
			z: slot.position.z - camera.position.z,
		};
		const along = d.x * basis.forward.x + d.y * basis.forward.y + d.z * basis.forward.z;
		if (along <= 0) continue;
		const scale = along / Math.max(1e-4, rayDirection.x * basis.forward.x + rayDirection.y * basis.forward.y + rayDirection.z * basis.forward.z);
		const hit = {x: rayDirection.x * scale, y: rayDirection.y * scale, z: rayDirection.z * scale};
		const dx = (hit.x - d.x) * basis.right.x + (hit.y - d.y) * basis.right.y + (hit.z - d.z) * basis.right.z;
		const dy = (hit.x - d.x) * basis.up.x + (hit.y - d.y) * basis.up.y + (hit.z - d.z) * basis.up.z;
		const halfWidth = slot.drawnHalfWidth ?? slot.halfHeight * 4 * aspect;
		if (Math.abs(dx) <= halfWidth * widen && Math.abs(dy) <= slot.halfHeight * 1.6 * widen) {
			near.push(slot.affordance.id);
		}
	}
	return near;
}
