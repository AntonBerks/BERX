/**
 * BERX 5D semantic presentation: what a domain kind is made of.
 *
 * Geometry (geometry.ts) says what form an object takes. This says
 * what that form is made of and what, if anything, it emits. The two
 * are deliberately separate modules and deliberately not two answers
 * to the same question — the geometry kind lives in exactly one place,
 * and nothing here restates it.
 *
 * The colours are the frozen BERX Visual DNA, kept as the hexes
 * themselves and read through BERX's own colour parser rather than
 * restated as hand-tuned triples. The numbers a shader wants and the
 * numbers a stylesheet wants should not be two separate sources of the
 * same truth, and a palette written as bare decimals cannot be checked
 * against the spec it came from.
 *
 * BERX Energy (#4FD6E8) is rare by contract. It is emitted strictly in
 * proportion to an object's `energy` — NOW, live, realtime, focus — so
 * an object at rest emits none of it at all. It is never a base
 * colour, and nothing is tinted cyan for looks.
 *
 * This is not BERX_V9_COLOR. That palette paints the DOM V9 layer and
 * is what 33 contract gates and 24 web gates already measure;
 * repainting it to match the world would move the ground under all of
 * them. The two agree where it matters — #07080A is the ground in
 * both, #4FD6E8 is BERX Energy in both — and this ladder adds the
 * darker structure steps and the gold the GPU world needs.
 */
import { parseColor } from './color';
import type { BerxSpatialEntityKind, BerxSpatialObject } from './world';

/** A 0..1 triple, as the shader's uniforms consume it. */
export type BerxShaderRgb = [number, number, number];

export interface BerxSpatialPresentation {
  /** The lit base colour. */
  base: BerxShaderRgb;
  /** What the object gives off on its own. Zero for anything at rest. */
  emissive: BerxShaderRgb;
}

const shaderRgb = (hex: string): BerxShaderRgb => {
  const c = parseColor(hex);
  /* the DNA is a fixed literal set; a failure here is a typo in this
     file, not a runtime condition to degrade around */
  if (!c) throw new Error(`BERX 5D DNA: ${hex} is not a colour`);
  return [c.r / 255, c.g / 255, c.b / 255];
};

/** The frozen 5D Visual DNA. */
export const BERX_5D_DNA = {
  ink: shaderRgb('#07080A'),
  slate: shaderRgb('#0D1014'),
  graphite: shaderRgb('#15191E'),
  steel: shaderRgb('#1C2228'),
  pearl: shaderRgb('#F2F0EB'),
  mist: shaderRgb('#A7ADB4'),
  shadow: shaderRgb('#6F767E'),
  gold: shaderRgb('#C9B58A'),
  /** BERX Energy. Emitted with energy, never a base. */
  energy: shaderRgb('#4FD6E8'),
} as const;

/**
 * What each kind is made of, and what it emits when it is live.
 *
 * `amount` is the fraction of `glow` emitted at full energy. Nothing is
 * hard-zeroed any more: several kinds used to be written as "never
 * emits, at any energy", which encoded a design claim the data does
 * not support and, worse, silently threw away the one signal that
 * matters — a place with a moment still running is exactly the NOW the
 * palette reserves BERX Energy for, and it was rendering identically
 * to a quiet one.
 *
 * Rarity is enforced by the only thing that can honestly enforce it:
 * `energy` is raised solely by a real server signal, and an object at
 * rest carries zero, so it emits zero. Gold is a *base* — what a
 * scheduled thing is made of; BERX Energy is the *glow* — what
 * anything gives off while it is live right now. Every kind glows the
 * same colour for the same reason, and only the base says what kind of
 * thing it is.
 *
 * `amount` is the fraction of `glow` emitted at full energy, and these
 * numbers used to be far too small to mean anything. The world's
 * ambient term is #15191E at 1.35, which is about 0.13 per channel; an
 * event running right now emitted 0.044, a third of the light already
 * falling on it, and rendered as a dark ring. An emissive below
 * ambient is not a subtle signal, it is an absent one — so a fully
 * live object now emits several times ambient and is unmistakable,
 * while an object at rest still emits exactly nothing.
 */
const materials: Record<BerxSpatialEntityKind, {base: BerxShaderRgb; glow: BerxShaderRgb; amount: number}> = {
  /* people carry the light in this world */
  person: {base: BERX_5D_DNA.pearl, glow: BERX_5D_DNA.energy, amount: 0.45},
  /* a moment is live only while it is live */
  moment: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.55},
  /* architecture, lit rather than lighting — until something is
     happening inside it, which is what NOW is */
  place: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.5},
  /* gold is what an event is made of; cyan is what it gives off while
     it is actually running */
  event: {base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.energy, amount: 0.7},
  experience: {base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.energy, amount: 0.5},
  community: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.4},
  business: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.4},
  collection: {base: BERX_5D_DNA.graphite, glow: BERX_5D_DNA.energy, amount: 0.35},
  message: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.45},
  /* creating is a focus moment, and focus is where energy belongs */
  create: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.8},
};

export function presentationForKind(kind: BerxSpatialEntityKind, object?: BerxSpatialObject): BerxSpatialPresentation {
  const m = materials[kind];
  const energy = Math.max(0, Math.min(1, object?.energy ?? 0));
  const lit = energy * m.amount;
  return {
    base: [...m.base] as BerxShaderRgb,
    /* zero at rest: an object that is not live emits nothing */
    emissive: [m.glow[0] * lit, m.glow[1] * lit, m.glow[2] * lit],
  };
}
