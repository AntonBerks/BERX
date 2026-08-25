# BERX — API ARCHITECTURE

## Rules
- Base path: `/api/v1`.
- One resource/action family per PHP REST file.
- REST layer never owns domain state.
- All protected routes authenticate through OSSN.
- Every mutation performs authorization server-side.
- Responses are stable, typed and versionable.
- Errors expose machine-readable `code`, human-safe `message`, optional `field_errors` and `request_id`.

## Resource families

`auth`, `users`, `profiles`, `graph`, `feed`, `posts`, `comments`, `reactions`, `saved`, `media`, `stories`, `videos`, `tracks`, `conversations`, `messages`, `typing`, `notifications`, `communities`, `places`, `nearby`, `events`, `dating`, `search`, `creator`, `collections`, `experiences`, `trips`, `points`, `business`, `moments`, `impressions`, `wrapped`, `memories`, `commerce`, `settings`, `reports`, `admin`.

The current archive contains a mix of implemented and planned resource families. The presence of a route file is not sufficient evidence of runtime functionality.

## Response envelope

```json
{
  "ok": true,
  "data": {},
  "meta": {"request_id":"..."}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Недостаточно прав",
    "field_errors": {}
  },
  "meta": {"request_id":"..."}
}
```

## Pagination
Cursor pagination is preferred for feeds, messages, notifications and search. Stable ordering must use a deterministic tie-breaker.

## Idempotency
Create-message, RSVP, check-in, booking and payment-boundary mutations should accept an idempotency key where retries can duplicate side effects.
