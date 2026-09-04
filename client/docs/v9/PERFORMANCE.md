# BERX V9 — Performance report

The archive's per-screen budget: 60fps target, at most three blur
layers on mobile, virtualized lists, lazy media, no continuous layout
reads.

## Implemented

| Budget | How |
|---|---|
| Blur layers ≤ 3 | `BerxPerformanceGate` publishes the real budget (`maxBlurLayers: 3`) that surfaces read, instead of each screen guessing. |
| Device-appropriate particles | Real platform budget (90, 45 on Android) — the number this codebase already measured, not the largest that would still look fine. |
| Effects off under reduced motion | The gate turns `spatialEffects` off, which is both the accessibility and the performance win. |
| No continuous layout reads | Parallax and tilt run on Reanimated shared values on the UI thread; layers never measure per frame. |
| Countdown ticking | `BerxCountdown` ticks per second only under an hour, per minute above it — a component that woke 60×/minute to redraw "3 дня" would be a performance bug wearing a feature's clothes. |
| Depth без 3D-движка | Depth is perspective + scale + rotateY on plain views. No 3D runtime is loaded to express hierarchy. |

## Measured

Bundle: the web harness bundle is ~12.0 MB unminified with sourcemaps —
a harness artefact, not a shipping number. The vendored archive data
adds 652 KB (the 300 contracts compacted into one JSON, plus tokens,
manifest and component index).

## Not measured

No FPS profiling, no device traces, no memory profile — this container
has no device and no profiler. Any claim of "60fps achieved" would be
fabricated, so none is made.
