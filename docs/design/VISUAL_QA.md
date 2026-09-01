# BERX Visual QA — Onboarding benchmark pass

Method: the client is bundled for the browser (react-native-web +
esbuild) against a mock server that returns the SHAPES the real PHP
endpoints return, and driven with Playwright at 390×844 @2x. This
verifies the JS/UI layer only — it proves nothing about the PHP server,
and native modules (keychain, pickers, three/expo-gl) are stubbed. No
device or emulator is available in this environment; that limit is
stated, not worked around.

## The priority order this pass was built to

1 composition · 2 photography/media · 3 lighting · 4 depth · 5 glass ·
6 typography · 7 3D · 8 controls.

3D is one material inside the design, not the design. Nothing in the
sequence leads with the emblem where a photograph or a composition
should lead.

## What was rejected during this pass, and why

| Attempt | Result | Why it failed |
| --- | --- | --- |
| Flat ground + low-opacity "glow" circles | Screen read as black with a cyan wordmark | There were no gradients in the system at all until `react-native-svg` landed — a 20%-opacity circle is not a light source |
| First `BerxLightField`: 4 stops, 45% of peak at 45% of radius, four large sources | Screen read as an even teal fog | Light everywhere is the same as light nowhere; it got brighter without getting less flat |
| Rolling hills in front of the skyline | Read as smooth domes / bubbles | Many narrow quadratic peaks at phone scale are circles, not land — and they buried the one shape that says what BERX is about |
| `preserveAspectRatio="xMidYMax slice"` on the horizon | Skyline invisible, cropped to the middle half | "slice" scaled to cover the container and pushed the roofline off-screen |
| Grey procedural placeholders standing in for photographs | Rejected as the final visual result | A placeholder shipped as the design is an unfinished screen presented as finished |

## What the stage is now

`BerxStage` — one environment, shared by splash, welcome, discover,
login, register and all seven onboarding steps:

- **Lighting** (`BerxLightField`) — one dominant key low in the frame
  with `(1-t)^k` falloff over 14 stops, one faint upper-atmosphere
  fill, and a vignette that pulls the corners back to the ground
  colour. The vignette is what keeps a lit scene lit: there has to be
  dark for the light to be light against.
- **Media** (`BerxHorizon`) — three receding city bands with real lit
  windows placed inside real block geometry, plus one nearly-dissolved
  land ridge behind them. Original vector artwork drawn at runtime.
- **Air** (`BerxGrain`) — `feTurbulence` luminance noise at ~6%. The
  rect it filters has no fill of its own, so a renderer that ignores
  filters paints nothing rather than dropping a plate over the screen.
- **Depth** — `depth` (0..1) raises the camera and lifts the key with
  it, so step 7 is recognisably the same city as step 1 seen from
  further up. One continuous move, not seven backdrops.
- **3D** (`BerxEmblem` / `BerxEmblemReveal`) — original, procedural,
  quiet. It carries the light; it never competes with media.

### On photography

There is no stock photography anywhere in the entry sequence, and none
is claimed. Every stock host reachable from this environment is
proxy-blocked (`images.unsplash.com`, `api.unsplash.com`,
`www.figma.com`, `cdn.jsdelivr.net` — all 403/000, tested, not assumed),
and every BERX API resource except `auth` is behind a bearer token
(`components/OssnApi/ossn_com.php`), so the pre-account screens have no
user media either. The ground is therefore original artwork rather than
an unlicensed image or a grey box. Real photography leads the moment
there is real content to show: the Places onboarding step is a rail of
real place covers, not a list of 54pt thumbnails.

## Screens verified in this pass

| Screen | Result | Notes |
| --- | --- | --- |
| Splash / logo reveal | PASS | Emblem assembles plane by plane, settles out of a lean, hands over. Not a fake progress bar |
| Welcome | PASS | Editorial display type bottom-left, object in the sky, city backlit |
| Discover 1–3 | PASS | One camera move across three pages; every claim is a capability that exists in this codebase |
| Login | PASS | Same stage; glass form over the lit city |
| Register | PASS | Same stage |
| Onboarding 1 Откуда | PASS | Real place search; real `/places/nearby` from the chosen place's real coordinates |
| Onboarding 2 Интересы | PASS | Real `GET`/`POST /me/interests`; vocabulary travels with the answer |
| Onboarding 3 Люди | PASS | Real `/discovery/people`, real friend request. BERX friendship, not followers |
| Onboarding 4 Места | PASS | Real places as a photographic rail, real save |
| Onboarding 5 Сообщества | PASS | Real trending communities with a real plain-list fallback, real join |
| Onboarding 6 Профиль | PASS | Real avatar upload; identity confirmed, never re-asked |
| Onboarding 7 Готово | PASS | — |

Route regression after the pass (NOW, PEOPLE, CREATE, PLACES, EVENTS,
PROFILE, MOMENTS, COMMUNITIES, MESSAGING, return-to-NOW, scroll): all
clean, 0 console errors, 60fps scroll, no horizontal overflow.

## Defects found and fixed during this pass

- **Pager items collapsed to zero height.** `flex: 1` on a horizontal
  `FlatList` item sizes to content; every absolutely-positioned child
  (the entire Discover copy block) was laid out against a zero-height
  box and pushed off the top of the screen. Fixed with an explicit
  device-height page.
- **Category slugs rendered raw.** `BerxPlace.category` is a slug
  (`cafe`), and it was being printed verbatim on place cards in
  `PlacesListScreen` and as interest pills on `ProfileScreen`. Labels
  now resolve from the real server whitelist — in `identity.php` for
  the profile pills (one place, no extra request, no client-side copy
  of the taxonomy that could drift).
- **Onboarding crashed on an unexpected response shape.** Reading
  `.length` off an absent array took the whole screen down. Every list
  step now degrades to its honest empty branch instead — this matters
  because `/me/interests` is a NEW endpoint and a client can ship ahead
  of the server upgrade.

## Known limits, stated rather than hidden

- No device or emulator run. Browser harness only.
- No device geolocation: there is no geolocation native module in the
  dependency tree, so the Location step asks for a real place by name
  instead of showing a permission button that cannot do what it says.
- The Location step persists nothing. BERX has no "home location"
  field, and adding one purely to make the step feel weightier would be
  inventing data.
