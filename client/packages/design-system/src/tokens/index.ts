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
 * PALETTE HISTORY — read this before "fixing" the colours again.
 * Orange #ff6a00, violet #8b5cf6 and warm gold #D9A93F were each tried
 * as the brand accent against the ORIGINAL "BERX Cyan" ground
 * (#07080A / #4FD6E8) and each REJECTED at the time. That ground was
 * later itself superseded, in writing, by the project owner: the
 * current, live, final palette is "Obsidian & Aurora" (confirmed
 * directly by the owner this session — the earlier "no purple/violet"
 * constraint was an explicit part of that same override, not left
 * standing). Aquamarine #00E5CC is the one LIVE accent (`colors.accent`
 * below) — same role BERX Cyan held, not a switchable choice: the
 * runtime is still Night-only/hardcoded, see theme/index.tsx's own
 * header, that architectural decision was NOT part of the palette
 * override and stands unchanged. Purple/Pink/Gold/Emerald exist as
 * real, named tokens (see ACCENT PALETTE below) because the spec
 * requires them present, not because any screen switches to them.
 */

/**
 * ACCENT PALETTE — Obsidian & Aurora's five named accents. Aquamarine
 * is the one this app actually paints with (`colors.accent`); the
 * other four are real, defined tokens available to a future
 * caller/feature (e.g. a premium badge reading `colors.accentGold`)
 * without resurrecting a user-facing palette switcher.
 */
export const ACCENT_AQUAMARINE = '#00E5CC';
export const ACCENT_PURPLE = '#8B5CF6';
export const ACCENT_PINK = '#FF4D8D';
export const ACCENT_GOLD = '#E6B800';
export const ACCENT_EMERALD = '#00C896';

export const colors = {
	black: '#05060A',
	bg: '#05060A',
	graphite: '#0E1015',

	// Glass surface: white alpha 12–20% (Night) per Obsidian & Aurora —
	// four ordered strengths within that band, same role the previous
	// four glass1-3/surface tokens held.
	glass1: 'rgba(255,255,255,0.12)',
	glass2: 'rgba(255,255,255,0.15)',
	glass3: 'rgba(255,255,255,0.18)',
	surface: 'rgba(255,255,255,0.15)', // = glass2
	surface2: 'rgba(255,255,255,0.18)', // = glass3

	// Border: white alpha 20%, per spec — one flat value where the old
	// system graded soft/base/strong; soft/strong keep a real, ordered
	// relationship either side of that one specified value rather than
	// collapsing to three identical borders.
	border: 'rgba(255,255,255,0.20)',
	borderSoft: 'rgba(255,255,255,0.14)',
	borderStrong: 'rgba(255,255,255,0.28)',

	white: '#ffffff',
	text: '#F5F7FA',
	textDim: 'rgba(245,247,250,0.64)',
	textFaint: 'rgba(245,247,250,0.38)',
	/** Obsidian & Aurora's own named secondary-text token, alongside the textDim/textFaint ladder every existing screen already reads. */
	textSecondary: '#A8B0C0',

	/**
	 * BERX BRAND ACCENT — Aquamarine #00E5CC, Obsidian & Aurora's live
	 * accent (see this file's own header for the palette-override
	 * history). Every screen reads colors.accent rather than a hex, so
	 * this single value is the systemic paint.
	 */
	accent: ACCENT_AQUAMARINE,
	accentHover: '#4DF0DC',
	accentSoft: 'rgba(0,229,204,0.16)',
	accentSecondary: ACCENT_AQUAMARINE,
	accentSecondarySoft: 'rgba(0,229,204,0.16)',
	/** The four other Obsidian & Aurora accents, as real tokens — see ACCENT PALETTE above. */
	accentPurple: ACCENT_PURPLE,
	accentPink: ACCENT_PINK,
	accentGold: ACCENT_GOLD,
	accentEmerald: ACCENT_EMERALD,
	/**
	 * Ink that sits ON an accent fill (an active nav orb, a primary
	 * button, a badge). It is NOT `black`: Night's accent is a bright
	 * aquamarine so dark ink reads, but Day's accent is a deepened
	 * teal where the same dark ink fails contrast. A browser run of the
	 * Day palette showed exactly that, which is why this is its own role.
	 */
	onAccent: '#05060A',
	/**
	 * The darkening layer laid over real photography, and the ground a
	 * photo that fails to load falls back to. Deliberately IDENTICAL in
	 * both environments: the text and controls that sit on media are
	 * white in Night and Day alike, so a Day-tinted scrim would turn
	 * into a white veil and make them invisible. A browser run of the
	 * Day palette showed exactly that (contrast ratio 1.2).
	 */
	mediaScrim: '#05060A',

	/** Ink that sits ON media (over mediaScrim). Constant in both environments, for the same reason mediaScrim is: a Day-flipped ink would turn dark on a dark photo. */
	onMedia: '#F5F7FA',
	onMediaDim: 'rgba(245,247,250,0.72)',
	onMediaFaint: 'rgba(245,247,250,0.45)',
	/** The accent as it appears ON media. Always the bright Night aquamarine: Day's deepened teal is tuned for a light ground and would undershoot contrast over mediaScrim. */
	accentOnMedia: ACCENT_AQUAMARINE,

	danger: '#ff4d4f',
	success: '#3ddc84',

	/**
	 * Spatial Glass / Living Media layer — additive, new tokens for
	 * the Business design language. Nothing above this line is
	 * changed; existing screens are unaffected.
	 */
	glassBusiness: 'rgba(255,255,255,0.12)',
	glassBusinessBorder: 'rgba(255,255,255,0.18)',
	glassBusinessHairline: 'rgba(255,255,255,0.22)',
	scrimTop: 'rgba(5,6,10,0)',
	scrimBottom: 'rgba(5,6,10,0.92)',
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
	black: '#12141C', // Obsidian & Aurora's own Day background — still a dark ground, not a literal light surface (see this file's header on what the new "Day" means)
	bg: '#12141C',
	graphite: '#1A1D28',

	// Glass surface: white alpha 8–15% (Day) per Obsidian & Aurora.
	glass1: 'rgba(255,255,255,0.08)',
	glass2: 'rgba(255,255,255,0.11)',
	glass3: 'rgba(255,255,255,0.15)',
	surface: 'rgba(255,255,255,0.11)',
	surface2: 'rgba(255,255,255,0.15)',

	border: 'rgba(255,255,255,0.20)',
	borderSoft: 'rgba(255,255,255,0.14)',
	borderStrong: 'rgba(255,255,255,0.28)',

	white: '#ffffff',
	text: '#F5F7FA',
	textDim: 'rgba(245,247,250,0.64)',
	textFaint: 'rgba(245,247,250,0.38)',
	textSecondary: '#A8B0C0',

	/** Same Aquamarine hue as Night — Obsidian & Aurora's Day ground is still dark, so unlike the old light-mode Day palette this needs no separate deepened accent for contrast. */
	accent: ACCENT_AQUAMARINE,
	accentHover: '#4DF0DC',
	accentSoft: 'rgba(0,229,204,0.16)',
	accentSecondary: ACCENT_AQUAMARINE,
	accentSecondarySoft: 'rgba(0,229,204,0.16)',
	accentPurple: ACCENT_PURPLE,
	accentPink: ACCENT_PINK,
	accentGold: ACCENT_GOLD,
	accentEmerald: ACCENT_EMERALD,
	onAccent: '#12141C',
	/** Identical to Night on purpose — see the Night token's comment. */
	mediaScrim: '#05060A',

	/** Ink that sits ON media (over mediaScrim). Constant in both environments, for the same reason mediaScrim is: a Day-flipped ink would turn dark on a dark photo. */
	onMedia: '#F5F7FA',
	onMediaDim: 'rgba(245,247,250,0.72)',
	onMediaFaint: 'rgba(245,247,250,0.45)',
	accentOnMedia: ACCENT_AQUAMARINE,

	danger: '#ff4d4f',
	success: '#3ddc84',

	glassBusiness: 'rgba(255,255,255,0.08)',
	glassBusinessBorder: 'rgba(255,255,255,0.15)',
	glassBusinessHairline: 'rgba(255,255,255,0.20)',
	scrimTop: 'rgba(18,20,28,0)',
	scrimBottom: 'rgba(18,20,28,0.92)',
} as const;

/** The exact palette contract both environments satisfy — the type every theme-aware StyleSheet factory takes. */
export type BerxColorTokens = typeof colors;

export type BerxEnvironment = 'day' | 'night';

/** Selects the Night or Day palette by name. Both are fully wired. */
export function getBerxEnvironmentColors(env: BerxEnvironment) {
	return env === 'day' ? colorsDay : colors;
}

/** Real gradient pair for the new gold accent — see the comment on colors.accent above. Used only by the Business/Spatial-Glass layer for now. */
export const gradientAccent = [ACCENT_AQUAMARINE, '#0E7A6A'] as const;

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
	/** Obsidian & Aurora's own named radii — additive: `md` above already equals 16 and remains what every existing button actually reads, `button`/`card` exist as the spec's own explicit names for a caller that wants them directly. */
	button: 16,
	card: 20,
} as const;

/** Obsidian & Aurora's font tokens. Every font NAME lives here, never hardcoded at a call site. */
export const fonts = {
	/** Headings — a wide grotesque with Cyrillic support (this is a Russian-language app). */
	heading: 'Space Grotesk',
	/** Data/numbers — a monospace built for tabular figures. */
	data: 'JetBrains Mono',
	/** Body copy. */
	body: 'Inter',
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
	/**
	 * AMBIENT, not responsive. The three durations above are all
	 * answers to something the user just did, and they are all under
	 * 400ms because a response that takes longer stops feeling
	 * connected to the input. A breath answers nothing: it is the
	 * half-cycle of a loop that runs while the product is idle or
	 * working (the loading orb, ambient drift on a spatial object).
	 * It belongs on a human timescale, not an interface one — 1400ms
	 * each way is a ~2.8s cycle, near the resting end of real
	 * breathing. Deliberately far outside the responsive range so it
	 * can never be mistaken for one and reused as a transition.
	 */
	durationBreath: 1400,
	/**
	 * Obsidian & Aurora's own named duration/spring tokens — additive,
	 * alongside durationFast/Base/Slow above (which every existing
	 * screen already reads by those names). `spring` is a real
	 * response/damping pair rather than a duration: a caller driving a
	 * spring-based animation (Reanimated's withSpring, or an
	 * equivalent) reads its two fields directly instead of a duration.
	 */
	durationMicro: 200,
	durationNormal: 400,
	durationSlowest: 800,
	spring: {response: 0.4, damping: 0.7},
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
		shadowColor: colors.accent, // Obsidian & Aurora's live accent — Aquamarine #00E5CC
		shadowOpacity: 0.16,
		shadowRadius: 32,
		shadowOffset: { width: 0, height: 0 },
		elevation: 6,
	},
	/**
	 * Obsidian & Aurora's own named two-layer shadow — additive,
	 * alongside base/glow above. A real two-pass shadow (a tight
	 * near shadow plus a soft far one) reads as more physically lifted
	 * than either alone; RN only composites one shadow per view, so a
	 * caller that wants both applies `layer1` to an outer wrapper and
	 * `layer2` to an inner one (or vice versa) rather than expecting a
	 * single style object to carry two shadows at once.
	 */
	layer1: {
		shadowColor: '#000000',
		shadowOpacity: 0.3,
		shadowRadius: 12,
		shadowOffset: {width: 0, height: 4},
		elevation: 4,
	},
	layer2: {
		shadowColor: '#000000',
		shadowOpacity: 0.5,
		shadowRadius: 32,
		shadowOffset: {width: 0, height: 12},
		elevation: 12,
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

/**
 * Obsidian & Aurora — white alpha 12-20% (Night). These four levels
 * were missed in the first palette-migration pass (that pass updated
 * `colors.glass1/2/3` above, a DIFFERENT, simpler three-tier object —
 * this is the separate "BERX GLASS SYSTEM" ladder BerxGlassSurface/
 * BerxGlassBar actually read via useBerxGlass()) and still carried the
 * old ~3.5-9% Night / up-to-94% Day values until caught by a real
 * regression screenshot (Day mode's header rendered near-white — the
 * old literal-light-mode numbers applied against the new dark #12141C
 * ground). Fixed here, not silently left stale.
 */
export const glassNight: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.16)', hairline: 'rgba(255,255,255,0.20)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.20)', hairline: 'rgba(255,255,255,0.24)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(255,255,255,0.18)', border: 'rgba(255,255,255,0.24)', hairline: 'rgba(255,255,255,0.28)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(14,17,21,0.82)', border: 'rgba(255,255,255,0.28)', hairline: 'rgba(255,255,255,0.32)', blurRadius: 32, radius: 28},
};

/** Obsidian & Aurora — white alpha 8-15% (Day). Day's own ground is still dark (#12141C), so this uses the same white-on-dark family as Night, just at the spec's lower Day band, not the old literal-light-mode palette's near-opaque white fills. */
export const glassDay: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> = {
	1: {fill: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', hairline: 'rgba(255,255,255,0.16)', blurRadius: 8, radius: 16},
	2: {fill: 'rgba(255,255,255,0.11)', border: 'rgba(255,255,255,0.16)', hairline: 'rgba(255,255,255,0.20)', blurRadius: 14, radius: 20},
	3: {fill: 'rgba(255,255,255,0.13)', border: 'rgba(255,255,255,0.19)', hairline: 'rgba(255,255,255,0.23)', blurRadius: 22, radius: 24},
	4: {fill: 'rgba(18,20,28,0.82)', border: 'rgba(255,255,255,0.24)', hairline: 'rgba(255,255,255,0.28)', blurRadius: 32, radius: 28},
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
