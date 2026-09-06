/**
 * BERX MAX 5D web host.
 *
 * This is deliberately a canvas/GPU runtime, not a DOM card renderer.
 * The persistent spatial world is authoritative; the host only translates
 * browser input into camera/world commands and submits the resulting frame
 * to the GPU renderer.
 */
import { Berx5DRuntime, type Berx5DFrame, type BerxCameraInput, type BerxSpatialObject } from '@berx/spatial';
import { BerxThreeRuntimeRenderer } from './threeRuntime';

export interface Berx5DWebHostOptions {
  canvas?: HTMLCanvasElement;
  reducedMotion?: boolean;
  deviceMotion?: boolean;
  pixelRatioCap?: number;
  transitionDuration?: number;
}

export interface Berx5DWebHost {
  readonly canvas: HTMLCanvasElement;
  readonly runtime: Berx5DRuntime;
  readonly renderer: BerxThreeRuntimeRenderer;
  addObject(object: BerxSpatialObject): void;
  removeObject(id: string): void;
  focus(id: string): boolean;
  enterWorld(id: string, sourceRoute?: string, destination?: {x:number;y:number;z:number}): void;
  back(): boolean;
  start(): void;
  stop(): void;
  destroy(): void;
}

function reducedMotionPreference(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}

export function createBerx5DWebHost(options:Berx5DWebHostOptions={}):Berx5DWebHost{
  const canvas=options.canvas??document.createElement('canvas');
  if(!options.canvas){canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;document.body.appendChild(canvas);}
  canvas.style.display='block';canvas.style.width='100%';canvas.style.height='100%';canvas.style.touchAction='none';canvas.style.background='#07080A';

  const runtime=new Berx5DRuntime({reducedMotion:options.reducedMotion??reducedMotionPreference(),deviceMotionEnabled:options.deviceMotion!==false,transitionDuration:options.transitionDuration??0.65});
  const renderer=new BerxThreeRuntimeRenderer(canvas);
  const pixelRatioCap=Math.max(1,options.pixelRatioCap??2);
  let raf=0,last=performance.now(),running=false;
  let dragging=false,lastX=0,lastY=0;
  let pinchDistance:number|undefined;

  const resize=()=>{
    const rect=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,pixelRatioCap);
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;renderer.resize(width,height);}
  };
  const frame=(now:number)=>{
    if(!running)return;
    const dt=Math.min(0.05,Math.max(0,(now-last)/1000));last=now;
    resize();renderer.sync(runtime.frame(dt));raf=requestAnimationFrame(frame);
  };
  const onPointerDown=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);};
  const onPointerMove=(e:PointerEvent)=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;const input:BerxCameraInput={panX:-dx*0.018,panY:dy*0.018,depthDelta:0,pinch:0};runtime.input(input);};
  const onPointerUp=(e:PointerEvent)=>{dragging=false;canvas.releasePointerCapture?.(e.pointerId);};
  const onWheel=(e:WheelEvent)=>{e.preventDefault();runtime.input({panX:0,panY:0,depthDelta:e.deltaY*0.003,pinch:0});};
  const onTouchStart=(e:TouchEvent)=>{if(e.touches.length===2){pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}};
  const onTouchMove=(e:TouchEvent)=>{if(e.touches.length!==2||pinchDistance===undefined)return;const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);runtime.input({panX:0,panY:0,depthDelta:0,pinch:(d-pinchDistance)*0.03});pinchDistance=d;};
  const onTouchEnd=()=>{pinchDistance=undefined;};
  const onDeviceMotion=(e:DeviceOrientationEvent)=>{if(runtime.worldState&&reducedMotionPreference())return;const pitch=((e.beta??0)/45),roll=((e.gamma??0)/45),yaw=((e.alpha??0)/180);runtime.input({panX:0,panY:0,depthDelta:0,pinch:0,motion:{pitch,roll,yaw,intensity:0.65}});};
  const start=()=>{if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);};
  const stop=()=>{running=false;cancelAnimationFrame(raf);};
  const onResize=()=>resize();

  canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('touchstart',onTouchStart,{passive:true});canvas.addEventListener('touchmove',onTouchMove,{passive:true});canvas.addEventListener('touchend',onTouchEnd,{passive:true});window.addEventListener('resize',onResize);
  if(options.deviceMotion!==false&&'DeviceOrientationEvent' in window)window.addEventListener('deviceorientation',onDeviceMotion);
  resize();

  return {
    canvas,runtime,renderer,
    addObject:object=>runtime.registerObject(object),
    removeObject:id=>runtime.removeObject(id),
    focus:id=>runtime.focus(id),
    enterWorld:(id,sourceRoute,destination)=>runtime.enterWorld({id,sourceRoute},destination),
    back:()=>runtime.back(),start,stop,
    destroy:()=>{stop();canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointercancel',onPointerUp);canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('touchstart',onTouchStart);canvas.removeEventListener('touchmove',onTouchMove);canvas.removeEventListener('touchend',onTouchEnd);window.removeEventListener('resize',onResize);if(options.deviceMotion!==false&&'DeviceOrientationEvent' in window)window.removeEventListener('deviceorientation',onDeviceMotion);renderer.dispose();if(!options.canvas)canvas.remove();}
  };
}
