/**
 * Material resolver — turns the five physical numbers of a BERX
 * material (transmission / roughness / specular / ior / emissive)
 * into concrete, renderable surface values.
 *
 * This is the file that makes "5D ≠ blur + border + shadow" true:
 * a surface's fill, blur, edge highlight, refractive rim and glow
 * are all *derived* from the material, so ClearGlass and DarkMetal
 * cannot accidentally render the same way, and a material change is
 * a visible change rather than a renamed token.
 *
 * Every formula below is deterministic and documented. None of them
 * are physically exact — they are a consistent, monotonic mapping
 * chosen so that the ordering a designer expects (Crystal is
 * clearer than FrostGlass; NeonEnergy glows and DarkMetal does not)
 * is guaranteed by the math rather than by hand-tuned per-material
 * constants that drift.
 */
import {
	BERX_MATERIALS,
	BERX_V9_BLUR,
	BERX_V9_COLOR,
	type BerxMaterialName,
	type BerxMaterialSpec,
} from './tokens';
import {clamp, contrastRatio, flatten, mix, rgba, round} from './color';

export interface BerxMaterialSurfaceInput {
	material: BerxMaterialName;
	/** Accent of the active color world — drives emissive glow hue. */
	accent?: string;
	/** The opaque color actually behind this surface, for the contrast check. */
	ground?: string;
	/** Blur budget already spent by ancestors; a surface over budget falls back opaque. */
	blurBudgetAvailable?: boolean;
	/** Forces the WCAG "opaque surface mode" fallback from the v9 accessibility contract. */
	forceOpaque?: boolean;
	/**
	 * How far this surface sits from the substrate, 0..1 (a depth
	 * layer passes z/5). In a dark environment, elevation is light:
	 * a surface higher in z catches more of the key light and reads
	 * lighter. Material decides texture, edge, blur and glow;
	 * elevation decides lift. Keeping them separate is what stops
	 * the substrate from rendering brighter than the content plane
	 * just because it happens to be an opaque material.
	 */
	elevation?: number;
}

export interface BerxMaterialSurface {
	material: BerxMaterialName;
	/** Translucent fill. Already opaque when `opaqueFallback` is true. */
	backgroundColor: string;
	/** Backdrop blur radius in px. 0 when blur is unavailable or unbudgeted. */
	blurPx: number;
	/** Hairline border. */
	borderColor: string;
	borderWidth: number;
	/** Top edge specular highlight — the lit edge of a real pane. */
	edgeHighlightColor: string;
	/** Refractive rim from `ior`; 0 for non-refractive materials. */
	rimWidth: number;
	rimColor: string;
	/** Self-illumination. `glowRadius` 0 means the material does not emit. */
	glowColor: string;
	glowRadius: number;
	/** True when translucency was dropped (budget or a11y) and replaced by an opaque equivalent. */
	opaqueFallback: boolean;
	/** Measured contrast of primary text on this surface over `ground`. */
	textContrast: number;
	/** The opaque color this surface actually resolves to on screen. */
	effectiveColor: string;
}

/** WCAG 2.2 AA body text. The v9 contract targets AA; this is the number it means. */
export const BERX_MIN_TEXT_CONTRAST = 4.5;

/**
 * Fill opacity. A fully transmissive pane barely tints; an opaque
 * material (DarkMetal, Carbon, MediaSurface) covers completely.
 * Between them the tint rises linearly with opacity (1 - transmission).
 */
function fillAlpha(m: BerxMaterialSpec): number {
	if (m.transmission <= 0) return 1;
	return round(clamp(0.03 + (1 - m.transmission) * 0.16, 0.03, 0.34));
}

/**
 * Blur radius. Roughness is what scatters transmitted light, so a
 * material that transmits nothing gets no backdrop blur at all —
 * blurring behind an opaque pane is wasted GPU, which is exactly the
 * kind of budget leak the performance contract targets.
 */
function blurRadius(m: BerxMaterialSpec): number {
	if (m.transmission <= 0.02) return 0;
	const scaled = BERX_V9_BLUR.sm + m.roughness * (BERX_V9_BLUR.xl - BERX_V9_BLUR.sm) * 1.15;
	return Math.round(clamp(scaled, BERX_V9_BLUR.sm, BERX_V9_BLUR.xl));
}

/** Specular drives both the hairline border and the lit top edge. */
function borderAlpha(m: BerxMaterialSpec): number {
	return round(clamp(0.05 + m.specular * 0.11, 0.05, 0.18));
}

function edgeAlpha(m: BerxMaterialSpec): number {
	return round(clamp(0.06 + m.specular * 0.18, 0.06, 0.26));
}

/**
 * Refraction. Index of refraction 1.0 bends nothing, so materials at
 * ior 1.0 (metal, carbon, media, neon) get no rim; glass does, and
 * Crystal (1.35) gets the widest.
 */
function rim(m: BerxMaterialSpec): {width: number; alpha: number} {
	const delta = m.ior - 1;
	if (delta <= 0.001) return {width: 0, alpha: 0};
	return {
		width: round(clamp(delta * 4, 0.5, 1.6), 2),
		alpha: round(clamp(delta * 0.7 + m.specular * 0.08, 0.06, 0.3)),
	};
}

export function resolveMaterial(input: BerxMaterialSurfaceInput): BerxMaterialSurface {
	const spec = BERX_MATERIALS[input.material];
	const accent = input.accent ?? BERX_V9_COLOR.accent;
	const ground = input.ground ?? BERX_V9_COLOR.bg;

	const blurAvailable = input.blurBudgetAvailable !== false && !input.forceOpaque;
	const blurPx = blurAvailable ? blurRadius(spec) : 0;

	/**
	 * Progressive fallback, never semantic loss: when blur is
	 * unavailable the pane cannot rely on the backdrop to separate it
	 * from the content behind, so it becomes an opaque surface at the
	 * same lightness instead of a translucent one that would now read
	 * as noise. Content, order and roles are untouched.
	 */
	const wantsOpaque = input.forceOpaque === true || spec.transmission <= 0 || (blurPx === 0 && spec.transmission > 0);

	const lift = clamp(input.elevation ?? 0.6, 0, 1);
	/**
	 * Elevation orders the planes; the material colours them.
	 *
	 * Two failures came from letting the material set the brightness
	 * outright. The content plane and the control plane resolved 0.4
	 * L* apart on a dark scene — a difference no eye resolves, which
	 * is why controls never read as being in front of the content they
	 * act on. And a scene whose contract names a dense material got a
	 * structure plane *brighter* than the content standing on it:
	 * BERX-176 resolved D2 at 16.6 L* against D3 at 12.1.
	 *
	 * So elevation now sets the band — roughly 3 L* per plane, which is
	 * a step you can see without being told to look for it — and the
	 * material may shift its own surface within ±6% of that band.
	 *
	 * The ±6% is not a taste: adjacent planes are 31% apart in tint, so
	 * a shift of ±10% left a worst case (a dense material one plane
	 * down, a clear one above it) with only 0.4 L* between them, which
	 * the probe measured and rejected. At ±6% the smallest step any of
	 * the 300 contracts can produce stays visible on both platforms.
	 */
	const elevationTint = 0.028 + lift * 0.128;
	/* fillAlpha returns 1 for a material with no transmission, which is
	   a statement about coverage rather than a point on this scale —
	   left unclamped it pushed the shift to +29% and flipped adjacent
	   planes on the contracts that name a metal. */
	const materialShift = 0.94 + (Math.min(fillAlpha(spec), 0.34) / 0.34) * 0.12;
	const tint = round(clamp(elevationTint * materialShift, 0.015, 0.44), 4);
	const translucentFill = rgba(BERX_V9_COLOR.textPrimary, tint);

	/**
	 * The opaque fallback is the colour the glass would have made.
	 *
	 * It used to be computed independently — a mix from the substrate
	 * toward the surface colour, scaled by elevation — and the two
	 * scales did not agree. A place scene resolved D2 as glass at
	 * rgb(23,24,26) and D3, which had lost the blur draw, as an opaque
	 * rgb(13,14,18): the content plane landed *behind* the structure
	 * it is supposed to sit in front of, and every screen on React
	 * Native — where nothing has blur — inherited that inversion.
	 *
	 * Flattening the layer's own translucent fill over the substrate
	 * gives exactly the value the glass composites to, so losing blur
	 * changes what a surface is made of and never where it sits in the
	 * hierarchy.
	 */
	/**
	 * One scale for every surface.
	 *
	 * The opaque fill is the colour this layer's own veil composites to
	 * over the substrate. That is deliberate for both kinds of
	 * material, and it took two failures to get here.
	 *
	 * A glass layer that loses its blur used to be mixed on an
	 * independent scale, so it fell *behind* the layer it sits in front
	 * of — every screen on React Native, where nothing has blur.
	 *
	 * A material with no transmission — DarkMetal, Carbon — used to be
	 * mixed from the substrate toward the surface token, and that token
	 * is only marginally lighter than the substrate: BERX-291 resolved
	 * its structure and content planes at 3.6 and 4.0 L*, half a step
	 * apart, while a glass scene put the same two planes at 9 and 11.
	 * Two scales, one of which cannot reach the top of the range.
	 *
	 * So lightness comes from elevation for everything, and the
	 * material shows itself where it actually differs: blur, edge,
	 * rim, roughness, glow. A metal pane and a glass pane at the same
	 * height read as the same distance away, which is what being at the
	 * same height means.
	 */
	const opaqueFill = flatten(translucentFill, ground);

	const backgroundColor = wantsOpaque ? opaqueFill : translucentFill;
	const effectiveColor = wantsOpaque ? opaqueFill : flatten(translucentFill, ground);

	const r = rim(spec);

	return {
		material: input.material,
		backgroundColor,
		blurPx: wantsOpaque ? 0 : blurPx,
		borderColor: rgba(BERX_V9_COLOR.textPrimary, borderAlpha(spec)),
		borderWidth: 1,
		edgeHighlightColor: rgba(BERX_V9_COLOR.textPrimary, edgeAlpha(spec)),
		rimWidth: r.width,
		rimColor: rgba(accent, r.alpha),
		glowColor: spec.emissive > 0 ? rgba(accent, round(clamp(spec.emissive * 0.8, 0, 0.42))) : 'transparent',
		glowRadius: spec.emissive > 0 ? Math.round(clamp(spec.emissive * 64, 0, 42)) : 0,
		opaqueFallback: wantsOpaque,
		textContrast: contrastRatio(BERX_V9_COLOR.textPrimary, effectiveColor),
		effectiveColor,
	};
}

/**
 * Readability gate. Glass and lighting must never destroy legibility
 * (v9 §Accessibility), so this returns the surface unchanged when it
 * already passes AA, and the opaque-mode surface when it does not.
 * Callers get a real measurement back either way.
 */
export function ensureReadableSurface(input: BerxMaterialSurfaceInput): BerxMaterialSurface {
	const surface = resolveMaterial(input);
	if (surface.textContrast >= BERX_MIN_TEXT_CONTRAST) return surface;
	return resolveMaterial({...input, forceOpaque: true});
}
