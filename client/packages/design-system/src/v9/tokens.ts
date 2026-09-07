/**
 * BERX V9 TOKENS — the archive's own numbers, as code.
 *
 * SOURCE OF TRUTH: `berx.tokens.v9.json` in this folder is the file
 * shipped in BERX_5D_ULTIMATE_V9 (02_DESIGN_SYSTEM_V2/tokens), vendored
 * byte-for-byte rather than retyped, so these values cannot drift from
 * the archive by transcription. This module is the typed surface over
 * it.
 *
 * WHAT THIS CHANGES, AND WHAT IT DOES NOT.
 * The archive's Visual DNA specifies one environment: a dark cinematic
 * one (bg #07080A, surface #101216, accent #4FD6E8). Those numbers are
 * adopted here verbatim as BERX's NIGHT environment, replacing the
 * previous #05060A/#00E5CC pair.
 *
 * The archive does not describe a light environment — it neither
 * specifies nor forbids one. BERX already ships a real Day environment
 * (see tokens/index.ts), built and verified earlier at the owner's
 * explicit direction. Deleting working, requested behaviour because a
 * design archive is silent about it would be a regression dressed up as
 * compliance, so Day is kept and derived from these same tokens by the
 * same measured-contrast math the theme already uses. Night is the
 * archive's; Day is the archive's palette solved for a light ground.
 *
 * DEPTH. `depth_px` is the archive's real D0-D5 z-scale in pixels. It
 * is the canonical depth ladder from here on; see ./depth.ts for how it
 * projects, and tokens/depth.ts's own note on the 0-6 scale it
 * supersedes.
 */
import raw from './berx.tokens.v9.json';

export type BerxV9Depth = 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
export type BerxV9MotionTier = 'micro' | 'fast' | 'standard' | 'spatial' | 'cinematic' | 'ambient';
export type BerxV9Material = 'ClearGlass' | 'FrostGlass' | 'DeepGlass' | 'LiquidGlass' | 'Crystal' | 'DarkMetal';

export interface BerxV9Tokens {
	colors: {bg: string; surface: string; text: string; textSecondary: string; textTertiary: string; accent: string; accentSoft: string; danger: string; success: string; warning: string};
	glass: {soft: string; standard: string; strong: string; border: string};
	blur_px: {soft: number; surface: number; deep: number; hero: number};
	depth_px: Record<BerxV9Depth, number>;
	radii_px: {xs: number; sm: number; md: number; lg: number; xl: number; pill: number};
	spacing_px: number[];
	type: Record<'displayXL' | 'displayL' | 'displayM' | 'h1' | 'h2' | 'body' | 'caption' | 'micro', {size: number; lineHeight: number; weight: number}>;
	motion_ms: Record<BerxV9MotionTier, number>;
}

export const BERX_V9: BerxV9Tokens = raw as BerxV9Tokens;

/** The archive's D0-D5 order, as an array — the canonical layer order every scene contract declares. */
export const BERX_V9_LAYER_ORDER: BerxV9Depth[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5'];

/**
 * Parallax factor per depth, from MOTION_SPEC_V2 ("D0 = 0.10-0.15x,
 * D1 = 0.20x, D2 = 0.35x, D3 = 0.65x, D4 = 1.00x, D5 =
 * interaction-bound"). D5 is null rather than a number on purpose: the
 * archive binds it to interaction, so a caller must supply the real
 * interaction signal instead of inheriting a scroll factor.
 */
export const BERX_V9_PARALLAX: Record<BerxV9Depth, number | null> = {
	D0: 0.15,
	D1: 0.2,
	D2: 0.35,
	D3: 0.65,
	D4: 1,
	D5: null,
};

/** "Cards can tilt max ±2.5° on pointer/gyro interaction" — MOTION_SPEC_V2. */
export const BERX_V9_TILT_MAX_DEG = 2.5;

/** The archive's own D0-D5 role names (DEPTH_MATERIAL_SYSTEM.md), kept so call sites read as intent. */
export const BERX_V9_DEPTH_ROLE: Record<BerxV9Depth, string> = {
	D0: 'atmosphere — blurred environment, gradient, noise',
	D1: 'environment — map, architecture, background objects',
	D2: 'media — portraits, video, places, products',
	D3: 'glass — translucent interactive surfaces',
	D4: 'foreground — buttons, labels, avatars, navigation',
	D5: 'energy — light, live pulse, focus feedback',
};

/**
 * Material recipes. The archive names six materials and describes them
 * in prose (DEPTH_MATERIAL_SYSTEM.md); this turns that prose into the
 * two numbers a surface actually needs — which glass fill it uses and
 * how much backdrop blur — both taken from the archive's own token
 * scales rather than invented.
 */
export const BERX_V9_MATERIAL: Record<BerxV9Material, {fill: keyof BerxV9Tokens['glass']; blur: keyof BerxV9Tokens['blur_px']; note: string}> = {
	ClearGlass: {fill: 'soft', blur: 'soft', note: 'default translucent surface'},
	FrostGlass: {fill: 'standard', blur: 'surface', note: 'content-carrying glass'},
	DeepGlass: {fill: 'strong', blur: 'deep', note: 'hero/immersive glass'},
	LiquidGlass: {fill: 'standard', blur: 'deep', note: 'moving/reactive glass'},
	Crystal: {fill: 'strong', blur: 'hero', note: 'hero and identity moments only'},
	DarkMetal: {fill: 'strong', blur: 'surface', note: 'premium business/system objects'},
};

/**
 * MOTION ROLES -> TIERS.
 *
 * The archive's scene contracts do not name tiers. All 300 declare the
 * same five-role motion vocabulary — `spatialEnter`, `exit`, `focus`,
 * `ambient`, `crossFade` — while the tier table (BERX_MOTION) is the
 * repository's, so without this map the two halves never meet and
 * "motion works" is unverifiable. That gap was real: nothing translated
 * `exit` or `focus` into a duration.
 *
 * The assignments are the tiers' own stated roles, not preferences:
 *   spatialEnter -> spatial   an object arriving THROUGH depth
 *   exit         -> standard  leaving is a content change, and must be
 *                             quicker than arriving or the screen feels
 *                             reluctant to let go
 *   focus        -> micro     focus is a touch-response, the tactile tier
 *   ambient      -> ambient   continuous drift, never input-driven
 *   crossFade    -> micro     the Reduced Motion collapse; reduce() caps
 *                             it at 120ms, which is the contract's own
 *                             "replace movement with a short fade"
 */
export const BERX_V9_MOTION_ROLE = {
	spatialEnter: 'spatial',
	exit: 'standard',
	focus: 'micro',
	ambient: 'ambient',
	crossFade: 'micro',
} as const;

export type BerxV9MotionRole = keyof typeof BERX_V9_MOTION_ROLE;
