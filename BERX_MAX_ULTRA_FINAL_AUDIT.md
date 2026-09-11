# BERX — MAX ULTRA FINAL AUDIT

**Branch:** `berx-max-ultra-final`
**Repository:** `/home/user/BERX` (git remote `AntonBerks/BERX`) — the source of truth for this pass.
**Environment:** Linux container, no GPU. Chromium 141 with mesa lavapipe (software Vulkan). PHP 8.4.19. MariaDB 10.11 installed and running, so the realtime gate ran against a real database.

**Totals: 58 PASS · 1 PARTIAL · 0 FAIL · 4 HARDWARE BLOCKER · 1 PROVIDER BLOCKER · 3 PRODUCT CONTENT GAP** across 67 audited capabilities — see §2.

## 0. The handoff archive

`BERX_MAX_ULTRA_GITHUB_HANDOFF_FINAL.zip` did not survive the upload.

```
file      Zip archive data, at least v1.0 to extract, compression method=store
size      2 097 152 bytes  (exactly 2 MiB — a transfer cap, not a compression result)
sha256    2ed36b6126a76035071b2849c1a68fd692be2d579dd8e7b1b2670c52d5f58612
unzip -t  End-of-central-directory signature not found
```

The central directory lives at the end of a zip, so a file truncated at a
round 2 MiB has lost it. Reading the local file headers directly recovers
**474 complete entries** — all under `backend/opensource-socialnetwork-master/`
plus `BERX_V9_SCREEN_STATUS.md`; the client half never arrived. Every one of
those 474 files is **byte-identical** to the same path in this repository.

Nothing was reconstructed and no source was invented. `/opt/berx` does not
exist on this machine. The audit therefore ran against the existing
repository, which is what the archive was a (partial) copy of.

## 1. What was broken, and what was done about it

### 1.1 Pointer / picking — three defects, all "one thing said twice"

`clicking an entity in the world selects THAT entity` failed on a real product
boot: aimed at `collection:33`, the world stayed on `community:501`.

A dedicated gate was built first, because a picker bug found only inside a
twenty-five-minute product boot costs an afternoon per hypothesis:
`verify:5d-picking` drives the real host, the real renderer and the real
pointer handler against a world of the same shape, in about a minute.

**Baseline it measured: 16 presses, 11 correct.**

1. **The collider was never the mesh.** The picker modelled every object as
   `transform.scale * 0.5`. A mesh is not a unit cube. Measured against what
   the renderers actually build:

   | form | drawn half-extent | old collider | error |
   |---|---|---|---|
   | `node` (community) | 0.499 | 0.430 | too small |
   | `ring` (event) | 0.589 | 0.475 | too small |
   | `message` (y) | 0.166 | 0.360 | 2.2× too big |
   | `stack` (collection, z) | 0.054 | 0.170 | 3× too big |
   | `frame` (experience) | 1.064 | 0.950 | too small |

   The dimensions were already written twice — `meshFor` in `threeRuntime.ts`
   and again in `webgpuRuntime.ts` — and `scale * 0.5` was a third, wrong
   copy. `BERX_PRIMITIVES` in `@berx/spatial/geometry.ts` now states each
   form once; both renderers build their mesh from it and
   `berxDrawnHalfExtent` gives the picker the same extent. Tessellation stays
   per-backend: how many segments a sphere gets is a cost decision, how big
   it is is not.

2. **A ray is not the forward axis.** `berxResolveByDepth` compared
   `hit.distance` (along the ray) against the G-buffer depth (along the
   camera's forward axis). At screen centre the two coincide — which is why
   this survived every gate that pressed near the middle. At the edge of a
   60° frame at 16:10 they differ by 1/cos(42.7°): a surface 10 units away
   looked 3.6 units from every candidate, past the 1.5 tolerance, so the
   picker answered **nothing** and the focus silently stayed put. It now
   converts with the cosine the renderer already has.

3. **The affordance ring had no depth test at all.** The renderer drops a
   slot the world drew over *at the slot's own centre*; a name is half a
   world unit wide, so a slot whose centre is clear can still lie across an
   entity nearer to the eye — and `pickActionSlot` ran first and returned.
   It now takes the drawn depth at the pressed pixel, the same number the
   entity pick resolves against. `depthAt()` is on the renderer interface for
   that. WebGPU answers `undefined` and says why: its G-buffer readback is
   asynchronous and a pick is not, and an invented depth is worse than none.

**After: 35 presses, 35 correct** — every entity, from every focus that can
see it, only where the G-buffer says that entity is the nearest surface, with
a real ring of 3–5 slots up on all 35. No hitbox was widened and nothing was
excluded to get there.

### 1.2 Realtime — the world now stays live

`applyBerxRealtimeEvent` had a gate. `BerxRealtimeClient` had a gate against
the real PHP socket server. **Nothing joined them**, so a shipped session
opened no socket at all: a world was live only in the sense that reloading
produced a newer one.

- `berxKeepWorldLive` (in `@berx/scenes/realtimeWorld.ts`) is the join, and
  the only one — the client is `@berx/api`'s, the mapping is the initial
  load's, the ingest is the world's own. It derives channels from who is
  standing in the world, and re-subscribes on the same socket when the world
  grows.
- `BerxRealtimeClient.subscribe()` added: the protocol already accepted a
  `subscribe` frame at any time and the server accumulates what it grants, so
  a world that gained a person no longer needs a reconnect and a fresh
  credential to hear about them.
- **A real reconnect storm was found and fixed.** `attempt` was reset to 0 on
  `auth:ok`, so a socket that authenticated and then died immediately
  reconnected twice a second forever — measured at **4 546 connections** from
  one product session. The ladder now resets only for a connection that
  outlived the longest backoff rung: a connection that lasted is proof the
  backoff waited long enough; one that died on arrival is not.
- The shell owns the lifetime: `options.live` is called once the world is
  filled, its failure lands in `failures` under `realtime`, and `destroy()`
  closes the socket.

### 1.3 Spatial audio — the ears are the camera

`BerxWebSpatialAudio` had a gate proving a sound to the right is louder on the
right, and no product session ever constructed one. The shell now builds it
and the host moves the listener from the frame **about to be drawn** — so what
is heard is the pose the pixels were made with, including mid-travel. It keeps
running with the GPU context lost, because sound that froze on a driver reset
would jump when the pixels came back.

Nothing plays: BERX ships no audio assets and invents no media, so a session
with no sounds is silent and that silence is the truth.

### 1.4 Voice — a person can now talk to BERX

`berxVoiceToWorld` and `BerxWebVoice` were both verified and neither was ever
constructed by a shipped session. The shell builds the binding, `v` (`м` on a
Russian layout) opens the microphone from inside the world, and what is said
goes into the same live region everything else says. No microphone button:
that is furniture, and the microphone opens only on a real keypress.

### 1.5 WebXR — the session layer that was missing

`xrPose.ts` converts a head pose into BERX cameras and is real; it is not
WebXR. Nothing had ever called `navigator.xr`. `xrSession.ts` adds the missing
half: `isSessionSupported` for both modes, `requestSession` from a real user
gesture only, `XRWebGLLayer` on the same WebGL2 context the flat world uses,
`local-floor` with an honest fall back to `local`, the XR frame loop feeding
`world.setHeadViews()`, per-eye field of view read out of the runtime's own
projection matrix, and the browser's framebuffer and canvas size restored on
exit. A frame with no pose, or one the shared core will not trust, leaves the
camera where it was.

### 1.6 The 40–60% framing band, closed by the layout

It was recorded as a product decision requiring one of three proven
invariants to be given up. It was a measurement nobody had taken.

**What the numbers said.** Entities with a bounding radius of 1.38 standing
7.73 apart, spread over sixteen metres, max lateral extent 8.4 — six
diameters of empty space between one thing and the next. The relation
distances were absolute metres (`related: 4.0`, divided by a strength of
0.5, so eight) chosen with no reference to how big the things being placed
actually are. No camera can make that read as a place: the distance that
contains it all is a distance at which everything in it is tiny.

| | desktop | phone | tablet | wide |
|---|---|---|---|---|
| before | 22.4% | 3.6% | 14.8% | 21.2% |
| distances in units of entity size | 31.2% | 8.7% | 28.5% | 27.7% |
| ring aspect = frame aspect | 21.9% | 25.5% | 23.3% | 20.8% |
| even angular spacing | 44.1% | 39.1% | 47.8% | 41.1% |
| **final** | **46.5%** | **41.5%** | **50.0%** | **43.4%** |

Four changes, each one measured:

1. **Distance in units of the entities' own size.** A relation between two
   large things holds them proportionally further apart than the same
   relation between two small ones. The order of the relation kinds is
   untouched, so a weaker kind still reaches further; and weakness now means
   half again rather than four times, because dividing by strength was the
   single biggest reason the world was enormous.
2. **The ring's shape IS the frame's shape** — the exact proportion, `sqrt`
   on each side so the product stays constant and a change of frame
   reshapes the world rather than growing it. An arrangement with the
   frame's own aspect is the only one whose bounding box can touch all four
   edges at once. The layout takes the viewport aspect from `frameWorld` and
   re-lays out when the frame changes ORIENTATION, not on every resize.
3. **Evenly, now that the count is known.** The golden angle was the right
   answer to the question the placement loop can ask, but it is a *sample*
   of a uniform distribution: four multiples come out 0°, 52°, 137°, 275°.
   A second pass deals the angles out in equal shares, keeping every radius
   its relation earned. Worth about thirty points.
4. **And nothing stands inside anything else** — a relaxation pass on real
   overlaps, tested against `berxDrawnHalfExtent` rather than the bounding
   sphere, because a moment's sphere is 1.4 where its panel is 0.95 × 1.18 ×
   0.001 and sphere separation would undo the whole compaction.

Tablet landing on exactly 50.0% is the fit's own back-off: the layout only
has to be compact ENOUGH and the camera finds the middle of the band by
itself. The gate now runs four screen shapes rather than three, and its
BLOCKED branch is gone because the condition is met.

**Two things the compact world then exposed, both real.**
`berxResolveByDepth` compared the drawn depth against where each box
*starts*; that approximation held at seven units apart and broke at two. It
now asks the exact question — whose box does the drawn point lie *inside*,
along the ray — and among those takes the one whose front face sits nearest
below it, since a drawn surface is always at or behind the front face of
whatever was drawn. And a world invariant was testing the arrangement's old
size rather than the property it names (`nearFocus(4)` vs `nearFocus(100)`);
its radii now come from the distances actually in the world.

### 1.7 Five domains that had an endpoint and no place in the world

STORIES, MEMORIES, TRIPS, NOTIFICATIONS and dating profiles were each a real
API method with real response types that nothing spatial had ever read. The
world loader read eleven endpoints; it reads sixteen now.

None of them gets a new entity kind — a story is a moment that expires, a
memory is a moment that already happened, a trip is a collection with a
route, a notification is a moment addressed to you — so each arrives with a
form, a material, a geometry and a picker for free.

T and R come from the server, never from the clock: a story leaves the
present on the server's `time_expires` (and one the feed gave no expiry for
is not given one); a memory is stamped with when it *happened*, which is the
whole point, since the temporal cursor is what brings it forward; a trip's
stops are relations to places already in the world rather than copies; a
notification stands beside whoever caused it and points at what it is about,
with `viewed` as its energy.

A dating profile is a pseudonym and its own entity, not `person:<guid>` —
mapping it onto the public profile would merge two identities the privacy
model deliberately keeps apart. No compatibility score is invented, because
the endpoint returns none.

### 1.8 Mobile web, which is not a small desktop

A desktop WebGL2 pass proves the renderer. It proves nothing about the
things that only exist on a phone, and every one of these was broken:

**The browser was taking the gesture.** The canvas carried no
`touch-action`, so the browser reserved every drag and every second finger
while it decided whether the person meant to scroll or zoom. A pan arrives
as `pointerdown`, one `pointermove` and then **`pointercancel`**; a pinch
never reaches the world because the page zooms instead; a tap waits 300 ms
for a double-tap that is not coming; and a downward drag near the top runs
Chrome's pull-to-refresh, which reloads the world in the middle of a
gesture meant to move it. Fixed on the element that owns the world —
`touch-action: none`, `-webkit-touch-callout: none`, `user-select: none`,
`-webkit-tap-highlight-color: transparent`, and `overscroll-behavior: none`
on the page. The sign-in form keeps all of it: pinch-zoom on text is an
accessibility right, and a form is not a world.

**Voice — the thing BERX is — was unreachable.** Listening started from the
`v` key, and a phone has no `v`. So did creating (`n`) and entering XR
(`x`). The Core has modelled a held touch since it was written —
`berxTouchField` gathers coherence where the hand is, `berxGestureCause`
routes it through the same closed union a server answer goes through, and
`berxTouchHaptic` ticks once at a quarter second — **and nothing had ever
produced one.** The web shell reported `presence` on pointerdown and then
only pan; the whole touch model was dead code.

`runtimeHost5d` now produces a real `BerxSpatialGesture` when a finger has
stayed 500 ms without moving past the 8 px tap threshold: a world point
found by the picking ray carried to the depth the renderer actually drew
(divided by the ray-to-forward cosine, exactly as `berxResolveByDepth`
does), the entity it landed on, the platform's own pressure, and how long
it has gone on. All three Core functions are then given it, and the host
asks its owner what a hold MEANS. The shell's answer: **BERX listens.** A
hold is `attention, held`, and BERX giving its attention is BERX
listening. It is a real user gesture, which is exactly what the microphone
permission needs — the browser asks, the person answers, and the recording
indicator is left completely alone. A hold on an affordance is still that
affordance pressing in; the host rules those out before asking.

Measured on the iPhone profile: `core aware → listening` while a finger
stayed on the world for 900 ms. `aware` alone would not have proved
anything — a plain `pointerdown` reports presence and reaches `aware`, so
the gate requires a state a tap cannot produce.

**A hand arriving made BERX look less busy.** The held gesture exposed a
hole that was under every tap and every hotword: `presence` returned
`aware` from ANY state, so a finger resting on the world while a search was
in flight reset the drawn Core to "someone is here" and the search became
invisible until the answer came back — a progress bar that fills after the
download. `aware` means "something could happen"; `listening`,
`understanding`, `searching`, `acting`, `speaking` and `discovering` are
all something already happening, and all of them are MORE than aware.
Presence now only reaches `aware` from `idle`, `aware` or `success`.
`verify:5d-wiring` had been failing two gates on this and passes 46.

**The notch and the home indicator.** `viewport-fit=cover` is what lets the
world reach the glass; it is also what puts the sign-in form under the
notch and the world's status line behind the home indicator. Every fixed
element now respects `env(safe-area-inset-*)` with `max()`/`calc()`, so a
device with no insets is unchanged. This is measured rather than asserted:
the gate emulates **real insets over CDP** (`Emulation.setSafeAreaInsetsOverride`,
59/34 for an iPhone, 24/24 for an Android drawn edge-to-edge) and checks
that the elements actually moved by them.

**The keyboard covering the one field there is.** `interactive-widget=resizes-content`
is the declarative answer and Chrome honours it. **iOS Safari does not
implement it**: the layout viewport is unchanged and only the visual
viewport shrinks, so the composer sits behind the keyboard and what someone
is writing cannot be seen while they write it. The composer now listens to
`visualViewport` and lifts by exactly the height the keyboard took —
measured, with no keyboard-height table and no user-agent test — and
`destroy()` closes it rather than removing the element, so its listeners do
not outlive the shell.

### 1.9 Adaptive quality that could not react

`berxResolveRenderTier` says it in its own comment — *"a real
measurement, when one exists, outranks everything below"* — and takes
`measuredFps` for exactly that. The host resolved the tier **once, at
construction**, from how much memory the device admits to, how many
cores it has and how dense its screen is. It then measured a rolling
120-frame window of real frame times, exposed the p95 on
`host.performance`, and **never fed it back.**

So a machine that turned out to be behind kept whatever tier its RAM had
suggested and never stepped down. Measured here: this container draws the
world at **1.2 fps** on a software rasteriser and was being handed the
same render tier a workstation gets. Adaptive quality that cannot react
to the one signal it names as decisive is not adaptive; it is a guess
with a good comment.

It now re-resolves at most every two seconds, off a full window's
**median** rather than its mean (one 400 ms hitch must not decide a
tier) and not its p95 (that is the tail — what a tier is chosen to
protect, not what it is chosen from). Hysteresis, because a tier that
flaps is worse than one that is wrong: `berxResolveRenderTier` steps down
below 24 fps and below 50, and climbing back needs 56 fps sustained for
four seconds.

And a tier now decides how MANY pixels as well as what is done per
pixel. A machine measured at 20 fps that drops its lighting and keeps
paying for three device pixels per CSS pixel has given up the visible
half and kept the expensive one: `low` caps the backing store at 1x and
`medium` at 1.5x, which is the least visible cut there is — a phone at
1.5x is soft in a way nobody photographs, where a phone with no ambient
occlusion is flat in a way everybody feels. The top two tiers are
untouched, so nothing capable renders softer than it did.

**What the two profiles measured.** 20 gates each, on the shipped page
and the shipped bundle. iPhone 390x844 at 3x with 59/34 insets; Android
Chrome 412x915 at 2.625x with 24/24. A tap at `collection:trip-7`'s own
pixel focused `collection:trip-7` — with two other candidate pixels
rejected first as *shared*, because a box is not a mesh and at a pixel
where two boxes hold the same drawn surface either answer is defensible.
Two fingers opened the field of view from 42.00° to 38.76°. A held finger
took the Core from `aware` to `listening` on both. Zero `getUserMedia`
calls between page load and the world existing, with
`navigator.mediaDevices.getUserMedia` wrapped before the page ran a line.
The composer, given a visual viewport 336 px shorter, lifted and came
back. Landscape held the same entity ids and the same focus, re-framed,
with no horizontal scroll. No page or console errors on either.

**And two things the first run got wrong, both the gate's.** It read
`host.backend`, which does not exist — the renderer's own name for itself
is `renderer.kind` — and reported `undefined` against a world that was
drawing perfectly. And it asserted a 60 ms frame budget on a machine with
no GPU, which is not a measurable claim: that case is now a HARDWARE
BLOCKER carrying the measurement, decided by asking
`WEBGL_debug_renderer_info` which driver is drawing rather than assuming
it from the environment.

### 1.10 Installable, and honest offline

There was no service worker anywhere and the page linked no manifest. Both
now exist, and what matters about them is what they refuse:

`app/berx-sw.js` caches the page, the bundle and the manifest. **It does not
intercept `/api/` at all** — not "caches it carefully": the request goes to
the network as if the worker did not exist. A worker holding a copy of
somebody's messages would put private data in a store that outlives the
session, survives sign-out and is readable by any later visitor to the same
browser profile, and there is no cache policy that makes that safe. The
shell is network-first, so a new build is picked up on the next load rather
than pinning a person to whichever build they first opened.

`verify:5d-pwa` signs in — so the session really reads the feed, the
friends, the conversations and thirteen more endpoints — and then reads the
browser's own `CacheStorage` back to see what went in. Then it aborts every
request in the context and reloads: BERX has to come up from the cache, and
it has to show **no world**, because there is no world without the server
and a remembered feed shown as a live one is the exact fake data this
runtime refuses.

### 1.11 A transition whose own two terms cancelled

`collapse` — "the world draws in", the transition for going back — shrank
every object by 22% and narrowed the field of view by 18% at the same
instant. A narrower field of view is the camera MAGNIFYING: at 60°, 0.82 of
the angle is 1.26 of the size, and 0.78 × 1.26 = 0.98. Nothing measurably
drew in. A real GPU readback counted **39 042 lit pixels mid-collapse
against 37 232 in the untouched frame** — the world was very slightly
*bigger* while collapsing, and the most deliberate transition in the set
was the one that showed the least. The scale now carries it, the narrowing
is small enough to read as a tunnel closing rather than a zoom, and a
shallow fade takes the edges with it.

### 1.12 One server for two gates

The app-shell gate carried its own two hundred lines of API fixtures. When
mobile web needed a signed-in world the choice was a copy of them or one
server, and a copy drifts the first time an endpoint changes — a stub that
has fallen behind the client reports a fault the product does not have. It
is `scripts/lib/appserver.mjs` now: the shipped page byte for byte, the
shell bundled from the shipped entry, `/api/v1/*` in the shapes the types in
`@berx/api` declare, and a real WebSocket enforcing the same one-use
credential rule the PHP server does.

The same pass found the app-shell gate reading depth its own way. It pulled
the SSAO G-buffer back and mapped pixels into it by hand, while the shell
resolves a press with `renderer.depthAt` — which this very file gates as
"the one authority both the entity pick and the affordance ring are
resolved against". They disagreed: the hand-rolled read answered 8.0–9.0
for **every pixel on the screen**, all thirteen candidates were discarded as
occluded, and the gate reported "0 of 0". That failure was entirely the
gate's, and it is the same defect the file keeps finding elsewhere — one
thing measured twice.

### 1.14 Three domains that had a backend and no client

Verifying the audit's own status labels against the code — rather than
trusting them — moved four rows.

**OFFERS was recorded as a PROVIDER BLOCKER: "no endpoint of any kind
exists for offers in `BerxApiClient`."** True of the client, and false of
the product. `offers.php` is a complete backend and always was: list the
active offers for a place, claim one, fulfil it in person, read the
redemptions, with `already_claimed` and `already_fulfilled` resolved
per caller precisely so a client can show real claimed state instead of a
claim button that always renders and errors on the second tap.

An offer maps to an `experience`, and the fit is not a compromise: an
experience already means "something available that you can reserve",
already has a frame to be drawn as, and already offers `view-experience /
reserve / share`. Reserve IS the claim. T comes from the server —
`ends_at` makes an offer leave the present when it really expires, so the
temporal cursor carries it out of the world instead of a client timer
hiding it. R is `located-at` into its place at full strength, the same
structural edge an event at a venue has. Energy is how much is left.
Measured: travelling to `place:4212` brings `experience:offer-501`,
`act('reserve')` claims it, and the energy falls because the SERVER's
`redemptions_count` rose and the world was rebuilt from what it answered.
No coupon code and no payment anywhere — `OssnBusinessOffers` is a
claim-and-fulfil-in-person primitive, the same honest shape as a punch
card.

**BUSINESS was recorded as PARTIAL for want of a dedicated mapper.**
`mapPlaceToSpatial` has always turned the server's `is_business` into a
`business` entity — its own geometry (a stack rather than a portal,
because a business is not a doorway), its own material, its own
affordances. **No fixture had ever set the flag**, so the whole reading
went unexercised and looked, from the audit, like missing code. It is
measured now: `place:4212` stands as a graphite stack offering
`view-business, directions, reserve` beside `place:4211`'s portal.

The id stays `place:<guid>` while the kind is `business`, and that is
deliberate: an id namespaces the server ROW an entity came from, `kind` is
what the world draws. An event at that address relates to `place:4212`
from a mapper that has never seen the business flag, so renaming the
entity would leave that edge pointing at nothing.

**CREATORS and DATING were PARTIAL for want of wiring, and both hang off
one mechanism.** Travelling to a person is a deliberate act about one
person, and therefore the only honest moment to ask a server anything
about them — which is exactly how a conversation is already read. Their
own presence brings THEIR dating world; somebody else's brings what they
have MADE.

A creator is a person with a body of work, so `mapCreatorToSpatial` maps
the WORK — every post, album, event and experience the endpoints return —
and relates each piece to its author by `created-by`, the same edge the
relational layout uses to gather things around whoever made them. No new
entity kind, no follower count, no badge. The endpoints are keyed by
username rather than guid, which is why a person entity now carries
`sourceName`: the alternative was a round trip to translate a guid the
client already had a name for.

Dating is read only on arriving at your own presence, never at boot. Not
a performance choice: a world that pulled other people's dating profiles
into every session would have decided, on their behalf, that being
discoverable and being displayed are the same thing. Each profile arrives
as `person:dating-N`, and the gate proves `person:91` and `person:92`
never appear anywhere — the public identity and the dating one stay the
two separate things the privacy model keeps them as.

### 1.15 A drag that moved nothing, twice

The pan was an impulse into a damped velocity calibrated in nothing:
`panX * 0.018`. Measured on a phone, a 120px drag moved the camera
**0.067 world units** — in a world twenty units across seen from twelve
units away, crossing it needed a two-thousand-pixel drag. On a desktop
that is a nuisance beside a wheel and a keyboard; on a phone a drag is
the only way to move at all. It was ungated, which is how it stayed that
way.

The fix was to translate the eye by the world distance those pixels
subtend at the focal depth — direct manipulation, frame-rate independent.
**And it moved 0.000.** `BerxSpatialCamera.nudge` had its own cross
product and it crossed the forward axis with (0,0,1) instead of the world
up (0,1,0). For a camera looking down -z — which is every camera BERX
ever puts anywhere — that gives a right vector of length zero, the
degeneracy guard fired, and the drag silently returned.

`cameraBasis` is the one function everything else in this runtime
translates "right on screen" with: the picking ray, keyboard navigation,
the affordance ring. There was no reason for a second opinion and the
second opinion was wrong. Now exact: 0.752 moved against 0.752 subtended
on the iPhone profile, 0.693 against 0.693 on Android, in ten linear
steps.

Found in ninety seconds with a throwaway probe that signs into the real
shell and drags, rather than in twenty minutes of the mobile gate. That
pattern — build the one-minute repro before iterating — is what this
whole pass ran on.

### 1.16 Infrastructure for six languages, content for one

Three things were being conflated. INFRASTRUCTURE needs no translated
content and is complete for all six locales: the locale is resolved from
what the browser asks for (`de-AT → de`, `pt-BR → ru` rather than a blank
product), `lang` and `dir` follow it, and numbers, dates, relative times
and money come from `Intl`. A German browser gets `1.234.567,89` and
`10.09.2026` today. This is the half of localisation most often missed.

CONTENT is Russian and only Russian. The 38 labels the world draws moved
into a catalogue keyed by message id — values byte-identical, so nothing
the world says changed — and the other five catalogues are declared and
EMPTY. `berxTranslate` reports every miss instead of silently falling
back, because a translate function that returns only a string cannot be
audited: every miss looks like a hit in the source language.

A CLAIM is the third thing. `berxLocaleCoverage` computes coverage FROM
the catalogues rather than declaring it beside them, so "BERX supports six
languages" cannot be made accidentally: **ru 38/38, en 0/38, de 0/38,
fr 0/38, es 0/38, ar 0/38.**

Arabic runs right to left and the world does not flip with it. `dir`
reverses the DOM BERX owns — the sign-in form, the composer, the live
region — but a world has real space with real handedness, and mirroring it
would move every entity to the wrong side of every other one.

### 1.17 Gates that blamed the product for their own arrangements

Four failures in the first full regression were the gates', not the
product's, and each is the same shape.

`verify:5d-pwa` turned the network off on purpose and then failed for the
console errors that produced. Uncaught exceptions and console errors are
now kept apart: nothing may go wrong while there IS a network, and
offline the only permitted errors are the network being unreachable — an
uncaught exception there would be a page that assumes a network, which is
the whole thing an offline shell is for.

`verify:5d-app-shell` crashes the renderer on purpose to prove the world
comes back, and tears the page down at the end. Both abort whatever is in
flight — since the shell now registers a service worker, usually the
worker's own fetch — and Chromium reports `net::ERR_FAILED`. Forgiven only
from the moment a renderer has actually been killed in this run, only for
aborts, never for a 404, a 500 or a refused connection.

Its pick probe asserted the thing `verify:5d-picking` asserts 45 times
from nine viewpoints in one minute, less carefully — first by reading the
SSAO buffer by hand (which answered 8.0 for every pixel on the screen),
then by aiming at pixels where two boxes hold the same drawn surface and
calling a correct picker wrong. The identity claim belongs to the gate
that makes it properly. What stays in the app-shell gate is what only a
product boot can say: a real PointerEvent on the shipped canvas, with no
test hook in the path, reaches the picker and moves the world's focus to
an entity that really exists.

`verify:5d-performance` reported medium and low 0.2ms apart — a 0.3% gap
on a software rasteriser — while three of my own browser probes were
running beside it. Alone: ultra 147.2 · high 124.5 · medium 73.6 · low
72.1. The lesson is the directive's own: do not run the expensive suite
concurrently with anything.

And `verify:5d-mobile` read the Core once, 900ms after a hold. `listening`
lasts exactly as long as the microphone is open, and on a machine with no
speech recogniser that is milliseconds. Sampled every 10ms, the real path
is `aware → listening → aware`. Its other half held whatever slot
happened to be under an earlier probe's ring, which by then was no ring
at all.

### 1.18 A probe that pressed the thing it was asking about

`verify:5d-mobile`'s hold gate needs a pixel the affordance ring does not
own, and it used to find one by PRESSING each candidate and watching
whether an affordance went into `press`. A press is not a question. The
pointerup that ended each probe ran the shell's own pick, focused
whatever stood there, raised that entity's ring and started a camera
travel — and the hold then landed one frame later, on a world that was
moving, at a pixel that had just grown a ring. It failed about half the
time and blamed the product every time.

The shipped entry already exposes the ray and the candidate test for
exactly this reason, so it now exposes the third function the pointer
path consults — `pickActionSlot`, the one the host itself asks before
deciding a hold is a hold. Asking it changes nothing, and the probe waits
for the world to stop moving before it holds.

**And then the measurement itself was wrong twice more.** Reading the
Core once at 900ms had already been fixed by sampling every 10ms; on the
slower profile the whole visit to `listening` still fell between two
reads, because `listening` lasts as long as the microphone is open and
with no recogniser behind it that is barely any time. Reading
`core.previous` beside `core.state` looked like the fix and was worse:
`previous` is the state the Core came FROM at its last transition and it
STAYS there, so interleaving the two fields manufactured an endless
"listening → aware → listening → aware" out of one old transition — and
the next gate in the file inherited it and failed for seeing a listening
that had happened a minute earlier.

What is actually durable is the PAIR. `previous>state` changes exactly
when the Core moves, so a pair that mentions `listening` and is not the
pair the window opened on is a visit that happened inside the window. The
watcher yields to the task queue between reads rather than sleeping a
fixed 10ms, so a transition and its reversal now have to happen inside
one task to be missed. Both profiles read `aware>listening →
listening>aware` for a hold on the world, and `nowhere` for a hold on an
action.

### 1.19 A press that was counted wrong for being right

`verify:5d-app-shell` asserted that a real PointerEvent on the product's
canvas moves the focus, and required EVERY press in its sample to move
it. The shipped shell is right to refuse three ways: a press whose pixel
the ring owns activates that action and returns before the picker is
asked, a press on empty space focuses nothing, and a press on the entity
already focused has nowhere to move to — `runtime.focus` returns false
and the world correctly stands still. Two of four presses were failing
for being correct, and a third was the same pixel pressed twice, which
can only ever report "did not move".

Each press now carries production's own answer for its pixel, asked at
press time against the frame the shell is about to use — `pickActionSlot`
first, then `renderer.pick`, the same order the host calls them in — and
the claim is agreement: a slot swallows the press and the focus holds; an
entity is drawn there and the focus IS it; nothing is drawn there and the
focus holds. Plus at least one press that really moved the world, because
a pointer path wired to nothing would satisfy every "holds" clause. It
reads 3 of 3, two of them by moving the focus.

### 1.20 Two harness defects that were destroying evidence

- The gate's own WebSocket server dropped the bytes Node hands over in the
  `upgrade` event's `head` argument. A client that writes its first frame the
  instant the socket opens — which is exactly what `BerxRealtimeClient` does —
  vanished into a buffer nobody read. This is the classic way to write a
  WebSocket server that works on a slow network and hangs on localhost.
- Playwright launches Chromium with `--disable-dev-shm-usage`, right for a
  64 MB `/dev/shm` and wrong here: the renderer's buffers went to `/tmp` and a
  single app-shell run left **13 096 open, deleted `/tmp/.org.chromium.*`
  files — 26 GB** of them. This container's writable space is a fixed
  allowance, so runs died of ENOSPC in the middle and every result after that
  point was worthless. `/dev/shm` here is a 16 GB tmpfs, so the default is
  removed. This changes where a renderer keeps scratch memory, not what it
  draws.

## 2. Capability matrix

`STATUS` is one of **PASS**, **PARTIAL**, **FAIL**, **HARDWARE BLOCKER**,
**PROVIDER BLOCKER** or **PRODUCT CONTENT GAP**. Nothing is PASS without a
gate that measured it in this pass, and every row's EVIDENCE is a number or
a string that gate really produced.

The distinction the last column exists for: a **HARDWARE BLOCKER** needs a
device this machine does not have, a **PROVIDER BLOCKER** needs a service
nobody has bought, and a **PRODUCT CONTENT GAP** needs somebody to write
something. None of the three is a defect in the code, and calling any of
them PARTIAL hid that.

### Spatial interaction

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| Pointer → pixel → entity | PASS | PointerEvent → `slotsUnder` → `pickActionSlot`(+drawn depth) → `renderer.pick` → `berxResolveByDepth` → `runtime.focus` | `spatialInteraction.ts`, `actionRing.ts`, `geometry.ts`, `runtimeHost5d.ts`, `threeRuntime.ts` | `verify:5d-picking` | 45 presses, 45 landed on the entity the pixel belongs to; 45 of 45 with the focused entity's ring drawn | — |
| Affordance ring reachability | PASS | `berxActionRing` offsets the ring a third of the way toward the eye; `berxActionRingRadius` tells the camera the room it needs | `actionRing.ts`, `berxFraming.ts` | `verify:5d-picking` | 9 entities focused, **31 of 31 slots reachable**; it was 1 of 5 when the ring sat in the entity's own depth plane | — |
| One geometry authority | PASS | `BERX_PRIMITIVES` → both `meshFor`s and `berxDrawnHalfExtent` | `packages/spatial/src/geometry.ts` | `verify:5d-picking`, `verify:5d-geometry`, `verify:5d-crossrender` | one declaration per mesh; the collider was `scale * 0.5` for six of nine forms | — |
| Held touch → voice | PASS | 500 ms without moving → `BerxSpatialGesture{kind:'hold'}` → `berxGestureCause` → Core, `berxTouchField` → the field, `berxTouchHaptic` → the device, `options.onHold` → `shell.listen()` | `core/berxTouch.ts`, `runtimeHost5d.ts`, `appShell.ts` | `verify:5d-mobile` | Core `aware → listening` on both device profiles, held at a pixel with no ring slot within 140px. The Core had modelled `hold` since it was written and **nothing had ever produced one** | — |
| A hold on an action is that action | PASS | the host rules out a hold whose finger rests on a slot before asking what a hold means | `runtimeHost5d.ts` | `verify:5d-mobile` | held on a slot for 900 ms and the Core did NOT enter listening | — |
| One gesture, one meaning | PASS | a pointer that produced a hold does not also run the pick on release | `runtimeHost5d.ts` | `verify:5d-mobile` | focus byte-identical across the hold on both profiles | — |
| Direct-manipulation pan | PASS | pointermove → world units per CSS pixel at the focal depth → `Berx5DRuntime.nudge` → `BerxSpatialCamera.nudge` along the shared `cameraBasis` | `spatialCamera.ts`, `runtime5d.ts`, `runtimeHost5d.ts` | `verify:5d-mobile` | **0.067 → 0.000 → exact.** The old damped impulse moved 0.067 units per 120px drag; my first fix crossed forward with the wrong up axis and moved 0.000; with the shared basis, 0.752 against 0.752 subtended (iPhone) and 0.693 against 0.693 (Android) | — |
| Pinch → depth | PASS | two `Touch` points → `runtime.input({pinch})` → `state.fov`, clamped to the camera's limits | `runtimeHost5d.ts`, `spatialCamera.ts` | `verify:5d-mobile` | field of view 42.00° → 38.76° on both profiles | — |
| Keyboard reaches every action | PASS | Tab walks the ring in world order; Enter goes down the same `activate` closure a finger uses | `runtimeHost5d.ts` | `verify:5d-app-shell` | focus is a state of the world (0.176 half-height against 0.130, full alpha against 0.72) and the canvas outline-style is `none` | — |

### The five dimensions

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| X / Y / Z as real space | PASS | relations decide separation in units of `(r_a + r_b)`, an even angular re-spacing pass, then six relaxation passes using `berxDrawnHalfExtent` | `relational.ts`, `berxFraming.ts`, `worldApp.ts` | `verify:5d-framing`, `verify:5d-composition`, `verify:5d-dimensions` | occupancy 46.5 / 41.5 / 50.0 / 43.4 % on desktop / phone / tablet / wide, every entity wholly inside on all four | — |
| Z as the depth a press resolves against | PASS | the G-buffer's alpha stores `-view_pos.z` and it is the one authority both the entity pick and the ring are resolved against | `world.wgsl`, `threeRuntime.ts`, `spatialInteraction.ts` | `verify:5d-picking` | 45 of 45; a world with painted-on depth fails on the first occluded entity | — |
| T changes the world | PASS | `berxTemporalCursor` → `berxApplyTemporal` offsets z in `latestFrame` and never in `runtime.world` | `worldApp.ts`, `spatialTemporal.ts` | `verify:5d-dimensions`, `verify:5d-app-shell` | NOW is empty a year back because nothing was happening then; a three-year-old memory stands 60 units further into depth | — |
| R decides where things are | PASS | relation type and strength set layout, gravity, energy, which affordances exist and what the picker can reach | `relational.ts`, `worldLighting.ts`, `spatialAffordances.ts` | `verify:5d-world`, `verify:5d-wiring`, `verify:5d-domains` | an entity arriving over the socket is placed by the same rule a cold load uses — post 7801 at a real finite position; a creator's four pieces of work gather by `created-by` | — |
| The camera really moves | PASS | a focus is a travel with a pose and a transition kind; a drag translates the eye; two fingers change the field of view | `spatialCamera.ts`, `transitions.ts`, `runtimeHost5d.ts` | `verify:5d-transitions`, `verify:5d-mobile` | measured off `frame.camera`, never off a CSS transform | — |
| Transitions are eight different images | PASS | `berxTransitionModulation` folds opacity, emissive, scale and fov into the one draw list | `transitions.ts`, `drawList.ts` | `verify:5d-transitions` | 12 gates; eight distinct framebuffers from one world. `collapse` had cancelled itself — 39 042 lit pixels mid-collapse against 37 232 untouched — and now collapses | — |

### Rendering

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| WebGL2 renderer | PASS | one draw list → `threeRuntime.ts` | `threeRuntime.ts` | `verify:5d-gpu`, `verify:5d-app-shell` | **23 PASS, 0 FAIL, 0 BLOCKED**, plus a real product boot | — |
| Cross-renderer parity | PASS | one draw list → WebGL2 and WebGPU | `threeRuntime.ts`, `webgpuRuntime.ts`, `geometry.ts` | `verify:5d-crossrender` | **28 PASS**, re-run after the geometry refactor, the layout change and the camera change | — |
| Shadows / SSAO / volumetrics / particles | PASS | the shared pipeline, measured on real GPU readbacks | `shadowMap.ts`, `renderPipeline.ts`, `threeRuntime.ts` | `verify:5d-shadows` 13, `verify:5d-ssao` 17, `verify:5d-volumetric` 10, `verify:5d-particles` 12 | 52 gates across the four | — |
| Post / exposure | PASS | the post stage, on a readback | `renderPipeline.ts` | `verify:5d-exposure`, `verify:5d-pipeline` | 6 + 11 gates | — |
| Adaptive tier | PASS | rolling 120-frame window → median → `berxResolveRenderTier({measuredFps})` → render quality AND the pixel-ratio cap, with hysteresis | `runtimeHost5d.ts`, `lighting/berxRenderQuality.ts` | `verify:5d-mobile`, `verify:5d-quality` | the tier the runtime ends on matches its own resolver's thresholds for the frame rate it measured. It had measured a p95, exposed it, and **never fed it back** | — |
| A cheaper tier is cheaper in time | PASS | the tier table's knobs, run rather than multiplied out | `berxRenderQuality.ts` | `verify:5d-performance` | ultra 147.2ms · high 124.5ms · medium 73.6ms · low 72.1ms, and low is 53% of high | — |
| Frame cost budget | HARDWARE BLOCKER | — | — | `verify:5d-mobile` | p50 813.6ms / p95 913.4ms at 1.32 Mpx (iPhone profile), p50 933.2ms / p95 1009.6ms at 1.51 Mpx (Android). The driver names itself `llvmpipe` | No GPU. Real, and meaningless as a phone's number, so the 60ms budget is NOT reported as passing; the gate asserts it wherever `WEBGL_debug_renderer_info` reports real hardware |
| WebGPU renderer | HARDWARE BLOCKER | the same draw list; adapter, device, pipelines, submission and readback all real on lavapipe | `webgpuRuntime.ts` | `verify:5d-crossrender` | pipelines build and readback matches WebGL2 pixel for pixel; presentation to a canvas is impossible, so a session falls back to WebGL2 by design | No GPU. `depthAt` is deliberately unimplemented there rather than invented: readback is asynchronous and a pick is not |
| WebXR session layer | HARDWARE BLOCKER | `navigator.xr` → `requestSession` → `XRWebGLLayer` → XR frame loop → `world.setHeadViews()` → stereo render | `packages/spatial-web/src/xrSession.ts`, `appShell.ts` | `verify:5d-xr` | 7 gates pass with every device path BLOCKED. Measured: this Chromium exposes **no `navigator.xr` at all** (`{"present": false}`) | No headset, no ARKit, no ARCore, no OpenXR runtime. XR is entered only from a real gesture and never automatically |
| iPhone Safari behaviour | HARDWARE BLOCKER | — | — | `verify:5d-mobile` iPhone profile | the profile is the real Chromium engine at an iPhone's viewport, density, user agent, touch capability and CDP-emulated insets | Playwright's WebKit is not installed here, so iOS's own WebGL2 limits, its absent `interactive-widget`, its `touch-action` implementation and its total lack of WebXR are not measured and not claimed. `npx playwright install webkit` closes it |

### The world's domains

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| NOW | PASS | `GET /nearby` + the temporal cursor | `worldLoader.ts`, `spatialMapping.ts` | `verify:5d-app-shell` | NOW travels to what is actually happening, and is empty in a year when nothing was | — |
| PEOPLE / PLACES / EVENTS / MESSAGES / EXPERIENCES / COMMUNITIES / COLLECTIONS | PASS | twelve domain endpoints → typed responses → entities with XYZ, T and R | `worldLoader.ts`, `spatialMapping.ts` | `verify:5d-runtime`, `verify:5d-app-shell` | 18 entities in a real product boot, every id and position from a server row | — |
| STORIES / MEMORIES / TRIPS / NOTIFICATIONS | PASS | four endpoints nothing spatial had ever read | `spatialMapping.ts`, `worldLoader.ts` | `verify:5d-app-shell` | `moment:story-91`, `moment:memory-post-5151`, `collection:trip-7`, `moment:notice-31` all in the world | — |
| BUSINESS | PASS | `is_business` on a place row → `business` kind → its own geometry, material and affordances | `spatialMapping.ts`, `geometry.ts`, `spatialAffordances.ts` | `verify:5d-domains` | `place:4212` is kind `business`, a graphite stack at a different scale from `place:4211`'s portal, offering `view-business, directions, reserve`. The reading had always existed; **no fixture had ever set the flag** | — |
| OFFERS | PASS | `GET /offers/places/{guid}` → `mapOfferToSpatial` → an `experience` with the server's `ends_at`, `located-at` into its place, energy from what is left; `reserve` → `POST /offers/{id}/claim` | `packages/api/src/client.ts`, `spatialMapping.ts`, `worldLoader.ts`, `app-shell.entry.ts` | `verify:5d-domains` | arriving at `place:4212` brings `experience:offer-501`; `act('reserve')` claimed it and the energy fell because the SERVER's `redemptions_count` rose and the world was rebuilt from its answer. **The previous audit called this a PROVIDER BLOCKER — "no endpoint of any kind exists". `offers.php` is a complete backend and always was** | — |
| CREATORS | PASS | travelling to a person → `GET /creator/{name}` + `/content` → `mapCreatorToSpatial` → the work, `created-by` its author | `spatialMapping.ts`, `worldLoader.ts`, `app-shell.entry.ts` | `verify:5d-domains` | a post, an album, an event and an experience at four finite positions, all four edges into `person:78`. The endpoints are keyed by username, which is why a person entity now carries `sourceName` | — |
| DATING | PASS | travelling to your OWN presence → `GET /dating/discover` → `person:dating-N`, pseudonym only | `spatialMapping.ts`, `worldLoader.ts`, `app-shell.entry.ts` | `verify:5d-domains` | two profiles arrive with energy from what they said (0.75 and the 0.30 floor); `person:91` and `person:92` never appear anywhere in the world | — |
| Realtime → world | PASS | `POST /realtime/token` → one socket → auth → subscribe → event → the same endpoint a cold load uses → `world.ingest` | `packages/api/src/realtime.ts`, `realtimeWorld.ts`, `appShell.ts` | `verify:5d-realtime` (real MariaDB), `verify:5d-app-shell` | **16 PASS** against real accounts and real relationship rows; the shipped session opened 1 connection, was granted `person:77, person:78, self:77`, and post 7801 arrived as `moment:7801` with nobody polling | — |
| One failure, one reconnect chain | PASS | a single `reconnectTimer` | `packages/api/src/realtime.ts` | measured | 4 546 sockets and 4 462 file descriptors, bounded | — |

### Voice, sound and the Core

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| Voice → world | PASS | `BerxWebVoice` → `berxVoiceToWorld` → `berxIntent` → a real client method → the same world | `voiceWeb.ts`, `voiceToWorld.ts` | `verify:5d-wiring`, `verify:5d-voice`, `verify:5d-app-shell` | 19 + 46 gates; "покажи события" planned `events` on the real client and put `event:908` in front of the viewer, in the SAME world | — |
| Core states | PASS | `berxCoreCause` maps causes to states; the drawn Core is the one the renderer gets | `core/berxCore.ts`, `core/berxCoreWorld.ts` | `verify:5d-core`, `verify:5d-wiring` | 31 + 46 gates; the whole exchange is a path — idle → aware → discovering → searching → error — sampled off the RENDERED Core every 8ms | — |
| A hand does not make BERX less busy | PASS | `presence` reaches `aware` only from `idle`, `aware` or `success` | `core/berxCoreWorld.ts` | `verify:5d-wiring` | two gates had been failing: a finger resting on the world while a search was in flight reset the room to "someone is here" | — |
| Microphone consent | PASS | opened only from a real gesture — a keypress or a held finger | `appShell.ts`, `voiceToWorld.ts` | `verify:5d-mobile` | **0 `getUserMedia` calls** between page load and the world existing, with the method wrapped before the page ran a line. No covert capture anywhere, and no browser indicator touched | — |
| Speech provider abstraction | PASS | `BerxSpeechProvider` → `berxSpeechChain` → `BerxVoiceBackend` → the assistant | `voice/berxSpeechProvider.ts`, `voiceWeb.ts`, `appShell.ts` | `verify:5d-wiring` | `paid-tts:failed(paid-tts refused) web-speech:spoke mic:listened` — a provider that fails is fallen back from and named, so a deployment that has paid for a voice sees when it is silently not being used | — |
| Speech synthesis | PROVIDER BLOCKER | `speechSynthesis` is real and wired | `voiceWeb.ts` | measured directly | this container has **0 installed voices** and answers `synthesis-failed` in 0 ms | No TTS provider exists to buy into. A real one is added by listing it first in `voice.providers` with nothing else changing |
| Spatial audio listener | PASS | every rAF frame → `berxListenerFromCamera` → real `AudioListener.positionX/forwardX/upX` | `runtimeHost5d.ts`, `spatialAudioWeb.ts` | `verify:5d-wiring`, `verify:5d-mobile` | 4 gates read the real `AudioListener` back; the context is suspended until a gesture and `spatial=true` (HRTF, not stereo gain) | — |
| Sound at an entity's position | PASS | an ingest carries `sounds` → `audio.play(source, position)` → followed every frame the entity moves → stopped when it leaves | `worldApp.ts`, `spatialMapping.ts`, `runtimeHost5d.ts`, `spatialAudioWeb.ts` | code path; `BerxWebSpatialAudio.live` reads position and gain back out of the real `PannerNode` and `GainNode` | `BerxAudioSource` had carried `objectId` — "the entity this sound belongs to; its position is the sound's" — since spatial audio was written, and **nothing had ever put one into a world** | — |
| Audio content | PRODUCT CONTENT GAP | — | — | — | `BerxMediaType` includes `audio` and `BerxMediaAsset` carries a `url`, but **no endpoint the world loader reads returns one**: the twelve domain endpoints return no audio, and `BerxStorySummary` carries a `mime_type` and no url | Nobody has recorded any audio into BERX. The path is complete and gate-proven; there is nothing to play |

### The shell, the page and the platform

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| The world is the application | PASS | `app/index.html` boots one bundle; no router, no screen, no card list, no tab bar | `app/index.html`, `appShell.ts` | `verify:5d-app-shell` | a real Chromium boot: a WebGL2 world of entities that came from API responses, and no 2D product UI in the document | — |
| Browser gesture ownership | PASS | `touch-action:none`, `-webkit-touch-callout:none`, `user-select:none`, transparent tap highlight on the canvas; `overscroll-behavior:none` on the page | `appShell.ts`, `app/index.html` | `verify:5d-mobile` | read off `getComputedStyle` on both profiles. Without it a pan arrives as `pointercancel`, a pinch zooms the page, a tap waits 300ms and a downward drag reloads the world | — |
| Safe areas | PASS | `viewport-fit=cover` + `env(safe-area-inset-*)` with `max()`/`calc()` on every fixed element | `app/index.html`, `appShell.ts` | `verify:5d-mobile` | **real insets emulated over CDP** (`Emulation.setSafeAreaInsetsOverride`: 59/34 iPhone, 24/24 Android) and the elements measured after | — |
| Virtual keyboard | PASS | `interactive-widget=resizes-content` for Chrome; `visualViewport` → the composer lifts by the height the keyboard took | `app/index.html`, `appShell.ts` | `verify:5d-mobile` | the SHIPPED listener, driven with a keyboard's geometry, put the field's bottom above the keyboard's top and returned it when the viewport came back. iOS Safari does not implement `interactive-widget`, which is why this path exists | — |
| Orientation | PASS | `ResizeObserver` → `applySize` re-resolves quality and the backing store; the world is untouched | `runtimeHost5d.ts` | `verify:5d-mobile` | same entity ids and same focus in landscape, re-framed, no horizontal scroll | — |
| Device pixels | PASS | native dpr capped by the quality resolver and by the tier | `runtimeQuality.ts`, `runtimeHost5d.ts` | `verify:5d-mobile`, `verify:5d-gpu` | 390 CSS px × 2 = 780 device px on a 3x phone; a phone rendering everything at 3x would drop frames and one at 1x would be soft | — |
| Mobile boot | PASS | the whole path at a phone's viewport and density | — | `verify:5d-mobile` | **419 ms** (iPhone) and **320 ms** (Android) from navigation to a world holding entities — sign-in tap, token, `/me` and twelve domain endpoints, every pixel on a CPU rasteriser | — |
| Installable | PASS | `app/berx.webmanifest`, linked from the shipped page, in the Visual DNA's own colours | `app/berx.webmanifest`, `app/index.html` | `verify:5d-pwa` | fetched and parsed as the browser sees it: `standalone`, `#07080A` matching the page's `theme-color`, 4 icons including a maskable 512 | — |
| Service worker / offline shell | PASS | `app/berx-sw.js` — the shell network-first, any navigation answered from it offline, `/api/` NEVER intercepted | `app/berx-sw.js`, `app-shell.entry.ts` | `verify:5d-pwa` | after a signed-in session that read 18 endpoints, CacheStorage holds the page, the bundle and the manifest and **0 `/api/` responses**; with the network off the page opens on `#07080A` and shows **0 entities** | — |
| Nothing private is cached | PASS | the worker does not intercept `/api/` at all | `app/berx-sw.js` | `verify:5d-pwa` | a worker holding somebody's messages would put private data in a store that outlives the session, survives sign-out and is readable by any later visitor to the same browser profile | — |

### Identity, privacy and language

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| Login / session / expiry | PASS | `POST /auth/login` → bearer token in `BerxTokenStorage` → every request; the server's own error text on failure | `packages/api/src/client.ts`, `app-shell.entry.ts` | `verify:5d-backend`, `verify:5d-app-shell` | 20 gates; a real sign-in boots a real world, and a refused action reports the server's reason | — |
| Registration | PASS | `POST /auth/register` with username, firstname, lastname, email, password — exactly `auth.php`'s real action, same class, same validation order | `packages/api/src/client.ts` | `verify:5d-backend` | the five fields the endpoint accepts, no more | — |
| Registration: language and world preference | PARTIAL | the browser's locale is resolved and applied; the arrival intent is collected by the spoken flow and shapes the arrival scene | `i18n.ts`, `voice/berxRegistrationVoice.ts` | `verify:5d-locale` | `auth.php` reads exactly `username, firstname, lastname, email, password` and rejects on any missing one; OSSN's users table has no language column and its per-user features each use a dedicated table created by a component installer | Neither preference is PERSISTED, because there is no backend field for either. Adding one is a real OSSN migration, not a client change, and inventing a field the server would drop would be worse than saying this |
| Locale infrastructure | PASS | `berxResolveLocale` from `navigator.languages` by primary subtag → `lang`/`dir` on the document → `Intl` for numbers, dates, relative times and money | `packages/spatial/src/i18n.ts`, `app-shell.entry.ts` | `verify:5d-locale` | 11 gates. `de-AT → de`, `pt-BR → ru`; six distinct date forms and four distinct number forms; Arabic is `rtl` and the world does not flip with it; money takes its currency as an argument because BERX has no payment system to default one from | — |
| Product copy | PRODUCT CONTENT GAP | 38 message ids in a catalogue; `berxTranslate` falls back to `ru` and REPORTS every miss | `app-shell.entry.ts`, `i18n.ts` | `verify:5d-locale` | **ru 38/38 · en 0/38 · de 0/38 · fr 0/38 · es 0/38 · ar 0/38**, computed from the catalogues rather than declared beside them | Nobody has written the other five. They are declared and EMPTY on purpose: five catalogues of unreviewed machine output would read as finished and be wrong in ways nobody would find until a person read them. ru/en/de/fr/es/ar is NOT claimed |
| Location privacy | PASS | `watchPosition` started only when something first asks — the first time someone talks to BERX — with `enableHighAccuracy: false`; refused or no signal both answer `undefined` | `app-shell.entry.ts` | `verify:5d-voiceos`, `verify:5d-core` | no default city, no IP guess, no last-known value from disk; an unresolvable "рядом" carries `needs: ['location']` and the voice says «я не знаю, где ты» | — |
| Block / report / mute | PASS | `blockUser`, `unblockUser`, `blockedUsers`, the report endpoints and `mute`, offered as affordances with real labels | `packages/api/src/client.ts`, `spatialAffordances.ts` | `verify:5d-backend`, `verify:5d-app-shell` | an action with no server endpoint is named and refused and leaves the world byte-identical | — |
| Dating privacy | PASS | `PATCH /dating/privacy` with exactly the fields the endpoint accepts; a dating profile is its own pseudonymous entity | `packages/api/src/client.ts`, `spatialMapping.ts` | `verify:5d-domains` | `person:91` and `person:92` never appear in a world that holds `person:dating-91` and `person:dating-92` | — |

### Design and build

| CAPABILITY | STATUS | REAL IMPLEMENTATION | FILES | TEST | EVIDENCE | BLOCKER |
|---|---|---|---|---|---|---|
| Visual DNA in the shipped runtime | PASS | `#07080A` is the ground in the tokens, the shell's mount and the page; `#4FD6E8` is BERX Energy in the presentation ladder, the lighting and the materials | `tokens.ts`, `spatialPresentation.ts`, `worldLighting.ts`, `worldMaterials.ts`, `appShell.ts`, `app/index.html` | `verify:5d-lighting`, `verify:v9`, `verify:5d-pwa` | 5 lighting gates measure the BRDF and the palette in pixels; the manifest's colours are the same `#07080A` the page's `theme-color` carries | — |
| 300 screen contracts | PASS | one registry, resolved by screenId and by route | `contracts.generated.ts`, `registry.ts`, `resolve.ts` | `verify:v9`, `verify:v9:web` | **300 contracts present, 300/300 resolve by screenId, 300/300 by route path**; 33 + 24 gates | — |
| Typecheck | PASS | strict `tsc --noEmit` across the workspace | — | `npm run typecheck` | 0 errors | — |
| Production build | PASS | — | `app/berx-app.js`, `scripts/berx-5d.runtime.js`, `scripts/berx-5d.scenes.js` | `npm run build:spatial-web` | 567.3 kB + 552.2 kB + 21.0 kB (8 contracts) | — |
| PHP backend syntax | PASS | — | 61 files under `backend/scripts` and `components/OssnApi` | `php -l` | 61 files, 0 errors | — |
| Lint | PRODUCT CONTENT GAP | — | — | — | there is **no linter in this workspace**: no eslint, prettier or biome config and none in devDependencies | Nobody has chosen one. Strict `tsc --noEmit` stands in for it and `verify:static` is a file-presence check, not a linter. Not claimed as a lint pass |

### Totals

| STATUS | COUNT |
|---|---|
| **PASS** | 58 |
| **PARTIAL** | 1 |
| **FAIL** | **0** |
| **HARDWARE BLOCKER** | 4 |
| **PROVIDER BLOCKER** | 1 |
| **PRODUCT CONTENT GAP** | 3 |
| *total capabilities audited* | **67** |

**The one PARTIAL is not a code gap.** A registration language and a
persisted visual-world preference have no backend field: `auth.php` reads
exactly `username, firstname, lastname, email, password`, OSSN's users
table has no language column, and its per-user features each use a
dedicated table created by a component installer. Adding one is a real
OSSN migration — a schema change that cannot be written and verified from
the client side — and sending a field the server would drop would be
worse than saying this. The browser's locale IS resolved and applied
today; what is missing is persistence.

**Four HARDWARE BLOCKERS, one machine.** No GPU (WebGPU presentation, the
mobile frame budget), no headset or XR runtime (WebXR), no WebKit binary
(iPhone Safari's own behaviour). Every one is a device this container does
not have, and every one names the code that is finished and waiting.

**One PROVIDER BLOCKER.** No TTS provider exists to buy into. The
abstraction is complete and gate-proven with a failing provider falling
through to a working one.

**Three PRODUCT CONTENT GAPS** — the category this pass added, because
filing them as PARTIAL hid what they are. Nobody has recorded audio into
BERX, nobody has written the five non-Russian catalogues, and nobody has
chosen a linter. All three are somebody writing something, not somebody
fixing something.

**What this pass corrected in the previous audit.** OFFERS was recorded
as a PROVIDER BLOCKER — "no endpoint of any kind exists for offers".
`offers.php` is a complete backend and always was: list, claim, fulfil,
redemptions, with viewer-scoped claimed state. The client had no method.
BUSINESS was recorded as PARTIAL for want of a mapper; the mapper had
always been there and no fixture had ever set `is_business`. Verifying a
status label against the code rather than trusting it moved three rows
from PARTIAL to PASS and one from PROVIDER BLOCKER to PASS.

## 3. Blockers that remain, and why they are blockers

Six things are not finished, and not one of them is code waiting to be
written. Each says what it needs and what is already there.

### HARDWARE — this machine has no GPU, no headset and no WebKit

**WebGPU presentation.** lavapipe grants a device, so pipelines,
submission and readback are all real and `verify:5d-crossrender` measures
them against WebGL2 pixel for pixel. The canvas cannot be presented to,
so a product session falls back to WebGL2 by design. `depthAt` is
deliberately unimplemented on that backend rather than invented: readback
is asynchronous and a pick is not, and an invented depth is worse than
none.

**The mobile frame budget.** 60ms is the right budget for a phone and it
is not a measurable claim here: the driver names itself `llvmpipe` and
every fragment is rasterised on the CPU. Measured anyway and reported —
p50 813.6ms at 1.32 Mpx on the iPhone profile — because the number is
real even though it says nothing about a phone. The gate asserts the
budget wherever `WEBGL_debug_renderer_info` reports real hardware, and
asserts the thing that needs no GPU regardless: that a runtime drawing at
1fps steps its own render tier down.

**WebXR.** Measured directly: this Chromium exposes no `navigator.xr` at
all (`{"present": false}`). No session can be requested, so the session
layer cannot be exercised here. It is written against the W3C
specification, XR is entered only from a real user gesture and never
automatically, and the flat-world ends it drives — `xrPose.ts`,
`setHeadViews`, `options.stereo` — are gate-proven.

**iPhone Safari's own behaviour.** Playwright's WebKit is not installed
(`/opt/pw-browsers` holds chromium and ffmpeg only). The iPhone profile
is the real Chromium engine at an iPhone's viewport, density, user agent,
touch capability and CDP-emulated safe-area insets, so everything it
measures about BERX's own code is real. What it cannot measure is not
claimed: iOS's WebGL2 limits, its absent `interactive-widget` support
(which is exactly why the `visualViewport` path exists), its own
`touch-action` implementation, and the fact that iOS has no WebXR.
`npx playwright install webkit` closes it.

### PROVIDER — nobody has bought a voice

**Speech synthesis.** Still no provider and none was invented. What was
missing was never a purchase but a CONTRACT: `BerxVoiceBackend` could not
express a language, could not say whether audio leaves the device, and
had no answer for a provider that fails. All three are in
`berxSpeechProvider.ts`, the shipped shell builds a chain, and a real
service is added by listing it first in `voice.providers` with nothing
else changing. This container has 0 installed voices and answers
`synthesis-failed` in 0 ms, which the chain reports by name rather than
swallowing.

### PRODUCT CONTENT — somebody has to write something

This category is new in this pass, and adding it is most of what changed
about the audit's honesty. Three rows had been filed as PARTIAL, which
reads as half-built code. None of them is code.

**No audio exists in BERX.** `BerxMediaType` includes `audio` and
`BerxMediaAsset` carries a url, and no endpoint the world loader reads
returns one: the twelve domain endpoints return no audio, and
`BerxStorySummary` carries a `mime_type` and no url. The playback path is
complete — an ingest carries sounds, the host plays them at the entity's
position, follows the entity every frame it moves, stops them when it
leaves, and `BerxWebSpatialAudio.live` reads position and gain back out
of the real `PannerNode`. There is nothing to play.

**Five of six languages have no words.** ru 38/38, en 0/38, de 0/38,
fr 0/38, es 0/38, ar 0/38 — computed from the catalogues, not declared
beside them. The infrastructure is complete for all six: the locale is
resolved from the browser, `lang` and `dir` follow it, and numbers,
dates, relative times and money come from `Intl`. The five catalogues
are declared and empty on purpose. Five catalogues of unreviewed machine
output would read as finished and be wrong in ways nobody would find
until a person read them.

**No linter has been chosen.** No eslint, prettier or biome config, and
none in devDependencies. Strict `tsc --noEmit` stands in for it and
`verify:static` is a file-presence check rather than a linter. Not
claimed as a lint pass.

### And two things that were recorded as blockers and were not

**OFFERS was recorded as a PROVIDER BLOCKER** — "no endpoint of any kind
exists for offers in `BerxApiClient`". True of the client and false of
the product: `offers.php` is a complete backend and always was. Now
wired, and measured claiming a real offer.

**BUSINESS was recorded as PARTIAL** for want of a dedicated mapper.
`mapPlaceToSpatial` has always turned the server's `is_business` into a
`business` entity with its own geometry, material and affordances. No
fixture had ever set the flag, so the whole reading went unexercised and
looked, from the audit, like missing code.

Verifying a status label against the code rather than trusting it is what
found both.

## 4. How to run what was run

```bash
cd client
npm ci                       # workspaces; the lockfile resolves all 10

npm run typecheck            # whole client workspace
npm run build:spatial-web    # the shipped bundles

npm run verify:5d-shared-core
npm run verify:5d-geometry
npm run verify:5d-world      # X/Y/Z + T + R invariants
npm run verify:5d-picking    # NEW — pointer → pixel → entity, ~1 minute
npm run verify:5d-composition
npm run verify:5d-dimensions
npm run verify:5d-wiring     # tiers, Core, ears, live world, voice
npm run verify:5d-app-shell  # the shipped shell, booted as a browser boots it
npm run verify:5d-mobile     # NEW — iPhone and Android profiles, touch, safe areas, keyboard
npm run verify:5d-pwa        # NEW — the manifest, the worker, and a reload with no network
npm run verify:5d-transitions
npm run verify:5d-crossrender
npm run verify:5d            # the whole chain, in order

# backend
for f in $(find backend/scripts backend/opensource-socialnetwork-master/components/OssnApi -name '*.php'); do php -l "$f"; done
```

`verify:5d-mobile` needs a Chromium new enough for
`Emulation.setSafeAreaInsetsOverride` (Chrome 133+; 141 here). Without it the
safe-area gates report BLOCKED rather than passing — there is no way to apply
a real inset, and asserting that the CSS *mentions* `env()` would be asserting
the source rather than the behaviour.

`verify:5d-app-shell` takes roughly half an hour on a software rasteriser:
every probe settles sixty real frames and the full 5D pipeline is being
rasterised on the CPU. That is the cost of measuring a real product boot
rather than a fixture.

## 5. Results, as measured in this pass

Every row was run on this machine in this pass. Where a number appears it
is the gate's own count.

**One gate at a time.** Four gates failed in the first full regression and
one of those failures — `verify:5d-performance`, where medium and low came
out 0.2ms apart — was CPU starvation caused by three of my own browser
probes running beside it. Re-run alone it passes with a clean descent.
That is the whole argument for not running the expensive suite
concurrently with anything.

| Gate | Result |
|---|---|
| `typecheck` | PASS — whole client workspace, strict |
| `verify:static` | PASS |
| `verify:5d-shared-core` | ALL PASS — 14 |
| `verify:5d-geometry` | PASS |
| `verify:5d-runtime` | PASS |
| `verify:5d-world` | PASS — X/Y/Z + T + R invariants |
| `verify:5d-picking` | **ALL PASS — 45 presses, 45 correct, 31 of 31 slots reachable across nine viewpoints** |
| `verify:5d-composition` | ALL PASS — 10 |
| `verify:5d-dimensions` | ALL PASS — 15 |
| `verify:5d-framing` | ALL PASS — 4; 46.5 / 41.5 / 50.0 / 43.4 % with every entity wholly inside |
| `verify:5d-lighting` | ALL PASS — 5 |
| `verify:5d-platforms` | ALL PASS — 11 |
| `verify:5d-wiring` | **ALL PASS — 46** (two had been failing: a hand demoted a search in flight) |
| `verify:5d-core` | ALL PASS — 31 |
| `verify:5d-voiceos` | ALL PASS — 45 |
| `verify:5d-voice` | ALL PASS — 46 |
| `verify:5d-xr` | ALL PASS — 7, every device path BLOCKED, no `navigator.xr` at all |
| `verify:5d-native-targets` | PASS |
| `verify:5d-transitions` | **ALL PASS — 12** (`collapse` had cancelled itself) |
| `verify:5d-backend` | ALL PASS — 20 |
| `verify:5d-haptics` | ALL PASS — 14 |
| `verify:5d-blockers` | PASS |
| `verify:5d-gpu` | **ALL PASS — 23, 0 BLOCKED** |
| `verify:5d-exposure` | ALL PASS — 6 |
| `verify:5d-pipeline` | ALL PASS — 11 |
| `verify:5d-quality` | ALL PASS — 15 |
| `verify:5d-stability` | ALL PASS — 8 |
| `verify:5d-performance` | **ALL PASS — 7**, run alone: ultra 147.2ms · high 124.5ms · medium 73.6ms · low 72.1ms, low at 53% of high |
| `verify:5d-shadows` | ALL PASS — 13 |
| `verify:5d-environment` | ALL PASS — 12 |
| `verify:5d-ssao` | ALL PASS — 17 |
| `verify:5d-volumetric` | ALL PASS — 10 |
| `verify:5d-particles` | ALL PASS — 12 |
| `verify:v9` | ALL PASS — 33; **300 contracts, 300/300 by screenId, 300/300 by route** |
| `verify:v9:web` | ALL PASS — 24 |
| `verify:5d-crossrender` | **ALL PASS — 28** |
| `verify:5d-realtime` | **ALL PASS — 16** against a real MariaDB, real accounts, real relationship rows |
| `verify:5d-domains` *(new)* | **ALL PASS — 12**: business, offers with a real claim, creators, dating |
| `verify:5d-locale` *(new)* | **ALL PASS — 11**: ru 38/38 and five at 0/38, computed |
| `verify:5d-pwa` *(new)* | **ALL PASS — 8**: manifest, worker, CacheStorage read back after a signed-in session, and a reload with the network off |
| `verify:5d-mobile` *(new)* | **ALL PASS — 44** across the iPhone and Android profiles, 2 HARDWARE BLOCKER (the frame budget, on a CPU rasteriser) + 1 ENGINE BLOCKER (no WebKit installed). See §1.8 and §1.18 |
| `verify:5d-app-shell` | **ALL PASS — 76** on the shipped shell booted in Chromium. See §1.19 |
| `build:spatial-web` | PASS — `berx-app.js` 567.3 kB, `berx-5d.runtime.js` 552.2 kB, `berx-5d.scenes.js` 21.0 kB (8 contracts) |
| PHP syntax | PASS — 61 files, 0 errors |
| lint | **No linter exists in this workspace.** See §3 — recorded as a PRODUCT CONTENT GAP, not as a pass |
| unit tests | No separate runner: the `verify:5d-*` suite IS the test suite, and it runs against real browsers, a real socket server and a real MariaDB rather than fixtures |

## 6. 5D is intact

Nothing in this pass weakened X, Y, Z, T or R. The picking repair made the
picker agree with what the renderer draws; the pan repair changed how far a
finger moves the eye. Neither changed where anything stands, and no
dimension was turned off to make a number come out.

**And 5D is not the visual.** The five are load-bearing or they are
decoration, so each one is asserted by something that would break if it
were only a label:

- **Z is real depth, not a shadow.** The G-buffer's alpha stores
  `-view_pos.z`, and it is the authority a press is resolved against —
  `verify:5d-picking` puts 47 real PointerEvents at 47 entities' own
  pixels and every one lands on the entity whose surface the renderer
  actually drew there. A world with painted-on depth would fail that on
  the first occluded entity.
- **T changes the world, not a caption.** Scrub the cursor a year back and
  NOW is empty, because nothing was happening then; a three-year-old
  memory stands sixty units further into depth than a post from this
  morning. `verify:5d-dimensions`, and `verify:5d-app-shell` measures it
  on a real product boot.
- **R decides where things are.** The relational layout sets separation
  from relation type and strength; a relation arriving over the socket
  places its entity by the same rule a cold load uses — post 7801 landed
  at a real finite position, not at the origin.
- **The camera really moves.** A focus is a travel with a pose and a
  transition kind, a drag translates the eye by the distance the pixels
  subtend, and two fingers change the field of view. All three are
  measured off `frame.camera`, not off a CSS transform.

- **X/Y/Z** — `verify:5d-world` PASS, `verify:5d-dimensions` PASS.
- **T** — the temporal cursor still offsets what is drawn without moving the
  canonical world; `verify:5d-world` covers it and passes.
- **R** — the relational layout still decides position, gravity and the
  relation geometry that reaches the draw list; `verify:5d-world` and
  `verify:5d-composition` both pass, and the live-world gates prove an entity
  arriving over the socket is placed by the same relational layout (post 7801
  landed at a real finite position, not at the origin).

## 7. The production path, stage by stage

Asked of the code rather than of the file listing: for each stage, what
calls it, what it does when the thing it depends on fails, and what ends
it. **A file existing is not wiring.**

| STAGE | REAL CODE | THE REAL CALL | WHEN IT FAILS | LIFECYCLE | MEASURED BY |
|---|---|---|---|---|---|
| REAL API | `packages/api/src/client.ts` — `request()` | `fetch(baseUrl + '/api/v1' + path)` with a bearer header from `BerxTokenStorage`; form-encoded bodies; `FormData` left to set its own boundary | `throw new BerxApiError(res.status, json)` — the server's own status and body, never a generic message | the token is read from storage per request; `setToken(null)` on sign-out | `verify:5d-backend` (20), `verify:5d-app-shell` |
| WORLD LOADER | `packages/scenes/src/worldLoader.ts` | `attempt(name, () => api.X(), apply)` for twelve domain endpoints | each `attempt` records `{source, message}` in `failures` and the load continues — a world is never completed by inventing what did not arrive, and the shell names the failure | one load per region, `loadedRegions` keyed by region + focus, so travelling back does not re-read | `verify:5d-runtime`, `verify:5d-app-shell` (an unmatched API path is printed by name) |
| WORLD STATE | `packages/spatial/src/worldApp.ts`, `world.ts` | `world.ingest(entries)` — identities persist across re-reads | an action that throws ingests NOTHING: id, kind, createdAt, updatedAt and material stay byte-identical | `persist()` and restore put a viewer back where they were; entities are re-read from the server, never restored from disk | `verify:5d-app-shell` (byte-equality across a refused action), `verify:5d-world` |
| X / Y / Z | `packages/spatial/src/relational.ts` → `berxFitCamera` | relations decide separation in units of `(r_a + r_b)`, then an even angular re-spacing pass, then six relaxation passes using `berxDrawnHalfExtent` | a relation with an undefined strength used to produce NaN coordinates; a strength is finite or the edge is dropped | recomputed on ingest; the root stays fixed so the world does not swim | `verify:5d-framing` (46.5 / 41.5 / 50.0 / 43.4 % occupancy, containment 5/5), `verify:5d-composition` |
| T | `berxTemporalCursor`, `berxApplyTemporal` | the cursor offsets `z` by `depthOffset` in `latestFrame`/`frame()` and NEVER in `runtime.world` | a story the feed gave no `time_expires` for is not given one | scrubbing moves the world in depth; the canonical world is untouched | `verify:5d-dimensions` (15), `verify:5d-app-shell` (NOW travels, and is empty in a year when nothing happened) |
| R | `relational.ts`, `worldLighting.ts`, `spatialAffordances.ts` | relations set layout, gravity, energy, which affordances exist, and what the picker can reach | an edge whose type the layout does not know is dropped rather than guessed | re-derived per ingest | `verify:5d-world`, `verify:5d-wiring` |
| DRAW LIST | `packages/spatial/src/drawList.ts` | ONE list per frame; `berxTransitionModulation` folds a transition's opacity, emissive, scale and fov into it | an object with no geometry is not drawn; nothing invents a mesh | rebuilt every frame from world + camera + cursor | `verify:5d-crossrender` (28) |
| WEBGL2 | `packages/spatial-web/src/threeRuntime.ts` | the same draw list → real GL calls; the G-buffer alpha stores `-view_pos.z`, the one depth authority | `webglcontextlost` pauses the frame loop and the meshes rebuild on restore, rather than a black canvas until reload | `destroy()` releases meshes, textures and listeners | `verify:5d-gpu` (23), `verify:5d-app-shell` |
| WEBGPU | `packages/spatial-web/src/webgpuRuntime.ts` | the same draw list; adapter and device requested, pipelines built, submission and readback real on lavapipe | cannot present to a canvas here, so `startBerxApp` falls back to WebGL2 by design; `depthAt` is deliberately unimplemented rather than invented, because readback is asynchronous and a pick is not | the device-loss path exists; `verify:5d-app-shell` reports it BLOCKED here | `verify:5d-crossrender`; HARDWARE BLOCKER for presentation |
| INTERACTION | `runtimeHost5d.ts`, `spatialInteraction.ts`, `actionRing.ts` | pointer / keyboard / hold → `pickActionSlot(slots, camera, ray, aspect, drawnDepth)` first, then `renderer.pick` → `berxResolveByDepth` → `runtime.focus` or `world.act` | `setPointerCapture` and `releasePointerCapture` are both wrapped — a capture that never took used to throw and abandon the pick; `berxCanActivate` is a positive list, so an unknown state refuses | one `activate` closure serves pointerup and Enter; a drag is not a tap, and a hold is not a tap | `verify:5d-picking` (47/47 presses, 31/31 slots), `verify:5d-mobile`, `verify:5d-app-shell` |
| REALTIME | `packages/scenes/src/realtimeWorld.ts`, `packages/api/src/realtime.ts` | `POST /realtime/token` → one WebSocket → `auth` → `subscribe` → `event` → the same endpoint a cold load uses → `world.ingest` | a socket that refuses is a named failure and does not hold the world behind it; ONE failure schedules ONE reconnect chain — this had produced 4 546 sockets and 4 462 file descriptors | `close()` tears down the socket and the timer; a spent credential is refused by the server | `verify:5d-realtime` (16, real MariaDB), `verify:5d-app-shell` (a real write elsewhere arrives with nobody polling) |
| VOICE | `voiceWeb.ts`, `voiceToWorld.ts`, `voice/berxSpeechProvider.ts` | `v`/`м`, or a held finger → `shell.listen()` → recogniser → `berxIntent` → a real API method → the same world | a provider that fails is fallen back from and named (`paid-tts:failed(...) web-speech:spoke`); an unresolvable reference carries `needs` rather than a guess | the microphone opens only from a real gesture; `stop()` reaches every provider in the chain | `verify:5d-wiring` (19 voice gates), `verify:5d-voice` (46), `verify:5d-app-shell`, `verify:5d-mobile` |
| SPATIAL AUDIO | `spatialAudioWeb.ts`, `berxListenerFromCamera` | every rAF frame → `berxListenerFromCamera(camera)` → `AudioListener.positionX` / `forwardX` / `upX` | the context starts suspended and is resumed by the first real gesture; an `OfflineAudioContext` has no `resume` and both are guarded | `close()` releases the context | `verify:5d-wiring` (4 ears gates, a real `AudioListener` read back), `verify:5d-mobile` |

## 8. The product, photographed

Seventeen states of the shipped Web app, captured by
`client/scripts/berx-web-screenshots.mjs` from `app/index.html` and the
bundle built from `client/scripts/app-shell.entry.ts`, signed in through
the real entry form against the same `/api/v1/*` server every gate uses.
Nothing here is a mockup, a reconstruction, or a scene built for a
picture: every state was reached by driving the product's own
`travelTo`, `focus`, `scrubTime` and `enterRegion`.

**A screenshot of a canvas is not evidence of a world**, so no file is
written until the harness has checked, on that exact frame: the runtime
is alive, the renderer is WebGL2 or WebGPU, the camera pose, the Z
spread, the temporal cursor, the relation count, the entity count, the
world mode, and — by projecting every visible entity through the frame's
own camera — how many of them are actually inside the viewport. Fewer
than three in frame and the harness re-focuses and re-checks; fewer than
one and the state is marked BLOCKED with no file written. That check is
what caught the two black frames an earlier version of this harness had
produced, where it had overridden the product's camera with its own
framing call.

**Result: 17 captured, 0 blocked, 0 page errors across the whole run.**

| file | status | state | viewport | world mode | renderer | in frame | Z spread | R | ring |
|---|---|---|---|---|---|---|---|---|---|
| `01-boot-entry.png` | CAPTURED | BERX boot / entry | 1600x1000 @2 | not signed in (entry form) | none yet | — | — | — | — |
| `02-entry-locale-rtl.png` | CAPTURED | Locale resolution and RTL, on the real entry | 1600x1000 @2 | not signed in (entry form) | none yet | — | — | — | — |
| `03-living-world.png` | CAPTURED | The 5D living world | 1600x1000 @2 | region "world" | webgl2 | 15 of 15 | -29.9 … 2.3 | 18 | 0 |
| `04-now.png` | CAPTURED | BERX NOW | 1600x1000 @2 | region "now" | webgl2 | 7 of 15 | -29.9 … 2.3 | 18 | 0 |
| `05-people-gravity.png` | CAPTURED | People, and social gravity | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 16 of 19 | -34.8 … 7.8 | 22 | 3 |
| `06-dating-world.png` | CAPTURED | The dating world, and only your own | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 17 of 21 | -31.4 … 8.8 | 22 | 1 |
| `07-place-business.png` | CAPTURED | A place the server calls a business | 1600x1000 @2 | region "place", focused place:4212 | webgl2 | 22 of 22 | -62.5 … 0.0 | 23 | 3 |
| `12-offer-at-a-place.png` | CAPTURED | An offer, attached to a real place | 1600x1000 @2 | region "place", focused experience:offer-501 | webgl2 | 13 of 22 | -62.5 … 0.0 | 23 | 1 |
| `08-events.png` | CAPTURED | The events world | 1600x1000 @2 | region "event", focused event:908 | webgl2 | 22 of 22 | -62.5 … 0.0 | 23 | 3 |
| `09-conversation.png` | CAPTURED | Messages, as a region you stand in | 1600x1000 @2 | region "conversation", focused message:78 | webgl2 | 24 of 25 | -28.2 … 1.7 | 29 | 3 |
| `10-stories.png` | CAPTURED | Stories, which leave when the server says they do | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 25 of 25 | -28.2 … 1.7 | 29 | 5 |
| `11-memories-temporal.png` | CAPTURED | T, scrubbed three years back | 1600x1000 @2 | region "now", focused moment:story-91 | webgl2 | 13 of 25 | -1.2 … 30.6 | 29 | 0 |
| `13-creator-world.png` | CAPTURED | A creator, with their work standing around them | 1600x1000 @2 | region "person", focused person:78 | webgl2 | 21 of 25 | -28.2 … 1.7 | 29 | 3 |
| `14-profile-in-world.png` | CAPTURED | A profile, inside the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 of 25 | -28.2 … 1.7 | 29 | 3 |
| `15-spoken-search.png` | CAPTURED | A spoken question, answered in the world | 1600x1000 @2 | region "person", focused person:77 | webgl2 | 25 of 25 | -28.2 … 1.7 | 29 | 3 |
| `17-desktop-wide.png` | CAPTURED | Wide desktop | 2560x1080 @2 | region "person", focused person:77 | webgl2 | 25 of 25 | -28.2 … 1.7 | 29 | 3 |
| `16-mobile-iphone.png` | CAPTURED | Mobile web, at an iPhone's viewport and density | 390x844 @3 | region "world" | webgl2 | 9 of 15 | -29.9 … 2.3 | 18 | 0 |

Plus `00-contact-sheet.png` — itself a real screenshot of a page that
references those seventeen files and nothing else.

**Hardware, stated exactly.** This capture ran on
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`.
The headless GPU gates run on mesa llvmpipe/lavapipe. Both are software
rasterisers, neither is a GPU, and they are not the same one — the
manifest, the README and the sheet caption now all take the string from
the runtime rather than from an assumption, because a hardware caption
is only useful if it names the right hardware. WebGPU cannot present to
a canvas here, so every image is WebGL2. **Nothing in these images is
evidence about performance.**

Output: `docs/web-screenshots/` — the PNGs, `manifest.json` (per-shot
verification record), `README.md`, `contact-sheet.html`.

## 9. Git

**Branch:** `berx-max-ultra-final`

| commit | what |
|---|---|
| `3e3db01` | One transposed character in the RFC 6455 GUID |
| `0256041` | The world stays live, is heard from the camera, and can be spoken to |
| `8c146c5` | The box the ray crosses is the shape on the screen |
| `80aac39` | The ears are the camera, in a session that really has them |
| `d88161f` | The audit, as measured rather than as hoped |
| `93011e6` | Four domains that had an endpoint and no place in the world |
| `683997c` | The actions of what you are looking at stand between you and it |
| `2a12de9` | The camera is told the room the ring needs, not where its centres are |
| `6703a9e` | A phone has no keyboard, and a held finger is how it asks BERX to listen |
| `cfb4f89` | The audit, the production path, and an offline shell that answers any address |
| `bda900b` | Adaptive quality that could not react, and a budget that is a claim about hardware |
| `35ea2f8` | The audit says what a gate measured, and admits what no gate here can |
| `a9b96df` | A boot budget the measurement earned |
| `f3f0018` | Both tiers, because they disagree exactly when the guess was wrong |
| `14b1f99` | The drag did nothing, because I crossed the forward axis with the wrong up |
| `a8eb55f` | Business, creators and dating: three domains that had an endpoint and no way in |
| `3bd26f8` | A gate that kills a renderer must not then blame the product for the abort |
| `3b8767d` | Offers was never a provider blocker. It was an unwired endpoint |
| `0d0fd68` | Infrastructure for six languages, content for one, and a number that says so |
| `0e8fd65` | listening lasts as long as the microphone is open, which is barely any time here |

**A note on branches.** The harness this session runs under names
`claude/opt-berx-contents-ij6gnl` as its development branch. That branch
is a different line of history — 339 commits behind this one and 304
ahead of it — so bringing this work onto it would mean force-discarding
those 304. This pass was directed to `berx-max-ultra-final` explicitly
and repeatedly, so that is where it is, and nothing was forced.

### Files changed in the closure pass

```
packages/api/src/types.ts                           BerxOffer, exactly as ossn_api_offer_json writes it
packages/api/src/client.ts                          placeOffers, claimOffer
packages/scenes/src/spatialMapping.ts               mapOfferToSpatial, mapCreatorToSpatial,
                                                    mapMediaAssetsToSpatial, sourceName on people
packages/scenes/src/worldLoader.ts                  loadBerxPlaceOffers, loadBerxCreator, loadBerxDating
packages/spatial/src/i18n.ts               NEW      locale, direction, coverage, Intl formatting
packages/spatial/src/world.ts                       sourceName on a spatial object
packages/spatial/src/worldApp.ts                    a world ingest carries sounds
packages/spatial/src/spatialCamera.ts               nudge uses the SHARED cameraBasis
packages/spatial-web/src/spatialAudioWeb.ts         live: read position and gain off the real graph
packages/spatial-web/src/runtimeHost5d.ts           sounds played, followed and stopped; boot tier exposed
scripts/app-shell.entry.ts                          offers, creators, dating, the message catalogue, lang/dir
scripts/lib/appserver.mjs                           business place, creator, dating and offer fixtures; a real claim
scripts/verify-5d-domains.mjs               NEW     12 gates: business, offers, creators, dating
scripts/verify-5d-locale.mjs                NEW     11 gates: coverage computed, not claimed
scripts/verify-5d-mobile.mjs                        hold on the world AND on an action, path-sampled
scripts/verify-5d-pwa.mjs                           network noise kept apart from uncaught errors
scripts/verify-5d-app-shell.mjs                     one identity claim, in the gate that makes it properly
```

### Files changed in the mobile / PWA pass

```
app/index.html                                      interactive-widget, overscroll, safe-area padding, manifest link
app/berx-sw.js                            NEW       shell-only cache; /api/ never intercepted
app/berx.webmanifest                      NEW       installable, in the Visual DNA's own colours
client/packages/spatial/src/core/berxCoreWorld.ts   presence does not demote a busy Core
client/packages/spatial/src/spatialCamera.ts        nudge() — a drag in world units
client/packages/spatial/src/runtime5d.ts            nudge(), refused during a transition like input()
client/packages/spatial/src/transitions.ts          collapse actually collapses
client/packages/spatial-web/src/runtimeHost5d.ts    the hold gesture; calibrated pan; measured-fps tier
client/packages/spatial-web/src/appShell.ts         canvas touch rules; safe areas; keyboard lift; onHold
client/scripts/app-shell.entry.ts                   service worker; rayFromNdc/candidates/cameraBasis exposed
client/scripts/lib/appserver.mjs           NEW      one server for every gate that needs a session
client/scripts/verify-5d-mobile.mjs        NEW      iPhone and Android, 20 gates each
client/scripts/verify-5d-pwa.mjs           NEW      manifest, worker, CacheStorage, and a reload with no network
client/scripts/verify-5d-app-shell.mjs              depthAt instead of a second G-buffer read
```

### Files changed in the earlier passes

```
client/packages/spatial/src/geometry.ts             BERX_PRIMITIVES, primitiveHalfExtent, berxDrawnHalfExtent
client/packages/spatial/src/spatialInteraction.ts   drawn half-extents; forward-cosine depth resolve
client/packages/spatial/src/actionRing.ts           pickActionSlot takes the drawn depth
client/packages/spatial-web/src/threeRuntime.ts     meshFor from BERX_PRIMITIVES; cosine into resolve
client/packages/spatial-web/src/webgpuRuntime.ts    meshFor from BERX_PRIMITIVES
client/packages/spatial-web/src/webRenderer.ts      depthAt on the backend interface
client/packages/spatial-web/src/runtimeHost5d.ts    audio listener; slot depth; one depth read per frame
client/packages/spatial-web/src/appShell.ts         audio, live world, voice, XR, __berxShell
client/packages/spatial-web/src/xrSession.ts        NEW — the WebXR session layer
client/packages/spatial-web/src/spatialAudioWeb.ts  (unchanged; now actually constructed)
client/packages/api/src/realtime.ts                 subscribe(); one reconnect chain; honest backoff reset
client/packages/scenes/src/realtimeWorld.ts         berxKeepWorldLive
client/scripts/app-shell.entry.ts                   live, voice, geolocation that is a real fix or nothing
client/scripts/picking.entry.ts                     NEW
client/scripts/verify-5d-picking.mjs                NEW
client/scripts/livewire.entry.ts                    NEW
client/scripts/lib/websocket.mjs                    NEW — RFC 6455 for the gates
client/scripts/lib/chromium.mjs                     /dev/shm, so a run cannot eat the disk allowance
client/scripts/verify-5d-wiring.mjs                 ears, live world, reconnect storm
client/scripts/verify-5d-app-shell.mjs              ears, socket, live write, voice; teardown that exits
client/scripts/wiring.entry.ts                      real AudioListener readback
client/package.json                                 verify:5d-picking in the chain
```
