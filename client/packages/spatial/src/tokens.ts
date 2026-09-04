/**
 * BERX 5D ULTIMATE v9 — spatial token source.
 *
 * Values are transcribed verbatim from the v9 archive
 * (02_FOUNDATION/tokens/berx.tokens.json, materials/materials.json,
 * materials/lighting.json, motion/MOTION_GRAPH.json,
 * color_worlds.json). They are NOT re-invented here: this module is
 * the single in-repo copy of the contract, and `docs/v9/` holds the
 * archive originals so any drift is a diff, not an argument.
 *
 * Nothing in this file renders. It is data. The resolvers in
 * depth.ts / materials.ts / lighting.ts / motion.ts / camera.ts turn
 * it into concrete, platform-agnostic layer specs that the React
 * Native adapters (packages/design-system/src/spatial) and the web
 * adapter (scripts/berx-5d.runtime.js, generated from this same
 * source) consume.
 */

export type BerxDepthKey = 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export const BERX_DEPTH_KEYS: readonly BerxDepthKey[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5'] as const;

/**
 * Depth is hierarchy, not decoration (v9 Constitution §04):
 * D0 substrate · D1 environmental media · D2 structural glass ·
 * D3 primary content · D4 controls/avatars · D5 active energy/focus.
 */
export const BERX_DEPTH_ROLE: Record<BerxDepthKey, string> = {
	D0: 'substrate',
	D1: 'environment',
	D2: 'structure',
	D3: 'content',
	D4: 'controls',
	D5: 'focus',
};

export const BERX_DEPTH_TOKENS: Record<BerxDepthKey, {z: number; parallax: number}> = {
	D0: {z: 0, parallax: 0.0},
	D1: {z: 1, parallax: 0.15},
	D2: {z: 2, parallax: 0.2},
	D3: {z: 3, parallax: 0.35},
	D4: {z: 4, parallax: 0.65},
	D5: {z: 5, parallax: 1.0},
};

export const BERX_V9_COLOR = {
	bg: '#07080A',
	surface: '#101216',
	textPrimary: '#F5F8FA',
	textSecondary: '#A7B0B7',
	textMuted: '#6F7A82',
	accent: '#4FD6E8',
	accentSoft: 'rgba(79,214,232,.14)',
	glass04: 'rgba(255,255,255,.04)',
	glass06: 'rgba(255,255,255,.06)',
	glass10: 'rgba(255,255,255,.10)',
	danger: '#FF5C72',
	success: '#54E39A',
	warning: '#FFC857',
} as const;

export const BERX_V9_RADIUS = {xs: 8, sm: 12, md: 16, lg: 22, xl: 30, pill: 999} as const;

export const BERX_V9_BLUR = {sm: 8, md: 16, lg: 28, xl: 40} as const;

export const BERX_V9_MOTION_DURATION = {
	micro: 140,
	fast: 220,
	standard: 360,
	spatial: 650,
	cinematic: 900,
	ambient: 4000,
} as const;

/** Hard ceiling from the constitution (§05). Tilt never exceeds this, on any platform, ever. */
export const BERX_MAX_TILT_DEG = 2.5;

export const BERX_V9_TOUCH = {minCssPx: 24, preferredDp: 44} as const;

export const BERX_V9_PERFORMANCE = {
	targetFps: 60,
	interactiveBudgetMs: 16.7,
	blurMaxLayersMobile: 3,
	simultaneous3DObjectsMobile: 80,
	videoAutoplayConcurrentMobile: 1,
} as const;

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export type BerxMaterialName =
	| 'ClearGlass'
	| 'DeepGlass'
	| 'FrostGlass'
	| 'Crystal'
	| 'DarkMetal'
	| 'Carbon'
	| 'LiquidGlass'
	| 'MediaSurface'
	| 'NeonEnergy'
	| 'SoftLight';

/**
 * Physical description of each material. `transmission` is how much
 * of the scene behind shows through, `roughness` scatters it,
 * `specular` controls edge/highlight strength, `ior` drives the
 * refractive edge, `emissive` is self-lit energy. materials.ts turns
 * these five numbers into real surface values — that is what makes a
 * BERX surface a material rather than "blur + border + shadow".
 */
export interface BerxMaterialSpec {
	transmission: number;
	roughness: number;
	specular: number;
	ior: number;
	emissive: number;
}

export const BERX_MATERIALS: Record<BerxMaterialName, BerxMaterialSpec> = {
	ClearGlass: {transmission: 0.72, roughness: 0.18, specular: 0.7, ior: 1.2, emissive: 0},
	DeepGlass: {transmission: 0.32, roughness: 0.24, specular: 0.55, ior: 1.18, emissive: 0},
	FrostGlass: {transmission: 0.58, roughness: 0.42, specular: 0.42, ior: 1.18, emissive: 0},
	Crystal: {transmission: 0.82, roughness: 0.1, specular: 0.9, ior: 1.35, emissive: 0.02},
	DarkMetal: {transmission: 0, roughness: 0.28, specular: 0.82, ior: 1.0, emissive: 0},
	Carbon: {transmission: 0, roughness: 0.62, specular: 0.25, ior: 1.0, emissive: 0},
	LiquidGlass: {transmission: 0.76, roughness: 0.12, specular: 0.88, ior: 1.25, emissive: 0.04},
	MediaSurface: {transmission: 0, roughness: 0.45, specular: 0.18, ior: 1.0, emissive: 0},
	NeonEnergy: {transmission: 0.05, roughness: 0.1, specular: 0.9, ior: 1.0, emissive: 0.45},
	SoftLight: {transmission: 0, roughness: 0.7, specular: 0.1, ior: 1.0, emissive: 0.1},
};

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

export type BerxLightRecipeName = 'hero' | 'card' | 'active' | 'modal';

export interface BerxLightRecipe {
	key: number;
	rim: number;
	ambient: number;
}

export const BERX_ENVIRONMENT_LIGHT = {ambient: 0.18, directional: 0.62, accent: 0.2} as const;

export const BERX_LIGHT_RECIPES: Record<BerxLightRecipeName, BerxLightRecipe> = {
	hero: {key: 0.55, rim: 0.25, ambient: 0.2},
	card: {key: 0.35, rim: 0.12, ambient: 0.53},
	active: {key: 0.42, rim: 0.38, ambient: 0.2},
	modal: {key: 0.28, rim: 0.16, ambient: 0.56},
};

/* ------------------------------------------------------------------ */
/* Color worlds                                                        */
/* ------------------------------------------------------------------ */

export type BerxColorWorldName = 'Turquoise' | 'Midnight' | 'Crimson' | 'Orchid' | 'WineAsh' | 'Obsidian';

export interface BerxColorWorld {
	accent: string;
	energy: string;
	mood: string;
}

export const BERX_COLOR_WORLDS: Record<BerxColorWorldName, BerxColorWorld> = {
	Turquoise: {accent: '#4FD6E8', energy: 'cool', mood: 'future / clarity'},
	Midnight: {accent: '#8BA8FF', energy: 'deep', mood: 'night / calm'},
	Crimson: {accent: '#FF5C72', energy: 'warm', mood: 'intense / expressive'},
	Orchid: {accent: '#B38CFF', energy: 'creative', mood: 'art / culture'},
	WineAsh: {accent: '#A56F83', energy: 'muted', mood: 'luxury / intimate'},
	Obsidian: {accent: '#C6D0D8', energy: 'neutral', mood: 'minimal / elite'},
};

/**
 * Turquoise is the default world and the locked BERX brand accent
 * (#4FD6E8 — see client/BERX_DECISIONS.md; repainted twice already,
 * do not reopen). The other five are user-selectable worlds from
 * BERX-004 "choose color vibe", not competing brand accents.
 */
export const BERX_DEFAULT_COLOR_WORLD: BerxColorWorldName = 'Turquoise';

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

export type BerxMotionPresetName = 'appear' | 'spatialEnter' | 'focus' | 'exit' | 'ambient' | 'crossFade';

export interface BerxMotionTransform {
	opacity?: number;
	translateY?: number;
	translateZ?: number;
	scale?: number;
}

export interface BerxMotionPreset {
	durationMs: number;
	easing: string;
	/** Cubic-bezier control points, for React Native's Easing.bezier(). Same curve as `easing`. */
	bezier: [number, number, number, number];
	from?: BerxMotionTransform;
	to?: BerxMotionTransform;
	loop?: boolean;
	delta?: BerxMotionTransform;
}

export const BERX_MOTION_PRESETS: Record<BerxMotionPresetName, BerxMotionPreset> = {
	appear: {
		durationMs: 360,
		easing: 'cubic-bezier(.22,1,.36,1)',
		bezier: [0.22, 1, 0.36, 1],
		from: {opacity: 0, translateY: 12, scale: 0.985},
		to: {opacity: 1, translateY: 0, scale: 1},
	},
	spatialEnter: {
		durationMs: 650,
		easing: 'cubic-bezier(.16,1,.3,1)',
		bezier: [0.16, 1, 0.3, 1],
		from: {opacity: 0, translateZ: -24, scale: 0.96},
		to: {opacity: 1, translateZ: 0, scale: 1},
	},
	focus: {
		durationMs: 220,
		easing: 'cubic-bezier(.2,.8,.2,1)',
		bezier: [0.2, 0.8, 0.2, 1],
		from: {scale: 1},
		to: {scale: 1.025},
	},
	exit: {
		durationMs: 220,
		easing: 'ease-out',
		bezier: [0, 0, 0.58, 1],
		to: {opacity: 0, scale: 0.985},
	},
	ambient: {
		durationMs: 4000,
		easing: 'ease-in-out',
		bezier: [0.42, 0, 0.58, 1],
		loop: true,
		delta: {translateY: 3},
	},
	/** The reduced-motion substitute. Semantics kept, spatial travel dropped. */
	crossFade: {
		durationMs: 220,
		easing: 'ease-out',
		bezier: [0, 0, 0.58, 1],
		from: {opacity: 0},
		to: {opacity: 1},
	},
};

export const BERX_REDUCED_MOTION_RULES = {
	replaceParallaxWith: 'crossFade' as const,
	replaceTiltWith: 'none' as const,
	maxDurationMs: 220,
};

/** Elements allowed to travel between scenes as a single continuous object. */
export const BERX_SHARED_ELEMENTS = [
	'avatar',
	'heroMedia',
	'placePin',
	'eventPoster',
	'messageThread',
	'primaryAction',
	'profileHeader',
] as const;

export type BerxSharedElementId = (typeof BERX_SHARED_ELEMENTS)[number];
