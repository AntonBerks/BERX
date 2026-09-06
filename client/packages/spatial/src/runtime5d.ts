/** BERX MAX 5D — persistent spatial worlds and camera-authored navigation. */
import { BerxSpatialCamera, BerxCameraTransition, type BerxCameraInput, type BerxSpatialCameraState } from './spatialCamera';
import { BerxSpatialWorld, type BerxSpatialObject, type BerxSpatialWorldSnapshot, type BerxVec3 } from './world';

export type BerxWorldId=string;
export interface BerxWorldState{id:BerxWorldId;sourceRoute?:string;focusObjectId?:string;enteredAt:number;camera:BerxSpatialCameraState;}
export interface BerxSpatialTransitionState{fromWorld:BerxWorldState;toWorld:BerxWorldState;fromCamera:BerxSpatialCameraState;destination:BerxVec3;progress:number;duration:number;}
export interface Berx5DFrame{world:BerxSpatialWorldSnapshot;camera:BerxSpatialCameraState;transition?:BerxSpatialTransitionState;reducedMotion:boolean;deviceMotionEnabled:boolean;}
export interface Berx5DRuntimeOptions{reducedMotion?:boolean;deviceMotionEnabled?:boolean;transitionDuration?:number;}

const cloneCamera=(c:BerxSpatialCameraState):BerxSpatialCameraState=>({position:{...c.position},target:{...c.target},rotation:{...c.rotation},fov:c.fov,near:c.near,far:c.far});
const cloneWorld=(w:BerxWorldState):BerxWorldState=>({...w,camera:cloneCamera(w.camera)});

export class Berx5DRuntime{
  readonly world:BerxSpatialWorld;readonly camera:BerxSpatialCamera;
  private readonly history:BerxWorldState[]=[];private currentWorld:BerxWorldState;private transition?:BerxSpatialTransitionState;private cameraTransition?:BerxCameraTransition;
  private reducedMotion:boolean;private deviceMotionEnabled:boolean;private readonly transitionDuration:number;
  constructor(options:Berx5DRuntimeOptions={}){
    this.world=new BerxSpatialWorld();this.camera=new BerxSpatialCamera();this.reducedMotion=options.reducedMotion===true;this.deviceMotionEnabled=options.deviceMotionEnabled!==false;this.transitionDuration=Math.max(0.01,options.transitionDuration??0.65);
    this.currentWorld={id:'root',enteredAt:Date.now(),camera:this.camera.getState()};
  }
  get worldState(){return {...this.currentWorld,camera:this.camera.getState()};}
  get canGoBack(){return this.history.length>0;}
  get latestFrame():Berx5DFrame{return this.composeFrame();}
  private composeFrame():Berx5DFrame{return{world:this.world.snapshot(),camera:this.camera.getState(),transition:this.transition?{...this.transition,fromCamera:cloneCamera(this.transition.fromCamera)}:undefined,reducedMotion:this.reducedMotion,deviceMotionEnabled:this.deviceMotionEnabled};}
  setAccessibility(options:{reducedMotion?:boolean}){if(options.reducedMotion!==undefined)this.reducedMotion=options.reducedMotion;}
  setDeviceMotionEnabled(enabled:boolean){this.deviceMotionEnabled=enabled;}
  registerObject(object:BerxSpatialObject){this.world.upsertObject(object);}
  removeObject(id:string){this.world.removeObject(id);if(this.currentWorld.focusObjectId===id)this.currentWorld.focusObjectId=undefined;}
  focus(objectId:string){
    const object=this.world.getObject(objectId);if(!object)return false;this.world.setActiveObject(objectId);this.currentWorld.focusObjectId=objectId;
    const pose=this.camera.poseForObject(object.transform.position,object.transform.scale);this.beginCameraTransition(pose,this.reducedMotion?0.01:this.transitionDuration);return true;
  }
  private beginCameraTransition(pose:{position:BerxVec3;target:BerxVec3},duration:number,toWorld=this.currentWorld){
    const fromCamera=this.camera.getState();this.cameraTransition=this.camera.moveToPose(pose,duration);
    this.transition={fromWorld:cloneWorld(this.currentWorld),toWorld:cloneWorld(toWorld),fromCamera,destination:{...pose.position},progress:0,duration:Math.max(.001,duration)};
  }
  enterWorld(world:Omit<BerxWorldState,'camera'>,destination?:BerxVec3){
    const previous=cloneWorld({...this.currentWorld,camera:this.camera.getState()});this.history.push(previous);this.currentWorld={...world,enteredAt:Date.now(),camera:this.camera.getState()};
    const object=destination?undefined:this.world.getActiveObject();const focus=destination??object?.transform.position??{x:0,y:0,z:0};const pose=object?this.camera.poseForObject(object.transform.position,object.transform.scale):this.camera.poseForObject(focus);
    this.beginCameraTransition(pose,this.reducedMotion?0.01:this.transitionDuration,this.currentWorld);
  }
  back(){
    const previous=this.history.pop();if(!previous)return false;const from=cloneWorld({...this.currentWorld,camera:this.camera.getState()});this.currentWorld=cloneWorld(previous);this.world.setActiveObject(previous.focusObjectId);
    const pose={position:cloneCamera(previous.camera).position,target:cloneCamera(previous.camera).target};const duration=this.reducedMotion?0.01:this.transitionDuration;
    this.cameraTransition=this.camera.moveToPose(pose,duration);this.transition={fromWorld:from,toWorld:cloneWorld(previous),fromCamera:this.camera.getState(),destination:{...pose.position},progress:0,duration:Math.max(.001,duration)};return true;
  }
  input(input:BerxCameraInput){if(this.cameraTransition)return;this.camera.applyInput({...input,motion:this.deviceMotionEnabled?input.motion:undefined});}
  frame(deltaSeconds:number):Berx5DFrame{
    this.world.tick(deltaSeconds);
    if(this.cameraTransition){const next=this.cameraTransition.step(deltaSeconds);this.camera.setState(next);if(this.transition)this.transition.progress=Math.min(1,this.transition.progress+Math.max(0,deltaSeconds)/this.transition.duration);if(this.cameraTransition.done){this.cameraTransition=undefined;this.transition=undefined;}}
    else this.camera.frame(deltaSeconds,this.reducedMotion);
    this.currentWorld.camera=this.camera.getState();return this.composeFrame();
  }
}
