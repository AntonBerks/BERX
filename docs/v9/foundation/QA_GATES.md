# BERX v9 QA Gates

## Visual
[ ] hierarchy reads without motion
[ ] depth order is correct
[ ] no accidental flat rectangles
[ ] glass remains legible over media
[ ] cyan energy is reserved for meaningful emphasis

## Motion
[ ] 60fps target on supported devices
[ ] no layout thrash
[ ] reduced-motion fallback
[ ] shared elements preserve identity

## Accessibility
[ ] keyboard focus
[ ] screen-reader names
[ ] target size
[ ] contrast fallback
[ ] no drag-only critical actions

## Data
[ ] no fake production data
[ ] loading/empty/error/offline
[ ] server authoritative
[ ] mutation rollback/retry strategy

## Performance
[ ] media lazy loading
[ ] list virtualization
[ ] blur layer budget
[ ] 3D budget
[ ] memory pressure behavior

## Security
[ ] no secrets in client
[ ] authorization enforced server-side
[ ] private data not emitted to analytics
