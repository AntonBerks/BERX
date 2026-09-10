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
| Realtime transport | PASS | PHP socket server ← `BerxRealtimeClient` (auth → subscribe → event) | `berx-realtime-server.php`, `packages/api/src/realtime.ts` | `verify:5d-realtime` (real TCP, real accounts) | Needs MySQL; not runnable in this container |
| Realtime → world | PASS | event → `applyBerxRealtimeEvent` → real API read-back → `world.ingest` | `packages/scenes/src/realtimeWorld.ts` | `verify:5d-wiring` (12 gates, protocol-correct socket) | — |
| Realtime in the shipped shell | PASS | `startBerxApp({live})` → `berxKeepWorldLive` → socket → world | `appShell.ts`, `scripts/app-shell.entry.ts` | `verify:5d-app-shell` (real WebSocket, real handshake) | — |
| Reconnect behaviour | PASS | backoff resets only for a connection that outlived the longest rung | `packages/api/src/realtime.ts` | measured: 4 546 → bounded | — |
| Voice → world | PASS | `BerxWebVoice` → `berxVoiceToWorld` → real client method → world | `voiceWeb.ts`, `voiceToWorld.ts` | `verify:5d-wiring` (19 voice gates) | — |
| Voice in the shipped shell | PASS | `v`/`м` on the canvas → `shell.listen()` → Core `listening` | `appShell.ts`, `scripts/app-shell.entry.ts` | `verify:5d-app-shell` | — |
| Speech synthesis | PARTIAL | `speechSynthesis` real; this container has 0 voices and answers `synthesis-failed` in 0 ms | `voiceWeb.ts` | measured directly | PROVIDER BLOCKER for production-grade TTS: no installed voice here, and Chromium's recogniser posts audio to a Google service (reported by `requiresNetwork`) |
| Microphone consent | PASS | opened only by a real keypress; no covert capture anywhere | `appShell.ts`, `voiceToWorld.ts` | code path + `verify:5d-wiring` | — |
| WebGL2 renderer | PASS | one draw list → `threeRuntime.ts` | `threeRuntime.ts` | `verify:5d-gpu`, `verify:5d-app-shell` | — |
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

**PROVIDER — speech synthesis.** `speechSynthesis` exists and answers
`synthesis-failed` in 0 ms with 0 installed voices. The code handles that
correctly (it resolves on error rather than hanging, verified). A
production-quality multilingual voice needs a real TTS provider; the backend
abstraction for one does not exist yet and was not invented.

**PROVIDER — realtime end-to-end here.** `verify:5d-realtime` drives the real
PHP socket server with real accounts and needs MySQL, which this container
does not run. The transport is proven by that gate where it can run; the
join into the world and the shipped shell's use of it are proven here.

**COMPOSITION — one occluded affordance.** On the app-shell world,
`Сохранить` is drawn at 0.0% because an unrelated entity stands between the
viewer and it. Parity holds — an occluded slot draws nothing and is not
pickable — so this is a composition fact, not a picking one. Aiming the
camera at an entity's drawn rather than stored position was tried twice and
reverted both times: it fixes the aim and stands the camera inside the crowd,
taking 4 of 5 slots to 0% drawn.

**PRODUCT DECISION — the 40–60% framing band.** Desktop 22.4%, phone 10.9%,
tablet 14.8%. Closing it requires giving up one of three invariants that are
each independently proven (full containment, the 0.4 minimum separation,
radius monotonicity). Not closed by tuning constants.

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
