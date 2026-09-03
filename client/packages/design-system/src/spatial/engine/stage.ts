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
 * LIGHTING — BERX's rig, in one place.
 *
 * ambient: enough to keep an unlit face from going pure black.
 * key:     the accent, high and to the camera's right.
 * fill:    cool, low and opposite, at a fraction of the key.
 * rim:     BEHIND the subject, pointing back at the camera.
 *
 * The rim is the single largest quality difference between "a lit 3D
 * object" and "a photographed one". Key and fill both come from the
 * camera's side, so a dark BERX object against the near-black ground
 * loses its own silhouette — the edge where object ends and background
 * begins is two dark values meeting. A back light draws that edge as a
 * bright line, which is what separation actually is. It is placed
 * opposite the key in x so the two never stack into one highlight, and
 * it is the brightest source in the rig because it is being seen almost
 * edge-on: only the silhouette catches it.
 */
export const SPATIAL_LIGHT = {
	ambient: {intensity: 0.32},
	key: {position: [1.6, 1.4, 2.2] as [number, number, number], intensity: 1.1, color: SPATIAL_KEY_LIGHT},
	fill: {position: [-2.2, -1.4, -1.6] as [number, number, number], intensity: 0.34, color: SPATIAL_FILL_LIGHT},
	rim: {position: [-1.1, 0.9, -3.0] as [number, number, number], intensity: 1.5, color: SPATIAL_KEY_LIGHT},
} as const;

/**
 * MATERIAL — the physical glass BERX objects are made of.
 *
 * One recipe, so a beacon on Places and an emblem on Login are
 * recognisably the same substance.
 *
 * WHY THERE IS NO `dispersion` AND NO `iridescence` HERE. Both are real
 * MeshPhysicalMaterial features in the installed three (r169 — checked,
 * not assumed), and both are the obvious reach for "expensive-looking
 * glass". Both are refused on purpose: dispersion splits transmitted
 * light into its spectrum and iridescence is thin-film interference, so
 * BOTH necessarily render violet and magenta fringes at every edge.
 * BERX carries no purple/violet/magenta, and a rule that only holds
 * where it is cheap to hold is not a rule.
 *
 * `attenuationColor` is the honest way to get the same richness. It is
 * Beer-Lambert absorption — light loses energy on its way THROUGH the
 * glass, so thick parts of an object go deep cyan while thin edges stay
 * clear. That is a real optical effect, it is genuinely expensive-
 * looking, and it is single-hue: it can only ever push toward BERX's
 * own colour, never into a spectrum. Physically-based and on-brand is
 * not a compromise between the two here; it is the same choice.
 */
export const SPATIAL_GLASS_MATERIAL = {
	roughness: 0.14,
	metalness: 0.1,
	transmission: 0.62,
	thickness: 0.9,
	/** Real crown glass. Below ~1.4 reads as plastic; above ~1.7 as gemstone. */
	ior: 1.5,
	/** Beer-Lambert tint: what the glass does to light passing through it. */
	attenuationColor: '#2E7C8C',
	/** Distance (world units) over which that tint reaches full strength. */
	attenuationDistance: 0.75,
	clearcoat: 1,
	clearcoatRoughness: 0.12,
	/** A cool near-white specular. Pure #FFF specular is what reads as plastic. */
	specularIntensity: 1,
	specularColor: '#D6F2F7',
	/**
	 * Sheen is a fabric model, used here deliberately and not by
	 * accident: it adds retroreflection at grazing angles only, which
	 * puts a soft glow on the silhouette. Native has no post-processing
	 * bloom pass available, so this is how a BERX object gets an edge
	 * that glows rather than one that just ends. Kept low — at high
	 * values it genuinely does start to look like velvet.
	 */
	sheen: 0.3,
	sheenColor: SPATIAL_KEY_LIGHT,
	sheenRoughness: 0.55,
} as const;

/**
 * The same substance, costed down. Transmission is not a material
 * parameter like the others — it makes the renderer draw the scene an
 * EXTRA time into a transmission buffer, per transmissive object. On
 * weak hardware that is the single most expensive thing on this list,
 * so LOW drops it to zero and pays for the loss with a slightly
 * brighter, rougher surface: still dark glass, no longer see-through.
 * MEDIUM keeps transmission but drops the second-order lobes (sheen,
 * clearcoat) that cost real shader work for subtle gain.
 */
export const SPATIAL_GLASS_BY_QUALITY: Record<SpatialQuality, Record<string, string | number>> = {
	high: SPATIAL_GLASS_MATERIAL,
	medium: {
		roughness: 0.16,
		metalness: 0.1,
		transmission: 0.5,
		thickness: 0.8,
		ior: 1.5,
		attenuationColor: '#2E7C8C',
		attenuationDistance: 0.75,
		specularIntensity: 1,
		specularColor: '#D6F2F7',
	},
	low: {
		roughness: 0.26,
		metalness: 0.16,
		transmission: 0,
		specularIntensity: 0.8,
		specularColor: '#D6F2F7',
	},
};

/**
 * ENVIRONMENT — what a BERX object sees when it looks around.
 *
 * A reflective object with nothing to reflect looks like plastic, no
 * matter how good its material is: reflections are most of what tells
 * you a surface is polished. The usual fix is an HDR environment file,
 * which BERX does not have and will not ship a 2MB download for, and
 * three's own RoomEnvironment is a neutral white product-viz studio —
 * loading it would light BERX objects with somebody else's room and
 * wash the reflections grey.
 *
 * So the environment is BUILT, from these values, out of BERX's own
 * rig: the object reflects the same key and fill that light it, against
 * the same ground it stands on. Every reflection is therefore in-brand
 * by construction rather than by correction.
 *
 * Sizes are in world units on a 6-unit room; `blur` is the PMREM sigma
 * in radians — enough that the panels read as soft light sources rather
 * than as visible rectangles reflected in the glass.
 */
export const SPATIAL_ENV = {
	roomSize: 6,
	blur: 0.045,
	/** Overall strength of image-based lighting, on top of the real lights. */
	intensity: 0.85,
	panels: [
		/** KEY panel — up and camera-right, matching SPATIAL_LIGHT.key. */
		{position: [2.2, 2.0, 1.6] as [number, number, number], scale: [2.4, 2.0, 0.1] as [number, number, number], color: SPATIAL_KEY_LIGHT, intensity: 1.5},
		/** FILL panel — down and opposite, matching SPATIAL_LIGHT.fill. */
		{position: [-2.6, -1.4, -1.2] as [number, number, number], scale: [2.0, 1.6, 0.1] as [number, number, number], color: SPATIAL_FILL_LIGHT, intensity: 0.45},
		/** HORIZON — a wide, very dim band that gives the glass a real
		    horizontal line to bend, which is what makes refraction legible. */
		{position: [0, -0.2, -2.8] as [number, number, number], scale: [5.5, 0.35, 0.1] as [number, number, number], color: SPATIAL_FILL_LIGHT, intensity: 0.3},
	],
} as const;

/**
 * GROUND — the contact disc under a hero object.
 *
 * An object with no ground is an object floating in nothing, and that
 * is the difference between a render and a photograph. This is not a
 * shadow map (a real shadow pass is the wrong cost for one object on a
 * phone): it is a disc of the ground colour, opaque at the centre and
 * transparent at the rim, sitting just under the object. It reads as
 * contact occlusion, which is the part of a shadow the eye actually
 * uses to place something in space.
 */
export const SPATIAL_GROUND_DISC = {
	radius: 1.35,
	/** How far below origin the disc sits. Objects are ~0.5-0.8 units tall. */
	offsetY: -0.62,
	opacity: 0.55,
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

export const SPATIAL_QUALITY: Record<
	SpatialQuality,
	{antialias: boolean; segments: number; fillLight: boolean; environment: boolean}
> = {
	high: {antialias: true, segments: 64, fillLight: true, environment: true},
	medium: {antialias: true, segments: 32, fillLight: true, environment: true},
	// The fill light is the first thing to go: it costs a full extra
	// lighting pass and its absence reads as "moodier", not as "broken".
	// The environment map goes with it — a cubemap in memory plus a
	// sample per pixel on every physical material is the wrong trade on
	// hardware already struggling, and the rim light (kept on every
	// tier) is what actually carries the silhouette.
	low: {antialias: false, segments: 16, fillLight: false, environment: false},
};
