# BERX patch changelog — 2026-08-21

### P0 — mobile foundation
- Added package/workspace manifests.
- Added Metro/Babel entry configuration.
- Added explicit React Native app entry point.
- Expanded TypeScript include scope to the mobile application.

### P0 — authentication security
- Added `BerxSecureTokenStorage` using `react-native-keychain`.
- `AppShell` now uses secure storage instead of the development-only in-memory token store.

### P1 — visual system
- Unified mobile brand tokens around BERX premium dark + violet/pink accents.
- Added gradient endpoints for future components without hard-coding colors in screens.

### Honesty boundary
This patch does not claim native compilation, store readiness or runtime verification because the original export does not contain native `ios/` and `android/` projects and dependencies were not installed in the analysis environment.
