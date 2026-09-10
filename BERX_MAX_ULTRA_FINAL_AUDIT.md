# BERX — MAX ULTRA FINAL AUDIT

**Branch:** `berx-max-ultra-final`
**Repository:** `/home/user/BERX` (git remote `AntonBerks/BERX`) — the source of truth for this pass.
**Environment:** Linux container, no GPU. Chromium 141 with mesa lavapipe (software Vulkan). PHP 8.4.19, no MySQL server.

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

### 1.7 The 40–60% framing band, closed by the layout

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

### 1.8 Five domains that had an endpoint and no place in the world

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

### 1.6 Two harness defects that were destroying evidence

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
**PROVIDER BLOCKER**. Nothing is marked PASS without a gate that measured it
in this pass.

| CAPABILITY | STATUS | REAL PATH | FILES | TEST | BLOCKER |
|---|---|---|---|---|---|
| Pointer → pixel → entity | PASS | PointerEvent → `slotsUnder` → `pickActionSlot`(+drawn depth) → `renderer.pick` → `berxResolveByDepth` → `runtime.focus` | `spatialInteraction.ts`, `actionRing.ts`, `geometry.ts`, `runtimeHost5d.ts`, `threeRuntime.ts` | `verify:5d-picking` — 35/35 presses, ring up on all 35 | — |
| One geometry authority | PASS | `BERX_PRIMITIVES` → both `meshFor`s and `berxDrawnHalfExtent` | `packages/spatial/src/geometry.ts` | `verify:5d-picking`, `verify:5d-geometry` | — |
| Spatial audio listener | PASS | rAF frame → `berxListenerFromCamera` → `BerxWebSpatialAudio.setListener` → real `AudioListener` | `runtimeHost5d.ts`, `appShell.ts`, `spatialAudioWeb.ts` | `verify:5d-wiring` (4 gates, real AudioListener read back) | — |
| Spatial audio playback | PARTIAL | `play(source, at)` is real HRTF; nothing calls it | `spatialAudioWeb.ts` | `verify:5d-gpu` (module) | No audio media in the API's spatial mapping — `BerxMediaType` has `audio`, the spatial surface pipeline carries images only. Not faked. |
| Realtime transport | PASS | PHP socket server ← `BerxRealtimeClient` (auth → subscribe → event) | `berx-realtime-server.php`, `packages/api/src/realtime.ts` | `verify:5d-realtime` — **16 PASS, 0 FAIL** against a real MariaDB, real accounts, real relationship rows | — |
| Realtime → world | PASS | event → `applyBerxRealtimeEvent` → real API read-back → `world.ingest` | `packages/scenes/src/realtimeWorld.ts` | `verify:5d-wiring` (12 gates, protocol-correct socket) | — |
| Realtime in the shipped shell | PASS | `startBerxApp({live})` → `berxKeepWorldLive` → socket → world | `appShell.ts`, `scripts/app-shell.entry.ts` | `verify:5d-app-shell` — 1 connection, granted `person:77, person:78, self:77`; post 7801 arrived as `moment:7801` at (-4.6, -0.9, -28.9) with nobody polling | — |
| Reconnect behaviour | PASS | backoff resets only for a connection that outlived the longest rung | `packages/api/src/realtime.ts` | measured: 4 546 → bounded | — |
| Voice → world | PASS | `BerxWebVoice` → `berxVoiceToWorld` → real client method → world | `voiceWeb.ts`, `voiceToWorld.ts` | `verify:5d-wiring` (19 voice gates) | — |
| Voice in the shipped shell | PASS | `v`/`м` on the canvas → `shell.listen()` → Core `listening` | `appShell.ts`, `scripts/app-shell.entry.ts` | `verify:5d-app-shell` — `listening` the instant the key landed; "покажи события" put `event:908` in front of the viewer in the same world | — |
| Speech synthesis | PARTIAL | `speechSynthesis` real; this container has 0 voices and answers `synthesis-failed` in 0 ms | `voiceWeb.ts` | measured directly | PROVIDER BLOCKER for production-grade TTS: no installed voice here, and Chromium's recogniser posts audio to a Google service (reported by `requiresNetwork`) |
| Microphone consent | PASS | opened only by a real keypress; no covert capture anywhere | `appShell.ts`, `voiceToWorld.ts` | code path + `verify:5d-wiring` | — |
| WebGL2 renderer | PASS | one draw list → `threeRuntime.ts` | `threeRuntime.ts` | `verify:5d-gpu` — **23 PASS, 0 FAIL, 0 BLOCKED**; plus `verify:5d-app-shell` on a real product boot | — |
| World occupancy (40–60%) | PASS | relational layout (size-relative, frame-shaped, evenly spaced, non-overlapping) → `berxFitCamera` | `relational.ts`, `berxFraming.ts`, `worldApp.ts` | `verify:5d-framing` — desktop 46.5%, phone 41.5%, tablet 50.0%, wide desktop 43.4%, every entity wholly inside | — |
| Speech provider abstraction | PASS | `BerxSpeechProvider` → `berxSpeechChain` → `BerxVoiceBackend` → assistant | `voice/berxSpeechProvider.ts`, `voiceWeb.ts`, `appShell.ts` | `verify:5d-wiring` — fallback, language, pessimistic capability, stop-all | — |
| Stories → world | PASS | `GET /stories` → `mapStoryToSpatial` → moment with `time_expires` | `spatialMapping.ts`, `worldLoader.ts` | `verify:5d-runtime`, `verify:5d-app-shell` (`moment:story-91` in the world) | — |
| Memories → world | PASS | `GET /memories` → `mapMemoryToSpatial` → moment stamped when it happened | same | same (`moment:memory-post-5151`) | — |
| Trips → world | PASS | `GET /trips` → `mapTripToSpatial` → collection with `contains` edges to real places | same | same (`collection:trip-7`) | — |
| Notifications → world | PASS | `GET /notifications` → `mapNotificationToSpatial` → moment beside its author | same | same (`moment:notice-31`) | — |
| Dating profiles → world | PARTIAL | `GET /dating/discover` → `mapDatingProfileToSpatial` → its own person entity, pseudonym only | `spatialMapping.ts` | `verify:5d-runtime` (mapping invariants) | Mapper and invariants exist; the loader does not read the endpoint, because dating discovery is a deliberate act rather than something to pull into everyone's world at boot |
| Business → world | PARTIAL | `business` entity kind exists and is drawn; places carry `is_business` | `geometry.ts`, `spatialMapping.ts` | `verify:5d-geometry` (the form), `verify:v9` | No dedicated mapper: the business endpoints are dashboard-shaped, and inventing a spatial reading of an analytics payload was refused |
| Offers → world | PROVIDER BLOCKER | — | — | — | No endpoint of any kind exists for offers in `BerxApiClient`. Not stubbed, not faked |
| Creators → world | PARTIAL | `getCreatorProfile` / `getCreatorContent` exist | `packages/api/src/client.ts` | — | No mapper. A creator is a person with a body of work; the honest spatial reading is their work related to them, which needs the content endpoints read per person rather than at boot |
| Cross-renderer parity | PASS | one draw list → WebGL2 and WebGPU | `threeRuntime.ts`, `webgpuRuntime.ts`, `geometry.ts` | `verify:5d-crossrender` — **28 PASS**, re-run after both the BERX_PRIMITIVES refactor and the layout change | — |
| WebGPU renderer | PARTIAL | same draw list → `webgpuRuntime.ts` | `webgpuRuntime.ts` | `verify:5d-crossrender` | Cannot present to a canvas on lavapipe; sessions fall back to WebGL2. `depthAt` is unimplemented there — readback is asynchronous, a pick is not, and an invented depth is worse than none |
| WebXR session layer | PARTIAL | `navigator.xr` → `requestSession` → `XRWebGLLayer` → XR frame loop → `world.setHeadViews()` → stereo render | `packages/spatial-web/src/xrSession.ts` (new), `appShell.ts` | none in this container | HARDWARE BLOCKER: measured — this Chromium exposes **no `navigator.xr` at all**, so nothing can request a session. The code is real and the flat-world ends (`xrPose.ts`, `setHeadViews`, `options.stereo`) are gate-proven |
| PHP backend syntax | PASS | — | 61 files under `backend/scripts` + `components/OssnApi` | `php -l` | 0 errors |
| Typecheck | PASS | — | whole client workspace | `npm run typecheck` | — |
| Production build | PASS | — | `app/berx-app.js`, `scripts/berx-5d.runtime.js`, `scripts/berx-5d.scenes.js` | `npm run build:spatial-web` | — |

## 3. Blockers that remain, and why they are blockers

**HARDWARE — WebXR.** This Chromium exposes no `navigator.xr` (measured
directly: `{"present": false}`). No session can be requested, so the session
layer cannot be exercised here. It is written against the W3C specification
and the flat-world ends it drives are gate-proven; what is missing is a
device.

**HARDWARE — WebGPU presentation.** The container has no GPU. lavapipe grants
a device, so pipelines, submission and readback are real and
`verify:5d-crossrender` measures them, but the canvas cannot be presented to,
so a product session falls back to WebGL2 by design.

**PROVIDER — speech synthesis.** Still no provider, and none was invented.
What was missing was not a purchase but a CONTRACT: `BerxVoiceBackend` could
not express a language, could not say whether audio leaves the device, and
had no answer for a provider that fails. All three are now in
`berxSpeechProvider.ts`, the shipped shell builds a chain, and a real service
is added by listing it first in `voice.providers` with nothing else changing.
This container has 0 installed voices and answers `synthesis-failed` in 0 ms,
which the chain reports rather than hides.

**CLOSED — realtime end-to-end.** MariaDB was installed into the container,
so `verify:5d-realtime` now runs for real: the PHP socket server up, real
accounts, real relationship rows. **16 PASS, 0 FAIL.** A bearer token buying
a short-lived credential, that credential burnt by the socket that used it, a
socket hearing its own channels and its real friends and nothing else, a real
HTTP mutation reaching another client with nobody polling, a forged loopback
publish refused, and an anonymous connection dropped after the auth grace.

**COMPOSITION — one occluded affordance.** On the app-shell world,
`Сохранить` is drawn at 0.0% because an unrelated entity stands between the
viewer and it. Parity holds — an occluded slot draws nothing and is not
pickable — so this is a composition fact, not a picking one. Aiming the
camera at an entity's drawn rather than stored position was tried twice and
reverted both times: it fixes the aim and stands the camera inside the crowd,
taking 4 of 5 slots to 0% drawn.

**CLOSED — the 40–60% framing band.** It was recorded as a product decision
to be taken later; it was a measurement nobody had taken. See §1.7. Now
desktop 46.5%, phone 41.5%, tablet 50.0%, wide desktop 43.4%, every entity
wholly inside on every shape, and the gate's thresholds untouched.

**NO AUDIO MEDIA.** `BerxMediaType` includes `audio`, and the spatial media
surface pipeline carries images only. Until the mapping layer can say which
media is audio, `play()` has nothing real to play and is not called. The
listener is nevertheless correct, so the day a real URL arrives it is heard
from the right place.

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
npm run verify:5d-crossrender
npm run verify:5d            # the whole chain, in order

# backend
for f in $(find backend/scripts backend/opensource-socialnetwork-master/components/OssnApi -name '*.php'); do php -l "$f"; done
```

`verify:5d-app-shell` takes roughly half an hour on a software rasteriser:
every probe settles sixty real frames and the full 5D pipeline is being
rasterised on the CPU. That is the cost of measuring a real product boot
rather than a fixture.

## 5. Results, as measured in this pass

| Gate | Result |
|---|---|
| `typecheck` | PASS |
| `verify:static` | PASS |
| `verify:5d-shared-core` | ALL PASS |
| `verify:5d-geometry` | PASS — 4 meshes, winding and ring facing verified |
| `verify:5d-runtime` | PASS — runtime invariants and data→world mapping |
| `verify:5d-world` | PASS — X/Y/Z + T + R invariants |
| `verify:5d-picking` *(new)* | ALL PASS — 35/35 presses, ring up on all 35 |
| `verify:5d-composition` | ALL PASS |
| `verify:5d-dimensions` | ALL PASS |
| `verify:5d-wiring` | ALL PASS — tiers, Core, 4 ears gates, 12 live-world gates, 19 voice gates |
| `verify:5d-crossrender` | ALL PASS — 28 gates |
| `verify:5d-app-shell` | **76 PASS, 0 FAIL, 2 BLOCKED** on a real product boot (webgl2) |
| `verify:5d-xr` | ALL PASS with every device path BLOCKED — no headset, no ARKit, no ARCore, no OpenXR runtime |
| `build:spatial-web` | PASS — `berx-app.js` 532.7 kB, `berx-5d.runtime.js` 522.2 kB, `berx-5d.scenes.js` 21.0 kB |
| PHP syntax | PASS — 61 files, 0 errors |

The two BLOCKED in the app-shell run are the honest ones described in §3:
WebGPU cannot present to a canvas on lavapipe, and one affordance is
occluded by composition (parity holds — an occluded slot draws nothing and
is not pickable).

## 6. 5D is intact

Nothing in this pass weakened X, Y, Z, T or R. The picking repair made the
picker agree with what the renderer draws; it did not change where anything
stands.

- **X/Y/Z** — `verify:5d-world` PASS, `verify:5d-dimensions` PASS.
- **T** — the temporal cursor still offsets what is drawn without moving the
  canonical world; `verify:5d-world` covers it and passes.
- **R** — the relational layout still decides position, gravity and the
  relation geometry that reaches the draw list; `verify:5d-world` and
  `verify:5d-composition` both pass, and the live-world gates prove an entity
  arriving over the socket is placed by the same relational layout (post 7801
  landed at a real finite position, not at the origin).

## 7. Git

**Branch:** `berx-max-ultra-final`

| commit | what |
|---|---|
| `80aac39` | The ears are the camera, in a session that really has them |
| `8c146c5` | The box the ray crosses is the shape on the screen |
| `0256041` | The world stays live, is heard from the camera, and can be spoken to |
| `3e3db01` | One transposed character in the RFC 6455 GUID |

### Files changed

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
