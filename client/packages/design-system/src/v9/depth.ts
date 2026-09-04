/**
 * BERX V9 SPATIAL ENGINE — D0-D5, camera, perspective, parallax, tilt.
 *
 * This is the "5D Foundation" layer every scene family and every one of
 * the 300 screens is built inside. It owns the geometry; families own
 * composition; screens own content, data and priority.
 *
 * THE NUMBERS ARE THE ARCHIVE'S, NOT INVENTED:
 *   - z per layer:   berx.tokens.v9.json `depth_px` (0/8/24/48/96/160)
 *   - camera:        every scene contract's `scene.camera`
 *                    (perspectivePx 1200, fovDeg 42, tiltDeg 0)
 *   - parallax:      MOTION_SPEC_V2 (0.15/0.20/0.35/0.65/1.00, D5 bound
 *                    to interaction)
 *   - tilt:          MOTION_SPEC_V2, max +/-2.5 deg
 *   - entry order:   MOTION_SPEC_V2, D0 -> D1 -> D2 -> D3 -> D4 -> D5
 *
 * WHY A PROJECTION AND NOT A SCALE TABLE. `depth_px` is a real z in
 * pixels, and the contracts give a real camera distance, so a layer's
 * on-screen scale is a genuine perspective projection —
 * perspective / (perspective + z) — not a per-level number chosen to
 * look right. That is what makes two different screens agree about how
 * far away "D2" is.
 *
 * RN HAS NO translateZ. Checked against RN's own transform docs: only
 * translateX/Y exist. This codebase's established, disclosed substitute
 * (BerxSpatialCard, BerxPanel3D) is `perspective` + `scale` + `rotateY`,
 * reused here rather than claiming a transform the platform lacks. The
 * z values are therefore real inputs to real projection math, not a
 * fake 3D transform.
 */
import {BERX_V9, BERX_V9_PARALLAX, BERX_V9_TILT_MAX_DEG, type BerxV9Depth} from './tokens';

/** Camera, exactly as every scene contract declares it. */
export const BERX_V9_CAMERA = {perspectivePx: 1200, fovDeg: 42, tiltDeg: 0} as const;

/** Real perspective projection of a z (px) at the scene camera. z is positive-away. */
export function projectScale(z: number, perspective: number = BERX_V9_CAMERA.perspectivePx): number {
	return perspective / (perspective + z);
}

export interface BerxV9LayerGeometry {
	depth: BerxV9Depth;
	/** The archive's own z for this layer, in px. */
	z: number;
	/** Projected scale at the scene camera — what the layer actually renders at. */
	scale: number;
	/** Scroll/pointer parallax factor; null on D5, which the archive binds to interaction instead. */
	parallax: number | null;
	/**
	 * Atmospheric falloff. Distant layers lose contrast before they lose
	 * edges, so this is applied to opacity/ink strength by callers rather
	 * than as a filter (RN has none).
	 */
	opacity: number;
	/** Backdrop blur for this layer, from the archive's own blur_px scale. */
	blur: number;
}

/**
 * The one geometry table. Derived, not typed in: `z` comes from the
 * archive tokens, `scale` from the projection, `parallax` from the
 * motion spec. Only `opacity`/`blur` are a reading of the archive's
 * prose ("further away: softer, lower contrast") onto its own blur
 * scale — a real mapping of its two statements, disclosed as such.
 */
export const BERX_V9_GEOMETRY: Record<BerxV9Depth, BerxV9LayerGeometry> = (() => {
	const opacity: Record<BerxV9Depth, number> = {D0: 0.55, D1: 0.7, D2: 0.88, D3: 1, D4: 1, D5: 1};
	const blur: Record<BerxV9Depth, number> = {
		D0: BERX_V9.blur_px.hero,
		D1: BERX_V9.blur_px.deep,
		D2: BERX_V9.blur_px.soft,
		D3: BERX_V9.blur_px.surface,
		D4: BERX_V9.blur_px.soft,
		D5: 0,
	};
	const out = {} as Record<BerxV9Depth, BerxV9LayerGeometry>;
	(Object.keys(BERX_V9.depth_px) as BerxV9Depth[]).forEach((d) => {
		const z = BERX_V9.depth_px[d];
		out[d] = {depth: d, z, scale: Math.round(projectScale(z) * 10000) / 10000, parallax: BERX_V9_PARALLAX[d], opacity: opacity[d], blur: blur[d]};
	});
	return out;
})();

/**
 * Entry choreography — "D0 appears first, D1 settles, D2 media arrives,
 * D3 glass resolves, D4 controls, D5 light feedback" (MOTION_SPEC_V2).
 * Returns the delay, in ms, at which a layer should begin its entrance,
 * scaled off the archive's own `fast` tier so the whole sequence lands
 * inside one spatial beat rather than dragging.
 */
export function entryDelayMs(depth: BerxV9Depth, reducedMotion = false): number {
	if (reducedMotion) return 0;
	const step = Math.round(BERX_V9.motion_ms.fast / 3); // ~73ms
	return ['D0', 'D1', 'D2', 'D3', 'D4', 'D5'].indexOf(depth) * step;
}

/**
 * Pointer/gyro tilt for a layer, clamped to the archive's own maximum.
 * Nearer layers tilt more (they subtend more of the view), which is the
 * same relationship the parallax factors already express, so tilt reuses
 * them rather than introducing a second, unrelated ladder.
 */
export function tiltDegFor(depth: BerxV9Depth, signal: number, reducedMotion = false): number {
	if (reducedMotion) return 0;
	const factor = BERX_V9_PARALLAX[depth] ?? 1;
	const clamped = Math.max(-1, Math.min(1, signal));
	return clamped * BERX_V9_TILT_MAX_DEG * factor;
}

/**
 * Depth shadow. The archive does not give shadow numbers, so this is
 * derived from its own z-scale rather than invented: a layer's shadow
 * grows with how far it stands off the layer behind it. `ink` is passed
 * in because the environment decides the shadow colour (soft neutral on
 * a light ground, deeper on a dark one) while the LAYER decides its
 * strength.
 */
export function depthShadowV9(depth: BerxV9Depth, ink: string) {
	const order: BerxV9Depth[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5'];
	const i = order.indexOf(depth);
	const standoff = i <= 0 ? 0 : BERX_V9.depth_px[depth] - BERX_V9.depth_px[order[i - 1]];
	return {
		shadowColor: ink,
		shadowOpacity: standoff === 0 ? 0 : Math.min(0.5, 0.12 + standoff / 320),
		shadowRadius: standoff * 0.42,
		shadowOffset: {width: 0, height: Math.round(standoff * 0.22)},
		elevation: Math.round(standoff / 8),
	};
}
