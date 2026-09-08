# BERX — MASTER COMMAND FOR CLAUDE

## Role
You are the implementation engineer. Work directly in the existing BERX repository. Do not redesign the project from scratch. Preserve the single authoritative `Berx5DFrame` / `@berx/spatial` world model. Web is the first production target; the same contracts must remain portable to Desktop, iOS, Android, watchOS, AR and VR.

## Operating rules
1. No fake/default/demo functionality.
2. No second spatial core, no parallel world state, no synthetic authoritative entities.
3. Capability is `BLOCKED` until real production-path evidence exists.
4. Never weaken a verification gate merely to make CI green.
5. Server/backend remains canonical: OSSN/PHP/MySQL and `/api/v1/*`.
6. Visual language: Premium Dark, `#07080A` foundation, cyan `#4FD6E8`, spatial glass on floating elements, media-first composition.
7. `Berx5DFrame` is the sole authoritative world source. X/Y/Z/T/R must remain intact.
8. World-after-success: do not mutate canonical world, cache-as-truth, navigation state, or realtime authoritative state before confirmed success.
9. Voice ≠ Visible: TTS must speak only semantic information that is not already sufficiently visible on screen.
10. Zero Default: browser/native interaction defaults must not leak into the product.

## Goal
Build the Web MAX 5D runtime end-to-end, with exceptional visual quality and rigorous architectural correctness. The result must feel like one coherent spatial operating environment, not a normal 2D site with 3D effects.

## Work sequence

### W1 — Web shell and runtime boundary
- Identify the real Web entrypoint and make it the production shell.
- Establish one runtime lifecycle: boot → capability resolve → frame acquisition → renderer → domain state → interaction → realtime → teardown/recovery.
- Wire all production spatial modules into the Web shell where they are intended to be used.
- Remove orphaned/parallel entry paths only when proven safe.
- Keep public/marketing shell separate from authenticated application runtime.

### W2 — Canonical spatial renderer
- Consume only `Berx5DFrame`.
- Implement/prove camera, world transforms, X/Y/Z/T/R, draw-list generation, frustum/occlusion culling, LOD, instancing, picking, world-space text, texture/media streaming and lifecycle.
- WebGPU is the primary backend; WebGL2 is compatibility fallback.
- Do not claim a capability because an object/property exists; require actual production-path evidence.
- Complete HDR pipeline: linear float working target → scene/volumetric composition → exposure → ACES/tone map → post → presentation.
- Exposure gain must be derived from measured scene transport, not an arbitrary aesthetic constant. Target order of magnitude is about 3x only if measurement supports it.
- Authored environment colors are radiance/appearance, not albedo; do not expose the environment incorrectly.
- Keep cross-render gates strict.

### W3 — Full visual system
Implement one BERX visual grammar across the entire Web application.

Spatial composition:
- World occupancy target 40–60% of the meaningful viewport.
- One dominant object/subject per scene; supporting objects establish depth and context.
- Camera framing derived from object bounds/importance, not arbitrary static offsets.
- Avoid an empty void, but also avoid visual noise.

Materials/light:
- Physically coherent materials.
- Controlled contrast hierarchy.
- Cyan reserved for BERX interaction/state emphasis.
- Glass surfaces only where floating/interactive semantics justify them.
- Layered depth: world → subject → action affordance → information chrome.

Post:
- Exposure/ACES first-class.
- Volumetric/air before tone mapping.
- Bloom, AO/SSAO, shadows, IBL and other effects only when implemented and verified.
- Never add an effect solely to hide poor composition or unclear hierarchy.

Motion:
- Every transition has semantic purpose.
- Preferred BERX transition vocabulary: flow, fold, warp, dissolve, bloom, collapse, teleport/wormhole only when spatially meaningful.
- Respect reduced-motion mode without falling back to a generic static UI.

Typography/icons:
- No browser-default controls/icons.
- Use one coherent geometric sans hierarchy.
- Iconography must share stroke/weight/optical sizing.
- No emoji as system icons.

### W4 — Spatial action affordances
Actions are spatial objects, not plain labels.
- Idle: subtle dimensional presence.
- Hover/focus/proximity: depth, emissive response and micro-motion.
- Press/activation: tactile response.
- Pending: clearly busy but spatially stable.
- Success: canonical world changes only after confirmed success.
- Failure: explain state and leave world unchanged.
- Disabled: explicit reason/state, not faded generic button.

Examples: `Событие`, `Пойду`, `Сохранить`, `Отправить`, `Присоединиться`.

### W5 — Real application domains
Connect actual BERX domains to the spatial runtime, preserving backend truth.
- NOW
- Feed
- Stories
- People / profiles
- Messages
- Search
- Places
- Events
- Communities
- Notifications
- Settings / privacy / safety
- Business surfaces where real backend support exists

Do not invent screens for domains that have no real backend. A missing domain remains explicitly blocked rather than represented by fake data.

### W6 — Mutation integrity
Audit every user mutation and every state-writing side effect.
Required pattern:
`user intent → validation → API request → confirmed canonical success → canonical state mutation → dependent cache/realtime/navigation update`

For every mutation, inspect:
- optimistic UI;
- local store writes;
- query/cache writes or invalidation;
- URL/history navigation;
- websocket reconciliation;
- retry/error paths;
- duplicate/submitted-again behavior.

A failed request must not leave an authoritative world mutation behind.

### W7 — Voice OS 5D context
Create a strict separation:
- `VisualSemanticState`: what is already visible/obvious.
- `SpeechSemanticState`: additional context worth speaking.

TTS may use real T/R context, history, future state, memory and unseen relations, but must not narrate visible labels/cards merely because they exist.

Examples of valid speech context:
- time remaining until a visible event closes;
- a change since last visit;
- a relevant remembered preference not displayed;
- "show what I viewed yesterday" as an action over real history.

All speech facts must come from real runtime/backend state.

### W8 — Zero Default interaction audit
Eliminate default behavior leakage for:
- buttons;
- inputs;
- selects;
- dialogs;
- focus rings;
- keyboard navigation;
- pointer/touch gestures;
- context menu;
- text selection;
- drag/drop;
- scrolling/overscroll;
- form submit/reset;
- browser back/forward;
- loading/empty/error/offline/reconnect states.

Every path must have an explicit BERX interaction contract and accessible equivalent.

### W9 — Responsive/accessibility/performance
- Desktop, tablet and mobile Web layouts use the same spatial semantics with different framing/density.
- No breakpoint should destroy the world model.
- Support keyboard, screen reader semantics and reduced motion without creating a generic 2D alternative experience.
- Virtualize large lists/media where appropriate.
- Avoid unnecessary main-thread work.
- Preserve high visual fidelity without sacrificing responsiveness.

### W10 — Verification and evidence
Create feature-specific evidence for each capability.
Evidence must tie to the actual production path, not a test-only synthetic renderer/world.

At minimum:
- Web shell reaches canonical spatial runtime.
- `Berx5DFrame` is the authoritative world source.
- WebGPU executes the production renderer path.
- WebGL2 compatibility path is separately proven where supported.
- HDR values survive the working target.
- Exposure oracle matches expected math.
- Air is composited before tone mapping.
- ACES output is verified.
- Cross-render comparison remains strict.
- Picking identifies actual world entities.
- culling/LOD/instancing affect actual rendering results.
- resource streaming and lifecycle work on actual renderer path.
- device/context recovery is proven or remains BLOCKED.
- mutations satisfy World-after-success.
- voice obeys Voice ≠ Visible.
- interaction audit proves Zero Default.

## Audit discipline
When you find a gap, report it exactly as:
`file → symbol → caller → received data → broken invariant → fix → evidence required`

Classify as:
- Wiring
- Data-shape
- Type hiding
- False PASS
- Mutation-before-success
- TTS duplication
- Default leak

Do not report suspicions as defects. If the full chain cannot be proven, record `NOT FOUND` or `BLOCKED`, not a failure.

## Required final state
Do not declare `FULL` because the source tree looks complete.
Declare a capability ready only when production-path evidence exists.
Maintain an explicit matrix:
`PROVEN / BLOCKED / NOT FOUND`.

## Visual quality bar
BERX must not look like a template, dashboard, bootstrap site, generic social network, or ordinary 3D demo.
It should read as a new spatial social medium:
- immediate sense of place;
- strong focal subject;
- layered depth;
- restrained premium glass;
- cinematic but controlled motion;
- clear interaction affordances;
- zero accidental browser defaults;
- no decorative complexity that obscures action.

## Non-negotiable architectural boundary
Do not create a second world model. Do not mirror `Berx5DFrame` into an unrelated visual scene graph as another source of truth. Adapters may transform data for a backend/API/UI boundary, but authoritative spatial state must converge back into the canonical frame.

## Output expectations while implementing
For each work unit:
1. List changed files.
2. Describe the production-path chain.
3. State what is PROVEN, BLOCKED and NOT FOUND.
4. State which verification evidence is still required.
5. Keep commits focused and reversible.
