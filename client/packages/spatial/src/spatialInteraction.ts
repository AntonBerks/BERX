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

/** Ray/sphere intersection. Object scale is treated as its spatial interaction radius. */
export function hitTestSphere(ray:BerxRay,object:BerxSpatialObject):BerxHit|undefined{
  if(!object.visible||!object.interactive)return;
  const center=object.transform.position;
  const radius=Math.max(object.transform.scale.x,object.transform.scale.y,object.transform.scale.z,0.35);
  const oc=sub(ray.origin,center),b=dot(oc,ray.direction),c=dot(oc,oc)-radius*radius,disc=b*b-c;
  if(disc<0)return;
  const root=Math.sqrt(disc),t0=-b-root,t1=-b+root,t=t0>=0?t0:t1;
  if(t<0)return;
  return{objectId:object.id,distance:t,point:{x:ray.origin.x+ray.direction.x*t,y:ray.origin.y+ray.direction.y*t,z:ray.origin.z+ray.direction.z*t}};
}

export function pickSpatialObject(ray:BerxRay,objects:readonly BerxSpatialObject[]):BerxHit|undefined{
  let nearest:BerxHit|undefined;
  for(const object of objects){const hit=hitTestSphere({origin:ray.origin,direction:norm(ray.direction)},object);if(hit&&(!nearest||hit.distance<nearest.distance))nearest=hit;}
  return nearest;
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
