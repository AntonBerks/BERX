/** BERX MAX 5D — spatial interaction state, hit testing and focus semantics. */
import type { BerxSpatialObject, BerxVec3 } from './world';

export interface BerxRay { origin: BerxVec3; direction: BerxVec3; }
export interface BerxHit { objectId: string; distance: number; point: BerxVec3; }
export interface BerxSpatialInteractionState { hoveredObjectId?: string; pressedObjectId?: string; focusedObjectId?: string; }

const dot=(a:BerxVec3,b:BerxVec3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const len=(v:BerxVec3)=>Math.hypot(v.x,v.y,v.z)||1;
const norm=(v:BerxVec3):BerxVec3=>{const l=len(v);return{x:v.x/l,y:v.y/l,z:v.z/l};};

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
