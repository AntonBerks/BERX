# BERX — Resource License Registry

Every external resource in BERX, what its licence permits, and whether
it ships or is reference-only. Nothing enters the product without an
entry here.

## GREEN — shipped in the product

| Resource | Source | Licence | Commercial | Modify | Attribution | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| Manrope | fonts.gstatic.com (Google Fonts) | SIL OFL 1.1 | Yes | Yes | Not required in-product | The interface typeface. 6 weights in `client/assets/fonts/` |
| Instrument Serif | fonts.gstatic.com (Google Fonts) | SIL OFL 1.1 | Yes | Yes | Not required in-product | Display type: entry sequence, every screen headline, profile names. Roman + italic |
| Lucide icons | lucide-static (npm) | ISC | Yes | Yes | Not required | All 82 glyphs in `packages/design-system/src/icons/geometry.ts` |
| react-native-svg | npm | MIT | Yes | Yes | Not required | The whole drawn visual layer: aura, planes, logo, scrims, actions |
| react-native-safe-area-context | npm | MIT | Yes | Yes | Not required | Real measured insets (`design-system/src/insets.ts`) |

SIL OFL 1.1 permits bundling and embedding in a commercial application.
Its only real constraints are that the fonts may not be sold on their
own and that a modified font may not keep the Reserved Font Name — BERX
does neither.

## ORIGINAL — authored for BERX, no third-party licence involved

| Asset | Where |
| --- | --- |
| BERX logotype | `BerxLogo.tsx` — drawn geometry on a 62x100 grid, not a typeset word |
| BERX symbol (monogram X) | `BerxLogo.tsx` — the logotype's own X as two crossing lit planes |
| BERX Planes (the 3D language) | `BerxPlanes.tsx` — glass slabs at measured depths |
| BERX Aura (the lit ground) | `BerxAura.tsx` |
| Ember palette | `tokens/index.ts`, `palette.ts` |

## NOT ACQUIRED — and why, stated rather than implied

Every stock-photography and design-file host reachable from this
environment is blocked by the network policy. Tested, not assumed:

| Host | Result |
| --- | --- |
| images.unsplash.com | blocked |
| api.unsplash.com | blocked |
| www.figma.com | blocked |
| cdn.jsdelivr.net | blocked |
| github.com (HTML) | 403 |

Reachable and used: `registry.npmjs.org`, `fonts.googleapis.com`,
`fonts.gstatic.com`, `raw.githubusercontent.com`.

Consequence, and it is a real one: **BERX bundles no stock photography
and claims none.** Screens that run before an account exists have no
user media either — every API resource except `auth` is behind a bearer
token (`components/OssnApi/ossn_com.php`) — so their ground is original
drawn artwork rather than an unlicensed image or a grey placeholder
box. Where the product does have real media (place covers, avatars,
feed photos, profile heroes), that media leads the composition.

The photographic plates visible in development screenshots are served
only by the local test harness (`client/harness/img/`, gitignored) and
are reference crops. They are not bundled, not referenced by any
shipped code path, and are not part of the product.
