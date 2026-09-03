/**
 * BERX SPATIAL ENGINE — semantic 3D tokens.
 *
 * The camera, lighting rig and material constants every real BERX 3D
 * scene composes from, so the app reads as ONE world rather than a
 * dozen independently-lit mini-scenes. Before this, each *.native.tsx
 * object declared its own ambient + point lights with its own hand-
 * picked intensities; two objects on adjacent screens were literally
 * lit by different suns.
 *
 * This file is deliberately DEPENDENCY-FREE (no three, no react, no
 * react-native): it is plain data, so the web bundle can import it
 * without pulling the native GL stack in, and so the values are
 * reviewable as a palette rather than buried in JSX.
 *
 * BERX DNA: the key light IS the brand accent (#4FD6E8). The fill is a
 * cooler blue that reads as bounce, never a second brand colour. No
 * purple/violet/magenta anywhere, in any light or material.
 */

/** The one BERX key light — the brand accent, used as an actual light colour. */
export const SPATIAL_KEY_LIGHT = '#4FD6E8';
/** Cool bounce/fill. Reads as reflected sky, not as a second accent. */
export const SPATIAL_FILL_LIGHT = '#3E8FD9';
/** The near-black ground objects sit against (matches colors.bg / BERX_SCENE.ground). */
export const SPATIAL_GROUND = '#07080A';
/** Object body colour — dark, so the rim light does the describing. */
export const SPATIAL_OBJECT_BODY = '#101620';

/**
 * CAMERA — one perspective language.
 *
 * `fov` is narrow on purpose. A wide lens (60°+) exaggerates
 * perspective and reads as a game engine; a 32-42° lens reads as a
 * product shot, which is the register BERX is in.
 */
export const SPATIAL_CAMERA = {
	/** Objects presented head-on: emblem, lens, identity marks. */
	object: {position: [0, 0, 3.2] as [number, number, number], fov: 32},
	/** A confident hero object with room to breathe. */
	hero: {position: [0, 0, 3.4] as [number, number, number], fov: 40},
	/** A scene you look INTO — slightly above, angled down into depth. */
	scene: {position: [0, 0.6, 4.6] as [number, number, number], fov: 42},
} as const;

/**
 * LIGHTING — BERX's three-point rig, in one place.
 *
 * ambient: enough to keep an unlit face from going pure black.
 * key:     the accent, high and to the camera's right.
 * fill:    cool, low and opposite, at a fraction of the key.
 */
export const SPATIAL_LIGHT = {
	ambient: {intensity: 0.32},
	key: {position: [1.6, 1.4, 2.2] as [number, number, number], intensity: 1.1, color: SPATIAL_KEY_LIGHT},
	fill: {position: [-2.2, -1.4, -1.6] as [number, number, number], intensity: 0.34, color: SPATIAL_FILL_LIGHT},
} as const;

/**
 * MATERIAL — the physical glass BERX objects are made of.
 *
 * One recipe, so a beacon on Places and an emblem on Login are
 * recognisably the same substance. `transmission`/`thickness` are what
 * make it read as glass rather than shiny plastic.
 */
export const SPATIAL_GLASS_MATERIAL = {
	roughness: 0.18,
	metalness: 0.1,
	transmission: 0.55,
	thickness: 0.8,
	clearcoat: 1,
	clearcoatRoughness: 0.15,
} as const;

/** Emissive strengths, ordered. A "live" object glows; a dormant one barely does. */
export const SPATIAL_EMISSIVE = {
	dormant: 0.06,
	quiet: 0.18,
	present: 0.42,
	live: 0.9,
} as const;

/**
 * MOTION — depth-based, cinematic, never bouncy.
 *
 * Radians per second. These are slow on purpose: a fast-spinning
 * object reads as a loading spinner or a toy.
 */
export const SPATIAL_MOTION = {
	/** Barely-there drift, for an object that is present but idle. */
	driftRadPerSec: 0.06,
	/** A deliberate, readable rotation for a focal object. */
	turnRadPerSec: 0.14,
	/** Breathing scale amplitude (fraction of base scale). */
	breathAmplitude: 0.02,
	breathRadPerSec: 0.9,
} as const;

/**
 * QUALITY TIERS — real, applied knobs (not a label).
 *
 * Consumed by SpatialStage to cap the cost of a scene on weaker
 * hardware while keeping the same composition, camera and light
 * DIRECTION — a LOW-tier BERX scene is still recognisably BERX, just
 * cheaper to draw.
 *
 * NOTE ON `dpr`: R3F's web Canvas takes a `dpr` clamp, but the NATIVE
 * Canvas explicitly omits it (`Omit<RenderProps, 'size' | 'dpr'>` — see
 * @react-three/fiber/dist/declarations/src/native/Canvas.d.ts): expo-gl
 * owns the drawing-buffer size. So the real native cost knobs are
 * antialiasing, the fill light, and geometry subdivision — which is
 * what these tiers actually turn. Verified against the installed
 * typings, not assumed.
 */
export type SpatialQuality = 'high' | 'medium' | 'low';

export const SPATIAL_QUALITY: Record<SpatialQuality, {antialias: boolean; segments: number; fillLight: boolean}> = {
	high: {antialias: true, segments: 64, fillLight: true},
	medium: {antialias: true, segments: 32, fillLight: true},
	// The fill light is the first thing to go: it costs a full extra
	// lighting pass and its absence reads as "moodier", not as "broken".
	low: {antialias: false, segments: 16, fillLight: false},
};
