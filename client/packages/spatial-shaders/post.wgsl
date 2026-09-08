// BERX post, in WGSL. This file is the only copy of it.
//
// Two backends run this exact text: @berx/spatial-web's WebGPU renderer,
// which imports it through @berx/spatial-shaders, and the native
// berx-spatial-native crate, which include_str!s it. WebGL2 runs the same
// maths as a fullscreen fragment pass (see threeRuntime.ts) — the five
// constants below are the same five numbers there and in Rust and in
// @berx/spatial's berxExposure, which is the CPU twin the gate predicts
// pixels with.
//
// This stage was declared `absent` in renderPipeline.ts for the whole of
// the project's life, and the honesty of that label is what made the
// problem findable: there was no tone-map, so the frame was whatever the
// world pass wrote, and what the world pass wrote was every brand colour
// dimmed by the room's own light transport. #15191E on #07080A came out
// 7 against 7 out of 255 — an object and a void the same colour to
// within half a code value.
//
// WHAT RUNS HERE, in order, and the order is the whole point:
//
//   linear HDR  ->  x exposure  ->  shoulder  ->  8-bit frame
//
// The input is the frame AFTER the air has been added, because
// in-scatter is light and light is part of what is being exposed.
// Tone-mapping the surfaces and then adding the air would put unmapped
// values on top of mapped ones, which is not a brighter picture — it is
// two different pictures added together.

struct PostGlobals {
  // x = exposure gain, y..w unused
  params: vec4<f32>,
};

@group(0) @binding(0) var frame_texture: texture_2d<f32>;
@group(0) @binding(1) var<uniform> p: PostGlobals;

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_post(@builtin(vertex_index) i: u32) -> VsOut {
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

// The ACES filmic fit (Narkowicz). Five constants, four languages, one
// set of numbers.
//
// Chosen over a Reinhard curve for what it does to HUE, which is the
// thing a brand palette cannot afford to lose: past white it desaturates
// toward white the way film does, instead of clipping each channel on
// its own and turning a bright teal into a cyan and then into a flat
// white. It also lifts the middle — f(0.18) = 0.267 — which is why the
// gain does not have to be larger than the measured transport says.
fn shoulder(x: f32) -> f32 {
  let v = max(x, 0.0);
  let mapped = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14);
  return clamp(mapped, 0.0, 1.0);
}

@fragment
fn fs_post(i: VsOut) -> @location(0) vec4<f32> {
  // A LOAD, not a sample. This pass is one output pixel per input
  // pixel, so there is nothing to filter and a bilinear tap only
  // introduces a half-texel question each API answers its own way — it
  // was worth exactly three disagreeing pixels along the top edge
  // between the two web backends. An integer fetch has no such
  // question and makes them identical by construction.
  let hdr = textureLoad(frame_texture, vec2<i32>(i.clip.xy), 0);
  let e = hdr.rgb * p.params.x;
  // Per channel, and the shoulder is what keeps that from being three
  // independent clips: two colours that both pass 1.0 stay different
  // numbers on screen instead of both being white.
  return vec4<f32>(shoulder(e.r), shoulder(e.g), shoulder(e.b), 1.0);
}
