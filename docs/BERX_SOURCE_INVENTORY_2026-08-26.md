# BERX — Source Inventory (cloud dev environment), 2026-08-26

Snapshot of what is verifiably present in `/home/user/BERX` (this cloud
session's git checkout) as of 2026-08-26, and what real checks were run
against it. Written to sit alongside `client/BERX_PROGRESS.md` /
`client/BERX_CHANGELOG.md`, not to replace or contradict them — those
describe work done in earlier sessions' environments, which may or may not
match what's on the VDS. This file only states what's true of the three
places named below, each treated separately.

## Three places, not one

1. **`/home/user/BERX`** (this cloud dev environment) — what this document
   describes. Ephemeral container; only what's committed to git survives
   between sessions.
2. **GitHub (`AntonBerks/BERX`)** — the permanent source of truth. As of
   this snapshot, branch `claude/opt-berx-contents-ij6gnl` is fully in
   sync with this checkout.
3. **VDS (`/opt/berx`)** — a separate real PHP/MySQL/Nginx runtime,
   **not reachable from this cloud session**. Its contents are unknown
   until inventoried directly (from the user's own machine). **Absence of
   something in (1)/(2) is not evidence of its absence on (3).**

## What's verifiably in the git tree right now

### Backend — `backend/opensource-socialnetwork-master/`
Vanilla OSSN core (auth, sessions, profiles, wall, comments, likes,
messages, notifications, groups, photos, chat, search, etc. — the
`components/` listed in the fork's `.gitignore` whitelist) plus BERX
domain classes that **do** exist under `classes/`:
`OssnCircles`, `OssnCollections`, `OssnBusiness`, `OssnBusinessMoments`,
`OssnTrips`, `OssnExperiences`, `OssnCreator`, `OssnNearbyImpressions`,
`OssnGeo`, `OssnPlaceHours`, `OssnMediaAssets`, `OssnSignals`.
Theme `themes/berx` (Premium Dark, cyan accent) present.

**Not present anywhere in this git tree**, though described as COMPLETE in
`client/BERX_PROGRESS.md`/`BERX_CHANGELOG.md` and audited in
`backend/opensource-socialnetwork-master/API_SECURITY_MATRIX.md`:
`components/OssnApi` (the `/api/v1` dispatcher + `OssnApiToken`), and the
`OssnPlaces`/`OssnEvents`/`OssnDating`/`OssnPoints`/`OssnReport`/`OssnAdmin`
domains and their API wrappers. Root cause found and fixed this session
(commit `f915ff4`): the fork inherited upstream OSSN's `.gitignore`, which
blanket-ignored `/components/*` and whitelisted back only the vanilla OSSN
component list — every BERX-custom `components/*` addition was silently
never tracked by git. **Whether this code still exists on the VDS is
unknown and not addressed here** — that's the next inventory step, done
from the VDS side.

### Mobile client — `client/`
Full React Native + TypeScript source tree: `apps/mobile/src/screens`
(~90+ screens), `packages/api` (client + types), `packages/design-system`,
`packages/domain`, `packages/auth`, `packages/platform`. No
`node_modules`, no native `ios`/`android` projects, no lockfile — a
standing, previously-disclosed environment limitation
(`client/BERX_DECISIONS.md`), not new to this session.

### Static site — repo root
`index.html`, `styles/berx.css`, `scripts/berx.js`, `assets/`, `data/` —
no build step, untouched this session.

### Docs layer — `docs/BERX_NEXT_ARCHITECTURE/`
A separate 250-screen master-plan/registry, dated 2026-08-25. Every entry
in `docs/screens/SCREEN_REGISTRY_250.json` is status `PLANNED` — this is a
planning layer, not a record of implementation.

## Real checks run this session (2026-08-26)

- **PHP syntax (`php -l`) across the entire backend tree**: 1152/1152
  files, **0 syntax errors**.
- **TypeScript (`tsc --noEmit`) against `client/`**: the sandbox has no
  `node_modules`, so a direct run cascades into ~290
  cannot-find-module/jsx-runtime errors from missing `react`/
  `react-native` alone (expected, previously disclosed). To see past that
  cascade, built a disposable ambient-module type shim (same method
  described repeatedly in `BERX_CHANGELOG.md`: "disposable diagnostic
  shim … deleted after"), typechecked against it, classified every
  resulting diagnostic as either a shim artifact (fixed the shim) or a
  real code issue (fixed the code), then re-verified with the shim
  removed. Shim was never committed — lived only in the session scratch
  dir, deleted after use.

  Real, fixed findings:
  - 3 genuinely untyped callback parameters in `BerxNavigator.tsx`
    (`useState` updater callbacks) — added explicit `StackEntry[]`
    annotations.
  - 1 in `NearbyNowScreen.tsx`'s `FlatList` `keyExtractor`/`renderItem` —
    added the existing local `Row` type.
  - 90 files import a default `React` binding that is never read — dead
    under this project's `"jsx": "react-jsx"` (automatic runtime, no
    default import needed) and only invisible before now because the
    missing-module cascade always fired first and suppressed
    `noUnusedLocals` reporting on that specific binding. Removed the dead
    binding from all 90 (kept every named hook import unchanged).

  Confirmed NOT real (shim artifacts from the shim's own incompleteness,
  not code bugs) after improving the shim to match real `@types/react`
  semantics (JSX `key` handling, `React` namespace merge, generic
  `FlatList<T>`, `useRef<T>(null)` overload): the ~40 `FlatList` prop
  "type mismatch" errors, the 2 `BerxGlassSurfaceProps`/`key` errors, and
  the `react-native-keychain`/`@react-native-documents/picker` missing-
  export errors — none of these needed a source change.

  Net effect on the real (unshimmed) `tsc --noEmit` baseline: error count
  went from 335 → 312, entirely from the 16 files whose only import from
  `'react'` was the now-removed dead default binding (one fewer
  cannot-find-module hit each). The remaining 312 are unchanged in kind —
  100% attributable to the standing, disclosed absence of `node_modules`
  in this sandbox, not new regressions.

## Next step (deferred, not started)

Inventory `/opt/berx` from the VDS side (the user will do this from their
own machine) and diff it against this repo. Only after that comparison
should any decision be made about recovering/porting code from the VDS —
not attempted or guessed at in this document.
