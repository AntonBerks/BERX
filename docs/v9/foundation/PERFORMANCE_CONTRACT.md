# Performance Contract

## Mobile baseline
- target 60fps;
- no continuous React state updates from pointer movement;
- parallax values are throttled/requestAnimationFrame driven;
- maximum 3 concurrent blur layers in a mobile viewport;
- virtualize long lists;
- pause offscreen video;
- avoid full-screen WebGL if a CSS/native primitive can achieve the effect.

## Capability tiers
Tier A: high-end desktop / spatial hardware.
Tier B: modern phone/tablet.
Tier C: low-power / battery saver / reduced motion.

A lower tier changes implementation fidelity, not hierarchy or semantics.
