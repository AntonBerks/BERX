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

/**
 * A box with its silhouette CHAMFERED — and the chamfer is the whole
 * reason this exists.
 *
 * BERX's environment is its own background: the sky is #07080A at the
 * horizon, which is the clear colour. So a diffuse surface lit only by
 * the room is `sky x albedo`, and albedo is below one — which means an
 * environment-lit face is ALWAYS darker than the space around it, by
 * construction. Measured on the real product: a collection's face
 * rendered at exactly (7, 8, 10), the clear colour to the last bit,
 * with no variation anywhere across it and a hard step at its edge. A
 * hole in the room rather than an object in it.
 *
 * Curved things do not have this problem, and looking at why gives the
 * fix. A sphere presents every angle including grazing ones, and at
 * grazing angles Fresnel lifts the specular environment term — which is
 * what draws the bright rim that separates a dark object from a dark
 * background. A flat card has no grazing angle anywhere, so it never
 * catches that rim, and no amount of light will give it one.
 *
 * A chamfer gives it one. The band around the silhouette is angled, so
 * it catches the room exactly where the eye needs an edge — and it is
 * geometry rather than an outline shader, a glow or a second light, so
 * it behaves correctly from every angle and in every backend for free.
 *
 * The bevel was in the geometry spec all along — `stack` declares 0.1,
 * `message` 0.16 — and no mesh builder in any of the three backends
 * ever read it. Every flat-faced kind was a hard-edged box.
 */
export function createBevelBox(width=1,height=1,depth=1,bevel=0):BerxPrimitiveMesh{
  /* Clamped so a bevel can never eat the face it is supposed to edge. */
  const b=Math.max(0,Math.min(bevel,Math.min(width,height)*.4,depth*.5));
  if(b<=0) return createBox(width,height,depth);
  const x=width/2,y=height/2,z=depth/2;
  const ix=x-b,iy=y-b,iz=z-b;
  const v:number[]=[];const q:number[]=[];
  const quad=(ax:number,ay:number,az:number,bx:number,by:number,bz:number,cx:number,cy:number,cz:number,dx:number,dy:number,dz:number,nx:number,ny:number,nz:number)=>{
    const o=v.length/6;
    push(v,ax,ay,az,nx,ny,nz);push(v,bx,by,bz,nx,ny,nz);push(v,cx,cy,cz,nx,ny,nz);push(v,dx,dy,dz,nx,ny,nz);
    q.push(o,o+1,o+2,o,o+2,o+3);
  };
  const r=Math.SQRT1_2;
  /* The two faces, inset by the bevel. */
  quad(-ix,-iy,z, ix,-iy,z, ix,iy,z, -ix,iy,z, 0,0,1);
  quad(ix,-iy,-z, -ix,-iy,-z, -ix,iy,-z, ix,iy,-z, 0,0,-1);
  /* The four sides, inset in depth. */
  quad(x,-iy,iz, x,-iy,-iz, x,iy,-iz, x,iy,iz, 1,0,0);
  quad(-x,-iy,-iz, -x,-iy,iz, -x,iy,iz, -x,iy,-iz, -1,0,0);
  quad(-ix,y,iz, ix,y,iz, ix,y,-iz, -ix,y,-iz, 0,1,0);
  quad(-ix,-y,-iz, ix,-y,-iz, ix,-y,iz, -ix,-y,iz, 0,-1,0);
  /* THE CHAMFERS around the front and back silhouettes: the bands that
     catch the room. Their normals are at 45 degrees, which is what puts
     a grazing angle on a face-on card. */
  quad(-ix,-y,iz, ix,-y,iz, ix,-iy,z, -ix,-iy,z, 0,-r,r);
  quad(-ix,iy,z, ix,iy,z, ix,y,iz, -ix,y,iz, 0,r,r);
  quad(x,-iy,iz, x,iy,iz, ix,iy,z, ix,-iy,z, r,0,r);
  quad(-ix,-iy,z, -ix,iy,z, -x,iy,iz, -x,-iy,iz, -r,0,r);
  quad(ix,-y,-iz, -ix,-y,-iz, -ix,-iy,-z, ix,-iy,-z, 0,-r,-r);
  quad(ix,iy,-z, -ix,iy,-z, -ix,y,-iz, ix,y,-iz, 0,r,-r);
  quad(x,iy,-iz, x,-iy,-iz, ix,-iy,-z, ix,iy,-z, r,0,-r);
  quad(-x,-iy,-iz, -x,iy,-iz, -ix,iy,-z, -ix,-iy,-z, -r,0,-r);
  return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

export function createSphere(radius=1,segments=24,rings=16):BerxPrimitiveMesh{
  const v:number[]=[];const q:number[]=[];
  for(let y=0;y<=rings;y++){const py=y/rings*Math.PI;const sy=Math.cos(py),sr=Math.sin(py);for(let x=0;x<=segments;x++){const a=x/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);push(v,radius*sr*c,radius*sy,radius*sr*s,sr*c,sy,sr*s);}}
  /* Counter-clockwise seen from outside. It was the other way round,
     which with CULL_FACE on meant every sphere in the world — every
     person, every community node, the create object — was discarded
     before it was ever shaded. */
  for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){const a=y*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;q.push(a,b,c,b,d,c);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

/**
 * An annulus standing upright in XY, facing the camera — an event
 * reads as a ring that closes, which is the whole point of the form.
 * It used to be built flat in XZ, so a camera at eye level saw every
 * event edge-on as a hairline.
 *
 * Open geometry has no inside, so both faces are built explicitly with
 * opposed normals rather than left to a culling mode the renderer sets
 * globally: it is correct whether or not CULL_FACE is on.
 */
export function createRing(outer=1,inner=.72,segments=48):BerxPrimitiveMesh{
  const v:number[]=[];const q:number[]=[];
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);push(v,outer*c,outer*s,0,0,0,1);push(v,inner*c,inner*s,0,0,0,1);}
  const back=segments*2;
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);push(v,outer*c,outer*s,0,0,0,-1);push(v,inner*c,inner*s,0,0,0,-1);}
  /* front: counter-clockwise seen from +Z */
  for(let i=0;i<segments;i++){const n=(i+1)%segments,a=i*2,b=a+1,c=n*2,d=c+1;q.push(a,c,b,b,c,d);}
  /* back: the same quads with the opposite orientation */
  for(let i=0;i<segments;i++){const n=(i+1)%segments,a=back+i*2,b=a+1,c=back+n*2,d=c+1;q.push(a,b,c,b,d,c);}
  return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}

export function createFrame(width=1,height=1,bar=.12):BerxPrimitiveMesh{
  const parts=[createBox(width,bar,.12),createBox(width,bar,.12),createBox(bar,height,.12),createBox(bar,height,.12)];
  const v:number[]=[];const q:number[]=[];const poses=[[0,height/2,0],[0,-height/2,0],[-width/2,0,0],[width/2,0,0]];
  for(let p=0;p<parts.length;p++){const m=parts[p],base=v.length/6,[ox,oy,oz]=poses[p];for(let i=0;i<m.vertices.length;i+=6)push(v,m.vertices[i]+ox,m.vertices[i+1]+oy,m.vertices[i+2]+oz,m.vertices[i+3],m.vertices[i+4],m.vertices[i+5]);for(const idx of m.indices)q.push(base+idx);}return{vertices:new Float32Array(v),indices:new Uint16Array(q)};
}
