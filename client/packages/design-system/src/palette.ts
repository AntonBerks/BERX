/**
 * BERX CINEMATIC PALETTES — the colour of a scene, as opposed to the
 * colour of the brand.
 *
 * tokens/index.ts holds BERX's identity: the ground, the surfaces, the
 * text, and the live accent. This file holds the ATMOSPHERES those
 * live in. A product painted in only its two brand colours from edge
 * to edge reads as a template; a product whose scenes have real colour
 * and whose brand owns the light, the rims and the controls reads as a
 * place.
 *
 * The accent is `light` in every palette here — it is always the
 * source lighting the frame, so the identity is never diluted no
 * matter how rich the sky gets.
 *
 * CONFIRMED DEAD CODE, LEFT AS AUTHORED REFERENCE, NOT WIRED TO THE
 * LIVE THEME. Nothing in the app imports BERX_DUSK/BERX_NIGHT/
 * BERX_DAWN/BERX_SCENE from this file (scene.ts's own header already
 * flagged this — its BERX_SCENE, a DIFFERENT, actually-live object of
 * the same name, is the one useBerxScene() resolves). `light` below
 * still reads the current default accent so this stays internally
 * consistent if it's ever picked up, but forcing three hand-authored
 * sky gradients (sky/bloom/bounce/ink, curated stop by stop) to
 * re-derive from a live accent for zero rendered effect would trade a
 * real, deliberate colour story for a mechanical one nothing shows —
 * disclosed here rather than silently left stale.
 */

export interface BerxScenePalette {
	/** Zenith → horizon, top first. */
	sky: string[];
	/** The bloom on the horizon line. */
	bloom: string;
	/** BERX cyan: the key light, every rim, every control. */
	light: string;
	/** Cool bounce from the opposite side of the scene. */
	bounce: string;
	/** Silhouette / ink colour for anything backlit. */
	ink: string;
	/** Body colour of glass objects. */
	orbBody: string;
	/** The plane below the horizon. */
	water: string;
	glassEdge: string;
	glassTint: string;
}

/** DUSK — the entry sequence. The moment after the sun has gone. */
export const BERX_DUSK: BerxScenePalette = {
	sky: ['#080B1C', '#111A3A', '#1D3260', '#2F5C86', '#5A9BAE', '#8FD3DC'],
	bloom: '#D6F7FA',
	light: '#00E5CC',
	bounce: '#6E8CFF',
	ink: '#060A14',
	orbBody: '#080D18',
	water: '#050912',
	glassEdge: '#DFF6FA',
	glassTint: '#08121F',
};

/** NIGHT — later in the sequence. Deeper, the city carrying the light. */
export const BERX_NIGHT: BerxScenePalette = {
	sky: ['#04060F', '#0A1026', '#121F45', '#1C3A5E', '#2C6478', '#4A9AAA'],
	bloom: '#A8E8F2',
	light: '#00E5CC',
	bounce: '#6E8CFF',
	ink: '#04070E',
	orbBody: '#060A12',
	water: '#03060D',
	glassEdge: '#CFEFF6',
	glassTint: '#060E1A',
};

/** DAWN — the completion screens. Warmth arriving. */
export const BERX_DAWN: BerxScenePalette = {
	sky: ['#0B1030', '#1B2450', '#3A3F76', '#6B5C90', '#B2809A', '#F0BFA8'],
	bloom: '#FFE3CC',
	light: '#00E5CC',
	bounce: '#FF9E7A',
	ink: '#0A0912',
	orbBody: '#0B0F1A',
	water: '#080A16',
	glassEdge: '#FFEEE2',
	glassTint: '#120E18',
};


/**
 * BERX SCENE — the ground the entry sequence stands on.
 *
 * Near-black, but not neutral: there is enough of the accent's own hue
 * in `ground` that the light sitting on it belongs to the same world.
 * A true #000 ground with a coloured glow on it always looks like two
 * separate things.
 */
export const BERX_SCENE = {
	ground: '#080A0F',
	/** The main pool. Deliberately desaturated — a saturated glow on a
	 *  dark ground is the signature of a template. */
	glow: '#2E7C8C',
	/** Opposite corner, cooler and much fainter, so the frame is not
	 *  lit by one colour alone. */
	counter: '#3B3F7A',
	/** BERX cyan, spent only where it is worth spending. */
	light: '#00E5CC',
	/** Body of the glass object: a hair above the ground, never below. */
	object: '#101620',
} as const;
