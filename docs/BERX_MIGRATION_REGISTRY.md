# BERX Migration Registry

Directive Section 41. A living map from real capability → real
implementation → real coupling to OSSN → migration status. Built by
reading actual `class ... extends ...` declarations and actual file
locations across the repo, not inferred from names — see the "How
this was built" section at the bottom for the exact evidence.

**Read this before either (a) deepening OSSN coupling on a new
feature, or (b) planning an extraction.** It replaces guesswork about
"how OSSN-coupled is X" with a real answer.

## The two axes this registry actually found

Reading the codebase surfaced a genuine, useful split that a single
DIRECT/WRAPPED/BERX-NATIVE/LEGACY label per row would flatten, so each
row carries two answers:

1. **Origin** — did this capability exist in stock OSSN before BERX
   (a *feature* BERX inherited), or did BERX invent the concept (a
   *domain* BERX authored)? Signal used: stock OSSN features live
   under `components/Ossn*/` (the OSSN plugin convention); every
   BERX-authored domain class lives flat under top-level `classes/`.
   This split was 100% consistent across every class checked below.
2. **Coupling** — does the implementing class extend OSSN's deep
   entity/metadata engine (`OssnObject`/`OssnEntities`, itself
   `OssnDatabase`'s descendant — polymorphic object+metadata storage,
   the real core of "OSSN-ness"), or only the shallow `OssnDatabase`
   (a plain SQL builder over an ordinary table — no more "OSSN" than
   using any ORM's base class)?

The directive's own classification is derived from these two per row,
not assigned by feel:

- **LEGACY** = stock-OSSN origin + deep entity coupling. BERX's API
  layer wraps it with real ownership/ID checks, but the actual
  read/write path is unmodified OSSN core.
- **WRAPPED** = BERX-invented domain, implemented by extending the
  deep entity engine to reuse its real, working polymorphic storage
  (metadata, relationships, file attachment) rather than rebuilding
  that machinery. Real BERX concept, OSSN-shaped foundation.
- **BERX-NATIVE** = BERX-invented domain, own table(s), shallow
  `OssnDatabase` only — no entity/metadata system involvement at all.
  The only thing "OSSN" about these is the SQL connection they use.
- **DIRECT** = stock OSSN feature, shallow coupling, used as-is
  (mostly `OssnDatabase`-only stock utilities — rare; see table).

## Registry

| Domain (BERX concept) | Implementing class | Extends | Origin | Coupling | Classification |
|---|---|---|---|---|---|
| Feed / Wall posts | `OssnWall` (`components/OssnWall/`) | `OssnObject` | Stock OSSN | Deep | **LEGACY** |
| Communities | `OssnGroup` (`components/OssnGroups/`) | `OssnObject` | Stock OSSN | Deep | **LEGACY** |
| Identity / friends graph | `OssnUser` (`classes/OssnUser.php`, core) | `OssnEntities` | Stock OSSN | Deep | **LEGACY** |
| Media upload/storage | `OssnFile` (`classes/OssnFile.php`, core) | `OssnEntities` | Stock OSSN | Deep | **LEGACY** |
| Direct messaging | `OssnMessages` (`components/OssnMessages/`) | `OssnEntities` | Stock OSSN | Deep | **LEGACY** |
| Comments | `OssnComments` (`components/OssnComments/`) | `OssnAnnotation` (OSSN core, entity-adjacent) | Stock OSSN | Deep | **LEGACY** |
| Likes | `OssnLikes` (`components/OssnLikes/`) | `OssnDatabase` | Stock OSSN | Shallow | **DIRECT** |
| Notifications | `OssnNotifications` (`components/OssnNotifications/`) | `OssnDatabase` | Stock OSSN | Shallow | **DIRECT** |
| Places | `OssnPlaces` (`classes/OssnPlaces.php`) | `OssnObject` | **BERX** | Deep | **WRAPPED** |
| Events | `OssnEvents` (`classes/OssnEvents.php`) | `OssnObject` | **BERX** | Deep | **WRAPPED** |
| Engagement signals (Event Layer) | `OssnSignals` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Business offers/redemptions | `OssnBusinessOffers` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Match / Dating | `OssnDating` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Notification mute preferences | `OssnNotificationPrefs` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Circles (private audiences) | `OssnCircles` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Business team/roles | `OssnBusiness` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Trips | `OssnTrips` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Experiences | `OssnExperiences` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Stories | `OssnStories` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Video/track/album media assets | `OssnMediaAssets` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Points/reputation | `OssnPoints` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |
| Geo (haversine, nearby) | `OssnGeo` | `OssnDatabase` | **BERX** | Shallow | **BERX-NATIVE** |

No row is marked **DEPRECATED** — nothing in this registry has a
working replacement sitting unused (that pattern, when it was found
this session, was fixed immediately rather than logged as a pending
migration — e.g. `feed.php` calling the wrong, own-wall-only OSSN
method when a real friends-aggregating one already existed was a bug,
not a migration item).

## What this actually means for the OSSN → BERX objective

The headline finding: **BERX's own domain layer is already
overwhelmingly BERX-NATIVE.** Every product concept invented for
BERX — Places, Events, Signals, Offers, Dating, Circles, Business,
Trips, Experiences, Stories, media assets, Points, Geo — lives in its
own table(s) behind a class that only touches `OssnDatabase`, OSSN's
plain SQL builder. Swapping the storage engine under any one of these
rows is a same-class rewrite, not an extraction from OSSN's entity
system — there's nothing entity-shaped to extract from.

The real, remaining coupling is concentrated in exactly six rows,
all pre-existing OSSN features BERX did not invent and is not trying
to reinvent: **Feed/Wall, Communities, Identity/friends, Media
upload, Messaging, Comments** — plus Likes/Notifications, which are
stock OSSN but only shallowly coupled already. This is a much smaller
and more honest surface than "the whole backend is OSSN" — it's six
real subsystems, not sixty.

Two rows deserve a specific note because they're BERX concepts built
*on* the deep engine rather than *replacing* it: Places and Events.
Extending `OssnObject` gave them real, working polymorphic storage
(comments-on-a-place, files-on-an-event, relationships) for free
instead of rebuilding that machinery — a legitimate "prefer
abstraction over unnecessary rewrite" call (directive Section 43), not
an oversight. If Places/Events ever need to leave `OssnObject`, the
work is replacing that one inheritance edge per class with equivalent
BERX-native metadata/relationship/attachment tables — a bounded,
scoped job, not a rewrite of the Places/Events domain logic itself
(query building, ownership checks, business rules) which is already
BERX's own code.

## Migration strategy per LEGACY row (Section 3 phases)

None of these six are migrated in this pass — Section 43 ("no
unnecessary rewrite... progressive extraction + clean boundaries")
argues against touching working, load-bearing OSSN core in the same
session as building the registry that identifies it. What each needs,
when its turn comes:

- **Feed/Wall** — Phase B candidate. `feed.php` already treats
  `OssnWall` as an implementation detail behind a BERX-shaped
  response (`ossn_api_post_base_json`); a BERX-native `berx_posts`
  table with the same shape is a real, bounded rewrite whenever the
  cost of `OssnObject`'s query/pagination quirks (see
  `docs/BERX_FUTURE_CORE.md` and this session's own feed.php fix)
  outweighs reuse.
- **Communities, Comments** — same shape as Feed/Wall: BERX's API
  layer already fully owns the response contract, so extraction is a
  storage-layer swap behind an unchanged API, whenever prioritized.
- **Identity/friends** — highest-risk row to touch: session/auth,
  `ossn_loggedin_user()`, and dozens of hook callsites across OSSN
  core assume `OssnUser`'s real shape. Phase D/E territory, not
  earlier — an abstraction boundary here has to go around the
  *read* surface (a `BerxIdentity` read-model, additive) long before
  anything about `OssnUser` itself changes.
- **Media upload** — `OssnFile`'s real, already-audited quirk (the
  `addFile()` subtype-prefixing behavior documented in this
  session's own history) is exactly the kind of sharp edge a BERX
  media abstraction should absorb once, rather than every new upload
  route re-learning it. `OssnMediaAssets` (BERX-NATIVE, already
  built for video/track/album) is the real precedent for what a
  post-migration media layer looks like.
- **Messaging** — lowest urgency: conversations.php already presents
  a clean BERX-shaped contract; no product requirement currently
  pushes on `OssnMessages`'s real limits.

## Rule going forward (Section 40)

New functionality: BERX domain → BERX service → abstraction → current
OSSN implementation, never BERX UI → OSSN internals directly. This
registry is the reference for "is the thing I'm about to touch already
BERX-NATIVE (safe to extend directly) or LEGACY (extend through the
existing API contract, don't reach into `OssnWall`/`OssnGroup`/
`OssnUser`/`OssnFile`/`OssnMessages`/`OssnComments` from anywhere new)."

## How this was built

Every `extends` clause above was read directly from the class file,
not assumed from its name (`grep -m1 '^class ' <file>` against the 23
classes named in the table). Origin (stock OSSN vs. BERX-authored) was
read from each file's real path, not guessed — `components/Ossn*/` is
the stock OSSN plugin/component convention used throughout this
codebase (confirmed against `components/OssnWall/`,
`components/OssnGroups/`, `components/OssnMessages/`,
`components/OssnComments/`, `components/OssnLikes/`,
`components/OssnNotifications/`, all pre-existing OSSN subsystems),
while every BERX-invented domain class in this table lives flat under
the top-level `classes/` directory. No row's classification was
assigned from the domain's name or from what "feels like" it should be
BERX-native — each was checked.
