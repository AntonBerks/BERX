//! The C ABI, exercised the way a platform will exercise it.
//!
//! Android and iOS cannot be built in this environment, so what can be
//! checked here is the boundary itself: that a handle can be created,
//! that a real draw list renders through it, that the frame comes back
//! with the size it says it has, and that every failure path returns a
//! code and a reason rather than crashing across the boundary. If the
//! ABI were wrong, it would be wrong here too.

use std::ffi::{c_char, CString};

use berx_spatial_native::ffi::*;

/// A small but real draw list: the same shape the shared core emits.
fn draw_list(width: u32, height: u32) -> String {
    format!(
        r#"{{
        "width": {width}, "height": {height},
        "projection": [1.9538168,0,0,0, 0,2.605089,0,0, 0,0,-1.0010005,-1, 0,0,-0.20010005,0],
        "view": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-8,1],
        "camera": {{"x":0,"y":0,"z":8}},
        "clearColor": [0.027450981,0.03137255,0.039215688],
        "ambient": [0.11117647,0.13235295,0.15882353],
        "key": {{"direction":{{"x":0.36369648,"y":0.5819144,"z":0.7273930}},"colour":[0.9490196,0.9411765,0.92156863],"intensity":1.0}},
        "items": [{{
            "id": "person:77", "kind": "person", "primitive": "orb", "lod": 0,
            "model": [1.4,0,0,0, 0,1.4,0,0, 0,0,1.4,0, 0,0,0,1],
            "base": [0.9490196,0.9411765,0.92156863], "emissive": [0,0,0],
            "metalness": 0.04, "roughness": 0.34, "opacity": 1, "transmission": 0,
            "pointLights": [], "distance": 8
        }}],
        "labels": [], "actionSlots": [],
        "stats": {{"visible":1,"inFrustum":1,"budgetCut":0,"lodReduced":0}}
    }}"#
    )
}

#[test]
fn the_boundary_renders_a_real_frame() {
    let handle = berx_native_create();
    if handle.is_null() {
        eprintln!("BLOCKED: no GPU adapter in this environment; the ABI cannot be exercised");
        return;
    }
    let json = CString::new(draw_list(96, 64)).expect("json");
    let code = unsafe { berx_native_render(handle, json.as_ptr()) };
    assert_eq!(code, 0, "a valid draw list must render");

    let (mut w, mut h, mut bytes) = (0u32, 0u32, 0u32);
    let size = unsafe { berx_native_frame_size(handle, &mut w, &mut h, &mut bytes) };
    assert_eq!(size, 0);
    assert_eq!((w, h), (96, 64), "the frame is the size the draw list asked for");
    assert_eq!(bytes, 96 * 64 * 4, "tightly packed RGBA8");

    let mut pixels = vec![0u8; bytes as usize];
    let copied = unsafe { berx_native_copy_frame(handle, pixels.as_mut_ptr(), bytes) };
    assert_eq!(copied as u32, bytes);

    /* the ground is #07080A and the orb is not: a frame that came back
       all one colour would mean nothing was drawn */
    let ground = [7u8, 8, 10];
    let lit = pixels
        .chunks_exact(4)
        .filter(|p| {
            (p[0] as i32 - ground[0] as i32).abs() > 3
                || (p[1] as i32 - ground[1] as i32).abs() > 3
                || (p[2] as i32 - ground[2] as i32).abs() > 3
        })
        .count();
    assert!(lit > 0, "the frame has no world in it");
    assert!(lit < 96 * 64, "the frame is entirely world, so nothing was cleared");

    unsafe { berx_native_destroy(handle) };
}

#[test]
fn a_buffer_that_is_too_small_is_refused() {
    let handle = berx_native_create();
    if handle.is_null() {
        return;
    }
    let json = CString::new(draw_list(32, 32)).expect("json");
    assert_eq!(unsafe { berx_native_render(handle, json.as_ptr()) }, 0);
    let mut tiny = [0u8; 16];
    assert_eq!(unsafe { berx_native_copy_frame(handle, tiny.as_mut_ptr(), tiny.len() as u32) }, -3);
    unsafe { berx_native_destroy(handle) };
}

#[test]
fn a_draw_list_of_the_wrong_shape_is_rejected_with_a_reason() {
    let handle = berx_native_create();
    if handle.is_null() {
        return;
    }
    let json = CString::new(r#"{"width": 8}"#).expect("json");
    assert_eq!(unsafe { berx_native_render(handle, json.as_ptr()) }, -2, "a wrong shape is a shape error");

    let mut buffer = [0 as c_char; 256];
    let n = unsafe { berx_native_last_error(handle, buffer.as_mut_ptr(), buffer.len() as u32) };
    assert!(n > 0, "a rejected draw list must say why");
    let reason = unsafe { std::ffi::CStr::from_ptr(buffer.as_ptr()) }.to_string_lossy().to_string();
    assert!(reason.contains("shape"), "the reason names the problem: {reason}");

    /* and nothing is left behind pretending to be a frame */
    let (mut w, mut h, mut bytes) = (1u32, 1u32, 1u32);
    unsafe { berx_native_frame_size(handle, &mut w, &mut h, &mut bytes) };
    assert_eq!((w, h, bytes), (0, 0, 0));
    unsafe { berx_native_destroy(handle) };
}

#[test]
fn null_arguments_are_refused_rather_than_crashed_on() {
    assert_eq!(unsafe { berx_native_render(std::ptr::null_mut(), std::ptr::null()) }, -1);
    assert_eq!(unsafe { berx_native_frame_size(std::ptr::null(), std::ptr::null_mut(), std::ptr::null_mut(), std::ptr::null_mut()) }, -1);
    assert_eq!(unsafe { berx_native_copy_frame(std::ptr::null(), std::ptr::null_mut(), 0) }, -1);
    /* destroying nothing is allowed and does nothing */
    unsafe { berx_native_destroy(std::ptr::null_mut()) };
}

#[test]
fn the_capabilities_bitmask_says_only_what_is_implemented() {
    let bits = berx_native_capabilities();
    assert_eq!(bits & 0b1, 0b1, "perspective");
    assert_eq!(bits & 0b10, 0b10, "depth buffer");
    assert_eq!(bits & 0b100, 0b100, "physically lit materials");
    assert_eq!(bits & 0b1000, 0, "no shadow pass exists");
    assert_eq!(bits & 0b1_0000, 0, "no post chain exists");
    assert_eq!(bits & 0b10_0000, 0, "no image decoder exists");
    assert_eq!(bits & 0b100_0000, 0, "no text rasteriser exists");
}
