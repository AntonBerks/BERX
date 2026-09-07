//! BERX on a desktop window.
//!
//! `berx-render` proves the native backend draws by rendering offscreen
//! and reading the pixels back. That is the right way to verify shading,
//! and it is not a desktop application: a real one owns a window, a
//! swapchain, a resize path and an event loop, and none of that was
//! exercised by rendering into a texture nobody presents.
//!
//! This is that shell. It is deliberately still only a shell — it opens
//! a window, configures a surface on it, and presents frames from a draw
//! list the shared TypeScript core produced. It holds no world, no
//! camera and no navigation, because BERX has exactly one of each and
//! they are not here. Input is read and reported as intents rather than
//! acted on, for the same reason: acting on it would mean this binary
//! had started deciding where the viewer is.
//!
//! Usage: berx-window <draw-list.json> [--frames N] [--rgba out.rgba] [--resize WxH]
//!
//! With `--frames` it presents that many frames and exits, which is what
//! makes it verifiable in a headless environment under Xvfb. With
//! `--rgba` the last presented frame is copied off the swapchain and
//! written out, so what a window actually showed can be compared against
//! what the offscreen renderer produced.

use std::io::Write;

use berx_spatial_native::{drawlist::DrawList, WindowRenderer};
use winit::{
    dpi::LogicalSize,
    event::{ElementState, Event, KeyEvent, MouseButton, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    keyboard::{Key, NamedKey},
    window::WindowBuilder,
};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let Some(path) = args.get(1) else {
        eprintln!("usage: berx-window <draw-list.json> [--frames N] [--rgba out.rgba] [--resize WxH]");
        std::process::exit(2);
    };
    let frame_limit: Option<u32> = args
        .iter()
        .position(|a| a == "--frames")
        .and_then(|i| args.get(i + 1))
        .and_then(|n| n.parse().ok());
    let rgba_out = args
        .iter()
        .position(|a| a == "--rgba")
        .and_then(|i| args.get(i + 1))
        .cloned();
    /* a real resize, asked of the window system rather than simulated:
       the swapchain and both attachments have to be rebuilt for it, and
       a shell that never resizes has never exercised that */
    let resize_to: Option<(u32, u32)> = args
        .iter()
        .position(|a| a == "--resize")
        .and_then(|i| args.get(i + 1))
        .and_then(|s| s.split_once('x'))
        .and_then(|(w, h)| Some((w.parse().ok()?, h.parse().ok()?)));

    let source = match std::fs::read_to_string(path) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("BERX 5D native: cannot read {path}: {e}");
            std::process::exit(1);
        }
    };
    let list: DrawList = match serde_json::from_str(&source) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("BERX 5D native: draw list does not match the shared core's shape: {e}");
            std::process::exit(1);
        }
    };

    let event_loop = match EventLoop::new() {
        Ok(l) => l,
        Err(e) => {
            eprintln!("BERX 5D native: no window system available: {e}");
            std::process::exit(3);
        }
    };
    let window = match WindowBuilder::new()
        .with_title("BERX")
        .with_inner_size(LogicalSize::new(list.width, list.height))
        .build(&event_loop)
    {
        Ok(w) => w,
        Err(e) => {
            eprintln!("BERX 5D native: the window system refused a window: {e}");
            std::process::exit(3);
        }
    };

    let mut renderer = match WindowRenderer::new(&window, list.width, list.height) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(4);
        }
    };

    let mut presented: u32 = 0;
    /* what the window was told, reported rather than acted on: this
       binary has no world to move */
    let mut intents: Vec<String> = Vec::new();
    let mut last_error: Option<String> = None;
    let mut captured: Option<Vec<u8>> = None;
    let mut resize_requested = false;
    let mut resized_to: Option<(u32, u32)> = None;

    event_loop.set_control_flow(ControlFlow::Poll);
    let result = event_loop.run(|event, target| match event {
        Event::WindowEvent { event, .. } => match event {
            WindowEvent::CloseRequested => {
                intents.push("close".into());
                target.exit();
            }
            WindowEvent::Resized(size) => {
                intents.push(format!("resize {}x{}", size.width, size.height));
                renderer.resize(size.width.max(1), size.height.max(1));
                if resize_requested {
                    resized_to = Some((size.width, size.height));
                }
            }
            WindowEvent::KeyboardInput {
                event: KeyEvent { logical_key, state: ElementState::Pressed, .. },
                ..
            } => {
                intents.push(match logical_key {
                    Key::Named(NamedKey::Escape) => "back".into(),
                    Key::Named(NamedKey::ArrowLeft) => "pan-left".into(),
                    Key::Named(NamedKey::ArrowRight) => "pan-right".into(),
                    Key::Named(NamedKey::ArrowUp) => "pan-up".into(),
                    Key::Named(NamedKey::ArrowDown) => "pan-down".into(),
                    other => format!("key {other:?}"),
                });
            }
            WindowEvent::MouseInput { state: ElementState::Pressed, button, .. } => {
                intents.push(match button {
                    MouseButton::Left => "select".into(),
                    other => format!("pointer {other:?}"),
                });
            }
            WindowEvent::RedrawRequested => {
                /* halfway through, ask the window system for a different
                   size, so what is measured afterwards is a swapchain
                   that really was rebuilt */
                if let Some((w, h)) = resize_to {
                    if !resize_requested && frame_limit.map(|n| presented * 2 >= n).unwrap_or(false) {
                        resize_requested = true;
                        let _ = window.request_inner_size(winit::dpi::PhysicalSize::new(w, h));
                    }
                }
                let want_capture = rgba_out.is_some()
                    && frame_limit.map(|n| presented + 1 >= n).unwrap_or(false);
                match renderer.present(&list, want_capture) {
                    Ok(pixels) => {
                        presented += 1;
                        if let Some(p) = pixels {
                            captured = Some(p);
                        }
                    }
                    Err(e) => {
                        last_error = Some(e);
                        target.exit();
                        return;
                    }
                }
                if frame_limit.map(|n| presented >= n).unwrap_or(false) {
                    target.exit();
                }
            }
            _ => {}
        },
        Event::AboutToWait => window.request_redraw(),
        _ => {}
    });

    if let Err(e) = result {
        eprintln!("BERX 5D native: the event loop failed: {e}");
        std::process::exit(5);
    }
    if let Some(e) = last_error {
        eprintln!("{e}");
        std::process::exit(4);
    }

    if let (Some(out), Some(pixels)) = (rgba_out.as_ref(), captured.as_ref()) {
        if let Err(e) = std::fs::write(out, pixels) {
            eprintln!("BERX 5D native: cannot write {out}: {e}");
            std::process::exit(5);
        }
    }

    let size = window.inner_size();
    let (adapter, backend) = renderer.adapter();
    let report = serde_json::json!({
        "adapter": adapter,
        "backend": backend,
        "surfaceFormat": renderer.surface_format(),
        "window": {"width": size.width, "height": size.height},
        "framesPresented": presented,
        "resizeRequested": resize_to.map(|(w, h)| format!("{w}x{h}")),
        "resizedTo": resized_to.map(|(w, h)| format!("{w}x{h}")),
        "drawCalls": renderer.stats().draw_calls,
        "triangles": renderer.stats().triangles,
        "listItems": list.items.len(),
        "intents": intents,
        "rgba": rgba_out,
        /* what a window shell still is not: it presents a draw list the
           shared core produced and reports what it was told, and it does
           not own a world to act on any of it */
        "capabilities": {"window": true, "swapchain": true, "resize": true, "inputReported": true, "worldNavigation": false},
    });
    let mut out = std::io::stdout();
    let _ = writeln!(out, "{}", serde_json::to_string(&report).expect("report"));
}
