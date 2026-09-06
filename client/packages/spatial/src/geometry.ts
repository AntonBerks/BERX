/**
 * BERX 5D geometry and material grammar.
 *
 * Geometry is semantic: what an object *is* determines the form it
 * takes in the world. A person is an orb, a moment is a surface, a
 * place is a portal you go through, an event is a ring that closes.
 * Nothing here is decoration — the form is how the world is read
 * before a single label is.
 *
 * Colour is the frozen BERX Visual DNA, by name rather than by
 * hand-tuned triple. Two modules used to answer `presentationForKind`
 * with two different palettes: this one, in unrelated greys, was the
 * one wired into the renderer; the other, carrying the real semantic
 * palette, was exported from nowhere and rendered never. They are one
 * module now, and the constants below are the DNA hexes themselves.
 *
 * BERX Energy (#4FD6E8) is rare on purpose. It is emitted only in
 * proportion to an object's `energy` — NOW, live, realtime, focus —
 * so an object at rest emits none of it at all. It is never a base
 * colour, and nothing is tinted cyan for looks.
 */
import {parseColor} from './color';
import type {BerxSpatialEntityKind, BerxSpatialObject, BerxVec3} from './world';

export type BerxGeometryKind = 'orb'|'frame'|'surface'|'portal'|'ring'|'node'|'stack'|'message'|'create';
export interface BerxGeometrySpec { kind: BerxGeometryKind; radius?: number; width?: number; height?: number; depth?: number; segments?: number; bevel?: number; emissive?: number; }

/** A 0..1 triple, as the shader's uniforms consume it. */
export type BerxShaderRgb = [number, number, number];
/** What a kind is made of: its lit base and what it emits on its own. */
export interface BerxSpatialPresentation { base: BerxShaderRgb; emissive: BerxShaderRgb; }

/**
 * The frozen 5D Visual DNA, kept as the hexes themselves and read
 * through BERX's own colour parser rather than restated as magic
 * triples — the numbers a shader wants and the numbers a stylesheet
 * wants should not be two separate sources of the same truth.
 *
 * This is deliberately not BERX_V9_COLOR. That palette paints the DOM
 * V9 layer and is the thing 33 contract gates and 24 web gates already
 * measure; repainting it to match the world would move the ground
 * under all of them. The two agree where it matters — #07080A is the
 * ground in both, #4FD6E8 is BERX Energy in both — and this ladder
 * adds the darker structure steps and the gold the GPU world needs.
 */
const shaderRgb = (hex: string): BerxShaderRgb => {
	const c = parseColor(hex);
	/* the DNA is a fixed literal set; a parse failure here is a typo in
	   this file, not a runtime condition to degrade around */
	if (!c) throw new Error(`BERX 5D DNA: ${hex} is not a colour`);
	return [c.r / 255, c.g / 255, c.b / 255];
};

export const BERX_5D_DNA = {
	ink: shaderRgb('#07080A'),
	slate: shaderRgb('#0D1014'),
	graphite: shaderRgb('#15191E'),
	steel: shaderRgb('#1C2228'),
	pearl: shaderRgb('#F2F0EB'),
	mist: shaderRgb('#A7ADB4'),
	shadow: shaderRgb('#6F767E'),
	gold: shaderRgb('#C9B58A'),
	/** BERX Energy. Rare by contract: emitted with energy, never a base. */
	energy: shaderRgb('#4FD6E8'),
} as const;

const specs: Record<BerxSpatialEntityKind,BerxGeometrySpec> = {
 person:{kind:'orb',radius:.72,segments:32,bevel:.08}, moment:{kind:'surface',width:1.9,height:2.35,depth:.045,bevel:.08}, place:{kind:'portal',width:1.8,height:2.1,depth:.22,bevel:.14}, event:{kind:'ring',radius:.95,segments:48,emissive:.12}, experience:{kind:'frame',width:1.9,height:1.4,depth:.18,bevel:.1}, community:{kind:'node',radius:.86,segments:24}, business:{kind:'stack',width:1.7,height:1.15,depth:.45,bevel:.1}, collection:{kind:'stack',width:1.6,height:1.05,depth:.34,bevel:.1}, message:{kind:'message',width:1.55,height:.72,depth:.12,bevel:.16}, create:{kind:'create',radius:.82,segments:40,emissive:.08}
};

/**
 * What each kind is made of, and what — if anything — lights it from
 * within. `glow` is the fraction of a colour emitted at full energy;
 * `0` means the kind never emits, at any energy.
 */
const materials: Record<BerxSpatialEntityKind, {base: BerxShaderRgb; glow: BerxShaderRgb; amount: number}> = {
	/* people carry the light in this world */
	person: {base: BERX_5D_DNA.pearl, glow: BERX_5D_DNA.energy, amount: 0.08},
	/* a moment is live only while it is live */
	moment: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0.10},
	/* a place is architecture: it is lit, it does not light */
	place: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0},
	/* gold is for what is happening — the warm end of the DNA */
	event: {base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.gold, amount: 0.08},
	experience: {base: BERX_5D_DNA.gold, glow: BERX_5D_DNA.gold, amount: 0.06},
	community: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0},
	business: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.gold, amount: 0.05},
	collection: {base: BERX_5D_DNA.graphite, glow: BERX_5D_DNA.energy, amount: 0},
	message: {base: BERX_5D_DNA.mist, glow: BERX_5D_DNA.energy, amount: 0},
	/* creating is a focus moment, and focus is where energy belongs */
	create: {base: BERX_5D_DNA.steel, glow: BERX_5D_DNA.energy, amount: 0.18},
};

export function geometryForEntity(kind: BerxSpatialEntityKind): BerxGeometrySpec { return {...specs[kind]}; }
export function geometryScale(spec: BerxGeometrySpec): BerxVec3 { return {x:spec.width??spec.radius??1,y:spec.height??spec.radius??1,z:spec.depth??spec.radius??1}; }

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
