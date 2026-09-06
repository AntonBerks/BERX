/** BERX MAX 5D web host — real GPU scene, adaptive quality, camera input, picking and world navigation. */
import { Berx5DRuntime, type BerxSpatialObject } from '@berx/spatial';
import { BerxThreeRuntimeRenderer } from './threeRuntime';
import { resolveSpatialQuality, type BerxSpatialQualityResult } from './runtimeQuality';

export interface Berx5DWebHostOptions { canvas?:HTMLCanvasElement; reducedMotion?:boolean; deviceMotion?:boolean; pixelRatioCap?:number; }
export interface Berx5DWebHost { readonly canvas:HTMLCanvasElement; readonly runtime:Berx5DRuntime; readonly renderer:BerxThreeRuntimeRenderer; readonly quality:BerxSpatialQualityResult; addObject(object:BerxSpatialObject):void; removeObject(id:string):void; focus(id:string):boolean; enterWorld(id:string,sourceRoute?:string,destination?:{x:number;y:number;z:number}):void; back():boolean; start():void; stop():void; destroy():void; }
const reducedMotionPreference=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createBerx5DWebHost(options:Berx5DWebHostOptions={}):Berx5DWebHost{
 const canvas=options.canvas??document.createElement('canvas');
 if(!options.canvas){canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;document.body.appendChild(canvas);}
 canvas.style.display='block';canvas.style.width='100%';canvas.style.height='100%';canvas.style.touchAction='none';canvas.style.background='#07080A';
 const reducedMotion=options.reducedMotion??reducedMotionPreference();
 const runtime=new Berx5DRuntime({reducedMotion,deviceMotionEnabled:options.deviceMotion!==false});
 const renderer=new BerxThreeRuntimeRenderer(canvas),pixelRatioCap=Math.max(1,options.pixelRatioCap??2);
 let quality:BerxSpatialQualityResult={quality:'balanced',pixelRatio:1,maxObjects:80,shadows:false,postFx:false,ambientMotion:true};
 let raf=0,last=performance.now(),running=false,dragging=false,lastX=0,lastY=0,downX=0,downY=0,pinchDistance:number|undefined;
 const resize=()=>{const rect=canvas.getBoundingClientRect(),nativeDpr=window.devicePixelRatio||1,baseDpr=Math.min(nativeDpr,pixelRatioCap);quality=resolveSpatialQuality({devicePixelRatio:baseDpr,width:Math.max(1,rect.width),height:Math.max(1,rect.height),reducedMotion,visibleObjectCount:runtime.latestFrame.world.objects.filter(o=>o.visible).length});const dpr=Math.min(baseDpr,quality.pixelRatio),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;renderer.resize(width,height);}};
 const frame=(now:number)=>{if(!running)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;resize();const spatialFrame=runtime.frame(dt);renderer.render(spatialFrame,{maxObjects:quality.maxObjects,ambientMotion:quality.ambientMotion});raf=requestAnimationFrame(frame);};
 const onPointerDown=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;lastX=downX=e.clientX;lastY=downY=e.clientY;canvas.setPointerCapture?.(e.pointerId);};
 const onPointerMove=(e:PointerEvent)=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;runtime.input({panX:-dx*.018,panY:dy*.018,depthDelta:0,pinch:0});};
 const onPointerUp=(e:PointerEvent)=>{if(!dragging)return;dragging=false;canvas.releasePointerCapture?.(e.pointerId);if(Math.hypot(e.clientX-downX,e.clientY-downY)>8)return;const rect=canvas.getBoundingClientRect(),dpr=canvas.width/Math.max(1,rect.width),frameState=runtime.latestFrame,hit=renderer.pick(frameState,(e.clientX-rect.left)*dpr,(e.clientY-rect.top)*dpr);if(hit)runtime.focus(hit.objectId);};
 const onWheel=(e:WheelEvent)=>{e.preventDefault();runtime.input({panX:0,panY:0,depthDelta:e.deltaY*.003,pinch:0});};
 const onTouchStart=(e:TouchEvent)=>{if(e.touches.length===2)pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);};
 const onTouchMove=(e:TouchEvent)=>{if(e.touches.length!==2||pinchDistance===undefined)return;const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);runtime.input({panX:0,panY:0,depthDelta:0,pinch:(d-pinchDistance)*.03});pinchDistance=d;};
 const onTouchEnd=()=>{pinchDistance=undefined;};
 const onDeviceMotion=(e:DeviceOrientationEvent)=>{if(reducedMotion)return;runtime.input({panX:0,panY:0,depthDelta:0,pinch:0,motion:{pitch:(e.beta??0)/45,roll:(e.gamma??0)/45,yaw:(e.alpha??0)/180,intensity:.65}});};
 const start=()=>{if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);};
 const stop=()=>{running=false;cancelAnimationFrame(raf);};
 const onResize=()=>resize();
 canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('touchstart',onTouchStart,{passive:true});canvas.addEventListener('touchmove',onTouchMove,{passive:true});canvas.addEventListener('touchend',onTouchEnd,{passive:true});window.addEventListener('resize',onResize);if(options.deviceMotion!==false&&'DeviceOrientationEvent' in window)window.addEventListener('deviceorientation',onDeviceMotion);resize();
 return {canvas,runtime,renderer,get quality(){return quality;},addObject:object=>runtime.registerObject(object),removeObject:id=>runtime.removeObject(id),focus:id=>runtime.focus(id),enterWorld:(id,sourceRoute,destination)=>runtime.enterWorld({id,sourceRoute,enteredAt:Date.now()},destination),back:()=>runtime.back(),start,stop,destroy:()=>{stop();canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointercancel',onPointerUp);canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('touchstart',onTouchStart);canvas.removeEventListener('touchmove',onTouchMove);canvas.removeEventListener('touchend',onTouchEnd);window.removeEventListener('resize',onResize);if(options.deviceMotion!==false&&'DeviceOrientationEvent' in window)window.removeEventListener('deviceorientation',onDeviceMotion);renderer.dispose();if(!options.canvas)canvas.remove();}};
}
