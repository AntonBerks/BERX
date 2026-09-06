# BERX MAX FULL 5D RUNTIME

## Non-negotiable product rule

BERX must not be a 2D app with 5D decoration. The primary experience is authored as a persistent spatial world and projected by a real camera. CSS blur, shadows, gradients, scale, or parallax alone never qualify as 5D.

## Runtime stack

Persistent World Graph → Spatial Object Registry → Camera/Projection → D0–D5 → GPU Renderer → Materials → Lighting → Physics/Inertia → Gestures → Device Motion → Focus/Occlusion → Shared Spatial Transitions → Haptics/Spatial Audio hooks → Adaptive Quality → Accessibility.

## Real renderer requirement

Web must use a real GPU renderer (WebGL2 minimum; WebGPU may be an optional higher tier). Native must use a real GPU 3D backend such as Filament/Metal/Vulkan. Renderer adapters consume the same `Berx5DFrame` and must expose perspective, depth-buffer and physically-lit material capabilities honestly.

## 2D ban

Forbidden as the primary implementation:

- route replacement with independent flat screens;
- card-only composition presented as spatial;
- CSS transform as the only depth mechanism;
- blur as evidence of depth;
- fake shadows pretending to be geometry;
- duplicate source/destination objects during navigation;
- fake media/data to make a scene look complete.

Ordinary 2D text and accessibility controls may be composited on the control plane where required. Their spatial position, focus, transitions and relationship to the 3D world must remain authoritative.

## Spatial object

Every primary visible entity has stable identity, source domain id, XYZ position, XYZ rotation, XYZ scale, material state, activity/energy, parent and relationship metadata, visibility, interactivity and focusability.

## Camera

Perspective camera with real position, target, FOV, near/far, inertia and bounded device-motion response. Tap/focus/enter/back must alter camera state, not only opacity or route state.

## Depth

D0–D5 are semantic depth bands, but every important object also has continuous world Z. Depth is perceived through perspective, occlusion, scale, lighting, material response, camera motion and spatial separation. Blur is optional decoration.

## Navigation

Profile → Moment → Place → Event is movement through a connected world. The source object's identity survives. Back restores the previous camera/world context. Shared objects travel continuously whenever geometry is measurable; reduced motion uses a state-preserving non-traveling transition.

## Input

Touch/pointer, pan, pinch, tap, long-press where meaningful, device orientation/motion and optional spatial audio/haptics feed the same runtime. Motion must never be the sole source of meaning. Reduced-motion removes parallax/tilt/ambient camera movement while retaining hierarchy and state.

## Visual art direction

Luxury cinematic spatial computing. Obsidian/graphite/pearl foundation. Champagne is the premium accent. Cyan is rare BERX Energy for NOW/LIVE/realtime/focus/special spatial events. No cyberpunk HUD overload, no neon wallpaper, no purple dominance.

## Canonical worlds

Entry, NOW, Profile, Moment, Place, Event, Messages, Create, Discover/World Graph.

## Performance

Target 60fps interactive motion (16.7ms frame budget), adaptive quality, lazy/virtualized media, bounded simultaneous 3D objects, GPU resource disposal, no continuous layout reads in animation paths. Measure median and p95 frame time plus missed-vsync ratio. Web headless probes are useful regression tests but never replace real-device validation.

## Definition of DONE

A scene is DONE only if it renders through a real spatial renderer, has real perspective/depth, responds to input, preserves spatial identity through navigation, binds to real BERX data, has real loading/error/empty/private/unsupported states, passes accessibility and reduced-motion behavior, disposes GPU resources, and is measured on target hardware.

## Implementation order

1. Runtime + renderer boundary
2. Canonical Profile World vertical slice
3. Real media geometry/materials
4. Camera/input/device-motion loop
5. Shared spatial navigation/backtracking
6. NOW World
7. Moment/Place/Event worlds
8. Messages/Create/Discover
9. Native GPU adapter
10. Full-scene migration and regression gates

Never claim the entire product is Full 5D until these acceptance gates pass on actual runtime paths.
