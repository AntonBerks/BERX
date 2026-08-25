/**
 * BERX Design Tokens — the SAME values as the real, live PHP theme
 * (themes/berx/plugins/default/css/core/default.php), ported by hand
 * rather than invented in parallel. When the web CSS changes, this
 * file needs the matching edit — that's a real, disclosed
 * maintenance cost of not having one shared token source across PHP
 * and TypeScript yet (a future improvement, not solved here).
 */

/**
 * BERX Design Tokens.
 *
 * All values (surfaces, accent, blur, radius) match the live PHP
 * theme (themes/berx/plugins/default/css/core/default.php), ported
 * by hand rather than invented in parallel. Accent is cyan #4fd6e8
 * — see BERX_DECISIONS.md for why (locked after two prior repaints).
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
	 * BERX accent: cyan #4fd6e8. Matches the live PHP web theme
	 * (themes/berx/plugins/default/css/core/default.php's
	 * --berx-accent) and BERX_DECISIONS.md, which records this as
	 * locked after two prior repaints (orange, rejected; violet,
	 * rejected) — "do not reopen without an explicit, unambiguous
	 * instruction." This file previously held a placeholder grey
	 * (#e5e5e7) with a comment saying no accent had been decided yet
	 * — stale; the decision was made and documented, just never
	 * propagated to mobile. Every screen already reads from
	 * `colors.accent`, so this is the only edit needed.
	 */
	accent: '#4fd6e8',
	accentHover: '#7ce4f0',
	accentSoft: 'rgba(79,214,232,0.16)',
	accentSecondary: '#4fd6e8',
	accentSecondarySoft: 'rgba(79,214,232,0.16)',

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

/** Real gradient pair now that the accent decision (cyan) is locked — see the comment on colors.accent above. Used only by the Business/Spatial-Glass layer for now. */
export const gradientAccent = ['#4fd6e8', '#2f9db3'] as const;

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
		shadowColor: colors.accent,
		shadowOpacity: 0.16,
		shadowRadius: 32,
		shadowOffset: { width: 0, height: 0 },
		elevation: 6,
	},
} as const;

export const tokens = { colors, blur, radius, motion, spacing, typography, shadow };
export type BerxTokens = typeof tokens;

/**
 * Time-of-day palette. PROVISIONAL — same placeholder status as
 * `colors.accent` above. This used to shift between violet and
 * magenta by time of day; with no accent color decided yet, there's
 * nothing meaningful to shift *between*, so this now only varies
 * brightness of a neutral grey across the day rather than hue. Once a
 * real accent exists, this is the right place to bring back an actual
 * color shift — the hour-resolution logic below doesn't need to
 * change, only the five hex values.
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
		accent: '#8a8a8e',
		accentSoft: 'rgba(138,138,142,0.12)',
		bg: '#020202', // darker than the base --berx-black — deepest point of the day
	},
	morning: {
		daypart: 'morning',
		label: 'Утро',
		accent: '#d0d0d3',
		accentSoft: 'rgba(208,208,211,0.16)',
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
		accent: colors.accentSecondary,
		accentSoft: colors.accentSecondarySoft,
		bg: colors.black,
	},
	night: {
		daypart: 'night',
		label: 'Ночь',
		accent: '#9a9a9e',
		accentSoft: 'rgba(154,154,158,0.14)',
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
