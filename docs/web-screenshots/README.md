# BERX WEB — real runtime screenshots

Captured by `client/scripts/berx-web-screenshots.mjs` from the shipped
`app/index.html` and the shipped bundle built from
`client/scripts/app-shell.entry.ts`, signed in through the real form
against the same `/api/v1/*` server every gate uses.

Every state was reached by driving the product — `world.travelTo`,
`world.focus`, `world.scrubTime`, `world.enterRegion` — never by
building a scene for a picture.

**Hardware limitation, true of every image here:** this container has no
GPU. Every pixel is rasterised on the CPU by mesa's lavapipe at roughly
one frame per second, and WebGPU cannot present to a canvas, so the
backend is WebGL2 in all of them. Nothing here is evidence about
performance.

| # | State | Viewport | World mode | Renderer | Entities |
|---|---|---|---|---|---|
| 01-boot-entry | BERX boot / entry | 1600x1000 @2 | not signed in (entry form) | none yet | — |
| 02-entry-locale-rtl | Locale resolution and RTL, on the real entry | 1600x1000 @2 | not signed in (entry form) | none yet | — |
| 03-living-world | The 5D living world | 1600x1000 @2 | region "world" | webgl2 | 15 |
| 04-now | BERX NOW | 1600x1000 @2 | region "now" | webgl2 | 15 |
| 05-people-gravity | People, and social gravity | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 19 |
| 06-dating-world | The dating world, and only your own | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 21 |
| 07-place-business | A place the server calls a business | 1600x1000 @2 | region "place", focused place:4212 | webgl2 | 22 |
| 12-offer-at-a-place | An offer, attached to a real place | 1600x1000 @2 | region "place", focused experience:offer-501 | webgl2 | 22 |
| 08-events | The events world | 1600x1000 @2 | region "event", focused event:908 | webgl2 | 22 |
| 09-conversation | Messages, as a region you stand in | 1600x1000 @2 | region "conversation", focused message:78 | webgl2 | 25 |
| 10-stories | Stories, which leave when the server says they do | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 25 |
| 11-memories-temporal | T, scrubbed three years back | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 25 |
| 13-creator-world | A creator, with their work standing around them | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 25 |
| 14-profile-in-world | A profile, inside the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 |
| 15-spoken-search | A spoken question, answered in the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 |
| 17-desktop-wide | Wide desktop | 2560x1080 @2 | region "person", focused person:77 | webgl2 | 25 |
| 16-mobile-iphone | Mobile web, at an iPhone's viewport and density | 390x844 @3 | region "world" | webgl2 | 15 |

Page errors during the whole capture: **0**
