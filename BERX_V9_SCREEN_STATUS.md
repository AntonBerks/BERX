# BERX v9 — SCREEN STATUS

Regenerate the facts behind this file with `cd client && node scripts/v9-status.mjs`.

## The 29 named contracts

26 of the 29 screens the archive actually describes are wired to a real
screen that resolves their contract at runtime. The three that are not
are absent on purpose, each for a reason the API makes plain:

| Contract | Why it is absent |
|---|---|
| BERX-005 Interests | No interest-tag resource exists. `/dating/interests` records a dating like, not a tag list |
| BERX-007 Permissions | An OS grant, not a BERX resource — and the app has no camera or location module to request one for |
| BERX-008 Privacy Setup | No account-wide privacy resource. The dating privacy screen covers the one privacy surface that is real |

A step that configures nothing does not belong in a sequence that
claims to set the account up.

BERX-122 to BERX-127 are tabs on the profile rather than six
destinations, which is what the archive describes. Each resolves its
own contract — its own material, light recipe and depth profile — in a
room bounded by its panel.

Regenerate this count with `cd client && node scripts/v9-status.mjs`.

## The 300 contracts

All 300 resolve — by screenId, by route path and by route name — in Node
and again inside real Chromium. "Resolve" means the full chain the
contract specifies actually returns: route → family → scene (camera,
depth layers, material, lighting) → components → data binding → states →
navigation shell → motion → accessibility → platform.

| | Count |
|---|---|
| Contracts | 300 |
| Resolving by screenId | 300 |
| Resolving by route path | 300 |
| Resolving by route name | 300 |
| Families | 13 / 13 |
| With a real data binding (`bound`) | 27 |
| Legitimately without server data (`dataless`) | 2 |
| Numbered contracts with no product logic (`contract-only`) | 271 |

**300 resolving contracts is not 300 built screens, and this file does not
pretend otherwise.** The archive names 29 screens and describes real
product logic for them. The other 271 are numbered scene definitions —
"Home / Feed / Stories 15" — with no product behind them. They resolve as
real scenes and render an explicit contract-only boundary. Inventing
product logic for them is exactly what the constitution forbids, so none
was invented.

## The 29 named contracts

| Contract | Screen | Status |
|---|---|---|
| BERX-001 Welcome | `WelcomeScreen.tsx` | **DONE** |
| BERX-002 Sign In | `LoginScreen.tsx` | **DONE** |
| BERX-003 Create Account | `RegisterScreen.tsx` | **DONE** |
| BERX-004 Choose Color Vibe | — | **BLOCKED** — no profile-preference resource; a chosen world can only be device-local |
| BERX-005 Interests | — | **BLOCKED** — no general interest-tag storage; `/dating/interests` is a dating like |
| BERX-006 Profile Photo | — | **MISSING** — `uploadAvatar` is real and already used inside Settings; no dedicated scene yet |
| BERX-007 Permissions | — | **BLOCKED** — OS-level grant, not a BERX resource |
| BERX-008 Privacy Setup | — | **BLOCKED** — no account-wide privacy resource |
| BERX-009 Safety Setup | — | **MISSING** — block/unblock/report are real (`BlockedUsersScreen`, `ReportScreen`); not yet one onboarding scene |
| BERX-010 Onboarding Complete | — | **MISSING** — `me` and `pointsBalance` are real; no scene yet |
| BERX-031 Home Feed | `FeedScreen.tsx` | **DONE** |
| BERX-032 Stories Tray | `StoriesRailScreen.tsx` | **PARTIAL** — real data; the tray component is used by the feed, this screen is not yet converted |
| BERX-061 Explore | `SearchScreen.tsx` | **DONE** |
| BERX-091 BERX NOW | `NearbyNowScreen.tsx` | **DONE** (map BLOCKED, distance rail instead) |
| BERX-121 Profile Overview | `ProfileScreen.tsx` | **DONE** |
| BERX-122 Profile Moments | — | **PARTIAL** — `AlbumsScreen`/`MemoriesScreen` carry the real data; no unified tab scene |
| BERX-123 Profile Places | `SavedPlacesScreen.tsx` | **PARTIAL** — owner-only by design; other users' saved places are not a public resource |
| BERX-124 Profile Events | `MyEventsScreen.tsx` | **PARTIAL** — same, caller-scoped |
| BERX-125 Profile Experiences | `ExperiencesScreen.tsx` | **DONE** (accepts a userGuid, so it works for other profiles) |
| BERX-126 Profile About | `ProfileScreen.tsx` | **PARTIAL** — the API returns no bio/about fields, so there is little to separate into a tab |
| BERX-127 Profile Connections | — | **PARTIAL** — `/friends` is caller-scoped; no by-user friends resource |
| BERX-151 Connections | — | **MISSING** — `friends`, `addFriend`, `removeFriend`, `searchUsers` are all real; no dedicated scene |
| BERX-176 Messages | `ConversationListScreen.tsx`, `ConversationScreen.tsx` | **DONE** (calling BLOCKED) |
| BERX-201 Places Discovery | `PlacesListScreen.tsx` | **DONE** |
| BERX-226 Events Discovery | `EventsListScreen.tsx` | **DONE** (ticketing BLOCKED) |
| BERX-246 Experiences | `ExperiencesScreen.tsx` | **DONE** |
| BERX-266 Communities | `CommunitiesListScreen.tsx` | **DONE** |
| BERX-281 Creator Hub | `CreatorProfileScreen.tsx` | **PARTIAL** — real audience numbers and the creator card; not resolved as its own contract scene (earnings BLOCKED) |
| BERX-291 Business Dashboard | `BusinessDashboardScreen.tsx` | **DONE** |

**13 of 29 fully on the runtime. 6 BLOCKED with a named backend reason.
10 PARTIAL or MISSING — real data exists, the scene does not yet.**

## Screens outside the 300

BERX has real screens the archive never named — post detail, the points
ledger, place and event pages, collections, trips, the creator profile.
They render through `BerxFamilyScene`, which gives them their family's
spatial definition and deliberately emits no contract analytics.
**They are not counted as contract coverage anywhere**, including here.

Converted so far: `PostDetailScreen`, `PointsScreen`, `PlaceDetailScreen`,
`EventDetailScreen`, `CollectionsScreen`, `TripsScreen`,
`CreatorProfileScreen`.

## Not yet converted

~60 of the 78 screens still render flat. They load real data and work;
they do not yet resolve a scene, and they have not been audited for the
defect classes this pass found in the ones that were (contrast, touch
target, gesture-only interaction, missing scroll container). Treating
them as done because they compile would be exactly the mistake the
runtime-first rule is about.
