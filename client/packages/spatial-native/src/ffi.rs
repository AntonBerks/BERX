//! The renderer, across a C ABI.
//!
//! Android reaches this through JNI and iOS through Swift, and neither
//! can call Rust directly. What crosses the boundary is deliberately the
//! same thing that crosses every other boundary in BERX: a draw list the
//! shared TypeScript core produced, as JSON. Nothing about the world is
//! passed in pieces, because nothing about the world is decided here.
//!
//! Every function is `extern "C"`, takes and returns plain pointers and
//! lengths, and never unwinds across the boundary — a Rust panic
//! crossing into the JVM or into Swift is undefined behaviour, so each
//! entry point catches its own.
//!
//! This is exercised on the host by the crate's own tests, so the ABI is
//! real and checked here even though the platforms that will call it
//! cannot be built in this environment.

use std::ffi::{c_char, c_int, c_uchar, c_uint, CStr};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::ptr;

use crate::{drawlist::DrawList, NativeRenderer, Readback};

/// An opaque renderer handle. Only this module ever looks inside it.
pub struct BerxNative {
    renderer: NativeRenderer,
    last: Option<Readback>,
    error: Option<String>,
}

/// Create a renderer on this device's GPU.
///
/// Returns null when there is no adapter — a caller that gets null must
/// report it, not draw something else.
///
/// # Safety
/// The returned pointer must be released with `berx_native_destroy`.
#[no_mangle]
pub extern "C" fn berx_native_create() -> *mut BerxNative {
    match catch_unwind(|| NativeRenderer::new()) {
        Ok(Ok(renderer)) => Box::into_raw(Box::new(BerxNative { renderer, last: None, error: None })),
        Ok(Err(_)) | Err(_) => ptr::null_mut(),
    }
}

/// Render a draw list, given as NUL-terminated JSON.
///
/// Returns 0 on success and a negative code otherwise: -1 for a null
/// argument, -2 for JSON that does not match the shared core's shape,
/// -3 for a GPU failure. The reason for the last two is retrievable
/// with `berx_native_last_error`.
///
/// # Safety
/// `handle` must come from `berx_native_create`, and `json` must be a
/// valid NUL-terminated string for the duration of the call.
#[no_mangle]
pub unsafe extern "C" fn berx_native_render(handle: *mut BerxNative, json: *const c_char) -> c_int {
    if handle.is_null() || json.is_null() {
        return -1;
    }
    let native = &mut *handle;
    let result = catch_unwind(AssertUnwindSafe(|| {
        let text = CStr::from_ptr(json).to_str().map_err(|e| format!("draw list is not UTF-8: {e}"))?;
        let list: DrawList = serde_json::from_str(text)
            .map_err(|e| format!("draw list does not match the shared core's shape: {e}"))?;
        native.renderer.render(&list)
    }));
    match result {
        Ok(Ok(readback)) => {
            native.last = Some(readback);
            native.error = None;
            0
        }
        Ok(Err(message)) => {
            let json_shape = message.contains("shape") || message.contains("UTF-8");
            native.error = Some(message);
            native.last = None;
            if json_shape { -2 } else { -3 }
        }
        Err(_) => {
            native.error = Some("BERX 5D native: the renderer panicked".into());
            native.last = None;
            -3
        }
    }
}

/// The width, height and byte length of the last rendered frame.
///
/// Zeros when nothing has been rendered, so a caller can tell an empty
/// handle from a black frame.
///
/// # Safety
/// `handle` must come from `berx_native_create`; the out pointers must
/// each be writable or null.
#[no_mangle]
pub unsafe extern "C" fn berx_native_frame_size(
    handle: *const BerxNative,
    width: *mut c_uint,
    height: *mut c_uint,
    bytes: *mut c_uint,
) -> c_int {
    if handle.is_null() {
        return -1;
    }
    let native = &*handle;
    let (w, h, n) = match native.last.as_ref() {
        Some(readback) => (readback.width, readback.height, readback.rgba.len() as u32),
        None => (0, 0, 0),
    };
    if !width.is_null() {
        *width = w;
    }
    if !height.is_null() {
        *height = h;
    }
    if !bytes.is_null() {
        *bytes = n;
    }
    0
}

/// Copy the last rendered frame out as tightly packed RGBA8, top row first.
///
/// Returns the number of bytes written, or a negative code: -1 for a
/// null argument, -2 when nothing has been rendered, -3 when the buffer
/// is too small — the caller sizes it with `berx_native_frame_size`.
///
/// # Safety
/// `out` must be writable for `capacity` bytes.
#[no_mangle]
pub unsafe extern "C" fn berx_native_copy_frame(
    handle: *const BerxNative,
    out: *mut c_uchar,
    capacity: c_uint,
) -> c_int {
    if handle.is_null() || out.is_null() {
        return -1;
    }
    let native = &*handle;
    let Some(readback) = native.last.as_ref() else {
        return -2;
    };
    if (capacity as usize) < readback.rgba.len() {
        return -3;
    }
    ptr::copy_nonoverlapping(readback.rgba.as_ptr(), out, readback.rgba.len());
    readback.rgba.len() as c_int
}

/// Why the last call failed, as NUL-terminated UTF-8, or null.
///
/// The string is owned by the handle and valid until the next call on
/// it. Nothing is invented: where there is no failure there is no string.
///
/// # Safety
/// `handle` must come from `berx_native_create`.
#[no_mangle]
pub unsafe extern "C" fn berx_native_last_error(handle: *const BerxNative, out: *mut c_char, capacity: c_uint) -> c_int {
    if handle.is_null() || out.is_null() {
        return -1;
    }
    let native = &*handle;
    let Some(message) = native.error.as_ref() else {
        return 0;
    };
    let bytes = message.as_bytes();
    let room = capacity as usize;
    if room == 0 {
        return -3;
    }
    let n = bytes.len().min(room - 1);
    ptr::copy_nonoverlapping(bytes.as_ptr() as *const c_char, out, n);
    *out.add(n) = 0;
    n as c_int
}

/// What this backend genuinely does, as a bitmask.
///
/// Bit 0 perspective, 1 depth buffer, 2 physically lit materials,
/// 3 shadows, 4 post-processing, 5 media surfaces, 6 world-space labels,
/// 7 volumetric light.
/// The last four are zero, and they stay zero until the passes exist.
#[no_mangle]
pub extern "C" fn berx_native_capabilities() -> c_uint {
    let c = crate::CAPABILITIES;
    (c.perspective as c_uint)
        | ((c.depth_buffer as c_uint) << 1)
        | ((c.physically_lit_materials as c_uint) << 2)
        | ((c.shadows as c_uint) << 3)
        | ((c.post_processing as c_uint) << 4)
        | ((c.media_surfaces as c_uint) << 5)
        | ((c.world_space_labels as c_uint) << 6)
        | ((c.volumetric as c_uint) << 7)
}

/// Release a renderer and everything it holds on the GPU.
///
/// # Safety
/// `handle` must come from `berx_native_create` and must not be used
/// afterwards. Passing null is allowed and does nothing.
#[no_mangle]
pub unsafe extern "C" fn berx_native_destroy(handle: *mut BerxNative) {
    if handle.is_null() {
        return;
    }
    drop(Box::from_raw(handle));
}
