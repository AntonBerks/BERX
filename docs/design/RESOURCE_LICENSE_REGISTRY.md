# BERX — Resource License Registry

Every external resource considered for BERX, with the licence verified
by reading the actual licence text — never inferred from "free
download". Only GREEN resources may ship.

## Environment constraint (verified, not assumed)

This build environment reaches the network through an egress proxy with
an allow-list. Reachability was tested directly:

| Host | Result |
|---|---|
| `registry.npmjs.org` | reachable |
| `raw.githubusercontent.com` | reachable |
| `api.github.com` | reachable but repo-scoped to this session |
| `images.unsplash.com`, `api.unsplash.com` | **blocked** (proxy 403) |
| `www.figma.com` | **blocked** |
| `cdn.jsdelivr.net` | **blocked** |

Consequences, stated plainly rather than worked around:
- Icon and code assets are acquirable (npm + raw.githubusercontent).
- **Stock photography is not acquirable here.** No Unsplash/Pexels asset
  is bundled, and none is claimed to be. See ASSET_MANIFEST.md.
- Figma Community files cannot be duplicated from this environment.

---

## GREEN — commercially usable, shipped

### Lucide
- **RESOURCE**: Lucide icon family (82 curated glyphs)
- **SOURCE**: npm `lucide-static@1.39.0`
- **URL**: https://github.com/lucide-icons/lucide
- **TYPE**: SVG icon set
- **LICENSE**: ISC — text vendored at `design-resources/icons/LICENSE-lucide.txt`
- **COMMERCIAL USE**: yes
- **ATTRIBUTION**: not required by ISC; licence text retained anyway
- **DOWNLOAD**: yes
- **PRODUCTION USE**: yes — the BERX primary icon family
- **REFERENCE ONLY**: no
- **REASON**: single coherent geometry (24×24, stroke 2, round caps);
  all 82 curated glyphs verified deviation-free before normalisation.

### react-native-svg
- **RESOURCE**: SVG renderer
- **SOURCE**: npm `react-native-svg@15.15.5`
- **LICENSE**: MIT
- **COMMERCIAL USE**: yes
- **PRODUCTION USE**: yes — required to render the icon family at all
- **REASON**: BERX previously had no SVG renderer, which is why icons
  were glyph characters.

---

## GREEN — verified, deliberately NOT used

| Resource | Licence | Why not used |
|---|---|---|
| Tabler Icons (`@tabler/icons`) | MIT | A second icon family would break the one-system rule (§11). |
| Phosphor Icons (`@phosphor-icons/core`) | MIT | Same. |
| Feather Icons | MIT | Superseded by Lucide, which is its maintained successor. |
| free-gophers-pack | CC0 | Cartoon mascot illustration; contradicts BERX's premium/photographic direction. |

Recorded so the decision is visible, not repeated.

---

## YELLOW — licence unclear, reference only

| Resource | Status |
|---|---|
| `realvjy/3dicons` | Repository not resolvable from this environment (404 on the raw paths tried); licence text could not be read, so it is **not** downloaded or shipped. |

## RED — must never ship

| Resource | Reason |
|---|---|
| The reference sheets supplied for this project | Third-party product screenshots. Used **only** as visual blueprint and, cropped, as local QA imagery in the gitignored harness. Never bundled, never shipped, never presented as BERX content. |
| Any Google-image-sourced photography | Provenance and licence unknown. |
| Celebrity photography | Personality rights. |

---

## 3D assets

No third-party 3D asset library was reachable and licence-verifiable
from this environment. Per the substitution rule, BERX 3D is therefore
**original**, built from real transforms rather than downloaded models —
see `BERX_DESIGN_STATE.md`. Nothing is claimed to be a licensed
third-party 3D pack.
