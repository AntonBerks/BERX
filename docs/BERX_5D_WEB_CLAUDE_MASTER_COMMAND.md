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
11. **ZERO 2-D:** BERX must not degrade into a conventional 2D application with decorative 3D effects. Every primary product surface must be spatially authored and spatially interactive. Responsive behavior changes framing, density and camera—not the underlying world model.
12. Intelligence may assist interpretation, discovery, voice and orchestration, but it must never invent authoritative social/place/event state. Facts and mutations come from canonical BERX backend/runtime state.

## Goal
Build the Web MAX 5D runtime end-to-end, with exceptional visual quality and rigorous architectural correctness. The result must feel like one coherent spatial operating environment, not a normal 2D site with 3D effects.

## MAX capability direction
The runtime is not limited to the existing screen list. Expand capability depth aggressively while preserving the existing 200 meaningful screens/states/flows. Prefer richer states, relationships and spatial behaviors over creating hundreds of redundant screens.

BERX should ultimately unify:
- People and social graph;
- NOW / live activity;
- Feed and Stories;
- Moments and Memories;
- Places and nearby context;
- Events and tickets;
- Experiences and Trips;
- Communities and Circles;
- Messaging and presence;
- Search and spatial discovery;
- Creator and media surfaces;
- Reputation, Levels and verified experiences;
- Rewards and wallet/economy where real backend support exists;
- Business / venue infrastructure;
- privacy, safety and trust;
- accessibility and multimodal control;
- voice-first spatial navigation;
- cross-device continuity;
- AR/VR-ready world semantics.

The canonical BERX loop remains:
`DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → REVIEW → EARN → LEVEL UP → DISCOVER MORE`.

## Work sequence

### W1 — Web shell and runtime boundary
- Identify the real Web entrypoint and make it the production shell.
- Establish one runtime lifecycle: boot → capability resolve → frame acquisition → renderer → domain state → interaction → realtime → teardown/recovery.
- Wire all production spatial modules into the Web shell where they are intended to be used.
- Remove orphaned/parallel entry paths only when proven safe.
- Keep public/marketing shell separate from authenticated application runtime.
- The authenticated shell itself must remain spatial; do not place a conventional dashboard around a canvas.

### W2 — Canonical spatial renderer
- Consume only `Berx5DFrame`.
- Implement/prove camera, world transforms, X/Y/Z/T/R, draw-list generation, frustum/occlusion culling, LOD, instancing, picking, world-space text, texture/media streaming and lifecycle.
- WebGPU is the primary backend; WebGL2 is compatibility fallback.
- Do not claim a capability because an object/property exists; require actual production-path evidence.
- Complete HDR pipeline: linear float working target → scene/volumetric composition → exposure → ACES/tone map → post → presentation.
- Exposure gain must be derived from measured scene transport, not an arbitrary aesthetic constant. Target order of magnitude is about 3x only if measurement supports it.
- Authored environment colors are radiance/appearance, not albedo; do not expose the environment incorrectly.
- Keep cross-render gates strict.
- Spatial text, controls, media, cards and navigation must have real world coordinates and camera-aware presentation.

### W3 — Full visual system
Implement one BERX visual grammar across the entire Web application.

Spatial composition:
- World occupancy target 40–60% of the meaningful viewport.
- One dominant object/subject per scene; supporting objects establish depth and context.
- Camera framing derived from object bounds/importance, not arbitrary static offsets.
- Avoid an empty void, but also avoid visual noise.
- No flat dashboard grids as the primary composition.
- Information density may be high, but depth hierarchy must remain legible.

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
- Spatial motion must communicate state, proximity, navigation and causality.

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
- Hidden/unavailable: not pickable and not visually contradictory to renderer residency.

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
- Communities / Circles
- Notifications
- Settings / privacy / safety
- Business surfaces where real backend support exists
- Experiences / Trips
- Memories / Collections
- Creator surfaces where real backend support exists

Do not invent screens for domains that have no real backend. A missing domain remains explicitly blocked rather than represented by fake data.

### W5X — MAX real-world capability layer
The following capabilities are target requirements. Implement only where the real backend/runtime chain exists, and maintain `PROVEN / BLOCKED / NOT FOUND` evidence.

**BERX NOW**
- live activity around the user;
- people nearby;
- places with current activity;
- events starting soon;
- live Moments;
- local density/activity signals;
- time-aware spatial scenes;
- contextual recommendations derived from real state.

**PEOPLE**
- social graph discovery;
- Circles;
- close connections;
- shared interests and context;
- shared plans;
- Memories together;
- reputation and verified experiences;
- real presence where supported;
- privacy-aware proximity.

**PLACES**
- cafes, restaurants, bars, hotels, shops and venues;
- live occupancy/activity where supported;
- hours, menus, offers and events;
- reviews;
- check-in;
- reservation/payment integration only when real backend support exists;
- venue loyalty and Places Pass concepts where supported.

**EVENTS**
- discovery;
- RSVP;
- tickets;
- attendance;
- who is going, respecting privacy;
- event Moments;
- post-event Memories;
- collections and reputation.

**EXPERIENCES / TRIPS**
- experiences;
- route planning;
- shared plans;
- collections;
- check-in and verification;
- reviews;
- rewards;
- trip Memories.

**SOCIAL / MESSAGING**
- direct and group messaging;
- media;
- voice messages;
- Stories;
- reactions;
- presence;
- disappearing content where supported;
- shared Moments;
- spatial conversation context.

**PROGRESSION / REPUTATION**
- Levels;
- reputation;
- verified contributions;
- achievements;
- experience history;
- rewards;
- creator/business reputation where applicable.

**ECONOMY**
- wallet/pass surfaces;
- subscriptions;
- gifts;
- creator monetization;
- offers;
- payments/refunds where real backend support exists;
- never simulate financial success.

**BUSINESS**
- Business Profile;
- dashboard;
- analytics;
- offers;
- events;
- venue management;
- customer activity;
- reservations;
- creator/business collaboration.

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

### W7 — Voice OS 5D
Create a strict separation:
- `VisualSemanticState`: what is already visible/obvious.
- `SpeechSemanticState`: additional context worth speaking.

The voice system is a **Voice OS for the spatial world**, not a chatbot bolted onto a social network.

#### First-entry spatial onboarding
On first authenticated entry, BERX may detect first-run state and provide a short cinematic spoken orientation. Example intent:
- welcome the user;
- explain that BERX connects people, places, events and real experiences;
- spatially point attention toward NOW, People, Places and Events;
- let the user try one real action;
- confirm the result only after server success;
- remember which onboarding concepts were already explained.

Do not force a long tutorial or a sequence of flat 2D slides.

#### Contextual voice
The assistant may understand:
- current spatial position;
- selected entity;
- current action state;
- recent user action;
- first-run/history context;
- relevant unseen relations;
- real time/distance/context;
- accessible alternatives.

Examples:
- “Покажи, что происходит рядом.”
- “Что интересного сегодня вечером?”
- “Найди людей, которым нравится то же.”
- “Покажи мои воспоминания из Берлина.”
- “Открой мой последний Moment.”
- “Я хочу куда-нибудь сходить сегодня.”

Voice intent must resolve into real spatial navigation or real backend actions, not synthetic responses.

#### Voice action contract
`voice intent → intent resolution → permission/validation → real API/action → confirmed success/failure → canonical world update → contextual speech`

The assistant must never claim an action succeeded before canonical confirmation.

#### Speech quality
- Do not read visible labels/cards aloud without semantic value.
- Speak changes, relationships, time, distance, unseen context, errors, confirmations and guidance when useful.
- Allow interruption.
- Avoid repetitive narration.
- Support reduced speech, captions and silent operation.
- Voice must remain optional and accessibility-safe.

### W7X — Multimodal BERX intelligence
Add an intelligence/orchestration layer only as an adapter around authoritative runtime/backend state.

Allowed capabilities:
- natural-language command interpretation;
- contextual discovery;
- onboarding guidance;
- spatial navigation commands;
- summarization of real user-visible/authorized data;
- conversational search;
- proactive but permission-aware guidance;
- personalized recommendations from real preferences/history;
- cross-domain orchestration such as “find a place, see who is going, and add it to my plan”.

Non-negotiables:
- no invented people, events, places, reviews, attendance, payments or achievements;
- no AI-created authoritative social graph;
- no hidden mutation;
- no bypass of permissions/privacy/safety;
- no replacement of `Berx5DFrame` as world truth;
- every factual claim must be traceable to authorized runtime/backend data.

### W8 — Zero Default + ZERO 2-D audit
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

**Zero 2-D acceptance rule:**
- no primary route may silently swap the spatial world for a flat dashboard;
- no mobile route may become a conventional stacked feed solely because viewport width is small;
- no “3D hero + 2D application” split is acceptable;
- cards, navigation, actions and domain transitions remain spatially authored;
- accessibility semantics may use standard DOM/ARIA underneath, but visual product behavior remains BERX spatial;
- if a capability cannot yet be spatially implemented correctly, mark it `BLOCKED` rather than ship a generic 2D substitute.

### W9 — Responsive/accessibility/performance
- Desktop, tablet and mobile Web layouts use the same spatial semantics with different framing/density.
- No breakpoint should destroy the world model.
- Support keyboard, screen reader semantics and reduced motion without creating a generic 2D alternative experience.
- Virtualize large lists/media where appropriate.
- Avoid unnecessary main-thread work.
- Preserve high visual fidelity without sacrificing responsiveness.
- Spatial focus must be visible and semantically equivalent across pointer, touch, keyboard and voice.

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
- voice actions obey permission and server confirmation.
- first-run onboarding uses real production world/action paths.
- interaction audit proves Zero Default.
- Zero-2D audit proves no primary production route falls back to a conventional 2D product.

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
- 2D fallback
- Spatial divergence
- Permission/authority violation

Do not report suspicions as defects. If the full chain cannot be proven, record `NOT FOUND` or `BLOCKED`, not a failure.

## Required final state
Do not declare `FULL` because the source tree looks complete.
Declare a capability ready only when production-path evidence exists.
Maintain an explicit matrix:
`PROVEN / BLOCKED / NOT FOUND`.

## Visual quality bar
BERX must not look like a template, dashboard, bootstrap site, generic social network, ordinary SaaS application, or ordinary 3D demo.
It should read as a new spatial social medium:
- immediate sense of place;
- strong focal subject;
- layered depth;
- restrained premium glass;
- cinematic but controlled motion;
- clear spatial interaction affordances;
- zero accidental browser defaults;
- no decorative complexity that obscures action;
- real-world context rather than empty decorative space;
- voice and multimodal interaction that feel native to the world.

## Non-negotiable architectural boundary
Do not create a second world model. Do not mirror `Berx5DFrame` into an unrelated visual scene graph as another source of truth. Adapters may transform data for a backend/API/UI boundary, but authoritative spatial state must converge back into the canonical frame.

## Platform continuity
Web is first production target, but contracts must remain portable to:
- Desktop;
- iOS;
- Android;
- watchOS companion experiences;
- AR;
- VR/XR.

Do not create platform-specific business logic that prevents convergence on the same BERX social graph, domain contracts and spatial semantics.

## Output expectations while implementing
For each work unit:
1. List changed files.
2. Describe the production-path chain.
3. State what is PROVEN, BLOCKED and NOT FOUND.
4. State which verification evidence is still required.
5. Keep commits focused and reversible.
6. Explicitly state whether the change preserves ZERO 2-D and the canonical `Berx5DFrame` boundary.
