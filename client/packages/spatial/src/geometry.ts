/** BERX 5D geometry grammar. Geometry is semantic: object kind determines its spatial form. */
import type {BerxSpatialEntityKind, BerxSpatialObject, BerxVec3} from './world';

export type BerxGeometryKind = 'orb'|'frame'|'surface'|'portal'|'ring'|'node'|'stack'|'message'|'create';
export interface BerxGeometrySpec { kind: BerxGeometryKind; radius?: number; width?: number; height?: number; depth?: number; segments?: number; bevel?: number; emissive?: number; }
export interface BerxSpatialPresentation { base: [number,number,number]; emissive: [number,number,number]; }
const specs: Record<BerxSpatialEntityKind,BerxGeometrySpec> = {
 person:{kind:'orb',radius:.72,segments:32,bevel:.08}, moment:{kind:'surface',width:1.9,height:2.35,depth:.045,bevel:.08}, place:{kind:'portal',width:1.8,height:2.1,depth:.22,bevel:.14}, event:{kind:'ring',radius:.95,segments:48,emissive:.12}, experience:{kind:'frame',width:1.9,height:1.4,depth:.18,bevel:.1}, community:{kind:'node',radius:.86,segments:24}, business:{kind:'stack',width:1.7,height:1.15,depth:.45,bevel:.1}, collection:{kind:'stack',width:1.6,height:1.05,depth:.34,bevel:.1}, message:{kind:'message',width:1.55,height:.72,depth:.12,bevel:.16}, create:{kind:'create',radius:.82,segments:40,emissive:.08}
};
const palette: Record<BerxSpatialEntityKind,BerxSpatialPresentation> = {
 person:{base:[.78,.78,.75],emissive:[.015,.015,.012]}, moment:{base:[.42,.44,.46],emissive:[.008,.009,.01]}, place:{base:[.56,.53,.45],emissive:[.012,.01,.007]}, event:{base:[.64,.59,.48],emissive:[.035,.026,.016]}, experience:{base:[.50,.49,.45],emissive:[.012,.011,.008]}, community:{base:[.47,.48,.48],emissive:[.01,.01,.01]}, business:{base:[.53,.51,.46],emissive:[.014,.012,.008]}, collection:{base:[.46,.46,.44],emissive:[.008,.008,.007]}, message:{base:[.50,.51,.52],emissive:[.009,.01,.012]}, create:{base:[.60,.58,.53],emissive:[.02,.018,.014]}
};
export function geometryForEntity(kind: BerxSpatialEntityKind): BerxGeometrySpec { return {...specs[kind]}; }
export function geometryScale(spec: BerxGeometrySpec): BerxVec3 { return {x:spec.width??spec.radius??1,y:spec.height??spec.radius??1,z:spec.depth??spec.radius??1}; }
export function presentationForKind(kind: BerxSpatialEntityKind, object?: BerxSpatialObject): BerxSpatialPresentation { const p=palette[kind]; const e=Math.max(0,Math.min(1,object?.energy??0))*.06; return {base:[Math.min(1,p.base[0]+e),Math.min(1,p.base[1]+e),Math.min(1,p.base[2]+e)],emissive:p.emissive}; }
