/**
 * BERX MOTION SYSTEM — four named tiers, one physical language.
 *
 * The transformation directive's own spec: "MICRO 100-180ms, STANDARD
 * 250-400ms, SPATIAL 450-750ms, CINEMATIC 800-1400ms. Cinematic only
 * for major moments." Plus: "Slow, cinematic, elastic, physical" and
 * "Avoid bouncing everywhere."
 *
 * This exists because durations in BERX were previously chosen per call
 * site (a 180 here, a 420 there, a 900 somewhere else) — each one
 * defensible alone, but with no shared answer to "how long should THIS
 * KIND of thing take". A tier is that answer, and the tier's own spring
 * is the answer to "how should it feel getting there".
 *
 * SPRING, NOT CURVE, wherever an object moves in space. Each tier's
 * spring is a real conversion from a perceived settle time and damping
 * ratio (see springs.ts) — the settle time IS the tier's duration, so a
 * SPATIAL spring genuinely takes ~600ms to arrive rather than being a
 * spring that happens to look slow. Damping rises as the tier gets
 * bigger: a micro-interaction can overshoot a little and read as
 * tactile, but a 1.2s cinematic camera move that bounces reads as
 * cheap, which is exactly the failure the directive names.
 *
 * `reduce()` is the accessibility contract in one place: Reduced Motion
 * must remove "large camera movements, excessive parallax, particle
 * movement, strong transitions" while retaining hierarchy — so it
 * collapses the big tiers toward a short fade rather than disabling
 * animation outright and losing the ordering cues entirely.
 */
import {springFromResponse, type BerxSpringConfig} from './springs';

export type BerxMotionTier = 'micro' | 'standard' | 'spatial' | 'cinematic';

export interface BerxMotionTokens {
	/** The tier's own duration, ms — the middle of the directive's stated band. */
	duration: number;
	/** The band this tier is allowed to live in. A call site with a real reason may pick within it; nothing should leave it. */
	range: readonly [number, number];
	/** Real spring whose perceived settle time equals `duration`. */
	spring: BerxSpringConfig;
	/** What this tier is for — kept so a call site reads as intent. */
	role: string;
}

function tier(range: readonly [number, number], dampingRatio: number, role: string): BerxMotionTokens {
	const duration = Math.round((range[0] + range[1]) / 2);
	return {duration, range, spring: springFromResponse(duration / 1000, dampingRatio), role};
}

export const BERX_MOTION: Record<BerxMotionTier, BerxMotionTokens> = {
	/** Press compression, icon state, toggle. Lowest damping — this is where "tactile" lives. */
	micro: tier([100, 180], 0.68, 'touch response, icon state, compression'),
	/** Panel content, list item, sheet content, value change. */
	standard: tier([250, 400], 0.76, 'content change, entrance, reveal'),
	/** An object moving through depth: card approach, sheet rise, screen-to-screen. */
	spatial: tier([450, 750], 0.84, 'objects moving through depth'),
	/** Camera moves and major moments only — splash, entry into the app, wow beats. */
	cinematic: tier([800, 1400], 0.92, 'camera moves and major moments only'),
};

/** Stagger steps that pair with the tiers — a real ladder, so two screens stagger at the same rate. */
export const BERX_STAGGER = {
	/** Words in a headline, characters in a value. */
	tight: 60,
	/** Buttons in a stack, rows in a list. */
	base: 100,
	/** Objects entering a scene from different depths. */
	spatial: 160,
} as const;

/**
 * Reduced Motion. Returns the duration a tier should actually use when
 * the user has asked for less movement: everything collapses toward a
 * single short cross-fade, so ORDER and HIERARCHY survive (a thing
 * still appears after the thing it belongs to) while the camera work
 * does not.
 */
export function reduce(tokens: BerxMotionTokens, reducedMotion: boolean): number {
	return reducedMotion ? Math.min(tokens.duration, 120) : tokens.duration;
}

/** The same collapse for stagger — reduced motion keeps sequence, not spectacle. */
export function reduceStagger(step: number, reducedMotion: boolean): number {
	return reducedMotion ? Math.min(step, 24) : step;
}
