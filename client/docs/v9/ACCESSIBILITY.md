# BERX V9 — Accessibility report

The archive's contract, per screen: WCAG 2.2 AA target, 44dp preferred
touch target, visible focus, reduced motion, and an opaque-surface
contrast fallback.

## Implemented

| Requirement | How |
|---|---|
| Reduced motion | `BerxReducedMotionGate` reads the real OS setting (`AccessibilityInfo.isReduceMotionEnabled` + change listener). `BerxSpatialScene` then stops publishing a parallax signal at all, so a layer added later cannot forget to honour it. Motion tiers collapse via `reduce()`/`reduceStagger`, keeping sequence and dropping travel. |
| Contrast | Not a style choice here but measured: `contrastRatio()` is real WCAG math, and `ensureContrast()` walks an accent toward the ground's opposite pole until it passes AA. This is what produces the Day accent rather than a hand-picked hex. |
| Ink over media | `useBerxInk(overMedia)` puts the rule in one place: content on photography uses the on-media family (identical in both environments, because media is dark-scrimmed either way). |
| Touch targets | `BerxIconButton` sizes are 34 / 44 / 54; the default is 44. |
| Roles and names | The V9 components set `accessibilityRole`, `accessibilityState` (`selected`, `disabled`) and require a name for icon-only controls. |
| State beyond colour | Selected filters and nav items carry fill and border changes, not colour alone. |

## Not implemented / open

- No automated a11y test suite runs in this container.
- Dynamic type is not yet wired to a scaling ramp; font sizes are fixed
  tokens.
- Screen-reader ordering has not been verified on a device — no device.
- `BerxFocusRing` (a named V9 contract) is not implemented, so web
  focus visibility relies on the platform default.
