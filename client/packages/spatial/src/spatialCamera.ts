/**
 * BERX MAX 5D — perspective camera, focus distance and input physics.
 *
 * The default frustum is 0.1..200. It was 0.01..500 — a 50000:1 ratio
 * across a 24-bit depth buffer, which spends almost all of its
 * precision on the first centimetre and leaves neighbouring objects
 * fighting for the same depth value. The world's objects sit within a
 * few tens of units of the origin, so 2000:1 covers everything that
 * exists with precision to spare.
 */
import type { BerxEuler3, BerxVec3 } from './world';
import {berxTransitionArcOffset, berxTransitionSpec, type BerxTransitionKind, type BerxTransitionSpec} from './transitions';
export interface BerxSpatialCameraState { position: BerxVec3; target: BerxVec3; rotation: BerxEuler3; fov: number; near: number; far: number; }
export interface BerxDeviceMotion { pitch:number; roll:number; yaw:number; intensity:number; }
export interface BerxCameraInput { panX:number; panY:number; depthDelta:number; pinch:number; motion?:BerxDeviceMotion; }
export interface BerxCameraLimits { maxTiltDeg:number; maxDepth:number; minFov:number; maxFov:number; }
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const copy=(v:BerxVec3):BerxVec3=>({x:v.x,y:v.y,z:v.z});
const smoothstep=(t:number)=>t*t*(3-2*t);
export class BerxSpatialCamera {
 private state:BerxSpatialCameraState; private baseTarget:BerxVec3; private velocity:BerxVec3={x:0,y:0,z:0}; private limits:BerxCameraLimits;
 constructor(initial?:Partial<BerxSpatialCameraState>,limits?:Partial<BerxCameraLimits>){
  this.state={position:copy(initial?.position??{x:0,y:0,z:8}),target:copy(initial?.target??{x:0,y:0,z:0}),rotation:{...(initial?.rotation??{x:0,y:0,z:0})},fov:initial?.fov??42,near:initial?.near??0.1,far:initial?.far??200};
  this.baseTarget=copy(this.state.target);this.limits={maxTiltDeg:limits?.maxTiltDeg??2.5,maxDepth:limits?.maxDepth??30,minFov:limits?.minFov??28,maxFov:limits?.maxFov??58};
 }
 getState(){return {position:copy(this.state.position),target:copy(this.state.target),rotation:{...this.state.rotation},fov:this.state.fov,near:this.state.near,far:this.state.far};}
/**
  * Put the camera somewhere.
  *
  * The field of view is clamped to the limits a screen's zoom may
  * reach — except when the caller says the value came from a device.
  * A headset's optics are not a zoom: a runtime that reports 100° per
  * eye is describing its lenses, and rendering the world at 58°
  * through them makes it the wrong size. `optics` is how a pose says
  * so, and nothing else may use it.
  */
 /**
  * HOW FAR THE CAMERA MAY GO, from the world rather than from a constant.
  *
  * maxDepth clamps each axis every frame. At its default of 30 it is a
  * fixed box around the ORIGIN that knows nothing about how big the
  * world is or how far back a narrow frame has to stand — and BERX
  * already has an edge, derived from the world's own bounds, which the
  * world app keeps. Two edges that can disagree is one edge too many:
  * measured, framing this world into a phone asked for z 49.68 and the
  * camera stopped dead at 30.00, with two of five entities cropped and
  * nothing reporting why.
  *
  * The world app sets this from the same bound its clamp uses, so the
  * two cannot drift.
  */
 setLimits(limits:Partial<BerxCameraLimits>){this.limits={...this.limits,...limits};}
 setState(next:BerxSpatialCameraState,source:{optics?:boolean}={}){this.state={position:copy(next.position),target:copy(next.target),rotation:{...next.rotation},fov:source.optics===true?next.fov:clamp(next.fov,this.limits.minFov,this.limits.maxFov),near:next.near,far:next.far};this.baseTarget=copy(next.target);}
 applyInput(input:BerxCameraInput){
  this.velocity.x+=input.panX*0.18;this.velocity.y+=input.panY*0.18;this.velocity.z+=input.depthDelta*0.28;this.state.fov=clamp(this.state.fov-input.pinch*0.45,this.limits.minFov,this.limits.maxFov);
  if(input.motion){const factor=clamp(input.motion.intensity,0,1),tilt=this.limits.maxTiltDeg*factor;this.state.rotation.x=clamp(input.motion.pitch*tilt,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);this.state.rotation.z=clamp(input.motion.roll*tilt,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);this.state.rotation.y=clamp(input.motion.yaw*tilt*0.55,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);
   const aim=0.9*factor;this.state.target={x:this.baseTarget.x+clamp(input.motion.roll,-1,1)*aim,y:this.baseTarget.y-clamp(input.motion.pitch,-1,1)*aim,z:this.baseTarget.z};
  }
 }
 frame(deltaSeconds:number,reducedMotion=false){
  const dt=clamp(deltaSeconds,0,0.05),damping=Math.pow(0.001,dt);this.state.position.x=clamp(this.state.position.x+this.velocity.x*dt,-this.limits.maxDepth,this.limits.maxDepth);this.state.position.y=clamp(this.state.position.y+this.velocity.y*dt,-this.limits.maxDepth,this.limits.maxDepth);this.state.position.z=clamp(this.state.position.z+this.velocity.z*dt,-this.limits.maxDepth,this.limits.maxDepth);this.velocity.x*=damping;this.velocity.y*=damping;this.velocity.z*=damping;
  if(reducedMotion){this.state.rotation.x=lerp(this.state.rotation.x,0,1-damping);this.state.rotation.y=lerp(this.state.rotation.y,0,1-damping);this.state.rotation.z=lerp(this.state.rotation.z,0,1-damping);this.state.target={...this.baseTarget};}
 }
/**
  * Where to stand to see a thing.
  *
  * `framingRadius` is anything that belongs to the object but is not
  * part of it — the ring of actions, which stands outside its edge. It
  * used to be ignored, so focusing a person put the camera close
  * enough to crop half the ring off the bottom of the screen.
  */
 poseForObject(position:BerxVec3,scale:BerxVec3={x:1,y:1,z:1},distance?:number,framingRadius=0){const radius=Math.max(scale.x,scale.y,scale.z,framingRadius,0.5),d=distance??Math.max(2.4,radius*3.2);return {position:{x:position.x,y:position.y,z:position.z+d},target:copy(position)};}
 moveToPose(pose:{position:BerxVec3;target:BerxVec3},durationSeconds=0.65,kind?:BerxTransitionKind){return new BerxCameraTransition(this.getState(),pose,durationSeconds,kind);}
 moveTo(target:BerxVec3,durationSeconds=0.65){return this.moveToPose(this.poseForObject(target),durationSeconds);}
}
/**
 * The ONE camera transition. There is deliberately no second system:
 * a transition KIND (see transitions.ts) changes this one's pacing,
 * its arc and its field of view, rather than running beside it.
 *
 * Without a kind it behaves exactly as it always did — smoothstep, a
 * straight line, an untouched fov — so every existing caller keeps its
 * behaviour and nothing had to be re-tuned to add the eight.
 */
export class BerxCameraTransition {
 private elapsed=0; private readonly duration:number; private readonly spec?:BerxTransitionSpec;
 constructor(private readonly start:BerxSpatialCameraState,private readonly destination:{position:BerxVec3;target:BerxVec3},duration:number,kind?:BerxTransitionKind){
  this.duration=Math.max(0.001,duration);
  this.spec=kind?berxTransitionSpec(kind):undefined;
 }
 /** The eased progress this frame — what the arc and the modulation read. */
 get progress(){return Math.min(1,this.elapsed/this.duration);}
 step(deltaSeconds:number):BerxSpatialCameraState{
  this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,deltaSeconds));
  const raw=this.elapsed/this.duration;
  const t=this.spec?this.spec.ease(raw):smoothstep(raw);
  /* The arc lifts the path off the straight line, so a fold reads as
     going OVER something rather than sliding through it. Applied to
     the position only: the target stays on the destination, which is
     what keeps the thing being travelled to in view the whole way. */
  const lift=this.spec?berxTransitionArcOffset(this.spec.kind,raw):0;
  /* The transition's fov belongs to the PROJECTION, not to the camera:
     berxBuildDrawList applies it, so picking, XR and anything else that
     asks where the viewer stands never sees a transient effect, and a
     frozen frame shows the same thing a live one does. */
  return {position:{x:lerp(this.start.position.x,this.destination.position.x,t),y:lerp(this.start.position.y,this.destination.position.y,t)+lift,z:lerp(this.start.position.z,this.destination.position.z,t)},target:{x:lerp(this.start.target.x,this.destination.target.x,t),y:lerp(this.start.target.y,this.destination.target.y,t),z:lerp(this.start.target.z,this.destination.target.z,t)},rotation:{x:lerp(this.start.rotation.x,0,t),y:lerp(this.start.rotation.y,0,t),z:lerp(this.start.rotation.z,0,t)},fov:this.start.fov,near:this.start.near,far:this.start.far};
 }
 get done(){return this.elapsed>=this.duration;}
}
