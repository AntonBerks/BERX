/** BERX 5D geometry grammar. Geometry is semantic: object kind determines its spatial form. */
import type {BerxSpatialEntityKind, BerxVec3} from './world';

export type BerxGeometryKind = 'orb'|'frame'|'surface'|'portal'|'ring'|'node'|'stack'|'message'|'create';
export interface BerxGeometrySpec { kind: BerxGeometryKind; radius?: number; width?: number; height?: number; depth?: number; segments?: number; bevel?: number; emissive?: number; }

const specs: Record<BerxSpatialEntityKind,BerxGeometrySpec> = {
 person:{kind:'orb',radius:.72,segments:32,bevel:.08}, moment:{kind:'surface',width:1.9,height:2.35,depth:.045,bevel:.08}, place:{kind:'portal',width:1.8,height:2.1,depth:.22,bevel:.14}, event:{kind:'ring',radius:.95,segments:48,emissive:.12}, experience:{kind:'frame',width:1.9,height:1.4,depth:.18,bevel:.1}, community:{kind:'node',radius:.86,segments:24}, business:{kind:'stack',width:1.7,height:1.15,depth:.45,bevel:.1}, collection:{kind:'stack',width:1.6,height:1.05,depth:.34,bevel:.1}, message:{kind:'message',width:1.55,height:.72,depth:.12,bevel:.16}, create:{kind:'create',radius:.82,segments:40,emissive:.08}
};

export function geometryForEntity(kind: BerxSpatialEntityKind): BerxGeometrySpec { return {...specs[kind]}; }
export function geometryScale(spec: BerxGeometrySpec): BerxVec3 { return {x:spec.width??spec.radius??1,y:spec.height??spec.radius??1,z:spec.depth??spec.radius??1}; }

/**
 * THE MESH EVERY BACKEND BUILDS, DECLARED ONCE.
 *
 * These numbers used to live twice — `meshFor` in threeRuntime.ts and
 * again in webgpuRuntime.ts — and a third time by implication in the
 * picker, which modelled every object as `scale * 0.5`. That third copy
 * was wrong for six of the nine forms, because a mesh is not a unit
 * cube: a sphere is built at radius .58 for a community node, a ring's
 * radial reach is its OUTER radius, and a frame's bars stand ON its
 * edge and so extend half a bar past it.
 *
 * The consequence was not subtle. An event's collider was 0.475 across
 * where the world drew 0.589, a message's was 0.36 tall where the world
 * drew 0.166, and a collection's was three times too deep. A ray aimed
 * at the one entity the G-buffer said was the nearest surface at that
 * pixel therefore crossed the wrong boxes: five presses in sixteen
 * landed on something else or on nothing at all.
 *
 * So the primitive's own dimensions are declared here, platform-free,
 * and both renderers build their mesh from them while the picker takes
 * its half-extents from them. `verify:5d-picking` measures the real
 * vertex bounds of every mesh against `primitiveHalfExtent`, so the two
 * cannot drift apart again in silence.
 */
export type BerxPrimitiveForm =
 /** `createSphere(radius)` */
 | {form:'sphere'; radius:number}
 /** `createBevelBox(width,height,depth,bevel)` */
 | {form:'box'; width:number; height:number; depth:number; bevel:number}
 /** `createTorus(outer,inner)` — radial reach is `outer`, thickness `(outer-inner)/2` */
 | {form:'torus'; outer:number; inner:number}
 /** `createFrame(width,height,bar)` — bars sit on the edge, and are always .12 deep */
 | {form:'frame'; width:number; height:number; bar:number};

export const BERX_PRIMITIVES: Record<BerxGeometryKind,BerxPrimitiveForm> = {
 orb:     {form:'sphere', radius:.5},
 ring:    {form:'torus',  outer:.62, inner:.42},
 frame:   {form:'frame',  width:1,  height:1,   bar:.12},
 surface: {form:'box',    width:1,  height:1,   depth:.06, bevel:.02},
 portal:  {form:'frame',  width:1,  height:1.2, bar:.16},
 node:    {form:'sphere', radius:.58},
 stack:   {form:'box',    width:1,  height:1,   depth:.32, bevel:.1},
 message: {form:'box',    width:1,  height:.46, depth:.12, bevel:.05},
 create:  {form:'sphere', radius:.58},
};

/** How far the mesh itself reaches on each axis, before any transform. */
export function primitiveHalfExtent(kind: BerxGeometryKind): BerxVec3 {
 const p = BERX_PRIMITIVES[kind];
 switch(p.form){
  case 'sphere': return {x:p.radius,y:p.radius,z:p.radius};
  case 'box': return {x:p.width/2,y:p.height/2,z:p.depth/2};
  /* the tube's centre line plus its own radius IS the outer radius; the
     tube is only as thick as half the gap between the two radii */
  case 'torus': return {x:p.outer,y:p.outer,z:(p.outer-p.inner)/2};
  /* the bars stand centred on the edge, so each face reaches half a bar
     further than the frame's nominal size; createFrame's bars are .12
     deep whatever the bar width */
  case 'frame': return {x:p.width/2+p.bar/2,y:p.height/2+p.bar/2,z:.06};
 }
}

/**
 * The half-extents of what is actually DRAWN for an object: the mesh's
 * own reach, scaled by the transform the draw list builds its model
 * matrix from.
 *
 * This is what the picker tests a ray against, so "the box the ray
 * crosses" and "the shape on the screen" are the same thing.
 */
export function berxDrawnHalfExtent(kind: BerxSpatialEntityKind, scale: BerxVec3): BerxVec3 {
 const mesh = primitiveHalfExtent(specs[kind].kind);
 return {x:mesh.x*Math.abs(scale.x),y:mesh.y*Math.abs(scale.y),z:mesh.z*Math.abs(scale.z)};
}
