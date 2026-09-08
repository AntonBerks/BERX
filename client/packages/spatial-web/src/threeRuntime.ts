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
	BERX_EXPOSURE,
  pickSpatialObject,
  rayFromNdc,
  berxEyeCamera,
  geometryForEntity,
  type Berx5DFrame,
  type BerxHit,
  berxBuildDrawList,
  type BerxFrameMemory,
  berxSSAOUniform,
  type BerxRenderQuality,
  type BerxCoreField,
  berxInvertMat4,
  berxMultiplyMat4,
  BERX_WORLD_CLEAR,
  type BerxDrawList,
  berxWorldLighting,
  BERX_MAX_POINT_LIGHTS,
  type BerxSpatialRenderer,
  type BerxActionSlot,
  type BerxSpatialAffordance,
  type BerxWorldLighting,
} from '@berx/spatial';
import { createBevelBox, createSphere, createTorus, createFrame, type BerxPrimitiveMesh } from './primitiveGeometry';
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
// THE ROOM. Same five slots as the WGSL's uniform block, filled from the
// same berxEnvironmentUniform array, in the same order.
uniform vec4 ENV_ZEN;             // rgb zenith,          w = sun intensity
uniform vec4 ENV_HOR;             // rgb horizon,         w = sun sharpness
uniform vec4 ENV_GND;             // rgb ground * bounce, w = overall intensity
uniform vec3 ENV_SUN_DIR;         // toward the key light
uniform vec3 ENV_SUN;             // sun colour
uniform sampler2D AO_MAP;         // the occlusion this frame's pass wrote
uniform float AO_ON;              // 1 when the pass ran, 0 when it did not
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

/**
 * BERX ENVIRONMENT — the analytic room, in GLSL.
 *
 * Line for line the same three terms as @berx/spatial's
 * berxEnvironmentRadiance and the same function in world.wgsl: a sky
 * gradient over the upper hemisphere, the floor's weak return below it,
 * and a sun lobe around the key direction. GLSL's smoothstep is the same
 * Hermite polynomial berxEnvSmoothstep01 spells out in TypeScript, which
 * is why the builtin can be called here rather than reimplemented.
 *
 * The direction must already be normalised; the callers normalise.
 */
vec3 berxEnvironment(vec3 dir){
  float up=clamp(dir.y,0.,1.);
  float down=clamp(-dir.y,0.,1.);
  vec3 sky=mix(ENV_HOR.rgb,ENV_ZEN.rgb,smoothstep(0.,1.,up));
  // the floor's return is already scaled by the bounce factor host-side
  vec3 base=mix(sky,ENV_GND.rgb,smoothstep(0.,1.,down));
  // both vectors point TOWARD the light, so this peaks at 1 looking at it
  float cosA=max(dot(dir,ENV_SUN_DIR),0.);
  float glow=pow(cosA,ENV_HOR.w)*ENV_ZEN.w;
  return (base+ENV_SUN*glow)*ENV_GND.w;
}

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
  /* AMBIENT IS NOW THE ROOM — see the same block in world.wgsl. Diffuse
     samples the environment along the normal, specular along the
     reflection blended toward the normal by roughness, which is this
     backend's prefilter: there is no mip chain because there is no map. */
  float nov=max(dot(n,v),0.);
  vec3 refl=reflect(-v,n);
  vec3 envD=berxEnvironment(n);
  vec3 envS=berxEnvironment(normalize(mix(refl,n,ROUGH)));
  vec3 fres=F_Schlick(f0,nov);
  /* AMBIENT OCCLUSION SCALES THE ROOM, AND ONLY THE ROOM — see the same
     block in world.wgsl. Read at this fragment's own pixel, so there is
     nothing to filter. */
  float ao=AO_ON>.5?texelFetch(AO_MAP,ivec2(gl_FragCoord.xy),0).r:1.;
  vec3 amb=(envD*diffuseColor*(vec3(1.)-fres)+envS*fres)*ao;
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
/* ------------------------------------------------------------------ *
 * THE G-BUFFER AND SSAO, in GLSL
 * ------------------------------------------------------------------ *
 *
 * WebGL2 has no compute stage, so the occlusion that ssao.wgsl computes
 * in a compute pass is computed here as a fullscreen fragment pass. The
 * LOOP is line for line the WGSL one and the shared core's berxSSAOAt —
 * the kernel, the radius, the slope-scaled bias, the range check and the
 * falloff all arrive from @berx/spatial's berxSSAOUniform, so the only
 * thing that differs between the three is which stage runs it.
 */
const GV = `#version 300 es\nprecision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 VN,VP;void main(){vec4 w=M*vec4(p,1.);VN=mat3(V)*(mat3(M)*n);VP=(V*w).xyz;gl_Position=P*V*w;}`;
/* view-space normal in rgb, view-space depth in metres in a — see the
   note in ssao.wgsl for why this is not a hardware depth texture */
const GF = `#version 300 es\nprecision highp float;in vec3 VN,VP;out vec4 C;void main(){C=vec4(normalize(VN),-VP.z);}`;

/** A fullscreen triangle, so the AO pass needs no vertex buffer of its own. */
const AV = `#version 300 es\nprecision highp float;void main(){vec2 q=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(q*2.-1.,0.,1.);}`;
const AF = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D GBUF;
// BERX_SSAO_SAMPLES offsets, then one vec4: radius, bias, strength, power
uniform vec4 K[17];
// x = width, y = height, z = focal length in pixels
// x = width, y = height, z = focal length in pixels, w = live taps
uniform vec4 DIM;
out vec4 C;
void main(){
  ivec2 at=ivec2(gl_FragCoord.xy);
  int w=int(DIM.x), h=int(DIM.y);
  vec4 centre=texelFetch(GBUF,at,0);
  if(centre.a<=0.){C=vec4(1.);return;}
  vec4 params=K[16];
  float radius=params.x, strength=params.z, power=params.w;
  vec3 n=normalize(centre.xyz);
  vec3 up=abs(n.z)>=.999?vec3(1.,0.,0.):vec3(0.,0.,1.);
  vec3 tx=normalize(cross(up,n));
  vec3 ty=cross(n,tx);
  // slope-scaled bias — see berxSSAOAt's own note
  float slope=1.-min(1.,abs(n.z));
  float bias=params.y*(1.+slope*4.);
  float occluded=0.;
  /* Loops to the LIVE tap count, not sixteen: a quality tier hands this
     a strided subset of the spiral and zero-fills the rest of the buffer,
     so the buffer's size — and therefore every bind group naming it —
     survives a change of quality. */
  int taps=int(DIM.w);
  for(int j=0;j<16;j++){
    if(j>=taps) break;
    vec3 k=K[j].xyz;
    vec3 s=tx*k.x+ty*k.y+n*k.z;
    float sd=centre.a-s.z*radius;
    if(sd<=0.) continue;
    int sx=at.x+int(floor((s.x*radius*DIM.z)/sd+.5));
    int sy=at.y+int(floor((s.y*radius*DIM.z)/sd+.5));
    if(sx<0||sy<0||sx>=w||sy>=h) continue;
    vec4 there=texelFetch(GBUF,ivec2(sx,sy),0);
    if(there.a<=0.) continue;
    if(there.a<sd-bias){
      float range=radius/max(abs(centre.a-there.a),1e-4);
      occluded+=min(1.,range);
    }
  }
  float ratio=occluded/float(max(taps,1));
  C=vec4(max(0.,1.-pow(ratio,power)*strength),0.,0.,1.);
}`;

function program(gl: WebGL2RenderingContext,vs=V,fs=F) { const p=gl.createProgram();if(!p)throw Error('BERX 5D program allocation failed');const a=shader(gl,gl.VERTEX_SHADER,vs),b=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p)||'program link error';gl.deleteProgram(p);throw Error(e);}return p; }
/* The culler, the projection and the view matrix all live in
   @berx/spatial: one definition, used by the renderer that draws and by
   the gates that measure it. They were private copies here, which is
   how a verification and a renderer end up disagreeing about what is
   visible. */

/** What a frame actually cost. Measured, never estimated. */
export interface BerxFrameStats {
	/**
	 * The GPU passes this frame actually encoded, in order.
	 *
	 * A record, not a description: each backend pushes a name at the point
	 * it records the pass, and the pipeline gate holds that against
	 * @berx/spatial's berxExpectedPasses. Comparing final pixels cannot
	 * catch a renderer that stopped running a pass under some combination
	 * of flags; this can, and did.
	 */
	stages?: string[];
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
function meshFor(kind:ReturnType<typeof geometryForEntity>['kind'],lod:0|1):BerxPrimitiveMesh { const far=lod===1; switch(kind){case'orb':return createSphere(.5,far?10:24,far?7:16);case'ring':return createTorus(.62,.42,far?18:48,far?6:12);case'frame':return createFrame(1,1,.12);case'surface':return createBevelBox(1,1,.06,.02);case'portal':return createFrame(1,1.2,.16);case'node':return createSphere(.58,far?9:20,far?6:12);case'stack':return createBevelBox(1,1,.32,.1);case'message':return createBevelBox(1,.46,.12,.05);case'create':return createSphere(.58,far?11:28,far?7:18);} }


/**
 * THE VOLUMETRIC PASS, in GLSL.
 *
 * The same march as volumetric.wgsl, line for line, as a fullscreen
 * fragment pass — which is the shape WebGL2 can run, and the shape the
 * WGSL uses too for exactly that reason. Everything that decides the
 * answer (density, phase asymmetry, march length, intensity) arrives in
 * VPARAMS from @berx/spatial's berxVolumetricUniform, and the loop is
 * the same sequence of operations as berxVolumetricAt — the CPU twin
 * the gate predicts pixels with.
 *
 * Two conventions differ from the WGSL and are written out rather than
 * hidden: GL clip space runs z from -1 to 1 where WGSL runs 0 to 1, and
 * GL texture space has its origin at the bottom. Both appear only in
 * the shadow lookup.
 */
const VV = `#version 300 es\nprecision highp float;out vec2 UV;void main(){vec2 c=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);UV=vec2(c.x*.5+.5,c.y*.5+.5);gl_Position=vec4(c,0.,1.);}`;
const VF = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec2 UV;
uniform mat4 INV_VP;            // pixel -> world ray
uniform mat4 VLVP;              // the light's own view-projection
uniform vec4 VSHADOW;           // x = 1/mapSize, y = depth bias, z unused, w = strength
uniform vec4 VPARAMS;           // x = density, y = phase g, z = max distance, w = intensity
uniform vec4 VDIMS;             // x = march width, y = march height, z = steps, w = march scale
uniform vec3 VEYE, VLIGHT_DIR, VLIGHT_COL, VFORWARD;
uniform float VLIGHT_I;
uniform sampler2D VGBUF;
uniform sampler2DShadow VSHADOW_MAP;
out vec4 C;

const float PI = 3.14159265359;

// The same curve as @berx/spatial's berxPhaseHG, clamp included: at g->1
// and cosTheta->1 the denominator goes to zero and the phase to
// infinity, which is the singular lobe that blows a shaft out to white.
float phaseHG(float cosTheta, float g){
  float g2=g*g;
  float denom=1.+g2-2.*g*cosTheta;
  return (1.-g2)/(4.*PI*pow(max(denom,1e-4),1.5));
}

// FNV-1a over the pixel coordinate — the same hash as
// berxVolumetricJitter, so a shaft dithers identically in four languages
// without shipping a noise texture.
float vjitter(int x,int y){
  uint h=2166136261u;
  h=h^(uint(x)&0xffffu); h=h*16777619u;
  h=h^(uint(y)&0xffffu); h=h*16777619u;
  return float(h>>8u)/16777216.;
}

float litAt(vec3 world){
  if(VSHADOW.w<=0.) return 1.;
  vec4 clip=VLVP*vec4(world,1.);
  vec3 ndc=clip.xyz/max(clip.w,1e-6);
  if(ndc.x<-1.||ndc.x>1.||ndc.y<-1.||ndc.y>1.||ndc.z>1.) return 1.;
  // GL: -1..1 to 0..1, and the origin is at the bottom
  vec2 uv=ndc.xy*.5+.5;
  return texture(VSHADOW_MAP,vec3(uv,ndc.z*.5+.5-VSHADOW.y));
}

void main(){
  int px=int(UV.x*VDIMS.x);
  // TOP-DOWN, deliberately, even though GL's own buffers are bottom-up:
  // the jitter is a hash of the pixel index, and WGSL's uv origin is at
  // the top. Hashing GL's bottom-up row gave the same physical pixel a
  // different march offset in the two backends — a real disagreement of
  // up to 49/255 between two ports that were otherwise identical, and
  // one only a cross-backend comparison could find.
  int py=int((1.-UV.y)*VDIMS.y);

  vec2 ndc=vec2(UV.x*2.-1.,UV.y*2.-1.);
  vec4 nearH=INV_VP*vec4(ndc,-1.,1.);
  vec4 farH=INV_VP*vec4(ndc,1.,1.);
  vec3 nearP=nearH.xyz/max(nearH.w,1e-6);
  vec3 farP=farH.xyz/max(farH.w,1e-6);
  vec3 dir=normalize(farP-nearP);

  // Distance to the first surface. The march stops there: air behind a
  // wall does not scatter light into the eye.
  // The G-buffer stores VIEW DEPTH — distance along the camera's forward
  // axis — and the march needs distance along THIS ray. For an off-axis
  // pixel those differ by 1/cos.
  // The G-buffer is at FRAME resolution while this pass may be running at
  // a fraction of it, so the fetch is explicit rather than a UV sample: a
  // filtered lookup would pick an unspecified one of the texels the march
  // pixel covers, and volumetric.wgsl picks the block's centre. Two ports
  // choosing differently is exactly the kind of divergence only a
  // cross-backend comparison finds, so both do the same arithmetic.
  //
  // px is the march column and the GL row is bottom-up, which is why this
  // uses UV.y directly where the jitter above used 1-UV.y.
  float vscale=max(VDIMS.w,1.);
  int gy=int(float(int(UV.y*VDIMS.y))*vscale+(vscale-1.)*.5);
  int gx=int(float(px)*vscale+(vscale-1.)*.5);
  float depth=texelFetch(VGBUF,ivec2(gx,gy),0).a;
  float along=max(dot(dir,normalize(VFORWARD)),1e-3);
  float surface=depth>0.?depth/along:VPARAMS.z;
  float far=min(VPARAMS.z,surface);
  if(far<=0.){ C=vec4(0.,0.,0.,1.); return; }

  int steps=int(VDIMS.z);
  float stepLength=far/float(steps);
  float phase=phaseHG(dot(dir,normalize(VLIGHT_DIR)),VPARAMS.y);
  float offset=vjitter(px,py);

  float inscatter=0.;
  for(int s=0;s<64;s++){
    if(s>=steps) break;
    float t=(float(s)+offset)*stepLength;
    vec3 p=VEYE+dir*t;
    float lit=litAt(p);
    if(lit<=0.) continue;
    float transmittance=exp(-VPARAMS.x*t);
    inscatter+=lit*phase*VPARAMS.x*stepLength*transmittance;
  }
  float energy=inscatter*VPARAMS.w;
  C=vec4(VLIGHT_COL*VLIGHT_I*energy,1.);
}`;
/** Additive composite of the in-scatter buffer over the world. */
const CV = `#version 300 es\nprecision highp float;out vec2 UV;void main(){vec2 c=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);UV=vec2(c.x*.5+.5,c.y*.5+.5);gl_Position=vec4(c,0.,1.);}`;
/**
 * The additive composite, with its own bilinear tap.
 *
 * The march target is RGBA32F and NEAREST, because a 32-bit float texture
 * is not filterable in WebGL2 without the filtering companion to
 * EXT_color_buffer_float — an extension no phone is guaranteed to have.
 * So the four loads and three mixes are written out, exactly as
 * composite in volumetric.wgsl does them, and the two backends upsample a
 * half-resolution march identically instead of one of them getting
 * hardware filtering the other cannot have.
 *
 * At scale 1 the sample lands on a texel centre, f is zero in both axes,
 * and this returns what a nearest tap returned — the full-resolution
 * picture is unchanged, bit for bit.
 */
const CF = `#version 300 es
precision highp float;
in vec2 UV;
uniform sampler2D SRC;
out vec4 C;
void main(){
  vec2 size=vec2(textureSize(SRC,0));
  vec2 p=UV*size-.5;
  vec2 base=floor(p);
  vec2 f=p-base;
  vec2 hi=size-1.;
  ivec2 c00=ivec2(clamp(base,vec2(0.),hi));
  ivec2 c10=ivec2(clamp(base+vec2(1.,0.),vec2(0.),hi));
  ivec2 c01=ivec2(clamp(base+vec2(0.,1.),vec2(0.),hi));
  ivec2 c11=ivec2(clamp(base+vec2(1.,1.),vec2(0.),hi));
  vec3 top=mix(texelFetch(SRC,c00,0).rgb,texelFetch(SRC,c10,0).rgb,f.x);
  vec3 bottom=mix(texelFetch(SRC,c01,0).rgb,texelFetch(SRC,c11,0).rgb,f.x);
  C=vec4(mix(top,bottom,f.y),1.);
}`;
/** Reads a depth texture as ordinary floats, for the verification path. */
const DF = `#version 300 es\nprecision highp float;in vec2 UV;uniform highp sampler2D SRC;out vec4 C;void main(){C=vec4(texture(SRC,UV).r,0.,0.,1.);}`;
/**
 * POST — exposure and the shoulder, in GLSL.
 *
 * The same five constants as post.wgsl, the same five as the Rust, and
 * the same five as @berx/spatial's berxExposure, which is the CPU twin
 * a gate predicts real pixels with. One set of numbers is the whole
 * point: three renderers agreeing with each other is a weaker claim
 * than three renderers computing what the core says.
 *
 * Reads the linear frame — the world, its names, the motes and the air,
 * all of it — multiplies by the measured gain and rolls the result off.
 */
const POSTF = `#version 300 es
precision highp float;
in vec2 UV;
uniform sampler2D SRC;
uniform float EXPOSURE;
out vec4 C;
float shoulder(float x){
  float v=max(x,0.);
  return clamp((v*(2.51*v+.03))/(v*(2.43*v+.59)+.14),0.,1.);
}
void main(){
  /* A fetch, not a sample: one output pixel per input pixel, so a
     bilinear tap only adds a half-texel question each API answers its
     own way. It was worth three disagreeing pixels along the top edge. */
  vec3 e=texelFetch(SRC,ivec2(gl_FragCoord.xy),0).rgb*EXPOSURE;
  C=vec4(shoulder(e.r),shoulder(e.g),shoulder(e.b),1.);
}`;

/**
 * THE PARTICLE PASS, in GLSL.
 *
 * The same hash and the same placement as particles.wgsl and as
 * @berx/spatial's berxParticleAt, term for term. Nothing is read from a
 * buffer: each vertex works out where its own particle is from its
 * index, which is what makes the field identical in four languages
 * without a buffer to keep in sync.
 *
 * Six vertices per particle, expanded from gl_VertexID alone — a
 * camera-facing quad needs no vertex buffer when its corners come from
 * arithmetic.
 */
const PV = `#version 300 es
precision highp float;
uniform mat4 PP, PVIEW;
uniform vec4 PORIGIN;   // xyz what the field is arranged around, w time
uniform vec4 PCOLOUR;   // rgb colour, a peak alpha
uniform vec4 PSHAPE;    // x extent, y speed, z size, w period
uniform vec4 PCOUNTS;   // x count, y kind (0 dust, 1 energy, 2 stars)
uniform vec3 PRIGHT, PUP;
out vec2 PUV;
out float PALPHA;

const float PI = 3.14159265359;

float phash(uint index, uint lane){
  uint h=2166136261u;
  h=h^(index&0xffffu); h=h*16777619u;
  h=h^((index>>16u)&0xffffu); h=h*16777619u;
  h=h^(lane&0xffffu); h=h*16777619u;
  return float(h>>8u)/16777216.;
}

void main(){
  uint index=uint(gl_VertexID)/6u;
  uint corner=uint(gl_VertexID)%6u;
  vec2 c;
  if(corner==0u) c=vec2(-1.,-1.);
  else if(corner==1u) c=vec2(1.,-1.);
  else if(corner==2u) c=vec2(1.,1.);
  else if(corner==3u) c=vec2(-1.,-1.);
  else if(corner==4u) c=vec2(1.,1.);
  else c=vec2(-1.,1.);

  float hx=phash(index,1u), hy=phash(index,2u), hz=phash(index,3u), hp=phash(index,4u);
  float extent=PSHAPE.x, speed=PSHAPE.y, size=PSHAPE.z, period=PSHAPE.w;
  float phase=fract(PORIGIN.w/period+hp);

  vec3 centre; float alpha; float psize;
  if(PCOUNTS.y>.5 && PCOUNTS.y<1.5){
    // energy: a spiral leaving a surface, not a column of dots
    float angle=hx*PI*2.+phase*PI*4.;
    float radius=extent*(.25+hy*.55)*(1.-phase*.45);
    centre=vec3(PORIGIN.x+cos(angle)*radius,
                PORIGIN.y-extent*.4+phase*extent*1.8,
                PORIGIN.z+sin(angle)*radius);
    alpha=PCOLOUR.a*sin(phase*PI);
    psize=size*(.6+hz*.8);
  } else {
    float drift=speed==0.?0.:phase*extent;
    float wx=fract((hx*extent+drift*.35)/extent)*extent-extent*.5;
    float wy=fract((hy*extent+drift)/extent)*extent-extent*.5;
    float wz=fract((hz*extent+drift*.2)/extent)*extent-extent*.5;
    centre=vec3(PORIGIN.x+wx,PORIGIN.y+wy,PORIGIN.z+wz);
    alpha=PCOUNTS.y>1.5?PCOLOUR.a*(.65+.35*sin(phase*PI*2.)):PCOLOUR.a;
    psize=size*(.7+hz*.6);
  }

  vec3 world=centre+PRIGHT*(c.x*psize)+PUP*(c.y*psize);
  PUV=c;
  PALPHA=alpha;
  gl_Position=PP*PVIEW*vec4(world,1.);
}`;
const PF = `#version 300 es
precision highp float;
in vec2 PUV;
in float PALPHA;
uniform vec4 PCOLOUR;
out vec4 C;
void main(){
  // A round, soft mote. A square particle reads as a missing texture and
  // a hard-edged circle reads as a UI dot.
  float r=length(PUV);
  if(r>1.) discard;
  float falloff=1.-r*r;
  float a=PALPHA*falloff*falloff;
  if(a<.002) discard;
  // premultiplied: drawn additively, so the colour carries the alpha
  C=vec4(PCOLOUR.rgb*a,a);
}`;

export interface BerxSpatialRenderOptions {
	maxObjects?:number;
	/**
	 * The quality tier's own knobs, from @berx/spatial's berxRenderQuality.
	 *
	 * Passed straight through to the draw list, which is where every one
	 * of them is actually read — the march's step count and resolution,
	 * the occlusion kernel, the shadow map's size, how much of each
	 * particle field is drawn. A tier changes what an effect COSTS and
	 * never whether it exists.
	 */
	quality?:BerxRenderQuality;
	/**
	 * The Core's physical state.
	 *
	 * Not a thing drawn beside the world — parameters the world is
	 * rendered WITH: haze is how much the air holds, grain how much
	 * matter is in it, luminance how much light. Passing it is what makes
	 * a search look like a search.
	 */
	core?:BerxCoreField;
	ambientMotion?:boolean;
	/** Whether the key light casts. Passed straight to the shared core. */
	shadows?:boolean;
	/**
	 * Whether the ambient-occlusion pass runs.
	 *
	 * False skips the G-buffer and the AO pass and makes the shader use
	 * 1.0, so a frame without it is lit exactly as it was before the pass
	 * existed — which is what the gate renders to measure the difference.
	 */
	ssao?:boolean;
	/** Whether the key light is visible in the air. Passed to the shared core. */
	volumetric?:boolean;
	/**
	 * Whether this frame remembers what the last one decided.
	 *
	 * True by default, and the default is the one that is right for a
	 * runtime: the budget keeps the nearest N and the LOD switches at a
	 * distance, both bare thresholds on a quantity that wobbles, so
	 * without a memory an object at either boundary changes state every
	 * frame while the camera breathes. See @berx/spatial's stability.ts.
	 *
	 * False is for a gate that wants the control: the same walk with
	 * every decision made afresh, so the difference between the two runs
	 * is the measurement.
	 */
	stable?:boolean;
	/** Whether the air carries dust, energy and the far field. */
	particles?:boolean;
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
 private readonly gl:WebGL2RenderingContext;private readonly program:WebGLProgram;private readonly meshes=new Map<string,GpuMesh>();private readonly P:Loc;private readonly V:Loc;private readonly M:Loc;private readonly BASE:Loc;private readonly EMIT:Loc;private readonly CAM:Loc;private readonly AMB:Loc;private readonly ENV_ZEN:Loc;private readonly ENV_HOR:Loc;private readonly ENV_GND:Loc;private readonly ENV_SUN_DIR:Loc;private readonly ENV_SUN:Loc;private readonly AO_MAP:Loc;private readonly AO_ON:Loc;private readonly gbufProgram:WebGLProgram;private readonly aoProgram:WebGLProgram;private readonly GP:Loc;private readonly GV_:Loc;private readonly GM:Loc;private readonly GBUF:Loc;private readonly K:Loc;private readonly DIM:Loc;private gbufTexture?:WebGLTexture;private gbufDepth?:WebGLRenderbuffer;private gbufFbo?:WebGLFramebuffer;private aoTexture?:WebGLTexture;private aoFbo?:WebGLFramebuffer;private aoVao?:WebGLVertexArrayObject;private blankAo?:WebGLTexture;private ssaoSize={w:0,h:0};
 private readonly volProgram:WebGLProgram;private readonly compositeProgram:WebGLProgram;
 /**
  * The linear frame, and the target everything before post draws into.
  *
  * `sceneFbo` is what the world, label, particle and composite passes
  * are bound to. It is null only when a half-float colour attachment is
  * not renderable here — see ensureHdr.
  */
 private sceneFbo:WebGLFramebuffer|null=null;private hdrFbo?:WebGLFramebuffer;private hdrTex?:WebGLTexture;private msFbo?:WebGLFramebuffer;private msColor?:WebGLRenderbuffer;private msDepth?:WebGLRenderbuffer;private hdrW=0;private hdrH=0;private hdrSamples=0;private postProgram?:WebGLProgram;private PSRC:Loc=null;private PEXP:Loc=null;
 private readonly VINV:Loc;private readonly VLVP:Loc;private readonly VSHADOW:Loc;private readonly VPARAMS:Loc;private readonly VDIMS:Loc;private readonly VEYE:Loc;private readonly VLDIR:Loc;private readonly VLCOL:Loc;private readonly VLI:Loc;private readonly VFWD:Loc;private readonly VGBUF:Loc;private readonly VSMAP:Loc;private readonly CSRC:Loc;private readonly depthReadProgram:WebGLProgram;private readonly DSRC:Loc;
 private volTexture?:WebGLTexture;private volFbo?:WebGLFramebuffer;private volSize={w:0,h:0};
 private readonly particleProgram:WebGLProgram;private readonly PP:Loc;private readonly PVIEW:Loc;private readonly PORIGIN:Loc;private readonly PCOLOUR:Loc;private readonly PSHAPE:Loc;private readonly PCOUNTS:Loc;private readonly PRIGHT:Loc;private readonly PUP:Loc;private particleVao?:WebGLVertexArrayObject;
 /**
  * A NEAREST comparison sampler, used only by the volumetric march.
  *
  * The world pass wants LINEAR so its 3x3 kernel is a soft edge. The
  * march does not: it takes 32 taps along a ray that is already
  * dithered, so hardware 2x2 PCF adds nothing — and it would make the
  * result depend on a filtering convention the CPU twin would have to
  * guess at. One hard tap is exactly reproducible, which is what having
  * an oracle at all requires.
  */
 private memory?:BerxFrameMemory;private shadowNearest?:WebGLSampler;private readonly floatColour:boolean;private readonly KEY_DIR:Loc;private readonly KEY_COL:Loc;private readonly KEY_I:Loc;private readonly PL_POS:Loc;private readonly PL_COL:Loc;private readonly PL_I:Loc;private readonly PL_R:Loc;private readonly PL_N:Loc;private readonly MET:Loc;private readonly ROUGH:Loc;private readonly OPAC:Loc;private readonly TRANS:Loc;private readonly HT:Loc;private readonly TS:Loc;private readonly TEX:Loc;private readonly LVP:Loc;private readonly SHADOW:Loc;private readonly SHADOW_MAP:Loc;
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
 constructor(canvas:HTMLCanvasElement,options:{textureBudget?:number;labelBudget?:number;onMediaError?:(uri:string,error:unknown)=>void}={}){const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw Error('BERX 5D requires WebGL2');this.gl=gl;this.program=program(gl);this.P=gl.getUniformLocation(this.program,'P');this.V=gl.getUniformLocation(this.program,'V');this.M=gl.getUniformLocation(this.program,'M');this.BASE=gl.getUniformLocation(this.program,'BASE');this.EMIT=gl.getUniformLocation(this.program,'EMIT');this.CAM=gl.getUniformLocation(this.program,'CAM');this.AMB=gl.getUniformLocation(this.program,'AMB');this.ENV_ZEN=gl.getUniformLocation(this.program,'ENV_ZEN');this.ENV_HOR=gl.getUniformLocation(this.program,'ENV_HOR');this.ENV_GND=gl.getUniformLocation(this.program,'ENV_GND');this.ENV_SUN_DIR=gl.getUniformLocation(this.program,'ENV_SUN_DIR');this.ENV_SUN=gl.getUniformLocation(this.program,'ENV_SUN');this.AO_MAP=gl.getUniformLocation(this.program,'AO_MAP');this.AO_ON=gl.getUniformLocation(this.program,'AO_ON');
  /* Rendering the G-buffer needs float colour attachments. Without the
     extension the pass cannot run at all, so the flag is recorded and the
     occlusion is reported as absent rather than silently wrong. */
  this.floatColour=!!gl.getExtension('EXT_color_buffer_float');
  /* A 1x1 white texture for the sampler to point at when the pass did
     not run. Binding null instead left unit 3 incomplete, and an
     incomplete texture on a sampled unit makes the whole draw invalid in
     WebGL2 — the world pass rendered nothing at all and the frame came
     back as the clear colour. AO_ON already tells the shader to ignore
     the value; the unit still has to hold something. */
  this.blankAo=gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D,this.blankAo);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,1,1,0,gl.RED,gl.FLOAT,new Float32Array([1]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  this.gbufProgram=program(gl,GV,GF);
  this.aoProgram=program(gl,AV,AF);
  this.GP=gl.getUniformLocation(this.gbufProgram,'P');this.GV_=gl.getUniformLocation(this.gbufProgram,'V');this.GM=gl.getUniformLocation(this.gbufProgram,'M');
  this.GBUF=gl.getUniformLocation(this.aoProgram,'GBUF');this.K=gl.getUniformLocation(this.aoProgram,'K');this.DIM=gl.getUniformLocation(this.aoProgram,'DIM');this.KEY_DIR=gl.getUniformLocation(this.program,'KEY_DIR');this.KEY_COL=gl.getUniformLocation(this.program,'KEY_COL');this.KEY_I=gl.getUniformLocation(this.program,'KEY_I');this.PL_POS=gl.getUniformLocation(this.program,'PL_POS');this.PL_COL=gl.getUniformLocation(this.program,'PL_COL');this.PL_I=gl.getUniformLocation(this.program,'PL_I');this.PL_R=gl.getUniformLocation(this.program,'PL_R');this.PL_N=gl.getUniformLocation(this.program,'PL_N');this.MET=gl.getUniformLocation(this.program,'MET');this.ROUGH=gl.getUniformLocation(this.program,'ROUGH');this.OPAC=gl.getUniformLocation(this.program,'OPAC');this.TRANS=gl.getUniformLocation(this.program,'TRANS');this.HT=gl.getUniformLocation(this.program,'HT');this.TS=gl.getUniformLocation(this.program,'TS');this.TEX=gl.getUniformLocation(this.program,'TEX');this.LVP=gl.getUniformLocation(this.program,'LVP');this.SHADOW=gl.getUniformLocation(this.program,'SHADOW');this.SHADOW_MAP=gl.getUniformLocation(this.program,'SHADOW_MAP');
  this.shadowProgram=program(gl,SV,SF);this.SLVP=gl.getUniformLocation(this.shadowProgram,'LVP');this.SM=gl.getUniformLocation(this.shadowProgram,'M');
  this.volProgram=program(gl,VV,VF);this.compositeProgram=program(gl,CV,CF);
  this.particleProgram=program(gl,PV,PF);
  this.PP=gl.getUniformLocation(this.particleProgram,'PP');this.PVIEW=gl.getUniformLocation(this.particleProgram,'PVIEW');this.PORIGIN=gl.getUniformLocation(this.particleProgram,'PORIGIN');this.PCOLOUR=gl.getUniformLocation(this.particleProgram,'PCOLOUR');this.PSHAPE=gl.getUniformLocation(this.particleProgram,'PSHAPE');this.PCOUNTS=gl.getUniformLocation(this.particleProgram,'PCOUNTS');this.PRIGHT=gl.getUniformLocation(this.particleProgram,'PRIGHT');this.PUP=gl.getUniformLocation(this.particleProgram,'PUP');
  this.shadowNearest=gl.createSampler()??undefined;
  if(this.shadowNearest){
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.samplerParameteri(this.shadowNearest,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  this.VINV=gl.getUniformLocation(this.volProgram,'INV_VP');this.VLVP=gl.getUniformLocation(this.volProgram,'VLVP');this.VSHADOW=gl.getUniformLocation(this.volProgram,'VSHADOW');this.VPARAMS=gl.getUniformLocation(this.volProgram,'VPARAMS');this.VDIMS=gl.getUniformLocation(this.volProgram,'VDIMS');this.VEYE=gl.getUniformLocation(this.volProgram,'VEYE');this.VLDIR=gl.getUniformLocation(this.volProgram,'VLIGHT_DIR');this.VLCOL=gl.getUniformLocation(this.volProgram,'VLIGHT_COL');this.VLI=gl.getUniformLocation(this.volProgram,'VLIGHT_I');this.VFWD=gl.getUniformLocation(this.volProgram,'VFORWARD');this.VGBUF=gl.getUniformLocation(this.volProgram,'VGBUF');this.VSMAP=gl.getUniformLocation(this.volProgram,'VSHADOW_MAP');this.CSRC=gl.getUniformLocation(this.compositeProgram,'SRC');this.depthReadProgram=program(gl,CV,DF);this.DSRC=gl.getUniformLocation(this.depthReadProgram,'SRC');
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
   const half=Math.max(1,Math.floor(this.width/2));
   /* The eye offset is the SHARED core's, not this backend's. It was a
      local re-derivation of berxEyeCamera — the same formula written
      twice — which is exactly the drift the one-math rule exists to
      prevent: WebGPU already called the shared function, so the two web
      backends could have disagreed about where an eye is without any
      test noticing. */
   const shift=(sign:-1|1)=>({...frame,camera:berxEyeCamera(frame.camera,options.stereo!.ipd,sign)});
   /* the clear covers the whole surface once; each eye then owns half */
   gl.viewport(0,0,this.width,this.height);
   gl.clearColor(BERX_WORLD_CLEAR[0],BERX_WORLD_CLEAR[1],BERX_WORLD_CLEAR[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   let calls=0,tris=0,lod=0,frustum=0,budget=0,visibleCount=0;
   for(const [index,eye] of [shift(-1),shift(1)].entries()){
    this.drawEye(eye,options,half,this.height,false,index*half);
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

 /**
 * Draw one eye into a viewport starting at `originX`.
 *
 * REAL BUG THIS FIXES: this used to set `gl.viewport(0,0,width,height)`
 * unconditionally, which threw away the x offset the stereo loop had
 * just set — so BOTH eyes drew into the left half and the right half of
 * a stereo frame was empty. It cannot simply leave the viewport alone
 * either, because renderShadowMap below re-points it at the shadow map;
 * the origin has to travel with the call.
 */
 /**
  * The G-buffer and the occlusion computed from it.
  *
  * Runs before the world pass because the world pass reads the AO map.
  * Returns false when it could not run at all — without
  * EXT_color_buffer_float there is no float colour attachment to write a
  * view depth into, and an occlusion pass that silently wrote nothing
  * would leave the world lit by whatever the map last held.
  */
 private renderSSAO(list:ReturnType<typeof berxBuildDrawList>,width:number,height:number):boolean{
  if(!this.floatColour) return false;
  const gl=this.gl;
  if(this.ssaoSize.w!==width||this.ssaoSize.h!==height){
   if(this.gbufTexture)gl.deleteTexture(this.gbufTexture);
   if(this.gbufDepth)gl.deleteRenderbuffer(this.gbufDepth);
   if(this.gbufFbo)gl.deleteFramebuffer(this.gbufFbo);
   if(this.aoTexture)gl.deleteTexture(this.aoTexture);
   if(this.aoFbo)gl.deleteFramebuffer(this.aoFbo);
   /* Not multisampled, deliberately: the occlusion pass reads this per
      pixel, and a resolve would average normals — an averaged normal is
      a surface facing a direction nothing faces. */
   this.gbufTexture=gl.createTexture()!;
   gl.bindTexture(gl.TEXTURE_2D,this.gbufTexture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,width,height,0,gl.RGBA,gl.FLOAT,null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   this.gbufDepth=gl.createRenderbuffer()!;
   gl.bindRenderbuffer(gl.RENDERBUFFER,this.gbufDepth);
   gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,width,height);
   this.gbufFbo=gl.createFramebuffer()!;
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.gbufFbo);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.gbufTexture,0);
   gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.gbufDepth);
   this.aoTexture=gl.createTexture()!;
   gl.bindTexture(gl.TEXTURE_2D,this.aoTexture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,width,height,0,gl.RED,gl.FLOAT,null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   this.aoFbo=gl.createFramebuffer()!;
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.aoFbo);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.aoTexture,0);
   if(!this.aoVao) this.aoVao=gl.createVertexArray()!;
   this.ssaoSize={w:width,h:height};
  }
  /* ---- the G-buffer ---- */
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.gbufFbo!);
  gl.viewport(0,0,width,height);
  /* depth 0 means "nothing drawn here", which is what the AO pass tests */
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  /* The G-buffer wants no blending — it writes a normal and a depth, and
     averaging those with what is behind them is meaningless. Blending is
     turned back on before returning: this renderer enables it ONCE in the
     constructor and every later pass relies on that global state, so a
     pass that leaves it off renders the translucent floor opaque. That is
     what happened — turning the occlusion pass on made the frame BRIGHTER,
     which is not something ambient occlusion can do. */
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);
  gl.useProgram(this.gbufProgram);
  gl.uniformMatrix4fv(this.GP,false,new Float32Array(list.projection));
  gl.uniformMatrix4fv(this.GV_,false,new Float32Array(list.view));
  /* Everything visible goes in, glass included: a shadow asks whether a
     surface blocks light, occlusion asks what a point can see, and a
     surface you can see through is still in the way. */
  for(const item of list.items){
   const mesh=this.getMesh(item.primitive as never,item.lod);
   gl.uniformMatrix4fv(this.GM,false,new Float32Array(item.model));
   gl.bindVertexArray(mesh.vao);
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  /* ---- the occlusion ---- */
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.aoFbo!);
  gl.viewport(0,0,width,height);
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
  gl.useProgram(this.aoProgram);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.gbufTexture!);gl.uniform1i(this.GBUF,2);
  /* The kernel the CORE chose for this tier — a stride through the full
     spiral when a device cannot afford all sixteen taps. */
  gl.uniform4fv(this.K,new Float32Array(berxSSAOUniform(undefined,list.ssaoSamples)));
  /* Focal length in pixels, off the projection the core built — never
     re-derived from a field of view, which could disagree with it. */
  gl.uniform4f(this.DIM,width,height,list.projection[5]*height*0.5,list.ssaoSamples);
  gl.bindVertexArray(this.aoVao!);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindVertexArray(null);
  /* back to the SCENE target, not the screen: post is what reaches the
     screen now, and a pass that restored the default framebuffer would
     send the rest of the frame straight past the tone-map. */
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.sceneFbo);
  /* leave GL exactly as this pass found it */
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.enable(gl.BLEND);
  gl.activeTexture(gl.TEXTURE0);
  return true;
 }

 /**
  * The air with something in it.
  *
  * Three fields, drawn after the world so the depth buffer already holds
  * everything solid: a mote behind a place is hidden by it. Depth WRITES
  * are off — particles never occlude each other into flicker — and the
  * blend is additive, because a mote is light rather than a surface.
  *
  * Where each field sits is a fact about the world, not a setting: dust
  * and stars are arranged around the VIEWER (they are the room and the
  * distance), and energy around whatever the world says is most alive
  * (list.items carries the energy the server raised). A world with
  * nothing live draws no energy particles at all, which is what keeps
  * BERX Energy rare by construction rather than by promise.
  */
 private renderParticles(list:ReturnType<typeof berxBuildDrawList>):number{
  const gl=this.gl;
  if(!this.particleVao)this.particleVao=gl.createVertexArray()??undefined;
  if(!this.particleVao||!list.basis||list.particles.length===0)return 0;
  gl.useProgram(this.particleProgram);
  gl.bindVertexArray(this.particleVao);
  gl.uniformMatrix4fv(this.PP,false,new Float32Array(list.projection));
  gl.uniformMatrix4fv(this.PVIEW,false,new Float32Array(list.view));
  gl.uniform3f(this.PRIGHT,list.basis.right.x,list.basis.right.y,list.basis.right.z);
  gl.uniform3f(this.PUP,list.basis.up.x,list.basis.up.y,list.basis.up.z);
  gl.depthMask(false);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
  let calls=0;
  /* Every field the core put in the list, including where it sits.
     Nothing about a field is decided here: which kinds exist, how many
     particles each has and what it is arranged around are all readings
     of the world, and three backends reading the world separately is
     three worlds. */
  for(const field of list.particles){
   gl.uniform4f(this.PORIGIN,field[12],field[13],field[14],list.worldTime);
   gl.uniform4f(this.PCOLOUR,field[0],field[1],field[2],field[3]);
   gl.uniform4f(this.PSHAPE,field[4],field[5],field[6],field[7]);
   gl.uniform4f(this.PCOUNTS,field[8],field[9],0,0);
   gl.drawArrays(gl.TRIANGLES,0,field[8]*6);
   calls++;
  }
  gl.bindVertexArray(null);
  /* leave GL as this pass found it — see the note in renderVolumetric */
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(true);
  return calls;
 }

 /**
  * The key light, made visible in the air.
  *
  * Runs AFTER the world pass and composites additively: light in the air
  * ADDS to what is behind it — it does not replace it, and a volumetric
  * pass that blends over the world is a fog overlay, not scattering.
  *
  * It needs the G-buffer the occlusion pass already builds (for the
  * distance to the first surface along each ray) and the shadow map the
  * world pass already builds (for which parts of the ray are lit). Both
  * are reused rather than rebuilt: a second G-buffer would be a second
  * opinion about where the surfaces are.
  *
  * Returns false when it could not run, so the caller can say so rather
  * than show a frame that quietly has no shafts in it.
  */
 private renderVolumetric(list:ReturnType<typeof berxBuildDrawList>,width:number,height:number):boolean{
  if(!this.floatColour||!list.shadow||!this.shadowTexture||!this.gbufTexture)return false;
  const gl=this.gl;
  /* The march may run at a fraction of the frame — see volumetric.wgsl,
     which this is the GLSL port of. The scale and the step count both
     arrive in the draw list, decided by the quality tier, because a
     backend picking its own would be a second opinion about what the
     world looks like. */
  const scale=Math.max(1,Math.round(list.volumetric[5]||1));
  const marchW=Math.max(1,Math.ceil(width/scale));
  const marchH=Math.max(1,Math.ceil(height/scale));
  if(this.volSize.w!==marchW||this.volSize.h!==marchH){
   if(this.volTexture)gl.deleteTexture(this.volTexture);
   if(this.volFbo)gl.deleteFramebuffer(this.volFbo);
   this.volTexture=gl.createTexture()!;
   gl.bindTexture(gl.TEXTURE_2D,this.volTexture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,marchW,marchH,0,gl.RGBA,gl.FLOAT,null);
   /* NEAREST, and it stays NEAREST: a 32-bit float texture is not
      filterable in WebGL2 without EXT_color_buffer_float's filtering
      companion, and the composite does its own bilinear tap instead —
      the same four loads and three mixes composite.wgsl does, so the two
      backends upsample identically rather than one of them getting
      hardware filtering the other cannot have. */
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   this.volFbo=gl.createFramebuffer()!;
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.volFbo);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.volTexture,0);
   this.volSize={w:marchW,h:marchH};
  }

  /* ---- the march, into its own float target ---- */
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.volFbo!);
  gl.viewport(0,0,marchW,marchH);
  gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);
  gl.useProgram(this.volProgram);
  const viewProj=berxMultiplyMat4(new Float32Array(list.projection),new Float32Array(list.view));
  gl.uniformMatrix4fv(this.VINV,false,berxInvertMat4(viewProj));
  gl.uniformMatrix4fv(this.VLVP,false,new Float32Array(list.shadow.viewProjection));
  gl.uniform4f(this.VSHADOW,1/list.shadow.mapSize,list.shadow.depthBias,0,list.shadow.strength);
  /* Density, phase, reach and intensity out of the LIST, not the
     module's constants: the native backend already read them from there,
     and two backends reading two sources is how they drift. */
  gl.uniform4f(this.VPARAMS,list.volumetric[0],list.volumetric[1],list.volumetric[2],list.volumetric[3]);
  gl.uniform4f(this.VDIMS,marchW,marchH,list.volumetric[4],scale);
  gl.uniform3f(this.VEYE,list.camera.x,list.camera.y,list.camera.z);
  gl.uniform3f(this.VLDIR,list.key.direction.x,list.key.direction.y,list.key.direction.z);
  gl.uniform3f(this.VLCOL,list.key.colour[0],list.key.colour[1],list.key.colour[2]);
  gl.uniform1f(this.VLI,list.key.intensity);
  /* the camera's forward, straight off the view matrix the core built —
     never re-derived from a target, which could disagree with it */
  gl.uniform3f(this.VFWD,-list.view[2],-list.view[6],-list.view[10]);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.gbufTexture!);gl.uniform1i(this.VGBUF,2);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture!);gl.uniform1i(this.VSMAP,1);
  if(this.shadowNearest)gl.bindSampler(1,this.shadowNearest);
  gl.bindVertexArray(this.aoVao!);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindVertexArray(null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.sceneFbo);

  /* Leave GL exactly as this pass found it. The renderer enables these
     ONCE in its constructor and every other pass relies on that global
     state, so a pass that leaves any of them off is a pass that changes
     a later one.
     
     gl.enable(BLEND) is the line that matters and it was missing. The
     march turns blending off — it writes a computed quantity into its own
     float target, and averaging that with what was there is meaningless —
     and never turned it back on. That was invisible while the composite
     ran immediately afterwards and re-enabled it, and became a real defect
     the moment the march moved to where the declared pipeline puts it,
     BEFORE the world pass: the world then drew its translucent floor
     opaque. It showed up as the air appearing to add a different amount
     of light on this backend than on WebGPU — a systematic 0.91/255 across
     the whole frame — while the in-scatter buffer the march produced was
     bit-identical in both positions. That measurement is what found it;
     no amount of reading the march could have, because the march was
     never wrong. */
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  /* a sampler object left bound to a unit outrides the texture's own
     parameters for every later pass on that unit — the world pass would
     silently lose its soft shadow edge */
  gl.bindSampler(1,null);
  gl.activeTexture(gl.TEXTURE0);
  return true;
 }

 /**
  * The air, added over the world.
  *
  * Split from the march above rather than done at the end of it, and the
  * split is the point: the march has to happen BEFORE the world pass —
  * that is where the declared pipeline puts it, and where WebGPU has
  * always had it — while the composite has to happen after, because it
  * adds to what the world pass drew. One function doing both put this
  * backend's march after the world, which worked (it renders into its
  * own target and samples nothing the world pass writes) and was still a
  * different pipeline from the other two. The pipeline gate reads the
  * pass names each backend records, and that is how it was found.
  */
 /**
  * The linear frame BERX draws into, built to fit the canvas.
  *
  * MULTISAMPLED, because moving off the default framebuffer would
  * otherwise silently drop the antialiasing the canvas was created
  * with — and the WebGPU backend keeps its four samples, so the two
  * would stop being comparable. A multisample renderbuffer plus a blit
  * is the WebGL2 spelling of WebGPU's resolveTarget.
  *
  * Returns false where a half-float colour attachment is not
  * renderable. That is reported rather than worked around: the
  * exposure still runs on an 8-bit frame and still fixes the darkness,
  * but the world pass will have clamped at 1.0 first, so the shoulder
  * has nothing above white left to roll off. Saying which of the two is
  * happening is the difference between a known limit and a mystery.
  */
 private ensureHdr(width:number,height:number):boolean{
  if(!this.floatColour)return false;
  const gl=this.gl;
  if(this.hdrFbo&&this.hdrW===width&&this.hdrH===height)return true;
  this.releaseHdr();
  this.hdrW=width;this.hdrH=height;
  this.hdrTex=gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D,this.hdrTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,width,height,0,gl.RGBA,gl.HALF_FLOAT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.hdrFbo=gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.hdrFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.hdrTex,0);
  /* WHATEVER THE CANVAS ITSELF WAS GIVING.
     The context was created with antialias:true and the driver chose a
     sample count for the default framebuffer. Moving the world into an
     FBO with a DIFFERENT count changes every silhouette edge in the
     frame — it showed up as a one-pixel teal rim that WebGL2 drew and
     the other two backends did not, on the boundary of a lit object.
     Reading the count back and matching it keeps the antialiasing the
     canvas was already doing, rather than substituting another. */
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const canvasSamples=gl.getParameter(gl.SAMPLES) as number;
  this.hdrSamples=Math.max(1,Math.min(canvasSamples||4,gl.getParameter(gl.MAX_SAMPLES) as number));
  this.msColor=gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER,this.msColor);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER,this.hdrSamples,gl.RGBA16F,width,height);
  this.msDepth=gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER,this.msDepth);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER,this.hdrSamples,gl.DEPTH_COMPONENT24,width,height);
  this.msFbo=gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.msFbo);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,this.msColor);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.msDepth);
  const complete=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.bindRenderbuffer(gl.RENDERBUFFER,null);
  if(!complete){this.releaseHdr();return false;}
  if(!this.postProgram){
   this.postProgram=program(gl,CV,POSTF);
   this.PSRC=gl.getUniformLocation(this.postProgram,'SRC');
   this.PEXP=gl.getUniformLocation(this.postProgram,'EXPOSURE');
  }
  return true;
 }

 private releaseHdr():void{
  const gl=this.gl;
  if(this.hdrTex)gl.deleteTexture(this.hdrTex);
  if(this.hdrFbo)gl.deleteFramebuffer(this.hdrFbo);
  if(this.msFbo)gl.deleteFramebuffer(this.msFbo);
  if(this.msColor)gl.deleteRenderbuffer(this.msColor);
  if(this.msDepth)gl.deleteRenderbuffer(this.msDepth);
  this.hdrTex=undefined;this.hdrFbo=undefined;this.msFbo=undefined;
  this.msColor=undefined;this.msDepth=undefined;this.hdrW=0;this.hdrH=0;this.hdrSamples=0;
 }

 /**
  * POST: resolve the samples, expose, and hand the screen the result.
  *
  * AFTER the composite, which is the ordering fact that matters:
  * in-scatter is light, so the air is part of what is being exposed.
  * Tone-mapping the surfaces and then adding the air would put unmapped
  * values on top of mapped ones — two pictures added together, not a
  * brighter one.
  */
 private exposeToScreen(originX:number,width:number,height:number):boolean{
  if(!this.msFbo||!this.hdrFbo||!this.postProgram)return false;
  const gl=this.gl;
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,this.msFbo);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,this.hdrFbo);
  gl.blitFramebuffer(0,0,this.hdrW,this.hdrH,0,0,this.hdrW,this.hdrH,gl.COLOR_BUFFER_BIT,gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  this.sceneFbo=null;
  gl.viewport(originX,0,width,height);
  gl.useProgram(this.postProgram);
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,this.hdrTex!);gl.uniform1i(this.PSRC,3);
  /* the shared core's number, so three backends cannot expose differently */
  gl.uniform1f(this.PEXP,BERX_EXPOSURE);
  gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
  gl.bindVertexArray(this.aoVao!);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindVertexArray(null);
  /* back to the renderer's standing state — see the note in the march */
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  gl.activeTexture(gl.TEXTURE0);
  return true;
 }

 private compositeAir(originX:number,width:number,height:number):boolean{
  if(!this.volTexture)return false;
  const gl=this.gl;
  gl.viewport(originX,0,width,height);
  gl.useProgram(this.compositeProgram);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.volTexture);gl.uniform1i(this.CSRC,2);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
  gl.bindVertexArray(this.aoVao!);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindVertexArray(null);
  /* back to the renderer's standing state — see the note in the march */
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  gl.activeTexture(gl.TEXTURE0);
  return true;
 }

 /**
  * The shadow map's depth, as readable floats.
  *
  * WebGL2 cannot readPixels a depth texture, so this samples it as an
  * ordinary texture with the comparison mode temporarily off, into a
  * float target. The mode is put back: leaving it off would turn every
  * later sampler2DShadow read into undefined behaviour.
  *
  * It exists for the gate. The oracle has to perform the SAME lookup
  * the march performed, and a CPU twin that reconstructs visibility
  * from geometry instead would be testing a different question.
  */
 readShadowMap():{depth:Float32Array;size:number}|undefined{
  if(!this.shadowTexture||this.shadowSize===0||!this.floatColour)return undefined;
  const gl=this.gl;const size=this.shadowSize;
  const texture=gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,size,size,0,gl.RED,gl.FLOAT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const fbo=gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
  gl.viewport(0,0,size,size);
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);
  gl.useProgram(this.depthReadProgram);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.NONE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.uniform1i(this.DSRC,2);
  gl.bindVertexArray(this.aoVao!);
  gl.drawArrays(gl.TRIANGLES,0,3);
  const rgba=new Float32Array(size*size*4);
  gl.readPixels(0,0,size,size,gl.RGBA,gl.FLOAT,rgba);
  const depth=new Float32Array(size*size);
  for(let i=0;i<depth.length;i++)depth[i]=rgba[i*4];
  /* put the shadow texture back exactly as the world pass needs it */
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.bindVertexArray(null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.deleteFramebuffer(fbo);gl.deleteTexture(texture);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.enable(gl.BLEND);
  gl.activeTexture(gl.TEXTURE0);
  return {depth,size};
 }

 /**
  * The in-scatter buffer this backend produced, for verification.
  *
  * The gate runs the shared core's berxVolumetricAt over the same rays
  * and the same shadow map and compares. Reading the buffer rather than
  * the composited frame is what separates "the march is right" from
  * "the composite is right" — two different failures that look the same
  * on screen.
  */
 readVolumetricBuffer():{rgba:Float32Array;width:number;height:number}|undefined{
  if(!this.volTexture||this.volSize.w===0)return undefined;
  const gl=this.gl;const w=this.volSize.w,h=this.volSize.h;
  const rgba=new Float32Array(w*h*4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.volFbo!);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.FLOAT,rgba);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return {rgba,width:w,height:h};
 }

 /**
  * The G-buffer and the AO map this backend produced, for verification.
  *
  * The occlusion gate runs the shared core's berxSSAOAt over these exact
  * numbers, exactly as it does for WebGPU. Reading the inputs AND the
  * output is the only way to tell a wrong sign from a wrong formula.
  */
 readSSAOBuffers():{gbuffer:Float32Array;ao:Float32Array;width:number;height:number}|undefined{
  if(!this.gbufFbo||!this.aoFbo) return undefined;
  const gl=this.gl;const w=this.ssaoSize.w,h=this.ssaoSize.h;
  const gbuffer=new Float32Array(w*h*4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.gbufFbo);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.FLOAT,gbuffer);
  const ao=new Float32Array(w*h*4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.aoFbo);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.FLOAT,ao);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  /* R only: the AO map is r32float, and readPixels hands back RGBA */
  const red=new Float32Array(w*h);
  for(let i=0;i<w*h;i++) red[i]=ao[i*4];
  return {gbuffer,ao:red,width:w,height:h};
 }

 private drawEye(frame:Berx5DFrame,options:BerxSpatialRenderOptions,width:number,height:number,clear:boolean,originX=0){
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
   quality:options.quality,
   core:options.core,
   shadows:options.shadows,
   lighting:this.lighting,
   mediaFor:(id)=>this.media.get(id),
   affordances:this.affordances,
   /* What the last frame decided, so this one does not decide it again
      from scratch and come out differently. Carried by the RENDERER
      rather than by every caller: a runtime that draws continuously
      should not have to be told to be stable. */
   memory:options.stable===false?undefined:this.memory,
  });
  this.memory=list.memory;
  /* The light's own pass comes first: the main pass reads the depth it
     writes. Its camera is the shared core's (list.shadow), so this
     backend and the others put the light in exactly the same place. */
  const stages:string[]=[];
  if(list.shadow) stages.push('shadows');
  this.renderShadowMap(list);
  /* The occlusion pass reads the same list, so it runs here rather than
     in render(): a stereo frame computes it per eye, which is correct —
     the two eyes see different creases. */
  /* The volumetric march needs the G-buffer too — it is where the
     distance to the first surface along each ray comes from — so the
     pass runs whenever EITHER wants it, and only the AO map's use is
     gated by options.ssao. Building a second G-buffer for the second
     consumer would be a second opinion about where the surfaces are. */
  const wantsGbuffer=options.ssao!==false||options.volumetric!==false;
  const gbufferReady=wantsGbuffer?this.renderSSAO(list,width,height):false;
  if(gbufferReady){stages.push('gbuffer');if(options.ssao!==false)stages.push('ssao');}
  const aoReady=options.ssao===false?false:gbufferReady;
  const airReady=options.volumetric===false?false:this.renderVolumetric(list,width,height);
  if(airReady)stages.push('volumetric');
  /* Everything from here to post goes into the linear frame. Bound
     BEFORE the clear, or the clear would land on the screen and the
     scene would be drawn over an untouched one. */
  const exposed=this.ensureHdr(this.gl.drawingBufferWidth,this.gl.drawingBufferHeight);
  this.sceneFbo=exposed?this.msFbo!:null;
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.sceneFbo);
  gl.useProgram(this.program);
  stages.push('world');
  gl.viewport(originX,0,width,height);
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
  /* The room, read out of the shared core's packing rather than
     re-derived here. e[3] is the sun intensity, e[7] the sharpness and
     e[11] the overall intensity — see berxEnvironmentUniform. */
  const e=list.environment;
  gl.uniform4f(this.ENV_ZEN,e[0],e[1],e[2],e[3]);
  gl.uniform4f(this.ENV_HOR,e[4],e[5],e[6],e[7]);
  gl.uniform4f(this.ENV_GND,e[8],e[9],e[10],e[11]);
  gl.uniform3f(this.ENV_SUN_DIR,e[12],e[13],e[14]);
  gl.uniform3f(this.ENV_SUN,e[16],e[17],e[18]);
  /* Unit 3: unit 0 is media, 1 is the shadow map, 2 is the G-buffer.
     The active unit is put BACK to 0 afterwards, and that line is the
     whole point of this comment: the per-item loop below binds each
     object's media with a bare gl.bindTexture, which lands on whatever
     unit is active. Leaving it at 3 sent every media texture to the AO
     slot and left unit 0 holding a stale one — the frame still looked
     plausible, and the cross-renderer gate caught it as 26000 pixels of
     silhouette that WebGPU did not have. */
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,aoReady?this.aoTexture!:this.blankAo!);
  gl.uniform1i(this.AO_MAP,3);gl.uniform1f(this.AO_ON,aoReady?1:0);
  gl.activeTexture(gl.TEXTURE0);
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
  if(labelCalls>0)stages.push('labels');
  /* The air's CONTENTS before the light in it, and the order matters
     less than it looks: both are additive with no depth writes, so the
     sum is the same either way and no pixel could tell them apart. It is
     changed here anyway, because this backend had them the other way
     round from WebGPU and one declared pipeline means one order to
     verify — an ordering that only happens to be harmless is still an
     ordering nobody chose. */
  const particleCalls=options.particles===false?0:this.renderParticles(list);
  if(particleCalls>0)stages.push('particles');
  if(airReady&&this.compositeAir(originX,width,height))stages.push('composite');
  /* after everything: light in the air is in front of it all, and it
     adds to what is behind rather than covering it */
  if(exposed&&this.exposeToScreen(originX,width,height))stages.push('post');
  this.stats={
   visible:list.stats.visible,
   inFrustum:list.stats.inFrustum,
   drawCalls:drawCalls+labelCalls+particleCalls,
   triangles,
   lodReduced:list.stats.lodReduced,
   budgetCut:list.stats.budgetCut,
   residentTextures:this.textures.residentCount,
   residentLabels:this.labels.residentCount,
   meshVariants:this.meshes.size,
   stages,
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
   /* the focused action is brighter as well as larger: two signals, so
      it still reads where a size difference is hard to judge against
      nothing. The same two numbers as the WebGPU backend. */
   gl.uniform1f(this.LA,slot.focused?1:0.72);
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
