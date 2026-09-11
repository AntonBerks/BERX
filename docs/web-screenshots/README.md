# BERX WEB — real runtime screenshots

Captured by `client/scripts/berx-web-screenshots.mjs` from the shipped
`app/index.html` and the shipped bundle built from
`client/scripts/app-shell.entry.ts`, signed in through the real form
against the same `/api/v1/*` server every gate uses.

Every state was reached by driving the product — `world.travelTo`,
`world.focus`, `world.scrubTime`, `world.enterRegion` — never by
building a scene for a picture.

**Hardware limitation, true of every image here:** this container has no GPU: every pixel was rasterised on the CPU by ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver), at roughly
one frame per second, and WebGPU cannot present to a canvas, so the
backend is WebGL2 in all of them. Nothing here is evidence about
performance. The headless GPU gates run under a different software
rasteriser (mesa llvmpipe/lavapipe); neither is hardware, and this file
reports the one that drew these pixels.

| # | Status | State | Viewport | World mode | Renderer | In frame |
|---|---|---|---|---|---|---|
| 01-boot-entry | CAPTURED | BERX boot / entry | 1600x1000 @2 | not signed in (entry form) | none yet | — of — |
| 02-entry-locale-rtl | CAPTURED | Locale resolution and RTL, on the real entry | 1600x1000 @2 | not signed in (entry form) | none yet | — of — |
| 03-living-world | CAPTURED | The 5D living world | 1600x1000 @2 | region "world" | webgl2 | 15 of 15 |
| 04-now | CAPTURED | BERX NOW | 1600x1000 @2 | region "now" | webgl2 | 7 of 15 |
| 05-people-gravity | CAPTURED | People, and social gravity | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 16 of 19 |
| 06-dating-world | CAPTURED | The dating world, and only your own | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 17 of 21 |
| 07-place-business | CAPTURED | A place the server calls a business | 1600x1000 @2 | region "place", focused place:4212 | webgl2 | 22 of 22 |
| 12-offer-at-a-place | CAPTURED | An offer, attached to a real place | 1600x1000 @2 | region "place", focused experience:offer-501 | webgl2 | 13 of 22 |
| 08-events | CAPTURED | The events world | 1600x1000 @2 | region "event", focused event:908 | webgl2 | 22 of 22 |
| 09-conversation | CAPTURED | Messages, as a region you stand in | 1600x1000 @2 | region "conversation", focused message:78 | webgl2 | 24 of 25 |
| 10-stories | CAPTURED | Stories, which leave when the server says they do | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 25 of 25 |
| 11-memories-temporal | CAPTURED | T, scrubbed three years back | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 13 of 25 |
| 13-creator-world | CAPTURED | A creator, with their work standing around them | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 21 of 25 |
| 14-profile-in-world | CAPTURED | A profile, inside the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 of 25 |
| 15-spoken-search | CAPTURED | A spoken question, answered in the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 of 25 |
| 17-desktop-wide | CAPTURED | Wide desktop | 2560x1080 @2 | region "person", focused person:77 | webgl2 | 25 of 25 |
| 16-mobile-iphone | CAPTURED | Mobile web, at an iPhone's viewport and density | 390x844 @3 | region "world" | webgl2 | 9 of 15 |

Page errors during the whole capture: **0**
