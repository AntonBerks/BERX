# BERX — ARCHITECTURE SCOPE 250

## Existing project relationship
This directory is an architectural implementation package for the existing BERX project. It does not replace the source tree. `../project` remains the current source snapshot.

## Objective
Scale the architecture to 250 meaningful screens/states while keeping one backend authority and avoiding duplicate systems.

## Core idea
250 screens are the visible layer of a smaller set of reusable domains. The implementation should therefore scale horizontally through contracts and composition, not by creating 250 independent backend systems.

## Recommended dependency order
`Identity → Profile/Graph → Posts/Feed → Notifications → Messaging → Places/NOW → Events → Communities → Match → Discover → Media → Creator → Experiences/Trips → Rewards → Business → Commerce → Admin/Security`

## Business inside BERX
Business is a first-class domain, not a separate application. A business can:
- claim/manage its place identity;
- maintain profile/media/hours;
- manage team roles;
- publish moments to NOW;
- create offers;
- host events;
- receive/respond to reviews;
- see analytics;
- manage bookings when a real provider is configured.

## User journey examples
### Person → Place
Discover → Place Detail → Map → Hours → Review → Check-in → Experience → Points → Share.

### Person → Business Moment
NOW Nearby → Moment Detail → Open Place → Check-in/Offer → Experience → Review.

### Person → Event
Discover → Event Detail → RSVP → Notifications → Event Discussion → Attend → Experience → Points.

### Person → Match
Match Discover → Profile → Like → Mutual Match → Conversation → Safety controls.

### Creator
Creator Profile → Content → View Log → Insights → Media → Community/Business collaboration.

## External infrastructure boundaries
Payment provider, push delivery, object storage/CDN, WebSocket gateway and map/geocoding provider are infrastructure dependencies. Their absence must produce BLOCKED behavior, not fabricated success.
