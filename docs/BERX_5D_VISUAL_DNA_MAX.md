# BERX — 5D MAX Visual DNA

## Purpose
Define the visual architecture for the Web 5D runtime without creating a second world core. All world truth comes from `Berx5DFrame`.

## Core visual invariant
`Berx5DFrame -> spatial composition -> renderer -> post -> presentation`

DOM/UI may expose controls and semantic overlays, but it is never an authoritative source of spatial world state.

## Visual hierarchy
1. World is the hero: target 40–60% viewport occupancy on primary spatial scenes.
2. One dominant spatial subject per composition.
3. Secondary entities establish depth and context.
4. UI chrome remains subordinate and floats around the world rather than flattening it.
5. Media is immersive and edge-aware; controls appear as spatial affordances.

## BERX visual grammar
- Background: `#07080A`.
- Accent: `#4FD6E8`.
- Premium dark surfaces; glass is restricted to floating elements.
- Depth is communicated through scale, parallax, atmospheric falloff, lighting, blur and motion—not decorative clutter.
- Transitions are state-driven: dissolve, fold, warp, flow, teleport, collapse and bloom are permitted only when semantically justified.
- No browser-default visual controls leak into the product.

## 5D composition
- X/Y/Z: spatial placement and camera framing.
- T: live temporal state, event progression, memory/time navigation.
- R: relationship/context weight between entities.
- Camera framing is derived from world bounds and target occupancy, not arbitrary per-screen magic numbers.

## Exposure / presentation
- Scene renders to a linear floating-point working target.
- Surface transport, volumetric/air contribution and other HDR scene terms are accumulated before tone mapping.
- Exposure is measured from scene transport; it is not a visual preference constant.
- Authored environment colors are treated according to their semantic role (radiance/appearance vs albedo) and are not blindly exposed as if they were material albedo.
- Final output uses a shared ACES-family tone-mapping contract across supported backends.

## Interactive affordances
Actions are spatial objects with visible state:
- available: restrained emissive cue;
- hover/proximity: depth/scale/light response;
- focused: explicit high-contrast focus state;
- pressed: deterministic short response;
- pending: in-flight state without world mutation;
- success: canonical world update;
- failure: world remains unchanged and presents recoverable feedback.

## Zero Default
Explicitly own:
- focus rings;
- keyboard navigation;
- pointer/touch states;
- form validation and submission;
- dialogs/sheets;
- scrolling and overscroll;
- loading, empty, error and offline states;
- reduced motion and high-contrast behavior.

## Voice separation
Visual and speech semantics are separate projections of the same frame:
`Berx5DFrame -> VisualSemanticState`
`Berx5DFrame -> SpeechSemanticState`

Speech is additive context only. It must not narrate information already visible in the current visual semantic state.

## World-after-success
No client action mutates authoritative world state before confirmed server success. Pending actions may change presentation state, but not the canonical world.

## Evidence standard
A visual capability is not considered production-ready from declaration, interface presence or stored capability flags. Closure requires evidence tied to the actual production renderer path, with feature-specific execution/readback where applicable.
