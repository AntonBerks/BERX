// BERX SSAO, in WGSL. This file is the only copy of it.
//
// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,
// which imports it through @berx/spatial-shaders, and the native
// berx-spatial-native crate, which include_str!s it. WebGL2 has no
// compute stage, so it runs the same maths as a fullscreen fragment pass
// (see threeRuntime.ts) — the loop is line for line this one.
//
// It is a separate module from world.wgsl rather than another entry point
// in it because a WGSL module cannot declare two different resources at
// the same @group/@binding, and this pass needs its own bind group.

/* ------------------------------------------------------------------ *
 * SSAO — the compute pass
 * ------------------------------------------------------------------ *
 *
 * The loop is here because a pixel has to ask its neighbours, and that
 * cannot be a closed form. What is NOT here is anything that decides the
 * answer: the sample kernel, the radius, the bias, the strength and the
 * falloff all arrive in `k` from @berx/spatial's berxSSAOUniform, and the
 * accumulation below is the same sequence of operations as that module's
 * berxSSAOAt — which is the CPU twin the gate predicts pixels with.
 *
 * There is no per-pixel random rotation and no blur pass to hide one.
 * The kernel is an evenly-spaced golden-angle spiral, which does not need
 * the rotation, and a blur would add a radius three backends would have
 * to agree on for no gain.
 */

struct SsaoKernel {
  // BERX_SSAO_SAMPLES hemisphere offsets, then one vec4 of parameters:
  // x = radius, y = bias, z = strength, w = power.
  s: array<vec4<f32>, 17>,
};

@group(0) @binding(0) var<uniform> sk: SsaoKernel;
@group(0) @binding(1) var gbuffer: texture_2d<f32>;
@group(0) @binding(2) var ao_out: texture_storage_2d<r32float, write>;
// x = width, y = height, z = focal length in pixels, w unused
@group(0) @binding(3) var<uniform> sdim: vec4<f32>;

@compute @workgroup_size(8, 8)
fn cs_ssao(@builtin(global_invocation_id) id: vec3<u32>) {
  let w = i32(sdim.x);
  let h = i32(sdim.y);
  let x = i32(id.x);
  let y = i32(id.y);
  if (x >= w || y >= h) { return; }

  let centre = textureLoad(gbuffer, vec2<i32>(x, y), 0);
  // nothing was drawn here, so there is nothing to occlude
  if (centre.a <= 0.0) {
    textureStore(ao_out, vec2<i32>(x, y), vec4<f32>(1.0, 0.0, 0.0, 1.0));
    return;
  }

  let params = sk.s[16];
  let radius = params.x;
  let strength = params.z;
  let power = params.w;
  let n = normalize(centre.xyz);

  // A deterministic basis, not a noise-texture rotation — see the note
  // above and berxSSAOAt's own.
  var up = vec3<f32>(0.0, 0.0, 1.0);
  if (abs(n.z) >= 0.999) { up = vec3<f32>(1.0, 0.0, 0.0); }
  let tx = normalize(cross(up, n));
  let ty = cross(n, tx);
  // Slope-scaled bias — see berxSSAOAt's own note. A sample lands on a
  // whole pixel, and on an oblique surface the geometry there is up to
  // half a pixel of slope away in depth; a constant bias leaves every
  // tilted surface with a uniform haze.
  let slope = 1.0 - min(1.0, abs(n.z));
  let bias = params.y * (1.0 + slope * 4.0);

  var occluded = 0.0;
  for (var j: i32 = 0; j < 16; j = j + 1) {
    let k = sk.s[j].xyz;
    let s = tx * k.x + ty * k.y + n * k.z;
    let sample_depth = centre.a - s.z * radius;
    if (sample_depth <= 0.0) { continue; }
    let sx = x + i32(round((s.x * radius * sdim.z) / sample_depth));
    let sy = y - i32(round((s.y * radius * sdim.z) / sample_depth));
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) { continue; }
    let there = textureLoad(gbuffer, vec2<i32>(sx, sy), 0);
    if (there.a <= 0.0) { continue; }
    if (there.a < sample_depth - bias) {
      // range check: without it every silhouette grows a dark halo from
      // whatever happens to be far behind it
      let range = radius / max(abs(centre.a - there.a), 1e-4);
      occluded = occluded + min(1.0, range);
    }
  }

  let ratio = occluded / 16.0;
  let ao = max(0.0, 1.0 - pow(ratio, power) * strength);
  textureStore(ao_out, vec2<i32>(x, y), vec4<f32>(ao, 0.0, 0.0, 1.0));
}
