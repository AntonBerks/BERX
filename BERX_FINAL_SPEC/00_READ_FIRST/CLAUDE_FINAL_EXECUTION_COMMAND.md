# CLAUDE FINAL EXECUTION COMMAND — BERX

You are continuing an existing BERX production repository. Do NOT restart, scaffold a new app, replace OSSN, rewrite architecture, or create a parallel product.

## Mission
Turn the existing BERX implementation into the final Living Spatial Social experience defined by this specification, using the repository and real backend as the authority.

## First action
Inspect the existing repository, backend/API adapters, current branches/worktree, and `BERX_FINAL_SPEC/`. Determine what is actually implemented. Do not assume that a route, contract, component, or mock means a finished feature.

## Absolute rules
- Never invent API endpoints, response fields, permissions, payments, maps, realtime, analytics, rewards, ticketing, calls, or other backend capabilities.
- If capability does not exist, represent it honestly as unavailable/blocked and preserve the visual contract without fake behavior.
- Never use fake production data merely to make a screen look complete.
- Existing production/backend capability wins over imagined design capability.
- Preserve real authentication, authorization, server authority, validation, and privacy.
- Do not stop at typecheck, route resolution, or static screenshots.
- Test actual runtime behavior.

## Visual target
BERX must feel cinematic, premium, spatial, alive and human. Avoid generic glassmorphism, neon overload, cyberpunk HUDs, dashboard grids, and flat card stacks.

Frozen tokens:
#07080A / #101216 / #4FD6E8
Glass: rgba(255,255,255,.04/.06/.10)
Depth: D0-D5
Motion: 140/220/360/650/900/4000ms
Max tilt ±2.5°
Parallax .15/.20/.35/.65/1.0

5D grammar:
D0 Environment
D1 Atmosphere
D2 Spatial Architecture
D3 Real Content
D4 Identity + Actions
D5 Focus + Energy

Depth must remain perceptible through composition, z-order, scale, perspective, lighting, edge/rim response, shadows, motion and meaningful material—not blur alone.

## Product hierarchy
Human content > decoration.
Environment > container.
Spatial hierarchy > blur.
Typography > effects.
Real data > visual completeness.
Meaningful motion > animation quantity.
Performance > spectacle.
Accessibility > cleverness.
Honest capability > fake polish.

## Execution loop
FIND → UNDERSTAND JUST ENOUGH → IMPLEMENT → TYPECHECK → RUN → MEASURE → FIX → VERIFY → CONTINUE.

Work in large vertical slices. When a screen/domain is touched, complete its states, interactions, navigation, data binding, spatial behavior, accessibility and performance rather than leaving a beautiful shell.

## Required state discipline
Distinguish UNKNOWN, LOADING, EMPTY, ERROR, PRIVATE, NOT_SUPPORTED, OFFLINE and SUCCESS. Never convert missing data into zeroes or fake content.

## Accessibility
Target WCAG 2.2 AA. Minimum 44dp targets. Visible keyboard focus. Screen-reader names/roles/states. Dynamic type. Reduced motion removes parallax/tilt/ambient loops. High contrast must remain usable. Every gesture-only interaction needs an accessible alternative.

## Performance
Target 60fps / 16.7ms interactive budget. Mobile <=3 expensive blur layers. Virtualize long lists. Lazy-load media. Avoid continuous layout reads. Degrade expensive effects before degrading content or hierarchy.

## Completion gate
Do not declare completion until you have concrete runtime evidence for the changed areas: working route, real data where available, relevant states, interactions, transitions, spatial depth, accessibility, performance and no invented backend behavior.

Continue until the highest-value unfinished work is actually complete. Do not merely report what could be done next.
