# BERX architecture status

Backend remains the source of truth for real API capabilities. Mobile must not mark a route as connected unless a corresponding API method and real UI action exist.

Current mobile structure:
- `apps/mobile/src/` — screens, route renderer and navigation shell
- `packages/api/` — typed HTTP contract
- `packages/auth/` — authentication/session state
- `packages/core/` — transport primitives and token-storage interface
- `packages/domain/` — domain models
- `packages/design-system/` — shared BERX visual system
- `packages/platform/` — native media/audio adapters

Production rule: never add a fake endpoint, fake counter, fake payment state or fake content merely to make a screen look complete.
