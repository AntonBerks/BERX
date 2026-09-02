/**
 * BERX COLOR WORLD ENGINE — one BERX, four real atmospheres.
 *
 * Every existing screen already reads its palette through
 * `useBerxColors()`/`useBerxGlass()` (see theme/index.tsx) rather than
 * importing `colors` directly — that migration is what makes a real,
 * app-wide World system possible without touching every screen: swap
 * what this file hands the theme provider, and the whole app follows.
 *
 * `night_ice` IS today's shipped palette (`colors`/`glassNight`/the
 * existing `BERX_SCENE`), not a copy of it — selecting it is a no-op
 * against everything already built and verified. The other three are
 * new, real, distinct token sets in the same shape, not reskins.
 *
 * BRAND VS. ATMOSPHERE (why SUN gets amber but the logo doesn't
 * silently follow it everywhere): the existing cinematic palette file
 * (`palette.ts`, see its own header) already establishes the pattern
 * this follows — "BERX cyan is the key light in every palette... the
 * identity is never diluted no matter how rich the scene gets." Three
 * of these four worlds keep a cyan-family thread running through
 * `scene.light` and/or `colors.accent` for exactly that reason. SUN is
 * the deliberate exception the brief asks for by name (amber/gold is
 * its whole identity) — it is one atmosphere out of four, not a
 * rebrand: BerxMark/BerxWordmark's own default `light` stays BERX
 * cyan regardless of which world is active, so the static brand asset
 * (app icon, marketing) never depends on a runtime choice.
 *
 * No purple/violet anywhere in this file, in any world.
 */
import {colors, glassNight} from './tokens';
import type {BerxColorTokens, BerxGlassLevelTokens} from './tokens';

export type BerxWorld = 'night_ice' | 'day_ice' | 'sun' | 'aurora';

/**
 * The reduced, ACTUALLY-CONSUMED scene shape: exactly the props
 * BerxAura/BerxLens/BerxOrb take (ground/glow/counter/light/object/
 * fill). `palette.ts` also defines a richer `BerxScenePalette` (sky
 * gradient, bloom, ink, water...) but nothing in the app renders that
 * shape today — building a new one on an unused contract would just
 * be a second dead surface. This one drives real, live components.
 */
export interface BerxWorldScene {
	/** BerxAura.ground — the near-solid ground the world's light sits on. */
	ground: string;
	/** BerxAura.glow — the main light pool. */
	glow: string;
	/** BerxAura.counter — the secondary, cooler/warmer pool. */
	counter: string;
	/** BerxLens/BerxOrb/BerxMark .light — the world's key light. */
	light: string;
	/** BerxLens.body / BerxOrb.body — the glass object's own body colour. */
	object: string;
	/** BerxOrb.fill — secondary bounce light on the object. */
	fill: string;
}

export interface BerxWorldDefinition {
	id: BerxWorld;
	/** Shown on the World Select screen. */
	name: string;
	tagline: string;
	colors: BerxColorTokens;
	glass: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens>;
	scene: BerxWorldScene;
}

/* ------------------------------------------------------------------ */
/* NIGHT / ICE — today's shipped BERX, unchanged.                      */
/* ------------------------------------------------------------------ */

const NIGHT_ICE_SCENE: BerxWorldScene = {
	ground: '#080A0F',
	glow: '#2E7C8C',
	counter: '#3B3F7A',
	light: '#4FD6E8',
	object: '#101620',
	fill: '#3E8FD9',
};

/* ------------------------------------------------------------------ */
/* DAY / ICE — cold daylight: silver, ice glass, clean cyan light.     */
/* ------------------------------------------------------------------ */

const DAY_ICE_COLORS: BerxColorTokens = {
	black: '#12181C',
	bg: '#EEF4F6',
	graphite: '#E2ECEF',

	glass1: 'rgba(10,20,24,0.035)',
	glass2: 'rgba(10,20,24,0.06)',
	glass3: 'rgba(10,20,24,0.09)',
	surface: 'rgba(10,20,24,0.06)',
	surface2: 'rgba(10,20,24,0.09)',

	border: 'rgba(10,20,24,0.10)',
	borderSoft: 'rgba(10,20,24,0.07)',
	borderStrong: 'rgba(10,20,24,0.17)',

	white: '#12181C',
	text: '#12181C',
	textDim: 'rgba(18,24,28,0.62)',
	textFaint: 'rgba(18,24,28,0.36)',

	// Cold, saturated cyan-teal — a different weight from Night's bright
	// cyan (which fails contrast on a light ground; see colorsDay's own
	// comment on why Day needs a deepened accent), but the same hue.
	accent: '#0E93AD',
	accentHover: '#12A9C6',
	accentSoft: 'rgba(14,147,173,0.14)',
	accentSecondary: '#0E93AD',
	accentSecondarySoft: 'rgba(14,147,173,0.14)',
	onAccent: '#EEF4F6',
	mediaScrim: '#07080A',
	onMedia: '#F5F5F7',
	onMediaDim: 'rgba(245,245,247,0.72)',
	onMediaFaint: 'rgba(245,245,247,0.45)',
	accentOnMedia: '#7FE8F2',

	danger: '#C23B3D',
	success: '#1F9E64',

	glassBusiness: 'rgba(10,20,24,0.035)',
	glassBusinessBorder: 'rgba(10,20,24,0.08)',
	glassBusinessHairline: 'rgba(10,20,24,0.13)',
	scrimTop: 'rgba(238,244,246,0)',
	scrimBottom: 'rgba(238,244,246,0.92)',
} as unknown as BerxColorTokens;

const DAY_ICE_GLASS: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(240,250,252,0.60)', border: 'rgba(10,25,30,0.06)', hairline: 'rgba(255,255,255,0.90)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(240,250,252,0.76)', border: 'rgba(10,25,30,0.09)', hairline: 'rgba(255,255,255,0.97)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(240,250,252,0.88)', border: 'rgba(10,25,30,0.12)', hairline: 'rgba(255,255,255,1.0)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(236,247,250,0.95)', border: 'rgba(10,25,30,0.16)', hairline: 'rgba(255,255,255,1.0)', blurRadius: 32, radius: 28},
};

const DAY_ICE_SCENE: BerxWorldScene = {
	ground: '#EAF3F5',
	glow: '#8FD9E8',
	counter: '#C9E4EC',
	light: '#0E93AD',
	object: '#DCEEF2',
	fill: '#3E8FD9',
};

/* ------------------------------------------------------------------ */
/* SUN — warm daylight: amber/gold, soft glow, warm glass.             */
/* ------------------------------------------------------------------ */

const SUN_COLORS: BerxColorTokens = {
	black: '#241C0F',
	bg: '#FBF3E4',
	graphite: '#F3E4C8',

	glass1: 'rgba(60,40,10,0.035)',
	glass2: 'rgba(60,40,10,0.06)',
	glass3: 'rgba(60,40,10,0.09)',
	surface: 'rgba(60,40,10,0.06)',
	surface2: 'rgba(60,40,10,0.09)',

	border: 'rgba(60,40,10,0.11)',
	borderSoft: 'rgba(60,40,10,0.08)',
	borderStrong: 'rgba(60,40,10,0.18)',

	white: '#241C0F',
	text: '#241C0F',
	textDim: 'rgba(36,28,15,0.64)',
	textFaint: 'rgba(36,28,15,0.38)',

	// The one real amber accent in the system — SUN's defining trait,
	// not the BERX brand accent (see this file's own header).
	accent: '#C9862E',
	accentHover: '#DE9A3E',
	accentSoft: 'rgba(201,134,46,0.16)',
	accentSecondary: '#C9862E',
	accentSecondarySoft: 'rgba(201,134,46,0.16)',
	onAccent: '#241C0F',
	mediaScrim: '#07080A',
	onMedia: '#F5F5F7',
	onMediaDim: 'rgba(245,245,247,0.72)',
	onMediaFaint: 'rgba(245,245,247,0.45)',
	accentOnMedia: '#F5C77E',

	danger: '#C1432E',
	success: '#3F9E4E',

	glassBusiness: 'rgba(60,40,10,0.04)',
	glassBusinessBorder: 'rgba(60,40,10,0.09)',
	glassBusinessHairline: 'rgba(60,40,10,0.15)',
	scrimTop: 'rgba(251,243,228,0)',
	scrimBottom: 'rgba(251,243,228,0.92)',
} as unknown as BerxColorTokens;

const SUN_GLASS: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(255,248,232,0.60)', border: 'rgba(60,40,10,0.07)', hairline: 'rgba(255,255,255,0.90)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(255,248,232,0.76)', border: 'rgba(60,40,10,0.10)', hairline: 'rgba(255,255,255,0.97)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(255,248,232,0.88)', border: 'rgba(60,40,10,0.13)', hairline: 'rgba(255,255,255,1.0)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(253,244,224,0.95)', border: 'rgba(60,40,10,0.17)', hairline: 'rgba(255,255,255,1.0)', blurRadius: 32, radius: 28},
};

const SUN_SCENE: BerxWorldScene = {
	ground: '#FBF0DC',
	glow: '#F0C77A',
	counter: '#F6DDB0',
	light: '#C9862E',
	object: '#F3E2C0',
	fill: '#E8A94A',
};

/* ------------------------------------------------------------------ */
/* AURORA — dark, flowing cyan/teal/green atmospheric light.           */
/* ------------------------------------------------------------------ */

const AURORA_COLORS: BerxColorTokens = {
	black: '#05100E',
	bg: '#05100E',
	graphite: '#0D1D1A',

	glass1: 'rgba(190,255,235,0.035)',
	glass2: 'rgba(190,255,235,0.06)',
	glass3: 'rgba(190,255,235,0.09)',
	surface: 'rgba(190,255,235,0.06)',
	surface2: 'rgba(190,255,235,0.09)',

	border: 'rgba(190,255,235,0.09)',
	borderSoft: 'rgba(190,255,235,0.07)',
	borderStrong: 'rgba(190,255,235,0.15)',

	white: '#ffffff',
	text: '#EFFBF7',
	textDim: 'rgba(239,251,247,0.64)',
	textFaint: 'rgba(239,251,247,0.38)',

	// Teal-green — aurora's signature, still the cyan family (a ~25°
	// hue shift, not a different colour identity).
	accent: '#3FE0B0',
	accentHover: '#66EAC4',
	accentSoft: 'rgba(63,224,176,0.16)',
	accentSecondary: '#3FE0B0',
	accentSecondarySoft: 'rgba(63,224,176,0.16)',
	onAccent: '#05100E',
	mediaScrim: '#05100E',
	// Pure, world-invariant white — same value every other world uses.
	// onMedia sits over photos/video, which don't change colour with the
	// app's theme, so it must not carry this world's own tint either
	// (see tokens/index.ts's own comment on why Night's onMedia is
	// "deliberately IDENTICAL" to Day's).
	onMedia: '#F5F5F7',
	onMediaDim: 'rgba(245,245,247,0.72)',
	onMediaFaint: 'rgba(245,245,247,0.45)',
	accentOnMedia: '#3FE0B0',

	danger: '#FF5D6C',
	success: '#3FE0B0',

	glassBusiness: 'rgba(190,255,235,0.04)',
	glassBusinessBorder: 'rgba(190,255,235,0.08)',
	glassBusinessHairline: 'rgba(190,255,235,0.13)',
	scrimTop: 'rgba(5,16,14,0)',
	scrimBottom: 'rgba(5,16,14,0.92)',
} as unknown as BerxColorTokens;

const AURORA_GLASS: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(150,255,220,0.045)', border: 'rgba(150,255,220,0.08)', hairline: 'rgba(150,255,220,0.12)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(150,255,220,0.075)', border: 'rgba(150,255,220,0.12)', hairline: 'rgba(150,255,220,0.18)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(150,255,220,0.10)', border: 'rgba(150,255,220,0.16)', hairline: 'rgba(150,255,220,0.24)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(6,22,19,0.78)', border: 'rgba(150,255,220,0.20)', hairline: 'rgba(150,255,220,0.30)', blurRadius: 32, radius: 28},
};

const AURORA_SCENE: BerxWorldScene = {
	ground: '#04120F',
	glow: '#3FE0B0',
	counter: '#4FD6E8',
	light: '#3FE0B0',
	object: '#0B1F1A',
	fill: '#4FD6E8',
};

/* ------------------------------------------------------------------ */

export const BERX_WORLDS: Record<BerxWorld, BerxWorldDefinition> = {
	night_ice: {
		id: 'night_ice',
		name: 'Night · Ice',
		tagline: 'Глубокий чёрный, холодный cyan, кинематографичная глубина.',
		colors,
		glass: glassNight,
		scene: NIGHT_ICE_SCENE,
	},
	day_ice: {
		id: 'day_ice',
		name: 'Day · Ice',
		tagline: 'Ледяное стекло, серебро, чистый холодный свет.',
		colors: DAY_ICE_COLORS,
		glass: DAY_ICE_GLASS,
		scene: DAY_ICE_SCENE,
	},
	sun: {
		id: 'sun',
		name: 'Sun',
		tagline: 'Тёплый свет, золото, мягкое премиальное стекло.',
		colors: SUN_COLORS,
		glass: SUN_GLASS,
		scene: SUN_SCENE,
	},
	aurora: {
		id: 'aurora',
		name: 'Aurora',
		tagline: 'Северное сияние — cyan, teal, зелёный, текучий свет.',
		colors: AURORA_COLORS,
		glass: AURORA_GLASS,
		scene: AURORA_SCENE,
	},
};

export const BERX_WORLD_ORDER: BerxWorld[] = ['night_ice', 'day_ice', 'sun', 'aurora'];

/**
 * `colorsDay`/`glassDay` (tokens/index.ts) are superseded by `day_ice`
 * for live theming — left in place in tokens/index.ts rather than
 * deleted, since removing exported tokens isn't this pass's job, but
 * no longer read from here.
 */
export function getBerxWorld(id: BerxWorld): BerxWorldDefinition {
	return BERX_WORLDS[id] ?? BERX_WORLDS.night_ice;
}
