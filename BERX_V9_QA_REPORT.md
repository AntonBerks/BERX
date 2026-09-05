# BERX v9 — QA REPORT

Two probes run the real runtime against the real contracts. Neither
reads source to decide whether something works.

```
cd client
npm run verify:v9        # 33 gates — contracts + spatial runtime, Node
npm run verify:v9:web    # 24 gates — the same runtime in real Chromium,
                         #             plus the shipped site itself
```

**Current: 33/33 and 24/24.**

Both tables below are the probes' own output, not a description of it.

## Contract probe — 33 gates

Bundles `@berx/spatial` and `@berx/scenes` with esbuild and executes
them across seven device profiles (iOS phone, low-end Android, desktop,
tablet, reduced-motion, watch, high-contrast). The last five gates are
about the product rather than the runtime: they fail the build if a
screen paints over its own scene, has no depth plane under its
content, prints its actions on the content plane, or grows its own
selection styling instead of using the shared controls. The last two
measure the focus plane: that a focused object's surround actually
falls away behind it, and that the plane order established by the
materials survives every plane receding.

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
| a headset keeps its depth and loses its screen-space effects | 3d=true parallax=true blur=0 shell=spatial-anchors, 300/300 resolved |
| watch flattens instead of dropping the scene | allow3D:false resolved:300/300 |
| content text passes AA on every profile | ios-phone-high:14.78 android-phone-low:14.78 web-desktop-high:14.78 web-tablet:14.78 web-reduced-motion:14.78 arvr:14.78 watch:14.78 web-high-contrast:14.78 |
| high contrast forces opaque surfaces | 300/300 |
| navigation shell adapts to platform and width | ios-phone-high:bottom-tabs android-phone-low:bottom-tabs web-desktop-high:sidebar web-tablet:rail web-reduced-motion:sidebar arvr:spatial-anchors watch:compact web-high-contrast:sidebar |
| every routed screen resolves a scene | 87 screen files, none rendering outside a scene |
| every built spatial component is actually rendered | no unrendered components |
| every atmosphere keeps its depth with blur removed | 11 kinds, each with ≥3 sky stops, positioned light at ≥2 distances, and a floor or walls |
| no single generic background: every family lands on a distinct environment | 11/11 distinct environments across 13/13 families |
| D4 actions are promoted to a control shelf, never printed on the content plane | 87 screens, every action row on the control plane |
| no screen paints an opaque background over its scene | 87 screens, every one standing in its scene |
| every screen places its content on a real depth plane | 87 screens, none flat inside their scene |
| selection uses the shared controls, not per-screen chip styles | no screen defines its own selected-chip style |
| every interactive control announces itself | no Pressable without a role or a name |
| no dead controls | no press handler that does nothing |
| screens classify their failures instead of flattening them | every screen routes failures through classifyFailure |
| the depth planes are visibly ordered on every contract | no inversions across 300 contracts x 2 platforms; smallest step between the planes a person reads and reaches for: 1.55 L* |
| focus emerges from the scene it is in | 1800 fields (300 contracts x 2 platforms x 3 object sizes); the far surround reads at least 4.88 L* below the clearing |
| the hierarchy survives focus | no plane inversions once every plane has receded; the environment steps back 0.34 further than the focus does |
| no probe findings | clean |

## Browser probe — 24 gates

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
| scrolling moves layers by different amounts (real parallax) | BERX-121:4 distinct BERX-031:4 distinct BERX-061:4 distinct BERX-091:4 distinct BERX-176:4 distinct BERX-201:4 distinct BERX-226:4 distinct BERX-246:4 distinct BERX-291:4 distinct |
| 60fps sustained during scroll (median <= 35.4ms in all 9 scenes) | empty page on this machine: 16.7ms — BERX-121:16.7ms BERX-031:16.7ms BERX-061:16.8ms BERX-091:16.7ms BERX-176:33.3ms BERX-201:16.8ms BERX-226:33.2ms BERX-246:16.7ms BERX-291:16.7ms |
| frame cost is attributable: glass dominates, the room is cheap | glass p95 66.7ms costs 4 frames; the composed room costs -1 of 39 (opaque p95 49.9ms, flat-background p95 50.0ms) |
| runtime detects the shortfall and adapts on its own | blur-dropped, tier=medium, blurLayers=0, measured 30.0fps |
| adapting measurably reduces missed frames | missed 19/39 -> 15/39 |
| adaptation drops effects, never layers or content | layers=6 headings=4 parallax=true 3d=true |
| painted text passes AA in all 9 scenes | BERX-121:9.99 BERX-031:12.9 BERX-061:12.39 BERX-091:12.39 BERX-176:14.09 BERX-201:12.12 BERX-226:11.6 BERX-246:13.37 BERX-291:11.48 |
| controls meet the 44dp target | BERX-121:190x44 BERX-031:190x44 BERX-061:190x44 BERX-091:190x44 BERX-176:199x44 BERX-201:190x44 BERX-226:190x44 BERX-246:190x44 BERX-291:190x44 |
| materials paint differently in the browser | 5 distinct surfaces across 5 scenes |
| reduced motion removes parallax, tilt and the ambient loop | parallax:false tilt:0deg halo:none |
| reduced motion keeps every layer and its content | content surface painted rgb(41, 46, 47) |
| low-capability device degrades effects, not structure | tier=low layers=6 blurred=0 headings=4 |
| high contrast paints opaque and stays readable | 12.9:1 backdrop=none bg=rgb(41, 46, 47) |
| keyboard focus is visible | button outline 2px solid rgb(79, 214, 232) |
| the environment is a lit space on its own, with no blur and no content | room only: 15 levels, spread 0.22897, top-to-bottom 0.14235 |
| depth comes from composition, not from blur (v9 visual acceptance) | with blur off: the room carries 11.327x the structure of a flat background, and a full scene reads 1.265x more differently from top to bottom |
| families paint different environments in real pixels | 3/3 distinct rooms among PLACES / MESSAGES / AUTH |
| the shared element travels between scenes, and stops travelling under reduced motion | normal: travelling, mid-flight transform matrix(1.0444, 0, 0, 1.0444, 0, 102.83); reduced motion: fading |
| the site runs the same BERX runtime as the app | hero mounts BERX-001 (AUTH, cinematic) with 4 real gradients; 0 page errors |
| each site section stands in its own family room | BERX-176:conversational(4) BERX-201:location(4) BERX-226:temporal(4) BERX-266:community(4) BERX-031:social(4) BERX-291:location(4) |
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
