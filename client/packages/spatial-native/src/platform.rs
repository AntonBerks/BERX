//! The renderer, on a surface a mobile platform owns.
//!
//! Android hands out an `ANativeWindow`; iOS hands out a `CAMetalLayer`.
//! Neither is a window this crate created, and neither is reachable from
//! Rust's own windowing — so these entry points take the platform's own
//! pointer, build a wgpu surface on it, and present the shared core's
//! draw list to it. The renderer, the shader and the pass are the same
//! ones the desktop window and the offscreen path use; the surface is
//! the only difference, which is exactly what BERX says a platform is
//! allowed to change.
//!
//! Both are compiled only for their own platform. The Android path is
//! checked here for `aarch64-linux-android`; the iOS path cannot be,
//! because its dependencies need Xcode's toolchain, and that is recorded
//! as a blocker rather than left to look verified.

#![allow(clippy::missing_safety_doc)]

#[cfg(any(target_os = "android", target_os = "ios"))]
use std::ffi::{c_int, c_void};
#[cfg(any(target_os = "android", target_os = "ios"))]
use std::ptr::NonNull;

use crate::drawlist::DrawList;
use crate::NativeRenderer;

/// A surface a platform gave us, and everything needed to draw to it.
pub struct SurfaceSession {
    renderer: NativeRenderer,
    surface: wgpu::Surface<'static>,
    config: wgpu::SurfaceConfiguration,
    msaa: wgpu::Texture,
    depth: wgpu::Texture,
}

impl SurfaceSession {
    /// Build a session on a raw platform surface.
    ///
    /// # Safety
    /// `window` and `display` must describe a surface that outlives this
    /// session — on Android that means the `ANativeWindow` must not be
    /// released while it is in use, and on iOS the layer must not be
    /// deallocated.
    pub unsafe fn new(
        window: raw_window_handle::RawWindowHandle,
        display: raw_window_handle::RawDisplayHandle,
        width: u32,
        height: u32,
    ) -> Result<Self, String> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..Default::default()
        });
        let surface = instance
            .create_surface_unsafe(wgpu::SurfaceTargetUnsafe::RawHandle {
                raw_display_handle: display,
                raw_window_handle: window,
            })
            .map_err(|e| format!("BERX 5D native: no surface on this platform handle: {e}"))?;
        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: Some(&surface),
            force_fallback_adapter: false,
        }))
        .ok_or_else(|| "BERX 5D native: no GPU adapter can draw to this surface".to_string())?;

        let caps = surface.get_capabilities(&adapter);
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|f| !f.is_srgb())
            .unwrap_or(caps.formats[0]);
        let renderer = NativeRenderer::on(&adapter, format)?;
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
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
        Ok(Self { renderer, surface, config, msaa, depth })
    }

    /// The surface changed size — a rotation, a split screen, a keyboard.
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

    /// Draw the list into the next surface image and present it.
    pub fn present(&mut self, list: &DrawList) -> Result<(), String> {
        let frame = match self.surface.get_current_texture() {
            Ok(f) => f,
            Err(wgpu::SurfaceError::Outdated) | Err(wgpu::SurfaceError::Lost) => {
                self.surface.configure(self.renderer.device(), &self.config);
                self.surface
                    .get_current_texture()
                    .map_err(|e| format!("BERX 5D native: no surface image after reconfiguring: {e}"))?
            }
            Err(e) => return Err(format!("BERX 5D native: no surface image: {e}")),
        };
        let view = frame.texture.create_view(&Default::default());
        let msaa_view = self.msaa.create_view(&Default::default());
        let depth_view = self.depth.create_view(&Default::default());
        let prepared = self.renderer.prepare(list)?;
        let mut encoder = self.renderer.device().create_command_encoder(&Default::default());
        self.renderer.record(&prepared, &mut encoder, &msaa_view, &view, &depth_view);
        self.renderer.queue().submit(Some(encoder.finish()));
        frame.present();
        Ok(())
    }
}

/// Android: a session on an `ANativeWindow`.
///
/// # Safety
/// `native_window` must be a live `ANativeWindow*` obtained from
/// `ANativeWindow_fromSurface`, and must outlive the session.
#[cfg(target_os = "android")]
#[no_mangle]
pub unsafe extern "C" fn berx_native_surface_android(
    native_window: *mut c_void,
    width: u32,
    height: u32,
) -> *mut SurfaceSession {
    let Some(pointer) = NonNull::new(native_window) else {
        return std::ptr::null_mut();
    };
    let window = raw_window_handle::RawWindowHandle::AndroidNdk(
        raw_window_handle::AndroidNdkWindowHandle::new(pointer),
    );
    let display = raw_window_handle::RawDisplayHandle::Android(
        raw_window_handle::AndroidDisplayHandle::new(),
    );
    match SurfaceSession::new(window, display, width, height) {
        Ok(session) => Box::into_raw(Box::new(session)),
        Err(_) => std::ptr::null_mut(),
    }
}

/// iOS: a session on a `CAMetalLayer`.
///
/// # Safety
/// `metal_layer` must be a live `CAMetalLayer*` and must outlive the
/// session.
#[cfg(target_os = "ios")]
#[no_mangle]
pub unsafe extern "C" fn berx_native_surface_ios(
    metal_layer: *mut c_void,
    width: u32,
    height: u32,
) -> *mut SurfaceSession {
    let Some(pointer) = NonNull::new(metal_layer) else {
        return std::ptr::null_mut();
    };
    let window = raw_window_handle::RawWindowHandle::UiKit({
        let mut handle = raw_window_handle::UiKitWindowHandle::new(pointer);
        handle.ui_view_controller = None;
        handle
    });
    let display = raw_window_handle::RawDisplayHandle::UiKit(
        raw_window_handle::UiKitDisplayHandle::new(),
    );
    match SurfaceSession::new(window, display, width, height) {
        Ok(session) => Box::into_raw(Box::new(session)),
        Err(_) => std::ptr::null_mut(),
    }
}

/// Present one frame of a NUL-terminated JSON draw list to the surface.
///
/// Returns 0, or -1 for a null argument, -2 for JSON that does not match
/// the shared core's shape, -3 for a GPU failure.
///
/// # Safety
/// `session` must come from one of the platform constructors above, and
/// `json` must be a valid NUL-terminated string for the call.
#[cfg(any(target_os = "android", target_os = "ios"))]
#[no_mangle]
pub unsafe extern "C" fn berx_native_surface_present(
    session: *mut SurfaceSession,
    json: *const std::ffi::c_char,
) -> c_int {
    if session.is_null() || json.is_null() {
        return -1;
    }
    let session = &mut *session;
    let Ok(text) = std::ffi::CStr::from_ptr(json).to_str() else {
        return -2;
    };
    let Ok(list) = serde_json::from_str::<DrawList>(text) else {
        return -2;
    };
    match session.present(&list) {
        Ok(()) => 0,
        Err(_) => -3,
    }
}

/// The surface changed size.
///
/// # Safety
/// `session` must come from one of the platform constructors above.
#[cfg(any(target_os = "android", target_os = "ios"))]
#[no_mangle]
pub unsafe extern "C" fn berx_native_surface_resize(session: *mut SurfaceSession, width: u32, height: u32) {
    if session.is_null() {
        return;
    }
    (*session).resize(width, height);
}

/// Release a surface session.
///
/// # Safety
/// `session` must come from one of the platform constructors above and
/// must not be used afterwards.
#[cfg(any(target_os = "android", target_os = "ios"))]
#[no_mangle]
pub unsafe extern "C" fn berx_native_surface_destroy(session: *mut SurfaceSession) {
    if session.is_null() {
        return;
    }
    drop(Box::from_raw(session));
}

/// The JNI entry points `com.berx.native.BerxNative` declares.
///
/// One function per native method, each doing the minimum a JNI boundary
/// needs and nothing else: turn the Java `Surface` into an
/// `ANativeWindow`, turn the Java string into a `&str`, and call the
/// same session the desktop and offscreen paths use. There is no world
/// on this side of the boundary either.
///
/// The bindings come from the `jni` and `ndk` crates rather than from a
/// hand-written function table. The table is possible to write by hand
/// and a bad idea: its indices cannot be checked from here, and a wrong
/// one fails as memory corruption rather than as an error.
#[cfg(target_os = "android")]
pub mod jni_bridge {
    use jni::objects::{JClass, JObject, JString};
    use jni::sys::{jint, jlong};
    use jni::JNIEnv;

    use super::SurfaceSession;

    /// `BerxNative.nativeOpen`. Returns a session pointer as a jlong, or 0.
    ///
    /// # Safety
    /// Called by the JVM with a live env and surface.
    #[no_mangle]
    pub unsafe extern "system" fn Java_com_berx_native_BerxNative_nativeOpen(
        env: JNIEnv,
        _class: JClass,
        surface: JObject,
        width: jint,
        height: jint,
    ) -> jlong {
        let Some(window) = ndk::native_window::NativeWindow::from_surface(env.get_raw(), surface.as_raw()) else {
            return 0;
        };
        /* the session owns the window for as long as it draws to it;
           forgetting the wrapper hands that ownership over rather than
           releasing it at the end of this call */
        let pointer = window.ptr().as_ptr() as *mut std::ffi::c_void;
        std::mem::forget(window);
        let session = super::berx_native_surface_android(pointer, width.max(1) as u32, height.max(1) as u32);
        session as jlong
    }

    /// `BerxNative.nativePresent`.
    ///
    /// # Safety
    /// `session` must be a pointer this module returned.
    #[no_mangle]
    pub unsafe extern "system" fn Java_com_berx_native_BerxNative_nativePresent(
        mut env: JNIEnv,
        _class: JClass,
        session: jlong,
        json: JString,
    ) -> jint {
        if session == 0 {
            return -1;
        }
        let Ok(text) = env.get_string(&json) else {
            return -1;
        };
        let Ok(cstring) = std::ffi::CString::new(text.to_bytes()) else {
            return -2;
        };
        super::berx_native_surface_present(session as *mut SurfaceSession, cstring.as_ptr())
    }

    /// `BerxNative.nativeResize`.
    ///
    /// # Safety
    /// `session` must be a pointer this module returned.
    #[no_mangle]
    pub unsafe extern "system" fn Java_com_berx_native_BerxNative_nativeResize(
        _env: JNIEnv,
        _class: JClass,
        session: jlong,
        width: jint,
        height: jint,
    ) {
        if session == 0 {
            return;
        }
        super::berx_native_surface_resize(session as *mut SurfaceSession, width.max(1) as u32, height.max(1) as u32);
    }

    /// `BerxNative.nativeClose`.
    ///
    /// # Safety
    /// `session` must be a pointer this module returned and must not be
    /// used afterwards.
    #[no_mangle]
    pub unsafe extern "system" fn Java_com_berx_native_BerxNative_nativeClose(
        _env: JNIEnv,
        _class: JClass,
        session: jlong,
    ) {
        if session == 0 {
            return;
        }
        super::berx_native_surface_destroy(session as *mut SurfaceSession);
    }
}
