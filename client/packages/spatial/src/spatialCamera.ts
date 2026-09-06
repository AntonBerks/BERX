/** BERX MAX 5D — perspective camera, focus distance and input physics. */
import type { BerxEuler3, BerxVec3 } from './world';

export interface BerxSpatialCameraState { position: BerxVec3; target: BerxVec3; rotation: BerxEuler3; fov: number; near: number; far: number; }
export interface BerxDeviceMotion { pitch:number; roll:number; yaw:number; intensity:number; }
export interface BerxCameraInput { panX:number; panY:number; depthDelta:number; pinch:number; motion?:BerxDeviceMotion; }
export interface BerxCameraLimits { maxTiltDeg:number; maxDepth:number; minFov:number; maxFov:number; }

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const copy=(v:BerxVec3):BerxVec3=>({x:v.x,y:v.y,z:v.z});
const smoothstep=(t:number)=>t*t*(3-2*t);

export class BerxSpatialCamera {
  private state:BerxSpatialCameraState;
  private velocity:BerxVec3={x:0,y:0,z:0};
  private readonly limits:BerxCameraLimits;
  constructor(initial?:Partial<BerxSpatialCameraState>,limits?:Partial<BerxCameraLimits>){
    this.state={position:copy(initial?.position??{x:0,y:0,z:8}),target:copy(initial?.target??{x:0,y:0,z:0}),rotation:{...(initial?.rotation??{x:0,y:0,z:0})},fov:initial?.fov??42,near:initial?.near??0.01,far:initial?.far??500};
    this.limits={maxTiltDeg:limits?.maxTiltDeg??2.5,maxDepth:limits?.maxDepth??30,minFov:limits?.minFov??28,maxFov:limits?.maxFov??58};
  }
  getState(){return {position:copy(this.state.position),target:copy(this.state.target),rotation:{...this.state.rotation},fov:this.state.fov,near:this.state.near,far:this.state.far};}
  setState(next:BerxSpatialCameraState){this.state={position:copy(next.position),target:copy(next.target),rotation:{...next.rotation},fov:clamp(next.fov,this.limits.minFov,this.limits.maxFov),near:next.near,far:next.far};}
  applyInput(input:BerxCameraInput){
    this.velocity.x+=input.panX*0.18;this.velocity.y+=input.panY*0.18;this.velocity.z+=input.depthDelta*0.28;
    this.state.fov=clamp(this.state.fov-input.pinch*0.45,this.limits.minFov,this.limits.maxFov);
    if(input.motion){const factor=clamp(input.motion.intensity,0,1),tilt=this.limits.maxTiltDeg*factor;this.state.rotation.x=clamp(input.motion.pitch*tilt,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);this.state.rotation.z=clamp(input.motion.roll*tilt,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);this.state.rotation.y=clamp(input.motion.yaw*tilt*0.55,-this.limits.maxTiltDeg,this.limits.maxTiltDeg);}
  }
  frame(deltaSeconds:number,reducedMotion=false){
    const dt=clamp(deltaSeconds,0,0.05),damping=Math.pow(0.001,dt);
    this.state.position.x=clamp(this.state.position.x+this.velocity.x*dt,-this.limits.maxDepth,this.limits.maxDepth);
    this.state.position.y=clamp(this.state.position.y+this.velocity.y*dt,-this.limits.maxDepth,this.limits.maxDepth);
    this.state.position.z=clamp(this.state.position.z+this.velocity.z*dt,-this.limits.maxDepth,this.limits.maxDepth);
    this.velocity.x*=damping;this.velocity.y*=damping;this.velocity.z*=damping;
    if(reducedMotion){this.state.rotation.x=lerp(this.state.rotation.x,0,1-damping);this.state.rotation.y=lerp(this.state.rotation.y,0,1-damping);this.state.rotation.z=lerp(this.state.rotation.z,0,1-damping);}
  }
  poseForObject(position:BerxVec3,scale:BerxVec3={x:1,y:1,z:1},distance?:number){const radius=Math.max(scale.x,scale.y,scale.z,0.5),d=distance??Math.max(2.4,radius*3.2);return {position:{x:position.x,y:position.y,z:position.z+d},target:copy(position)};}
  moveToPose(pose:{position:BerxVec3;target:BerxVec3},durationSeconds=0.65){return new BerxCameraTransition(this.getState(),pose,durationSeconds);}
  moveTo(target:BerxVec3,durationSeconds=0.65){return this.moveToPose(this.poseForObject(target),durationSeconds);}
}

export class BerxCameraTransition {
  private elapsed=0; private readonly duration:number;
  constructor(private readonly start:BerxSpatialCameraState,private readonly destination:{position:BerxVec3;target:BerxVec3},duration:number){this.duration=Math.max(0.001,duration);}
  step(deltaSeconds:number):BerxSpatialCameraState{
    this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,deltaSeconds));
    const t=smoothstep(this.elapsed/this.duration);
    return {position:{x:lerp(this.start.position.x,this.destination.position.x,t),y:lerp(this.start.position.y,this.destination.position.y,t),z:lerp(this.start.position.z,this.destination.position.z,t)},target:{x:lerp(this.start.target.x,this.destination.target.x,t),y:lerp(this.start.target.y,this.destination.target.y,t),z:lerp(this.start.target.z,this.destination.target.z,t)},rotation:{x:lerp(this.start.rotation.x,0,t),y:lerp(this.start.rotation.y,0,t),z:lerp(this.start.rotation.z,0,t)},fov:this.start.fov,near:this.start.near,far:this.start.far};
  }
  get done(){return this.elapsed>=this.duration;}
}
