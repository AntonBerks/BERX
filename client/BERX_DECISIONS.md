# BERX — Decision Log

Read this before changing an established decision. Only overturn one with new evidence, not preference.

## Stack
- **Backend stays OSSN/PHP/MySQL.** Evaluated a 456-screen microservices brief (Postgres/Mongo/Redis/Kafka, Swift/Kotlin/Next.js) and explicitly declined it — the existing OSSN core is mature, working, and the redesign is layered on top of it, not a replacement.
- **Mobile stays React Native + TypeScript**, consuming `/api/v1/*`. No native Swift/Kotlin.
- **API surface is `/api/v1/` only.** No undocumented endpoints. New resources (Places, Events, Comments, Sessions, Community requests) were added as new files under `components/OssnApi/v1/`, never by modifying the dispatcher's routing convention.

## Design
- **Accent color: cyan `#4fd6e8` only, everywhere except the one scoped exception below.** History: shipped orange `#ff6a00` first, explicitly rejected ("я устал видеть этот оранжевый"), repainted to cyan via the `--berx-orange` token (kept as a back-compat alias, now `--berx-accent`). A later brief proposed violet `#8b5cf6` — **not adopted**; cyan remains the single systemic accent (links, focus rings, primary buttons, badges) everywhere else. Do not reopen this without an explicit, unambiguous instruction to repaint again — it has cost real rework three times already.
- **Editorial CTA gradient — violet `#8b5cf6` → orange `#ff6a00` — scoped exception, added with an explicit reference image and confirmed in-session.** Used ONLY for the one social "Follow"-class CTA component, `BerxGradientCTA` (design-system) — never spread to any other button, badge, or accent use. Reuses the exact two hex values already on record above (both previously rejected as a *systemic* accent) rather than inventing new ones — the same colors, in a new, deliberately narrow role. If a future change wants this gradient anywhere else, that's a new instruction, not an extension of this one.
- **Premium Dark, glass-on-floating-elements-only**, not glass on entire pages. Media is the primary visual element; chrome supports it.

## Engineering rules (non-negotiable, repeated project-wide)
- **No fake functionality.** No button whose action doesn't reach real persistence. Verified case-by-case: Places/Events booking-adjacent features (table reservations, ticket payments) do NOT exist — not built, not faked, documented as a real backend gap instead.
- **Ownership checks live at the query/method level**, not as a separate "trust me" check before the real one — e.g. `OssnApiToken::revokeSessionById($id, $userGuid)` puts both in the WHERE clause; a foreign id matches zero rows rather than someone else's data.
- **A client method is only added the same day its PHP endpoint ships**, never speculatively (see the header comment in `packages/api/src/client.ts`).
- **Every new capability was checked against the real class method inventory before being called** — several real bugs were caught this way before shipping (see `BERX_CHANGELOG.md`), including calling non-existent engine functions and misusing methods with wrong argument contracts.

## Known environment limitation
This chat environment has the mobile source tree (`/home/claude/berx/client`) but **no `package.json`, no `node_modules`, no native `ios/`/`android/` projects, no Metro config**. `tsc` (v6.0.3) is available globally and gives a real, valid typecheck signal for the TypeScript source. Full RN build/run/test (`npx react-native run-ios`, Jest, ESLint with the project's real config) cannot be executed here — those checks are real work items for wherever the full toolchain lives, not skipped by choice.
