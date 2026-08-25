# BERX — SCREEN STATE MODEL

Each of the 250 surfaces should support the states that are meaningful for its domain:

- `loading`
- `success`
- `empty`
- `error`
- `retrying`
- `offline`
- `unauthenticated`
- `forbidden`
- `not_found`
- `deleted`
- `rate_limited`
- `blocked_by_policy`
- `action_pending`
- `action_success`
- `action_failed`

Not every screen needs every state. The domain contract determines which states are required.

## Example
A Place Detail surface needs loading/success/not-found/error and may need check-in pending/success/failed. A Settings surface needs authenticated/forbidden/error/success but usually not an empty state.
