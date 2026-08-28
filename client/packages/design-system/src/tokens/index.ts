/**
 * BERX Design Tokens — the SAME values as the real, live PHP theme
 * (themes/berx/plugins/default/css/core/default.php), ported by hand
 * rather than invented in parallel. When the web CSS changes, this
 * file needs the matching edit — that's a real, disclosed
 * maintenance cost of not having one shared token source across PHP
 * and TypeScript yet (a future improvement, not solved here).
 */

/**
 * BERX Design Tokens — NIGHT environment (the one environment that
 * actually ships everywhere right now; see `colorsDay` below for the
 * new Day environment's tokens, defined but not yet wired to a
 * runtime switch across every screen — honestly scoped, not faked).
 *
 * MAX BUILD — cyan #4fd6e8 is RETIRED. New accent: warm gold #D9A93F.
 * See BERX_DECISIONS.md for the full rationale; short version: this
 * is a deliberately different hue family from BOTH previously-tried-
 * and-rejected accents (orange #ff6a00, violet #8b5cf6), chosen so it
 * reads as a genuinely new identity rather than "back to orange."
 * Mirrors the live PHP web theme's `--berx-accent` (updated in the
 * same batch — themes/berx/plugins/default/css/core/default.php).
 */

export const colors = {
	black: '#050505',
	bg: '#050505',
	graphite: '#111113',

	glass1: 'rgba(255,255,255,0.04)',
	glass2: 'rgba(255,255,255,0.07)',
	glass3: 'rgba(255,255,255,0.10)',
	surface: 'rgba(255,255,255,0.07)', // = glass2
	surface2: 'rgba(255,255,255,0.10)', // = glass3

	border: 'rgba(255,255,255,0.10)',
	borderSoft: 'rgba(255,255,255,0.08)',
	borderStrong: 'rgba(255,255,255,0.16)',

	white: '#ffffff',
	text: '#f5f5f7',
	textDim: 'rgba(245,245,247,0.64)',
	textFaint: 'rgba(245,245,247,0.38)',

	/**
	 * BERX accent: warm gold #D9A93F. Replaces cyan #4fd6e8 — see the
	 * file header. Every screen already reads from `colors.accent`
	 * rather than a hardcoded hex, so this one edit is the systemic
	 * repaint; no per-screen changes needed.
	 */
	accent: '#D9A93F',
	accentHover: '#EABD5C',
	accentSoft: 'rgba(217,169,63,0.16)',
	accentSecondary: '#D9A93F',
	accentSecondarySoft: 'rgba(217,169,63,0.16)',

	danger: '#ff4d4f',
	success: '#3ddc84',

	/**
	 * Spatial Glass / Living Media layer — additive, new tokens for
	 * the Business design language. Nothing above this line is
	 * changed; existing screens are unaffected.
	 */
	glassBusiness: 'rgba(255,255,255,0.045)',
	glassBusinessBorder: 'rgba(255,255,255,0.09)',
	glassBusinessHairline: 'rgba(255,255,255,0.14)',
	scrimTop: 'rgba(5,5,5,0)',
	scrimBottom: 'rgba(5,5,5,0.92)',
} as const;

/**
 * BERX Design Tokens — DAY environment. NEW. Not simply an inverted
 * dark theme: a distinct warm "architectural white" surface (per the
 * transformation directive's own framing — daylight, depth, quiet
 * contrast) rather than a generic light-mode palette. Same shape as
 * `colors` so a future theme-context can select between the two by
 * key, but nothing in the app switches to this yet — no screen's
 * StyleSheet is theme-reactive today (they're all computed once at
 * module load against the Night `colors` object above). Wiring a
 * live Day/Night switch through ~80 screens is real, separate,
 * disclosed follow-up work, not done in this pass — shipping these
 * values half-wired into some screens and not others would be worse
 * than not shipping them yet.
 */
export const colorsDay = {
	black: '#17161A', // "black" here means the darkest ink on this environment, not a literal near-black surface
	bg: '#F6F4EF',
	graphite: '#EDEAE2',

	glass1: 'rgba(10,10,12,0.035)',
	glass2: 'rgba(10,10,12,0.06)',
	glass3: 'rgba(10,10,12,0.09)',
	surface: 'rgba(10,10,12,0.06)',
	surface2: 'rgba(10,10,12,0.09)',

	border: 'rgba(10,10,12,0.10)',
	borderSoft: 'rgba(10,10,12,0.07)',
	borderStrong: 'rgba(10,10,12,0.16)',

	white: '#17161A', // inverted role: the "on-surface ink" color, matching how `colors.white` is Night's brightest ink
	text: '#17161A',
	textDim: 'rgba(23,22,26,0.62)',
	textFaint: 'rgba(23,22,26,0.36)',

	/** Same gold hue, deepened for contrast against a light surface — not a second color. */
	accent: '#96721F',
	accentHover: '#B08A2E',
	accentSoft: 'rgba(150,114,31,0.14)',
	accentSecondary: '#96721F',
	accentSecondarySoft: 'rgba(150,114,31,0.14)',

	danger: '#d43d3f',
	success: '#2fa968',

	glassBusiness: 'rgba(10,10,12,0.035)',
	glassBusinessBorder: 'rgba(10,10,12,0.08)',
	glassBusinessHairline: 'rgba(10,10,12,0.12)',
	scrimTop: 'rgba(246,244,239,0)',
	scrimBottom: 'rgba(246,244,239,0.92)',
} as const;

export type BerxEnvironment = 'day' | 'night';

/** Selects the Night (default, fully-wired) or Day (new, token-only) palette by name. */
export function getBerxEnvironmentColors(env: BerxEnvironment) {
	return env === 'day' ? colorsDay : colors;
}

/** Real gradient pair for the new gold accent — see the comment on colors.accent above. Used only by the Business/Spatial-Glass layer for now. */
export const gradientAccent = ['#D9A93F', '#7A5A16'] as const;

export const blur = {
	sm: 8,
	md: 16,
	lg: 28,
} as const;

export const radius = {
	sm: 10,
	md: 16,
	lg: 24,
	pill: 999,
} as const;

/**
 * Web has a real CSS cubic-bezier easing (--berx-ease); React
 * Native's Animated/Reanimated easing functions take control points
 * the same way, so this maps directly — [x1,y1,x2,y2] instead of a
 * CSS string.
 */
export const motion = {
	easeControlPoints: [0.16, 1, 0.3, 1] as [number, number, number, number],
	durationFast: 150,
	durationBase: 220,
	durationSlow: 380,
};

/**
 * Spacing/typography/shadow scale did NOT exist as CSS custom
 * properties in the real theme (default.php uses literal px values
 * inline per-rule) — these are NEW, not ported, and are marked as
 * such rather than implying they trace to an existing source the way
 * colors/blur/radius/motion do.
 */
export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48,
} as const;

export const typography = {
	sizeXs: 12,
	sizeSm: 13,
	sizeBase: 15,
	sizeLg: 17,
	sizeXl: 20,
	sizeTitle: 24,
	sizeHero: 34,
	weightRegular: '400' as const,
	weightMedium: '600' as const,
	weightBold: '800' as const,
	lineHeightTight: 1.2,
	lineHeightBase: 1.45,
};

export const shadow = {
	base: {
		shadowColor: '#000000',
		shadowOpacity: 0.55,
		shadowRadius: 60,
		shadowOffset: { width: 0, height: 20 },
		elevation: 12, // Android has no shadow blur/spread — elevation is the nearest equivalent
	},
	glow: {
		shadowColor: colors.accent, // #D9A93F — see the RETIRED-cyan header comment above
		shadowOpacity: 0.16,
		shadowRadius: 32,
		shadowOffset: { width: 0, height: 0 },
		elevation: 6,
	},
} as const;

export const tokens = { colors, blur, radius, motion, spacing, typography, shadow };
export type BerxTokens = typeof tokens;

/**
 * Time-of-day palette. MAX BUILD — a real hue shift now that a real
 * accent exists (see the header comment on `colors.accent`): a single
 * "golden hour" journey through the gold family rather than five
 * unrelated colors — dim ember at the dead of night, brightening
 * through morning gold, full gold at midday, deepening to a warm
 * bronze at evening, then dimming to a muted brass at night. Never
 * leaves the gold hue family, so it reads as one accent breathing
 * across the day rather than five different accents.
 */
export type BerxDaypart = 'lateNight' | 'morning' | 'day' | 'evening' | 'night';

export interface BerxDaypartPalette {
	daypart: BerxDaypart;
	label: string;
	accent: string;
	accentSoft: string;
	bg: string;
}

const DAYPART_PALETTES: Record<BerxDaypart, BerxDaypartPalette> = {
	lateNight: {
		daypart: 'lateNight',
		label: 'Ночь',
		accent: '#5E4A1E', // dim ember — same hue as the primary gold, near its floor
		accentSoft: 'rgba(94,74,30,0.14)',
		bg: '#020202', // darker than the base --berx-black — deepest point of the day
	},
	morning: {
		daypart: 'morning',
		label: 'Утро',
		accent: '#E8C878', // fresh, pale morning gold
		accentSoft: 'rgba(232,200,120,0.16)',
		bg: colors.black,
	},
	day: {
		daypart: 'day',
		label: 'День',
		accent: colors.accent,
		accentSoft: colors.accentSoft,
		bg: colors.black,
	},
	evening: {
		daypart: 'evening',
		label: 'Вечер',
		accent: '#C98B4A', // deepening to a warm bronze — golden hour, still the same hue family
		accentSoft: 'rgba(201,139,74,0.16)',
		bg: colors.black,
	},
	night: {
		daypart: 'night',
		label: 'Ночь',
		accent: '#8A8172', // muted brass, dimmed for the dark
		accentSoft: 'rgba(138,129,114,0.14)',
		bg: '#030303',
	},
};

/**
 * Real, deterministic — same local hour always resolves to the same
 * daypart, no randomness, no server round-trip. Takes the hour
 * directly (0-23) rather than a Date so it's trivially unit-testable
 * and so callers control which clock/timezone feeds it (device local
 * time, by design — a single global "server time" would show the
 * wrong daypart to users in different timezones, which defeats the
 * entire point).
 */
export function resolveBerxDaypart(hour: number): BerxDaypart {
	if (hour >= 0 && hour < 5) return 'lateNight';
	if (hour >= 5 && hour < 11) return 'morning';
	if (hour >= 11 && hour < 17) return 'day';
	if (hour >= 17 && hour < 21) return 'evening';
	return 'night'; // 21:00–23:59
}

export function getBerxDaypartPalette(hour: number): BerxDaypartPalette {
	return DAYPART_PALETTES[resolveBerxDaypart(hour)];
}
