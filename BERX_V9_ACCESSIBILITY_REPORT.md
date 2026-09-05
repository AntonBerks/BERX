# BERX v9 — ACCESSIBILITY REPORT

Target: WCAG 2.2 AA. Verified where it says verified, and not where it
does not. Reproduce the browser measurements with
`cd client && npm run verify:v9:web`.

## Controls that announced themselves as nothing

Twenty-nine interactive controls reached assistive technology as
unnamed nodes — no role, no label. Every one is fixed, and a gate now
fails the build if another appears.

| Where | What was unreachable |
|---|---|
| Story viewer | The two halves of the screen *are* the story's navigation, and neither was announced. The long-press pause was undiscoverable too; both now carry a hint |
| Business hours | Forty-two identical ± buttons, one per hour per day, each announced as nothing. Each now names its day and which end of the day it moves; the values are adjustable |
| Post detail | Report post, report comment, delete comment, open commenter's profile — four ✕ and ⚑ glyphs with no name between them |
| Trip, circle and experience pickers | Adding and removing a person, and the expand/collapse that reveals the picker (now with `expanded` state) |
| Place review | The five stars were five unnamed controls; they are a radio group now, each naming its value |
| Collection detail, community detail, create post | Remove-from-collection, report, remove-photo |
| App shell | The boot retry button |


## Verified in a real browser

| Check | Result |
|---|---|
| Painted heading contrast, 9 key scenes | **18.09:1** — measured on the composited pixels, not on token values |
| Content-layer contrast across 300 scenes × 7 device profiles | never below **13.11:1** |
| Every material's text contrast | 11.04:1 (NeonEnergy, the lowest) to 18.09:1 |
| Keyboard focus visible | Tab reaches the control; `2px solid rgb(79,214,232)` outline |
| Controls meet the 44dp target | 45–46px painted in all 9 scenes |
| High contrast forces opaque surfaces | 300/300 scenes; `backdrop-filter: none`, 18.09:1 |
| Reduced motion | parallax offsets 0, tilt ceiling 0deg, ambient animation `none` |
| Reduced motion keeps content | every layer still painted, all 4 content headings present |

## Real defects found and fixed

Each was found by measurement or by the typecheck, not by review.

1. **Own message bubbles were unreadable.** Near-white `#f5f5f7` on the
   cyan accent `#4fd6e8` — **1.59:1** measured, against a 4.5:1 target.
   Now the control-layer material with an accent tint: text stays on a
   dark ground, still reads unmistakably as "mine", and measures well
   above AA.
2. **Controls painted below their touch target.** Perspective was
   anchored on D5, so a 44px button rendered 38px. The content plane is
   now the reference and the layout minimum accounts for the control
   plane's projection plus measured off-axis foreshortening. 45–46px.
3. **The tab bar had no accessible names at all.** Icon-only, announced
   as nothing. It now always provides the name and the selected state
   while staying visually icon-only, per the recorded design decision.
4. **Message delete was long-press only** — no visible control, no
   keyboard path, no switch-control path. Now a labelled control plus an
   accessibility action; the gesture still works for those who know it.
5. **Profile had no ScrollView**, so the lower half of its menu was
   physically unreachable on a phone.
6. **Icon-only header actions with 8px hit-slop** on Feed, Messages,
   Login and Profile — all now real 44dp controls with names.

## Enforced in the runtime, not left to review

- **A surface that cannot meet AA becomes opaque automatically.**
  `ensureReadableSurface()` measures the composited contrast and returns
  the opaque-mode surface when it falls short. Glass cannot quietly
  destroy readability.
- **Elevation drives lift, not material opacity** — which is what stops
  the substrate out-shining the content plane. `assertContrastHierarchy()`
  checks D0/D1 luminance against the content plane on every scene, on
  every profile.
- **Reduced motion removes, it does not soften.** `resolveMotion()`
  returns motion with no z travel, capped at 220ms, and ambient loops
  are dropped entirely. The CSS agrees rather than compensating.
- **Decorative layers are hidden from assistive technology.** D0 and D1
  are `accessibilityElementsHidden` / `aria-hidden` by default and carry
  no semantic content.
- **Drag alternatives exist where dragging does.** `BerxHorizontalRail`
  ships previous/next controls that move it a page at a time.
- **Live regions are polite by default.** A countdown or a typing
  indicator that interrupts a screen reader every second is unusable;
  errors and failed sign-ins are assertive, because those must interrupt.
- **Composed accessible names.** An identity announces "name, @handle,
  verified, friend" as one node rather than four fragments; a chat row
  announces name, unread count, preview and time as one sentence.
- **44dp minimum** on every control the spatial layer renders.

## Not yet verified

Stated plainly rather than assumed passing.

- **No screen reader was run.** No VoiceOver, TalkBack or NVDA session
  happened here — no device, no host OS. Roles, names, states and live
  regions are set correctly in the source and verified structurally;
  how they *sound* is unverified.
- **~60 unconverted screens have not been audited.** The defect classes
  found above (contrast, touch target, gesture-only interaction, missing
  scroll) were found in the screens that were audited. There is no
  reason to think the others are clean.
- **No automated accessibility linting.** No axe, no eslint-plugin-jsx-a11y
  — no runner is configured in this repo.
- **Dynamic type / font scaling** is untested. RN respects the OS setting
  by default, but no layout has been checked at 200%.
- **Colour-blind safety** of the six colour worlds is unverified; they
  are user-selectable accents, and status is never encoded by colour
  alone (open/closed, delivery state and membership all carry text).
- **RTL** is untested. No RTL locale is shipped.
