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
import { berxDrawnHalfExtent } from './geometry';
import type { BerxSpatialCameraState } from './spatialCamera';
import type { BerxSpatialObject, BerxVec3 } from './world';

export interface BerxRay { origin: BerxVec3; direction: BerxVec3; }
export interface BerxHit {
	objectId: string;
	/** Where the ray ENTERS the object's box, along the ray. */
	distance: number;
	/**
	 * And where it leaves.
	 *
	 * Kept because a box is not a surface: the mesh the renderer draws
	 * sits INSIDE this box, so the depth the G-buffer reports for a
	 * pixel can be anywhere between the two. Resolving by "which entry
	 * point is nearest the drawn depth" is only approximate, and the
	 * approximation stops working the moment entities stand closer
	 * together than their own size — see berxResolveByDepth.
	 */
	exit: number;
	point: BerxVec3;
}
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
	/**
	 * THE BOX IS WHAT THE WORLD DREW.
	 *
	 * `scale * 0.5` was a fourth opinion about an entity's size, and it
	 * was wrong for six of the nine forms: a mesh is not a unit cube, so
	 * an event's collider came out 0.475 across where the ring is drawn
	 * 0.589, a message's 0.36 tall where the panel is 0.166, and a
	 * collection's three times too deep. Rays then crossed boxes the
	 * world had never drawn, and `berxResolveByDepth` — asking which
	 * candidate stands where the G-buffer says the surface is — found
	 * either the wrong one or none at all.
	 *
	 * berxDrawnHalfExtent is the mesh's own reach times this transform,
	 * from the single declaration both renderers build from.
	 */
	const drawn = berxDrawnHalfExtent(object.kind, object.transform.scale);
	const half = [
		Math.max(drawn.x, MIN_HALF_EXTENT),
		Math.max(drawn.y, MIN_HALF_EXTENT),
		Math.max(drawn.z, MIN_HALF_EXTENT),
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
		exit: far,
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
 * `drawnDepth` is the distance along the camera's FORWARD AXIS to the
 * surface the world put on the screen there — the renderer's own
 * G-buffer, which stores -view_pos.z and is the same depth its label
 * pass tests against. The candidate whose front face sits at that
 * distance is the one being looked at.
 *
 * `forwardCosine` IS NOT OPTIONAL DECORATION. A hit's `distance` is
 * measured along the RAY, and away from the centre of the screen a ray
 * is not the forward axis: at the edge of a 60° frame at 16:10 the two
 * differ by 1/cos(42.7°) — a third again. Comparing them directly made
 * every candidate look 3.6 units away from a surface 10 units off, so
 * everything failed the tolerance and a press at the edge of the world
 * selected nothing at all. Centre-screen worked, because there the
 * cosine is 1 and the two measures coincide, which is exactly why it
 * survived so long.
 *
 * Undefined depth means the renderer could not answer — a backend with
 * no G-buffer, or a pixel it drew nothing into — and then the nearest
 * candidate is the honest answer, which is exactly the old behaviour.
 */
export const BERX_PICK_DEPTH_TOLERANCE=1.5;

/**
 * How far outside a box the drawn point may still be counted as its own.
 *
 * The G-buffer stores depth at a quantised resolution and a ray may
 * graze an edge; this covers that and nothing else. It is not a
 * tolerance for being wrong about which entity is which.
 */
const EDGE_BIAS=0.08;

export function berxResolveByDepth(candidates:readonly BerxHit[],drawnDepth:number|undefined,forwardCosine=1,tolerance=BERX_PICK_DEPTH_TOLERANCE):BerxHit|undefined{
  if(candidates.length===0)return undefined;
  if(drawnDepth===undefined||!Number.isFinite(drawnDepth)||drawnDepth<=0)return candidates[0];
  const cos=Number.isFinite(forwardCosine)&&forwardCosine>1e-6?forwardCosine:1;
  /**
   * FIRST, EXACTLY: whose box is the drawn point INSIDE?
   *
   * The mesh sits inside its box, so the drawn surface at a pixel lies
   * somewhere between where the ray enters that box and where it
   * leaves. Any candidate whose interval contains the drawn depth could
   * be the thing that was drawn there; no other candidate can be. The
   * nearest such candidate is the answer, and no tolerance is involved.
   *
   * The gap test below was all there was, and it is only an
   * approximation: it compares the drawn depth against where each box
   * STARTS. That held while entities stood seven units apart and broke
   * as soon as the layout was made compact enough to fill a frame —
   * with neighbours two units apart, a box beginning one unit past the
   * drawn point scored better than the box the point was actually
   * inside. Measured: 24 of 36 presses correct. It stays as the
   * fallback for a pixel no candidate contains, which is what a
   * backend with no depth, or a ray grazing an edge, produces.
   */
  let inside:BerxHit|undefined;let insideGap=Infinity;
  for(const hit of candidates){
    const entry=hit.distance*cos;
    if(entry-EDGE_BIAS<=drawnDepth&&drawnDepth<=hit.exit*cos+EDGE_BIAS){
      /**
       * And among those, the box whose FRONT FACE sits nearest below
       * the drawn point.
       *
       * "The nearest box containing it" was the first rule here and it
       * is not right either: a sphere is inscribed in its box, so a
       * ray through a box's corner passes through no mesh at all, and
       * a large nearby entity's box swallowed the drawn surface of a
       * thin panel standing inside it. A drawn surface is always AT OR
       * BEHIND the front face of whatever was drawn, so the box that
       * starts closest below the drawn depth is the only one that
       * explains it. Measured: 17 of 22 with the nearest-box rule,
       * where a person's orb won a message panel's own pixel twice.
       */
      const gap=drawnDepth-entry;
      if(gap<insideGap){insideGap=gap;inside=hit;}
    }
  }
  if(inside)return inside;
  let best:BerxHit|undefined;let bestGap=Infinity;
  for(const hit of candidates){
    /* along the ray, converted to the axis the G-buffer measures on */
    const gap=Math.abs(hit.distance*cos-drawnDepth);
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
