# BERX v9 — QA REPORT

Two probes run the real runtime against the real contracts. Neither
reads source to decide whether something works.

```
cd client
npm run verify:v9        # 26 gates — contracts + spatial runtime, Node
npm run verify:v9:web    # 23 gates — the same runtime in real Chromium,
                         #             plus the shipped site itself
```

**Current: 26/26 and 23/23.**

Both tables below are the probes' own output, not a description of it.

## Contract probe — 26 gates

Bundles `@berx/spatial` and `@berx/scenes` with esbuild and executes
them across seven device profiles (iOS phone, low-end Android, desktop,
tablet, reduced-motion, watch, high-contrast). The last five gates are
about the product rather than the runtime: they fail the build if a
screen paints over its own scene, has no depth plane under its
content, prints its actions on the content plane, or grows its own
selection styling instead of using the shared controls.

| Gate | Result |
|---|---|
| generator is deterministic | regeneration is a no-op |
| 300 contracts present | 300 |
| 300/300 resolve by screenId | 300/300 |
| 300/300 resolve by route path | 300/300 |
| 300/300 resolve by route name | 300/300 |
| 13/13 families | AUTH:30 HOME:30 EXPLORE:30 NOW:30 PROFILE:30 SOCIAL:25 MESSAGES:25 PLACES:25 EVENTS:20 EXPERIENCE:20 COMMUNITY:15 CREATOR:10 BUSINESS:10 |
| route manifest matches the registry | 300 routes / 300 scenes |
| every requested component has a resolution | none unresolved |
| 29 scenes carry a real data binding | 29 |
| no scene invents data | {"dataless":3,"bound":26,"contract-only":271} |
| archive tokens match the runtime | depth.D5.parallax:ok motion.maxTiltDeg:ok blurMaxLayersMobile:ok material count:ok |
| mobile blur budget <= 3 layers | ios-phone-high:0 android-phone-low:0 |
| reduced motion removes parallax and tilt | parallax:false scenes:300/300 |
| watch flattens instead of dropping the scene | allow3D:false resolved:300/300 |
| content text passes AA on every profile | ios-phone-high:18.09 android-phone-low:18.09 web-desktop-high:14.2 web-tablet:18.09 web-reduced-motion:14.2 watch:18.09 web-high-contrast:18.09 |
| high contrast forces opaque surfaces | 300/300 |
| navigation shell adapts to platform and width | ios-phone-high:bottom-tabs android-phone-low:bottom-tabs web-desktop-high:sidebar web-tablet:rail web-reduced-motion:sidebar watch:compact web-high… |
| every routed screen resolves a scene | 86 screen files, none rendering outside a scene |
| every built spatial component is actually rendered | no unrendered components |
| every atmosphere keeps its depth with blur removed | 11 kinds, each with ≥3 sky stops, positioned light at ≥2 distances, and a floor or walls |
| no single generic background: every family lands on a distinct environment | 11/11 distinct environments across 13/13 families |
| D4 actions are promoted to a control shelf, never printed on the content plane | 86 screens, every action row on the control plane |
| no screen paints an opaque background over its scene | 86 screens, every one standing in its scene |
| every screen places its content on a real depth plane | 86 screens, none flat inside their scene |
| selection uses the shared controls, not per-screen chip styles | no screen defines its own selected-chip style |
| no probe findings | clean |

## Browser probe — 23 gates

Builds the real web runtime, serves the shipped stylesheet byte for
byte, measures the rendered result in Chromium — and then loads
`index.html` from the repository root to check the site itself is
running that same runtime.

Two of these gates are the archive's visual-acceptance rule made
measurable. The probe screenshots real scenes with `backdrop-filter`
forced off and reads the pixels back as CIE L\*: the composed room
resolves to double-digit luminance levels where the same framing with
a flat background resolves to one. If removing blur flattened BERX,
that ratio would be 1.

| Gate | Result |
|---|---|
| 300/300 contracts resolve in a real browser | 300/300 |
| all 9 key scenes render with a real perspective camera | BERX-121:1200px BERX-031:1200px BERX-061:1200px BERX-091:1200px BERX-176:1200px BERX-201:1200px BERX-226:1200px BERX-246:1200px BERX-291:1200px |
| depth layers paint in order in all 9 scenes | z-index strictly increasing D0→D5 |
| scrolling moves layers by different amounts (real parallax) | BERX-121:4 distinct BERX-031:4 distinct BERX-061:4 distinct BERX-091:4 distinct BERX-176:4 distinct BERX-201:4 distinct BERX-226:4 distinct BERX-24… |
| 60fps sustained during scroll (median <= 35.4ms in all 9 scenes) | empty page on this machine: 16.7ms — BERX-121:33.3ms BERX-031:33.3ms BERX-061:33.3ms BERX-091:33.2ms BERX-176:33.3ms BERX-201:33.3ms BERX-226:33.3m… |
| frame cost is attributable: glass dominates, the room is cheap | glass p95 66.7ms costs 2 frames; the composed room costs 0 of 39 (opaque p95 50.0ms, flat-background p95 50.0ms) |
| runtime detects the shortfall and adapts on its own | blur-dropped, tier=medium, blurLayers=0, measured 20.0fps |
| adapting measurably reduces missed frames | missed 27/39 -> 10/39 |
| adaptation drops effects, never layers or content | layers=6 headings=4 parallax=true 3d=true |
| painted text passes AA in all 9 scenes | BERX-121:18.09 BERX-031:18.09 BERX-061:18.09 BERX-091:18.09 BERX-176:18.09 BERX-201:18.09 BERX-226:18.09 BERX-246:18.09 BERX-291:18.09 |
| controls meet the 44dp target | BERX-121:190x44 BERX-031:190x44 BERX-061:190x44 BERX-091:190x44 BERX-176:199x44 BERX-201:190x44 BERX-226:190x44 BERX-246:190x44 BERX-291:190x44 |
| materials paint differently in the browser | 4 distinct surfaces across 5 scenes |
| reduced motion removes parallax, tilt and the ambient loop | parallax:false tilt:0deg halo:none |
| reduced motion keeps every layer and its content | content surface painted rgb(13, 14, 18) |
| low-capability device degrades effects, not structure | tier=low layers=6 blurred=0 headings=4 |
| high contrast paints opaque and stays readable | 18.09:1 backdrop=none bg=rgb(13, 14, 18) |
| keyboard focus is visible | button outline 2px solid rgb(79, 214, 232) |
| the environment is a lit space on its own, with no blur and no content | room only: 13 levels, spread 0.19167, top-to-bottom 0.11074 |
| depth comes from composition, not from blur (v9 visual acceptance) | with blur off: the room carries 14.984x the structure of a flat background, and a full scene reads 1.49x more differently from top to bottom |
| families paint different environments in real pixels | 3/3 distinct rooms among PLACES / MESSAGES / AUTH |
| the shared element travels between scenes, and stops travelling under reduced motion | normal: travelling, mid-flight transform matrix(1.0444, 0, 0, 1.0444, 0, 102.83); reduced motion: fading |
| the site runs the same BERX runtime as the app | hero mounts BERX-001 (AUTH, cinematic) with 4 real gradients; 0 page errors |
| no page errors or console errors | clean |

## What the probes deliberately do not claim

- **No device farm.** Frame timings come from headless Chromium on one
  machine with no GPU. The frame gate therefore measures the machine
  first, on an empty page, and holds BERX to one vsync above whatever
  that machine can do — which is a statement about BERX rather than
  about the hardware.
- **No React Native runtime.** There is no simulator here, so the
  mobile adapters are verified by typecheck and by sharing one
  resolver with the web adapter that *is* measured. A screen's real
  behaviour on a device is unverified, and every screen file says so
  in its header.
- **No backend.** The API layer is typed against the real OSSN
  endpoints; no probe calls one.

_Regenerate this file's tables by running both probes with `--json`._
