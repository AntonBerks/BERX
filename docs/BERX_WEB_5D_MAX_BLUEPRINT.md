# BERX WEB — MAX 5D FULL RUNTIME BLUEPRINT

## Mission

Make Web the first production-grade BERX MAX 5D runtime. The Web implementation is the reference execution path for the shared BERX spatial model and must remain compatible with future Desktop, iOS, Android, watchOS, AR and VR runtimes.

This document is an implementation contract, not a visual wish-list.

## Hard rules

- `Berx5DFrame` is the only authoritative world/frame source.
- The five runtime dimensions are `X/Y/Z/T/R`: spatial position, temporal state, and relational topology.
- OSSN/PHP/MySQL and `/api/v1/*` remain the canonical application data boundary.
- No mock, random, synthetic, hardcoded-demo, DOM-only or parallel authoritative world state.
- A renderer capability is true only after production-path runtime evidence.
- Launch and readiness are fail-closed: an unverified required capability is BLOCKED, never PASS.
- Premium Dark and cyan `#4FD6E8` remain the BERX visual identity.
- The UI must be unmistakably BERX: no browser defaults, generic component-library appearance, accidental fallback controls, or placeholder states.
- Spatial presentation must improve comprehension and interaction; it must not become a decorative 3D demo.
- Reduced motion, contrast, keyboard access, touch/pointer access and text readability remain first-class constraints.

## Web runtime layers

### 1. Application Shell

Own one application shell for authenticated and unauthenticated web states. The shell owns viewport, safe areas, global navigation, command/search access, notifications, route transitions, focus restoration, overlays, error boundaries and runtime diagnostics.

### 2. Spatial World

`Berx5DFrame` feeds the canonical world. Every world entity must retain stable identity, type, position (`x/y/z`), time (`t`) and relations (`r`). The DOM may present controls and accessible text, but it must not create a second authoritative world.

### 3. Renderer

WebGPU is the primary renderer. WebGL2 is the compatibility backend. The renderer contract must cover actual execution for HDR, tone mapping, PBR/GGX, IBL, shadows, AO/SSAO, post processing, bloom, MSAA/resolve, culling, LOD, instancing, streaming, world-space text, picking and device/resource lifecycle. Missing evidence blocks readiness.

### 4. Interaction Runtime

Pointer, keyboard, wheel, touch and future XR/controller intents map into one navigation/action contract. Spatial hit testing and semantic UI hit testing must produce the same entity identity/action semantics. Focus and pointer capture must be deterministic.

### 5. Temporal Runtime

`T` is not a number stored only for rendering. It drives NOW/live state, event timing, presence/activity freshness, transitions, expiry and time-aware UI. Temporal state must be versioned where concurrent updates are possible.

### 6. Relational Runtime

`R` represents graph relationships among People, Content, Places, Events, Communities, Businesses and Experiences. Relation changes must come from canonical data and realtime events, not client guesses.

### 7. Data Runtime

The web client talks to the canonical OSSN boundary through `/api/v1/*`. Authentication, authorization, ownership, privacy and persistence are server authoritative. Client state is a projection/cache, never the source of truth.

### 8. Realtime Runtime

Realtime transport must be authenticated, per-user/per-resource authorized, ordered/versioned where needed, reconnectable and observable. Presence, messaging, notification updates and world changes must enter the same application state graph rather than parallel event silos.

### 9. Media Runtime

Images/video/audio use explicit loading, decoding, cancellation, caching, visibility-aware playback and failure states. Media never blocks the entire world when one asset fails. Placeholder assets are visibly and semantically distinct from production assets until replaced.

### 10. Visual System

All components use BERX tokens. Glass is reserved for floating/interface surfaces, not every container. Hierarchy comes from depth, scale, typography, luminance and motion before adding decoration. Every state has a designed visual response.

## Required product surface

The Web runtime must make the real BERX domains discoverable and actionable through the spatial system:

- NOW
- Feed / content
- Stories
- People / profiles
- Messaging
- Places / nearby / saved places
- Events / RSVP / invites / attendees
- Communities / membership / requests / moderators
- Search
- Notifications
- Business surfaces that have real backend support
- Settings / privacy / sessions / account controls

Features without canonical backend support remain explicitly BLOCKED and are not rendered as fake working modules.

## State model

Every major screen/route/action requires explicit states:

`idle`, `loading`, `ready`, `empty`, `partial`, `error`, `offline`, `unauthorized`, `forbidden`, `not-found`, `saving`, `saved`, `conflict`, `stale`, `retryable`, `success`, `destructive-confirmation`.

State transitions must be deterministic and testable. No undefined visual fallback is allowed.

## Visual quality contract

A Web surface is not complete merely because it functions. It must pass:

- composition and spacing review;
- responsive review at narrow, normal and wide viewports;
- keyboard/focus review;
- reduced-motion review;
- high-contrast and text-scaling review;
- media failure review;
- loading/empty/error review;
- performance review;
- no-native-defaults review;
- cross-render visual consistency review where both backends are available.

## Verification contract

Each capability requires evidence from the actual production path. Evidence should identify:

- capability;
- backend/platform;
- execution path;
- input fixture or real runtime state;
- observed result;
- expected result;
- readback or externally observable proof where applicable;
- timestamp/build identifier.

Source existence, method existence, `try/catch` success, hardcoded `true`, non-null placeholders, synthetic entities and self-authored claims are insufficient.

## Web execution order

### W1 — Runtime foundation

Application shell, canonical runtime context, route/state integration, visual token contract, capability/evidence model and production diagnostics.

### W2 — GPU runtime

Finish the WebGPU production path and WebGL2 compatibility path against the real `Berx5DFrame`. Resolve remaining cross-render differences without weakening gates.

### W3 — Spatial application

Bind real BERX entities and domains to the spatial runtime. Replace page-isolated navigation with spatially meaningful transitions and entity-preserving navigation.

### W4 — Live runtime

Authenticated realtime, presence, messaging updates, notifications, world-state updates, versioning/conflict handling and reconnect behavior.

### W5 — MAX UX/visual quality

Cinematic but restrained motion, depth hierarchy, media treatment, responsive behavior, accessibility, loading/empty/error/offline states, interaction polish and performance budgets.

### W6 — Production proof

End-to-end verification from authentication through real API/backend state, rendered output, user actions, persistence, realtime propagation and recovery paths.

## Definition of Done

BERX Web is `FULL` only when all required W1-W6 gates pass and no required capability remains `BLOCKED`, `UNKNOWN` or `UNVERIFIED`.

A green document or issue without runtime evidence does not constitute completion.

## Platform portability rule

Future native/XR implementations must consume the same conceptual `Berx5DFrame`, entity identity, X/Y/Z/T/R semantics, navigation intents and domain contracts. Platform-specific rendering/input code may differ; world semantics may not.
