# BERX 5D ULTIMATE v9 — HANDOFF STATUS

**Generated from measurement, not assertion.** Every DONE below traces to
something a probe or a typecheck actually checked. Reproduce with:

```
cd client
npm run verify:v9        # contract + spatial runtime, 19 gates, Node
npm run verify:v9:web    # the same runtime measured in real Chromium, 18 gates
npx tsc -p tsconfig.json --noEmit
node scripts/v9-status.mjs      # the facts these reports are written from
```

## What this takeover found

The v9 layer was absent from the client. What existed was solid and was
kept: a real OSSN/PHP/MySQL backend, a real `/api/v1/` client with ~200
methods, ~78 React Native screens loading real data, and a design-token
file. What did not exist: any depth system, any material or lighting
model, the 300 scene contracts, and any way to verify a visual claim at
runtime.

Nothing was restarted, reverted or replaced. The backend, the API client
and every screen's data layer are untouched.

## Status

| Area | Status | Evidence |
|---|---|---|
| 300 screen contracts resolvable | **DONE** | 300/300 by screenId, route path and route name — Node probe, and again in Chromium |
| 13 scene families | **DONE** | AUTH 30, HOME 30, EXPLORE 30, NOW 30, PROFILE 30, SOCIAL 25, MESSAGES 25, PLACES 25, EVENTS 20, EXPERIENCE 20, COMMUNITY 15, CREATOR 10, BUSINESS 10 |
| 5D spatial runtime | **DONE** | `@berx/spatial` — depth, camera, materials, lighting, motion, performance, scene composition. Pure TS, consumed by both platforms |
| Web 5D runtime | **DONE** | `scripts/berx-5d.runtime.js` + `styles/berx-5d.css`, generated from the same source; 18 browser gates |
| Materials render distinctly | **DONE** | 10 materials, no two producing the same surface signature; verified again on painted pixels in Chromium |
| Reduced motion | **DONE** | Measured in-browser: parallax offsets 0, tilt ceiling 0deg, ambient animation `none`, every layer and its content still painted |
| Performance budget | **DONE** | Blur ≤3 layers on every platform; runtime adapts on measured missed frames (15% → 0%) without losing depth, parallax or a layer |
| Screens on the runtime | **PARTIAL — 13 of 29 named contracts** | See BERX_V9_SCREEN_STATUS.md |
| Component resolution | **DONE** | All 50 contract-requested components resolved; 0 unrendered components (gated) |
| Real data only | **DONE** | Endpoints typed as `keyof BerxApiClient` — an invented endpoint cannot compile |
| Seven states | **DONE for wired scenes** | `BerxDataBoundary`; contract-only scenes carry the full state set, dataless scenes honestly carry three |
| Accessibility | **PARTIAL** | See BERX_V9_ACCESSIBILITY_REPORT.md — real defects found and fixed; unconverted screens not yet audited |
| Analytics | **PARTIAL / BLOCKED sink** | Contract implemented; BERX has no analytics endpoint, so events go to a bounded local buffer and any attached sink |
| Automated tests | **MISSING** | No test runner is configured in this repo. The two probes are the executable verification that exists |

## Blocked, with reasons

None of these are stubbed. The component is absent and the scene says why.

| Capability | Reason |
|---|---|
| `BerxMap`, `BerxMapPin` | No map renderer installed (no react-native-maps/MapLibre) and no tile or geocoding provider configured. `/api/v1/nearby` returns real coordinates and distances, so NOW and Places render a distance-ranked list instead of an empty map frame. |
| `BerxCallSurface` | No signalling, media server or call-session resource anywhere under `/api/v1/`. |
| `BerxTicket`, `BerxWalletCard` | Events have real RSVP and capacity; payment, ticket issuance and wallet passes have no endpoint or provider. Points are real; money is not. |
| `BerxMediaCard` | The HOME contract names it, but `feed.php` returns no media per item by design (avoiding an N+1). Post detail fetches assets separately and uses `BerxMediaGrid`. Built during this pass, then removed rather than shipped unrendered. |
| Color-world persistence (BERX-004) | `POST /api/v1/me` accepts only firstname, lastname, email, password. No profile-preference resource exists, so a chosen world can only be device-local. |
| General interest tags (BERX-005) | The only interests resource is `POST /dating/interests`, which records a dating like — a different capability, not a tag list. |
| Account-wide privacy (BERX-008) | `/dating/privacy` governs the dating profile only; post visibility is real but per-post. No account-wide privacy resource. |
| Another user's saved places / events / connections | Those endpoints are caller-scoped by design. Owner-only tabs rather than fabricated lists. |
| Creator earnings | Points and rewards are real and server-authoritative; there is no balance, payout or payment processor. |
| Business reach analytics | The dashboard returns real ratings, reviews and nearby impressions. There is no page-view, reach or conversion pipeline. |
| Realtime sockets | No WebSocket infrastructure. Typing status polls on an interval and says so. |
| Automated test suite | No runner configured. Not skipped by choice — a real work item for wherever the full toolchain lives. |

## Defects found by measurement and fixed

These were not visible in review; a probe or a typecheck surfaced each one.

1. **Controls projected below their touch target.** Depth was anchored on
   D5, so the content plane rendered at 0.86 and a 44px button painted
   38px. The content plane is now the reference: D3 renders 1:1, so body
   text is never resampled. Controls paint 44–46px.
2. **`blur(0px)` is not `none`.** A layer with no blur budget still
   created a backdrop root and still cost the compositor.
3. **A 4-layer desktop blur budget was unsupported by measurement.** Same
   scene, same scroll, filters removed: 0 dropped frames of 39 versus 10
   with glass. The archive specified 3; the measurement agreed.
4. **Median frame time hid the problem.** Three blurred layers gave a
   perfect 16.7ms median while ~23% of frames arrived late. The runtime
   now judges itself on missed-vsync ratio as well.
5. **Own message bubbles were unreadable** — near-white on the cyan
   accent, 1.59:1 measured against a 4.5:1 target.
6. **Profile had no ScrollView**, so the lower half of its menu was
   unreachable on a phone.
7. **Business moments were never loaded**, only fetched after publishing
   one — an owner returning to the dashboard saw an empty list while
   moments were live.
8. **Place detail never called the structured-hours endpoint**, so a
   place with real hours never showed whether it was open.
9. **Message delete was long-press only**, with nothing visible and no
   alternative.
10. **The tab bar had no accessible names at all** — icon-only, announced
    as nothing.
11. **Twelve spatial components were built and rendered by nothing.** All
    resolved; a probe gate now fails the build if it recurs.
12. **A duplicate business dashboard** existed unrouted, drifting beside
    the real one.

## Corrections to my own earlier claims in this pass

- BERX-091 was recorded BLOCKED on open-now filtering. Wrong: `/api/v1/nearby`
  has a real filter backed by structured hours. The real limit is narrower —
  a place without structured hours returns `is_open_now: null` and is never
  hidden, because unknown is not closed.
- `BerxStoryTray` required a `seen` boolean. The stories feed returns no
  per-viewer seen flag. It is now optional, and an unknown ring claims
  nothing.

## Next

1. Convert the remaining 16 named contracts (see BERX_V9_SCREEN_STATUS.md).
2. Audit the ~60 unconverted screens for the same defect classes found here
   — contrast, touch target, gesture-only interaction, missing scroll.
3. Configure a test runner; the probes cover the runtime, not the units.
4. Attach a real analytics sink if one is ever built.
