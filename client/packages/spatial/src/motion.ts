/**
 * Motion resolver.
 *
 * Two rules from the constitution do all the work here:
 *   1. Reduced motion removes parallax and tilt and keeps semantic
 *      transitions — a screen still enters and leaves, it just stops
 *      travelling through space to do it.
 *   2. Ambient loops and parallax are the first casualties of a tight
 *      frame budget.
 *
 * Both are enforced in `resolveMotion`, so no screen can opt itself
 * back into motion a user has asked not to see.
 */
import {
	BERX_MOTION_PRESETS,
	BERX_REDUCED_MOTION_RULES,
	BERX_SHARED_ELEMENTS,
	type BerxMotionPreset,
	type BerxMotionPresetName,
	type BerxSharedElementId,
} from './tokens';
import type {BerxPerformanceBudget} from './performance';
import {clamp, round} from './color';

export interface BerxMotionInput {
	preset: BerxMotionPresetName;
	reducedMotion: boolean;
	budget?: Pick<BerxPerformanceBudget, 'allowAmbientMotion' | 'allow3D'>;
}

export interface BerxResolvedMotion extends BerxMotionPreset {
	name: BerxMotionPresetName;
	/** The preset originally asked for, when this one is a substitute. */
	substitutedFor?: BerxMotionPresetName;
	/** True when the motion was reduced or dropped, with `reason` saying why. */
	adapted: boolean;
	reason?: string;
}

function stripSpatial(preset: BerxMotionPreset): BerxMotionPreset {
	const strip = (t?: BerxMotionPreset['from']) => {
		if (!t) return t;
		const {translateZ: _dropped, ...rest} = t;
		return rest;
	};
	return {...preset, from: strip(preset.from), to: strip(preset.to), delta: strip(preset.delta)};
}

export function resolveMotion(input: BerxMotionInput): BerxResolvedMotion {
	const requested = input.preset;
	const preset = BERX_MOTION_PRESETS[requested];

	if (input.reducedMotion) {
		if (requested === 'ambient') {
			return {
				...BERX_MOTION_PRESETS.crossFade,
				durationMs: 0,
				name: 'crossFade',
				substitutedFor: 'ambient',
				adapted: true,
				reason: 'reduced motion: ambient loops removed entirely',
			};
		}
		if (requested === 'crossFade') {
			return {...preset, name: requested, adapted: false};
		}
		/**
		 * Everything else keeps its meaning and loses its travel: the
		 * transition still happens (so the user still perceives the
		 * change of state) at crossFade's duration ceiling.
		 */
		return {
			...BERX_MOTION_PRESETS.crossFade,
			durationMs: Math.min(preset.durationMs, BERX_REDUCED_MOTION_RULES.maxDurationMs),
			name: BERX_REDUCED_MOTION_RULES.replaceParallaxWith,
			substitutedFor: requested,
			adapted: true,
			reason: 'reduced motion: spatial travel replaced by cross-fade',
		};
	}

	if (requested === 'ambient' && input.budget?.allowAmbientMotion === false) {
		return {
			...BERX_MOTION_PRESETS.ambient,
			durationMs: 0,
			loop: false,
			delta: undefined,
			name: 'ambient',
			adapted: true,
			reason: 'performance budget: ambient loop suspended',
		};
	}

	if (input.budget?.allow3D === false) {
		return {
			...stripSpatial(preset),
			name: requested,
			adapted: true,
			reason: 'performance budget: z travel flattened to opacity/scale',
		};
	}

	return {...preset, name: requested, adapted: false};
}

/* ------------------------------------------------------------------ */
/* Shared elements                                                     */
/* ------------------------------------------------------------------ */

export interface BerxSharedElementPlan {
	id: BerxSharedElementId;
	/** Stable identity across the two scenes — same object, two positions. */
	tag: string;
	durationMs: number;
	easing: string;
	bezier: [number, number, number, number];
	/** Under reduced motion the element cross-fades in place instead of flying. */
	travels: boolean;
}

export function isSharedElement(id: string): id is BerxSharedElementId {
	return (BERX_SHARED_ELEMENTS as readonly string[]).includes(id);
}

/**
 * A shared element needs the *same* tag on both scenes to be one
 * object rather than two that happen to look alike, so the tag is
 * derived from the element role plus the domain object's real id.
 */
export function sharedElementTag(id: BerxSharedElementId, objectId: string | number): string {
	return `berx:${id}:${objectId}`;
}

export function planSharedElement(
	id: BerxSharedElementId,
	objectId: string | number,
	reducedMotion: boolean,
): BerxSharedElementPlan {
	const spatial = BERX_MOTION_PRESETS.spatialEnter;
	return {
		id,
		tag: sharedElementTag(id, objectId),
		durationMs: reducedMotion ? BERX_REDUCED_MOTION_RULES.maxDurationMs : spatial.durationMs,
		easing: reducedMotion ? BERX_MOTION_PRESETS.crossFade.easing : spatial.easing,
		bezier: reducedMotion ? BERX_MOTION_PRESETS.crossFade.bezier : spatial.bezier,
		travels: !reducedMotion,
	};
}

/* ------------------------------------------------------------------ */
/* Shared-element geometry                                             */
/* ------------------------------------------------------------------ */

export interface BerxRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface BerxSharedElementFlip {
	/** Transform that puts the destination element back over the source. */
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
	durationMs: number;
	easing: string;
	bezier: [number, number, number, number];
	/** False under reduced motion: the element cross-fades in place. */
	travels: boolean;
}

/**
 * The invert half of a first–last–invert–play transition.
 *
 * A shared element is one object seen in two places, so the honest way
 * to move it is not to animate a copy along a guessed path: it is to
 * put the destination element exactly where the source was and then
 * release it. That needs both real rectangles, which is why this takes
 * measurements rather than positions someone estimated.
 *
 * Under reduced motion the transform is identity and `travels` is
 * false — the element is already in its final place and only fades,
 * which keeps the continuity (the same object, the same identity) and
 * drops the movement, exactly as the motion graph specifies.
 *
 * A zero-sized destination cannot be scaled to, so the transform
 * degrades to a plain translate rather than dividing by zero.
 */
export function planSharedElementFlip(from: BerxRect, to: BerxRect, reducedMotion: boolean): BerxSharedElementFlip {
	const spatial = BERX_MOTION_PRESETS.spatialEnter;
	const fade = BERX_MOTION_PRESETS.crossFade;

	if (reducedMotion) {
		return {
			translateX: 0,
			translateY: 0,
			scaleX: 1,
			scaleY: 1,
			durationMs: Math.min(fade.durationMs, BERX_REDUCED_MOTION_RULES.maxDurationMs),
			easing: fade.easing,
			bezier: fade.bezier,
			travels: false,
		};
	}

	const scaleX = to.width > 0 ? round(from.width / to.width, 4) : 1;
	const scaleY = to.height > 0 ? round(from.height / to.height, 4) : 1;

	return {
		/* centre-to-centre, so the transform is independent of transform-origin */
		translateX: round(from.x + from.width / 2 - (to.x + to.width / 2), 2),
		translateY: round(from.y + from.height / 2 - (to.y + to.height / 2), 2),
		scaleX,
		scaleY,
		durationMs: spatial.durationMs,
		easing: spatial.easing,
		bezier: spatial.bezier,
		travels: true,
	};
}

/* ------------------------------------------------------------------ */
/* Parallax                                                            */
/* ------------------------------------------------------------------ */

/**
 * Layer offset for a given scroll position. Returns exactly 0 when
 * parallax is off, so a caller cannot leak a "very small" movement
 * into a reduced-motion session.
 */
export function parallaxOffset(
	scrollY: number,
	parallaxFactor: number,
	enabled: boolean,
	maxOffsetPx = 120,
): number {
	if (!enabled || parallaxFactor === 0) return 0;
	/**
	 * Nearer layers move *less* than the scroll, not more: the
	 * substrate should lag behind the content the reader is tracking.
	 * factor 1.0 (D5) therefore means "moves with content", 0.15 (D1)
	 * means "almost fixed".
	 */
	const offset = scrollY * (1 - clamp(parallaxFactor, 0, 1)) * -0.35;
	return round(clamp(offset, -maxOffsetPx, maxOffsetPx), 2);
}
