# BERX — 5D Web Full Runtime Contract

Status: **ACTIVE / NON-NEGOTIABLE**

This document defines the acceptance target for the BERX Web runtime before native platform work is allowed to redefine or duplicate the world model.

## 1. Canonical world

`Berx5DFrame` is the only authoritative spatial world representation.

No DOM tree, CSS layout, mock region, synthetic demo world, random geometry, or parallel backend world may become authoritative.

Every rendered/interactive entity must retain:

- stable entity identity;
- X/Y/Z spatial coordinates;
- T temporal state/context;
- R relational context;
- camera/world semantics;
- server-backed source identity where the entity is persistent.

## 2. Five dimensions

### X/Y/Z — Space

The Web runtime owns a real coordinate system, camera, depth ordering, transforms, visibility, hit testing and spatial transitions.

### T — Time

Time is runtime state, not decoration. `NOW`, live updates, event timing, countdowns, freshness, temporal transitions and replay/history must be derived from actual state.

### R — Relations

Relations are first-class runtime data. People, content, places, events, communities, businesses and experiences must connect through a shared graph rather than isolated screen-local state.

## 3. Rendering contract

The production Web renderer must:

- prefer WebGPU when available;
- provide a factual WebGL2 compatibility path;
- consume the same authoritative `Berx5DFrame`;
- use real HDR working targets and post processing;
- use real resource/bind-group contracts;
- verify PBR/GGX, IBL, shadows, AO/SSAO, bloom and other claimed capabilities by execution evidence;
- implement deterministic frame/resource lifecycle;
- remain fail-closed when a required capability is unavailable or unverified.

A capability cannot be marked `true` because a field exists, a pipeline object was constructed, or a method returned without throwing.

## 4. Interaction contract

All meaningful UI actions map to a runtime intent/state transition and, where applicable, a real `/api/v1/*` operation.

No dead buttons, fake success, speculative client methods, or local-only authoritative writes.

Picking, focus, navigation, drag/pan/zoom and keyboard interaction must resolve back to canonical entity identity.

## 5. Application contract

The Web application must be a real BERX product, not a marketing page masquerading as the product.

Primary domains:

- Feed/content
- Stories/moments
- People/profile
- Messaging
- Places
- Events
- Communities
- Search/discovery
- Notifications
- Business
- Settings/privacy/safety

Domains without real backend support remain visibly blocked/disabled rather than mocked.

## 6. Backend contract

OSSN/PHP/MySQL remains canonical.

The Web client must use the existing `/api/v1/*` boundary. Authorization, ownership, privacy and validation must remain server-authoritative.

Realtime state must have identity, authorization and deterministic version/conflict semantics.

## 7. Visual contract

BERX visual language:

- background `#07080A`;
- accent `#4FD6E8`;
- premium dark spatial composition;
- floating glass surfaces, not blanket glass everywhere;
- media-first hierarchy;
- no generic browser/dashboard defaults;
- no framework-default component appearance;
- no arbitrary palette drift;
- no purple-dominant theme;
- no gratuitous gradients used as a substitute for depth;
- motion must have purpose, continuity and reduced-motion behavior.

## 8. State contract

Every production surface requires explicit states where relevant:

`idle → loading → ready → refreshing → success / empty / error / offline / unauthorized / forbidden`

Destructive actions also require explicit confirmation and real server result handling.

## 9. Verification contract

The project must maintain independent evidence for:

- source architecture;
- runtime execution;
- GPU execution/readback;
- backend persistence;
- authorization/privacy;
- realtime synchronization;
- cross-render consistency;
- responsive Web behavior;
- accessibility;
- performance;
- production build/deployment.

A source-only assertion is not runtime evidence.

## 10. Platform strategy

Web is the first canonical production runtime.

Native iOS/Metal, Android/Vulkan, desktop GPU, watchOS and OpenXR must consume the same world/core contracts later. They must not invent second world models.

## 11. Definition of done for Web Full Runtime

Web is **FULL** only when the production path is:

`real data → canonical world → runtime state → spatial renderer → interaction → real backend mutation → persisted result → realtime synchronization → verified visual/runtime evidence`

and all mandatory gates pass.

Until then the launch state is **FAIL-CLOSED**.
