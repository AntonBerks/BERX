# BERX v9 Constitution

## 01. Product DNA
BERX = Living Spatial Social.
Core loop:
DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → REVIEW → EARN → LEVEL UP → DISCOVER MORE.

Core objects:
PEOPLE, MOMENTS, PLACES, EVENTS, EXPERIENCES, COMMUNITIES, BUSINESSES, MEMORIES, COLLECTIONS, REPUTATION, NOW.

## 02. Visual DNA
Background: #07080A
Surface: #101216
Primary accent: #4FD6E8
Glass layers: rgba(255,255,255,.04/.06/.10)
No purple as default brand accent.
Dark cinematic environment, premium glass, restrained cyan energy.

## 03. 5D
D1 Visual — color, type, imagery, light.
D2 Spatial — z-depth, camera, perspective, parallax.
D3 Social — people/context/relationships.
D4 Temporal — now, live state, transitions, time.
D5 Emotional — energy, anticipation, delight, trust, calm.

## 04. Depth
D0 = substrate/background
D1 = environmental media
D2 = structural glass
D3 = primary content
D4 = controls/avatars/highlight
D5 = active energy/focus

Depth is hierarchy, not decoration.

## 05. Motion
Micro 140ms
Fast 220ms
Standard 360ms
Spatial 650ms
Cinematic 900ms
Ambient ~4000ms
Tilt max ±2.5°
Reduced motion removes parallax/tilt and keeps semantic transitions.

## 06. Platform
Targets: iOS, Android, Web, Tablet, Desktop, Watch, AR/VR.
One design language, platform-appropriate interaction.

## 07. Engineering
React Native + TypeScript client.
Web client.
OSSN/PHP + MySQL backend.
Existing REST boundary under /api/v1/.
Never invent endpoint names. Use an adapter layer around actual discovered API resources.

## 08. Quality gates
Every screen must have:
loading, empty, error, success, disabled, offline where meaningful;
accessibility contract;
analytics contract;
asset contract;
motion contract;
responsive behavior;
data dependency;
permission assumptions;
performance budget;
reduced-motion fallback.
