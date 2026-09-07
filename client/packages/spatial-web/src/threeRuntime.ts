/**
 * BERX MAX 5D web GPU backend — semantic 3D geometry, a real
 * perspective projection, a real depth buffer and spatial picking.
 *
 * It declares what it actually does. `physicallyLitMaterials` is true
 * because the forward pass really is a microfacet BRDF — GGX
 * distribution, height-correlated Smith visibility, Schlick Fresnel,
 * metalness splitting the diffuse and specular lobes — integrated
 * against real lights with real positions and real falloff.
 *
 * `shadows` and `postProcessing` stay false. There is no shadow map,
 * no G-buffer and no post chain, and neither becomes true by being
 * wanted.
 */
import {
  pickSpatialObject,
  rayFromNdc,
  cameraBasis,
  geometryForEntity,
  type Berx5DFrame,
  type BerxHit,
  berxBuildDrawList,
  BERX_WORLD_CLEAR,
  type BerxDrawList,
  berxWorldLighting,
  BERX_MAX_POINT_LIGHTS,
  type BerxSpatialRenderer,
  type BerxActionSlot,
  type BerxSpatialAffordance,
  type BerxWorldLighting,
} from '@berx/spatial';
import { createBox, createSphere, createRing, createFrame, type BerxPrimitiveMesh } from './primitiveGeometry';
import { BerxMediaTextureCache } from './mediaTextures';
import { BerxSpatialTextAtlas } from './spatialText';

type Loc = WebGLUniformLocation | null;
const V = `#version 300 es\nprecision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W,L,LN;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;L=p;LN=n;gl_Position=P*V*w;}`;
/**
 * The depth-only pass, from the light.
 *
 * Same vertex data and same model matrix as the main pass: a shadow cast
 * by a different shape from the one drawn is worse than no shadow,
 * because it is a shape that is not there. No fragment work at all —
 * the depth buffer is the entire output.
 */
const SV = `#version 300 es\nprecision highp float;layout(location=0)in vec3 p;uniform mat4 LVP,M;void main(){gl_Position=LVP*M*vec4(p,1.);}`;
const SF = `#version 300 es\nprecision highp float;void main(){}`;
/**
 * One forward pass with a real microfacet BRDF: GGX, height-correlated
 * Smith visibility, Schlick Fresnel, and metalness splitting the
 * diffuse and specular lobes. There is still no shadow term and no
 * image-based lighting, and the renderer's `capabilities` says so.
 *
 * Media is a planar projection onto the face that points at you. `L`
 * is the object-space position and `LN` the object-space normal, so
 * UVs come from the local XY extent and the texture is applied only
 * where the surface faces +Z. Side and back faces keep their material
 * colour instead of smearing the photograph around the form — which
 * is also why an avatar on an orb reads as a face rather than as a
 * texture wrapped over a ball.
 *
 * `TS` carries the UV scale: half-extent in XY, then a cover/contain
 * correction from the image's real decoded aspect ratio.
 */
const F = `#version 300 es
precision highp float;
in vec3 N,W,L,LN;
uniform vec3 CAM;                 // camera position, world space
uniform vec3 AMB;                 // ambient colour * intensity
uniform vec3 KEY_DIR, KEY_COL;    // directional key
uniform float KEY_I;
uniform vec3 PL_POS[4], PL_COL[4];
uniform float PL_I[4], PL_R[4];
uniform int PL_N;
uniform vec3 BASE, EMIT;
uniform float MET, ROUGH, OPAC, TRANS, HT;
uniform vec4 TS;
uniform sampler2D TEX;
// The light's own view-projection, from the shared core.
uniform mat4 LVP;
// x = 1/mapSize, y = depth bias, z = normal bias, w = strength (0 = off)
uniform vec4 SHADOW;
/**
 * A shadow sampler, not a plain sampler2D: the hardware does the depth
 * test per sample and averages the RESULTS, which is what makes a 3x3
 * tap a soft edge instead of four hard ones. Sampling depth and
 * comparing afterwards would average DEPTHS, and an averaged depth is a
 * surface that exists nowhere.
 */
uniform highp sampler2DShadow SHADOW_MAP;
out vec4 C;

const float PI = 3.14159265359;

// GGX / Trowbridge-Reitz normal distribution.
float D_GGX(float NoH, float a){ float a2=a*a; float d=NoH*NoH*(a2-1.)+1.; return a2/max(PI*d*d,1e-7); }
// Smith height-correlated visibility, already divided by 4*NoL*NoV.
float V_Smith(float NoV, float NoL, float a){
  float a2=a*a;
  float v=NoL*sqrt(NoV*NoV*(1.-a2)+a2);
  float l=NoV*sqrt(NoL*NoL*(1.-a2)+a2);
  return .5/max(v+l,1e-7);
}
vec3 F_Schlick(vec3 f0, float u){ float m=clamp(1.-u,0.,1.); float m2=m*m; return f0+(1.-f0)*(m2*m2*m); }

vec3 shade(vec3 n, vec3 v, vec3 l, vec3 radiance, vec3 diffuseColor, vec3 f0, float a){
  vec3 h=normalize(v+l);
  float NoL=max(dot(n,l),0.);
  if(NoL<=0.) return vec3(0.);
  float NoV=max(dot(n,v),1e-4);
  float NoH=max(dot(n,h),0.);
  float VoH=max(dot(v,h),0.);
  vec3 F=F_Schlick(f0,VoH);
  float Vis=V_Smith(NoV,NoL,a);
  float D=D_GGX(NoH,a);
  vec3 spec=F*(D*Vis);
  // energy that was not reflected is the only energy left to scatter
  vec3 kd=(1.-F);
  vec3 diff=kd*diffuseColor/PI;
  return (diff+spec)*radiance*NoL;
}

/**
 * How much of the key light reaches this point. 1 is full light.
 *
 * The same maths as the WGSL source, with the two conventions that
 * genuinely differ between the APIs written out rather than hidden:
 * GL clip space runs z from -1 to 1 (WGSL runs 0 to 1), and GL texture
 * space has its origin at the bottom (WGSL at the top). Everything else
 * — the normal offset, the slope scale, the 3x3 kernel and the fact
 * that only the KEY is shadowed — is identical.
 */
float keyVisibility(vec3 world, vec3 n, float NoL){
  if(SHADOW.w<=0.) return 1.;
  float slope=clamp(1.-NoL,0.,1.);
  vec3 offset=world+n*(SHADOW.z*(1.+slope*2.));
  vec4 lc=LVP*vec4(offset,1.);
  vec3 ndc=lc.xyz/max(lc.w,1e-6);
  if(ndc.x<-1.||ndc.x>1.||ndc.y<-1.||ndc.y>1.||ndc.z>1.) return 1.;
  // GL: -1..1 to 0..1 for both the texture coordinate and the depth
  vec2 uv=ndc.xy*.5+.5;
  float depth=ndc.z*.5+.5-SHADOW.y;
  float sum=0.;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 tap=uv+vec2(float(x),float(y))*SHADOW.x;
      sum+=texture(SHADOW_MAP,vec3(tap,depth));
    }
  }
  return mix(1.,sum/9.,SHADOW.w);
}

void main(){
  vec3 base=BASE;
  // media is a planar projection onto the face that points at you
  if(HT>.5 && normalize(LN).z>.5){
    vec2 uv=(L.xy/TS.xy)*.5*TS.zw+.5;
    if(uv.x>=0.&&uv.x<=1.&&uv.y>=0.&&uv.y<=1.) base=texture(TEX,uv).rgb;
  }
  vec3 n=normalize(N);
  vec3 v=normalize(CAM-W);
  float a=max(ROUGH*ROUGH,1e-3);
  // metals have no diffuse term and tint their reflection; dielectrics
  // reflect 4% white and keep their colour in the diffuse lobe
  vec3 diffuseColor=base*(1.-MET);
  vec3 f0=mix(vec3(.04),base,MET);

  vec3 keyL=normalize(KEY_DIR);
  // The key alone is shadowed. Ambient and the point lights are not: a
  // surface out of the sun still receives the room.
  float visibility=keyVisibility(W,n,max(dot(n,keyL),0.));
  vec3 lit=shade(n,v,keyL,KEY_COL*KEY_I,diffuseColor,f0,a)*visibility;
  for(int i=0;i<4;i++){
    if(i>=PL_N) break;
    vec3 d=PL_POS[i]-W;
    float dist=length(d);
    if(dist>PL_R[i]) continue;
    // inverse-square, windowed so a light ends where its range says
    float win=clamp(1.-pow(dist/PL_R[i],4.),0.,1.);
    float atten=win*win/max(dist*dist,1e-4);
    lit+=shade(n,v,d/max(dist,1e-4),PL_COL[i]*PL_I[i]*atten,diffuseColor,f0,a);
  }
  // ambient stands in for the bounced room. It is not image-based
  // lighting and does not pretend to be: one term, applied to the
  // diffuse colour and to the grazing reflection.
  vec3 amb=AMB*(diffuseColor+f0*pow(1.-max(dot(n,v),0.),5.));
  vec3 colour=lit+amb+EMIT;
  // transmission lets the ground through a glass surface rather than
  // fading it to nothing
  float alpha=clamp(OPAC*(1.-TRANS*.55),.02,1.);
  C=vec4(colour,alpha);
}`;
/**
 * Labels. Unlit on purpose: a name is not a surface in the room, it is
 * a name, and shading it would make it dimmer the further it turned
 * from the key light — which is the opposite of what a label is for.
 * It is still real geometry: it stands at a real position, has a real
 * height in metres, and is depth-tested, so anything in front of it
 * hides it.
 */
const TV = `#version 300 es\nprecision highp float;layout(location=0)in vec2 q;uniform mat4 P,V;uniform vec3 C,R,U;uniform vec2 S;out vec2 T;void main(){T=q*.5+.5;vec3 w=C+R*(q.x*S.x)+U*(q.y*S.y);gl_Position=P*V*vec4(w,1.);}`;
const TF = `#version 300 es\nprecision highp float;in vec2 T;uniform sampler2D TEX;uniform float A;out vec4 C;void main(){vec4 t=texture(TEX,T);C=vec4(t.rgb,t.a*A);if(C.a<.01)discard;}`;

function shader(gl: WebGL2RenderingContext, t: number, s: string) { const x=gl.createShader(t); if(!x) throw Error('BERX 5D shader allocation failed'); gl.shaderSource(x,s); gl.compileShader(x); if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(x)||'shader error';gl.deleteShader(x);throw Error(e);}return x; }
function program(gl: WebGL2RenderingContext,vs=V,fs=F) { const p=gl.createProgram();if(!p)throw Error('BERX 5D program allocation failed');const a=shader(gl,gl.VERTEX_SHADER,vs),b=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p)||'program link error';gl.deleteProgram(p);throw Error(e);}return p; }
/* The culler, the projection and the view matrix all live in
   @berx/spatial: one definition, used by the renderer that draws and by
   the gates that measure it. They were private copies here, which is
   how a verification and a renderer end up disagreeing about what is
   visible. */

/** What a frame actually cost. Measured, never estimated. */
export interface BerxFrameStats {
	/** Entities the world holds and that are marked visible. */
	visible: number;
	/** Survived the frustum test. */
	inFrustum: number;
	/** Actually issued, world plus labels. */
	drawCalls: number;
	triangles: number;
	/** Drawn at reduced detail because of distance. */
	lodReduced: number;
	/** Cut by the quality budget after culling, not before. */
	budgetCut: number;
	residentTextures: number;
	residentLabels: number;
	meshVariants: number;
}

interface GpuMesh{vao:WebGLVertexArrayObject;vbo:WebGLBuffer;ibo:WebGLBuffer;count:number;/** local XY half-extent, measured from the vertices themselves */halfX:number;halfY:number;}
function gpuMesh(gl:WebGL2RenderingContext,mesh:BerxPrimitiveMesh):GpuMesh { const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ibo=gl.createBuffer();if(!vao||!vbo||!ibo)throw Error('BERX 5D mesh allocation failed');gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);let halfX=0,halfY=0;for(let i=0;i<mesh.vertices.length;i+=6){halfX=Math.max(halfX,Math.abs(mesh.vertices[i]));halfY=Math.max(halfY,Math.abs(mesh.vertices[i+1]));}return{vao,vbo,ibo,count:mesh.indices.length,halfX:halfX||.5,halfY:halfY||.5}; }
/**
 * The mesh for a kind, at a level of detail.
 *
 * `lod` 1 is the same form with fewer segments — a distant orb does
 * not need 24×16, and the difference is invisible at that size. The
 * entity is unchanged: same id, same position, same relations, same
 * pickable volume. Only its representation is cheaper, which is the
 * whole distinction between level of detail and dropping things.
 * Boxes are already minimal and are shared across both levels.
 */
function meshFor(kind:ReturnType<typeof geometryForEntity>['kind'],lod:0|1):BerxPrimitiveMesh { const far=lod===1; switch(kind){case'orb':return createSphere(.5,far?10:24,far?7:16);case'ring':return createRing(.62,.42,far?16:48);case'frame':return createFrame(1,1,.12);case'surface':return createBox(1,1,.06);case'portal':return createFrame(1,1.2,.16);case'node':return createSphere(.58,far?9:20,far?6:12);case'stack':return createBox(1,1,.32);case'message':return createBox(1,.46,.12);case'create':return createSphere(.58,far?11:28,far?7:18);} }


export interface BerxSpatialRenderOptions {
	maxObjects?:number;
	ambientMotion?:boolean;
	/** Whether the key light casts. Passed straight to the shared core. */
	shadows?:boolean;
	/**
	 * Two eyes, drawn side by side into one backing store.
	 *
	 * `ipd` is the real interpupillary distance in world units. This is
	 * not a separate rendering path: the same frame, the same world, the
	 * same lights and the same budget, drawn twice from cameras offset
	 * along the view's right vector. A headset build is BERX with this
	 * flag set, not a second product.
	 */
	stereo?:{ipd:number};
}
export class BerxThreeRuntimeRenderer implements BerxSpatialRenderer {
 readonly kind='webgl2' as const;
 /* what this backend really does, and nothing it does not */
 readonly capabilities={perspective:true,depthBuffer:true,physicallyLitMaterials:true,shadows:true,postProcessing:false} as const;
 private readonly gl:WebGL2RenderingContext;private readonly program:WebGLProgram;private readonly meshes=new Map<string,GpuMesh>();private readonly P:Loc;private readonly V:Loc;private readonly M:Loc;private readonly BASE:Loc;private readonly EMIT:Loc;private readonly CAM:Loc;private readonly AMB:Loc;private readonly KEY_DIR:Loc;private readonly KEY_COL:Loc;private readonly KEY_I:Loc;private readonly PL_POS:Loc;private readonly PL_COL:Loc;private readonly PL_I:Loc;private readonly PL_R:Loc;private readonly PL_N:Loc;private readonly MET:Loc;private readonly ROUGH:Loc;private readonly OPAC:Loc;private readonly TRANS:Loc;private readonly HT:Loc;private readonly TS:Loc;private readonly TEX:Loc;private readonly LVP:Loc;private readonly SHADOW:Loc;private readonly SHADOW_MAP:Loc;
 /* the depth-only pass from the light: its own program, its own target */
 private readonly shadowProgram:WebGLProgram;private readonly SLVP:Loc;private readonly SM:Loc;
 private shadowFbo?:WebGLFramebuffer;private shadowTexture?:WebGLTexture;private shadowSize=0;
 private readonly textures:BerxMediaTextureCache;/** objectId -> the one media URI drawn on its face */private readonly media=new Map<string,string>();private width=1;private height=1;
 /* the label pass: its own program, its own quad, its own atlas */
 private readonly labels:BerxSpatialTextAtlas;
 private readonly labelProgram:WebGLProgram;
 private readonly labelQuad:{vao:WebGLVertexArrayObject;vbo:WebGLBuffer};
 private readonly LP:Loc;private readonly LV:Loc;private readonly LC:Loc;private readonly LR:Loc;private readonly LU:Loc;private readonly LS:Loc;private readonly LA:Loc;private readonly LT:Loc;
 /** Metres tall a label stands. A real size in the world, not a screen size. */
 
 /** The world's standing light. Replaceable, so a region can relight itself. */
 private lighting:BerxWorldLighting=berxWorldLighting();
 /**
  * What can be done with what is in focus.
  *
  * Set by the host each frame from the world. Empty when nothing is
  * focused, which is when no ring is drawn — there is no toolbar.
  */
 private affordances:readonly BerxSpatialAffordance[]=[];
 /** Where the ring stood last frame, so a tap can be tested against it. */
 private slots:BerxActionSlot[]=[];
 /** What the last frame actually cost. Measured during the draw. */
 private stats:BerxFrameStats={visible:0,inFrustum:0,drawCalls:0,triangles:0,lodReduced:0,budgetCut:0,residentTextures:0,residentLabels:0,meshVariants:0};
 constructor(canvas:HTMLCanvasElement,options:{textureBudget?:number;labelBudget?:number;onMediaError?:(uri:string,error:unknown)=>void}={}){const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw Error('BERX 5D requires WebGL2');this.gl=gl;this.program=program(gl);this.P=gl.getUniformLocation(this.program,'P');this.V=gl.getUniformLocation(this.program,'V');this.M=gl.getUniformLocation(this.program,'M');this.BASE=gl.getUniformLocation(this.program,'BASE');this.EMIT=gl.getUniformLocation(this.program,'EMIT');this.CAM=gl.getUniformLocation(this.program,'CAM');this.AMB=gl.getUniformLocation(this.program,'AMB');this.KEY_DIR=gl.getUniformLocation(this.program,'KEY_DIR');this.KEY_COL=gl.getUniformLocation(this.program,'KEY_COL');this.KEY_I=gl.getUniformLocation(this.program,'KEY_I');this.PL_POS=gl.getUniformLocation(this.program,'PL_POS');this.PL_COL=gl.getUniformLocation(this.program,'PL_COL');this.PL_I=gl.getUniformLocation(this.program,'PL_I');this.PL_R=gl.getUniformLocation(this.program,'PL_R');this.PL_N=gl.getUniformLocation(this.program,'PL_N');this.MET=gl.getUniformLocation(this.program,'MET');this.ROUGH=gl.getUniformLocation(this.program,'ROUGH');this.OPAC=gl.getUniformLocation(this.program,'OPAC');this.TRANS=gl.getUniformLocation(this.program,'TRANS');this.HT=gl.getUniformLocation(this.program,'HT');this.TS=gl.getUniformLocation(this.program,'TS');this.TEX=gl.getUniformLocation(this.program,'TEX');this.LVP=gl.getUniformLocation(this.program,'LVP');this.SHADOW=gl.getUniformLocation(this.program,'SHADOW');this.SHADOW_MAP=gl.getUniformLocation(this.program,'SHADOW_MAP');
  this.shadowProgram=program(gl,SV,SF);this.SLVP=gl.getUniformLocation(this.shadowProgram,'LVP');this.SM=gl.getUniformLocation(this.shadowProgram,'M');
  this.textures=new BerxMediaTextureCache(gl,{budget:options.textureBudget,onError:options.onMediaError});
  this.labels=new BerxSpatialTextAtlas(gl,{budget:options.labelBudget});
  this.labelProgram=program(gl,TV,TF);
  this.LP=gl.getUniformLocation(this.labelProgram,'P');this.LV=gl.getUniformLocation(this.labelProgram,'V');this.LC=gl.getUniformLocation(this.labelProgram,'C');this.LR=gl.getUniformLocation(this.labelProgram,'R');this.LU=gl.getUniformLocation(this.labelProgram,'U');this.LS=gl.getUniformLocation(this.labelProgram,'S');this.LA=gl.getUniformLocation(this.labelProgram,'A');this.LT=gl.getUniformLocation(this.labelProgram,'TEX');
  {const vao=gl.createVertexArray(),vbo=gl.createBuffer();if(!vao||!vbo)throw Error('BERX 5D label quad allocation failed');gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,8,0);gl.bindVertexArray(null);this.labelQuad={vao,vbo};}gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
 resize(w:number,h:number){this.width=Math.max(1,w);this.height=Math.max(1,h);this.gl.viewport(0,0,this.width,this.height);}
 private getMesh(kind:ReturnType<typeof geometryForEntity>['kind'],lod:0|1){const key=`${kind}:${lod}`;let m=this.meshes.get(key);if(!m){m=gpuMesh(this.gl,meshFor(kind,lod));this.meshes.set(key,m);}return m;}
 /**
 * Draw the world. With `stereo`, draw it twice into two viewports —
 * the same objects, the same lights, the same budget, from two
 * cameras a real interpupillary distance apart.
 */
 render(frame:Berx5DFrame,options:BerxSpatialRenderOptions={}){
  const gl=this.gl;
  if(options.stereo){
   const basis=cameraBasis(frame.camera);
   const half=Math.max(1,Math.floor(this.width/2));
   const shift=(sign:number)=>{
    if(!basis)return frame;
    const o=options.stereo!.ipd*.5*sign;
    return {...frame,camera:{...frame.camera,
     position:{x:frame.camera.position.x+basis.right.x*o,y:frame.camera.position.y+basis.right.y*o,z:frame.camera.position.z+basis.right.z*o},
     target:{x:frame.camera.target.x+basis.right.x*o,y:frame.camera.target.y+basis.right.y*o,z:frame.camera.target.z+basis.right.z*o}}};
   };
   /* the clear covers the whole surface once; each eye then owns half */
   gl.viewport(0,0,this.width,this.height);
   gl.clearColor(BERX_WORLD_CLEAR[0],BERX_WORLD_CLEAR[1],BERX_WORLD_CLEAR[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   let calls=0,tris=0,lod=0,frustum=0,budget=0,visibleCount=0;
   for(const [index,eye] of [shift(-1),shift(1)].entries()){
    gl.viewport(index*half,0,half,this.height);
    this.drawEye(eye,options,half,this.height,false);
    calls+=this.stats.drawCalls;tris+=this.stats.triangles;lod+=this.stats.lodReduced;
    frustum+=this.stats.inFrustum;budget+=this.stats.budgetCut;visibleCount=this.stats.visible;
   }
   gl.viewport(0,0,this.width,this.height);
   this.stats={...this.stats,visible:visibleCount,inFrustum:frustum,drawCalls:calls,triangles:tris,lodReduced:lod,budgetCut:budget};
   return;
  }
  gl.viewport(0,0,this.width,this.height);
  this.drawEye(frame,options,this.width,this.height,true);
 }

 private drawEye(frame:Berx5DFrame,options:BerxSpatialRenderOptions,width:number,height:number,clear:boolean){
  const gl=this.gl;
  gl.useProgram(this.program);
  /* What to draw is decided in @berx/spatial, not here: the cull, the
     order, the budget, the LOD and the lights are the same decision on
     every platform, so a native backend cannot quietly disagree with
     this one. All that is left below is turning that list into GL. */
  const list=berxBuildDrawList(frame,{
   width,height,
   maxObjects:options.maxObjects,
   ambientMotion:options.ambientMotion,
   shadows:options.shadows,
   lighting:this.lighting,
   mediaFor:(id)=>this.media.get(id),
   affordances:this.affordances,
  });
  /* The light's own pass comes first: the main pass reads the depth it
     writes. Its camera is the shared core's (list.shadow), so this
     backend and the others put the light in exactly the same place. */
  this.renderShadowMap(list);
  gl.useProgram(this.program);
  gl.viewport(0,0,width,height);
  if(clear){gl.clearColor(list.clearColor[0],list.clearColor[1],list.clearColor[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}
  if(list.shadow&&this.shadowTexture){
   gl.uniformMatrix4fv(this.LVP,false,new Float32Array(list.shadow.viewProjection));
   gl.uniform4f(this.SHADOW,1/list.shadow.mapSize,list.shadow.depthBias,list.shadow.normalBias,list.shadow.strength);
   /* unit 1: unit 0 is the media texture, rebound per item */
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);gl.uniform1i(this.SHADOW_MAP,1);
  } else {
   /* strength 0 turns the whole thing off in the shader — a world with
      nothing to cast is lit, not black */
   gl.uniform4f(this.SHADOW,0,0,0,0);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.ensureShadowTarget(1).texture);gl.uniform1i(this.SHADOW_MAP,1);
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.uniformMatrix4fv(this.P,false,new Float32Array(list.projection));
  gl.uniformMatrix4fv(this.V,false,new Float32Array(list.view));
  this.textures.beginFrame();
  gl.activeTexture(gl.TEXTURE0);gl.uniform1i(this.TEX,0);
  gl.uniform3f(this.CAM,list.camera.x,list.camera.y,list.camera.z);
  gl.uniform3f(this.AMB,list.ambient[0],list.ambient[1],list.ambient[2]);
  gl.uniform3f(this.KEY_DIR,list.key.direction.x,list.key.direction.y,list.key.direction.z);
  gl.uniform3f(this.KEY_COL,list.key.colour[0],list.key.colour[1],list.key.colour[2]);
  gl.uniform1f(this.KEY_I,list.key.intensity);
  let drawCalls=0,triangles=0;
  for(const item of list.items){
   const mesh=this.getMesh(item.primitive,item.lod);
   gl.bindVertexArray(mesh.vao);
   gl.uniformMatrix4fv(this.M,false,new Float32Array(item.model));
   gl.uniform3f(this.BASE,item.base[0],item.base[1],item.base[2]);
   gl.uniform3f(this.EMIT,item.emissive[0],item.emissive[1],item.emissive[2]);
   gl.uniform1f(this.MET,item.metalness);
   gl.uniform1f(this.ROUGH,item.roughness);
   gl.uniform1f(this.OPAC,item.opacity);
   gl.uniform1f(this.TRANS,item.transmission);
   const near=item.pointLights;
   gl.uniform1i(this.PL_N,near.length);
   if(near.length>0){
    const pos=new Float32Array(BERX_MAX_POINT_LIGHTS*3),col=new Float32Array(BERX_MAX_POINT_LIGHTS*3),ints=new Float32Array(BERX_MAX_POINT_LIGHTS),ranges=new Float32Array(BERX_MAX_POINT_LIGHTS);
    near.forEach((light,i)=>{pos[i*3]=light.position.x;pos[i*3+1]=light.position.y;pos[i*3+2]=light.position.z;col[i*3]=light.colour[0];col[i*3+1]=light.colour[1];col[i*3+2]=light.colour[2];ints[i]=light.intensity;ranges[i]=light.range;});
    gl.uniform3fv(this.PL_POS,pos);gl.uniform3fv(this.PL_COL,col);gl.uniform1fv(this.PL_I,ints);gl.uniform1fv(this.PL_R,ranges);
   }
   const loaded=item.media?this.textures.get(item.media):undefined;
   if(loaded){gl.bindTexture(gl.TEXTURE_2D,loaded.texture);gl.uniform1f(this.HT,1);
    const face=mesh.halfX/mesh.halfY,fit=loaded.aspectRatio/face;
    gl.uniform4f(this.TS,mesh.halfX,mesh.halfY,fit>1?1/fit:1,fit>1?1:fit);}
   else gl.uniform1f(this.HT,0);
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);drawCalls++;triangles+=mesh.count/3;}
  gl.bindVertexArray(null);gl.bindTexture(gl.TEXTURE_2D,null);
  const labelCalls=this.renderLabels(list);
  this.stats={
   visible:list.stats.visible,
   inFrustum:list.stats.inFrustum,
   drawCalls:drawCalls+labelCalls,
   triangles,
   lodReduced:list.stats.lodReduced,
   budgetCut:list.stats.budgetCut,
   residentTextures:this.textures.residentCount,
   residentLabels:this.labels.residentCount,
   meshVariants:this.meshes.size,
  };}

 /**
  * The depth-only pass, from the light.
  *
  * Front faces are culled rather than back faces — the standard trick,
  * and worth stating because it looks wrong: recording the BACK of each
  * caster puts the recorded depth on the far side of the object, which
  * moves the whole surface away from the comparison and removes
  * self-shadowing acne without a bias large enough to detach the
  * shadow from the object's foot.
  *
  * Nothing is decided here. Which objects cast, where the light stands
  * and how big its box is all come from list.shadow, which the shared
  * core computed — so this backend cannot disagree with the others
  * about where a shadow falls.
  */
 private renderShadowMap(list:BerxDrawList){
  const gl=this.gl;
  if(!list.shadow){return;}
  const target=this.ensureShadowTarget(list.shadow.mapSize);
  gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
  gl.viewport(0,0,list.shadow.mapSize,list.shadow.mapSize);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.shadowProgram);
  gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);
  gl.uniformMatrix4fv(this.SLVP,false,new Float32Array(list.shadow.viewProjection));
  for(const item of list.items){
   /* A surface you can see through does not stop light. Casting from
      glass would put a solid shadow under something transparent. */
   if(item.opacity<0.95){continue;}
   const mesh=this.getMesh(item.primitive,item.lod);
   gl.bindVertexArray(mesh.vao);
   gl.uniformMatrix4fv(this.SM,false,new Float32Array(item.model));
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  gl.bindVertexArray(null);
  gl.cullFace(gl.BACK);gl.disable(gl.CULL_FACE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }

 /** The depth target, built once and rebuilt only if the size changes. */
 private ensureShadowTarget(size:number):{fbo:WebGLFramebuffer;texture:WebGLTexture}{
  const gl=this.gl;
  if(this.shadowFbo&&this.shadowTexture&&this.shadowSize===size){return {fbo:this.shadowFbo,texture:this.shadowTexture};}
  if(this.shadowFbo)gl.deleteFramebuffer(this.shadowFbo);
  if(this.shadowTexture)gl.deleteTexture(this.shadowTexture);
  const texture=gl.createTexture();const fbo=gl.createFramebuffer();
  if(!texture||!fbo)throw Error('BERX 5D shadow target allocation failed');
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  /* comparison mode is what makes sampler2DShadow average RESULTS
     rather than depths — without it the 3x3 tap is meaningless */
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,texture,0);
  const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.bindTexture(gl.TEXTURE_2D,null);
  if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error(`BERX 5D shadow framebuffer incomplete: 0x${status.toString(16)}`);
  this.shadowFbo=fbo;this.shadowTexture=texture;this.shadowSize=size;
  return {fbo,texture};
 }

 /**
  * The names, standing where their entities stand.
  *
  * One camera-facing quad each, drawn after the world so the depth
  * buffer already holds everything solid: a label behind a place is
  * hidden by it, exactly as a sign behind a building would be. Depth
  * writes are off so labels never occlude each other into flicker, and
  * they are drawn far-to-near so the ones in front composite over the
  * ones behind.
  *
  * They fade with distance rather than growing to stay readable. A
  * label that keeps its screen size is a HUD; this is a world.
  */
 private renderLabels(list:BerxDrawList):number{
  const gl=this.gl;
  const basis=list.basis;
  if(!basis)return 0;
  let calls=0;
  this.labels.beginFrame();
  gl.useProgram(this.labelProgram);
  gl.bindVertexArray(this.labelQuad.vao);
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);
  gl.activeTexture(gl.TEXTURE0);gl.uniform1i(this.LT,0);
  gl.uniformMatrix4fv(this.LP,false,new Float32Array(list.projection));
  gl.uniformMatrix4fv(this.LV,false,new Float32Array(list.view));
  gl.uniform3f(this.LR,basis.right.x,basis.right.y,basis.right.z);
  gl.uniform3f(this.LU,basis.up.x,basis.up.y,basis.up.z);
  /* where each name stands is decided in @berx/spatial, so the WebGPU
     backend puts it in exactly the same place */
  for(const placement of list.labels){
   const entry=this.labels.get(placement.text);
   if(!entry)continue;
   gl.bindTexture(gl.TEXTURE_2D,entry.texture);
   gl.uniform3f(this.LC,placement.position.x,placement.position.y,placement.position.z);
   gl.uniform2f(this.LS,placement.halfHeight*entry.aspect,placement.halfHeight);
   gl.uniform1f(this.LA,placement.alpha);
   gl.drawArrays(gl.TRIANGLES,0,6);calls++;
  }
  /* the ring, in the same pass: it is made of the same material as a
     name, because it is the same kind of thing — a word standing in
     the world beside the object it belongs to. Where its slots stand is
     decided in @berx/spatial with everything else about the frame. */
  this.slots=list.actionSlots;
  for(const slot of this.slots){
   const entry=this.labels.get(slot.affordance.label);
   if(!entry)continue;
   gl.bindTexture(gl.TEXTURE_2D,entry.texture);
   gl.uniform3f(this.LC,slot.position.x,slot.position.y,slot.position.z);
   gl.uniform2f(this.LS,slot.halfHeight*entry.aspect,slot.halfHeight);
   gl.uniform1f(this.LA,1);
   gl.drawArrays(gl.TRIANGLES,0,6);calls++;
  }
  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
  gl.bindVertexArray(null);gl.bindTexture(gl.TEXTURE_2D,null);
  return calls;
 }

 /** How many label textures are resident. Real, for a host reporting budgets. */
 get residentLabelCount(){return this.labels.residentCount;}
 /** The actions to offer beside whatever is focused. */
 setAffordances(affordances:readonly BerxSpatialAffordance[]){this.affordances=affordances;}
 /** Where the ring stood in the last drawn frame. */
 get actionSlots():readonly BerxActionSlot[]{return this.slots;}
 /** Relight the world. Lights are state, not constants baked into a shader. */
 setLighting(lighting:BerxWorldLighting){this.lighting=lighting;}
 get worldLighting():BerxWorldLighting{return this.lighting;}
 /** What the last frame actually cost. Read it, do not estimate it. */
 get frameStats():BerxFrameStats{return {...this.stats};}

 /**
  * The media an object carries, from the mapping layer.
  *
  * One picture per object: these forms have one face that points at
  * the viewer, and a second image on it would have nowhere to go.
  * Passing no surfaces removes whatever was there — the object returns
  * to its material colour rather than keeping a stale photograph.
  */
 setObjectMedia(objectId:string,surfaces:readonly {uri:string}[]){
  const first=surfaces[0]?.uri;
  if(first)this.media.set(objectId,first);else this.media.delete(objectId);
 }
 /** Everything the world no longer holds stops being drawn or cached. */
 forgetObjectMedia(objectId:string){this.media.delete(objectId);}
 /** How many textures are resident. Real, for a host that reports budgets. */
 get residentTextureCount(){return this.textures.residentCount;}
 /** `x`/`y` are in backing-store pixels, the same space the frame was drawn in. */
 pick(frame:Berx5DFrame,x:number,y:number):BerxHit|undefined{
  const ray=rayFromNdc(frame.camera,x/this.width*2-1,1-y/this.height*2,this.width/this.height);
  return ray?pickSpatialObject(ray,frame.world.objects):undefined;
 }
 /**
  * Deleting the objects is not the same as giving the GPU its memory
  * back: the context itself holds the driver allocation, and a page
  * that mounts and unmounts worlds leaks one per mount without this.
  * WEBGL_lose_context is the only way to ask for it, and it is
  * optional — where the extension is absent the deletes above are all
  * there is, which is honest rather than silent.
  */
 dispose(){const gl=this.gl;this.releaseMeshes();this.textures.dispose();this.labels.dispose();this.media.clear();if(this.shadowFbo)gl.deleteFramebuffer(this.shadowFbo);if(this.shadowTexture)gl.deleteTexture(this.shadowTexture);this.shadowFbo=undefined;this.shadowTexture=undefined;this.shadowSize=0;gl.deleteProgram(this.shadowProgram);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
 private releaseMeshes(){const gl=this.gl;for(const m of this.meshes.values()){gl.deleteBuffer(m.vbo);gl.deleteBuffer(m.ibo);gl.deleteVertexArray(m.vao);}this.meshes.clear();}
 /**
  * A lost context invalidates every name this renderer holds. The map
  * is cleared so the next frame rebuilds its meshes instead of binding
  * handles the driver no longer knows; deleting them here would be
  * calling into a dead context.
  */
 handleContextLost(){this.meshes.clear();this.textures.handleContextLost();this.labels.handleContextLost();
  /* the depth target belonged to the dead context; forgetting the
     handles makes the next frame build a new one rather than bind
     something the driver no longer knows */
  this.shadowFbo=undefined;this.shadowTexture=undefined;this.shadowSize=0;}
}
