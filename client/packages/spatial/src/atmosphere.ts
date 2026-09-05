/**
 * Content-aware atmosphere — D1 as the meaning of the scene, not a
 * background image slot.
 *
 * v9's depth model gives D1 to "environment/atmosphere", and the
 * archive is explicit that the environment must support the meaning
 * of the scene. A profile is not a place; a conversation is not a
 * story; a wallet is not a trip. Painting the same dim wash behind
 * all of them is the failure mode this module exists to remove.
 *
 * Every family therefore resolves to an atmosphere *character*: a
 * lit sky, pools of light with real positions, an optional ground
 * plane and horizon, a vignette, and a stated role for real media.
 * All of it is composition — gradients, geometry, luminance
 * separation — so the depth survives when blur is taken away. Blur
 * is the cheapest layer to lose and the first the budget drops; if
 * removing it flattened the scene, the depth was never there.
 *
 * Nothing here fabricates content. Media is only ever the screen's
 * own real domain media; when a screen has none, `mediaRole` says
 * so and the room is lit without it rather than filled with a stock
 * photograph.
 *
 * Pure data in, pure data out — no React, no DOM. The React Native
 * adapter paints it with react-native-svg, the web adapter with CSS
 * gradients, from this one resolution.
 */
import {clamp, flatten, mix, parseColor, relativeLuminance, rgba, round} from './color';
import {BERX_V9_COLOR} from './tokens';
import type {BerxFamily} from './contract';
import type {BerxGradient} from './lighting';

/**
 * The atmosphere characters. One per kind of meaning, not one per
 * screen — 300 contracts share 11 kinds of environment.
 */
export type BerxAtmosphereKind =
	| 'identity'
	| 'location'
	| 'temporal'
	| 'conversational'
	| 'immersive'
	| 'geographic'
	| 'community'
	| 'journey'
	| 'premium'
	| 'cinematic'
	| 'social';

export const BERX_ATMOSPHERE_KINDS: readonly BerxAtmosphereKind[] = [
	'identity',
	'location',
	'temporal',
	'conversational',
	'immersive',
	'geographic',
	'community',
	'journey',
	'premium',
	'cinematic',
	'social',
] as const;

/**
 * Family → atmosphere. The 13 v9 families each have a default
 * character; screens whose content is more specific than their
 * family (a trip inside PLACES, a memory inside SOCIAL, the wallet
 * inside PROFILE) name their kind explicitly.
 */
export const BERX_FAMILY_ATMOSPHERE: Record<BerxFamily, BerxAtmosphereKind> = {
	AUTH: 'cinematic',
	HOME: 'social',
	EXPLORE: 'geographic',
	NOW: 'geographic',
	PROFILE: 'identity',
	SOCIAL: 'social',
	MESSAGES: 'conversational',
	PLACES: 'location',
	EVENTS: 'temporal',
	EXPERIENCE: 'journey',
	COMMUNITY: 'community',
	CREATOR: 'immersive',
	BUSINESS: 'location',
};

export function berxAtmosphereForFamily(family: BerxFamily): BerxAtmosphereKind {
	return BERX_FAMILY_ATMOSPHERE[family];
}

/**
 * Light pools a performance tier can afford.
 *
 * Measured, not guessed: the browser probe attributes frame cost
 * layer by layer, and the pools are the part of the environment whose
 * count actually moves that number. Everything else in the room — the
 * lit sky, the ground plane, the horizon, the vignette — is the same
 * on every tier, because those are what make it a space.
 */
export function berxAtmospherePoolBudget(tier: 'high' | 'medium' | 'low'): number {
	return tier === 'high' ? 3 : tier === 'medium' ? 2 : 1;
}

/* ------------------------------------------------------------------ */
/* Real time of day                                                    */
/* ------------------------------------------------------------------ */

export type BerxTimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * The device clock, read as a real signal. Event and Explore/NOW
 * scenes are temporal by definition, and an evening BERX should not
 * be lit like a midday one. This is the local hour and nothing
 * else — no invented weather, no fabricated location.
 */
export function berxTimeOfDay(date: Date = new Date()): BerxTimeOfDay {
	const h = date.getHours();
	if (h >= 5 && h < 8) return 'dawn';
	if (h >= 8 && h < 17) return 'day';
	if (h >= 17 && h < 21) return 'dusk';
	return 'night';
}

/** How far each hour band pushes the sky warm (+) or cool (−), and how bright. */
const TIME_LIGHT: Record<BerxTimeOfDay, {warmth: number; lift: number; tint: string}> = {
	dawn: {warmth: 0.5, lift: 0.1, tint: '#FFC857'},
	day: {warmth: 0.2, lift: 0.14, tint: '#A7B0B7'},
	dusk: {warmth: 0.75, lift: 0.09, tint: '#FF5C72'},
	night: {warmth: 0, lift: 0.05, tint: '#8BA8FF'},
};

/* ------------------------------------------------------------------ */
/* Resolved shape                                                      */
/* ------------------------------------------------------------------ */

/** A pool of light, positioned in normalized scene space. */
export interface BerxAtmospherePool {
	/** 0..1 across the scene; 0 = left/top edge. */
	x: number;
	y: number;
	/** Radius as a fraction of the scene's larger axis. */
	radius: number;
	color: string;
	/** Multiplier on the atmosphere plane's own parallax, so pools at
	 *  different apparent distances do not move as one flat sheet. */
	depth: number;
}

/** The far plane a scene stands on, when its content has a ground. */
export interface BerxAtmosphereGround {
	/** 0..1 down the scene — where the ground meets the sky. */
	horizon: number;
	color: string;
	/** Softness of the horizon line, 0..1. A hard line is a stage; a
	 *  soft one is distance haze. */
	haze: number;
	/** Luminance of the horizon line itself, 0..1. */
	edge: number;
}

export interface BerxAtmosphere {
	kind: BerxAtmosphereKind;
	/** Lit sky across the whole atmosphere plane. */
	sky: BerxGradient;
	pools: BerxAtmospherePool[];
	ground: BerxAtmosphereGround | null;
	/** Edge darkening, 0..1 — the walls of the room. */
	vignette: number;
	/** What the screen's real media does here. */
	mediaRole: 'primary' | 'supporting' | 'none';
	/** Opacity for that media at D1. */
	mediaOpacity: number;
	/** Darkening over the media so D3 keeps its contrast. */
	mediaScrim: number;
	/** Scrim when the screen has no media — the lit room needs less. */
	baseScrim: number;
	/** Multiplier on D1's parallax factor. */
	parallaxScale: number;
	/** Ambient drift amplitude in dp. 0 under reduced motion. */
	driftPx: number;
	/** Human-readable, and printed in the QA report. */
	description: string;
	/** Set when blur was unavailable and composition was strengthened. */
	compensatedForFlatness: boolean;
}

export interface BerxAtmosphereInput {
	kind: BerxAtmosphereKind;
	/** The scene's active accent (colour world). */
	accent: string;
	/** The scene's substrate colour. */
	background: string;
	/** True only when the screen has real domain media to show. */
	hasMedia: boolean;
	/** Real clock. Defaults to now for the temporal kinds. */
	timeOfDay?: BerxTimeOfDay;
	/** D1's resolved dimming, so atmosphere never out-shines content. */
	intensity?: number;
	reducedMotion?: boolean;
	allowParallax?: boolean;
	/**
	 * Whether D1 actually got its blur. When it did not, the
	 * atmosphere is composed harder rather than abandoned: pools
	 * gain separation, the vignette deepens, the horizon sharpens.
	 * Cheaper, still a room.
	 */
	blurred?: boolean;
	/**
	 * How many light pools this device can afford to paint.
	 *
	 * Graduated quality, not a switch: the sky, the ground, the
	 * horizon and the vignette are always there, and it is the number
	 * of light *sources* that scales. A scene keeps its direction and
	 * its floor on the weakest device — it simply has fewer lamps.
	 * Pools are dropped from the back of the list, which is where the
	 * resolvers put the faintest and most distant ones.
	 */
	maxPools?: number;
	/**
	 * True when the scene is a room inside a room — a card, a panel, a
	 * tab — rather than the whole view.
	 *
	 * A bounded room has no horizon. A ground plane and a horizon line
	 * are cues about distance, and there is no distance to describe
	 * inside a 360px card: painted there they read as a stray band
	 * across a box, which is what the site's section cards showed. The
	 * sky, the light and the walls stay; the floor is what a window
	 * that small cannot show.
	 */
	bounded?: boolean;
	/**
	 * The content plane's own composited colour.
	 *
	 * The room is not allowed to out-shine the content standing in it,
	 * and until now that was enforced only between the *materials* —
	 * which is a different question. A card's fill can sit correctly
	 * above the substrate in the material bands and still be darker
	 * than the lit end of the sky it is painted over, and then the
	 * scene reads with its planes inverted however well ordered the
	 * numbers are. Given this, the sky's lit end is capped so the
	 * content stays the lighter of the two wherever they meet.
	 *
	 * Omitted, the sky is left as resolved: a caller that cannot say
	 * what its content looks like gets the room it asked for rather
	 * than a guess.
	 */
	contentColor?: string;
}

function pool(x: number, y: number, radius: number, color: string, depth = 1): BerxAtmospherePool {
	return {x: round(x, 3), y: round(y, 3), radius: round(radius, 3), color, depth: round(depth, 2)};
}

/**
 * The atmosphere resolver.
 *
 * Each branch is a description of a place, not a palette: where the
 * light comes from, whether there is a floor, how far away the walls
 * are. That is what makes Messages feel like a lit corridor and
 * Trips feel like distance.
 */
/**
 * The light signature of each kind of room.
 *
 * The eleven atmospheres already differed in the things that matter
 * structurally — whether there is a floor, how high the horizon sits,
 * how close the walls are, how many lamps the room has. What they did
 * not differ in was the thing the eye reads first: the *direction*
 * the light comes from and the *temperature* of it. Every sky pointed
 * within eight degrees of straight down and mixed the same accent at
 * roughly the same strength, so eleven genuinely different rooms
 * rendered as one dark teal wash with the furniture rearranged.
 *
 * These are the two properties that separate them at a glance:
 *
 *   `angleDeg` — where the light enters. A location is lit from high
 *   and to one side, like a window; a conversation is lit across the
 *   room, because a corridor is lit along its length; a cinematic
 *   entrance is lit steeply from behind, which is what makes an
 *   entrance an entrance.
 *
 *   `warmth` — the temperature of that light, −1 cold to +1 warm.
 *   BERX has one accent per colour world and that is deliberate, so
 *   this is not a second palette: it is a small shift of the lit end
 *   of the sky toward daylight or toward lamplight, which is what
 *   actually distinguishes a bar at night from a map at noon.
 *
 * `contrast` widens the sky's own falloff for the rooms that should
 * read as deep, and flattens it for the ones that should read as
 * enclosed.
 */
const KIND_LIGHT: Record<BerxAtmosphereKind, {angleDeg: number; warmth: number; contrast: number}> = {
	/* a window, high and to the left; interiors are lamplit */
	location: {angleDeg: 158, warmth: 0.45, contrast: 1.1},
	/* one key light on one face, slightly warm, close and low-contrast */
	identity: {angleDeg: 196, warmth: 0.3, contrast: 0.85},
	/* along the corridor, not down it, and cool */
	conversational: {angleDeg: 118, warmth: -0.2, contrast: 0.8},
	/* the media is the light; the room only frames it */
	immersive: {angleDeg: 180, warmth: 0, contrast: 1.25},
	/* wide, cold, high sun over a lot of ground */
	geographic: {angleDeg: 172, warmth: -0.55, contrast: 1.3},
	/* dusk: the light is behind and to the right, and it is warm */
	temporal: {angleDeg: 208, warmth: 0.6, contrast: 1.2},
	/* a hall with light from both sides */
	community: {angleDeg: 135, warmth: 0.15, contrast: 0.95},
	/* distance: low sun, long throw, cold at the far end */
	journey: {angleDeg: 165, warmth: -0.35, contrast: 1.35},
	/* a display case: raking light across the object */
	premium: {angleDeg: 142, warmth: 0.25, contrast: 1.15},
	/* a steep entrance light from behind the viewer */
	cinematic: {angleDeg: 214, warmth: -0.1, contrast: 1.4},
	/* even, social, slightly warm — a room with people in it */
	social: {angleDeg: 186, warmth: 0.2, contrast: 0.9},
};

/** Daylight and lamplight, as the two ends the sky's lit end moves between. */
const COLD_LIGHT = '#8FB6FF';
const WARM_LIGHT = '#FFB27A';

/**
 * Applies a kind's light signature to a resolved sky.
 *
 * Only the lit end is tinted and only the falloff is stretched: the
 * dark end of every BERX sky stays the substrate, because the rooms
 * differ in how they are lit, not in what they are made of.
 */
function applyKindLight(sky: BerxGradient, kind: BerxAtmosphereKind): BerxGradient {
	const signature = KIND_LIGHT[kind];
	const strength = kindTintStrength(kind);
	const tint = kindTint(kind);
	return {
		angleDeg: signature.angleDeg,
		stops: sky.stops.map((stop, index) => {
			const lit = index === 0;
			const parsed = parseColor(stop.color);
			const alpha = parsed ? parsed.a : 1;
			/* the lit end carries the signature; the dark end only
			   deepens, because the rooms differ in how they are lit and
			   not in what they are made of */
			const scaled = clamp(alpha * (lit ? signature.contrast * 1.25 : 1 + (signature.contrast - 1) * 0.5), 0, 0.86);
			const color = lit && strength > 0 ? mix(stop.color, tint, strength) : stop.color;
			return {color: rgba(color, round(scaled, 4)), position: stop.position};
		}),
	};
}

/** CIE lightness — the space a brightness difference is visible in. */
function lStar(color: string): number {
	const y = relativeLuminance(color);
	return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : y * (24389 / 27);
}

/**
 * Holds the sky below the content standing in front of it.
 *
 * Only the lit end is capped, and it is capped by scaling its alpha
 * rather than by recolouring it: the room keeps its temperature and
 * its direction, it just stops being brighter than the objects in it.
 * The margin is 1.5 L*, the same step the depth-order gate requires
 * between the planes a person reads and reaches for.
 */
function capSkyToContent(sky: BerxGradient, background: string, contentColor: string): BerxGradient {
	const ceiling = lStar(contentColor) - 1.5;
	const first = sky.stops[0];
	const parsed = parseColor(first.color);
	if (!parsed) return sky;
	if (lStar(flatten(first.color, background)) <= ceiling) return sky;

	/* binary search on the alpha: the composite is monotonic in it, and
	   this converges in a dozen steps to well under a tenth of an L* */
	let low = 0;
	let high = parsed.a;
	for (let i = 0; i < 14; i += 1) {
		const mid = (low + high) / 2;
		const composited = lStar(flatten(rgba(first.color, mid), background));
		if (composited > ceiling) high = mid;
		else low = mid;
	}
	return {
		angleDeg: sky.angleDeg,
		stops: sky.stops.map((stop, index) => (index === 0 ? {color: rgba(stop.color, round(low, 4)), position: stop.position} : stop)),
	};
}

/** Which end of the light this kind of room sits at. */
function kindTint(kind: BerxAtmosphereKind): string {
	return KIND_LIGHT[kind].warmth >= 0 ? WARM_LIGHT : COLD_LIGHT;
}

/**
 * How far toward that end.
 *
 * Strong enough to be seen at a glance across a dark scene, and
 * bounded well short of replacing the colour world: this shifts the
 * temperature of the light, it does not repaint the room.
 */
function kindTintStrength(kind: BerxAtmosphereKind): number {
	return round(Math.min(0.55, Math.abs(KIND_LIGHT[kind].warmth) * 0.62), 4);
}

export function resolveAtmosphere(input: BerxAtmosphereInput): BerxAtmosphere {
	const accent = input.accent;
	const bg = input.background || BERX_V9_COLOR.bg;
	const intensity = clamp(input.intensity ?? 0.72, 0.2, 1);
	const flat = input.blurred === false;
	/* Losing blur costs separation, so composition pays it back. */
	const gain = flat ? 1.45 : 1;
	const reduced = input.reducedMotion === true;
	const parallaxOk = input.allowParallax !== false && !reduced;
	const time = input.timeOfDay ?? berxTimeOfDay();
	const t = TIME_LIGHT[time];

	/**
	 * Alpha helper: everything scales with D1's dimming and the
	 * flatness gain.
	 *
	 * The ceiling is 0.75 rather than something lower because the
	 * browser probe measured the consequence of being timid: with the
	 * environment painted faintly, only 41% of a scene's perceptual
	 * structure survived turning the glass off — the blur was doing
	 * the work the composition was supposed to do. The room is
	 * allowed to be a room. What it is not allowed to do is out-shine
	 * the content plane, and that is enforced separately, by
	 * assertContrastHierarchy on the layers and by the probe's
	 * per-scene text-contrast measurement.
	 */
	const a = (base: number) => round(clamp(base * intensity * gain * 1.35, 0, 0.75), 4);

	/* the lit end of the environment: the substrate carried most of the
	   way to the surface colour, so the sky has somewhere to fall from */
	const skyTop = mix(bg, BERX_V9_COLOR.surface, 0.85);
	let sky: BerxGradient;
	let pools: BerxAtmospherePool[];
	let ground: BerxAtmosphereGround | null = null;
	let vignette: number;
	let mediaRole: BerxAtmosphere['mediaRole'];
	let mediaOpacity: number;
	let mediaScrim: number;
	let baseScrim: number;
	let parallaxScale: number;
	let drift: number;
	let description: string;

	switch (input.kind) {
		/**
		 * Identity — Profile, Dating, Creator.
		 * One person, one key light. The pool sits high and centred
		 * where a face is, falls off fast, and the room behind is
		 * close: identity scenes are intimate, not architectural.
		 */
		case 'identity':
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba(mix(skyTop, accent, 0.18), a(0.3)), position: 0},
					{color: rgba(bg, a(0.12)), position: 0.55},
					{color: rgba('#000000', a(0.34)), position: 1},
				],
			};
			pools = [
				pool(0.5, 0.22, 0.72, rgba(accent, a(0.2)), 0.8),
				pool(0.16, 0.08, 0.42, rgba(BERX_V9_COLOR.textPrimary, a(0.06)), 0.5),
			];
			vignette = round(0.42 * gain, 3);
			mediaRole = 'primary';
			mediaOpacity = round(0.55 * intensity + 0.1, 3);
			mediaScrim = 0.72;
			baseScrim = 0;
			parallaxScale = 0.8;
			drift = 3;
			description = 'identity — a single key light on the person, close walls';
			break;

		/**
		 * Location — Places, Business.
		 * A room with a floor. The horizon is what makes a place a
		 * place: the ground plane recedes, the far wall hazes, and
		 * the cover photograph sits in that space rather than behind
		 * a pane of glass.
		 */
		case 'location':
			sky = {
				angleDeg: 172,
				stops: [
					{color: rgba(mix(skyTop, t.tint, 0.22 * t.warmth + 0.08), a(0.32)), position: 0},
					{color: rgba(mix(bg, accent, 0.1), a(0.14)), position: 0.5},
					{color: rgba('#000000', a(0.3)), position: 1},
				],
			};
			pools = [
				pool(0.24, 0.18, 0.66, rgba(mix(accent, t.tint, t.warmth * 0.5), a(0.18)), 0.6),
				pool(0.86, 0.42, 0.5, rgba(BERX_V9_COLOR.textPrimary, a(0.05)), 0.9),
			];
			ground = {horizon: 0.62, color: rgba(mix(bg, '#000000', 0.4), a(0.5)), haze: flat ? 0.3 : 0.55, edge: a(0.16)};
			vignette = round(0.36 * gain, 3);
			mediaRole = 'primary';
			mediaOpacity = round(0.62 * intensity + 0.12, 3);
			mediaScrim = 0.66;
			baseScrim = 0;
			parallaxScale = 1;
			drift = 4;
			description = 'location — ground plane, horizon haze, light from the entrance side';
			break;

		/**
		 * Temporal — Events, Memories, Wrapped.
		 * The sky is the clock. Dawn/day/dusk/night are read from
		 * the device, so an evening event is lit like an evening.
		 * A high horizon keeps the sky dominant: time is the
		 * subject.
		 */
		case 'temporal':
			sky = {
				angleDeg: 178,
				stops: [
					{color: rgba(mix(mix(skyTop, t.tint, 0.34), accent, 0.16), a(0.16 + t.lift * 1.6)), position: 0},
					{color: rgba(mix(bg, t.tint, 0.12), a(0.16)), position: 0.42},
					{color: rgba('#000000', a(0.36)), position: 1},
				],
			};
			pools = [
				pool(0.72, 0.14, 0.8, rgba(t.tint, a(0.16 + t.warmth * 0.1)), 0.45),
				pool(0.2, 0.3, 0.46, rgba(accent, a(0.13)), 0.75),
			];
			ground = {horizon: 0.78, color: rgba(mix(bg, '#000000', 0.55), a(0.44)), haze: 0.7, edge: a(0.12)};
			vignette = round(0.34 * gain, 3);
			mediaRole = 'primary';
			mediaOpacity = round(0.6 * intensity + 0.1, 3);
			mediaScrim = 0.68;
			baseScrim = 0;
			parallaxScale = 0.9;
			drift = 5;
			description = `temporal — sky lit for ${time}, high horizon, time is the subject`;
			break;

		/**
		 * Conversational — Messages.
		 * No photograph. A conversation's environment is attention:
		 * a narrow corridor of light down the middle of the thread,
		 * darker at both edges, so the bubbles sit in a lit column.
		 * Media here would compete with the thing being read.
		 */
		case 'conversational':
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba(mix(bg, accent, 0.08), a(0.18)), position: 0},
					{color: rgba(mix(skyTop, accent, 0.12), a(0.22)), position: 0.4},
					{color: rgba('#000000', a(0.28)), position: 1},
				],
			};
			pools = [
				pool(0.5, 0.46, 0.55, rgba(accent, a(0.15)), 0.35),
				pool(0.5, 0.02, 0.34, rgba(BERX_V9_COLOR.textPrimary, a(0.05)), 0.2),
			];
			vignette = round(0.5 * gain, 3);
			mediaRole = 'none';
			mediaOpacity = 0;
			mediaScrim = 0;
			baseScrim = 0;
			parallaxScale = 0.45;
			drift = 2;
			description = 'conversational — a lit corridor down the thread, edges held back';
			break;

		/**
		 * Immersive — Stories, video, the story viewer, creator work.
		 * The media *is* the room. The lit sky recedes almost to
		 * nothing, the vignette does the framing, and the scrim is
		 * the minimum that keeps overlay text legible.
		 */
		case 'immersive':
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba('#000000', a(0.3)), position: 0},
					{color: rgba(mix(bg, accent, 0.06), a(0.08)), position: 0.5},
					{color: rgba('#000000', a(0.44)), position: 1},
				],
			};
			pools = [pool(0.5, 0.5, 0.95, rgba(accent, a(0.1)), 0.25)];
			vignette = round(0.58 * gain, 3);
			mediaRole = 'primary';
			mediaOpacity = round(0.82 * intensity + 0.16, 3);
			mediaScrim = 0.4;
			baseScrim = 0;
			parallaxScale = 0.3;
			drift = 2;
			description = 'immersive — the media is the room; framing by vignette, not by chrome';
			break;

		/**
		 * Geographic — Explore, Nearby, NOW.
		 * A living field: a wide low horizon, two pools at different
		 * apparent distances so the ground moves at a different rate
		 * from the sky, and the time of day colouring the whole
		 * thing. This is the one that must feel *outdoors*.
		 */
		case 'geographic':
			sky = {
				angleDeg: 175,
				stops: [
					{color: rgba(mix(mix(skyTop, t.tint, 0.28), accent, 0.2), a(0.2 + t.lift)), position: 0},
					{color: rgba(mix(bg, accent, 0.12), a(0.15)), position: 0.46},
					{color: rgba('#000000', a(0.3)), position: 1},
				],
			};
			pools = [
				pool(0.14, 0.24, 0.6, rgba(accent, a(0.17)), 0.5),
				pool(0.82, 0.18, 0.54, rgba(t.tint, a(0.12 + t.warmth * 0.06)), 0.35),
				pool(0.6, 0.76, 0.7, rgba(mix(accent, bg, 0.5), a(0.12)), 1),
			];
			ground = {horizon: 0.5, color: rgba(mix(bg, '#000000', 0.35), a(0.42)), haze: 0.75, edge: a(0.14)};
			vignette = round(0.3 * gain, 3);
			mediaRole = 'supporting';
			mediaOpacity = round(0.48 * intensity + 0.08, 3);
			mediaScrim = 0.62;
			baseScrim = 0;
			parallaxScale = 1;
			drift = 6;
			description = `geographic — open field lit for ${time}, ground and sky at different distances`;
			break;

		/**
		 * Community — Communities, Circles, Connections.
		 * Several pools of comparable weight, overlapping. A
		 * community is not one person and not one place; the light
		 * has more than one source and they meet in the middle.
		 */
		case 'community':
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba(mix(skyTop, accent, 0.16), a(0.24)), position: 0},
					{color: rgba(bg, a(0.12)), position: 0.5},
					{color: rgba('#000000', a(0.3)), position: 1},
				],
			};
			pools = [
				pool(0.26, 0.2, 0.5, rgba(accent, a(0.15)), 0.65),
				pool(0.74, 0.3, 0.5, rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.35), a(0.12)), 0.8),
				pool(0.5, 0.62, 0.56, rgba(accent, a(0.1)), 1),
			];
			vignette = round(0.38 * gain, 3);
			mediaRole = 'supporting';
			mediaOpacity = round(0.5 * intensity + 0.1, 3);
			mediaScrim = 0.68;
			baseScrim = 0;
			parallaxScale = 0.85;
			drift = 4;
			description = 'community — several light sources of equal weight, meeting';
			break;

		/**
		 * Journey — Trips, Experiences.
		 * Perspective is the point. A low vanishing pool, a hard-ish
		 * horizon and the strongest parallax in the system: the
		 * scene should read as somewhere you are going.
		 */
		case 'journey':
			sky = {
				angleDeg: 176,
				stops: [
					{color: rgba(mix(mix(skyTop, t.tint, 0.2), accent, 0.14), a(0.26)), position: 0},
					{color: rgba(mix(bg, accent, 0.08), a(0.12)), position: 0.52},
					{color: rgba('#000000', a(0.34)), position: 1},
				],
			};
			pools = [
				pool(0.5, 0.54, 0.34, rgba(mix(accent, t.tint, t.warmth * 0.4), a(0.22)), 0.3),
				pool(0.5, 0.95, 0.8, rgba(bg, a(0.3)), 1),
			];
			ground = {horizon: 0.54, color: rgba(mix(bg, '#000000', 0.45), a(0.46)), haze: 0.4, edge: a(0.2)};
			vignette = round(0.4 * gain, 3);
			mediaRole = 'primary';
			mediaOpacity = round(0.58 * intensity + 0.1, 3);
			mediaScrim = 0.66;
			baseScrim = 0;
			parallaxScale = 1;
			drift = 5;
			description = 'journey — vanishing point on the horizon, strongest parallax in the system';
			break;

		/**
		 * Premium — Wallet, Points, Rewards, Tickets.
		 * A dark object under a specular sweep. No horizon, no
		 * outdoors: this is a lit display case. The sweep is a
		 * narrow, high-specular band rather than a soft pool, which
		 * is what makes metal read as metal.
		 */
		case 'premium':
			sky = {
				angleDeg: 150,
				stops: [
					{color: rgba(mix(bg, BERX_V9_COLOR.textPrimary, 0.1), a(0.22)), position: 0},
					{color: rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.4), a(0.16)), position: 0.34},
					{color: rgba(bg, a(0.1)), position: 0.62},
					{color: rgba('#000000', a(0.4)), position: 1},
				],
			};
			pools = [
				pool(0.82, 0.1, 0.44, rgba(BERX_V9_COLOR.textPrimary, a(0.09)), 0.4),
				pool(0.3, 0.7, 0.5, rgba(accent, a(0.12)), 0.9),
			];
			vignette = round(0.48 * gain, 3);
			mediaRole = 'none';
			mediaOpacity = 0;
			mediaScrim = 0;
			baseScrim = 0;
			parallaxScale = 0.6;
			drift = 3;
			description = 'premium — specular sweep across a dark object in a lit case';
			break;

		/**
		 * Cinematic — Auth, Onboarding, Welcome.
		 * First entry into BERX. Deep vertical falloff, a single
		 * distant key, the widest vignette in the system. Nothing
		 * competes with the first thing the person is asked to do.
		 */
		case 'cinematic':
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba(mix(bg, accent, 0.2), a(0.34)), position: 0},
					{color: rgba(mix(bg, accent, 0.06), a(0.14)), position: 0.38},
					{color: rgba('#000000', a(0.42)), position: 1},
				],
			};
			pools = [
				pool(0.5, 0.12, 0.9, rgba(accent, a(0.22)), 0.3),
				pool(0.5, 0.88, 0.6, rgba(mix(accent, bg, 0.6), a(0.14)), 0.7),
			];
			vignette = round(0.54 * gain, 3);
			mediaRole = 'none';
			mediaOpacity = 0;
			mediaScrim = 0;
			baseScrim = 0;
			parallaxScale = 0.5;
			drift = 4;
			description = 'cinematic — one distant key, deep falloff, nothing competing with the ask';
			break;

		/**
		 * Social — Home, Feed, Search, Settings and everything whose
		 * subject is a list of other things. A calm, evenly lit room
		 * with a soft ceiling: it must recede, because the content
		 * on it is heterogeneous and carries its own media.
		 */
		case 'social':
		default:
			sky = {
				angleDeg: 180,
				stops: [
					{color: rgba(mix(skyTop, accent, 0.12), a(0.22)), position: 0},
					{color: rgba(bg, a(0.1)), position: 0.52},
					{color: rgba('#000000', a(0.26)), position: 1},
				],
			};
			pools = [
				pool(0.2, 0.12, 0.62, rgba(accent, a(0.13)), 0.55),
				pool(0.88, 0.68, 0.56, rgba(mix(accent, BERX_V9_COLOR.textPrimary, 0.3), a(0.08)), 0.9),
			];
			vignette = round(0.32 * gain, 3);
			mediaRole = 'supporting';
			mediaOpacity = round(0.46 * intensity + 0.08, 3);
			mediaScrim = 0.66;
			baseScrim = 0;
			parallaxScale = 0.75;
			drift = 3;
			description = 'social — an evenly lit room that recedes behind heterogeneous content';
			break;
	}

	/* A room inside a card has no horizon to show. */
	if (input.bounded) {
		ground = null;
		vignette = round(vignette * 0.8, 3);
	}

	/* Graduated quality: the faintest, most distant lamps go first. */
	/* The room's own light signature: direction and temperature, the
	   two things that separate one kind of room from another before
	   anything is placed in it.

	   The lamps carry the same temperature as the sky they hang in. A
	   warm room lit by cold lamps is two rooms, and the pools are the
	   brightest thing in the frame — if the signature does not reach
	   them it does not reach the eye either. */
	sky = applyKindLight(sky, input.kind);
	if (input.contentColor) sky = capSkyToContent(sky, bg, input.contentColor);
	const lampTint = kindTint(input.kind);
	const lampStrength = kindTintStrength(input.kind) * 0.75;
	if (lampStrength > 0) {
		pools = pools.map((p) => ({...p, color: mix(p.color, lampTint, lampStrength)}));
	}

	const poolBudget = Math.max(1, input.maxPools ?? pools.length);
	if (pools.length > poolBudget) {
		pools = [...pools]
			.sort((p1, p2) => alphaOf(p2.color) - alphaOf(p1.color))
			.slice(0, poolBudget)
			.sort((p1, p2) => p1.depth - p2.depth);
	}

	/* Media that is present takes the room's own light down a step so
	   it never becomes two competing environments. */
	if (input.hasMedia && mediaRole !== 'none') {
		pools = pools.map((p) => ({...p, color: fade(p.color, 0.7)}));
		vignette = round(clamp(vignette * 1.1, 0, 0.7), 3);
	}

	return {
		kind: input.kind,
		sky,
		pools,
		ground,
		vignette: round(clamp(vignette, 0, 0.7), 3),
		mediaRole,
		mediaOpacity: input.hasMedia ? round(clamp(mediaOpacity, 0, 1), 3) : 0,
		mediaScrim: input.hasMedia ? mediaScrim : 0,
		baseScrim,
		parallaxScale: parallaxOk ? parallaxScale : 0,
		driftPx: reduced ? 0 : drift,
		description,
		compensatedForFlatness: flat,
	};
}

/** Scales the alpha of an already-resolved rgba() string. */
function fade(color: string, factor: number): string {
	const m = /^rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)$/.exec(color.replace(/\s/g, ''));
	if (!m) return color;
	return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${round(clamp(Number(m[4]) * factor, 0, 1), 4)})`;
}

/**
 * Executable form of the visual-acceptance rule: "if removing blur
 * makes the screen look flat, the implementation is wrong."
 *
 * Flatness is measurable. A scene has depth when its environment
 * carries separated luminance planes, positioned light, and either a
 * ground plane or a vignette strong enough to be the walls. This
 * returns the reasons an atmosphere would read as flat — empty means
 * it survives blur removal.
 */
export function assertAtmosphereDepth(atmosphere: BerxAtmosphere): string[] {
	const problems: string[] = [];
	const skyAlphas = atmosphere.sky.stops.map((s) => alphaOf(s.color));
	const skySpread = Math.max(...skyAlphas) - Math.min(...skyAlphas);
	if (atmosphere.sky.stops.length < 3) {
		problems.push(`sky has ${atmosphere.sky.stops.length} stops; a lit environment needs at least 3`);
	}
	if (skySpread < 0.04) {
		problems.push(`sky luminance spread ${round(skySpread, 4)} is below 0.04 — that is a flat wash`);
	}
	if (atmosphere.pools.length < 1) {
		problems.push('no positioned light: an environment with no source cannot have direction');
	}
	const depths = new Set(atmosphere.pools.map((p) => p.depth));
	if (atmosphere.pools.length > 1 && depths.size < 2) {
		problems.push('every light pool sits at the same apparent distance — the environment is one sheet');
	}
	if (!atmosphere.ground && atmosphere.vignette < 0.25) {
		problems.push(`no ground plane and vignette ${atmosphere.vignette} — the room has neither floor nor walls`);
	}
	return problems;
}

function alphaOf(color: string): number {
	const m = /rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/.exec(color.replace(/\s/g, ''));
	return m ? Number(m[1]) : 1;
}

/* ------------------------------------------------------------------ */
/* Standing in the room                                                */
/* ------------------------------------------------------------------ */

/**
 * How lit a point in the scene is, 0..1.
 *
 * The room has light sources at real positions — that is what pools
 * are — and until now nothing standing in the room knew about them.
 * Every card in a list was lit identically wherever it sat, which is
 * exactly what makes a list of objects read as a list of rectangles:
 * one repeated surface, one repeated highlight, no sense that the
 * objects are anywhere.
 *
 * This samples the room at a point, so an object near the window
 * catches more of the light than one in the corner. It is a falloff
 * around each pool, plus the vignette pulling the edges of the frame
 * down, plus the floor's own bounce where a scene has one — the same
 * three things the atmosphere already paints, read at a point instead
 * of across the whole plane.
 *
 * 0.5 is "as lit as an even wash would have been", so a surface
 * multiplied by this neither brightens nor darkens on average: the
 * light is redistributed across the room, not added to it.
 */
export function berxIlluminationAt(atmosphere: BerxAtmosphere, x: number, y: number): number {
	const px = clamp(x, 0, 1);
	const py = clamp(y, 0, 1);

	let light = 0;
	for (const p of atmosphere.pools) {
		const dx = px - p.x;
		const dy = py - p.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		/* a pool's radius is where it has fallen to nothing; inside it
		   the falloff is smooth rather than linear, because a linear
		   ramp reads as a cone of light rather than as a lamp */
		const reach = Math.max(0.001, p.radius);
		if (distance >= reach) continue;
		const t = 1 - distance / reach;
		/* nearer pools count for more: p.depth is how far back in the
		   room the resolver put this one */
		light += t * t * clamp(p.depth, 0.2, 1);
	}

	/* the walls: the vignette is darkest at the corners, so a point's
	   distance from the centre of the frame costs it light */
	const cx = px - 0.5;
	const cy = py - 0.5;
	const fromCentre = Math.min(1, Math.sqrt(cx * cx + cy * cy) / 0.7071);
	const walls = atmosphere.vignette * fromCentre * fromCentre;

	/* the floor bounces: a scene with a ground plane is brighter just
	   above the horizon than a scene without one */
	const bounce = atmosphere.ground && py > atmosphere.ground.horizon ? 0.12 * (1 - atmosphere.ground.haze) : 0;

	return round(clamp(0.5 + light * 0.55 - walls * 0.4 + bounce, 0.15, 1), 4);
}

/**
 * The room's own colour at a point, composited over the substrate.
 *
 * The companion to berxIlluminationAt, and the answer to a defect the
 * pixels showed rather than the numbers: a surface that has lost its
 * translucency — every surface on React Native, and every surface on
 * a device with no backdrop filter — is flattened over the substrate,
 * which is correct only where the substrate is what is actually
 * behind it. In a lit room it is not. Measured on a real scene, the
 * room between two cards read 12 L* brighter than the cards standing
 * in front of it: the content plane rendered as holes cut in the wall.
 *
 * Given what is really behind a surface, the runtime can flatten that
 * surface's own fill against it instead, and an object standing in
 * the light is lighter than the wall, which is what standing in the
 * light means.
 */
export function berxRoomColorAt(atmosphere: BerxAtmosphere, background: string, x: number, y: number): string {
	const px = clamp(x, 0, 1);
	const py = clamp(y, 0, 1);
	let color = background;

	/**
	 * The sky, sampled along its own axis. The gradient's angle is a
	 * CSS angle — 180° runs straight down — so the position along it
	 * is the point projected onto that direction, which is what makes
	 * a sky lit from 118° brighten toward the left rather than toward
	 * the top.
	 */
	const rad = (atmosphere.sky.angleDeg * Math.PI) / 180;
	const axis = clamp(0.5 + (px - 0.5) * Math.sin(rad) - (py - 0.5) * Math.cos(rad), 0, 1);
	const stops = atmosphere.sky.stops;
	for (let i = 0; i < stops.length - 1; i += 1) {
		const from = stops[i];
		const to = stops[i + 1];
		if (axis > to.position && i < stops.length - 2) continue;
		const span = Math.max(1e-4, to.position - from.position);
		const t = clamp((axis - from.position) / span, 0, 1);
		color = flatten(mixTranslucent(from.color, to.color, t), color);
		break;
	}

	/* the lamps, in front of the sky, each falling off to nothing at
	   its own radius */
	for (const p of atmosphere.pools) {
		const dx = px - p.x;
		const dy = py - p.y;
		const reach = Math.max(0.001, p.radius);
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (distance >= reach) continue;
		const t = 1 - distance / reach;
		color = flatten(scaleAlpha(p.color, t * t * clamp(p.depth, 0.2, 1)), color);
	}

	/* the floor, where the scene has one */
	if (atmosphere.ground && py > atmosphere.ground.horizon) {
		const depth = clamp((py - atmosphere.ground.horizon) / Math.max(1e-4, 1 - atmosphere.ground.horizon), 0, 1);
		color = flatten(scaleAlpha(atmosphere.ground.color, depth * (1 - atmosphere.ground.haze * 0.5)), color);
	}

	/* and the walls, darkest at the corners */
	const cx = px - 0.5;
	const cy = py - 0.5;
	const fromCentre = Math.min(1, Math.sqrt(cx * cx + cy * cy) / 0.7071);
	const wall = atmosphere.vignette * fromCentre * fromCentre;
	if (wall > 0.001) color = flatten(rgba('#000000', round(clamp(wall, 0, 0.9), 4)), color);

	return color;
}

/** Interpolates two translucent colours, alpha included. */
function mixTranslucent(from: string, to: string, t: number): string {
	const a = parseColor(from);
	const b = parseColor(to);
	if (!a || !b) return from;
	return rgba(mix(from, to, t), round(a.a + (b.a - a.a) * t, 4));
}

function scaleAlpha(color: string, factor: number): string {
	const parsed = parseColor(color);
	if (!parsed) return color;
	return rgba(color, round(clamp(parsed.a * factor, 0, 1), 4));
}
