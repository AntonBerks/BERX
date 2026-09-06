/**
 * The materials BERX is made of, as physical parameters.
 *
 * Base colour, metalness, roughness, emission, opacity, transmission
 * and index of refraction — the inputs a microfacet BRDF integrates,
 * not a set of CSS surfaces. The existing materials module resolves
 * the DOM layer's glass; this is what the GPU shades.
 *
 * Every name below is a BERX material, and each one has values that
 * mean something: obsidian is dark and smooth and reflects the room;
 * pearl is bright and slightly rough and barely metallic; soft gold is
 * a real metal with gold's own tint; dark glass transmits. Nothing is
 * a placeholder set of round numbers.
 */
import {parseColor} from './color';

export type BerxWorldMaterialName =
	| 'obsidian'
	| 'graphite'
	| 'pearl'
	| 'champagne'
	| 'soft-gold'
	| 'dark-glass'
	| 'ceramic'
	| 'metal'
	| 'fabric'
	| 'media'
	| 'energy';

export interface BerxWorldMaterial {
	baseColor: [number, number, number];
	/** 0 dielectric, 1 conductor. Values between are for layered surfaces. */
	metalness: number;
	/** 0 mirror, 1 fully diffuse. */
	roughness: number;
	/** Light the surface makes itself, before energy scales it. */
	emission: [number, number, number];
	opacity: number;
	/** How much light passes through. Non-zero only for glass. */
	transmission: number;
	/** Index of refraction. 1.5 is glass; metals do not use it. */
	ior: number;
}

const rgb = (hex: string): [number, number, number] => {
	const c = parseColor(hex);
	if (!c) throw new Error(`BERX 5D material: ${hex} is not a colour`);
	return [c.r / 255, c.g / 255, c.b / 255];
};
const NONE: [number, number, number] = [0, 0, 0];

export const BERX_WORLD_MATERIALS: Record<BerxWorldMaterialName, BerxWorldMaterial> = {
	/* the ground itself: near-black, smooth, and it holds a reflection */
	obsidian: {baseColor: rgb('#07080A'), metalness: 0.08, roughness: 0.18, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	graphite: {baseColor: rgb('#15191E'), metalness: 0.12, roughness: 0.52, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	/* people: bright, faintly waxy, not a mirror and not chalk */
	pearl: {baseColor: rgb('#F2F0EB'), metalness: 0.04, roughness: 0.34, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	champagne: {baseColor: rgb('#C9B58A'), metalness: 0.25, roughness: 0.3, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	/* a real metal: its own tint, no diffuse term */
	'soft-gold': {baseColor: rgb('#C9B58A'), metalness: 0.92, roughness: 0.28, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	'dark-glass': {baseColor: rgb('#0D1014'), metalness: 0, roughness: 0.08, emission: NONE, opacity: 0.68, transmission: 0.55, ior: 1.5},
	ceramic: {baseColor: rgb('#A7ADB4'), metalness: 0, roughness: 0.42, emission: NONE, opacity: 1, transmission: 0, ior: 1.45},
	metal: {baseColor: rgb('#6F767E'), metalness: 0.96, roughness: 0.24, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	/* cloth scatters: rough, dielectric, no visible highlight */
	fabric: {baseColor: rgb('#1C2228'), metalness: 0, roughness: 0.88, emission: NONE, opacity: 1, transmission: 0, ior: 1.45},
	/* a photograph is its own colour; the surface under it must not tint it */
	media: {baseColor: rgb('#F2F0EB'), metalness: 0, roughness: 0.62, emission: NONE, opacity: 1, transmission: 0, ior: 1.5},
	/* the only material that emits at rest, and only where energy puts it */
	energy: {baseColor: rgb('#1C2228'), metalness: 0.1, roughness: 0.3, emission: rgb('#4FD6E8'), opacity: 1, transmission: 0, ior: 1.5},
};

/** The material an object names, or ceramic when it names one that is gone. */
export function berxWorldMaterial(name: string): BerxWorldMaterial {
	return BERX_WORLD_MATERIALS[name as BerxWorldMaterialName] ?? BERX_WORLD_MATERIALS.ceramic;
}
