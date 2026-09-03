/**
 * BERX THEME TOKENS — "Obsidian & Aurora".
 *
 * Pure TypeScript, no React/React Native/UI-framework import — this
 * file is a plain data module, safe to import from anywhere (a build
 * script, a native module, a design tool) without pulling in the app.
 *
 * NOT the app's live runtime. `theme/index.tsx` (a sibling directory,
 * not this file — see its own header) is what every screen actually
 * reads via useBerxColors()/useBerxGlass(), and it stays Night-only,
 * hardcoded, non-switchable: that architectural decision — one fixed
 * BERX identity, not a picker — was never part of the palette
 * override that produced this file, so it stands unchanged here too.
 * `getTheme` below is a real, correct, standalone utility matching
 * the exact shape asked for — nothing in the shipped app currently
 * calls it to switch anything live.
 *
 * This file is intentionally NOT named `theme.ts` at the design-system
 * package's own root: `src/theme/` already exists there as that live
 * runtime module, and every screen already imports it as `'../theme'`
 * — a second `src/theme.ts` alongside it would collide in module
 * resolution and could silently redirect those existing imports away
 * from the real runtime hooks. Living beside `tokens/index.ts` (whose
 * actual colour/glass/radius/duration VALUES this file packages into
 * the shape below) avoids that collision without an awkward name.
 */

export type BerxThemeMode = 'auto' | 'day' | 'night';

export type BerxAccentKey = 'aquamarine' | 'purple' | 'pink' | 'gold' | 'emerald';

/** Obsidian & Aurora's five named accent colours. */
export const accentColors: Record<BerxAccentKey, string> = {
	aquamarine: '#00E5CC',
	purple: '#8B5CF6',
	pink: '#FF4D8D',
	/** Reserved for premium — see the spec this file implements. */
	gold: '#E6B800',
	emerald: '#00C896',
};

const background = {
	day: '#12141C',
	night: '#05060A',
} as const;

const text = {
	primary: '#F5F7FA',
	secondary: '#A8B0C0',
} as const;

/** White at the glass-surface alpha RANGE for each mode — a range, not one value, per the spec ("8–15%" / "12–20%"); a caller picks a point in it (e.g. `glass.night.max` for the densest panel). */
const glass = {
	day: {min: 'rgba(255,255,255,0.08)', max: 'rgba(255,255,255,0.15)'},
	night: {min: 'rgba(255,255,255,0.12)', max: 'rgba(255,255,255,0.20)'},
} as const;

const border = 'rgba(255,255,255,0.20)';

const fonts = {
	heading: 'Space Grotesk',
	data: 'JetBrains Mono',
	body: 'Inter',
} as const;

const radii = {
	button: 16,
	card: 20,
} as const;

/**
 * Two real layers, both a structured {x,y,blur,color} triple (portable
 * to any renderer) and the literal CSS `box-shadow` string the spec
 * itself gave, so a caller on web can use either without this file
 * silently picking one representation for them.
 */
const shadow = {
	layer1: {offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(0,0,0,0.3)', css: '0 4px 12px rgba(0,0,0,0.3)'},
	layer2: {offsetX: 0, offsetY: 12, blur: 32, color: 'rgba(0,0,0,0.5)', css: '0 12px 32px rgba(0,0,0,0.5)'},
} as const;

/** Seconds, matching the spec's own unit — not milliseconds. */
const duration = {
	micro: 0.2,
	normal: 0.4,
	slow: 0.8,
	spring: {response: 0.4, damping: 0.7},
} as const;

export const theme = {
	themeMode: 'auto' as BerxThemeMode,
	primaryAccent: 'aquamarine' as BerxAccentKey,
	background,
	text,
	glass,
	border,
	accent: accentColors,
	fonts,
	radii,
	shadow,
	duration,
} as const;

export type BerxTheme = typeof theme;

export interface BerxResolvedTheme {
	mode: 'day' | 'night';
	background: string;
	text: typeof text;
	glass: {min: string; max: string};
	border: string;
	accent: string;
	accentKey: BerxAccentKey;
	fonts: typeof fonts;
	radii: typeof radii;
	shadow: typeof shadow;
	duration: typeof duration;
}

/**
 * Resolves a complete theme for one mode/accent pair.
 *
 * `'auto'` has no OS/system source to read in a pure-data module with
 * no platform import — it resolves to `'night'`, the same fixed
 * default the app's own live runtime uses (see this file's own
 * header), rather than guessing at a device API this file cannot
 * import.
 */
export function getTheme(mode: BerxThemeMode, accent: BerxAccentKey): BerxResolvedTheme {
	const resolvedMode: 'day' | 'night' = mode === 'auto' ? 'night' : mode;
	return {
		mode: resolvedMode,
		background: background[resolvedMode],
		text,
		glass: glass[resolvedMode],
		border,
		accent: accentColors[accent],
		accentKey: accent,
		fonts,
		radii,
		shadow,
		duration,
	};
}
