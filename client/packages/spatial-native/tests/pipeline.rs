//! The pipeline, on the native backend.
//!
//! Every other check of this crate compares PIXELS, and a pixel
//! comparison has a blind spot the web backends both fell into: a
//! renderer that quietly stops encoding a pass, or encodes the same
//! passes in a different order, can still produce a frame that matches.
//! WebGPU skipped the volumetric march whenever occlusion was off;
//! WebGL2 composited the air before the particles rather than after,
//! which is invisible because both are additive.
//!
//! So `record` reports the name of every pass at the point it encodes
//! it, and this holds that report against the order @berx/spatial's
//! renderPipeline.ts declares. The declaration cannot be imported into
//! Rust, so it is written out here — and that duplication is the point
//! of the test: if either side changes, the two disagree and this fails.

use berx_spatial_native::drawlist::DrawList;
use berx_spatial_native::NativeRenderer;

/// A world with something to cast, air to march and motes in it.
///
/// The FFI test's list has none of those, so it exercises exactly the
/// passes this one is about and none of the ones it is not.
fn full_world(width: u32, height: u32) -> String {
    format!(
        r#"{{
        "width": {width}, "height": {height},
        "projection": [1.9538168,0,0,0, 0,2.605089,0,0, 0,0,-1.0010005,-1, 0,0,-0.20010005,0],
        "view": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-8,1],
        "invViewProjection": [0.51182,0,0,0, 0,0.38386,0,0, 0,0,0,-4.9975, 0,0,-1,5.0025],
        "camera": {{"x":0,"y":0,"z":8}},
        "clearColor": [0.027450981,0.03137255,0.039215688],
        "ambient": [0.11117647,0.13235295,0.15882353],
        "environment": [0.08235,0.09804,0.11765,0.55, 0.02745,0.03137,0.03922,32, 0.05098,0.06275,0.07843,1, 0,1,0,0, 0.30980,0.83922,0.90980,0],
        "volumetric": [0.055,0.45,24,0.85, 32,1,0,0],
        "worldTime": 0,
        "particles": [
            [0.65490,0.67843,0.70588,0.22, 24,0.08,0.035,26, 512,0,0,0, 0,0,0,0]
        ],
        "key": {{"direction":{{"x":0.36369648,"y":0.5819144,"z":0.7273930}},"colour":[0.9490196,0.9411765,0.92156863],"intensity":1.0}},
        "basis": {{"right":{{"x":1,"y":0,"z":0}},"up":{{"x":0,"y":1,"z":0}}}},
        "shadow": {{
            "view": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-6,1],
            "projection": [0.4,0,0,0, 0,0.4,0,0, 0,0,-0.08,0, 0,0,0,1],
            "viewProjection": [0.4,0,0,0, 0,0.4,0,0, 0,0,-0.08,0, 0,0,0.52,1],
            "texelWorldSize": 0.0024, "depthBias": 0.0015, "normalBias": 0.02,
            "mapSize": 512, "strength": 1
        }},
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
fn the_native_backend_encodes_the_declared_pipeline_in_order() {
    let mut renderer = match NativeRenderer::new() {
        Ok(r) => r,
        Err(e) => {
            eprintln!("BLOCKED: no GPU adapter in this environment ({e})");
            return;
        }
    };
    let list: DrawList = serde_json::from_str(&full_world(96, 64)).expect("the fixture parses");
    let frame = renderer.render(&list).expect("a full world renders");

    /* renderPipeline.ts, minus two stages this crate does not have.
       `labels`: no text rasteriser, so the shared core places names for
       it and it draws none — a declared BLOCKED capability rather than a
       faked one. `ssao`: no occlusion pass either, which is why the
       G-buffer here has exactly ONE consumer where the web backends have
       two. */
    let want = ["shadows", "gbuffer", "volumetric", "world", "particles", "composite"];
    assert_eq!(
        frame.stats.stages, want,
        "the native backend must encode the same passes, in the same order, as the two web backends: \
         the shadow map before anything that samples it, the G-buffer before the march that stops \
         against it, the march before the world pass whose result it is added to, and the air last \
         because it ADDS to what is behind it"
    );
}

#[test]
fn a_world_with_nothing_to_cast_still_draws_itself() {
    let mut renderer = match NativeRenderer::new() {
        Ok(r) => r,
        Err(e) => {
            eprintln!("BLOCKED: no GPU adapter in this environment ({e})");
            return;
        }
    };
    /* No shadow camera, so no shadow map — and therefore no march, because
       what the eye reads as a shaft IS the boundary between lit and unlit
       air, and there is nothing to draw that boundary. Not a limitation
       being worked around: the definition of a shaft.
        
       The G-buffer goes with it, and that is the difference between this
       crate and the web ones rather than a bug. There the buffer has two
       consumers — occlusion and the march — so turning one off leaves it
       standing, and WebGPU gating it on the wrong one was a real defect.
       Here the march is its only consumer, so with no march there is
       nothing for it to be built for. berxExpectedPasses says the same
       thing when asked with occlusion off. */
    let json = full_world(96, 64).replace("\"shadow\": {", "\"shadowDisabled\": {");
    let list: DrawList = serde_json::from_str(&json).expect("the fixture parses");
    let frame = renderer.render(&list).expect("a world with no casters renders");
    assert_eq!(
        frame.stats.stages,
        ["world", "particles"],
        "with nothing casting, the march, its composite and the G-buffer that fed it all drop out, \
         and the surfaces and their motes stay"
    );
}
