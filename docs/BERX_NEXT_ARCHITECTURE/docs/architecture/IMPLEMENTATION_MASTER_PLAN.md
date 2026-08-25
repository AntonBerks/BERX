# BERX — IMPLEMENTATION MASTER PLAN

## Goal
Build the complete BERX product as connected vertical slices, while preserving OSSN as the only backend authority.

## Phase A — Foundation
1. OSSN session/auth contract.
2. Shared API client and typed errors.
3. navigation registry.
4. design-system primitives.
5. media upload contract.
6. permissions/privacy primitives.
7. notifications event contract.

## Phase B — Social Core
Feed, profiles, graph, posts, comments, reactions, saves, search, notifications.

## Phase C — Communication
Messages, conversations, attachments, read state, typing, reactions, realtime transport.

## Phase D — Local Layer
Places, geolocation, saved places, reviews, check-ins, NOW, business moments, events and RSVP.

## Phase E — Communities + Match
Community membership/moderation and Match discovery/likes/passes/superlikes/matches.

## Phase F — Creator + Media
Creator profile, view log, insights, Stories, Reels/video, audio/music attachments, media processing.

## Phase G — Experiences
Collections, Experiences, Trips, memories and verified experience actions.

## Phase H — Rewards
Points, levels, achievements, verification and reward history.

## Phase I — Business
Business profile, claim, team, media, reviews/replies, offers, events, moments, analytics, booking boundary.

## Phase J — Platform Operations
Settings, privacy, security, moderation, admin, feature flags, observability, backups, recovery.

## Every domain must answer
- Who owns the data?
- Who can read it?
- Who can mutate it?
- What happens on deletion?
- What notification is emitted?
- What analytics event is emitted?
- What is idempotent?
- What is cached?
- What is eventually consistent?
- What happens offline?
- What happens when the backend is unavailable?
- Which UI states exist?
- Which runtime test proves the slice?
