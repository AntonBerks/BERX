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
  berxEnergyLight,
  berxResolvePointLights,
  berxWorldLighting,
  berxWorldMaterial,
  BERX_MAX_POINT_LIGHTS,
  type BerxPointLight,
  type BerxSpatialObject,
  type BerxSpatialRenderer,
  type BerxWorldLighting,
  type BerxVec3,
} from '@berx/spatial';
import { presentationForKind } from '@berx/spatial/spatialPresentation';
import { createBox, createSphere, createRing, createFrame, type BerxPrimitiveMesh } from './primitiveGeometry';
import { BerxMediaTextureCache } from './mediaTextures';
import { BerxSpatialTextAtlas } from './spatialText';

type Mat4 = Float32Array; type Loc = WebGLUniformLocation | null;
const V = `#version 300 es\nprecision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W,L,LN;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;L=p;LN=n;gl_Position=P*V*w;}`;
/**
 * One forward pass: an analytic key light, a Blinn-ish specular term
 * and an emissive add. Not PBR — there is no BRDF, no IBL and no
 * shadow term, and the renderer's `capabilities` says so.
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

  vec3 lit=shade(n,v,normalize(KEY_DIR),KEY_COL*KEY_I,diffuseColor,f0,a);
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
function perspective(f:number,a:number,n:number,z:number):Mat4 { const q=1/Math.tan(f*Math.PI/360),nf=1/(n-z),m=new Float32Array(16);m[0]=q/a;m[5]=q;m[10]=(z+n)*nf;m[11]=-1;m[14]=2*z*n*nf;return m; }
/* the view matrix needs these; the picking ray does not build its own
   any more — that lives in @berx/spatial with the hit test it feeds */
function cross(a:BerxVec3,b:BerxVec3):BerxVec3{return{x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};}
function norm(v:BerxVec3):BerxVec3{const l=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/l,y:v.y/l,z:v.z/l};}
function sub(a:BerxVec3,b:BerxVec3):BerxVec3{return{x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}
function lookAt(p:BerxVec3,t:BerxVec3):Mat4 { const z=norm(sub(p,t));let up:BerxVec3={x:0,y:1,z:0};if(Math.abs(z.y)>.98)up={x:1,y:0,z:0};const x=norm(cross(up,z)),y=cross(z,x),m=new Float32Array(16);m[0]=x.x;m[1]=y.x;m[2]=z.x;m[4]=x.y;m[5]=y.y;m[6]=z.y;m[8]=x.z;m[9]=y.z;m[10]=z.z;m[12]=-x.x*p.x-x.y*p.y-x.z*p.z;m[13]=-y.x*p.x-y.y*p.y-y.z*p.z;m[14]=-z.x*p.x-z.y*p.y-z.z*p.z;m[15]=1;return m; }
function model(p:BerxVec3,s:BerxVec3,r:{x:number;y:number;z:number}):Mat4 { const cx=Math.cos(r.x),sx=Math.sin(r.x),cy=Math.cos(r.y),sy=Math.sin(r.y),cz=Math.cos(r.z),sz=Math.sin(r.z),m=new Float32Array(16);m[0]=cy*cz*s.x;m[1]=cy*sz*s.x;m[2]=-sy*s.x;m[4]=(sx*sy*cz-cx*sz)*s.y;m[5]=(sx*sy*sz+cx*cz)*s.y;m[6]=sx*cy*s.y;m[8]=(cx*sy*cz+sx*sz)*s.z;m[9]=(cx*sy*sz-sx*cz)*s.z;m[10]=cx*cy*s.z;m[12]=p.x;m[13]=p.y;m[14]=p.z;m[15]=1;return m; }
/**
 * The six planes of what the camera can see, extracted from the
 * view-projection matrix (Gribb/Hartmann). Normalised, so the distance
 * test below is a real distance in world units rather than a scaled one.
 */
function frustumPlanes(vp:Mat4):Float32Array{
 const p=new Float32Array(24);
 const m=(r:number,c:number)=>vp[c*4+r];
 const set=(i:number,a:number,b:number,c:number,d:number)=>{const l=Math.hypot(a,b,c)||1;p[i*4]=a/l;p[i*4+1]=b/l;p[i*4+2]=c/l;p[i*4+3]=d/l;};
 set(0,m(3,0)+m(0,0),m(3,1)+m(0,1),m(3,2)+m(0,2),m(3,3)+m(0,3)); // left
 set(1,m(3,0)-m(0,0),m(3,1)-m(0,1),m(3,2)-m(0,2),m(3,3)-m(0,3)); // right
 set(2,m(3,0)+m(1,0),m(3,1)+m(1,1),m(3,2)+m(1,2),m(3,3)+m(1,3)); // bottom
 set(3,m(3,0)-m(1,0),m(3,1)-m(1,1),m(3,2)-m(1,2),m(3,3)-m(1,3)); // top
 set(4,m(3,0)+m(2,0),m(3,1)+m(2,1),m(3,2)+m(2,2),m(3,3)+m(2,3)); // near
 set(5,m(3,0)-m(2,0),m(3,1)-m(2,1),m(3,2)-m(2,2),m(3,3)-m(2,3)); // far
 return p;
}
/** True when a bounding sphere is at least partly inside every plane. */
function sphereVisible(planes:Float32Array,x:number,y:number,z:number,r:number):boolean{
 for(let i=0;i<6;i++){if(planes[i*4]*x+planes[i*4+1]*y+planes[i*4+2]*z+planes[i*4+3]<-r)return false;}
 return true;
}
function multiply(a:Mat4,b:Mat4):Mat4{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v;}return o;}

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
/**
 * Metres past which an entity is drawn at reduced detail.
 *
 * It stays the same entity — same id, same relations, same pickable
 * volume — with fewer segments in its mesh, because at that distance
 * the extra ones are smaller than a pixel.
 */
const LOD_DISTANCE=18;

/** Metres from the camera at which names begin to fade, and are gone. */
const LABEL_FADE_START=14;
const LABEL_FADE_END=26;

export interface BerxSpatialRenderOptions {
	maxObjects?:number;
	ambientMotion?:boolean;
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
 readonly capabilities={perspective:true,depthBuffer:true,physicallyLitMaterials:true,shadows:false,postProcessing:false} as const;
 private readonly gl:WebGL2RenderingContext;private readonly program:WebGLProgram;private readonly meshes=new Map<string,GpuMesh>();private readonly P:Loc;private readonly V:Loc;private readonly M:Loc;private readonly BASE:Loc;private readonly EMIT:Loc;private readonly CAM:Loc;private readonly AMB:Loc;private readonly KEY_DIR:Loc;private readonly KEY_COL:Loc;private readonly KEY_I:Loc;private readonly PL_POS:Loc;private readonly PL_COL:Loc;private readonly PL_I:Loc;private readonly PL_R:Loc;private readonly PL_N:Loc;private readonly MET:Loc;private readonly ROUGH:Loc;private readonly OPAC:Loc;private readonly TRANS:Loc;private readonly HT:Loc;private readonly TS:Loc;private readonly TEX:Loc;private readonly textures:BerxMediaTextureCache;/** objectId -> the one media URI drawn on its face */private readonly media=new Map<string,string>();private width=1;private height=1;
 /* the label pass: its own program, its own quad, its own atlas */
 private readonly labels:BerxSpatialTextAtlas;
 private readonly labelProgram:WebGLProgram;
 private readonly labelQuad:{vao:WebGLVertexArrayObject;vbo:WebGLBuffer};
 private readonly LP:Loc;private readonly LV:Loc;private readonly LC:Loc;private readonly LR:Loc;private readonly LU:Loc;private readonly LS:Loc;private readonly LA:Loc;private readonly LT:Loc;
 /** Metres tall a label stands. A real size in the world, not a screen size. */
 private readonly labelHeight=0.34;
 /** The world's standing light. Replaceable, so a region can relight itself. */
 private lighting:BerxWorldLighting=berxWorldLighting();
 /** What the last frame actually cost. Measured during the draw. */
 private stats:BerxFrameStats={visible:0,inFrustum:0,drawCalls:0,triangles:0,lodReduced:0,budgetCut:0,residentTextures:0,residentLabels:0,meshVariants:0};
 constructor(canvas:HTMLCanvasElement,options:{textureBudget?:number;labelBudget?:number;onMediaError?:(uri:string,error:unknown)=>void}={}){const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw Error('BERX 5D requires WebGL2');this.gl=gl;this.program=program(gl);this.P=gl.getUniformLocation(this.program,'P');this.V=gl.getUniformLocation(this.program,'V');this.M=gl.getUniformLocation(this.program,'M');this.BASE=gl.getUniformLocation(this.program,'BASE');this.EMIT=gl.getUniformLocation(this.program,'EMIT');this.CAM=gl.getUniformLocation(this.program,'CAM');this.AMB=gl.getUniformLocation(this.program,'AMB');this.KEY_DIR=gl.getUniformLocation(this.program,'KEY_DIR');this.KEY_COL=gl.getUniformLocation(this.program,'KEY_COL');this.KEY_I=gl.getUniformLocation(this.program,'KEY_I');this.PL_POS=gl.getUniformLocation(this.program,'PL_POS');this.PL_COL=gl.getUniformLocation(this.program,'PL_COL');this.PL_I=gl.getUniformLocation(this.program,'PL_I');this.PL_R=gl.getUniformLocation(this.program,'PL_R');this.PL_N=gl.getUniformLocation(this.program,'PL_N');this.MET=gl.getUniformLocation(this.program,'MET');this.ROUGH=gl.getUniformLocation(this.program,'ROUGH');this.OPAC=gl.getUniformLocation(this.program,'OPAC');this.TRANS=gl.getUniformLocation(this.program,'TRANS');this.HT=gl.getUniformLocation(this.program,'HT');this.TS=gl.getUniformLocation(this.program,'TS');this.TEX=gl.getUniformLocation(this.program,'TEX');this.textures=new BerxMediaTextureCache(gl,{budget:options.textureBudget,onError:options.onMediaError});
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
   gl.clearColor(.027,.031,.039,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
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

 private drawEye(frame:Berx5DFrame,options:BerxSpatialRenderOptions,width:number,height:number,clear:boolean){const gl=this.gl,c=frame.camera,max=Math.max(1,Math.floor(options.maxObjects??frame.world.objects.length));gl.useProgram(this.program);if(clear){gl.clearColor(.027,.031,.039,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}
  const proj=perspective(c.fov,width/height,c.near,c.far),view=lookAt(c.position,c.target);
  gl.uniformMatrix4fv(this.P,false,proj);gl.uniformMatrix4fv(this.V,false,view);
  /* what the camera can actually see, this frame */
  const planes=frustumPlanes(multiply(proj,view));const all=frame.world.objects.filter(o=>o.visible);const focused=frame.world.activeObjectId;
  /**
   * Culling comes before the budget, not after.
   *
   * Spending the quality budget on objects the camera cannot see is
   * how a world with a hundred entities behind you draws nothing in
   * front of you. The bounding radius is the object's own largest
   * scale axis, which is what its geometry actually occupies.
   */
  const radiusOf=(o:BerxSpatialObject)=>Math.max(o.transform.scale.x,o.transform.scale.y,o.transform.scale.z)*.75;
  const visible=all.filter(o=>sphereVisible(planes,o.transform.position.x,o.transform.position.y,o.transform.position.z,radiusOf(o)));
  /* Two passes, because one order cannot serve both. Opaque objects go
     first with the focused one leading, so the depth buffer rejects
     everything behind it before it is ever shaded. Transparent objects
     then go strictly far-to-near: alpha blending is order-dependent,
     and drawing a near pane before a far one behind it composites the
     far one away. Sorting them together by `depth` — the old single
     pass — got the second case wrong every time. */
  const eye=c.position,distance=(o:typeof visible[number])=>Math.hypot(o.transform.position.x-eye.x,o.transform.position.y-eye.y,o.transform.position.z-eye.z);
  const opaque=visible.filter(o=>o.material.opacity>=1).sort((a,b)=>{if(a.id===focused)return-1;if(b.id===focused)return 1;return distance(a)-distance(b);});
  const blended=visible.filter(o=>o.material.opacity<1).sort((a,b)=>distance(b)-distance(a));
  const ordered=[...opaque,...blended];
  const drawn=ordered.slice(0,max);
  let drawCalls=0,triangles=0,lodReduced=0;
  this.textures.beginFrame();
  gl.activeTexture(gl.TEXTURE0);gl.uniform1i(this.TEX,0);
  /* the world's standing light, and whatever is live in it */
  const lighting=this.lighting;
  const energyLights:BerxPointLight[]=[];
  for(const o of visible){const light=berxEnergyLight(o.transform.position,o.energy);if(light)energyLights.push(light);}
  const litWorld={...lighting,points:[...lighting.points,...energyLights]};
  gl.uniform3f(this.CAM,c.position.x,c.position.y,c.position.z);
  gl.uniform3f(this.AMB,lighting.ambient[0]*lighting.ambientIntensity,lighting.ambient[1]*lighting.ambientIntensity,lighting.ambient[2]*lighting.ambientIntensity);
  gl.uniform3f(this.KEY_DIR,lighting.key.direction.x,lighting.key.direction.y,lighting.key.direction.z);
  gl.uniform3f(this.KEY_COL,...lighting.key.colour);
  /* ambient motion is a dimming of the key, never a loss of the world */
  gl.uniform1f(this.KEY_I,lighting.key.intensity*(options.ambientMotion===false?0.85:1));
  for(const o of drawn){const spec=geometryForEntity(o.kind),presentation=presentationForKind(o.kind,o),material=berxWorldMaterial(o.material.material);
   /* far enough away that the extra segments are sub-pixel */
   const far=Math.hypot(o.transform.position.x-c.position.x,o.transform.position.y-c.position.y,o.transform.position.z-c.position.z)>LOD_DISTANCE;
   if(far)lodReduced++;
   const mesh=this.getMesh(spec.kind,far?1:0);gl.bindVertexArray(mesh.vao);gl.uniformMatrix4fv(this.M,false,model(o.transform.position,o.transform.scale,o.transform.rotation));
   /* the DNA palette decides the colour; the material decides how the
      surface behaves. Neither is guessed from the other. */
   gl.uniform3f(this.BASE,...presentation.base);
   gl.uniform3f(this.EMIT,presentation.emissive[0]+material.emission[0]*o.energy,presentation.emissive[1]+material.emission[1]*o.energy,presentation.emissive[2]+material.emission[2]*o.energy);
   /* The object's own state is authoritative: it is where the mapping
      put the named material's numbers, and a screen may have changed
      one since. `||` was wrong here — it treats a metalness of 0, which
      is every dielectric, as unset. */
   gl.uniform1f(this.MET,o.material.metalness);
   gl.uniform1f(this.ROUGH,o.material.roughness);
   gl.uniform1f(this.OPAC,o.material.opacity);
   gl.uniform1f(this.TRANS,o.material.transmission);
   /* only the lights that reach this object, nearest first */
   const near=berxResolvePointLights(litWorld,o.transform.position);
   gl.uniform1i(this.PL_N,near.length);
   if(near.length>0){
    const pos=new Float32Array(BERX_MAX_POINT_LIGHTS*3),col=new Float32Array(BERX_MAX_POINT_LIGHTS*3),ints=new Float32Array(BERX_MAX_POINT_LIGHTS),ranges=new Float32Array(BERX_MAX_POINT_LIGHTS);
    near.forEach((light,i)=>{pos[i*3]=light.position.x;pos[i*3+1]=light.position.y;pos[i*3+2]=light.position.z;col[i*3]=light.colour[0];col[i*3+1]=light.colour[1];col[i*3+2]=light.colour[2];ints[i]=light.intensity;ranges[i]=light.range;});
    gl.uniform3fv(this.PL_POS,pos);gl.uniform3fv(this.PL_COL,col);gl.uniform1fv(this.PL_I,ints);gl.uniform1fv(this.PL_R,ranges);
   }
   const uri=this.media.get(o.id),loaded=uri?this.textures.get(uri):undefined;
   if(loaded){gl.bindTexture(gl.TEXTURE_2D,loaded.texture);gl.uniform1f(this.HT,1);
    const face=mesh.halfX/mesh.halfY,fit=loaded.aspectRatio/face;
    gl.uniform4f(this.TS,mesh.halfX,mesh.halfY,fit>1?1/fit:1,fit>1?1:fit);}
   else gl.uniform1f(this.HT,0);
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);drawCalls++;triangles+=mesh.count/3;}
  gl.bindVertexArray(null);gl.bindTexture(gl.TEXTURE_2D,null);
  const labelCalls=this.renderLabels(frame,drawn,width,height);
  this.stats={
   visible:all.length,
   inFrustum:visible.length,
   drawCalls:drawCalls+labelCalls,
   triangles,
   lodReduced,
   budgetCut:Math.max(0,visible.length-drawn.length),
   residentTextures:this.textures.residentCount,
   residentLabels:this.labels.residentCount,
   meshVariants:this.meshes.size,
  };}

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
 private renderLabels(frame:Berx5DFrame,objects:readonly BerxSpatialObject[],width:number,height:number):number{
  const gl=this.gl,c=frame.camera;
  const basis=cameraBasis(c);
  if(!basis)return 0;
  let calls=0;
  this.labels.beginFrame();
  gl.useProgram(this.labelProgram);
  gl.bindVertexArray(this.labelQuad.vao);
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);
  gl.activeTexture(gl.TEXTURE0);gl.uniform1i(this.LT,0);
  gl.uniformMatrix4fv(this.LP,false,perspective(c.fov,width/height,c.near,c.far));
  gl.uniformMatrix4fv(this.LV,false,lookAt(c.position,c.target));
  gl.uniform3f(this.LR,basis.right.x,basis.right.y,basis.right.z);
  gl.uniform3f(this.LU,basis.up.x,basis.up.y,basis.up.z);
  const eye=c.position;
  const withLabels=objects.filter(o=>o.label&&o.label.trim().length>0);
  const distance=(o:BerxSpatialObject)=>Math.hypot(o.transform.position.x-eye.x,o.transform.position.y-eye.y,o.transform.position.z-eye.z);
  for(const o of withLabels.slice().sort((a,b)=>distance(b)-distance(a))){
   const d=distance(o);
   /* out of reading range: not drawn at all, rather than drawn as an
      unreadable smear that still costs a draw call */
   if(d>LABEL_FADE_END)continue;
   const entry=this.labels.get(o.label!);
   if(!entry)continue;
   const alpha=d<=LABEL_FADE_START?1:1-(d-LABEL_FADE_START)/(LABEL_FADE_END-LABEL_FADE_START);
   /* the entity's own top, so a label belongs to its object and a
      larger object carries its name higher */
   const halfHeight=this.labelHeight*.5;
   const above=o.transform.scale.y*.5+halfHeight*1.6;
   gl.bindTexture(gl.TEXTURE_2D,entry.texture);
   gl.uniform3f(this.LC,
    o.transform.position.x+basis.up.x*above,
    o.transform.position.y+basis.up.y*above,
    o.transform.position.z+basis.up.z*above);
   gl.uniform2f(this.LS,halfHeight*entry.aspect,halfHeight);
   gl.uniform1f(this.LA,alpha*o.material.opacity);
   gl.drawArrays(gl.TRIANGLES,0,6);calls++;
  }
  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
  gl.bindVertexArray(null);gl.bindTexture(gl.TEXTURE_2D,null);
  return calls;
 }

 /** How many label textures are resident. Real, for a host reporting budgets. */
 get residentLabelCount(){return this.labels.residentCount;}
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
 dispose(){const gl=this.gl;this.releaseMeshes();this.textures.dispose();this.labels.dispose();this.media.clear();gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
 private releaseMeshes(){const gl=this.gl;for(const m of this.meshes.values()){gl.deleteBuffer(m.vbo);gl.deleteBuffer(m.ibo);gl.deleteVertexArray(m.vao);}this.meshes.clear();}
 /**
  * A lost context invalidates every name this renderer holds. The map
  * is cleared so the next frame rebuilds its meshes instead of binding
  * handles the driver no longer knows; deleting them here would be
  * calling into a dead context.
  */
 handleContextLost(){this.meshes.clear();this.textures.handleContextLost();this.labels.handleContextLost();}
}
