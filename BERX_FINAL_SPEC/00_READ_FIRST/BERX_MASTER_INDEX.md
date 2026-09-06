# BERX FINAL MASTER SPEC

## Source of truth
This directory is the canonical design/product execution layer for BERX.

Priority order:
1. Existing production repository and real backend capability.
2. This BERX_FINAL_SPEC.
3. Older BERX archives only for historical context.

## Non-negotiable
BERX is a living spatial social product around real people, places, moments, events and experiences. It is not Instagram/VK with glass, a generic dashboard, cyberpunk HUD, VR demo, or a collection of floating cards.

Frozen visual DNA:
- Background: #07080A
- Surface: #101216
- Primary accent: #4FD6E8
- Glass: rgba(255,255,255,.04/.06/.10)
- Depth: D0-D5
- Motion: 140 / 220 / 360 / 650 / 900 / 4000ms
- Max tilt: ±2.5°
- Parallax: .15 / .20 / .35 / .65 / 1.0 by depth

Core formula:
DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → REVIEW → EARN → LEVEL UP → DISCOVER MORE

Core objects:
PEOPLE, MOMENTS, PLACES, EVENTS, EXPERIENCES, COMMUNITIES, BUSINESSES, MEMORIES, COLLECTIONS, REPUTATION, NOW.

## 5D definition
D0 Environment → D1 Atmosphere → D2 Spatial Architecture → D3 Real Content → D4 Identity/Actions → D5 Focus/Energy.

Blur is not depth. If blur is removed and the scene becomes flat, the implementation is not sufficiently spatial.

## Execution rule
Do not restart or rewrite BERX. Inspect the existing repo/backend, implement vertical slices, use real APIs only, preserve honest capability boundaries, and verify runtime—not just TypeScript.

DONE means: route + runtime + real data + all relevant states + interaction + navigation + spatial composition + accessibility + performance + security + evidence.

## Important honesty
300 screen contracts are a design/runtime coverage target, not a claim that 300 bespoke rendered screens already exist. Use scene-family reuse where appropriate, but each route must resolve to a meaningful real product experience.
