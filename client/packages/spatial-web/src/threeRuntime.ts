/**
 * BERX MAX 5D web GPU backend — semantic 3D geometry, a real
 * perspective projection, a real depth buffer and spatial picking.
 *
 * It declares what it actually does. `capabilities` says
 * physicallyLitMaterials, shadows and postProcessing are false,
 * because this backend has a single forward pass with one analytic key
 * light and no shadow map, no G-buffer and no post chain. Nothing here
 * is called PBR until it is one.
 */
import {
  pickSpatialObject,
  rayFromNdc,
  geometryForEntity,
  type Berx5DFrame,
  type BerxHit,
  type BerxSpatialRenderer,
  type BerxVec3,
} from '@berx/spatial';
import { presentationForKind } from '@berx/spatial/spatialPresentation';
import { createBox, createSphere, createRing, createFrame, type BerxPrimitiveMesh } from './primitiveGeometry';

type Mat4 = Float32Array; type Loc = WebGLUniformLocation | null;
const V = `#version 300 es\nprecision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 n;uniform mat4 P,V,M;out vec3 N,W;void main(){vec4 w=M*vec4(p,1.);W=w.xyz;N=mat3(M)*n;gl_Position=P*V*w;}`;
const F = `#version 300 es\nprecision highp float;in vec3 N,W;uniform vec3 B,E;uniform float ES,ME,R,O;out vec4 C;void main(){vec3 n=normalize(N),k=normalize(vec3(.45,.72,.9));float d=max(dot(n,k),0.),s=pow(max(dot(reflect(-k,n),normalize(-W)),0.),mix(64.,8.,R));vec3 lit=B*(.16+d*.72)+B*s*(.12+ME*.42)+E*ES;C=vec4(lit,clamp(O,.02,1.));}`;
function shader(gl: WebGL2RenderingContext, t: number, s: string) { const x=gl.createShader(t); if(!x) throw Error('BERX 5D shader allocation failed'); gl.shaderSource(x,s); gl.compileShader(x); if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(x)||'shader error';gl.deleteShader(x);throw Error(e);}return x; }
function program(gl: WebGL2RenderingContext) { const p=gl.createProgram();if(!p)throw Error('BERX 5D program allocation failed');const a=shader(gl,gl.VERTEX_SHADER,V),b=shader(gl,gl.FRAGMENT_SHADER,F);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p)||'program link error';gl.deleteProgram(p);throw Error(e);}return p; }
function perspective(f:number,a:number,n:number,z:number):Mat4 { const q=1/Math.tan(f*Math.PI/360),nf=1/(n-z),m=new Float32Array(16);m[0]=q/a;m[5]=q;m[10]=(z+n)*nf;m[11]=-1;m[14]=2*z*n*nf;return m; }
/* the view matrix needs these; the picking ray does not build its own
   any more — that lives in @berx/spatial with the hit test it feeds */
function cross(a:BerxVec3,b:BerxVec3):BerxVec3{return{x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};}
function norm(v:BerxVec3):BerxVec3{const l=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/l,y:v.y/l,z:v.z/l};}
function sub(a:BerxVec3,b:BerxVec3):BerxVec3{return{x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}
function lookAt(p:BerxVec3,t:BerxVec3):Mat4 { const z=norm(sub(p,t));let up:BerxVec3={x:0,y:1,z:0};if(Math.abs(z.y)>.98)up={x:1,y:0,z:0};const x=norm(cross(up,z)),y=cross(z,x),m=new Float32Array(16);m[0]=x.x;m[1]=y.x;m[2]=z.x;m[4]=x.y;m[5]=y.y;m[6]=z.y;m[8]=x.z;m[9]=y.z;m[10]=z.z;m[12]=-x.x*p.x-x.y*p.y-x.z*p.z;m[13]=-y.x*p.x-y.y*p.y-y.z*p.z;m[14]=-z.x*p.x-z.y*p.y-z.z*p.z;m[15]=1;return m; }
function model(p:BerxVec3,s:BerxVec3,r:{x:number;y:number;z:number}):Mat4 { const cx=Math.cos(r.x),sx=Math.sin(r.x),cy=Math.cos(r.y),sy=Math.sin(r.y),cz=Math.cos(r.z),sz=Math.sin(r.z),m=new Float32Array(16);m[0]=cy*cz*s.x;m[1]=cy*sz*s.x;m[2]=-sy*s.x;m[4]=(sx*sy*cz-cx*sz)*s.y;m[5]=(sx*sy*sz+cx*cz)*s.y;m[6]=sx*cy*s.y;m[8]=(cx*sy*cz+sx*sz)*s.z;m[9]=(cx*sy*sz-sx*cz)*s.z;m[10]=cx*cy*s.z;m[12]=p.x;m[13]=p.y;m[14]=p.z;m[15]=1;return m; }
interface GpuMesh{vao:WebGLVertexArrayObject;vbo:WebGLBuffer;ibo:WebGLBuffer;count:number;}
function gpuMesh(gl:WebGL2RenderingContext,mesh:BerxPrimitiveMesh):GpuMesh { const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ibo=gl.createBuffer();if(!vao||!vbo||!ibo)throw Error('BERX 5D mesh allocation failed');gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);return{vao,vbo,ibo,count:mesh.indices.length}; }
function meshFor(kind:ReturnType<typeof geometryForEntity>['kind']):BerxPrimitiveMesh { switch(kind){case'orb':return createSphere(.5,24,16);case'ring':return createRing(.62,.42,48);case'frame':return createFrame(1,1,.12);case'surface':return createBox(1,1,.06);case'portal':return createFrame(1,1.2,.16);case'node':return createSphere(.58,20,12);case'stack':return createBox(1,1,.32);case'message':return createBox(1,.46,.12);case'create':return createSphere(.58,28,18);} }
export interface BerxSpatialRenderOptions { maxObjects?:number; ambientMotion?:boolean; }
export class BerxThreeRuntimeRenderer implements BerxSpatialRenderer {
 readonly kind='webgl2' as const;
 /* what this backend really does, and nothing it does not */
 readonly capabilities={perspective:true,depthBuffer:true,physicallyLitMaterials:false,shadows:false,postProcessing:false} as const;
 private readonly gl:WebGL2RenderingContext;private readonly program:WebGLProgram;private readonly meshes=new Map<string,GpuMesh>();private readonly P:Loc;private readonly V:Loc;private readonly M:Loc;private readonly B:Loc;private readonly E:Loc;private readonly ES:Loc;private readonly ME:Loc;private readonly R:Loc;private readonly O:Loc;private width=1;private height=1;
 constructor(canvas:HTMLCanvasElement){const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw Error('BERX 5D requires WebGL2');this.gl=gl;this.program=program(gl);this.P=gl.getUniformLocation(this.program,'P');this.V=gl.getUniformLocation(this.program,'V');this.M=gl.getUniformLocation(this.program,'M');this.B=gl.getUniformLocation(this.program,'B');this.E=gl.getUniformLocation(this.program,'E');this.ES=gl.getUniformLocation(this.program,'ES');this.ME=gl.getUniformLocation(this.program,'ME');this.R=gl.getUniformLocation(this.program,'R');this.O=gl.getUniformLocation(this.program,'O');gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
 resize(w:number,h:number){this.width=Math.max(1,w);this.height=Math.max(1,h);this.gl.viewport(0,0,this.width,this.height);}
 private getMesh(kind:ReturnType<typeof geometryForEntity>['kind']){let m=this.meshes.get(kind);if(!m){m=gpuMesh(this.gl,meshFor(kind));this.meshes.set(kind,m);}return m;}
 render(frame:Berx5DFrame,options:BerxSpatialRenderOptions={}){const gl=this.gl,c=frame.camera,max=Math.max(1,Math.floor(options.maxObjects??frame.world.objects.length));gl.useProgram(this.program);gl.clearColor(.027,.031,.039,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(this.P,false,perspective(c.fov,this.width/this.height,c.near,c.far));gl.uniformMatrix4fv(this.V,false,lookAt(c.position,c.target));const visible=frame.world.objects.filter(o=>o.visible);const focused=frame.world.activeObjectId;
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
  for(const o of ordered.slice(0,max)){const spec=geometryForEntity(o.kind),presentation=presentationForKind(o.kind,o),mesh=this.getMesh(spec.kind);gl.bindVertexArray(mesh.vao);gl.uniformMatrix4fv(this.M,false,model(o.transform.position,o.transform.scale,o.transform.rotation));gl.uniform3f(this.B,...presentation.base);gl.uniform3f(this.E,...presentation.emissive);gl.uniform1f(this.ES,options.ambientMotion===false?0.85:1);gl.uniform1f(this.ME,o.material.metalness);gl.uniform1f(this.R,o.material.roughness);gl.uniform1f(this.O,o.material.opacity);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}gl.bindVertexArray(null);}
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
 dispose(){const gl=this.gl;this.releaseMeshes();gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
 private releaseMeshes(){const gl=this.gl;for(const m of this.meshes.values()){gl.deleteBuffer(m.vbo);gl.deleteBuffer(m.ibo);gl.deleteVertexArray(m.vao);}this.meshes.clear();}
 /**
  * A lost context invalidates every name this renderer holds. The map
  * is cleared so the next frame rebuilds its meshes instead of binding
  * handles the driver no longer knows; deleting them here would be
  * calling into a dead context.
  */
 handleContextLost(){this.meshes.clear();}
}
