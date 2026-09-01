# BERX — Asset Manifest

What is actually in the repository, and what is not.

## Shipped

| Path | Contents | Licence | Notes |
|---|---|---|---|
| `design-resources/icons/lucide/` | 82 curated SVG glyphs | ISC | Source of truth for the icon family |
| `design-resources/icons/LICENSE-lucide.txt` | Vendored licence text | ISC | Retained though ISC does not require it |
| `design-resources/icons/berx-icon-geometry.json` | Normalised geometry | ISC (derived) | Build input |
| `client/packages/design-system/src/icons/geometry.ts` | Generated geometry module | ISC (derived) | Data only |
| `client/packages/design-system/src/icons/BerxIcon.tsx` | Renderer | BERX original | Parses geometry into react-native-svg nodes |

## Deliberately empty

The `design-resources/` tree contains the full category structure, but
most directories are empty. That is an accurate state, not an oversight:

- **`/photos`** — empty. Unsplash and Pexels are unreachable from this
  environment (proxy-blocked, verified). No stock photograph is bundled,
  and none is claimed. BERX's photography is user content from the real
  API; the product does not need bundled stock to function.
- **`/3d`, `/3d-icons`, `/3d-illustrations`, `/3d-objects`** — empty. No
  3D library was both reachable and licence-verifiable. BERX 3D is
  original and procedural (real perspective/rotate/scale transforms
  driven by real scroll and touch), so there is no downloaded model to
  manifest.
- **The remaining category folders** — structure for assets acquired
  later, kept so the taxonomy exists before it is filled.

## Local QA imagery — NOT shipped

`client/harness/img/` holds photographic crops taken from the reference
sheets, used only to judge composition, scrim, contrast and cropping
during visual QA. It is gitignored. These are third-party images: they
are never bundled, never shipped, and never presented as BERX content.
