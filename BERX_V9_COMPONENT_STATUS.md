# BERX v9 — COMPONENT STATUS

Source of truth: `client/packages/scenes/src/componentMap.ts`. Usage is
measured by `client/scripts/v9-status.mjs`, and the contract probe fails
the build if a built spatial component is rendered by nothing.

## Coverage

| | Count |
|---|---|
| Components in the archive index | 118 |
| Actually requested by at least one of the 300 contracts | 50 |
| Resolved with a recorded outcome | 50 / 50 |
| BLOCKED with a named reason | 6 |
| Built spatial components rendered by nothing | **0** (gated) |
| Archive components no contract requests | 68 — catalogued, not built |

The 68 unrequested components were not built. Building a component no
screen asks for produces exactly the artefact this audit spent its time
removing.

## Resolution

**EXISTING — real implementation reused**

`BerxAvatar`, `BerxInput`, `BerxMediaGrid`

**ALIAS — the contract's name for something BERX already has**

| Contract name | Implementation | Why |
|---|---|---|
| `BerxPrimaryButton` | `BerxButton` | Already implements primary/secondary/ghost; the contract splits one control into three names |
| `BerxTabs`, `BerxProfileTabs` | `BerxSegmentTabs` | One control named twice by context, not by behaviour |
| `BerxMomentGrid` | `BerxMediaGrid` | A moment grid is a media grid over the Moment domain |
| `BerxBusinessMetric` | `BerxStatTile` | The real metric tile the business screens already used |

**REFACTOR**

`BerxGlassSurface` — was a fixed translucent card that rendered
identically whatever material a scene asked for: one background alpha,
one hairline, one shadow. That is the "blur + border + shadow" v9
rejects. It now derives fill, blur, border, edge highlight, refractive
rim and glow from the scene's material. Props and call sites unchanged;
a pane outside a scene falls back to documented material defaults.

**EXTEND**

| Component | What was extended |
|---|---|
| `BerxScrimHero` | The real scrim hero shipped already; the atmosphere layer and parallax binding are new |
| `BerxBottomNav` | Existed only inline in `AppShell` with no accessible names at all, no selected state and no badges. Extracted, with the control-layer material, announced names, selected state and the real unread count. Kept icon-only, per the recorded design decision |

**CREATE — required, real support exists, built and rendered**

Foundation: `BerxSpatialScene`, `BerxSurface`, `BerxDepthLayer`,
`BerxSceneBackdrop`, `BerxSpatialCard`, `BerxFocusRing`,
`BerxEnergyHalo`, `BerxProgressRing`, `BerxDataBoundary`, `useBerxLayer`.

Identity and controls: `BerxIdentity`, `BerxAvatarCluster`,
`BerxStatRail`, `BerxSearchField`, `BerxFilterBar`, `BerxHorizontalRail`.

Domain: `BerxSceneHero`, `BerxProfileHero`, `BerxPlaceHero`,
`BerxPlaceCard`, `BerxPlaceRating`, `BerxPlaceHours`, `BerxEventHero`,
`BerxCountdown`, `BerxObjectCard`, `BerxExperienceCard`, `BerxTripCard`,
`BerxCollectionCard`, `BerxCommunityCard`, `BerxCreatorCard`,
`BerxRewardCard`, `BerxBusinessHero`.

Social: `BerxStoryTray`, `BerxReactionPicker`, `BerxShareSheet`,
`BerxChatRow`, `BerxMessageBubble`, `BerxComposer`,
`BerxTypingIndicator`.

NOW: `BerxNowPulse`, `BerxNowRail`, `BerxNowScene`.

**BLOCKED — named, not stubbed**

| Component | Reason |
|---|---|
| `BerxMap` | No map renderer installed and no tile or geocoding provider configured. `/api/v1/nearby` returns real coordinates, so NOW and Places render a distance-ranked list rather than an empty map frame |
| `BerxMapPin` | A pin needs a map to sit on |
| `BerxCallSurface` | No signalling, media server or call-session resource under `/api/v1/` |
| `BerxTicket` | RSVP and capacity are real; payment, ticket issuance and barcodes are not |
| `BerxWalletCard` | Points and rewards are real; money is not |
| `BerxMediaCard` | The HOME contract names it, but `feed.php` returns no media per item by design. Built during this pass, then **removed** rather than shipped unrendered |

## Honesty carried into the components themselves

Not documentation about the components — behaviour inside them.

- `BerxReactionPicker` is a like control, because `OssnLikes` stores one
  like per user per object. Six emoji writing the same row would lie
  about which was chosen. The count updates only after the server
  confirms.
- `BerxMessageBubble` shows "sent" only after the server acknowledges.
  Optimistic delivery is the worst possible lie in a messenger.
- `BerxComposer` clears the field only after the send resolves, so a
  failed send keeps the user's text.
- `BerxPlaceHours.isOpenNow()` returns `null`, not `false`, when hours
  are unstructured — unknown and closed are different facts.
- `BerxPlaceRating` renders "нет оценок" rather than 0.0, which would
  read as a bad place.
- `BerxStatRail` omits a stat with no value instead of showing zero.
- `BerxStoryTray.seen` is optional; undefined means nobody knows, and the
  ring claims nothing.
- `BerxRewardCard` costs points, because BERX has points and not money.
- `BerxNowScene` renders a distance rail and states why there is no map.
- `BerxHorizontalRail` ships previous/next controls, because a
  drag-only interaction is unreachable by keyboard and switch control.
