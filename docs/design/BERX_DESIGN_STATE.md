# BERX — Design State

Working state. Update in place; do not append history.

## DONE

- **Resource channel established.** Reachability verified by direct test
  (see RESOURCE_LICENSE_REGISTRY.md): npm and raw.githubusercontent are
  open; Unsplash, Pexels, Figma and jsDelivr are proxy-blocked.
- **Icon system.** Lucide (ISC) acquired via npm, 82 glyphs curated to
  what BERX actually uses, normalised to one geometry (24×24, stroke 2,
  round caps — zero deviations across all 82), generated into
  `geometry.ts`, rendered by `BerxIcon.tsx`. `react-native-svg` (MIT)
  installed; BERX previously had no SVG renderer at all.
- **Glass system.** Four levels plus hero, theme-resolved
  (`BerxGlassSurface`, `useBerxGlass`).
- **Scrim system.** One primitive (`BerxScrim`, 18-step eased ramp)
  replacing six hand-rolled copies that visibly banded on real photos.
- **Depth/3D.** `BerxDepthCard` — real perspective/rotateX/scale driven
  by measured scroll position, plus press-depth springs shared through
  `BerxMediaCard`.
- **Theme.** Night/Day/Auto, live at runtime, verified by DOM identity.
- **NOW** rebuilt as a full-device photographic stage with floating
  chrome.
- **PROFILE, PLACES, EVENTS, MOMENTS, CREATE, MESSAGING, COMMUNITIES,
  map** reconstructed toward the reference composition.

## CURRENT

Icon family is built but not yet adopted screen-by-screen: BERX still
renders many controls as text glyphs (`◎`, `♡`, `➤`). Replacing those
with `BerxIcon` is the next visible step and is what §11 actually asks
for.

## NEXT

1. Adopt `BerxIcon` across nav, action rail, utilities, states.
2. Original BERX 3D object language (checkpoints, badges, rewards) —
   procedural, since no licensed 3D pack is reachable.
3. Onboarding/auth as a cinematic world entry (§15).
4. Remaining screen areas per the execution order.

## BLOCKED

- **Stock photography.** Image hosts are proxy-blocked. Not solvable
  from inside this environment; needs either a proxy allow-list change
  or photographs supplied directly.
- **Figma Community duplication.** figma.com unreachable.
- **Native/device runtime.** No android/ios project, no SDK, no
  emulator. All visual QA is a browser harness (react-native-web +
  Playwright) — it verifies the JS/UI layer, not native modules.
- **PHP server.** No MySQL here; the API is exercised through a local
  harness serving the real endpoints' response shapes.

## DECISIONS

- **One icon family.** Tabler and Phosphor are MIT and were verified,
  but shipping more than one family would defeat the system.
- **No bundled stock photos** rather than shipping images of unverified
  provenance.
- **Original 3D** rather than claiming a licensed 3D pack that could not
  be reached or licence-checked.
- **Palette** stays BERX: `#07080A` / `#4FD6E8` / `#F6F4EF` / `#0B7F91`.
  Colour in the UI comes from photography, which is where the references
  get theirs.
