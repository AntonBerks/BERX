/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX SPATIAL LAYER — real parallax depth, driven by an actual
 * scroll position, not a decorative loop. A layer declares WHICH
 * plane it sits on (background / mid / foreground / hero) and this
 * translates it against the scroll driver by that plane's real
 * parallax factor (tokens/index.ts `parallax`) — nearer planes
 * traverse more of the visual field, which is what physically reads
 * as depth. Layers therefore separate as you scroll instead of
 * sliding as one flat sheet.
 *
 * Driver is an Animated.Value the SCREEN owns (its own real scroll
 * offset), so nothing here invents motion the user didn't cause.
 * With no driver passed, this is an inert positioned View — safe to
 * use as plain layout, no phantom animation.
 *
 * Honours reduced motion: pass `reducedMotion` and every plane
 * collapses to zero translation while keeping its z-order and
 * elevation, so the composition still reads correctly.
 */
import React from 'react';
import {Animated, StyleSheet, ViewStyle} from 'react-native';
import {parallax, elevation as elevationTokens} from '../tokens';
import type {BerxElevation} from '../tokens';

export type BerxPlane = 'background' | 'mid' | 'foreground' | 'hero';

export interface BerxSpatialLayerProps {
	children: React.ReactNode;
	/** Which depth plane this layer sits on. Drives both parallax factor and default elevation. */
	plane?: BerxPlane;
	/** The screen's own real scroll offset (Animated.Value). Omit for a static layer. */
	driver?: Animated.Value;
	/** Total travel, in px, the FURTHEST plane would move across the driver's 0..range window. */
	range?: number;
	/** Real accessibility switch — collapses translation, keeps depth/order. */
	reducedMotion?: boolean;
	depth?: BerxElevation;
	style?: ViewStyle;
}

const PLANE_DEPTH: Record<BerxPlane, BerxElevation> = {
	background: 0,
	mid: 1,
	foreground: 2,
	hero: 3,
};

export function BerxSpatialLayer({
	children,
	plane = 'mid',
	driver,
	range = 240,
	reducedMotion,
	depth,
	style,
}: BerxSpatialLayerProps) {
	const factor = parallax[plane];
	const resolvedDepth: BerxElevation = depth ?? PLANE_DEPTH[plane];

	// Real inverse translation: as content scrolls up, a deeper plane
	// lags behind (moves less), a nearer plane leads. Negative range
	// end keeps the layer travelling WITH the scroll, just at its own
	// rate — the actual physics of parallax, not an arbitrary offset.
	const translateY =
		driver && !reducedMotion
			? driver.interpolate({
					inputRange: [0, range],
					outputRange: [0, -range * factor],
					extrapolate: 'clamp',
			  })
			: 0;

	return (
		<Animated.View style={[styles.layer, elevationTokens[resolvedDepth], {transform: [{translateY}]}, style]}>
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	layer: {},
});
