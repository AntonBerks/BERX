# BERX Design State

## Identity — BERX Ember

The black-and-cyan system is retired. It read as a starter template and
no amount of composition work was going to fix the palette underneath.

| Role | Night | Day |
| --- | --- | --- |
| Ground | `#0B0910` — near-black with violet and red in it | `#FBF6F1` warm paper |
| Brand (Ember) | `#FF6A45` | `#D8442A` |
| Aurora (live / positive) | `#5FE3BE` | `#0E8F76` |
| Ink | `#F8F3EF` | `#1A1216` |
| On accent | `#26100A` | `#FFF3EE` |

Ember is warm on purpose. Every product in this category is blue, cyan,
purple or pink; a warm accent on a warm-dark ground reads as light
falling on a room rather than as a UI colour applied to a surface.
White on ember reaches only ~2.9:1, so `onAccent` is a deep ember-black
at ~6.3:1 — which also looks better.

Every screen reads `colors.accent`, never a hex, so the identity is one
file.

## Type

Manrope for the interface, Instrument Serif for display. Installed as
the default family by patching `Text`/`TextInput` render once
(`design-system/src/typeface.ts`) — RN `Text` does not inherit a family,
so the alternative was naming it in every style in the app.

## The system

| Piece | What it is |
| --- | --- |
| `BerxAura` | The lit ground: two very soft pools over warm near-black |
| `BerxPlanes` | The 3D language: glass slabs at measured depths, each catching the light on one edge |
| `BerxEntryStage` | Aura + planes + grain, shared by the entire entry sequence; `progress` moves the camera through it, `presence` pulls the 3D back on content-heavy screens |
| `BerxLogo` | Drawn logotype + monogram symbol |
| `BerxActions` | The lit primary control and the quiet secondary |
| `BerxGlassPanel` | Real glass: gradient edge, inner highlight, tinted body, shadow |
| `BerxScrim` | Stacked-step gradient; `ease < 1` where it has to carry text over user media |
| `BerxGrain` | Atmosphere; degrades to nothing where SVG filters are unsupported |
| `insets.ts` | Real measured safe area — BERX had none before |

## Done

- Ember palette across the whole product (one token file).
- Manrope + Instrument Serif downloaded, registered, installed.
- Logotype and symbol drawn.
- Entry sequence on one shared stage: splash, welcome, discover, login,
  register, and all seven onboarding steps.
- Onboarding steps backed by real endpoints, including a new real
  interests store (`ossn_user_interests`, `/me/interests`,
  `/places?for_you=1`).
- Navigation: real icon set, filled create orb.
- Serif headlines on every screen with an editorial title.
- CREATE rebuilt off Unicode dingbats onto the real icon set.
- Profile hero made legible over real photography.
- Safe-area insets applied product-wide.

## Next

- Places detail, map and the checkpoint objects on the plane language.
- Business and analytics surfaces.
- Wallet, tickets, rewards as plane-language objects.
- Day environment visual QA (Night is what has been inspected).

## Known limits, stated rather than hidden

- No device or emulator exists in this environment. Everything is
  verified in a browser harness (react-native-web + esbuild +
  Playwright) against a mock server returning the real endpoint shapes.
  It verifies the JS/UI layer only.
- No stock photography is bundled or claimed — see
  `RESOURCE_LICENSE_REGISTRY.md` for the tested host results.
- Font weight resolution on Android depends on native linking
  (`react-native.config.js`); documented in `typeface.ts`.
