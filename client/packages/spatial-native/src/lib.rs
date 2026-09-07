//! BERX 5D native renderer backend.
//!
//! This crate is a **renderer**, in the sense the BERX architecture uses
//! that word: it takes the draw list the shared TypeScript core produced
//! from a `Berx5DFrame` and turns it into pixels on a real GPU through
//! wgpu (Vulkan, Metal, D3D12, or GL, whichever the platform has). It
//! holds no world graph, no camera, no temporal or relational state, no
//! navigation and no domain logic, because BERX has exactly one of each
//! of those and they are not here.
//!
//! What it does not do yet is stated rather than faked: there is no
//! media decoder, so an item's `media` surface is not drawn; there is
//! no text rasteriser, so labels are not drawn; and there is no shadow
//! map, no image-based lighting and no post chain, exactly as on the
//! web backend. `Capabilities` below reports all of that truthfully and
//! is what the verification reads.

pub mod drawlist;
pub mod ffi;
pub mod platform;
pub mod mesh;
#[cfg(feature = "window")]
mod window;

#[cfg(feature = "window")]
pub use window::WindowRenderer;

use std::collections::HashMap;
use std::num::NonZeroU64;

use bytemuck::{Pod, Zeroable};
use drawlist::DrawList;
use wgpu::util::DeviceExt;

/// What this backend genuinely does. Nothing here becomes true by being wanted.
#[derive(Debug, Clone, Copy)]
pub struct Capabilities {
    pub perspective: bool,
    pub depth_buffer: bool,
    pub physically_lit_materials: bool,
    pub shadows: bool,
    pub post_processing: bool,
    /// No image decoder in this crate yet: media surfaces are not drawn.
    pub media_surfaces: bool,
    /// No text rasteriser in this crate yet: labels are not drawn.
    pub world_space_labels: bool,
}

pub const CAPABILITIES: Capabilities = Capabilities {
    perspective: true,
    depth_buffer: true,
    physically_lit_materials: true,
    shadows: false,
    post_processing: false,
    media_surfaces: false,
    world_space_labels: false,
};

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct Globals {
    proj: [f32; 16],
    view: [f32; 16],
    camera: [f32; 4],
    ambient: [f32; 4],
    key_dir: [f32; 4],
    key_col: [f32; 4],
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct Draw {
    model: [f32; 16],
    base: [f32; 4],
    emissive: [f32; 4],
    surface: [f32; 4],
    pl_pos: [[f32; 4]; 4],
    pl_col: [[f32; 4]; 4],
    counts: [f32; 4],
}

/// Samples per pixel in the world pass. Matches the WebGL2 canvas's
/// `antialias: true`, which every desktop driver honours as 4x.
pub const SAMPLE_COUNT: u32 = 4;

/// Exactly 256 bytes, which is also the widest uniform alignment wgpu
/// asks for, so one dynamic offset per item needs no padding.
const DRAW_STRIDE: u64 = std::mem::size_of::<Draw>() as u64;

/// What a native frame actually cost. Measured, never estimated.
#[derive(Debug, Clone, Copy, Default)]
pub struct FrameStats {
    pub draw_calls: u32,
    pub triangles: u32,
    pub mesh_variants: u32,
    /// Items the shared core listed that this backend could not draw.
    pub skipped: u32,
}

/// One frame's uniforms, bind groups and draw plan.
///
/// Built by `prepare` and consumed by `record`, so the offscreen path
/// and the window path share the frame rather than each building one.
pub struct Prepared {
    globals_bind: wgpu::BindGroup,
    draw_bind: wgpu::BindGroup,
    plan: Vec<(String, u32)>,
    mesh_variants: u32,
    clear: [f32; 3],
    skipped: u32,
}

/// The rendered frame, read back off the GPU.
pub struct Readback {
    pub width: u32,
    pub height: u32,
    /// Tightly packed RGBA8, row-major, top row first.
    pub rgba: Vec<u8>,
    pub stats: FrameStats,
}

impl Readback {
    pub fn pixel(&self, x: u32, y: u32) -> [u8; 4] {
        let i = ((y * self.width + x) * 4) as usize;
        [self.rgba[i], self.rgba[i + 1], self.rgba[i + 2], self.rgba[i + 3]]
    }
}

/// GL clip space runs z in -1..1; WGSL runs 0..1. The shared core emits
/// one projection, so the remap happens here, in the backend whose API
/// convention differs — not in the core, which would then be carrying a
/// platform's opinion.
fn gl_to_wgpu_depth(proj: &[f32; 16]) -> [f32; 16] {
    let mut m = *proj;
    /* column-major: row 2 of columns 0..3 sits at indices 2, 6, 10, 14.
       z' = (z + w) / 2 */
    for c in 0..4 {
        let z = proj[c * 4 + 2];
        let w = proj[c * 4 + 3];
        m[c * 4 + 2] = (z + w) * 0.5;
    }
    m
}

struct GpuMesh {
    vertices: wgpu::Buffer,
    indices: wgpu::Buffer,
    count: u32,
}

/// The uniform layouts and the shading pipeline, shared by both targets.
///
/// The offscreen renderer and the window renderer are the same renderer
/// pointed at different attachments: the same draw list, the same
/// shader, the same blend and cull state, the same multisampling. What
/// differs is where the frame ends up, which is the only thing a window
/// actually changes.
pub struct NativeRenderer {
    device: wgpu::Device,
    queue: wgpu::Queue,
    pipeline: wgpu::RenderPipeline,
    globals_layout: wgpu::BindGroupLayout,
    draw_layout: wgpu::BindGroupLayout,
    /* a 1x1 texture and a sampler, bound for every draw. The shader's
       media path is shared with the WebGPU backend; this crate has no
       decoder, so it leaves the flag at zero and binds this rather than
       carrying a second shader without the path in it. */
    media_bind: wgpu::BindGroup,
    meshes: HashMap<String, GpuMesh>,
    adapter_name: String,
    backend: String,
    format: wgpu::TextureFormat,
}

impl NativeRenderer {
    /// Ask the platform for a real GPU. No software fallback is
    /// substituted silently: if there is no adapter, that is an error
    /// the caller reports as a blocker rather than a rendered lie.
    pub fn new() -> Result<Self, String> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..Default::default()
        });
        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: false,
        }))
        .ok_or_else(|| "BERX 5D native: no GPU adapter available".to_string())?;
        Self::on(&adapter, wgpu::TextureFormat::Rgba8Unorm)
    }

    /// The same renderer, on an adapter a caller already chose and
    /// against the format its target actually wants.
    ///
    /// A window's swapchain picks its own format, and a pipeline whose
    /// colour target disagrees with it is rejected outright. This is the
    /// one thing a window changes about the renderer; everything else —
    /// the shader, the blend, the culling, the multisampling — is the
    /// same code as the offscreen path, which is what lets the two be
    /// compared pixel for pixel.
    pub fn on(adapter: &wgpu::Adapter, format: wgpu::TextureFormat) -> Result<Self, String> {
        let info = adapter.get_info();
        let (device, queue) = pollster::block_on(adapter.request_device(
            &wgpu::DeviceDescriptor {
                label: Some("berx-5d-native"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_defaults(),
            },
            None,
        ))
        .map_err(|e| format!("BERX 5D native: no GPU device: {e}"))?;

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("berx-world"),
            source: wgpu::ShaderSource::Wgsl(include_str!("../../spatial-shaders/world.wgsl").into()),
        });

        let globals_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("berx-globals"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: NonZeroU64::new(std::mem::size_of::<Globals>() as u64),
                },
                count: None,
            }],
        });
        let draw_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("berx-draw"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX | wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: true,
                    min_binding_size: NonZeroU64::new(DRAW_STRIDE),
                },
                count: None,
            }],
        });
        let media_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("berx-media"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
            ],
        });
        let placeholder = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("berx-media-placeholder"),
            size: wgpu::Extent3d { width: 1, height: 1, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        /* one defined white pixel: unused where the flag is zero, but a
           texture is never left with undefined contents */
        queue.write_texture(
            wgpu::ImageCopyTexture {
                texture: &placeholder,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &[255u8, 255, 255, 255],
            wgpu::ImageDataLayout { offset: 0, bytes_per_row: Some(4), rows_per_image: Some(1) },
            wgpu::Extent3d { width: 1, height: 1, depth_or_array_layers: 1 },
        );
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("berx-media"),
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            ..Default::default()
        });
        let media_bind = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("berx-media"),
            layout: &media_layout,
            entries: &[
                wgpu::BindGroupEntry { binding: 0, resource: wgpu::BindingResource::Sampler(&sampler) },
                wgpu::BindGroupEntry { binding: 1, resource: wgpu::BindingResource::TextureView(&placeholder.create_view(&Default::default())) },
            ],
        });

        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("berx-world"),
            bind_group_layouts: &[&globals_layout, &draw_layout, &media_layout],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("berx-world"),
            layout: Some(&layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs",
                buffers: &[wgpu::VertexBufferLayout {
                    array_stride: 24,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &[
                        wgpu::VertexAttribute { offset: 0, shader_location: 0, format: wgpu::VertexFormat::Float32x3 },
                        wgpu::VertexAttribute { offset: 12, shader_location: 1, format: wgpu::VertexFormat::Float32x3 },
                    ],
                }],
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs",
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    /* the same blend the WebGL2 backend runs: source alpha
                       over one minus source alpha */
                    blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                /* counter-clockwise front faces, back faces culled — the
                   same state the web backend sets globally */
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: Some(wgpu::Face::Back),
                ..Default::default()
            },
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: Default::default(),
                bias: Default::default(),
            }),
            /* the web canvas is created with antialias:true, so the native
               pass multisamples too: comparing a multisampled image against
               a single-sampled one would report a difference that is the
               harness's, not the renderer's */
            multisample: wgpu::MultisampleState { count: SAMPLE_COUNT, ..Default::default() },
            multiview: None,
        });

        Ok(Self {
            device,
            queue,
            pipeline,
            globals_layout,
            draw_layout,
            media_bind,
            meshes: HashMap::new(),
            adapter_name: info.name,
            backend: format!("{:?}", info.backend),
            format,
        })
    }

    pub fn adapter(&self) -> (&str, &str) {
        (&self.adapter_name, &self.backend)
    }

    /// The colour format this renderer's pipeline writes.
    pub fn format(&self) -> wgpu::TextureFormat {
        self.format
    }

    pub fn device(&self) -> &wgpu::Device {
        &self.device
    }

    pub fn queue(&self) -> &wgpu::Queue {
        &self.queue
    }

    fn mesh(&mut self, primitive: &str, lod: u8) -> Result<&GpuMesh, String> {
        let key = format!("{primitive}:{lod}");
        if !self.meshes.contains_key(&key) {
            let m = mesh::mesh_for(primitive, lod)?;
            let vertices = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some(&key),
                contents: bytemuck::cast_slice(&m.vertices),
                usage: wgpu::BufferUsages::VERTEX,
            });
            let indices = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some(&key),
                contents: bytemuck::cast_slice(&m.indices),
                usage: wgpu::BufferUsages::INDEX,
            });
            let count = m.indices.len() as u32;
            self.meshes.insert(key.clone(), GpuMesh { vertices, indices, count });
        }
        Ok(self.meshes.get(&key).expect("just inserted"))
    }

    /// Everything a frame needs before a pass can be recorded.
    ///
    /// Split out of `render` so the window path records the identical
    /// pass into a swapchain image instead of an offscreen texture. Two
    /// copies of this would be two renderers that only look alike.
    pub fn prepare(&mut self, list: &DrawList) -> Result<Prepared, String> {
        /* build every mesh first, so the borrow of self ends before the
           encoder needs it */
        let mut plan: Vec<(String, u32)> = Vec::new();
        let mut variants: Vec<String> = Vec::new();
        for item in &list.items {
            let key = format!("{}:{}", item.primitive, item.lod);
            let count = self.mesh(&item.primitive, item.lod)?.count;
            if !variants.contains(&key) {
                variants.push(key.clone());
            }
            plan.push((key, count));
        }

        let globals = Globals {
            proj: gl_to_wgpu_depth(&list.projection),
            view: list.view,
            camera: [list.camera.x, list.camera.y, list.camera.z, 0.0],
            ambient: [list.ambient[0], list.ambient[1], list.ambient[2], 0.0],
            key_dir: [list.key.direction.x, list.key.direction.y, list.key.direction.z, 0.0],
            key_col: [list.key.colour[0], list.key.colour[1], list.key.colour[2], list.key.intensity],
        };
        let globals_buffer = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("berx-globals"),
            contents: bytemuck::bytes_of(&globals),
            usage: wgpu::BufferUsages::UNIFORM,
        });
        let globals_bind = self.device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("berx-globals"),
            layout: &self.globals_layout,
            entries: &[wgpu::BindGroupEntry { binding: 0, resource: globals_buffer.as_entire_binding() }],
        });

        let mut draws: Vec<Draw> = Vec::with_capacity(list.items.len().max(1));
        for item in &list.items {
            let mut pl_pos = [[0.0f32; 4]; 4];
            let mut pl_col = [[0.0f32; 4]; 4];
            let n = item.point_lights.len().min(4);
            for (i, l) in item.point_lights.iter().take(4).enumerate() {
                pl_pos[i] = [l.position.x, l.position.y, l.position.z, l.range];
                pl_col[i] = [l.colour[0], l.colour[1], l.colour[2], l.intensity];
            }
            draws.push(Draw {
                model: item.model,
                /* the half-extents the shader's media path needs; this
                   backend never sets the flag, so they go unread */
                base: [item.base[0], item.base[1], item.base[2], 0.5],
                emissive: [item.emissive[0], item.emissive[1], item.emissive[2], 0.5],
                surface: [item.metalness, item.roughness, item.opacity, item.transmission],
                pl_pos,
                pl_col,
                counts: [n as f32, 0.0, 0.0, 0.0],
            });
        }
        if draws.is_empty() {
            draws.push(Draw {
                model: [0.0; 16],
                base: [0.0; 4],
                emissive: [0.0; 4],
                surface: [0.0; 4],
                pl_pos: [[0.0; 4]; 4],
                pl_col: [[0.0; 4]; 4],
                counts: [0.0; 4],
            });
        }
        let draw_buffer = self.device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("berx-draws"),
            contents: bytemuck::cast_slice(&draws),
            usage: wgpu::BufferUsages::UNIFORM,
        });
        let draw_bind = self.device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("berx-draws"),
            layout: &self.draw_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: wgpu::BindingResource::Buffer(wgpu::BufferBinding {
                    buffer: &draw_buffer,
                    offset: 0,
                    size: NonZeroU64::new(DRAW_STRIDE),
                }),
            }],
        });

        Ok(Prepared {
            globals_bind,
            draw_bind,
            plan,
            mesh_variants: variants.len() as u32,
            clear: [list.clear_color[0], list.clear_color[1], list.clear_color[2]],
            skipped: list
                .items
                .iter()
                .filter(|i| i.media.is_some() || i.label.as_deref().map(|l| !l.trim().is_empty()).unwrap_or(false))
                .count() as u32,
        })
    }

    /// The multisampled colour and depth a pass of this size needs.
    ///
    /// A window supplies its own resolve target — the swapchain image —
    /// so only these two are its to make.
    pub fn pass_targets(&self, width: u32, height: u32) -> (wgpu::Texture, wgpu::Texture) {
        let msaa = self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("berx-colour-msaa"),
            size: wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: SAMPLE_COUNT,
            dimension: wgpu::TextureDimension::D2,
            format: self.format,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        });
        let depth = self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("berx-depth"),
            size: wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: SAMPLE_COUNT,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Depth32Float,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        });
        (msaa, depth)
    }

    /// The offscreen set: multisampled colour, the image it resolves to,
    /// and depth. The resolve target is copyable, because the whole
    /// point of the offscreen path is reading it back.
    fn offscreen_targets(&self, width: u32, height: u32) -> (wgpu::TextureView, wgpu::Texture, wgpu::TextureView, wgpu::TextureView) {
        let (msaa, depth) = self.pass_targets(width, height);
        let colour = self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("berx-colour"),
            size: wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: self.format,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::COPY_SRC,
            view_formats: &[],
        });
        let colour_view = colour.create_view(&Default::default());
        (msaa.create_view(&Default::default()), colour, colour_view, depth.create_view(&Default::default()))
    }

    /// Everything a recorded pass needs, built once per frame.
    ///
    /// Record the world pass into whatever the caller is drawing into.
    ///
    /// `resolve` is where the multisampled colour lands: an offscreen
    /// texture for verification, a swapchain image for a window. The
    /// pass itself does not know or care which.
    pub fn record(
        &self,
        prepared: &Prepared,
        encoder: &mut wgpu::CommandEncoder,
        msaa_view: &wgpu::TextureView,
        resolve_view: &wgpu::TextureView,
        depth_view: &wgpu::TextureView,
    ) -> FrameStats {
        let mut stats = FrameStats { mesh_variants: prepared.mesh_variants, skipped: prepared.skipped, ..Default::default() };
        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("berx-world"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view: msaa_view,
                resolve_target: Some(resolve_view),
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color {
                        r: prepared.clear[0] as f64,
                        g: prepared.clear[1] as f64,
                        b: prepared.clear[2] as f64,
                        a: 1.0,
                    }),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                view: depth_view,
                depth_ops: Some(wgpu::Operations { load: wgpu::LoadOp::Clear(1.0), store: wgpu::StoreOp::Store }),
                stencil_ops: None,
            }),
            timestamp_writes: None,
            occlusion_query_set: None,
        });
        pass.set_pipeline(&self.pipeline);
        pass.set_bind_group(0, &prepared.globals_bind, &[]);
        pass.set_bind_group(2, &self.media_bind, &[]);
        for (i, (key, count)) in prepared.plan.iter().enumerate() {
            let m = self.meshes.get(key).expect("planned");
            pass.set_bind_group(1, &prepared.draw_bind, &[(i as u64 * DRAW_STRIDE) as u32]);
            pass.set_vertex_buffer(0, m.vertices.slice(..));
            pass.set_index_buffer(m.indices.slice(..), wgpu::IndexFormat::Uint16);
            pass.draw_indexed(0..*count, 0, 0..1);
            stats.draw_calls += 1;
            stats.triangles += count / 3;
        }
        stats
    }

    /// Draw the list into an offscreen target and read the pixels back.
    ///
    /// The readback is the point: a native backend that renders and is
    /// never observed proves nothing, so every frame this function
    /// produces comes back off the GPU as real bytes the caller can
    /// compare against the web backend's own.
    pub fn render(&mut self, list: &DrawList) -> Result<Readback, String> {
        let width = list.width.max(1);
        let height = list.height.max(1);
        let prepared = self.prepare(list)?;
        let (msaa_view, colour, colour_view, depth_view) = self.offscreen_targets(width, height);

        /* readback rows are padded to 256 bytes, as the API requires */
        let unpadded = width * 4;
        let padded = ((unpadded + 255) / 256) * 256;
        let staging = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("berx-readback"),
            size: (padded * height) as u64,
            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        let mut encoder = self.device.create_command_encoder(&Default::default());
        let stats = self.record(&prepared, &mut encoder, &msaa_view, &colour_view, &depth_view);
        encoder.copy_texture_to_buffer(
            wgpu::ImageCopyTexture {
                texture: &colour,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::ImageCopyBuffer {
                buffer: &staging,
                layout: wgpu::ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(padded),
                    rows_per_image: Some(height),
                },
            },
            wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
        );
        self.queue.submit(Some(encoder.finish()));

        let slice = staging.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        slice.map_async(wgpu::MapMode::Read, move |r| {
            let _ = tx.send(r);
        });
        self.device.poll(wgpu::Maintain::Wait);
        rx.recv()
            .map_err(|e| format!("BERX 5D native: readback never completed: {e}"))?
            .map_err(|e| format!("BERX 5D native: readback failed: {e}"))?;

        let data = slice.get_mapped_range();
        let mut rgba = Vec::with_capacity((unpadded * height) as usize);
        for row in 0..height {
            let start = (row * padded) as usize;
            rgba.extend_from_slice(&data[start..start + unpadded as usize]);
        }
        drop(data);
        staging.unmap();

        /* items this backend has no path for were counted in prepare,
           never faked */
        Ok(Readback { width, height, rgba, stats })
    }
}
