/**
 * BERX SPRING PHYSICS — one real conversion, shared by every animated
 * BERX component (BerxGlassView, BerxAnimatedButton, BerxSpatialCard).
 *
 * This component set's own spec: "spring animation response 0.3
 * damping 0.7" — SwiftUI's spring parameterisation (response = the
 * perceived settle time, dampingRatio = 0..1 of how much it
 * overshoots), not react-native-reanimated's own (stiffness, damping,
 * mass). A real conversion, not stiffness/damping numbers picked
 * because they merely LOOK springy (mass = 1):
 *   angularFrequency = 2π / response
 *   stiffness = angularFrequency² · mass
 *   damping   = 4π · dampingRatio · mass / response
 *
 * Pure TypeScript, no React/Reanimated import — safe to call from any
 * component's module scope without pulling either into files that
 * don't otherwise need them.
 */
export interface BerxSpringConfig {
	mass: number;
	stiffness: number;
	damping: number;
}

export function springFromResponse(response: number, dampingRatio: number, mass = 1): BerxSpringConfig {
	const angularFrequency = (2 * Math.PI) / response;
	return {
		mass,
		stiffness: angularFrequency * angularFrequency * mass,
		damping: (4 * Math.PI * dampingRatio * mass) / response,
	};
}

/** This component set's own default: response 0.3s, damping ratio 0.7 — every press/tilt/release spring in BERX's premium components starts here unless a caller has a real reason to differ. */
export const BERX_SPRING = springFromResponse(0.3, 0.7);
