# BERX Web — MAX 5D Full Runtime Implementation Blueprint

Status: ACTIVE / NON-NEGOTIABLE

## North star

BERX Web is a real, production web application whose single authoritative spatial world is `Berx5DFrame`. The web runtime must be beautiful, legible, fast, accessible and fully connected to the canonical BERX backend. No fake/demo/default behavior is authoritative.

## Product contract

The web experience combines five dimensions:

- X/Y/Z — spatial position and depth.
- T — temporal state, NOW, live activity, transitions and event time.
- R — relational context: people, content, places, events, communities, businesses and experiences.

The runtime loop is:

`DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → REVIEW → EARN → LEVEL UP → DISCOVER MORE`

## Web runtime layers

1. **Application shell** — route lifecycle, authenticated/pre-auth boot, navigation intent, overlays, modals, sheets, command/search entry and responsive layout.
2. **5D world** — authoritative `Berx5DFrame`, camera, world objects, entity identity, X/Y/Z/T/R state, interaction/picking and spatial composition.
3. **Renderer** — WebGPU primary; WebGL2 compatibility/fallback. HDR working target, exposure/tone mapping, PBR/GGX, IBL, shadows, AO/SSAO, post stack, bloom where supported, MSAA/resolve, culling, LOD, instancing, streaming and lifecycle.
4. **Social runtime** — people, feed, stories, profiles, messaging, communities, relationships and notifications.
5. **Real-life runtime** — NOW, places, nearby, events, businesses, experiences and location-aware context that exists in the backend.
6. **Data runtime** — `/api/v1/*` only; OSSN/PHP/MySQL remains canonical unless a documented decision changes it.
7. **Realtime runtime** — presence, message events, notification events, state synchronization and deterministic conflict handling.
8. **Interaction runtime** — pointer/touch/keyboard/wheel/gamepad-compatible intent mapping, hover/focus/press/drag/pick, navigation transitions and safe interruption/cancellation.
9. **State runtime** — explicit initial/loading/partial/ready/empty/error/offline/permission/unauthorized/rate-limited/success/blocked states.
10. **Verification runtime** — feature-specific evidence tied to actual production code paths. Launch remains fail-closed.

## Visual quality bar

No browser-default controls or browser-default focus treatment may leak into the product.

No generic dashboard aesthetic. No accidental purple/orange accents. Canonical visual DNA uses Premium Dark and cyan `#4FD6E8`, with glass reserved for floating surfaces and media-first composition.

Every component must define its visual state, motion behavior, density, focus/keyboard behavior, disabled/error/loading behavior, responsive behavior and reduced-motion behavior.

Spatial effects are semantic: depth, bloom, motion, light and parallax communicate context or hierarchy rather than existing only for decoration.

## No-default rule

Before a screen or component is considered complete, audit:

- buttons, links and form controls;
- focus rings and keyboard navigation;
- text selection, scrollbars and overscroll;
- dialogs, sheets, tooltips, menus and popovers;
- empty/loading/error states;
- avatars/media fallbacks;
- hover/pressed/disabled states;
- mobile/responsive breakpoints;
- reduced-motion behavior;
- typography, spacing, radius, shadows and icon stroke consistency;
- z-index/layering and backdrop behavior.

Everything must be intentionally styled through BERX tokens/components.

## Web information architecture

Primary experience:

`NOW · FEED · PEOPLE · MESSAGES · PLACES · EVENTS · COMMUNITIES · BUSINESS · PROFILE`

Secondary surfaces are contextual and should appear from relationships rather than creating unrelated silos.

The 5D world is not a separate demo page. Real entities should enter the spatial runtime from the application state and remain addressable by stable identity.

## Data integrity

- UI never becomes an alternative source of truth.
- Renderer never creates authoritative entities.
- Demo/sample JSON cannot be treated as production data.
- Server-side authorization is authoritative.
- Ownership/privacy is enforced at backend method/query level.
- Realtime events are validated and version-aware.
- Persistence and UI state must reconcile after reconnect.

## Verification requirements

A capability is `verified` only when the real production path executes and produces feature-specific evidence.

Existence checks, method existence, object construction, hard-coded `true`, synthetic entities, synthetic frames and generic draw/readback are insufficient.

For renderer features, evidence should include the actual production renderer, actual `Berx5DFrame`, submitted GPU work and deterministic observation/readback where technically applicable.

For application features, evidence should include a real API/backend round trip and resulting state reconciliation.

## Delivery order

### Stage W1 — Web runtime foundation

- Canonical route/app shell.
- Shared BERX token source and component primitives.
- Runtime state machine and navigation intents.
- Web entrypoint boots real application runtime rather than static demo behavior.
- Explicit no-default CSS reset/control normalization.

### Stage W2 — Production spatial runtime

- `Berx5DFrame` ingestion.
- Camera/navigation model.
- Real scene composition and object identity.
- WebGPU production path.
- WebGL2 compatibility path.
- HDR/exposure/post integration.
- Picking and interaction mapping.
- Runtime evidence gates.

### Stage W3 — Real BERX application domains

- NOW, feed, stories, people/profile.
- Messaging and notifications.
- Places/nearby and events.
- Communities and business surfaces already backed by OSSN.
- Search, privacy, safety and settings.

### Stage W4 — Live runtime

- Realtime transport.
- Presence.
- Message/notification updates.
- Versioned synchronization.
- Reconnect/offline reconciliation.

### Stage W5 — MAX visual system

- Spatial transitions with semantic intent.
- Cinematic media treatment.
- Contextual depth/light hierarchy.
- Responsive world composition.
- Accessibility modes.
- Performance tiers tied to factual device capability.

### Stage W6 — Production proof

- Build/type/lint/test checks using actual project tooling.
- Browser runtime tests.
- WebGPU feature gates.
- WebGL2 fallback gates.
- Backend integration tests against canonical OSSN/API.
- Security/privacy regression checks.
- Performance budgets.
- Cross-render comparison with known defects tracked rather than suppressed.

## Exit criteria

Web Full 5D is not complete until the web application can boot, authenticate, load the canonical world, render it through a real production renderer, navigate and interact with stable entities, execute real backend actions, receive/reconcile realtime state, handle explicit failure states, and pass the corresponding feature-specific verification gates.

A screen can be visually perfect and still be incomplete. A renderer can be technically sophisticated and still be incomplete. Completion requires both the visual/runtime layer and the real BERX application/data layer working together.