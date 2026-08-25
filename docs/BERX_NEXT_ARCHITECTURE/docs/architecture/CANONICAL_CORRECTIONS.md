# BERX — CANONICAL CORRECTIONS TO EARLIER ARCHITECTURE NOTES

The source snapshot contains older documents that mention Supabase as a runtime backend. Those notes are historical and must not override the final architecture decision.

## Final authority
OSSN/PHP/MySQL is the only production source of truth.

## Supabase
The existing Supabase migrations/files may be retained as reference material only. They must not receive production writes, authenticate production users, or become a parallel backend.

## Web
The web client must be rebound from direct Supabase access to OSSN `/api/v1/*`. Rebind status is tracked in the existing `docs/release/FRONTEND_REBIND_BACKLOG.md`.

## Mobile
React Native uses the same OSSN API contracts and shared domain types.

## Realtime
No Supabase Realtime. Start with polling where required; introduce an OSSN-authenticated WebSocket transport later without moving data authority out of OSSN.

## Payments
No fake payment success. Until a real provider is configured, payment actions return an explicit BLOCKED state.

## AI
AI is optional and removed from the critical product dependency chain. Core BERX discovery/ranking must work deterministically without AI.
