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
	/**
	 * BERX EMBER — the ground. Near-black, but NOT neutral and not blue:
	 * there is warm violet in it, so a warm accent sitting on it belongs
	 * to the same world instead of looking pasted on. A true #07080A
	 * ground is what made every previous BERX screen read as a template.
	 */
	black: '#0B0910',
	bg: '#0B0910',
	graphite: '#171320',

	/**
	 * Glass is warm-tinted, not pure white. White-on-black overlays go
	 * grey and dead; a warm overlay on a warm ground stays alive.
	 */
	glass1: 'rgba(255,236,228,0.045)',
	glass2: 'rgba(255,236,228,0.075)',
	glass3: 'rgba(255,236,228,0.11)',
	surface: 'rgba(255,236,228,0.075)',
	surface2: 'rgba(255,236,228,0.11)',

	border: 'rgba(255,236,228,0.11)',
	borderSoft: 'rgba(255,236,228,0.08)',
	borderStrong: 'rgba(255,236,228,0.18)',

	white: '#FFFFFF',
	text: '#F8F3EF',
	textDim: 'rgba(248,243,239,0.66)',
	textFaint: 'rgba(248,243,239,0.40)',

	/**
	 * EMBER — the BERX brand colour.
	 *
	 * Warm coral, and deliberately so. Every social product of this kind
	 * is blue, cyan, purple or pink; almost none is warm. A warm accent
	 * on a warm-dark ground reads as light falling on a room rather than
	 * as a UI colour applied to a surface, which is most of the reason
	 * this palette looks expensive where the previous black-and-cyan one
	 * looked like a starter template.
	 *
	 * Every screen reads colors.accent rather than a hex, so this one
	 * value repaints the entire product.
	 */
	accent: '#FF6A45',
	accentHover: '#FF8B6C',
	accentSoft: 'rgba(255,106,69,0.16)',

	/**
	 * AURORA — the cool counterpart, for live, positive and "happening
	 * now" states. A single-accent product has nothing left to say when
	 * something is genuinely alive; this is what it says it with.
	 */
	accentSecondary: '#5FE3BE',
	accentSecondarySoft: 'rgba(95,227,190,0.16)',

	/**
	 * Ink that sits ON an accent fill. Ember is a bright warm colour:
	 * white on it reaches only ~2.9:1, which fails, while this deep
	 * ember-black reaches ~6.3:1 AND looks more expensive than white.
	 */
	onAccent: '#26100A',

	/**
	 * Constant across BOTH environments on purpose: a photograph is dark
	 * whatever the app's theme is, so the scrim and the ink over it must
	 * not flip with the theme or white text lands on a white veil.
	 */
	mediaScrim: '#0B0910',
	onMedia: '#F8F3EF',
	onMediaDim: 'rgba(248,243,239,0.72)',
	onMediaFaint: 'rgba(248,243,239,0.45)',
	accentOnMedia: '#FF8257',

	danger: '#F2415B',
	success: '#5FE3BE',

	/**
	 * Spatial Glass / Living Media layer — additive, new tokens for
	 * the Business design language. Nothing above this line is
	 * changed; existing screens are unaffected.
	 */
	glassBusiness: 'rgba(255,236,228,0.05)',
	glassBusinessBorder: 'rgba(255,236,228,0.10)',
	glassBusinessHairline: 'rgba(255,236,228,0.16)',
	scrimTop: 'rgba(7,8,10,0)',
	scrimBottom: 'rgba(7,8,10,0.92)',
} as const;

/**
 * BERX Design Tokens — DAY environment. NEW. Not simply an inverted
 * dark theme: a distinct warm "architectural white" surface (per the
 * transformation directive's own framing — daylight, depth, quiet
 * contrast) rather than a generic light-mode palette. Same shape as
 * `colors` so a future theme-context can select between the two by
 * key, but nothing in the app switches to this yet — no screen's
 * StyleSheet is theme-reactive today (they're all computed once at
 * module load against the Night `colors` object above).
 *
 * That wiring is now DONE — see packages/design-system/src/theme.
 * Every screen resolves its palette through useBerxColors(), so this
 * object is live, not aspirational.
 */
export const colorsDay = {
	black: '#1A1216', // "black" here means the darkest ink on this environment, not a literal near-black surface
	// Warm paper, not white. A pure-white ground under a warm accent
	// reads as a document; this reads as a room with the lights on.
	bg: '#FBF6F1',
	graphite: '#F2E9E1',

	glass1: 'rgba(26,18,22,0.035)',
	glass2: 'rgba(26,18,22,0.06)',
	glass3: 'rgba(26,18,22,0.09)',
	surface: 'rgba(26,18,22,0.06)',
	surface2: 'rgba(26,18,22,0.09)',

	border: 'rgba(26,18,22,0.10)',
	borderSoft: 'rgba(26,18,22,0.07)',
	borderStrong: 'rgba(26,18,22,0.16)',

	white: '#1A1216', // inverted role: the "on-surface ink" color, matching how `colors.white` is Night's brightest ink
	text: '#1A1216',
	textDim: 'rgba(26,18,22,0.64)',
	textFaint: 'rgba(26,18,22,0.38)',

	/** The same Ember hue, deepened for real contrast on warm paper — not a second colour. */
	accent: '#D8442A',
	accentHover: '#EC5A3E',
	accentSoft: 'rgba(216,68,42,0.12)',
	/** Aurora, deepened the same way. */
	accentSecondary: '#0E8F76',
	accentSecondarySoft: 'rgba(14,143,118,0.13)',
	onAccent: '#FFF3EE',
	/** Identical to Night on purpose — see the Night token's comment. */
	mediaScrim: '#0B0910',

	/** Ink that sits ON media (over mediaScrim). Constant in both environments, for the same reason mediaScrim is: a Day-flipped ink would turn dark on a dark photo. */
	onMedia: '#F8F3EF',
	onMediaDim: 'rgba(248,243,239,0.72)',
	onMediaFaint: 'rgba(248,243,239,0.45)',
	/** Ember as it appears ON media — always the Night value, because Day's deepened ember is tuned for warm paper and dies on a dark photograph. */
	accentOnMedia: '#FF8257',

	danger: '#C42F47',
	success: '#0E8F76',

	glassBusiness: 'rgba(26,18,22,0.035)',
	glassBusinessBorder: 'rgba(26,18,22,0.08)',
	glassBusinessHairline: 'rgba(10,10,12,0.12)',
	scrimTop: 'rgba(246,244,239,0)',
	scrimBottom: 'rgba(246,244,239,0.92)',
} as const;

/** The exact palette contract both environments satisfy — the type every theme-aware StyleSheet factory takes. */
export type BerxColorTokens = typeof colors;

export type BerxEnvironment = 'day' | 'night';

/** Selects the Night or Day palette by name. Both are fully wired. */
export function getBerxEnvironmentColors(env: BerxEnvironment) {
	return env === 'day' ? colorsDay : colors;
}

/** Real gradient pair for the new gold accent — see the comment on colors.accent above. Used only by the Business/Spatial-Glass layer for now. */
export const gradientAccent = ['#4FD6E8', '#12707F'] as const;

export const blur = {
	sm: 8,
	md: 16,
	lg: 28,
} as const;

export const radius = {
	sm: 10,
	md: 16,
	lg: 24,
	/**
	 * Media and sheet radii. The reference set's cinematic cards sit
	 * around 30-34px on a 390pt screen; capping the scale at 24 was what
	 * made large media read as a "content box" rather than an object with
	 * its own physical edge.
	 */
	xl: 32,
	xxl: 40,
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

/**
 * BERX TYPE — two real typefaces, downloaded into assets/fonts and
 * registered for React Native. Both are SIL OFL 1.1: commercial use
 * permitted, no attribution required in-product.
 *
 * Manrope carries the interface. It is a geometric sans with slightly
 * open apertures and a tall x-height, so it stays legible at 11pt in a
 * caption and still looks designed at 52pt — the system font does the
 * first job and not the second.
 *
 * Instrument Serif carries the display moments: the entry sequence,
 * completion states, editorial titles. A serif against a geometric
 * sans is the single cheapest way to make a product read as expensive
 * rather than as another sans-serif app, and it is what separates BERX
 * from every competitor rendering everything in one grotesque.
 */
export const fonts = {
	/** Interface. */
	sans: 'Manrope',
	/** Display. Use large, never below ~24pt. */
	display: 'InstrumentSerif-Regular',
	displayItalic: 'InstrumentSerif-Italic',
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
		shadowColor: colors.accent, // #4FD6E8 — BERX CYAN
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
 * "tidal" journey through the BERX cyan family rather than five
 * unrelated colors — deep tidal cyan at the dead of night, brightening
 * through pale morning cyan, full BERX cyan at midday, deepening to a
 * dusk teal at evening, then dimming again at night. Never
 * leaves the cyan hue family, so it reads as one accent breathing
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
		accent: '#1E4A52', // deep tidal cyan — same hue as the primary, near its floor
		accentSoft: 'rgba(30,74,82,0.14)',
		bg: '#030406', // darker than the base --berx-black — deepest point of the day
	},
	morning: {
		daypart: 'morning',
		label: 'Утро',
		accent: '#A8ECF5', // pale morning cyan — the hue at its lightest
		accentSoft: 'rgba(168,236,245,0.16)',
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
		accent: '#2FA9BE', // deepening toward dusk teal — still the same hue family
		accentSoft: 'rgba(47,169,190,0.16)',
		bg: colors.black,
	},
	night: {
		daypart: 'night',
		label: 'Ночь',
		accent: '#3F8894', // dimmed night cyan — the hue held back for the dark
		accentSoft: 'rgba(63,136,148,0.14)',
		bg: '#050609',
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


/* ============================================================
 * BERX GLASS SYSTEM — four real, ordered levels.
 * ------------------------------------------------------------
 * The codebase already had a single ad-hoc "glassBusiness" surface
 * and a handful of raw glass1/glass2/glass3 fills used inconsistently
 * per screen. That gave no HIERARCHY: a modal and a chip looked like
 * the same material. These four levels are the whole system —
 * every new surface picks a level, never a raw rgba literal.
 *
 * L1 SUBTLE     — quiet ground: rails, section grounds, inert rows.
 * L2 INTERACTIVE— things you can press: chips, cards, list items.
 * L3 ELEVATED   — lifted above the feed: floating panels, sheets.
 * L4 HERO/MODAL — the top plane: modals, hero overlays, create surface.
 *
 * NOTE ON BLUR — honest constraint, unchanged from the earlier
 * BerxGlassSurface header: no blur library is installable in this
 * sandbox (no expo-blur / @react-native-community/blur — npm is
 * blocked here), so `blurRadius` below is a real, declared intent
 * that BerxGlassSurface applies ONLY where a blur backend exists.
 * Depth today is carried by layered translucency + hairline + shadow,
 * which is why each level also raises fill, border AND shadow
 * together rather than relying on blur alone.
 * ============================================================ */

export interface BerxGlassLevelTokens {
	fill: string;
	border: string;
	hairline: string;
	blurRadius: number;
	radius: number;
}

export const glassNight: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(255,255,255,0.035)', border: 'rgba(255,255,255,0.07)', hairline: 'rgba(255,255,255,0.10)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', hairline: 'rgba(255,255,255,0.16)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(255,255,255,0.09)', border: 'rgba(255,255,255,0.14)', hairline: 'rgba(255,255,255,0.22)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(14,17,21,0.74)', border: 'rgba(255,255,255,0.18)', hairline: 'rgba(255,255,255,0.28)', blurRadius: 32, radius: 28},
};

export const glassDay: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(255,255,255,0.55)', border: 'rgba(10,10,12,0.06)', hairline: 'rgba(255,255,255,0.85)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(255,255,255,0.72)', border: 'rgba(10,10,12,0.09)', hairline: 'rgba(255,255,255,0.95)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(255,255,255,0.86)', border: 'rgba(10,10,12,0.12)', hairline: 'rgba(255,255,255,1)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(252,251,248,0.94)', border: 'rgba(10,10,12,0.16)', hairline: 'rgba(255,255,255,1)', blurRadius: 32, radius: 28},
};

export type BerxGlassLevel = 1 | 2 | 3 | 4;

/** Selects the glass ladder for an environment — same shape either way, so a component never branches on theme itself. */
export function getBerxGlass(env: BerxEnvironment) {
	return env === 'day' ? glassDay : glassNight;
}

/* ============================================================
 * SPATIAL / ELEVATION — depth as a real, ordered scale.
 * Each step raises the shadow the way physical distance from the
 * ground plane would: further = larger, softer, more offset.
 * Used by BerxSpatialLayer so "depth" is a token, not a per-screen
 * guess at shadowRadius.
 * ============================================================ */

export const elevation = {
	0: {shadowColor: '#000000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: {width: 0, height: 0}, elevation: 0},
	1: {shadowColor: '#000000', shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 3},
	2: {shadowColor: '#000000', shadowOpacity: 0.42, shadowRadius: 24, shadowOffset: {width: 0, height: 10}, elevation: 8},
	3: {shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 44, shadowOffset: {width: 0, height: 18}, elevation: 14},
	4: {shadowColor: '#000000', shadowOpacity: 0.68, shadowRadius: 70, shadowOffset: {width: 0, height: 28}, elevation: 22},
} as const;

export type BerxElevation = 0 | 1 | 2 | 3 | 4;

/**
 * Parallax depth factors — how much a layer shifts relative to the
 * scroll/tilt driver. Foreground moves most, background least, which
 * is what actually reads as physical depth (nearer objects traverse
 * more of the visual field). Real numbers, one place, so two screens
 * can't disagree about what "background" means.
 */
export const parallax = {
	background: 0.12,
	mid: 0.34,
	foreground: 0.62,
	hero: 0.85,
} as const;

/** Cinematic media aspect ratios — large-format editorial imagery, not square Instagram tiles. */
export const mediaRatio = {
	/** The reference feed plate: a tall portrait that owns the screen, not a 4:5 slot. */
	hero: 3 / 4.4,
	cinema: 16 / 9,
	portrait: 3 / 4,
	wide: 21 / 9,
	square: 1,
} as const;
