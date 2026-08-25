# 250-SCREEN IMPLEMENTATION RULES

## A screen is real when
1. navigation reaches it;
2. it consumes a defined domain contract;
3. it has real loading/empty/error/success states;
4. its primary action reaches a real backend action;
5. authorization is enforced server-side;
6. destructive actions have confirmation/undo semantics where appropriate;
7. analytics identifies the surface and primary outcome;
8. it has at least one integration/runtime test when it changes persisted state.

## Shared states
Do not duplicate components for common states. Use design-system primitives for:
- loading skeleton;
- empty state;
- error state;
- retry;
- offline state;
- permission denied;
- not found;
- deleted entity;
- rate limited;
- authentication expired.

## 250-screen scalability
The registry is a contract index, not 250 bespoke implementations. Screens compose reusable domain components and flows. A new screen must reuse existing contracts/components unless an ADR proves a new abstraction is required.
