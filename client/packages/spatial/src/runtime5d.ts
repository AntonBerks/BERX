/** BERX MAX 5D — persistent spatial worlds and camera-authored navigation. */
import { BerxSpatialCamera, BerxCameraTransition, type BerxCameraInput, type BerxSpatialCameraState } from './spatialCamera';
import { BerxSpatialWorld, type BerxSpatialObject, type BerxSpatialWorldSnapshot, type BerxVec3 } from './world';
import { berxTransitionSpec, type BerxTransitionKind } from './transitions';

export type BerxWorldId=string;
export interface BerxWorldState{id:BerxWorldId;sourceRoute?:string;focusObjectId?:string;enteredAt:number;camera:BerxSpatialCameraState;}
/**
 * `kind` is what makes eight transitions eight transitions rather than
 * eight names: it travels in the frame, so the draw list can modulate
 * the world with it and every backend shows the same thing.
 */
export interface BerxSpatialTransitionState{fromWorld:BerxWorldState;toWorld:BerxWorldState;fromCamera:BerxSpatialCameraState;destination:BerxVec3;progress:number;duration:number;kind?:BerxTransitionKind;}
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
  /**
   * How long a transition takes. Its KIND decides — pacing is half of
   * what makes eight effects distinguishable — except under reduced
   * motion, where everything is effectively instant, which is what
   * reduced motion means.
   */
  private durationFor(kind?:BerxTransitionKind){
    if(this.reducedMotion)return 0.01;
    return kind?berxTransitionSpec(kind).durationSeconds:this.transitionDuration;
  }
  get worldState(){return {...this.currentWorld,camera:this.camera.getState()};}
  get canGoBack(){return this.history.length>0;}
  /** True while the camera is on its way somewhere. */
  get travelling(){return this.cameraTransition!==undefined;}
  get latestFrame():Berx5DFrame{return this.composeFrame();}
  private composeFrame():Berx5DFrame{return{world:this.world.snapshot(),camera:this.camera.getState(),transition:this.transition?{...this.transition,fromCamera:cloneCamera(this.transition.fromCamera)}:undefined,reducedMotion:this.reducedMotion,deviceMotionEnabled:this.deviceMotionEnabled};}
  setAccessibility(options:{reducedMotion?:boolean}){if(options.reducedMotion!==undefined)this.reducedMotion=options.reducedMotion;}
  setDeviceMotionEnabled(enabled:boolean){this.deviceMotionEnabled=enabled;}
  registerObject(object:BerxSpatialObject){this.world.upsertObject(object);}
  removeObject(id:string){this.world.removeObject(id);if(this.currentWorld.focusObjectId===id)this.currentWorld.focusObjectId=undefined;}
  /**
   * Look at something.
   *
   * `framingRadius` is how far anything that belongs to the object but
   * stands outside it reaches — the ring of actions. The world
   * application knows what a thing affords and passes it; a bare
   * runtime has no affordances and passes nothing.
   */
  /**
   * Look at an entity.
   *
   * `at` is WHERE TO AIM, when that is not the entity's canonical
   * position. The canonical world is the truth and time is a lens over
   * it — berxApplyTemporal pushes an entity into depth as the cursor
   * moves away from it, and the renderer draws the lensed position.
   * Framing the canonical one aims the camera at where the entity would
   * have been: measured on the shipped shell, a moment canonically at
   * z -12.75 was drawn at -23.84, so focusing it stood the camera 13.82
   * from empty space with the entity 24.91 away and event:908 in front
   * of it. The identity, the active object and the world state stay the
   * entity's; only the point the camera aims at is the lensed one.
   */
  focus(objectId:string,framingRadius=0,kind?:BerxTransitionKind,at?:BerxVec3){
    const object=this.world.getObject(objectId);if(!object)return false;this.world.setActiveObject(objectId);this.currentWorld.focusObjectId=objectId;
    const pose=this.camera.poseForObject(at??object.transform.position,object.transform.scale,undefined,framingRadius);this.beginCameraTransition(pose,this.durationFor(kind),this.currentWorld,this.reducedMotion?undefined:kind);return true;
  }
  /**
   * Move the camera to an explicit pose, through the one transition.
   *
   * `focus` and `enterWorld` both derive their pose from an OBJECT;
   * framing derives it from the whole world, so it needs a way in that
   * takes a pose directly. It goes through beginCameraTransition like
   * everything else — a second way of moving the camera would be a
   * second camera, and the whole point of this class is that there is
   * one.
   */
  moveCamera(position:BerxVec3,target:BerxVec3,kind?:BerxTransitionKind){
    this.beginCameraTransition({position,target},this.durationFor(kind),this.currentWorld,this.reducedMotion?undefined:kind);
  }
  private beginCameraTransition(pose:{position:BerxVec3;target:BerxVec3},duration:number,toWorld=this.currentWorld,kind?:BerxTransitionKind){
    const fromCamera=this.camera.getState();this.cameraTransition=this.camera.moveToPose(pose,duration,kind);
    this.transition={fromWorld:cloneWorld(this.currentWorld),toWorld:cloneWorld(toWorld),fromCamera,destination:{...pose.position},progress:0,duration:Math.max(.001,duration),kind};
  }
  enterWorld(world:Omit<BerxWorldState,'camera'>,destination?:BerxVec3,kind?:BerxTransitionKind){
    const previous=cloneWorld({...this.currentWorld,camera:this.camera.getState()});this.history.push(previous);this.currentWorld={...world,enteredAt:Date.now(),camera:this.camera.getState()};
    const object=destination?undefined:this.world.getActiveObject();const focus=destination??object?.transform.position??{x:0,y:0,z:0};const pose=object?this.camera.poseForObject(object.transform.position,object.transform.scale):this.camera.poseForObject(focus);
    this.beginCameraTransition(pose,this.durationFor(kind),this.currentWorld,this.reducedMotion?undefined:kind);
  }
  back(kind?:BerxTransitionKind){
    const previous=this.history.pop();if(!previous)return false;const from=cloneWorld({...this.currentWorld,camera:this.camera.getState()});this.currentWorld=cloneWorld(previous);this.world.setActiveObject(previous.focusObjectId);
    const pose={position:cloneCamera(previous.camera).position,target:cloneCamera(previous.camera).target};const duration=this.durationFor(kind);const effect=this.reducedMotion?undefined:kind;
    this.cameraTransition=this.camera.moveToPose(pose,duration,effect);this.transition={fromWorld:from,toWorld:cloneWorld(previous),fromCamera:this.camera.getState(),destination:{...pose.position},progress:0,duration:Math.max(.001,duration),kind:effect};return true;
  }
  input(input:BerxCameraInput){if(this.cameraTransition)return;this.camera.applyInput({...input,motion:this.deviceMotionEnabled?input.motion:undefined});}
  frame(deltaSeconds:number):Berx5DFrame{
    this.world.tick(deltaSeconds);
    if(this.cameraTransition){const next=this.cameraTransition.step(deltaSeconds);this.camera.setState(next);if(this.transition)this.transition.progress=Math.min(1,this.transition.progress+Math.max(0,deltaSeconds)/this.transition.duration);if(this.cameraTransition.done){this.cameraTransition=undefined;this.transition=undefined;}}
    else this.camera.frame(deltaSeconds,this.reducedMotion);
    this.currentWorld.camera=this.camera.getState();return this.composeFrame();
  }
}
