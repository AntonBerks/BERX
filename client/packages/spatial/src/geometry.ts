/** BERX 5D geometry grammar. Geometry is semantic: object kind determines its spatial form. */
import type {BerxSpatialEntityKind, BerxVec3} from './world';

export type BerxGeometryKind = 'orb'|'frame'|'surface'|'portal'|'ring'|'node'|'stack'|'message'|'create';

export interface BerxGeometrySpec {
  kind: BerxGeometryKind;
  radius?: number;
  width?: number;
  height?: number;
  depth?: number;
  segments?: number;
  bevel?: number;
  emissive?: number;
}

const specs: Record<BerxSpatialEntityKind, BerxGeometrySpec> = {
  person: {kind:'orb', radius:0.72, segments:32, bevel:0.08},
  moment: {kind:'surface', width:1.9, height:2.35, depth:0.045, bevel:0.08},
  place: {kind:'portal', width:1.8, height:2.1, depth:0.22, bevel:0.14},
  event: {kind:'ring', radius:0.95, segments:48, emissive:0.12},
  experience: {kind:'frame', width:1.9, height:1.4, depth:0.18, bevel:0.1},
  community: {kind:'node', radius:0.86, segments:24},
  business: {kind:'stack', width:1.7, height:1.15, depth:0.45, bevel:0.1},
  collection: {kind:'stack', width:1.6, height:1.05, depth:0.34, bevel:0.1},
  message: {kind:'message', width:1.55, height:0.72, depth:0.12, bevel:0.16},
  create: {kind:'create', radius:0.82, segments:40, emissive:0.08},
};

export function geometryForEntity(kind: BerxSpatialEntityKind): BerxGeometrySpec {
  return {...specs[kind]};
}

export function geometryScale(spec: BerxGeometrySpec): BerxVec3 {
  return {x:spec.width ?? spec.radius ?? 1, y:spec.height ?? spec.radius ?? 1, z:spec.depth ?? spec.radius ?? 1};
}
