# BERX v9 — QA REPORT

Two probes run the real runtime against the real contracts. Neither
reads source to decide whether something works.

```
cd client
npm run verify:v9        # 19 gates — contracts + spatial runtime, Node
npm run verify:v9:web    # 18 gates — the same runtime in real Chromium
```

**Current: 19/19 and 18/18.**

## Contract probe — 19 gates

Bundles `@berx/spatial` and `@berx/scenes` with esbuild and executes
them across seven device profiles (iOS phone, low-end Android, desktop,
tablet, reduced-motion, watch, high-contrast).

| Gate | Result |
|---|---|
| Generator is deterministic | regeneration is a no-op — `docs/v9` and code cannot drift |
| 300 contracts present | 300 |
| 300/300 resolve by screenId | 300/300 |
| 300/300 resolve by route path | 300/300 |
| 300/300 resolve by route name | 300/300 |
| 13/13 families | AUTH 30 · HOME 30 · EXPLORE 30 · NOW 30 · PROFILE 30 · SOCIAL 25 · MESSAGES 25 · PLACES 25 · EVENTS 20 · EXPERIENCE 20 · COMMUNITY 15 · CREATOR 10 · BUSINESS 10 |
| Route manifest matches the registry | 300 routes / 300 scenes |
| Every requested component has a resolution | none unresolved |
| 29 scenes carry a real data binding | 29 |
| No scene invents data | bound 27 · dataless 2 · contract-only 271 |
| Archive tokens match the runtime | depth, tilt ceiling, blur budget, material count |
| Mobile blur ≤3 layers | 0 used (RN has no backdrop filter) |
| Reduced motion removes parallax and tilt | 300/300 scenes |
| Watch flattens without losing a scene | allow3D false, 300/300 resolved |
| Content text passes AA on every profile | lowest 13.11:1 |
| High contrast forces opaque surfaces | 300/300 |
| Nav shell adapts to platform and width | bottom-tabs / rail / sidebar / compact |
| Every built spatial component is rendered | no unrendered components |
| No probe findings | clean |

## Browser probe — 18 gates

Builds the real web runtime, serves the shipped stylesheet byte for
byte, and measures the rendered result in Chromium 141.

| Gate | Measured |
|---|---|
| 300/300 contracts resolve in a real browser | 300/300 |
| Perspective camera on all 9 key scenes | 1200px each |
| Depth layers paint in order | z-index strictly increasing D0→D5 |
| Scrolling moves layers by different amounts | 3 distinct offsets per scene |
| 60fps sustained during scroll | median 16.7ms in all 9 |
| Frame cost is attributable | glass p95 50.0ms / 10 dropped; opaque 16.7ms / 1 |
| Runtime detects the shortfall and adapts | `blur-dropped`, measured 59.9fps |
| Adapting reduces missed frames | 9/39 → **0/39** |
| Adaptation drops effects, never structure | 6 layers, 4 headings, parallax and 3D intact |
| Painted text passes AA | 18.09:1 in all 9 |
| Controls meet the 44dp target | 45–46px |
| Materials paint differently | 4 distinct surfaces across 5 scenes |
| Reduced motion removes parallax, tilt, ambient | parallax false, tilt 0deg, animation none |
| Reduced motion keeps every layer | content surface still painted |
| Low-capability device degrades effects only | tier low, 6 layers, 0 blurred, 4 headings |
| High contrast opaque and readable | 18.09:1, `backdrop-filter: none` |
| Keyboard focus visible | `2px solid rgb(79,214,232)` |
| No page or console errors | clean |

## Typecheck

74 errors, down from a 94-error baseline at takeover. The remainder:

- **70 × TS6133** — unused `React` imports in unconverted screens, dead
  under `jsx: react-jsx`. Pre-existing; each converted screen loses one.
- **4 × platform picker errors** — in `mediaPicker`/`audioPicker`, which
  `tsconfig` excludes but transitively imports. Pre-existing.

**No error introduced by this work remains.** Every conversion was
verified against the baseline before committing.

## What is NOT tested

Said plainly.

- **No unit or component tests.** No runner is configured in this repo —
  no Jest, no Vitest, no RNTL. The probes verify the runtime, not units.
- **No React Native runtime verification.** Metro and a device are not
  available. Every RN screen is typechecked and structurally verified;
  none has been rendered on a phone. `screen.tsx` compiling is not
  `screen renders`.
- **No visual regression baselines.** The browser probe measures computed
  styles and frame timings; it takes no screenshots and compares no
  images.
- **No backend integration test.** The API client is typechecked against
  its own surface; no request was made to a live `/api/v1/`.
- **No E2E flow test.** Login → feed → post → profile has never been
  driven end to end.
- **No load or memory profiling.**

## Visual QA status

| Scene | Runtime-verified | Notes |
|---|---|---|
| Depth ordering, 9 key scenes | **yes**, in browser | z-index strictly increasing |
| Perspective camera | **yes**, in browser | 1200px |
| Parallax separation | **yes**, in browser | 3 distinct layer offsets under real scroll |
| Material distinctness | **yes**, in browser | painted surfaces differ per material |
| Lighting recipes | **partial** | hero/card resolve to different values; not compared visually |
| Shared-element transitions | **no** | planned by the resolver, never rendered — RN needs a navigation library that is not installed |
| RN scene rendering | **no** | see above |

## Highest-value next QA work

1. A test runner, then unit tests for the resolvers — they are pure
   functions and trivially testable.
2. Render the RN app on a device and re-run these checks there.
3. Screenshot baselines for the 9 key scenes in the browser probe.
4. A live `/api/v1/` smoke test.
