/** BERX 5D GPU primitive catalogue. CPU-built, deterministic geometry; no fake 2D proxy. */
export interface BerxPrimitiveMesh { vertices: Float32Array; indices: Uint16Array; }

const push=(a:number[],x:number,y:number,z:number,nx:number,ny:number,nz:number)=>{a.push(x,y,z,nx,ny,nz);};

export function createBox(width=1,height=1,depth=1):BerxPrimitiveMesh{
  const x=width/2,y=height/2,z=depth/2;
  const v:number[]=[];
  const faces:number[][]=[
    [-x,-y,z,x,-y,z,x,y,z,-x,y,z,0,0,1], [x,-y,-z,-x,-y,-z,-x,y,-z,x,y,-z,0,0,-1],
    [-x,y,z,x,y,z,x,y,-z,-x,y,-z,0,1,0], [-x,-y,-z,x,-y,-z,x,-y,z,-x,-y,z,0,-1,0],
    [x,-y,z,x,-y,-z,x,y,-z,x,y,z,1,0,0], [-x,-y,-z,-x,-y,z,-x,y,z,-x,y,-z,-1,0,0]
  ];
  for(const f of faces){for(let i=0;i<4;i++)push(v,f[i*3],f[i*3+1],f[i*3+2],f[12],f[13],f[14]);}
  const q:number[]=[];for(let i=0;i<6;i++){const o=i*4;q.push(o,o+1,o+2,o,o+2,o+3);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

export function createSphere(radius=1,segments=24,rings=16):BerxPrimitiveMesh{
  const v:number[]=[];const q:number[]=[];
  for(let y=0;y<=rings;y++){const py=y/rings*Math.PI;const sy=Math.cos(py),sr=Math.sin(py);for(let x=0;x<=segments;x++){const a=x/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);push(v,radius*sr*c,radius*sy,radius*sr*s,sr*c,sy,sr*s);}}
  for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){const a=y*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;q.push(a,c,b,b,c,d);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

export function createRing(outer=1,inner=.72,segments=48):BerxPrimitiveMesh{
  const v:number[]=[];const q:number[]=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);push(v,outer*c,0,outer*s,c,0,s);push(v,inner*c,0,inner*s,-c,0,-s);}
  for(let i=0;i<segments;i++){const n=(i+1)%segments,a=i*2,b=a+1,c=n*2,d=c+1;q.push(a,c,b,b,c,d);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

export function createFrame(width=1,height=1,bar=.12):BerxPrimitiveMesh{
  const parts=[createBox(width,bar,.12),createBox(width,bar,.12),createBox(bar,height,.12),createBox(bar,height,.12)];
  const v:number[]=[];const q:number[]=[];const poses=[[0,height/2,0],[0,-height/2,0],[-width/2,0,0],[width/2,0,0]];
  for(let p=0;p<parts.length;p++){const m=parts[p],base=v.length/6,[ox,oy,oz]=poses[p];for(let i=0;i<m.vertices.length;i+=6)push(v,m.vertices[i]+ox,m.vertices[i+1]+oy,m.vertices[i+2]+oz,m.vertices[i+3],m.vertices[i+4],m.vertices[i+5]);for(const idx of m.indices)q.push(base+idx);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}
