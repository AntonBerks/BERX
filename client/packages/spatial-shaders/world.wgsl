// The BERX forward pass, in WGSL. This file is the only copy of it.
//
// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,
// which imports it through @berx/spatial-shaders, and the native
// berx-spatial-native crate, which include_str!s it. A shader duplicated
// per backend is how two renderers quietly stop drawing the same world.
//
// The same microfacet BRDF the WebGL2 backend runs: GGX, height-correlated
// Smith visibility, Schlick Fresnel, metalness splitting the diffuse and
// specular lobes, one directional key, up to four windowed point lights, and
// an ambient term that stands in for the bounced room without pretending to
// be image-based lighting. There is no post chain here, and both backends'
// reported capabilities say so.
//
// The key light casts. Its camera is fitted in the shared core
// (@berx/spatial's berxShadowCamera) so every backend puts the light in
// exactly the same place, and this file only reads the depth it captured:
// 3x3 PCF, a normal-offset sample, and a shadow that removes the KEY term
// only. Ambient and the point lights are untouched, because a surface in
// shadow still receives the bounced room — zeroing the pixel is what makes
// a render look like a cutout rather than a place.
//
// One thing differs from the GLSL source, and it is a clip-space convention
// rather than shading: WGSL depth runs 0..1 where GL runs -1..1, so the host
// hands this shader a projection already remapped.
//
// Media is a planar projection onto the face that points at you, exactly as
// in the GLSL pass: object-space position and normal give the UVs from the
// local XY extent, and the texture is applied only where the surface faces
// +Z, so an avatar on an orb reads as a face rather than as a photograph
// smeared around a ball. A backend with no image to bind binds a 1x1 texture
// and leaves the flag at zero; nothing is approximated with a colour.

struct Globals {
  proj: mat4x4<f32>,
  view: mat4x4<f32>,
  camera: vec4<f32>,
  ambient: vec4<f32>,
  key_dir: vec4<f32>,
  key_col: vec4<f32>,   // rgb, intensity in w
  // The light's own view-projection, already in this API's depth range.
  light_vp: mat4x4<f32>,
  // x = 1/mapSize, y = depth bias, z = normal bias, w = strength (0 = off)
  shadow: vec4<f32>,
};

struct Draw {
  model: mat4x4<f32>,
  base: vec4<f32>,              // rgb base colour, w = local half-extent in X
  emissive: vec4<f32>,          // rgb emission,    w = local half-extent in Y
  surface: vec4<f32>,           // metalness, roughness, opacity, transmission
  pl_pos: array<vec4<f32>, 4>,  // xyz position, w range
  pl_col: array<vec4<f32>, 4>,  // rgb colour, w intensity
  // x = point light count, yz = UV cover/contain correction, w = has texture
  counts: vec4<f32>,
};

@group(0) @binding(0) var<uniform> g: Globals;
// A comparison sampler, not a plain one: the hardware does the depth test
// per sample and averages the RESULTS, which is what makes a 3x3 tap a soft
// edge instead of four hard ones. Sampling depth and comparing afterwards
// would average DEPTHS, and an averaged depth is a surface that exists
// nowhere.
@group(0) @binding(1) var shadow_sampler: sampler_comparison;
@group(0) @binding(2) var shadow_texture: texture_depth_2d;
@group(1) @binding(0) var<uniform> d: Draw;
@group(2) @binding(0) var media_sampler: sampler;
@group(2) @binding(1) var media_texture: texture_2d<f32>;

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) n: vec3<f32>,
  @location(1) w: vec3<f32>,
  // object space, so media projects onto the form rather than the screen
  @location(2) local: vec3<f32>,
  @location(3) local_n: vec3<f32>,
};

/**
 * The depth-only pass, from the light.
 *
 * The same vertex data and the same model matrix as the main pass — a
 * shadow cast by a different shape from the one drawn is worse than no
 * shadow, because it is a shape that is not there.
 */
@vertex
fn vs_shadow(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> @builtin(position) vec4<f32> {
  return g.light_vp * d.model * vec4<f32>(p, 1.0);
}

@vertex
fn vs(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>) -> VsOut {
  var o: VsOut;
  let w = d.model * vec4<f32>(p, 1.0);
  o.w = w.xyz;
  o.n = (mat3x3<f32>(d.model[0].xyz, d.model[1].xyz, d.model[2].xyz)) * n;
  o.local = p;
  o.local_n = n;
  o.clip = g.proj * g.view * w;
  return o;
}

const PI: f32 = 3.14159265359;

fn d_ggx(noh: f32, a: f32) -> f32 {
  let a2 = a * a;
  let den = noh * noh * (a2 - 1.0) + 1.0;
  return a2 / max(PI * den * den, 1e-7);
}

fn v_smith(nov: f32, nol: f32, a: f32) -> f32 {
  let a2 = a * a;
  let v = nol * sqrt(nov * nov * (1.0 - a2) + a2);
  let l = nov * sqrt(nol * nol * (1.0 - a2) + a2);
  return 0.5 / max(v + l, 1e-7);
}

fn f_schlick(f0: vec3<f32>, u: f32) -> vec3<f32> {
  let m = clamp(1.0 - u, 0.0, 1.0);
  let m2 = m * m;
  return f0 + (vec3<f32>(1.0) - f0) * (m2 * m2 * m);
}

fn shade(n: vec3<f32>, v: vec3<f32>, l: vec3<f32>, radiance: vec3<f32>,
         diffuse_color: vec3<f32>, f0: vec3<f32>, a: f32) -> vec3<f32> {
  let h = normalize(v + l);
  let nol = max(dot(n, l), 0.0);
  if (nol <= 0.0) { return vec3<f32>(0.0); }
  let nov = max(dot(n, v), 1e-4);
  let noh = max(dot(n, h), 0.0);
  let voh = max(dot(v, h), 0.0);
  let f = f_schlick(f0, voh);
  let vis = v_smith(nov, nol, a);
  let dist = d_ggx(noh, a);
  let spec = f * (dist * vis);
  // energy that was not reflected is the only energy left to scatter
  let kd = vec3<f32>(1.0) - f;
  let diff = kd * diffuse_color / PI;
  return (diff + spec) * radiance * nol;
}

/**
 * How much of the key light reaches this point. 1 is full light.
 *
 * The sample is pushed along the surface normal before projecting, which
 * is what stops a lit surface shadowing itself at grazing angles without
 * the constant depth bias that would detach a shadow from the foot of
 * the thing casting it.
 */
fn key_visibility(world: vec3<f32>, n: vec3<f32>, nol: f32) -> f32 {
  if (g.shadow.w <= 0.0) { return 1.0; }
  // more offset where the light grazes, none where it is head-on
  let slope = clamp(1.0 - nol, 0.0, 1.0);
  let offset = world + n * (g.shadow.z * (1.0 + slope * 2.0));
  let light_clip = g.light_vp * vec4<f32>(offset, 1.0);
  let ndc = light_clip.xyz / max(light_clip.w, 1e-6);
  // outside the light's own box: lit, not shadowed. A world larger than
  // the map must not grow a hard black edge where the map ends.
  if (ndc.x < -1.0 || ndc.x > 1.0 || ndc.y < -1.0 || ndc.y > 1.0 || ndc.z > 1.0) { return 1.0; }
  let uv = vec2<f32>(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
  let depth = ndc.z - g.shadow.y;
  var sum = 0.0;
  for (var y: i32 = -1; y <= 1; y = y + 1) {
    for (var x: i32 = -1; x <= 1; x = x + 1) {
      let tap = uv + vec2<f32>(f32(x), f32(y)) * g.shadow.x;
      sum = sum + textureSampleCompareLevel(shadow_texture, shadow_sampler, tap, depth);
    }
  }
  let lit = sum / 9.0;
  return mix(1.0, lit, g.shadow.w);
}

@fragment
fn fs(i: VsOut) -> @location(0) vec4<f32> {
  // Media is a planar projection onto the face that points at you.
  //
  // The sample is taken unconditionally and then selected, rather than
  // taken inside the test: textureSample needs uniform control flow, and
  // whether a fragment is on the front face and inside the picture is a
  // per-fragment fact. A backend with nothing to show binds a 1x1
  // texture and leaves counts.w at zero, so the sample is discarded.
  let half_extent = vec2<f32>(max(d.base.w, 1e-4), max(d.emissive.w, 1e-4));
  let uv = (i.local.xy / half_extent) * 0.5 * d.counts.yz + vec2<f32>(0.5);
  let sampled = textureSample(media_texture, media_sampler, vec2<f32>(uv.x, 1.0 - uv.y)).rgb;
  let inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  let facing = normalize(i.local_n).z > 0.5;
  let base = select(d.base.rgb, sampled, d.counts.w > 0.5 && facing && inside);
  let n = normalize(i.n);
  let v = normalize(g.camera.xyz - i.w);
  let a = max(d.surface.y * d.surface.y, 1e-3);
  // metals have no diffuse term and tint their reflection; dielectrics
  // reflect 4% white and keep their colour in the diffuse lobe
  let diffuse_color = base * (1.0 - d.surface.x);
  let f0 = mix(vec3<f32>(0.04), base, vec3<f32>(d.surface.x));

  let key_l = normalize(g.key_dir.xyz);
  // The key alone is shadowed. Ambient and the point lights are not: a
  // surface out of the sun still receives the room.
  let visibility = key_visibility(i.w, n, max(dot(n, key_l), 0.0));
  var lit = shade(n, v, key_l, g.key_col.rgb * g.key_col.w, diffuse_color, f0, a) * visibility;

  let count = i32(d.counts.x);
  for (var k: i32 = 0; k < 4; k = k + 1) {
    if (k >= count) { break; }
    let lp = d.pl_pos[k];
    let lc = d.pl_col[k];
    let delta = lp.xyz - i.w;
    let dist = length(delta);
    if (dist > lp.w) { continue; }
    // inverse-square, windowed so a light ends where its range says
    let win = clamp(1.0 - pow(dist / lp.w, 4.0), 0.0, 1.0);
    let atten = win * win / max(dist * dist, 1e-4);
    lit = lit + shade(n, v, delta / max(dist, 1e-4), lc.rgb * lc.w * atten, diffuse_color, f0, a);
  }

  let amb = g.ambient.rgb * (diffuse_color + f0 * pow(1.0 - max(dot(n, v), 0.0), 5.0));
  let colour = lit + amb + d.emissive.rgb;
  // transmission lets the ground through a glass surface rather than
  // fading it to nothing
  let alpha = clamp(d.surface.z * (1.0 - d.surface.w * 0.55), 0.02, 1.0);
  return vec4<f32>(colour, alpha);
}
