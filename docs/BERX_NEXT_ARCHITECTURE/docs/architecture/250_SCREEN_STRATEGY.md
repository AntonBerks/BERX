# BERX — 250 SCREEN STRATEGY

250 is the target for meaningful UI surfaces/states, not a target for decorative files.

Each registry entry must eventually map to:
- route/screen ID;
- domain;
- entry point;
- backend contract;
- primary action;
- permissions;
- loading/empty/error/success states;
- analytics event;
- implementation status.

## State multiplication rule
A single business surface may have multiple meaningful states. Do not count cosmetic variants as separate screens. Count only states that change user action, data, permission or outcome.

## Navigation principles
- 5-icon primary navigation on mobile.
- Deep links resolve to authenticated or public destinations.
- Back navigation preserves context.
- Modal flows return to the originating surface.
- Protected routes require OSSN session.
- Disabled features are not presented as functional.
