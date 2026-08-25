# BERX production-readiness patch — 2026-08-21

## What this patch actually changes
- Adds a real React Native package manifest and workspace root manifest.
- Adds Metro/Babel/app entry configuration for the existing monorepo layout.
- Extends TypeScript coverage from `packages/**/*.ts` to the mobile `.ts/.tsx` source tree.
- Replaces the development-only in-memory auth token storage in `AppShell` with a Keychain/Keystore-backed adapter using `react-native-keychain`.
- Establishes the approved BERX mobile design tokens: `#050505`, `#111113`, `#8b5cf6`, `#ec4899`.
- Adds static verification scripts and this readiness document.

## What is intentionally NOT claimed as complete
- iOS/Android native projects are not fabricated. `ios/` and `android/` still need to be generated with the selected React Native version on a machine with the native toolchains.
- No App Store / Play Store build has been produced here.
- Dependencies have not been installed in this sandbox, so native runtime behavior is not claimed as verified.
- Backend payment processing, push notifications, video transcoding/CDN, and production infrastructure are not invented by this patch.

## First real-device sequence
1. Generate native projects against the exact React Native version selected in `apps/mobile/package.json`.
2. Install dependencies.
3. Run TypeScript check over the full mobile tree.
4. Install iOS pods / Android dependencies.
5. Run on a physical iPhone and Android device.
6. Verify login, token persistence, logout, feed, media picker, stories, messages, places and events against the real API.
