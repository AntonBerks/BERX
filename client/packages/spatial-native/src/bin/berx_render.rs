//! Render a BERX draw list on a real GPU and report what came back.
//!
//! Usage: berx-render <draw-list.json> [--png out.png] [--rgba out.rgba]
//!
//! Reads the draw list the shared TypeScript core produced, renders it
//! through wgpu, reads the pixels back off the GPU, and prints a JSON
//! summary on stdout: the adapter that ran it, the draw calls actually
//! issued, and measurements taken from the returned bytes. Nothing is
//! reported that was not read back.

use std::io::Write;

use berx_spatial_native::{drawlist::DrawList, NativeRenderer, CAPABILITIES};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let Some(path) = args.get(1) else {
        eprintln!("usage: berx-render <draw-list.json> [--png out.png] [--rgba out.rgba]");
        std::process::exit(2);
    };
    let png_out = args.iter().position(|a| a == "--png").and_then(|i| args.get(i + 1)).cloned();
    /* the raw bytes, for a comparison that must not go through an encoder */
    let rgba_out = args.iter().position(|a| a == "--rgba").and_then(|i| args.get(i + 1)).cloned();

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

    let mut renderer = match NativeRenderer::new() {
        Ok(r) => r,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(3);
        }
    };
    let readback = match renderer.render(&list) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(4);
        }
    };

    if let Some(out) = rgba_out.as_ref() {
        if let Err(e) = std::fs::write(out, &readback.rgba) {
            eprintln!("BERX 5D native: cannot write {out}: {e}");
            std::process::exit(5);
        }
    }

    if let Some(out) = png_out.as_ref() {
        let file = std::fs::File::create(out).expect("BERX 5D native: cannot create png");
        let mut encoder = png::Encoder::new(std::io::BufWriter::new(file), readback.width, readback.height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder
            .write_header()
            .expect("png header")
            .write_image_data(&readback.rgba)
            .expect("png data");
    }

    /* measured from the bytes that came back, not from what was submitted */
    let clear = [
        (list.clear_color[0] * 255.0).round() as i32,
        (list.clear_color[1] * 255.0).round() as i32,
        (list.clear_color[2] * 255.0).round() as i32,
    ];
    let mut lit = 0u32;
    let mut brightest = 0u32;
    let mut sum: u64 = 0;
    for p in readback.rgba.chunks_exact(4) {
        let (r, g, b) = (p[0] as i32, p[1] as i32, p[2] as i32);
        let luma = (r + g + b) as u32;
        sum += luma as u64;
        if luma > brightest {
            brightest = luma;
        }
        /* "not the ground" with room for sRGB rounding on the clear */
        if (r - clear[0]).abs() > 3 || (g - clear[1]).abs() > 3 || (b - clear[2]).abs() > 3 {
            lit += 1;
        }
    }
    let pixels = (readback.width * readback.height) as u64;

    let (adapter, backend) = renderer.adapter();
    let report = serde_json::json!({
        "adapter": adapter,
        "backend": backend,
        "width": readback.width,
        "height": readback.height,
        "drawCalls": readback.stats.draw_calls,
        "triangles": readback.stats.triangles,
        "meshVariants": readback.stats.mesh_variants,
        "itemsWithNoNativePath": readback.stats.skipped,
        "listItems": list.items.len(),
        "listStats": {
            "visible": list.stats.visible,
            "inFrustum": list.stats.in_frustum,
            "budgetCut": list.stats.budget_cut,
            "lodReduced": list.stats.lod_reduced,
        },
        "readback": {
            "nonGroundPixels": lit,
            "totalPixels": pixels,
            "brightestLuma": brightest,
            "meanLuma": if pixels > 0 { sum as f64 / pixels as f64 } else { 0.0 },
        },
        "capabilities": {
            "perspective": CAPABILITIES.perspective,
            "depthBuffer": CAPABILITIES.depth_buffer,
            "physicallyLitMaterials": CAPABILITIES.physically_lit_materials,
            "shadows": CAPABILITIES.shadows,
            "postProcessing": CAPABILITIES.post_processing,
            "mediaSurfaces": CAPABILITIES.media_surfaces,
            "worldSpaceLabels": CAPABILITIES.world_space_labels,
        },
        "png": png_out,
        "rgba": rgba_out,
    });
    let mut out = std::io::stdout();
    let _ = writeln!(out, "{}", serde_json::to_string(&report).expect("report"));
}
