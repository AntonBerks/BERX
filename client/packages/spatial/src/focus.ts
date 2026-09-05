/**
 * D5 — focus.
 *
 * The archive reserves D5 for focus, active state and transient
 * energy, and until now the only thing implementing it was a glow
 * drawn on top of an object. A glow on top is decoration. Focus is a
 * property of the *scene*: when one thing is focused, everything
 * else is not, and the eye is told so by the surroundings falling
 * away — not by the focused object being painted brighter until it
 * leaves the material band it belongs to.
 *
 * So focus here resolves to three things acting together:
 *
 *   1. RECESSION — the planes behind the focus step back, graduated
 *      by depth. The environment recedes most, the controls least.
 *      Graduated, because dimming every plane by the same amount
 *      produces the same picture slightly darker: the gaps between
 *      the planes are the hierarchy, and a uniform multiplier leaves
 *      them proportionally untouched while costing contrast.
 *
 *   2. CLEARING — a radial falloff drawn between the controls and
 *      the focus: transparent across the focused object and its
 *      margin, rising to its full strength at the far edge of the
 *      scene. It is not a sheet over the room. The room is still
 *      lit, still has its floor and its walls; it is simply further
 *      from the light than the thing being looked at.
 *
 *   3. EMISSION — the focused surface's own material glow gains,
 *      within the emissive range its material already declares. The
 *      object emerges because the scene made room for it and because
 *      it is lit, never because it was recoloured.
 *
 * The hierarchy rule is enforceable arithmetic, not an intention:
 * recession is monotonic in depth and floored, so the plane order
 * that materials.ts established survives focus. assertFocusDepth()
 * states the conditions and is what the probes read.
 */
import {clamp, round} from './color';
import {BERX_DEPTH_KEYS, BERX_DEPTH_TOKENS, type BerxDepthKey} from './tokens';

/** A rectangle in scene coordinates, in px. */
export interface BerxFocusRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Offset and alpha, not a colour string: every stop falls toward the
 * same substrate colour, and the two platforms want it in different
 * shapes — react-native-svg takes stopColor + stopOpacity, CSS takes
 * one rgba(). Splitting it here means neither adapter has to parse a
 * colour back apart.
 */
export interface BerxFocusStop {
	/** 0..1 along the field's own radius. */
	offset: number;
	alpha: number;
}

export interface BerxFocusField {
	/** Centre of the clearing, 0..1 across the scene. */
	centerX: number;
	centerY: number;
	/** Outer extent of the falloff, as a fraction of each axis. Always
	 *  reaches past the farthest corner, so no edge stays unfocused-
	 *  looking by accident. */
	radiusX: number;
	radiusY: number;
	/** Where the clearing ends and the falloff starts, 0..1 of radius. */
	clearOffset: number;
	stops: BerxFocusStop[];
	/** Alpha at the far edge. */
	surroundAlpha: number;
	/** The colour the surround falls toward — the scene's own
	 *  substrate, never black, or the room would turn into a hole. */
	surroundColor: string;
	/** The plane the focused object sits on. Everything behind it
	 *  recedes; it and the planes in front of it hold still. */
	plane: BerxDepthKey;
	/** Multiplier on each plane's rendered opacity while focus holds. */
	recession: Record<BerxDepthKey, number>;
	/** Multiplier on the focused surface's declared emissive glow. */
	emissionGain: number;
	/** Radius in px for the halo drawn around the focused object. */
	haloRadiusPx: number;
	/** Human-readable; printed in the QA report. */
	description: string;
}

export interface BerxFocusInput {
	/** The focused object's box. */
	rect: BerxFocusRect;
	viewportWidth: number;
	viewportHeight: number;
	/** The scene's substrate colour. */
	background: string;
	/**
	 * Which plane the focused object is on. Defaults to the focus
	 * plane, which is where an object promoted by BerxFocusTarget
	 * ends up.
	 *
	 * It matters because recession is measured *from* the focus, not
	 * from the camera: a card that holds focus while still sitting on
	 * the content plane must not dim along with the content plane it
	 * is on, and the controls in front of it have nothing to step
	 * back from. Only what is behind the focus recedes; the same-plane
	 * surround is separated by the clearing instead, which is what the
	 * clearing is for.
	 */
	plane?: BerxDepthKey;
	/** 0..1. Below 0.02 the field resolves to nothing at all rather
	 *  than to an invisible layer nobody can see but everybody pays
	 *  for. */
	intensity?: number;
	tier?: 'high' | 'medium' | 'low';
	/** True when D5 could not get its blur — the falloff is composed
	 *  harder instead, the same bargain the atmosphere makes. */
	blurred?: boolean;
}

/**
 * How far each plane steps back at full focus intensity.
 *
 * Monotonic by construction. D5 does not recede — it is the plane
 * being focused. D4 barely does, because controls stay reachable:
 * a focused scene whose actions have dimmed away is a modal, and a
 * modal is not what D5 means.
 */
const RECESSION_AT_FULL: Record<BerxDepthKey, number> = {
	D0: 0.66,
	D1: 0.71,
	D2: 0.8,
	D3: 0.88,
	D4: 0.95,
	D5: 1,
};

/** The clearing never shrinks to a spotlight, never grows to a sheet. */
const CLEAR_MIN = 0.08;
const CLEAR_MAX = 0.56;

export function resolveFocus(input: BerxFocusInput): BerxFocusField | null {
	const intensity = clamp(input.intensity ?? 1, 0, 1);
	if (intensity < 0.02) return null;

	const vw = Math.max(1, input.viewportWidth);
	const vh = Math.max(1, input.viewportHeight);

	const cx = clamp((input.rect.x + input.rect.width / 2) / vw, 0, 1);
	const cy = clamp((input.rect.y + input.rect.height / 2) / vh, 0, 1);

	/* Farthest corner, with headroom, so the falloff owns the whole
	 * scene however off-centre the focused object is. */
	const radiusX = round(clamp(Math.max(cx, 1 - cx) * 1.42, 0.2, 2), 4);
	const radiusY = round(clamp(Math.max(cy, 1 - cy) * 1.42, 0.2, 2), 4);

	/* The object's own half-size plus a margin, expressed against the
	 * field's radius on each axis; the larger of the two wins so the
	 * clearing never crops the object on its long side. */
	const marginedX = (input.rect.width / 2 / vw) * 1.18;
	const marginedY = (input.rect.height / 2 / vh) * 1.18;
	const clearOffset = round(
		clamp(Math.max(marginedX / radiusX, marginedY / radiusY), CLEAR_MIN, CLEAR_MAX),
		4,
	);

	const tier = input.tier ?? 'high';
	/* Without blur the falloff has to do the separating on its own,
	 * the same compensation the atmosphere makes. */
	const flatGain = input.blurred === false ? 1.22 : 1;
	const surroundAlpha = round(clamp(0.46 * intensity * flatGain, 0, 0.72), 4);

	const surroundColor = input.background;
	const knee = clamp(clearOffset + (1 - clearOffset) * 0.42, clearOffset + 0.02, 0.98);

	/* Low tier gets the same field with one fewer stop: the shape of
	 * the falloff is the point, the smoothness of it is the luxury. */
	const stops: BerxFocusStop[] =
		tier === 'low'
			? [
					{offset: 0, alpha: 0},
					{offset: clearOffset, alpha: 0},
					{offset: 1, alpha: surroundAlpha},
				]
			: [
					{offset: 0, alpha: 0},
					{offset: clearOffset, alpha: 0},
					{offset: round(knee, 4), alpha: round(surroundAlpha * 0.52, 4)},
					{offset: 1, alpha: surroundAlpha},
				];

	const plane = input.plane ?? 'D5';
	const planeZ = BERX_DEPTH_TOKENS[plane].z;
	const recession = {} as Record<BerxDepthKey, number>;
	for (const depth of BERX_DEPTH_KEYS) {
		/* only what is behind the focus steps back */
		if (BERX_DEPTH_TOKENS[depth].z >= planeZ) {
			recession[depth] = 1;
			continue;
		}
		const full = RECESSION_AT_FULL[depth];
		recession[depth] = round(1 - (1 - full) * intensity, 4);
	}

	const haloRadiusPx = Math.round(
		clamp(Math.max(input.rect.width, input.rect.height) * 0.34, 12, 96),
	);

	return {
		centerX: round(cx, 4),
		centerY: round(cy, 4),
		radiusX,
		radiusY,
		clearOffset,
		stops,
		plane,
		surroundAlpha,
		surroundColor,
		recession,
		emissionGain: round(1 + 0.62 * intensity, 4),
		haloRadiusPx,
		description: `focus clearing at ${Math.round(cx * 100)}%/${Math.round(cy * 100)}%, surround falls to ${Math.round(surroundAlpha * 100)}%`,
	};
}

/**
 * Why a focus field would destroy the hierarchy instead of serving
 * it. Empty means the field is sound. The probes read this; it is
 * the machine-checkable half of "focus must emerge from the scene
 * without destroying the hierarchy".
 */
export function assertFocusDepth(field: BerxFocusField): string[] {
	const reasons: string[] = [];

	/* 1. Recession is what preserves the plane order under focus. If
	 *    a nearer plane receded further than a farther one, the
	 *    ordering materials.ts measures in L* would invert the first time
	 *    anything was focused. */
	let previous = -1;
	for (const depth of BERX_DEPTH_KEYS) {
		const value = field.recession[depth];
		if (value < previous) {
			reasons.push(`${depth} recedes further than the plane behind it (${value} < ${previous})`);
		}
		previous = value;
	}

	if (field.recession[field.plane] !== 1) {
		reasons.push(`the focus plane ${field.plane} itself recedes; it is what focus is measured against`);
	}
	if (field.recession.D0 < 0.5) {
		reasons.push('the environment recedes past half; the room stops being a room');
	}
	if (field.recession.D4 < 0.85) {
		reasons.push('controls recede like content; a focused scene still has to be operable');
	}
	if (field.recession.D0 === 1 && field.plane !== 'D0') {
		reasons.push('nothing behind the focus stepped back; the field is decoration');
	}

	/* The clearing is painted between the content and the controls —
	 * above the content and the room so they fall away, below the
	 * controls so a focused scene stays operable. An object focused on
	 * a plane at or below the content plane is therefore *under* its
	 * own clearing: it would darken along with the surround it is
	 * supposed to be emerging from. Focus promotes; this is the check
	 * that it actually did. */
	if (BERX_DEPTH_TOKENS[field.plane].z <= BERX_DEPTH_TOKENS.D3.z) {
		reasons.push(`the focused object is on ${field.plane}, under its own clearing; focus has to promote it to D4 or D5`);
	}

	/* 2. The clearing has to actually clear something. A falloff that
	 *    starts at the centre is a scrim over the focused object. */
	if (field.clearOffset < CLEAR_MIN) {
		reasons.push('the clearing does not reach the focused object');
	}
	if (field.clearOffset > CLEAR_MAX) {
		reasons.push('the clearing covers the scene; nothing is left to recede');
	}
	if (field.stops.length < 3) {
		reasons.push('the falloff is a step, not a falloff');
	}

	/* 3. A surround that never darkens is a layer that costs a paint
	 *    and communicates nothing; one that darkens to opacity is the
	 *    flat sheet the archive rejects. */
	if (field.surroundAlpha < 0.08) {
		reasons.push('the surround barely falls; focus will not read');
	}
	if (field.surroundAlpha > 0.72) {
		reasons.push('the surround falls to a sheet; the room is hidden rather than behind');
	}

	if (field.emissionGain <= 1) {
		reasons.push('the focused surface gains no emission; it recedes with everything else');
	}

	return reasons;
}
