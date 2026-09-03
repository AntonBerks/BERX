# BERX — Decision Log

Read this before changing an established decision. Only overturn one with new evidence, not preference.

## Stack
- **Backend stays OSSN/PHP/MySQL.** Evaluated a 456-screen microservices brief (Postgres/Mongo/Redis/Kafka, Swift/Kotlin/Next.js) and explicitly declined it — the existing OSSN core is mature, working, and the redesign is layered on top of it, not a replacement.
- **Mobile stays React Native + TypeScript**, consuming `/api/v1/*`. No native Swift/Kotlin.
- **API surface is `/api/v1/` only.** No undocumented endpoints. New resources (Places, Events, Comments, Sessions, Community requests) were added as new files under `components/OssnApi/v1/`, never by modifying the dispatcher's routing convention.

## Design
- **Accent colour: cyan `#4FD6E8`. FIXED brand identity.** Full history, in order: orange `#ff6a00` (rejected); cyan `#4fd6e8`; violet `#8b5cf6` (rejected as systemic); warm gold `#D9A93F` (tried during a "retire cyan" directive, then rejected). The current, binding instruction is cyan `#4FD6E8` on `#07080A`, with **no purple/violet/magenta anywhere, without exception**. Reference sheets define composition, depth, glass, photography, hierarchy and motion — NOT the palette; a violet/magenta repaint derived from them was reverted on exactly that basis. Every screen reads `colors.accent` rather than a hex, so this one value is the systemic paint.
  - *Why this entry is worded so firmly:* the previous version of this bullet announced the opposite ("cyan IS RETIRED, accent is warm gold") while `tokens/index.ts` five lines below its own matching header defined `#4FD6E8`. That contradiction survived long enough to mislead a real 3D scene (`BerxDepthScene`) into hardcoding a gold palette. Stale accent claims are expensive; keep this bullet true.
- **One fixed identity — no Color World Engine, no user-selectable palettes.** A four-world colour engine (Night/Ice, Day/Ice, Sun, Aurora) behind a `WorldSelectScreen` was built, then retired on explicit instruction: "Spatial остаётся визуальной системой, а не системой смены глобальной палитры." `worlds.ts` collapsed to `scene.ts` (the one real shipped scene), the picker screen and its route/Settings/pre-auth entry points are gone, and `theme/index.tsx` keeps its exact public API (`useBerxColors`/`useBerxGlass`/`useBerxScene`) so no screen changed — it just always resolves to the one identity. Spatial depth/glass/atmosphere is the design language; it is not a theme setting. `colorsDay`/`glassDay` remain defined in `tokens/index.ts` but are read by nothing.
- **Editorial CTA gradient — the violet→orange exception is RETIRED.** `BerxGradientCTA` now draws a single-hue cyan sheen (accent `#4FD6E8` deepening into `#0b5f70`). The old exception was legitimately scoped when it was granted, but the current rule ("no purple/violet/magenta anywhere") has no exceptions, and a warm-orange second stop is not part of the single cyan identity either.
- **Premium Dark, glass-on-floating-elements-only**, not glass on entire pages. Media is the primary visual element; chrome supports it.

## Engineering rules (non-negotiable, repeated project-wide)
- **No fake functionality.** No button whose action doesn't reach real persistence. Verified case-by-case: Places/Events booking-adjacent features (table reservations, ticket payments) do NOT exist — not built, not faked, documented as a real backend gap instead.
- **Ownership checks live at the query/method level**, not as a separate "trust me" check before the real one — e.g. `OssnApiToken::revokeSessionById($id, $userGuid)` puts both in the WHERE clause; a foreign id matches zero rows rather than someone else's data.
- **A client method is only added the same day its PHP endpoint ships**, never speculatively (see the header comment in `packages/api/src/client.ts`).
- **Every new capability was checked against the real class method inventory before being called** — several real bugs were caught this way before shipping (see `BERX_CHANGELOG.md`), including calling non-existent engine functions and misusing methods with wrong argument contracts.

## Known environment limitation
The sandbox this work runs in has the full JS toolchain — `package.json`, `node_modules`, Metro config, a real `tsc` project check, an esbuild web harness and Playwright — so TypeScript, bundling and browser-level rendering are all genuinely verifiable here.

**What is NOT verifiable here: anything native.** There are no `ios/` or `android/` project directories in this repo at all, and the container has no Xcode (it is Linux, so iOS is categorically impossible), no Android SDK/`adb`/`emulator`, and no `/dev/kvm` for accelerated emulation. No native build can be produced or run from this environment. See the "3D / spatial rendering" section for exactly what that does and does not mean for the 3D work.

## 3D / spatial rendering

**Renderer: three.js via `@react-three/fiber/native` on top of `expo-gl`.** Chosen because it is already installed, version-compatible, and is the only native GL path with a real React reconciler in this stack.

**Dependency matrix (verified on disk, not assumed):**

| Package | R3F 9.7.0 peer range | Installed | OK |
|---|---|---|---|
| `three` | `>=0.156` | 0.169.0 | ✅ |
| `@react-three/fiber` | — | 9.7.0 (real `/native` entry) | ✅ |
| `expo-gl` | `>=11.0` | 15.1.7 | ✅ |
| `expo` | `>=43.0` | 57.0.18 | ✅ |
| `expo-asset` | `>=8.4` | 57.0.15 | ✅ |
| `expo-file-system` | `>=11.0` | 57.0.6 | ✅ |
| `react` / `react-dom` | `>=19 <19.3` | 19.2.8 | ✅ |
| `react-native` | `>=0.78` | 0.79.7 | ✅ |

Every peer range is satisfied. **Any comment in this repo claiming three.js/R3F/expo-gl "are not installable, npm is blocked" is stale and wrong** — two such comments (`Berx3DTilt.tsx`, `BerxDepthScene.tsx`) were corrected rather than left to mislead.

**Architecture — one world, not 200 mini engines.** `spatial/engine/stage.ts` holds the semantic 3D tokens (camera lenses, the three-point rig, glass material, emissive scale, motion rates, quality tiers). `spatial/engine/SpatialStage.native.tsx` is the single Canvas + camera + lighting shell every real 3D surface composes from; object files own only their geometry, material and motion. Before this, each object declared its own camera fov and its own light intensities, so objects on adjacent screens were lit by different suns.

**True3D/2D file split.** Every 3D component is a pair: `X.tsx` (2D fallback) and `X.native.tsx` (real GL). Metro prefers `.native.tsx` on iOS/Android; the esbuild web harness has no `.native.` resolution at all (see `build-harness.mjs`), so it always resolves to the 2D file and never parses the GL one. The split is at the FILE level, before either bundler starts — not a runtime capability check. Note that **TypeScript resolves the `.tsx` half**, so any prop the native half accepts must also exist on the 2D half or callers fail the typecheck; the 2D halves accept-and-ignore such props (`quality`, `intensity`) rather than pretending to implement them.

**Quality tiers are real knobs, not labels:** antialias (via `gl`), the fill light, and geometry subdivision. Note `dpr` is deliberately NOT used — R3F's native `Canvas` explicitly omits it (`Omit<RenderProps, 'size' | 'dpr'>`) because expo-gl owns the drawing-buffer size. Verified against the installed typings.

### Verification status — read before claiming "3D works"

Four distinct levels, never conflated:

- **IMPLEMENTED** — code written against the real installed API surface.
- **STATIC VERIFIED** — passes `tsc --noEmit` against the real three.js/R3F typings. Proven to be a real signal, not a rubber stamp: deliberately renaming `<pointLight>` to `<pointLightBOGUS>` produces `TS2339: Property 'pointLightBOGUS' does not exist on type 'JSX.IntrinsicElements'`, and reverting returns to clean. All 6 `.native.tsx` files are confirmed present in the tsc program via `--listFiles`.
- **HARNESS VERIFIED** — the 2D fallback renders in the browser harness with zero page/console errors. This says **nothing** about the GL path.
- **NATIVE VERIFIED** — ❌ **BLOCKED. Not achieved. Not achievable in this environment.**

**Why native is blocked, precisely:** this repo has no `ios/` or `android/` directory, and the container has no Xcode (Linux — iOS is categorically impossible), no Android SDK/`adb`/`emulator`, and no `/dev/kvm`. No GL context has ever been created for this code; nothing in `*.native.tsx` has been run, seen, or profiled.

**To unblock native, in order:** (1) generate the native projects (`npx expo prebuild`, or RN template + `npx install-expo-modules@latest` — this app is bare RN: `AppRegistry.registerComponent`, `react-native run-android`, no Expo entry point, so expo-gl needs the Expo modules bridge bootstrapped); (2) `pod install` (iOS) / Gradle sync (Android); (3) build and run on a real device or accelerated emulator; (4) check the first GL frame — three.js on Hermes occasionally needs polyfills depending on resolved versions (none are used today: no textures, no loaders); (5) only then may anything here be called "native verified", and FPS/memory measured.
