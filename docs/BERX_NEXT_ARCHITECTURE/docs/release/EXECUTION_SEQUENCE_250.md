# BERX — EXECUTION SEQUENCE FOR 250 SCREENS

Do not implement 250 screens sequentially as isolated pages.

## Wave 1 — Platform primitives
Auth, API client, session, navigation, design system, media, error/loading/empty states.

## Wave 2 — Social vertical
Profile + graph + posts + feed + comments + reactions + saves + notifications.

## Wave 3 — Communication
Conversations + messages + attachments + typing + read + reactions + polling/WebSocket boundary.

## Wave 4 — Local vertical
Places + geo + NOW + check-in + events + RSVP + reviews.

## Wave 5 — Community + Match
Communities + roles + moderation + Match + safety.

## Wave 6 — Media/Creator
Stories + Reels + video + audio + Creator + insights.

## Wave 7 — Experiences
Collections + Experiences + Trips + Memories.

## Wave 8 — Rewards
Points + levels + achievements + verification.

## Wave 9 — Business/Commerce
Business + Moments + offers + team + analytics + bookings/payment boundary.

## Wave 10 — Trust/Operations
Settings + privacy + security + moderation + admin + observability + backups.

After each wave: static checks → integration tests → authenticated runtime slice → checkpoint. No wave is called production-ready before runtime evidence exists.
