/** CPU-side ray picking used only to select persistent spatial objects; rendering remains GPU-authored. */
import type { Berx5DFrame } from './runtime5d';
import type { BerxSpatialObject, BerxVec3 } from './world';

const dot=(a:BerxVec3,b:BerxVec3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const add=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const mul=(a:BerxVec3,s:number):BerxVec3=>({x:a.x*s,y:a.y*s,z:a.z*s});
const cross=(a:BerxVec3,b:BerxVec3):BerxVec3=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=(a:BerxVec3)=>{const l=Math.hypot(a.x,a.y,a.z)||1;return mul(a,1/l);};

export function pickSpatialObject(frame:Berx5DFrame,ndcX:number,ndcY:number,aspect:number):BerxSpatialObject|undefined{
  const c=frame.camera,forward=norm(sub(c.target,c.position)),worldUp={x:0,y:1,z:0};
  const right=norm(cross(forward,worldUp)),up=norm(cross(right,forward));
  const tan=Math.tan(c.fov*Math.PI/360),direction=norm(add(forward,add(mul(right,ndcX*tan*aspect),mul(up,-ndcY*tan))));
  let best:BerxSpatialObject|undefined,bestDistance=Number.POSITIVE_INFINITY;
  for(const object of frame.world.objects){
    if(!object.visible||!object.interactive)continue;
    const center=object.transform.position,radius=Math.max(0.18,Math.hypot(object.transform.scale.x,object.transform.scale.y,object.transform.scale.z));
    const oc=sub(c.position,center),b=dot(oc,direction),cc=dot(oc,oc)-radius*radius,disc=b*b-cc;
    if(disc<0)continue;const near=-b-Math.sqrt(disc),distance=near>=0?near:-b+Math.sqrt(disc);if(distance>=0&&distance<bestDistance){bestDistance=distance;best=object;}
  }
  return best;
}
