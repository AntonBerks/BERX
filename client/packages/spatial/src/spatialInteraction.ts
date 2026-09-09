/**
 * BERX MAX 5D — spatial interaction state, hit testing and focus semantics.
 *
 * This is the one hit test. There used to be three ways to turn a tap
 * into an object: a `picking.ts` that took NDC and returned the object,
 * this file's ray version, and a third copy of the NDC→ray maths
 * inlined in the web renderer. Only this one was reachable, so the
 * other two could drift without anything noticing. What a tap means in
 * the world is now decided in exactly one place, and `rayFromNdc` is
 * the seam a renderer plugs into rather than a maths problem it
 * re-solves.
 */
import type { BerxSpatialCameraState } from './spatialCamera';
import type { BerxSpatialObject, BerxVec3 } from './world';

export interface BerxRay { origin: BerxVec3; direction: BerxVec3; }
export interface BerxHit { objectId: string; distance: number; point: BerxVec3; }
export interface BerxSpatialInteractionState { hoveredObjectId?: string; pressedObjectId?: string; focusedObjectId?: string; }

const dot=(a:BerxVec3,b:BerxVec3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const len=(v:BerxVec3)=>Math.hypot(v.x,v.y,v.z);
/* normalising the zero vector is undefined; 1 keeps it finite rather than NaN */
const norm=(v:BerxVec3):BerxVec3=>{const l=len(v)||1;return{x:v.x/l,y:v.y/l,z:v.z/l};};

/**
 * THE PICKER TESTS THE SHAPE THE RENDERER DRAWS.
 *
 * This was a ray/SPHERE test of radius max(scale), and an entity in
 * BERX is a flat panel: a person of scale 3.49 x 4.32 x 0.08 was picked
 * as a ball 8.6 across and 8.6 DEEP, occupying depth its geometry never
 * occupied. Two consequences, both measured on the shipped shell:
 *
 *   - the viewer's own entity stands where the viewer stands, so every
 *     ray began inside its ball and left through it a few centimetres
 *     later. That exit was returned as the nearest hit, and four real
 *     PointerEvents aimed at moment:5151, message:78, event:908 and
 *     experience:12 selected person:78, person:77, person:77, person:77.
 *     Zero of four: nothing in the world could be clicked.
 *   - with that repaired, a ray aimed at the one entity the world
 *     actually drew at its own pixel still selected event:908, whose
 *     ball crossed the ray while its panel was somewhere else.
 *
 * A slab test against the object's own oriented box is the same picking
 * system asking about the same geometry the draw list builds its model
 * matrix from — the axes below are the columns of that matrix — rather
 * than a second, rounder opinion about where a thing is.
 *
 * An origin inside the box is still no hit: you cannot click the thing
 * you are standing inside.
 */

/** The object's own axes in world space — the model matrix's columns. */
function objectAxes(r: {x: number; y: number; z: number}): {x: BerxVec3; y: BerxVec3; z: BerxVec3} {
	const cx = Math.cos(r.x), sx = Math.sin(r.x);
	const cy = Math.cos(r.y), sy = Math.sin(r.y);
	const cz = Math.cos(r.z), sz = Math.sin(r.z);
	return {
		x: {x: cy * cz, y: cy * sz, z: -sy},
		y: {x: sx * sy * cz - cx * sz, y: sx * sy * sz + cx * cz, z: sx * cy},
		z: {x: cx * sy * cz + sx * sz, y: cx * sy * sz - sx * cz, z: cx * cy},
	};
}

/**
 * The smallest half-extent a thing may be picked at, in world units.
 *
 * A panel is 0.04 thick edge-on and would be unclickable at its true
 * depth; this is the hand's own tolerance, not a licence to be bigger
 * than the drawing. It is far below the 0.35 RADIUS the sphere used as
 * its floor.
 */
const MIN_HALF_EXTENT = 0.12;

export function hitTestObject(ray: BerxRay, object: BerxSpatialObject): BerxHit | undefined {
	if (!object.visible || !object.interactive) return;
	const axes = objectAxes(object.transform.rotation ?? {x: 0, y: 0, z: 0});
	const oc = sub(ray.origin, object.transform.position);
	const d = norm(ray.direction);
	/* the ray in the object's own frame; the axes are orthonormal, so a
	   dot product is the whole transform */
	const o = [dot(oc, axes.x), dot(oc, axes.y), dot(oc, axes.z)];
	const dir = [dot(d, axes.x), dot(d, axes.y), dot(d, axes.z)];
	const half = [
		Math.max(Math.abs(object.transform.scale.x) * 0.5, MIN_HALF_EXTENT),
		Math.max(Math.abs(object.transform.scale.y) * 0.5, MIN_HALF_EXTENT),
		Math.max(Math.abs(object.transform.scale.z) * 0.5, MIN_HALF_EXTENT),
	];
	let near = -Infinity, far = Infinity;
	for (let i = 0; i < 3; i++) {
		if (Math.abs(dir[i]) < 1e-8) {
			/* parallel to this pair of faces: outside them is never a hit */
			if (Math.abs(o[i]) > half[i]) return;
			continue;
		}
		const inv = 1 / dir[i];
		let t0 = (-half[i] - o[i]) * inv;
		let t1 = (half[i] - o[i]) * inv;
		if (t0 > t1) { const swap = t0; t0 = t1; t1 = swap; }
		if (t0 > near) near = t0;
		if (t1 < far) far = t1;
		if (near > far) return;
	}
	/* behind the eye, or the eye inside the box */
	if (near < 0 || far < 0) return;
	return {
		objectId: object.id,
		distance: near,
		point: {x: ray.origin.x + d.x * near, y: ray.origin.y + d.y * near, z: ray.origin.z + d.z * near},
	};
}

export function pickSpatialObject(ray:BerxRay,objects:readonly BerxSpatialObject[]):BerxHit|undefined{
  let nearest:BerxHit|undefined;
  for(const object of objects){const hit=hitTestObject({origin:ray.origin,direction:norm(ray.direction)},object);if(hit&&(!nearest||hit.distance<nearest.distance))nearest=hit;}
  return nearest;
}

/**
 * EVERY object the ray crosses, nearest first.
 *
 * A box is not a mesh. geometry.ts gives a place a "portal", an event a
 * "ring" and an experience a "frame" — shapes with a hole through them
 * — so a ray aimed at something behind one passes through the opening
 * on the screen while still crossing the nearer box. Picking the
 * nearest box therefore selects a frame the viewer can see straight
 * through.
 *
 * Nothing in this package can know about the hole: only the renderer
 * knows the mesh. So the candidates come from here and the RENDERER
 * says which of them it actually drew — see berxResolveByDepth. This
 * is the same picking system asked a narrower question, not a second
 * one.
 */
export function pickSpatialCandidates(ray:BerxRay,objects:readonly BerxSpatialObject[]):BerxHit[]{
  const hits:BerxHit[]=[];
  const direction=norm(ray.direction);
  for(const object of objects){const hit=hitTestObject({origin:ray.origin,direction},object);if(hit)hits.push(hit);}
  return hits.sort((a,b)=>a.distance-b.distance);
}

/**
 * Which candidate the renderer actually drew at that pixel.
 *
 * `drawnDepth` is the distance along the camera's forward axis to the
 * surface the world put on the screen there — the renderer's own
 * G-buffer, which is the same depth its label pass tests against.
 * The candidate whose front face sits at that distance is the one being
 * looked at.
 *
 * Undefined depth means the renderer could not answer — a backend with
 * no G-buffer, or a pixel it drew nothing into — and then the nearest
 * candidate is the honest answer, which is exactly the old behaviour.
 */
export function berxResolveByDepth(candidates:readonly BerxHit[],drawnDepth:number|undefined,tolerance=1.5):BerxHit|undefined{
  if(candidates.length===0)return undefined;
  if(drawnDepth===undefined||!Number.isFinite(drawnDepth)||drawnDepth<=0)return candidates[0];
  let best:BerxHit|undefined;let bestGap=Infinity;
  for(const hit of candidates){
    const gap=Math.abs(hit.distance-drawnDepth);
    if(gap<bestGap){bestGap=gap;best=hit;}
  }
  /* nothing the ray crosses stands where the world drew: the pixel
     belongs to something that is not a candidate at all */
  return bestGap<=tolerance?best:undefined;
}

export function interactionRadius(object:BerxSpatialObject):number{return Math.max(object.transform.scale.x,object.transform.scale.y,object.transform.scale.z,0.35);}

const cross=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});

export interface BerxCameraBasis { forward: BerxVec3; right: BerxVec3; up: BerxVec3; }

/**
 * The camera's own axes in world space.
 *
 * Everything that needs to translate "right on screen" into "this way
 * in the world" — the picking ray, keyboard navigation between
 * objects, a renderer's view matrix — needs the same three vectors,
 * and they were being derived separately in each place. Returns
 * undefined when the camera looks straight up or down and the world up
 * vector gives no usable right vector: degenerate, and far better than
 * a silently wrong basis.
 */
export function cameraBasis(camera:BerxSpatialCameraState):BerxCameraBasis|undefined{
  const forward=norm(sub(camera.target,camera.position));
  const rightRaw=cross(forward,{x:0,y:1,z:0});
  if(len(rightRaw)<1e-3)return;
  const right=norm(rightRaw);
  return {forward,right,up:cross(right,forward)};
}

/**
 * The ray a point on the screen casts into the world.
 *
 * `ndcX`/`ndcY` are normalised device coordinates: -1..1 with +Y up,
 * which is what every renderer already has after dividing by its own
 * backing-store size. `aspect` is width/height of that same buffer, so
 * the ray matches the projection actually used to draw the frame.
 */
export function rayFromNdc(camera:BerxSpatialCameraState,ndcX:number,ndcY:number,aspect:number):BerxRay|undefined{
  const basis=cameraBasis(camera);
  if(!basis)return;
  const {forward,right,up}=basis,tan=Math.tan(camera.fov*Math.PI/360);
  return {
    origin:{...camera.position},
    direction:norm({
      x:forward.x+right.x*ndcX*tan*aspect+up.x*ndcY*tan,
      y:forward.y+right.y*ndcX*tan*aspect+up.y*ndcY*tan,
      z:forward.z+right.z*ndcX*tan*aspect+up.z*ndcY*tan,
    }),
  };
}
