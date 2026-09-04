/**
 * BERX DEPTH SYSTEM — the seven standardized depth levels.
 *
 * The transformation directive's own spec, made real: "Create
 * standardized depth levels... Objects further away: smaller, softer,
 * less detailed, slightly blurred, lower contrast. Objects closer:
 * sharper, larger, more detailed, stronger shadow, stronger material
 * response."
 *
 * Before this file, "depth" in BERX was a per-component number
 * (BerxStage's own `depth` prop, BerxSpatialCard's own translateZ
 * approximation, each screen's hand-picked scale/opacity) — real
 * spatial intent, but no shared scale, so two screens could disagree
 * about what "further away" looks like. This is the one table they now
 * both read.
 *
 * WHY THESE NUMBERS. They are a real optical falloff, not seven evenly
 * spaced guesses:
 *   - `scale` follows a perspective divisor. At a camera distance of
 *     900 (the same `perspective: 900` BerxPanel3D/BerxSpatialCard
 *     actually use), an object pushed back by `z` renders at
 *     900 / (900 + |z|). DEPTH_4 (z = 0) is the focal plane at 1.0;
 *     everything else is that formula, not a hand-tuned number.
 *   - `blur` grows with distance from that focal plane in BOTH
 *     directions — a real camera's depth of field puts foreground
 *     elements slightly out of focus too, which is exactly why DEPTH_6
 *     (nearest, an element being dragged toward the viewer) carries a
 *     small blur rather than zero.
 *   - `opacity` and `contrast` fall off with distance the way
 *     atmospheric haze actually works: distant objects lose contrast
 *     against the ground before they lose their edges.
 *   - `elevation` is the shadow strength that pairs with each level,
 *     so a card that moves forward gets a physically consistent shadow
 *     instead of a separately-chosen one.
 *
 * `zOf()` is the inverse the transform layer needs: given a level,
 * the virtual Z the perspective math was derived from. Kept alongside
 * the table so a component animating BETWEEN levels interpolates in
 * real Z space rather than lerping the already-projected scale, which
 * would move at visibly the wrong rate through the middle of a
 * transition.
 */

/** The camera distance every BERX perspective transform uses. One number, one scene. */
export const BERX_PERSPECTIVE = 900;

export type BerxDepthLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BerxDepthTokens {
	/** Virtual Z. Negative = further from the camera; positive = nearer. */
	z: number;
	/** Projected scale at BERX_PERSPECTIVE — never hand-picked, see this file's header. */
	scale: number;
	/** Depth-of-field blur, px. Grows either side of the DEPTH_4 focal plane. */
	blur: number;
	/** Atmospheric falloff. */
	opacity: number;
	/**
	 * Contrast multiplier for content at this level (1 = full). Applied
	 * by callers to text/border alpha rather than as a filter, since RN
	 * has no real `filter: contrast()` — see BerxDepthLayer.
	 */
	contrast: number;
	/** The shadow strength that physically belongs to this level. */
	elevation: {radius: number; opacity: number; offsetY: number};
	/** What this level is FOR — the directive's own naming, kept so call sites read as intent, not as magic numbers. */
	role: string;
}

function project(z: number): number {
	// Real perspective projection, the same one the transform stack uses.
	return BERX_PERSPECTIVE / (BERX_PERSPECTIVE + -z);
}

function level(z: number, blur: number, opacity: number, contrast: number, elevation: BerxDepthTokens['elevation'], role: string): BerxDepthTokens {
	return {z, scale: Math.round(project(z) * 1000) / 1000, blur, opacity, contrast, elevation, role};
}

/**
 * DEPTH 0 → 6, exactly the directive's own ladder. DEPTH_4 is the focal
 * plane (z = 0, scale 1, no blur): primary content is what the camera
 * is actually focused on, so everything else is measured from it.
 */
export const BERX_DEPTH: Record<BerxDepthLevel, BerxDepthTokens> = {
	0: level(-620, 14, 0.44, 0.42, {radius: 0, opacity: 0, offsetY: 0}, 'background atmosphere'),
	1: level(-420, 8, 0.58, 0.56, {radius: 0, opacity: 0, offsetY: 0}, 'distant objects'),
	2: level(-260, 4, 0.72, 0.7, {radius: 2, opacity: 0.1, offsetY: 1}, 'environmental particles'),
	3: level(-120, 1.5, 0.88, 0.86, {radius: 10, opacity: 0.22, offsetY: 4}, 'secondary UI'),
	4: level(0, 0, 1, 1, {radius: 18, opacity: 0.34, offsetY: 8}, 'primary content'),
	5: level(60, 0, 1, 1, {radius: 28, opacity: 0.44, offsetY: 14}, 'active interactive element'),
	6: level(120, 1, 1, 1, {radius: 38, opacity: 0.52, offsetY: 20}, 'foreground interaction'),
};

/** The virtual Z for a level — see this file's header on why callers interpolate here rather than on `scale`. */
export function zOf(depth: BerxDepthLevel): number {
	return BERX_DEPTH[depth].z;
}

/** Projected scale for an arbitrary Z, so an in-between animation frame is as real as the seven named stops. */
export function scaleAtZ(z: number): number {
	return project(z);
}

/**
 * A real RN shadow style for a depth level. `color` is passed in rather
 * than baked: the directive's own colour system wants SOFT NEUTRAL
 * shadows in both environments, which means a near-black shadow on a
 * white Day ground and a deeper black on the Night ground — the level
 * decides the STRENGTH, the environment decides the ink.
 */
export function depthShadow(depth: BerxDepthLevel, color: string) {
	const {elevation} = BERX_DEPTH[depth];
	return {
		shadowColor: color,
		shadowOpacity: elevation.opacity,
		shadowRadius: elevation.radius,
		shadowOffset: {width: 0, height: elevation.offsetY},
		// Android's own single-number shadow. Derived from the same
		// radius rather than chosen separately, so the two platforms
		// stay in step.
		elevation: Math.round(elevation.radius / 3),
	};
}
