# BERX — Web 5D Full Runtime
## Claude Implementation Handoff

This document is the implementation handoff for the Web-first MAX 5D runtime.
It is an implementation specification, not runtime evidence. A capability is not PASS until the production path executes and produces evidence.

## 0. Non-negotiable architecture

Canonical world source: `Berx5DFrame`.

No second spatial core. No DOM state, mock region, random geometry, hard-coded demo entity, or parallel world model may become authoritative.

Canonical path:

`Web entry -> Web shell -> spatial runtime -> Berx5DFrame -> production renderer -> API/domain state -> interaction intent -> server result -> canonical world mutation -> render`

Backend remains OSSN/PHP/MySQL with `/api/v1/*` as the API boundary.

Visual DNA: Premium Dark, background `#07080A`, cyan `#4FD6E8`. Glass belongs to floating surfaces and semantic objects, not every pixel of the page.

## 1. Five dimensions

### X/Y/Z — space
Every spatial entity has explicit world coordinates or an explicit placement derived from canonical world data. Camera framing is derived from world bounds and semantic priority, never from arbitrary per-screen offsets.

### T — time
Time is authoritative runtime state: NOW, event start/end, temporal ordering, freshness, transitions, and live changes. Time-dependent visuals must derive from real timestamps.

### R — relation
Relations are real graph edges: person/content/place/event/community/business/experience relationships. Spatial proximity must never substitute for semantic relation.

## 2. Web shell

### Shell layers

1. World viewport: primary visual layer.
2. Spatial chrome: minimal navigation and utility controls.
3. Context layer: currently selected entity, place, event, person, or action.
4. System layer: notifications, dialogs, transient states.
5. Accessibility layer: focus treatment, keyboard mapping, reduced motion, high contrast, large text.

The shell must preserve a persistent sense of place in the world. Navigation changes context and camera/scene state rather than repeatedly replacing the entire visual identity with unrelated 2D pages.

## 3. Camera contract

Camera must expose:

- position X/Y/Z;
- orientation;
- target;
- field of view or orthographic scale where appropriate;
- near/far planes;
- semantic focus target;
- transition state;
- motion policy.

Default camera framing must target approximately 40–60% useful world occupancy for primary scenes.

Primary subject selection order:
1. active user action;
2. explicitly selected entity;
3. NOW/high-salience entity;
4. nearest relevant entity;
5. scene fallback.

The fallback must still be a real canonical entity or canonical world environment, never generated demo content.

## 4. Composition rules

A primary Web scene should generally contain:

- one dominant spatial subject;
- 1–3 secondary semantic objects;
- visible depth layers;
- enough environment to establish location/context;
- no dead center-only clustering;
- no decorative object whose only purpose is to inflate 3D content.

The world itself should visually occupy approximately 40–60% of the viewport in the primary composition. UI chrome should not consume the majority of the screen.

## 5. Rendering contract

Pipeline order:

`geometry/material evaluation -> direct/indirect lighting -> shadows/AO/volumetric contribution -> HDR scene accumulation -> exposure -> ACES tone mapping -> post -> presentation`

The working scene target must remain linear floating point until tone mapping.

Air/in-scatter must be composited into HDR before tone mapping.

Authored environment appearance/radiance must not be treated as a material albedo and multiplied by the same exposure path.

Exposure gain must be derived from measured transport; target order of magnitude is ~3x, not an arbitrary visual constant.

WebGPU and WebGL2 must consume the same semantic frame and equivalent rendering contract. Backend differences may be recorded as defects; they may not be hidden by permissive gates.

## 6. Spatial materials

Every visible semantic entity must have a material class with:

- base appearance;
- roughness/specular behavior where physically relevant;
- emission only where semantic/highlight meaning exists;
- depth/readability contribution;
- state modulation.

Semantic states may modulate material presentation:

`idle -> available -> focused -> active -> pending -> confirmed -> unavailable -> error`

Visual state may not claim confirmed before authoritative success.

## 7. Spatial action affordances

Actions must behave as spatial objects, not text labels floating over a flat page.

Examples:

- `Событие`: semantic event object with depth and event state.
- `Пойду`: action affordance attached to event context.
- `Сохранить`: object state transitions visually only after authoritative success.

Interaction response hierarchy:

`pointer/keyboard proximity -> hover/focus depth response -> active press state -> request pending -> confirmed or reverted state`

No world mutation occurs on hover, focus, press, or optimistic intent alone.

## 8. World-after-success invariant

Every mutating path follows:

`user intent -> validation -> API request -> authoritative success -> canonical state update -> Berx5DFrame update -> visual transition`

Failure path:

`user intent -> API request -> failure -> no canonical world mutation -> explicit BERX error state`

Do not update:

- world entity status;
- counters;
- membership;
- RSVP state;
- saved state;
- ownership;
- navigation that implies completion;
- realtime canonical state

before the authoritative result exists.

Realtime reconciliation must apply version/order rules before mutating canonical state.

## 9. Voice OS

Voice is not a screen reader replacement and must not simply narrate visible UI.

Maintain separate semantic projections:

- `VisualSemanticState`: what is already visible;
- `SpeechSemanticState`: useful non-visible or state-change information.

Speech candidates should prefer:

- changes since last speech;
- hidden context;
- temporal context;
- relation context;
- memory references;
- navigation completion;
- warnings or accessibility-critical state.

Do not speak labels that are already clearly visible unless the user explicitly requests voice description.

Examples:

Visible: `Berlin Coffee Lab · Open`

Useful speech: `До закрытия 18 минут; сейчас посещаемость выше обычной.`

Not useful speech: `Berlin Coffee Lab, кафе открыто.`

## 10. Registration = Awakening

Registration is the first transition into the world, not a generic form page.

Sequence:

`identity -> visual awakening -> location/privacy choice -> interests -> optional photo -> entry into world`

Requirements:

- no default browser form styling;
- explicit BERX focus/validation states;
- progress expressed spatially, not as a generic stepper where avoidable;
- no world entity shown as the user before server registration success;
- failed registration leaves the canonical world unchanged.

## 11. Core Web surfaces

### Home / NOW
Purpose: show what matters now around the user.

Must combine:

- current context;
- nearby semantic entities;
- current activities/events;
- people/relation signals;
- time-sensitive changes.

The world composition is the primary layer. Lists/cards support the world rather than replace it.

### Feed
Content remains real BERX content. Spatial context may explain why something is relevant without creating fake spatial entities.

### People
Profiles are world entities. Relationship actions follow the world-after-success invariant.

### Places
Place detail combines spatial location, visual identity, hours, reviews, activity, related events, and real actions.

### Events
Event object contains temporal position and place relation. RSVP changes canonical state only after server confirmation.

### Messaging
Conversation context is relational. Opening a conversation is a context transition; sending a message does not mutate canonical counterpart state before server success.

### Search
Search results become spatial candidates with semantic ranking. Search result ordering must come from real API response and not local fabricated ranking.

### Notifications
Notifications are state-change signals. Opening one must preserve the source entity relation and route through the canonical world context where supported.

## 12. Zero Default interaction contract

Explicit BERX behavior is required for:

- pointer hover;
- keyboard focus;
- enter/space activation;
- escape/cancel;
- tab order;
- browser text selection where needed;
- context menu policy;
- drag policy;
- wheel/trackpad scroll;
- touch/pointer gestures;
- overscroll behavior;
- back/forward navigation;
- form submit;
- invalid state;
- loading;
- empty;
- error;
- offline;
- reconnect;
- reduced motion.

Native/browser defaults must not visually leak into the product.

## 13. Responsive spatial behavior

Desktop:
- larger world occupancy;
- richer depth layers;
- pointer hover affordances;
- side/context surfaces where useful.

Tablet:
- preserve primary spatial subject;
- reduce secondary chrome;
- touch-friendly interaction radii.

Mobile web:
- camera remains primary;
- avoid shrinking desktop UI into a tiny layout;
- replace hover with proximity/focus/press semantics;
- preserve depth hierarchy.

## 14. Accessibility contract

Every spatial action needs:

- visible focus state;
- keyboard equivalent where platform supports keyboard;
- accessible name/role/value;
- reduced-motion behavior;
- sufficient contrast mode;
- large text behavior;
- non-color state representation.

Reduced motion must not destroy spatial comprehension; it changes transition mechanics, not semantic state.

## 15. Loading / empty / error / offline

These are designed BERX states, not generic text paragraphs.

Loading:
- preserve context shell;
- indicate which spatial layer is resolving;
- avoid meaningless spinners where a semantic placeholder is possible.

Empty:
- explain why the world has no content in that context;
- provide a real next action.

Error:
- identify failed operation;
- preserve unaffected world state;
- provide retry if retry is valid.

Offline:
- show stale/read-only state explicitly;
- do not claim successful mutation.

## 16. Visual motion language

Allowed semantic transitions include:

`flow, fold, dissolve, warp, teleport, bloom, collapse, wormhole`

Use transition type according to semantic meaning:

- flow: adjacent context;
- fold: navigation into related context;
- teleport: distant context;
- dissolve: replacement/closure;
- bloom: success/activation;
- collapse: dismissal/compression;
- warp: strong temporal/spatial jump.

Motion must respect reduced-motion preferences.

## 17. Evidence requirements

A visual/runtime claim cannot be closed because:

- a class exists;
- a property says true;
- a pipeline object was created;
- a method returns true;
- source code contains the feature name;
- a synthetic frame renders.

Evidence must be tied to the actual production Web path and, where relevant, actual GPU execution/readback.

## 18. Delivery order

W1 — Web shell and shared visual/runtime contracts.
W2 — canonical spatial renderer and real WebGPU/WebGL2 proof.
W3 — real application domains inside the spatial runtime.
W4 — realtime and state reconciliation.
W5 — MAX visual quality, responsive behavior, accessibility, performance.
W6 — end-to-end production verification.

## 19. Definition of Done for Web MAX 5D

A Web capability is DONE only when all are true:

- wired from production entrypoint;
- consumes canonical `Berx5DFrame` where spatial state is involved;
- uses real API/domain data;
- preserves World-after-success;
- respects Voice != Visible;
- has no leaked browser/native default behavior;
- has loading/empty/error/offline behavior;
- has responsive and accessibility behavior;
- has production-path runtime evidence;
- has feature-specific verification where needed;
- no second spatial core was introduced.
