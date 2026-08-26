# BERX Future Layer — architecture spec

Foundation for Life Graph / Experience Graph / Social Map / City Mode /
Reputation / Personal World. One connected system, not six.

## Core decision: no new graph store

`ossn_relationships` (relation_from/relation_to/type/time) is already a
real generic typed-edge table — already carrying `friend:request`,
`place:save`, `event:going`, `group:join:approve`, `group:moderator`,
circle members. The Future Layer is a **read-time composition layer**
over this plus existing domain tables (`ossn_place_reviews`,
`ossn_trips`, `ossn_experiences`, `ossn_points_log`). No new "graph"
table — that would duplicate data this codebase already has.

## Entities (all pre-existing)

Person (OssnUser), Place (OssnPlaces), Event (OssnEvents), Community
(OssnGroup), Experience/Trip (OssnExperiences/OssnTrips), Business (a
Place flag), Reward (OssnPoints).

## Derived edges (no new storage)

| edge | real source |
|---|---|
| person --saved--> place | `place:save` relation |
| person --going/attended--> event | `event:going` relation; `attended` = going + `has_ended` |
| person --reviewed--> place | `ossn_place_reviews` row |
| person --joined--> community | `group:join:approve` relation (relation_to = member) |
| person --created--> experience/trip | `owner_guid` on the real table |
| person --earned--> reward | `ossn_points_log` row |
| person --met--> person | co-attendance: both have `event:going` on the same event, scoped to real friends only (see privacy rule) |

## API boundary

`GET /lifegraph/me` — one bounded, real read composing the table
above (edges list + live summary counts). No write surface in v1;
every edge already has its own real write path (save/RSVP/review/
join/points).

## Privacy rule

Own graph: always full. A `met_person` edge is only ever surfaced for
someone who is **already a real friend** — never a stranger's
attendance, even though that's independently visible via
`/events/{id}/attendees` today. No raw person geo-location is ever
exposed anywhere in this layer.

## Downstream concepts (build ON this, not parallel to it)

- **Social Map** = existing `OssnGeo` place/event pins + `presence.php`'s
  real friends-online layer. No new person-location data.
- **City Mode** = a radius-scoped summary header over `nearby.php`'s
  existing query — not a new geo system.
- **Reputation** = the same live counts as the Life Graph summary
  (places reviewed, events attended, experiences created) — no
  invented score, same honesty rule as `wrapped.php`.
- **Personal World / Dynamic Discovery** = ranks Places/Events by graph
  proximity (mutual friends who saved/are going) instead of raw
  distance — a real signal from the same edges, no AI.

## First implemented slice

`GET /lifegraph/me` (this commit) — the foundation every concept above
reuses.
