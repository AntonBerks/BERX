# BERX FULL MAX 5D — MASTER EXECUTION PROMPT

## COMPLETE AUDIT → REPAIR → IMPLEMENTATION → VERIFICATION → LAUNCH

Работай с существующим репозиторием BERX как с единственным production source.

Главная задача: полностью проаудировать все сегодняшние изменения, исправить ошибки, довести существующий BERX runtime до Full MAX 5D на всех заявленных платформах и не объявлять ничего готовым без фактического evidence.

---

## 0. НЕПРЕЛОЖНЫЕ ПРАВИЛА

1. НЕ создавать второй spatial core.
2. НЕ создавать второй `Berx5DWorldApp`.
3. НЕ создавать второй `WorldGraph`.
4. НЕ создавать второй `SpatialIdentity` как parallel authoritative system.
5. НЕ создавать второй `TemporalSystem`.
6. НЕ создавать второй `RelationalGraph`.
7. НЕ создавать synthetic world как production source.
8. НЕ использовать random/demo entities как authoritative world.
9. НЕ использовать DOM/2D screen state как authoritative world.
10. НЕ объявлять capability `true` из конфигурации.
11. НЕ объявлять capability `true` только потому, что файл/class/pipeline существует.
12. НЕ считать shader compilation доказательством runtime capability.
13. НЕ считать `render()` без exception доказательством GPU результата.
14. НЕ считать `device.lost` Promise доказательством recovery.
15. НЕ считать `pickedId !== null` доказательством корректного picking.
16. НЕ считать generic draw/readback proof заменой feature-specific verification.
17. Если физическая проверка невозможна — статус BLOCKED_PHYSICAL_VERIFICATION, а не PASS.
18. Full MAX 5D остается CLOSED при любом непроверенном обязательном gate.

---

# 1. СНАЧАЛА ПОЛНЫЙ АУДИТ ВСЕГО, ЧТО СДЕЛАНО СЕГОДНЯ

Не доверяй описаниям коммитов. Сверяй фактический код и diff.

Проверить:

- `git log --oneline --decorate -100`
- активные ветки
- diff canonical branch
- все сегодняшние commits, включая:
  - `9df7a5f`
  - `5806b5e`
  - `fc8ae3b`
  - `aab45e4`
  - `8f35e19`
  - `57131f4`
  - `983cdc4`
  - `194d540`
  - `b2584ed`
  - `a0f0939`
  - `d13d0fe`
  - `ebe92c4`
  - `76b6d9d`
  - `f432a2c`
  - `2b0dab4`
  - `944e2c3`
  - `0ba679c`
  - `20fa2ef`
  - `40f4403`
  - все последующие commits

Для каждого существующего commit: inspect diff, выявить regression/placeholder/false-positive verification.

---

# 2. ПОЛНЫЙ АУДИТ РЕПОЗИТОРИЯ

Обойти минимум:

`client/packages/spatial/`

и все:

- renderer
- verification
- launch
- design
- visual
- platform
- input
- media
- audio
- xr
- backend
- ios
- android
- desktop
- watch
- tests
- CI/CD

Искать:

`TODO`
`FIXME`
`HACK`
`stub`
`placeholder`
`mock`
`demo`
`synthetic`
`Math.random`
`return true`
`verified = true`
`supported = true`
`gpuExecuted = true`
`readbackVerified = true`
`deviceLossRecovery = true`
`window.*`
`document.querySelector`
`canvas.getContext('2d')`

Проверять каждый найденный случай по контексту.

---

# 3. CANONICAL SHARED CORE

Единственный authoritative world:

`Berx5DWorldApp`
→ `Berx5DRuntime`
→ `Berx5DFrame`
→ `WorldGraph / SpatialIdentity / TemporalSystem / RelationalGraph`

Проверить реальные сигнатуры и реальные вызовы:

- constructor
- `init()`
- `ingest()`
- `latestFrame`
- `travelTo()`
- `travelToLive()`
- `enterRegion()`
- `back()`
- `dispatch()`
- `focus()`
- `blur()`
- `setCursor()`
- `scrubTime()`

Shared-core verification обязана выполнять реальные операции через существующие production classes.

Запрещено строить локальные synthetic `entities`, `relations`, `temporal` objects как доказательство production core.

---

# 4. BERX5DFRAME

Проверить реальный frame из runtime:

- `world`
- `camera`
- `transition`
- `reducedMotion`
- `deviceMotionEnabled`

Проверить, что это реальный output `Berx5DRuntime`, а не interface-existence test.

---

# 5. RENDERER CONTRACT

Единый renderer contract должен поддерживать:

- `initialize()`
- `resize()`
- `render(frame)`
- `pick(frame,x,y)`
- `readPixel(x,y)`
- `dispose()`
- `isDeviceLost`
- `onDeviceLost()`
- `onDeviceRestored()`

Capabilities должны быть externally immutable.

Capabilities должны быть результатом фактического verification evidence.

---

# 6. WEBGPU PRODUCTION

Production path:

`Berx5DWorldApp`
→ `Berx5DFrame`
→ `BerxSpatialRenderer`
→ `WebGPU backend`

НЕ создавать отдельный `GPUDevice` / отдельный fake renderer в качестве доказательства production path.

Обязательные production capabilities:

1. PBR/GGX
2. IBL
3. SSAO
4. HDR
5. MSAA
6. Shadows
7. Bloom/post
8. Frustum culling
9. Occlusion culling where supported
10. LOD
11. Instancing
12. GPU resource streaming
13. Picking
14. World-space text
15. Device-loss recovery

### PBR

Реально исполняются:

- Cook-Torrance
- GGX NDF
- Smith geometry
- Schlick Fresnel
- metallic/roughness
- normals
- material base color
- direct lighting

Нельзя использовать один flat brand-color shader и называть его production PBR.

### IBL

Нужны:

- environment cubemap
- irradiance
- prefiltered environment
- BRDF integration
- actual sampling

### SSAO

Нужен реальный occlusion algorithm.

Запрещена псевдопроверка вида `ao = 1.0 - depth` как production SSAO.

### Shadows

Нужны:

- real shadow pass
- light-space transform
- depth map
- comparison/sampling
- influence on final shaded result

### HDR

`rgba16float`
→ render HDR values > 1
→ tone mapping
→ final image

### MSAA

`sampleCount=4`
→ multisample render target
→ resolve
→ readback

Нужно доказать edge behavior, а не только наличие target.

### Bloom

`HDR scene`
→ threshold
→ blur
→ combine

### Culling

Проверить real production object list до и после culling.

### LOD

Проверить selection по distance/projected size.

### Instancing

Проверить instance buffer и actual instance draw.

### Streaming

`asset load/decode`
→ `GPU upload`
→ `binding`
→ `render use`

### Picking

`known object`
→ actual ID pass
→ exact pixel readback
→ exact object ID

---

# 7. WEBGPU READBACK

Для WebGPU нельзя доказывать WebGPU framebuffer через:

`canvas.getContext('2d')`

Readback должен идти через правильный WebGPU copy/readback path.

Сценарий:

`render`
→ `queue.submit`
→ wait/map
→ readback
→ expected result

---

# 8. DEVICE LOSS

`device.lost` — только сигнал.

Реальное recovery:

`lost`
→ mark lost
→ invalidate/release invalid resources
→ request new adapter/device
→ recreate pipelines
→ recreate textures
→ recreate buffers
→ recreate bind groups
→ reconnect runtime
→ render resumes

Если нельзя честно индуцировать loss в текущей среде, оставить blocker.

---

# 9. WEBGL2 FALLBACK

WebGL2 должен реально продолжать отображать тот же `Berx5DFrame`.

Проверить:

- initialization
- depth
- rendering
- picking
- lifecycle
- context restoration
- fallback from unavailable WebGPU

Не объявлять capabilities, которых реально нет.

---

# 10. DESKTOP

Выбрать canonical desktop architecture, не создавать parallel runtime.

Проверить:

- native shell
- real GPU backend
- keyboard
- pointer
- gamepad
- fullscreen/windowing
- lifecycle
- packaging

Нужны реальные artifacts для заявленных OS.

---

# 11. iOS / METAL

Создать/исправить настоящий Xcode target.

Нужно:

- Xcode project
- `MTKView`
- `MTLDevice`
- command queue
- render pipeline
- depth
- MSAA
- HDR
- PBR
- shadows
- post
- resource lifecycle
- gesture/input
- ARKit
- spatial audio

Bridge должен использовать тот же shared spatial core.

ЗАПРЕЩЕНО создавать synthetic JS `worldApp`.

ARKit:

- pose
- camera
- depth
- planes
- raycast
- anchors
- scene reconstruction where supported

---

# 12. ANDROID / VULKAN

Нужен настоящий Android Studio project:

- Gradle
- Manifest
- NDK
- Vulkan
- JNI

Проверить:

- instance
- physical device
- logical device
- queue
- swapchain
- synchronization
- command buffers
- descriptors
- render passes/dynamic rendering
- pipelines
- depth
- MSAA
- HDR
- PBR
- shadows
- post
- culling
- LOD
- instancing

ARCore:

- session
- pose
- camera
- planes
- depth
- raycast
- anchors

---

# 13. TABLET

Отдельный target.

Проверить:

- GPU renderer
- responsive spatial framing
- touch
- lifecycle
- performance
- large-screen layout

Не считать tablet автоматически закрытым phone build.

---

# 14. WATCHOS

Настоящий watchOS target.

Проверить:

- Metal
- Digital Crown
- touch
- lifecycle
- WatchConnectivity

НЕ создавать `WatchSpatialCore`.

Watch использует общий world/frame model.

---

# 15. AR

### ARKit

Физически проверить:

- camera
- pose
- depth
- planes
- anchors
- raycasts
- spatial placement

### ARCore

Физически проверить аналогично.

---

# 16. OPENXR / VR

Нужен реальный runtime:

- OpenXR instance
- system
- session
- spaces
- stereo views
- swapchains
- frame loop
- head pose
- controller actions
- ray interaction
- anchors

Stereo не равен `stereo=true`; оба глаза должны реально отрисовываться.

---

# 17. SPATIAL AUDIO

Реальный positional audio:

- listener
- source
- position
- orientation
- attenuation
- spatialization

Проверить на каждом supported platform backend.

---

# 18. MEDIA PIPELINE

Полный lifecycle:

`asset`
→ decode/load
→ CPU representation
→ GPU upload
→ texture/video surface
→ render
→ disposal
→ recovery

Проверить images/video/streaming.

---

# 19. CANONICAL BACKEND / OSSN

Определи, какой backend является canonical source of truth.

Если OSSN остаётся authoritative backend:

`client`
→ `BERX API`
→ `OSSN`
→ `database`

НЕ создавать отдельный competing backend, который заменяет OSSN.

Проверить:

### Auth

- registration
- login success
- wrong password rejection
- token expiry
- refresh

### Authorization

- no token → 401
- invalid token → 401
- ownership violation → 403
- cross-user read blocked
- cross-user write blocked

### Privacy

Проверить private world/entity.

### Persistence

`write → restart → reload → exact state`

### Relations

`create → persist → reload → relation intact`

### Realtime

Два authenticated clients:

`A mutation → transport → B receives exact update`

### Conflicts

Version/revision/ordering must be server-authoritative.

Arbitrary state overwrite запрещён.

---

# 20. REGISTRATION → WORLD

Полный E2E:

`register`
→ profile
→ authenticated session
→ world creation
→ real backend persistence
→ real spatial ingest
→ `Berx5DFrame`
→ world entry

Экранная форма сама по себе не является завершением регистрации.

---

# 21. DESIGN INTEGRATION

Сохранить BERX visual DNA:

- primary background `#07080A`
- primary accent `#4FD6E8`
- Premium Glass
- spatial depth
- cinematic motion
- world-space typography
- temporal visual states
- haptics
- spatial audio
- accessibility
- reduced-motion

НЕ использовать synthetic visual world как authoritative state.

Design layer работает поверх реального frame/runtime.

---

# 22. PERFORMANCE

Добавить production telemetry и tests:

- frame time
- GPU time where available
- CPU time
- memory
- texture memory
- resource count
- draw calls
- instance count
- culling ratio
- LOD ratio
- startup time
- frame stability

Нужны реальные thresholds per platform.

---

# 23. SECURITY

Проверить:

- secret management
- no default JWT secrets
- no plaintext credentials in repository
- authorization server-side
- input validation
- malformed payload handling
- rate limits where needed
- WebSocket auth
- ownership checks
- privacy boundary

---

# 24. CI/CD

Сделать per-platform matrix где технически возможно:

- web
- desktop
- ios
- android
- watch
- xr

CI stages:

1. typecheck
2. lint
3. unit tests
4. integration
5. shared-core verification
6. renderer verification
7. backend verification
8. security verification
9. design verification
10. packaging
11. launch gate

Physical devices:

- self-hosted
- device farm
- physical runner

если инфраструктуры нет → `BLOCKED_PHYSICAL_VERIFICATION`.

---

# 25. LAUNCH GATE

Один immutable/fail-closed launch gate.

Каждый requirement требует typed evidence:

- source
- supported
- verified
- evidence
- verifiedAt

Не позволять внешнему caller просто передать:

`{verified:true,evidence:"..."}`

без cryptographically/structurally bound verification result where practical.

Required launch items:

1. Shared Core
2. WebGPU
3. WebGL2
4. Desktop
5. iOS / Metal
6. Android / Vulkan
7. Tablet
8. watchOS
9. ARKit
10. ARCore
11. OpenXR
12. Spatial Audio
13. Media Pipeline
14. Authentication
15. Registration
16. Server Authorization
17. Persistence
18. Realtime Sync
19. Packaging
20. Real-device Verification
21. Design Integration

Additionally verify:

- temporal integrity
- relational integrity
- deterministic layout
- world navigation
- pose persistence
- input integration
- accessibility
- security
- privacy
- performance
- crash recovery
- device recovery

Any missing/unverified evidence = CLOSED.

---

# 26. VERIFICATION MATH

Каждый feature:

`SOURCE`
→ `EXECUTION`
→ `OUTPUT`
→ `READBACK/OBSERVATION`
→ `EXPECTED RESULT`
→ `EVIDENCE`

Examples:

### PBR
real `Berx5DFrame`
→ actual production renderer
→ GPU draw
→ readback
→ expected shading/material response
→ evidence

### Picking
known spatial object
→ actual picking pass
→ pixel ID
→ exact entity ID
→ evidence

### Persistence
real mutation
→ canonical backend
→ restart
→ reload
→ exact state
→ evidence

### Realtime
client A
→ server
→ WebSocket
→ client B
→ exact state
→ evidence

---

# 27. ORDER OF EXECUTION

PHASE 1 — Audit all current code and today's commits.

PHASE 2 — Remove/repair false-positive verification.

PHASE 3 — Canonicalize shared core and renderer integration.

PHASE 4 — WebGPU production backend.

PHASE 5 — WebGL2 fallback.

PHASE 6 — Desktop.

PHASE 7 — iOS / Metal / ARKit.

PHASE 8 — Android / Vulkan / ARCore.

PHASE 9 — Tablet.

PHASE 10 — watchOS.

PHASE 11 — OpenXR / VR.

PHASE 12 — Spatial Audio.

PHASE 13 — Media.

PHASE 14 — Canonical OSSN auth/privacy/ownership/persistence/realtime.

PHASE 15 — Registration end-to-end.

PHASE 16 — Design integration.

PHASE 17 — CI/CD.

PHASE 18 — Physical device verification.

PHASE 19 — Final launch gate.

---

# 28. ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ

Обязательно:

- format
- typecheck
- unit tests
- integration tests
- relevant verification
- build
- inspect diff

Если ошибка найдена — исправить и продолжить.

Не останавливайся на scaffold.

---

# 29. PHYSICAL BLOCKERS

Если не хватает физической среды:

Не прекращай software work.

Доведи максимум до состояния:

`READY_FOR_PHYSICAL_VERIFICATION`

Затем явно запиши:

`BLOCKED_PHYSICAL_VERIFICATION`

с указанием:

- device
- OS
- SDK
- expected command
- expected evidence

---

# 30. FINAL REPORT

В конце сформировать точный отчёт:

## IMPLEMENTED
реально реализовано.

## VERIFIED
доказано runtime evidence.

## PARTIALLY VERIFIED
работает частично, полного evidence нет.

## BLOCKED
невозможно завершить без внешней физической среды.

## REMAINING
что осталось до launch.

Для каждого blocker:

- subsystem
- file
- reason
- dependency
- exact verification command

НЕ писать `FULL MAX 5D READY`, если хотя бы один required gate не доказан.

---

# 31. ФИНАЛЬНЫЙ КРИТЕРИЙ

BERX FULL MAX 5D = OPEN ТОЛЬКО ЕСЛИ:

ONE WORLD
+
ONE CORE
+
REAL GPU
+
REAL INPUT
+
REAL POSE
+
REAL AUDIO
+
REAL MEDIA
+
REAL API
+
REAL AUTHORIZATION
+
REAL PERSISTENCE
+
REAL REALTIME
+
REAL NATIVE RUNTIMES
+
REAL PACKAGING
+
REAL DEVICE VERIFICATION
+
ALL REQUIRED GATES PASS

Иначе:

`FULL MAX 5D = CLOSED`

Работай непрерывно в пределах доступной среды и не создавай параллельную архитектуру.
