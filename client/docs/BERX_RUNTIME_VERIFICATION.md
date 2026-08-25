# BERX Runtime Verification

This release treats a feature as complete only when the full chain works:
UI -> API -> PHP authorization/validation -> MySQL/storage -> API response -> UI state.

## Implemented transactional media publishing

Post/video/track publishing now refuses to silently succeed when media attachment fails. The client rolls back the created post and uploaded media asset using the real DELETE endpoints.

Caption-less media posts use the backend-required minimal non-empty caption contract; the UI never invents visible text.

## What still requires a real environment

The archive cannot honestly claim device/native runtime verification because this environment has no installed React Native native toolchain or live BERX server/database credentials. A release build must run these checks on the target environment:

1. iOS build + install on a physical/simulator device.
2. Android build + install on a physical/emulator device.
3. Register -> activation -> login -> logout.
4. Feed -> create post -> like -> comment -> delete.
5. Photo/video/audio upload -> attach -> read -> delete.
6. Story create -> list -> view -> expiry.
7. Messages -> conversation -> send -> search.
8. Dating -> discover -> action -> matches.
9. Places/events -> create/read/save/RSVP/review.
10. Communities/circles/collections/trips/experiences.
11. Business entitlement/subscription.
12. Security: blocked/private resources, rate limits, ownership, reports.

No item should be marked production-ready until the real request/response is observed.
