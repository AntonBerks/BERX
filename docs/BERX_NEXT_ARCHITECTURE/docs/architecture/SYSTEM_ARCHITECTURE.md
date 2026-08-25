# BERX — SYSTEM ARCHITECTURE

## 1. Product loop
`DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → REVIEW → EARN → LEVEL UP → DISCOVER MORE`

BERX — единая social/lifestyle ecosystem, где Social Graph связывает людей, контент, места, события, сообщества, experiences и business.

## 2. Backend

```text
OSSN/PHP/MySQL
│
├── Core OSSN
├── BERX domain classes
│   ├── OssnBusiness
│   ├── OssnBusinessMoments
│   ├── OssnCircles
│   ├── OssnCreator
│   ├── OssnExperiences
│   ├── OssnGeo
│   ├── OssnMediaAssets
│   ├── OssnTrips
│   ├── OssnPlaceHours
│   ├── OssnNotifications
│   ├── OssnMessages
│   ├── OssnChat
│   ├── OssnCommunities
│   └── OssnDating
│
└── components/OssnApi/v1
    └── one resource/action family per REST file
```

### Backend rule
REST endpoint validates input, authenticates, authorizes, invokes a domain method, maps the result to the contract and returns a typed response. It must not contain duplicated domain logic.

## 3. Frontend

```text
client/
├── packages/core
├── packages/api
├── packages/auth
├── packages/domain
├── packages/validation
├── packages/design-system
├── packages/platform
└── apps/mobile
    ├── AppShell
    ├── navigation
    ├── platform
    └── screens
```

Web follows the same domain contracts. No client is allowed to access MySQL directly.

## 4. Data ownership

| Data | Owner |
|---|---|
| identity/session | OSSN |
| users/profiles | OSSN |
| social graph | OSSN |
| posts/comments/reactions | OSSN |
| messages/conversations | OSSN |
| notifications | OSSN |
| communities | OSSN |
| places/events | OSSN |
| match | OSSN |
| business | OSSN |
| media metadata | OSSN |
| files | configured object/media storage behind OSSN contract |
| analytics events | OSSN-owned event contract; external sink optional |

## 5. Realtime

Phase 1 runtime-safe transport: short polling for messages/typing/notifications where necessary.
Phase 2: dedicated WebSocket service authenticated by OSSN bearer/session token. WebSocket never becomes a second data authority; it publishes changes produced by OSSN.

## 6. Async side effects

Domain mutation may emit internal events such as:
`message.created`, `message.read`, `comment.created`, `event.rsvp`, `place.checkin`, `match.created`, `business.moment.created`.

Consumers create notifications, analytics, counters or delivery jobs. The primary mutation remains transactional.

## 7. Security
- server-side authorization on every mutation;
- ownership checks;
- block/privacy checks before reads;
- rate limits for auth, messaging, reactions and sensitive actions;
- prepared statements;
- CSRF protection where cookie sessions are used;
- bearer token validation for API clients;
- media MIME/size validation;
- random server-side filenames;
- audit log for admin/security actions.

## 8. Reliability
Every important write has an idempotency strategy where retries are possible. API errors are typed. Long-running work is asynchronous. Backups and recovery are release gates.

## 9. Observability
Track request latency, 4xx/5xx rate, auth failures, message delivery delay, notification lag, media failures, API contract errors, job failures and critical business actions.

## 10. Feature flags
Flags are server-authoritative and scoped by environment, cohort or account. Disabled features must fail safely and not expose unreachable UI actions.

## 11. Architecture change rule
Architecture is frozen. Any structural change requires ADR with reason, alternatives, migration impact and rollback plan.
