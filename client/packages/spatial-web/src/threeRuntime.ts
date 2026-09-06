import type { Berx5DFrame } from '@berx/spatial';

type Mat4 = Float32Array;

const VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vWorld;
void main(){
  vec4 world=uModel*vec4(aPosition,1.0);
  vWorld=world.xyz;
  vNormal=mat3(uModel)*aNormal;
  gl_Position=uProjection*uView*world;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
uniform vec3 uBase;
uniform vec3 uEmissive;
uniform float uEmissiveStrength;
uniform float uMetalness;
uniform float uRoughness;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  vec3 key=normalize(vec3(0.45,0.72,0.9));
  vec3 rim=normalize(vec3(-0.7,0.15,0.6));
  float ndl=max(dot(n,key),0.0);
  float rimLight=pow(1.0-max(dot(n,rim),0.0),2.2);
  float spec=pow(max(dot(reflect(-key,n),normalize(-vWorld)),0.0),mix(64.0,8.0,uRoughness));
  vec3 lit=uBase*(0.16+ndl*0.72)+uBase*spec*(0.12+uMetalness*0.42);
  lit+=uEmissive*uEmissiveStrength;
  lit+=vec3(0.79,0.71,0.54)*rimLight*0.08;
  outColor=vec4(lit,1.0);
}`;

function perspective(fovDeg:number, aspect:number, near:number, far:number):Mat4{
  const f=1/Math.tan(fovDeg*Math.PI/360), nf=1/(near-far), m=new Float32Array(16);
  m[0]=f/aspect; m[5]=f; m[10]=(far+near)*nf; m[11]=-1; m[14]=2*far*near*nf; return m;
}
function lookAt(px:number,py:number,pz:number,tx:number,ty:number,tz:number):Mat4{
  let zx=px-tx,zy=py-ty,zz=pz-tz; let zl=Math.hypot(zx,zy,zz)||1; zx/=zl;zy/=zl;zz/=zl;
  let xx=zy*0-zz*1,xy=zz*0-zx*0,xz=zx*1-zy*0; let xl=Math.hypot(xx,xy,xz)||1; xx/=xl;xy/=xl;xz/=xl;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx, m=new Float32Array(16);
  m[0]=xx;m[1]=yx;m[2]=zx;m[4]=xy;m[5]=yy;m[6]=zy;m[8]=xz;m[9]=yz;m[10]=zz;m[12]=-(xx*px+xy*py+xz*pz);m[13]=-(yx*px+yy*py+yz*pz);m[14]=-(zx*px+zy*py+zz*pz);m[15]=1; return m;
}
function model(x:number,y:number,z:number,sx:number,sy:number,sz:number,rx:number,ry:number,rz:number):Mat4{
  const cx=Math.cos(rx),sxr=Math.sin(rx),cy=Math.cos(ry),syr=Math.sin(ry),cz=Math.cos(rz),szr=Math.sin(rz),m=new Float32Array(16);
  m[0]=(cy*cz)*sx;m[1]=(cy*szr)*sx;m[2]=(-syr)*sx;
  m[4]=(sxr*syr*cz-cx*szr)*sy;m[5]=(sxr*syr*szr+cx*cz)*sy;m[6]=(sxr*cy)*sy;
  m[8]=(cx*syr*cz+sxr*szr)*sz;m[9]=(cx*syr*szr-sxr*cz)*sz;m[10]=(cx*cy)*sz;
  m[12]=x;m[13]=y;m[14]=z;m[15]=1; return m;
}

const CUBE = new Float32Array([
 -1,-1,1,0,0,1, 1,-1,1,0,0,1, 1,1,1,0,0,1, -1,1,1,0,0,1,
 -1,-1,-1,0,0,-1, -1,1,-1,0,0,-1, 1,1,-1,0,0,-1, 1,-1,-1,0,0,-1,
 -1,1,-1,0,1,0, -1,1,1,0,1,0, 1,1,1,0,1,0, 1,1,-1,0,1,0,
 -1,-1,-1,0,-1,0, 1,-1,-1,0,-1,0, 1,-1,1,0,-1,0, -1,-1,1,0,-1,0,
 1,-1,-1,1,0,0, 1,1,-1,1,0,0, 1,1,1,1,0,0, 1,-1,1,1,0,0,
 -1,-1,-1,-1,0,0, -1,-1,1,-1,0,0, -1,1,1,-1,0,0, -1,1,-1,-1,0,0
]);
const INDICES=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]);

function compile(gl:WebGL2RenderingContext,type:number,source:string):WebGLShader{
  const s=gl.createShader(type); if(!s) throw new Error('BERX 5D: shader allocation failed'); gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s)||'unknown shader error';gl.deleteShader(s);throw new Error(`BERX 5D shader: ${log}`);} return s;
}
function program(gl:WebGL2RenderingContext):WebGLProgram{
  const p=gl.createProgram();if(!p)throw new Error('BERX 5D: program allocation failed');gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,VERTEX));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const log=gl.getProgramInfoLog(p)||'unknown link error';gl.deleteProgram(p);throw new Error(`BERX 5D program: ${log}`);}return p;
}

export class BerxThreeRuntimeRenderer {
  private readonly gl:WebGL2RenderingContext; private readonly program:WebGLProgram; private readonly vao:WebGLVertexArrayObject; private readonly index:WebGLBuffer;
  private width=1;private height=1;
  constructor(canvas:HTMLCanvasElement){
    const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw new Error('BERX 5D requires WebGL2 on web');this.gl=gl;this.program=program(gl);
    const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ibo=gl.createBuffer();if(!vao||!vbo||!ibo)throw new Error('BERX 5D: GPU buffer allocation failed');this.vao=vao;this.index=ibo;
    gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,CUBE,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,INDICES,gl.STATIC_DRAW);gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
  }
  resize(width:number,height:number){this.width=Math.max(1,width);this.height=Math.max(1,height);this.gl.viewport(0,0,this.width,this.height);}
  sync(frame:Berx5DFrame){
    const gl=this.gl;gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.clearColor(0.027,0.031,0.039,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const c=frame.camera;const projection=perspective(c.fov,this.width/this.height,c.near,c.far);const view=lookAt(c.position.x,c.position.y,c.position.z,c.target.x,c.target.y,c.target.z);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program,'uProjection'),false,projection);gl.uniformMatrix4fv(gl.getUniformLocation(this.program,'uView'),false,view);
    for(const o of frame.world.objects){if(!o.visible)continue;const m=model(o.transform.position.x,o.transform.position.y,o.transform.position.z,o.transform.scale.x,o.transform.scale.y,o.transform.scale.z,o.transform.rotation.x,o.transform.rotation.y,o.transform.rotation.z);gl.uniformMatrix4fv(gl.getUniformLocation(this.program,'uModel'),false,m);
      const person=o.kind==='person';gl.uniform3f(gl.getUniformLocation(this.program,'uBase'),person?0.78:0.18,person?0.77:0.21,person?0.73:0.24);gl.uniform3f(gl.getUniformLocation(this.program,'uEmissive'),0.31,0.84,0.91);gl.uniform1f(gl.getUniformLocation(this.program,'uEmissiveStrength'),Math.min(1,o.energy)*0.035);gl.uniform1f(gl.getUniformLocation(this.program,'uMetalness'),o.material.metalness);gl.uniform1f(gl.getUniformLocation(this.program,'uRoughness'),o.material.roughness);gl.drawElements(gl.TRIANGLES,INDICES.length,gl.UNSIGNED_SHORT,0);
    }gl.bindVertexArray(null);
  }
  render(){/* sync performs a complete GPU frame; kept separate for host compatibility */}
  dispose(){const gl=this.gl;gl.deleteBuffer(this.index);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);}
}
