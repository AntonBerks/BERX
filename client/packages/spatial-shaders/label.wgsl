// Names standing in the world, in WGSL. This file is the only copy of it.
//
// Unlit on purpose: a name is not a surface in the room, it is a name, and
// shading it would make it dimmer the further it turned from the key light —
// the opposite of what a label is for. It is still real geometry, at a real
// world position with a real height in metres, and depth-tested, so anything
// in front of it hides it.
//
// The quad turns to face the camera by being built from the camera's own
// right and up vectors, which the shared core hands over with the label's
// position. Nothing here decides where a name goes.

struct LabelGlobals {
  proj: mat4x4<f32>,
  view: mat4x4<f32>,
  right: vec4<f32>,
  up: vec4<f32>,
};

struct Label {
  // xyz world centre, w unused
  centre: vec4<f32>,
  // xy half-extent in metres, z alpha, w unused
  size: vec4<f32>,
};

@group(0) @binding(0) var<uniform> g: LabelGlobals;
@group(1) @binding(0) var<uniform> l: Label;
@group(2) @binding(0) var glyph_sampler: sampler;
@group(2) @binding(1) var glyph_texture: texture_2d<f32>;

struct VsOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) v: u32) -> VsOut {
  // two triangles, as a quad in the camera's plane
  var corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0),
  );
  let q = corners[v];
  var o: VsOut;
  // the rasterised glyphs run top row first, so V is flipped here rather
  // than in the upload — writeTexture has no flip of its own
  o.uv = vec2<f32>(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5);
  let w = l.centre.xyz + g.right.xyz * (q.x * l.size.x) + g.up.xyz * (q.y * l.size.y);
  o.clip = g.proj * g.view * vec4<f32>(w, 1.0);
  return o;
}

@fragment
fn fs(i: VsOut) -> @location(0) vec4<f32> {
  let t = textureSample(glyph_texture, glyph_sampler, i.uv);
  let a = t.a * l.size.z;
  if (a < 0.01) { discard; }
  return vec4<f32>(t.rgb, a);
}
