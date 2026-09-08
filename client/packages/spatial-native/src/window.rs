//! A real window, with a real swapchain.
//!
//! The offscreen renderer proves the shading. This proves the thing a
//! desktop application is: a surface owned by a window system, images
//! acquired from it, presented, and reacquired when the window changes
//! size. None of the shading is repeated here — the pipeline, the
//! shader and the pass all come from `NativeRenderer`, which is why a
//! window frame and an offscreen frame can be compared pixel for pixel
//! instead of merely looking similar.
//!
//! It still owns no world. The event loop that drives it reports what it
//! was told rather than acting on it: navigation belongs to the shared
//! core, and a window shell that started moving a camera of its own
//! would be a second BERX.

use raw_window_handle::{HasDisplayHandle, HasWindowHandle};

use crate::{drawlist::DrawList, FrameStats, NativeRenderer};

pub struct WindowRenderer {
    renderer: NativeRenderer,
    surface: wgpu::Surface<'static>,
    config: wgpu::SurfaceConfiguration,
    msaa: wgpu::Texture,
    depth: wgpu::Texture,
    stats: FrameStats,
}

impl WindowRenderer {
    /// Build a renderer for this window's surface.
    ///
    /// The adapter has to be one the surface is actually compatible
    /// with, and the pipeline has to be built for the format the
    /// swapchain chose — asking for the wrong one is rejected outright
    /// rather than drawn wrongly.
    pub fn new<W>(window: &W, width: u32, height: u32) -> Result<Self, String>
    where
        W: HasWindowHandle + HasDisplayHandle,
    {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..Default::default()
        });
        let surface = unsafe {
            let target = wgpu::SurfaceTargetUnsafe::from_window(window)
                .map_err(|e| format!("BERX 5D native: this window exposes no surface: {e}"))?;
            instance
                .create_surface_unsafe(target)
                .map_err(|e| format!("BERX 5D native: no surface on this window: {e}"))?
        };
        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: Some(&surface),
            force_fallback_adapter: false,
        }))
        .ok_or_else(|| "BERX 5D native: no GPU adapter can draw to this window".to_string())?;

        let caps = surface.get_capabilities(&adapter);
        /* the swapchain's own format, not one this crate would prefer:
           a pipeline that disagrees with it is invalid */
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|f| !f.is_srgb())
            .unwrap_or(caps.formats[0]);
        let renderer = NativeRenderer::on(&adapter, format)?;

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::COPY_SRC,
            format,
            width: width.max(1),
            height: height.max(1),
            present_mode: caps.present_modes[0],
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(renderer.device(), &config);
        let (msaa, depth) = renderer.pass_targets(config.width, config.height);

        Ok(Self { renderer, surface, config, msaa, depth, stats: FrameStats::default() })
    }

    pub fn adapter(&self) -> (&str, &str) {
        self.renderer.adapter()
    }

    pub fn surface_format(&self) -> String {
        format!("{:?}", self.config.format)
    }

    pub fn stats(&self) -> FrameStats {
        self.stats.clone()
    }

    /// The window changed size, so the swapchain and both attachments do.
    pub fn resize(&mut self, width: u32, height: u32) {
        if width == self.config.width && height == self.config.height {
            return;
        }
        self.config.width = width.max(1);
        self.config.height = height.max(1);
        self.surface.configure(self.renderer.device(), &self.config);
        let (msaa, depth) = self.renderer.pass_targets(self.config.width, self.config.height);
        self.msaa = msaa;
        self.depth = depth;
    }

    /// Draw the list into the next swapchain image and present it.
    ///
    /// With `capture`, the presented image is also copied back, so what
    /// a window actually showed can be compared against what the
    /// offscreen path produced rather than assumed to match it.
    pub fn present(&mut self, list: &DrawList, capture: bool) -> Result<Option<Vec<u8>>, String> {
        let frame = match self.surface.get_current_texture() {
            Ok(f) => f,
            Err(wgpu::SurfaceError::Outdated) | Err(wgpu::SurfaceError::Lost) => {
                /* the window system took the swapchain away; rebuilding it
                   is the normal path, not an error */
                self.surface.configure(self.renderer.device(), &self.config);
                self.surface
                    .get_current_texture()
                    .map_err(|e| format!("BERX 5D native: no swapchain image after reconfiguring: {e}"))?
            }
            Err(e) => return Err(format!("BERX 5D native: no swapchain image: {e}")),
        };
        let view = frame.texture.create_view(&Default::default());
        let msaa_view = self.msaa.create_view(&Default::default());
        let depth_view = self.depth.create_view(&Default::default());

        let prepared = self.renderer.prepare(list)?;
        let mut encoder = self.renderer.device().create_command_encoder(&Default::default());
        self.stats = self.renderer.record(&prepared, &mut encoder, &msaa_view, &view, &depth_view);

        let width = self.config.width;
        let height = self.config.height;
        let unpadded = width * 4;
        let padded = ((unpadded + 255) / 256) * 256;
        let staging = capture.then(|| {
            self.renderer.device().create_buffer(&wgpu::BufferDescriptor {
                label: Some("berx-window-readback"),
                size: (padded * height) as u64,
                usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
                mapped_at_creation: false,
            })
        });
        if let Some(buffer) = staging.as_ref() {
            encoder.copy_texture_to_buffer(
                wgpu::ImageCopyTexture {
                    texture: &frame.texture,
                    mip_level: 0,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                wgpu::ImageCopyBuffer {
                    buffer,
                    layout: wgpu::ImageDataLayout {
                        offset: 0,
                        bytes_per_row: Some(padded),
                        rows_per_image: Some(height),
                    },
                },
                wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
            );
        }
        self.renderer.queue().submit(Some(encoder.finish()));

        let pixels = if let Some(buffer) = staging {
            let slice = buffer.slice(..);
            let (tx, rx) = std::sync::mpsc::channel();
            slice.map_async(wgpu::MapMode::Read, move |r| {
                let _ = tx.send(r);
            });
            self.renderer.device().poll(wgpu::Maintain::Wait);
            rx.recv()
                .map_err(|e| format!("BERX 5D native: window readback never completed: {e}"))?
                .map_err(|e| format!("BERX 5D native: window readback failed: {e}"))?;
            let data = slice.get_mapped_range();
            let mut rgba = Vec::with_capacity((unpadded * height) as usize);
            for row in 0..height {
                let start = (row * padded) as usize;
                rgba.extend_from_slice(&data[start..start + unpadded as usize]);
            }
            drop(data);
            buffer.unmap();
            Some(rgba)
        } else {
            None
        };

        frame.present();
        Ok(pixels)
    }
}
