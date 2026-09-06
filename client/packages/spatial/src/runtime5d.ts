/** BERX MAX 5D: persistent world + authoritative camera navigation. */
import { BerxSpatialCamera, BerxCameraTransition, type BerxCameraInput, type BerxSpatialCameraState } from './spatialCamera';
import { BerxSpatialWorld, type BerxSpatialObject, type BerxSpatialWorldSnapshot, type BerxVec3 } from './world';
export type BerxWorldId=string;
export interface BerxWorldState{id:BerxWorldId;sourceRoute?:string;focusObjectId?:string;enteredAt:number;camera:BerxSpatialCameraState;}
export interface BerxSpatialTransitionState{fromWorld:BerxWorldState;toWorld:BerxWorldState;fromCamera:BerxSpatialCameraState;destination:BerxVec3;progress:number;duration:number;}
export interface Berx5DFrame{world:BerxSpatialWorldSnapshot;camera:BerxSpatialCameraState;transition?:BerxSpatialTransitionState;reducedMotion:boolean;deviceMotionEnabled:boolean;}
export interface Berx5DRuntimeOptions{reducedMotion?:boolean;deviceMotionEnabled?:boolean;}

export class Berx5DRuntime{
 readonly world:BerxSpatialWorld;readonly camera:BerxSpatialCamera;private readonly history:BerxWorldState[]=[];private currentWorld:BerxWorldState;private transition?:BerxSpatialTransitionState;private cameraTransition?:BerxCameraTransition;private reducedMotion:boolean;private deviceMotionEnabled:boolean;
 constructor(options:Berx5DRuntimeOptions={}){this.world=new BerxSpatialWorld();this.camera=new BerxSpatialCamera();this.reducedMotion=options.reducedMotion===true;this.deviceMotionEnabled=options.deviceMotionEnabled!==false;this.currentWorld={id:'root',enteredAt:Date.now(),camera:this.camera.getState()};}
 get worldState(){return {...this.currentWorld,camera:this.camera.getState()};}
 setAccessibility(options:{reducedMotion?:boolean}){if(options.reducedMotion!==undefined)this.reducedMotion=options.reducedMotion;}
 setDeviceMotionEnabled(enabled:boolean){this.deviceMotionEnabled=enabled;}
 registerObject(object:BerxSpatialObject){this.world.upsertObject(object);}
 focus(objectId:string){const object=this.world.getObject(objectId);if(!object)return;this.world.setActiveObject(objectId);this.currentWorld.focusObjectId=objectId;this.beginCameraTransition(object.transform.position,this.reducedMotion?0:0.65);}
 private beginCameraTransition(destination:BerxVec3,duration:number){this.cameraTransition=this.camera.moveTo(destination,duration);this.transition={fromWorld:{...this.currentWorld,camera:this.camera.getState()},toWorld:{...this.currentWorld,camera:this.camera.getState()},fromCamera:this.camera.getState(),destination:{...destination},progress:0,duration:Math.max(.001,duration)};}
 enterWorld(world:Omit<BerxWorldState,'camera'>,destination?:BerxVec3){const previous={...this.currentWorld,camera:this.camera.getState()};this.history.push(previous);this.currentWorld={...world,enteredAt:Date.now(),camera:this.camera.getState()};const target=destination??this.world.getActiveObject()?.transform.position??{x:0,y:0,z:0};this.cameraTransition=this.camera.moveTo(target,this.reducedMotion?.01:.65);this.transition={fromWorld:previous,toWorld:{...this.currentWorld},fromCamera:this.camera.getState(),destination:{...target},progress:0,duration:this.reducedMotion?.01:.65};}
 back(){const previous=this.history.pop();if(!previous)return;const from={...this.currentWorld,camera:this.camera.getState()};this.currentWorld={...previous};this.cameraTransition=this.camera.moveTo(previous.camera.position,this.reducedMotion?.01:.65);this.transition={fromWorld:from,toWorld:{...previous},fromCamera:this.camera.getState(),destination:{...previous.camera.position},progress:0,duration:this.reducedMotion?.01:.65};}
 input(input:BerxCameraInput){this.camera.applyInput({...input,motion:this.deviceMotionEnabled?input.motion:undefined});}
 frame(deltaSeconds:number):Berx5DFrame{this.world.tick(deltaSeconds);if(this.cameraTransition){const next=this.cameraTransition.step(deltaSeconds);this.camera.setState(next);if(this.transition){this.transition.progress=Math.min(1,this.transition.progress+deltaSeconds/this.transition.duration);}if(this.cameraTransition.done){this.cameraTransition=undefined;this.transition=undefined;}}else this.camera.frame(deltaSeconds,this.reducedMotion);this.currentWorld.camera=this.camera.getState();return{world:this.world.snapshot(),camera:this.camera.getState(),transition:this.transition?{...this.transition,fromCamera:{...this.transition.fromCamera}}:undefined,reducedMotion:this.reducedMotion,deviceMotionEnabled:this.deviceMotionEnabled};}
}
