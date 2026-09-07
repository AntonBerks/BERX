// BERX particles, in WGSL. This file is the only copy of it.
//
// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,
// which imports it through @berx/spatial-shaders, and the native
// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same
// maths as a GLSL port (see threeRuntime.ts) — the hash and the placement
// below are the same sequence.
//
// NOTHING IS READ FROM A BUFFER. Each vertex works out where its own
// particle is from a hash of its index, exactly as @berx/spatial's
// berxParticleAt does — which is what makes the field identical in four
// languages without a buffer to keep in sync, and what lets a CPU twin
// say where every particle will be before the GPU draws it.
//
// Six vertices per particle, expanded from the vertex index alone: a
// camera-facing quad needs no vertex buffer at all when its corners come
// from arithmetic.

struct ParticleGlobals {
  proj: mat4x4<f32>,
  view: mat4x4<f32>,
  // xyz what the field is arranged around, w the time in seconds
  origin: vec4<f32>,
  // rgb colour, a peak alpha
  colour: vec4<f32>,
  // x = extent, y = speed, z = size, w = period
  shape: vec4<f32>,
  // x = count, y = kind (0 dust, 1 energy, 2 stars), zw unused
  counts: vec4<f32>,
  // the camera's right and up, for the quads that face it
  right: vec4<f32>,
  up: vec4<f32>,
};

@group(0) @binding(0) var<uniform> p: ParticleGlobals;

const PI: f32 = 3.14159265359;

/**
 * FNV-1a over an index and a lane — the same hash as
 * berxParticleHash. `lane` turns one index into several independent
 * numbers without needing four hashes or a table.
 */
fn phash(index: u32, lane: u32) -> f32 {
  var h: u32 = 0x811c9dc5u;
  h = h ^ (index & 0xffffu);
  h = h * 0x01000193u;
  h = h ^ ((index >> 16u) & 0xffffu);
  h = h * 0x01000193u;
  h = h ^ (lane & 0xffffu);
  h = h * 0x01000193u;
  return f32(h >> 8u) / 16777216.0;
}

struct Particle {
  centre: vec3<f32>,
  alpha: f32,
  size: f32,
};

/** The same placement as berxParticleAt, term for term. */
fn particle_at(index: u32) -> Particle {
  let hx = phash(index, 1u);
  let hy = phash(index, 2u);
  let hz = phash(index, 3u);
  let hp = phash(index, 4u);
  let extent = p.shape.x;
  let speed = p.shape.y;
  let size = p.shape.z;
  let period = p.shape.w;
  let alpha = p.colour.a;
  let phase = fract(p.origin.w / period + hp);

  var out: Particle;
  if (p.counts.y > 0.5 && p.counts.y < 1.5) {
    // energy: a spiral leaving a surface, not a column of dots
    let angle = hx * PI * 2.0 + phase * PI * 4.0;
    let radius = extent * (0.25 + hy * 0.55) * (1.0 - phase * 0.45);
    out.centre = vec3<f32>(
      p.origin.x + cos(angle) * radius,
      p.origin.y - extent * 0.4 + phase * extent * 1.8,
      p.origin.z + sin(angle) * radius,
    );
    // fades in and out over its own life: a particle that appears at
    // full brightness is a flicker, not a rising ember
    out.alpha = alpha * sin(phase * PI);
    out.size = size * (0.6 + hz * 0.8);
    return out;
  }

  // dust and stars: a hashed cube around the origin, drifting. The drift
  // wraps by construction, so there is no respawn and no lifetime
  // bookkeeping to desynchronise between backends.
  var drift = phase * extent;
  if (speed == 0.0) { drift = 0.0; }
  let wx = fract((hx * extent + drift * 0.35) / extent) * extent - extent * 0.5;
  let wy = fract((hy * extent + drift) / extent) * extent - extent * 0.5;
  let wz = fract((hz * extent + drift * 0.2) / extent) * extent - extent * 0.5;
  out.centre = vec3<f32>(p.origin.x + wx, p.origin.y + wy, p.origin.z + wz);
  // stars twinkle very slightly; dust does not — a twinkling mote in the
  // near field reads as a rendering error
  if (p.counts.y > 1.5) {
    out.alpha = alpha * (0.65 + 0.35 * sin(phase * PI * 2.0));
  } else {
    out.alpha = alpha;
  }
  out.size = size * (0.7 + hz * 0.6);
  return out;
}

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) alpha: f32,
};

@vertex
fn vs_particles(@builtin(vertex_index) v: u32) -> VsOut {
  let index = v / 6u;
  let corner = v % 6u;
  var corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0),
  );
  let q = corners[corner];
  let particle = particle_at(index);
  let world = particle.centre
    + p.right.xyz * (q.x * particle.size)
    + p.up.xyz * (q.y * particle.size);
  var o: VsOut;
  o.uv = q;
  o.alpha = particle.alpha;
  o.clip = p.proj * p.view * vec4<f32>(world, 1.0);
  return o;
}

@fragment
fn fs_particles(i: VsOut) -> @location(0) vec4<f32> {
  // A round, soft mote. A square particle reads as a missing texture,
  // and a hard-edged circle reads as a UI dot.
  let r = length(i.uv);
  if (r > 1.0) { discard; }
  let falloff = 1.0 - r * r;
  let a = i.alpha * falloff * falloff;
  if (a < 0.002) { discard; }
  // premultiplied: these are drawn additively, so the colour carries the
  // alpha and the blend adds it to whatever is behind
  return vec4<f32>(p.colour.rgb * a, a);
}
