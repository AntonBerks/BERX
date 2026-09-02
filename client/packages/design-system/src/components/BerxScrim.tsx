/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX SCRIM — the single darkening ramp laid under text that sits on
 * real photography.
 *
 * No gradient library is installable in this environment, so a gradient
 * is simulated with stacked opacity steps. Six screens/components had
 * each grown their OWN copy of that simulation, all with five equal-
 * height steps. Rendered against actual media that reads as visible
 * horizontal BANDS across the photo — the "cheap glass" failure, and
 * the reason this is now one primitive instead of six literals.
 *
 * Two things fix the banding: enough steps that each jump falls under
 * the perceptual threshold, and an eased ramp (opacity rises with a
 * power curve) instead of a linear one, so the dense end compresses
 * where the eye is least sensitive to it.
 */
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {useBerxColors} from '../theme';

export interface BerxScrimProps {
	/** How much of the surface the ramp covers, 0..1 from the anchored edge. */
	coverage?: number;
	/**
	 * Curve of the ramp. 2.2 keeps a decorative scrim out of the way of
	 * the photograph; a scrim that has to carry TEXT over arbitrary user
	 * media needs a much straighter ramp (~1.2), because at 2.2 the
	 * middle of the gradient is only ~20% opaque and a bright photo shows
	 * straight through it.
	 */
	ease?: number;
	/** Opacity at the dense end. */
	strength?: number;
	/** Which edge the dense end sits against. */
	from?: 'bottom' | 'top';
	/** Steps in the simulation. More = smoother; 18 is imperceptible at phone DPR. */
	steps?: number;
	style?: ViewStyle;
}

/** Exported for callers that need the ramp inline; same curve as the component. */
export function scrimRamp(steps: number, strength: number, ease = 2.2): number[] {
	// t^2.2 keeps the top of the ramp genuinely transparent (so the photo
	// is never veiled) and compresses the steps where they are darkest.
	return Array.from({length: steps}, (_v, i) => strength * Math.pow((i + 1) / steps, ease));
}

export function BerxScrim({
	coverage = 0.66,
	strength = 0.92,
	from = 'bottom',
	ease = 2.2,
	steps = 18,
	style,
}: BerxScrimProps) {
	const colors = useBerxColors();
	const ramp = React.useMemo(() => scrimRamp(steps, strength, ease), [steps, strength, ease]);
	const ordered = from === 'bottom' ? ramp : [...ramp].reverse();
	return (
		<View
			pointerEvents="none"
			style={[
				styles.wrap,
				from === 'bottom' ? {bottom: 0} : {top: 0},
				{height: `${Math.round(coverage * 100)}%`},
				style,
			]}>
			{ordered.map((opacity: number, i: number) => (
				<View key={i} style={[styles.step, {backgroundColor: colors.mediaScrim, opacity}]} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {position: 'absolute', left: 0, right: 0},
	step: {flex: 1},
});
