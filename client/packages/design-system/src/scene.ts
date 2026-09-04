/**
 * BERX SCENE — the one systemic atmosphere/object palette.
 *
 * This used to be worlds.ts, a Color World Engine with four selectable
 * palettes (Night/Ice, Day/Ice, Sun, Aurora) behind a WorldSelectScreen.
 * That picker is retired: BERX has one visual identity, not a palette a
 * person chooses. This file keeps exactly the one real, shipped
 * definition (formerly `night_ice`) as the single BerxScene every
 * spatial component (BerxAura/BerxLens/BerxOrb/BerxMark) reads.
 *
 * The reduced, ACTUALLY-CONSUMED shape: exactly the props BerxAura/
 * BerxLens/BerxOrb take (ground/glow/counter/light/object/fill).
 * `palette.ts` also defines a richer `BerxScenePalette` (sky gradient,
 * bloom, ink, water...) but nothing in the app renders that shape —
 * building a new one on an unused contract would just be a second dead
 * surface. This one drives real, live components.
 *
 * Obsidian & Aurora — `light` is Aquamarine #00E5CC, the live BERX
 * accent (see tokens/index.ts's own header for the palette-override
 * history that replaced the old #4FD6E8 cyan / #07080A ground here).
 */
export interface BerxScene {
	/** BerxAura.ground — the near-solid ground the light sits on. */
	ground: string;
	/** BerxAura.glow — the main light pool. */
	glow: string;
	/** BerxAura.counter — the secondary, cooler pool. */
	counter: string;
	/** BerxLens/BerxOrb/BerxMark .light — the key light. This is the ONE place the brand accent is spent in the atmosphere. */
	light: string;
	/** BerxLens.body / BerxOrb.body — the glass object's own body colour. */
	object: string;
	/** BerxOrb.fill — secondary bounce light on the object. */
	fill: string;
	/**
	 * Environmental particle colour — a NEW, separate role from `light`.
	 *
	 * These were previously drawn in `light` (the brand accent), which
	 * is what turned every BERX background into a field of teal dust.
	 * The transformation directive is explicit that atmosphere is
	 * "volumetric light, soft haze, depth fog, ambient illumination"
	 * with "restrained highlights, controlled luminance" — that is a
	 * LUMINANCE effect, not a hue one. Particles are therefore neutral
	 * here, and the accent stays where it means something: the key
	 * light on a brand object, and interaction.
	 */
	dust: string;
}

/**
 * CONTROLLED LUMINANCE, not a colour scheme.
 *
 * This object used to read glow #1FA893 (teal), counter #3B3F7A
 * (violet), fill #3E8FD9 (blue) — three saturated hues that made every
 * background its own small multicolour composition. The directive
 * forbids exactly that ("Do not create random multicolor themes. Do not
 * introduce purple or yellow as primary interface colors"), so these
 * are now neutral luminance values with only a trace of temperature to
 * keep the three pools separable from one another:
 *   - `glow` is the key haze, coolest and brightest;
 *   - `counter` is a cooler, deeper pool that reads as distance;
 *   - `fill` carries a faint warmth so the two cool pools have
 *     something to sit against, which is what stops a purely grey
 *     atmosphere from looking flat.
 * Every one of them is mixed toward the real environment ground at
 * runtime (see theme/index.tsx's buildScene), so these are the
 * saturated ENDS of a mix, never what actually paints on screen.
 */
export const BERX_SCENE: BerxScene = {
	ground: '#05060A',
	glow: '#C7D4E2',
	counter: '#8C98AC',
	light: '#00E5CC',
	object: '#0E1015',
	fill: '#D8CFC4',
	dust: '#EAF0F7',
};
