//! The shared core's draw list, as Rust types.
//!
//! This is a wire mirror of `BerxDrawList` in `@berx/spatial/drawList.ts`
//! and nothing more. There is deliberately no world here, no camera
//! logic, no culling, no level-of-detail rule and no material table:
//! every one of those decisions was already made once, in the shared
//! core, and a native backend that made them again would be a second
//! BERX. If a field below stops matching the TypeScript, deserialising
//! fails loudly rather than rendering something the web build would not.

use serde::Deserialize;

#[derive(Debug, Deserialize, Clone, Copy)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct PointLight {
    pub position: Vec3,
    pub colour: [f32; 3],
    pub intensity: f32,
    pub range: f32,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DrawItem {
    /// The entity's spatial id — the same object the web build draws.
    pub id: String,
    pub kind: String,
    pub primitive: String,
    pub lod: u8,
    /// Column-major, exactly as the shared core produced it.
    pub model: [f32; 16],
    pub base: [f32; 3],
    pub emissive: [f32; 3],
    pub metalness: f32,
    pub roughness: f32,
    pub opacity: f32,
    pub transmission: f32,
    pub point_lights: Vec<PointLight>,
    #[serde(default)]
    pub media: Option<String>,
    #[serde(default)]
    pub label: Option<String>,
    pub distance: f32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct KeyLight {
    pub direction: Vec3,
    pub colour: [f32; 3],
    pub intensity: f32,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DrawStats {
    pub visible: u32,
    pub in_frustum: u32,
    pub budget_cut: u32,
    pub lod_reduced: u32,
}

/// The key light's own camera, fitted by the shared core.
///
/// Deserialised rather than recomputed here on purpose: three backends
/// that each fit their own light camera would disagree about where a
/// shadow falls even while agreeing about the world, and the pixel
/// comparison between them would report a maths difference as a
/// rendering one.
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ShadowCamera {
    pub view: [f32; 16],
    pub projection: [f32; 16],
    pub view_projection: [f32; 16],
    pub texel_world_size: f32,
    pub depth_bias: f32,
    pub normal_bias: f32,
    pub map_size: u32,
    pub strength: f32,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DrawList {
    pub width: u32,
    pub height: u32,
    pub projection: [f32; 16],
    pub view: [f32; 16],
    /// The inverse of projection * view, from the shared core. A pass
    /// that marches through the scene needs it, and a matrix inverted
    /// three times in three languages is three matrices.
    #[serde(default)]
    pub inv_view_projection: Vec<f32>,
    /// The march's own parameters, packed by berxVolumetricUniform:
    /// density, phase g, max distance, intensity, then the step count.
    /// Forwarded to a uniform without being interpreted here — the
    /// order is the core's and there is exactly one opinion about it.
    #[serde(default)]
    pub volumetric: Vec<f32>,
    pub camera: Vec3,
    pub clear_color: [f32; 3],
    pub ambient: [f32; 3],
    /// THE ROOM, packed by the shared core's berxEnvironmentUniform: five
    /// vec4s in the order world.wgsl's uniform block declares them. This
    /// crate never interprets the packing, it forwards it — the order is
    /// the core's and there must be exactly one opinion about it.
    ///
    /// Defaulted so a draw list emitted before the environment existed
    /// still parses; an all-zero room renders black rather than throwing,
    /// and the gate would catch that instantly.
    #[serde(default)]
    pub environment: Vec<f32>,
    pub key: KeyLight,
    pub items: Vec<DrawItem>,
    /// Absent when there is nothing to cast, or when the core was asked
    /// for no shadows at all.
    #[serde(default)]
    pub shadow: Option<ShadowCamera>,
    pub stats: DrawStats,
}
