// BERX volumetric light, in WGSL. This file is the only copy of it.
//
// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,
// which imports it through @berx/spatial-shaders, and the native
// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same
// maths as a fullscreen fragment pass (see threeRuntime.ts) — the march
// below is line for line the same sequence.
//
// A fullscreen FRAGMENT pass rather than a compute one, unlike ssao.wgsl,
// and for a reason: WebGL2 has no compute stage, so a fragment shape is
// the only one all three backends can run identically. SSAO writes to a
// storage texture it then reads at a different pixel, which a fragment
// pass cannot do; this one only ever writes the pixel it is on.
//
// What is NOT here is anything that decides the answer: the density, the
// phase asymmetry, the march length and the intensity all arrive in `v`
// from @berx/spatial's berxVolumetricUniform, and the loop is the same
// sequence of operations as that module's berxVolumetricAt — the CPU twin
// the gate predicts pixels with.

struct VolGlobals {
  // the inverse of projection * view, for turning a pixel into a ray
  inv_view_proj: mat4x4<f32>,
  // xyz eye position, w unused
  eye: vec4<f32>,
  // xyz toward the key light, w unused
  light_dir: vec4<f32>,
  // rgb the key's colour, w its intensity
  light_col: vec4<f32>,
  // the light's own view-projection, in this API's depth range
  light_vp: mat4x4<f32>,
  // x = 1/mapSize, y = depth bias, z unused, w = shadow strength
  shadow: vec4<f32>,
  // x = density, y = phase g, z = max distance, w = intensity
  params: vec4<f32>,
  // x = march width, y = march height, z = steps, w = march scale
  //
  // The march may run at a FRACTION of the frame: a shaft is a smooth,
  // low-frequency thing with no edges of its own — only the ones the
  // shadow map gives it — so it survives being computed at half
  // resolution and upsampled, and the cost is quadratic in that choice.
  // xy are therefore the MARCH's dimensions, and w says how many frame
  // pixels one of them covers, which is all the G-buffer fetch needs.
  dims: vec4<f32>,
  // xyz the camera's forward direction, w unused. Turns the G-buffer's
  // view depth into a distance along THIS ray.
  forward: vec4<f32>,
};

@group(0) @binding(0) var<uniform> v: VolGlobals;
@group(0) @binding(1) var shadow_sampler: sampler_comparison;
@group(0) @binding(2) var shadow_texture: texture_depth_2d;
// rgb = view-space normal, a = linear view depth in metres (0 = nothing)
@group(0) @binding(3) var gbuffer: texture_2d<f32>;

// The composite's own resources, on a second group: a WGSL module cannot
// declare two different resources at the same @group/@binding, and the
// composite reads what the march wrote rather than what the march read.
@group(1) @binding(0) var vol_sampler: sampler;
@group(1) @binding(1) var vol_texture: texture_2d<f32>;

const PI: f32 = 3.14159265359;

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) i: u32) -> VsOut {
  // one triangle covering the screen: fewer vertices than a quad and no
  // seam down the diagonal where two triangles meet
  var corners = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0),
  );
  let c = corners[i];
  var o: VsOut;
  o.clip = vec4<f32>(c, 0.0, 1.0);
  o.uv = vec2<f32>(c.x * 0.5 + 0.5, 0.5 - c.y * 0.5);
  return o;
}

/**
 * Henyey–Greenstein. The same curve as @berx/spatial's berxPhaseHG,
 * including the clamp: at g→1 and cosTheta→1 the denominator goes to
 * zero and the phase to infinity, which is the singular lobe that blows
 * a shaft out to white.
 */
fn phase_hg(cos_theta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let denom = 1.0 + g2 - 2.0 * g * cos_theta;
  return (1.0 - g2) / (4.0 * PI * pow(max(denom, 1e-4), 1.5));
}

/**
 * FNV-1a over the pixel coordinate — the same hash as
 * berxVolumetricJitter, which is why a shaft dithers identically in
 * four languages without shipping a noise texture.
 */
fn jitter(x: i32, y: i32) -> f32 {
  var h: u32 = 0x811c9dc5u;
  h = h ^ (u32(x) & 0xffffu);
  h = h * 0x01000193u;
  h = h ^ (u32(y) & 0xffffu);
  h = h * 0x01000193u;
  return f32(h >> 8u) / 16777216.0;
}

/** 1 where the key light reaches this point, 0 where the map says it does not. */
fn lit_at(world: vec3<f32>) -> f32 {
  if (v.shadow.w <= 0.0) { return 1.0; }
  let clip = v.light_vp * vec4<f32>(world, 1.0);
  let ndc = clip.xyz / max(clip.w, 1e-6);
  // outside the light's own box the air is lit, not dark: a world larger
  // than the map must not grow a hard black wall where the map ends
  if (ndc.x < -1.0 || ndc.x > 1.0 || ndc.y < -1.0 || ndc.y > 1.0 || ndc.z > 1.0) { return 1.0; }
  let uv = vec2<f32>(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
  return textureSampleCompareLevel(shadow_texture, shadow_sampler, uv, ndc.z - v.shadow.y);
}

@fragment
fn fs_volumetric(i: VsOut) -> @location(0) vec4<f32> {
  let px = i32(i.uv.x * v.dims.x);
  let py = i32(i.uv.y * v.dims.y);

  // The ray through this pixel, from the inverse view-projection. Two
  // points on it rather than a direction guess, so the reconstruction is
  // exactly the camera's own.
  let ndc = vec2<f32>(i.uv.x * 2.0 - 1.0, 1.0 - i.uv.y * 2.0);
  let near_h = v.inv_view_proj * vec4<f32>(ndc, 0.0, 1.0);
  let far_h = v.inv_view_proj * vec4<f32>(ndc, 1.0, 1.0);
  let near_p = near_h.xyz / max(near_h.w, 1e-6);
  let far_p = far_h.xyz / max(far_h.w, 1e-6);
  let dir = normalize(far_p - near_p);

  // Distance to the first surface. The march stops there: air behind a
  // wall does not scatter light into the eye, and marching past it is how
  // a volumetric pass glows through solid objects.
  //
  // The G-buffer stores VIEW DEPTH — distance along the camera's forward
  // axis — and the march needs distance along THIS ray. For an off-axis
  // pixel those differ by 1/cos, and using the depth directly cuts the
  // march short by that factor: a measurable error toward the corners of
  // the frame, and one the CPU twin would reproduce only by making the
  // same mistake.
  // The G-buffer is always at FRAME resolution — the occlusion pass reads
  // it per pixel and cannot be cheapened the same way — so a march pixel
  // maps to the centre of the block it covers. At scale 1 this is exactly
  // (px, py), which is why turning the scale on changes nothing at HIGH.
  let scale = max(v.dims.w, 1.0);
  let gxy = vec2<f32>(f32(px), f32(py)) * scale + vec2<f32>((scale - 1.0) * 0.5);
  let g = textureLoad(gbuffer, vec2<i32>(gxy), 0);
  let along = max(dot(dir, normalize(v.forward.xyz)), 1e-3);
  let surface = select(v.params.z, g.a / along, g.a > 0.0);
  let far = min(v.params.z, surface);
  if (far <= 0.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }

  let steps = i32(v.dims.z);
  let step_length = far / f32(steps);
  let phase = phase_hg(dot(dir, normalize(v.light_dir.xyz)), v.params.y);
  let offset = jitter(px, py);

  var inscatter = 0.0;
  for (var s: i32 = 0; s < steps; s = s + 1) {
    let t = (f32(s) + offset) * step_length;
    let p = v.eye.xyz + dir * t;
    let lit = lit_at(p);
    if (lit <= 0.0) { continue; }
    // Beer–Lambert: what scatters here still has to reach the eye
    let transmittance = exp(-v.params.x * t);
    inscatter = inscatter + lit * phase * v.params.x * step_length * transmittance;
  }

  let energy = inscatter * v.params.w;
  // The scattering is grey; the colour is the key light's own. Keeping
  // them apart means a change of light colour cannot silently change the
  // amount of scattering.
  return vec4<f32>(v.light_col.rgb * v.light_col.w * energy, 1.0);
}

/**
 * The additive composite.
 *
 * Light in the air ADDS to what is behind it. A composite that blended
 * over the world would be a fog overlay: it would darken something, and
 * scattering never darkens anything. The blend state on the pipeline is
 * ONE/ONE for exactly that reason, and this shader only has to hand back
 * the in-scatter it was given.
 */
@fragment
fn fs_composite(i: VsOut) -> @location(0) vec4<f32> {
  /**
   * A bilinear tap, written out rather than asked of a sampler.
   *
   * The march target is rgba32float, and a 32-bit float texture is not
   * filterable in WebGPU without an optional feature no phone is
   * guaranteed to have. Dropping to rgba16float would have bought
   * hardware filtering — and would have moved the volumetric gate's
   * oracle tolerance from 1e-7 to about 1e-3 to accommodate it, which is
   * loosening a measurement to fit a change rather than the other way
   * round. Four loads and three mixes cost less than that.
   *
   * At scale 1 the sample lands exactly on a texel centre, f is zero in
   * both axes, and this returns the same value a nearest tap did — so
   * the full-resolution picture is unchanged, bit for bit.
   */
  let size = vec2<f32>(textureDimensions(vol_texture));
  let p = i.uv * size - vec2<f32>(0.5);
  let base = floor(p);
  let f = p - base;
  let hi = size - vec2<f32>(1.0);
  let c00 = vec2<i32>(clamp(base, vec2<f32>(0.0), hi));
  let c10 = vec2<i32>(clamp(base + vec2<f32>(1.0, 0.0), vec2<f32>(0.0), hi));
  let c01 = vec2<i32>(clamp(base + vec2<f32>(0.0, 1.0), vec2<f32>(0.0), hi));
  let c11 = vec2<i32>(clamp(base + vec2<f32>(1.0, 1.0), vec2<f32>(0.0), hi));
  let top = mix(textureLoad(vol_texture, c00, 0).rgb, textureLoad(vol_texture, c10, 0).rgb, f.x);
  let bottom = mix(textureLoad(vol_texture, c01, 0).rgb, textureLoad(vol_texture, c11, 0).rgb, f.x);
  return vec4<f32>(mix(top, bottom, f.y), 1.0);
}
