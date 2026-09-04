# BERX v9 — PERFORMANCE REPORT

All numbers below were measured, not estimated. Reproduce with
`cd client && npm run verify:v9:web` (real Chromium) and
`npm run verify:v9` (the resolver across seven device profiles).

## Contract

Target 60fps · interactive budget 16.7ms · ≤3 blurred layers on mobile ·
≤80 simultaneous 3D objects on mobile · 1 autoplaying video on mobile ·
lists virtualized · media lazy · no continuous layout reads.

Progressive fallback is allowed. **Semantic loss is not** — and that is
the line this report is really about.

## Measured: frames during a real scroll

Nine key scenes, 1440×900 at DPR 2, driven by an actual scroll with
frame timings taken from `requestAnimationFrame`:

| Scene | Median | p95 | Frames missing vsync |
|---|---|---|---|
| BERX-121 PROFILE | 16.7ms | 50.0ms | 23% |
| BERX-031 HOME | 16.7ms | 50.0ms | 28% |
| BERX-061 EXPLORE | 16.7ms | 50.0ms | 21% |
| BERX-091 NOW | 16.7ms | 50.0ms | 23% |
| BERX-176 MESSAGES | 16.7ms | 50.0ms | 23% |
| BERX-201 PLACES | 16.7ms | 49.9ms | 21% |
| BERX-226 EVENTS | 16.7ms | 33.3ms | 21% |
| BERX-246 EXPERIENCE | 16.7ms | 50.0ms | 18% |
| BERX-291 BUSINESS | 16.7ms | 50.0ms | 21% |

A perfect 16.7ms median with a fifth of frames arriving two or three
vsyncs late. **The median alone said 60fps and the median alone was
wrong** — the user feels the late frames. That finding changed the
runtime: it now judges itself on missed-vsync ratio as well as median.

## Measured: what costs the frames

The same scene, the same scroll, twice — once with the resolved glass,
once with the opaque high-contrast surfaces, which remove every
`backdrop-filter` and nothing else:

| | Median | p95 | Frames missed |
|---|---|---|---|
| With glass (3 blurred layers) | 16.7ms | 50.0ms | 10 of 39 |
| Same scene, blur removed | 16.7ms | 16.7ms | 1 of 39 |

Backdrop blur is the cost, unambiguously. Two decisions followed:

1. **The desktop blur budget was cut from 4 layers to 3.** An earlier
   draft gave desktop four on the assumption a bigger machine could
   afford it. The measurement disagreed, and the archive had only ever
   specified three.
2. **`blur(0px)` was replaced with `none`.** They are not the same:
   `blur(0px)` still promotes the element to a backdrop root and still
   asks the compositor to sample behind it. The runtime now emits a full
   filter value, so a layer with no budget costs the compositor nothing.

*Caveat, stated rather than buried:* this is headless Chromium with
software rasterization. On GPU-accelerated hardware the blur cost is
lower. The runtime does not assume either way — it measures.

## Measured: adaptation, and what it protects

Same scene with live sampling on, scrolled twice:

| | Median | Frames missed |
|---|---|---|
| First scroll | 16.7ms | 9 of 39 (23%) |
| Runtime adapts | `blur-dropped` | |
| Second scroll | 16.7ms | **0 of 39** |

After adapting: 6 layers, 4 content headings, `parallax=true`,
`3d=true`, perspective 1200px. **Depth, atmosphere, lighting, material
response, parallax and cinematic composition all survive.** The only
thing removed is backdrop blur — the one thing the measurement blamed.

The response is graduated for that reason: blur first, and the tier
itself (which would cost 3D and parallax) only if the scene still misses
vsync afterwards. Performance protects the 5D experience; it does not
flatten it.

## Measured: budget per device profile

| Profile | Tier | Blur budget | Used | 3D | Parallax |
|---|---|---|---|---|---|
| iOS phone | medium | 0 | 0 | yes | yes |
| Android phone, 2 cores / 2GB | low | 0 | 0 | no | no |
| Web desktop, 8 cores / 8GB | high | 3 | 3 | yes | yes |
| Web tablet | medium | 2 | 2 | yes | yes |
| Web, reduced motion | high | 3 | 3 | yes | **no** |
| Watch | low | 0 | 0 | no | no |

React Native has no backdrop filter without a native module, so mobile
blur is 0 and the material resolver substitutes an opaque surface at the
same elevation. Nothing is blurred badly; it is solid, and the surface
says so via `opaqueFallback`.

Absent blur support is deliberately **not** a tier signal — treating it
as one would flatten every phone to a 2D scene for a reason that has
nothing to do with 3D.

## Verified in the browser on a constrained device

Emulated 2 cores / 2GB at 360×800 DPR 3: tier `low`, **6 layers**,
**0 blurred**, **4 content headings**, perspective still 1200px. Effects
degrade; structure and content do not.

## What the runtime does to stay inside budget

- **Transform and opacity only.** Parallax writes one custom property
  per layer inside a single `requestAnimationFrame`; the scroll offset
  comes from the scroll event, never from a layout read.
- **Blur allocated top-down** — focus and controls first, then
  structure, then atmosphere. A layer that misses out becomes opaque,
  never absent.
- **Lists virtualized** with the window size the resolved budget gives
  (10 / 14 / 21 by tier), `removeClippedSubviews` on.
- **Ambient loops suspended** before anything structural, under reduced
  motion or a tight budget.
- **RN gets true perspective projection** (`p/(p−z)`) since it has no
  `translateZ`, so both platforms agree on how far away a layer looks.

## Open

- The p95 tail on this hardware is real but environment-specific. It
  needs re-measuring on a GPU-accelerated device and on physical phones.
- No React Native runtime measurement exists — Metro and a device are
  not available here. Every RN performance statement in this report is
  about the resolver's budget, not about frames on a phone.
- No memory or video-concurrency measurement. The budget declares limits
  (80 3D objects, 1 autoplaying video on mobile); nothing enforces them
  yet at the media layer.
