# BERX V9 — Screen report

Generated from the vendored archive contracts and the repository's own
source. Every number below is counted, not asserted.

## Totals
| | |
|---|---|
| Contracts in archive | 300 |
| Individually titled | 29 |
| Family + running number | 271 |
| BOUND to a real screen + real API | 28 |
| BLOCKED (capability absent) | 1 |
| INHERITED (registered, family scene) | 271 |

## Why the split
All three of the archive's screen layers were compared field by field.
Per-screen variation is limited to id, title, route, analytics keys and
asset refs; components, camera, layout, states, motion, accessibility,
performance and QA are identical within a family (V9: 13 families; V2:
11; and the V2 DESIGN_SPEC files reduce to 11 distinct bodies across
300 files). The 271 numbered contracts therefore carry no distinct
design or data to implement. They are registered and resolve to their
family scene; nothing about them is fabricated.

## Families
| Family | Contracts |
|---|---|
| AUTH | 30 |
| HOME | 30 |
| EXPLORE | 30 |
| NOW | 30 |
| PROFILE | 30 |
| SOCIAL | 25 |
| MESSAGES | 25 |
| PLACES | 25 |
| EVENTS | 20 |
| EXPERIENCE | 20 |
| COMMUNITY | 15 |
| CREATOR | 10 |
| BUSINESS | 10 |

## Bound scenes
| Screen | Title | Real screen | Real API |
|---|---|---|---|
| BERX-001 | Welcome / Cinematic Reveal | `onboarding/CinematicOnboarding` | — |
| BERX-002 | Sign In | `LoginScreen` | `login` |
| BERX-003 | Create Account | `onboarding/CinematicOnboarding` | `register` |
| BERX-004 | Choose Color Vibe | `SettingsScreen` | — |
| BERX-005 | Interests | `OnboardingScreen` | `myInterests`, `saveInterests` |
| BERX-006 | Profile Photo | `OnboardingScreen` | `uploadAvatar` |
| BERX-008 | Privacy Setup | `DatingPrivacyScreen` | `datingUpdatePrivacy`, `getOwnDatingProfile` |
| BERX-009 | Safety Setup | `SettingsScreen` | `blockedUsers`, `blockUser`, `mutedUsers`, `muteUser` |
| BERX-010 | Onboarding Complete | `OnboardingScreen` | `me` |
| BERX-031 | Home Feed | `FeedScreen` | `feed`, `likePost`, `commentOnPost`, `pinPost` |
| BERX-032 | Stories Tray | `StoriesRailScreen` | `ownStories`, `createStory`, `markStoryViewed` |
| BERX-061 | Explore | `SearchScreen` | `searchPlaces`, `peopleDiscovery`, `discoverWorlds` |
| BERX-091 | BERX NOW | `NowScreen` | `nearbyNow`, `onlineFriends`, `cityMode` |
| BERX-121 | Profile Overview | `ProfileScreen` | `getProfile`, `identity`, `me` |
| BERX-122 | Profile Moments | `ProfileScreen` | `momentsForSource`, `myLifeMoments` |
| BERX-123 | Profile Places | `ProfileScreen` | `savedPlaces`, `recentCheckins` |
| BERX-124 | Profile Events | `ProfileScreen` | `myGoingEvents` |
| BERX-125 | Profile Experiences | `ProfileScreen` | `experiences` |
| BERX-126 | Profile About | `ProfileScreen` | `getProfile` |
| BERX-127 | Profile Connections | `PeopleScreen` | `friends`, `onlineFriends`, `addFriend` |
| BERX-151 | Connections | `PeopleScreen` | `friends`, `peopleDiscovery`, `addFriend` |
| BERX-176 | Messages | `ConversationListScreen` | `conversations`, `markConversationRead`, `myGroups` |
| BERX-201 | Places Discovery | `PlacesNearbyScreen` | `nearbyPlaces`, `placeCategories`, `searchPlaces` |
| BERX-226 | Events Discovery | `EventsListScreen` | `events`, `eventCategories`, `rsvpEvent` |
| BERX-246 | Experiences | `ExperiencesScreen` | `experiences`, `getExperience` |
| BERX-266 | Communities | `CommunitiesListScreen` | `communities`, `myCommunities`, `joinCommunity` |
| BERX-281 | Creator Hub | `CreatorSettingsScreen` | `getCreatorProfile`, `getCreatorContent`, `enableCreatorMode` |
| BERX-291 | Business Dashboard | `BusinessDashboardScreen` | `businessDashboard`, `businessTeam`, `placeOffers` |

## Blocked
- **BERX-007 Permissions** — Permissions: no location/camera permission flow exists anywhere in this codebase (PlacesNearbyScreen documents the same gap). Nothing to bind without inventing it.
