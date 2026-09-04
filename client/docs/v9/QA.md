# BERX V9 — QA report

## What was actually verified, and how

This container has no iOS or Android project and no native toolchain,
so there are exactly three honest verification levels in this repo, and
this report uses them literally:

| Level | Meaning |
|---|---|
| **STATIC** | `tsc --noEmit` over the whole workspace, clean. |
| **HARNESS** | Rendered in the esbuild + Playwright web harness against the mock API, screenshotted, console errors asserted empty. |
| **UNVERIFIED** | Real code against a real contract, never executed on a device. |

Nothing in this work is claimed as native-verified.

## Results

| Check | Level | Result |
|---|---|---|
| Whole workspace typecheck | STATIC | clean |
| Feed / Profile / NOW / People / Places / Events / Messaging / Content, Night + Day | HARNESS | 16 surfaces, zero console errors |
| Cinematic onboarding, all ten panels | HARNESS | full run, zero console errors |
| Splash beat timeline | HARNESS | frame-by-frame capture at 0.9s / 1.1s / 1.5s / 2.0s |
| Components demo, Night + Day | HARNESS | clean |
| Native behaviour (haptics, gyroscope, blur backend) | UNVERIFIED | real code, no device |

## Real bugs this work found and fixed

These were found by running the app, not by reading it:

1. **Glass veil over media.** `BerxGlassView`'s animated border was a
   rotating square hidden behind an inset mask filled with the panel's
   own glass colour; that mask paints above the panel's `backgroundLayer`,
   so it repainted glass over the panel's own photo. Invisible at
   Night's 15% fill, an opaque veil at Day's 68%. Replaced with a
   stroked rect (transparent interior).
2. **Accent ink inverted in Day.** `accentInk()` chose by argument name
   rather than by measurement; when the Day poles swapped, every solid
   primary button and outgoing chat bubble rendered dark-on-dark.
3. **Accent over media corrected against the wrong surface.**
   `accentOnMedia` was being overwritten with the ground-corrected
   accent, putting a dark accent on dark photography.
4. **Splash sequence never rendered.** Two assignments to one shared
   value in one effect do not queue — the second replaces the first, so
   the point and its orbiting particles never appeared.
5. **Parallax uncovered the hero base.** The profile cover sits on a
   plane that really travels, so it exposed a strip of the hero's dark
   background at the bottom of that travel.
6. **Four wrong names in the V9 bindings**, caught by verifying every
   API method and screen name against source before writing it down.

## Known open items

- 52 of the archive's 118 component names have no implementation.
- 271 contracts inherit their family scene; the archive gives them no
  distinct design or data.
- BERX-007 (Permissions) is BLOCKED: no permission flow exists here.
- Analytics events are not transmitted — no sink is installed, and the
  boundary deliberately does not fabricate a send.
- Profile's opaque tab bar cuts across the cover photo, leaving a dark
  sliver beneath it.
