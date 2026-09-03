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
	/** BerxLens/BerxOrb/BerxMark .light — the key light. */
	light: string;
	/** BerxLens.body / BerxOrb.body — the glass object's own body colour. */
	object: string;
	/** BerxOrb.fill — secondary bounce light on the object. */
	fill: string;
}

export const BERX_SCENE: BerxScene = {
	ground: '#05060A',
	glow: '#1FA893',
	counter: '#3B3F7A',
	light: '#00E5CC',
	object: '#0E1015',
	fill: '#3E8FD9',
};
