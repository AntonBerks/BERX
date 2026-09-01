/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX STAGE — the lit environment every screen with no media of its
 * own is built on.
 *
 * This is the composition that WelcomeScreen was tuned to and passed
 * on: a night sky with one dominant key low in the frame, a city of
 * three receding bands with real lit windows standing in that light,
 * grain over all of it, and a reading scrim under whatever type sits
 * on top. Extracted so the whole onboarding sequence is literally the
 * same environment rather than eleven screens that merely resemble
 * each other — "does it feel like one product" is answered by sharing
 * the stage, not by copying its numbers.
 *
 * `depth` moves the viewer through that one environment instead of
 * changing it: the camera rises and the city recedes as the sequence
 * progresses, so step 9 is recognisably the same place as step 1, seen
 * from further up. Sequences pass their step index; nothing else about
 * the lighting is per-screen.
 */
import {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {BerxLightField} from './BerxLightField';
import {BerxHorizon} from './BerxHorizon';
import {BerxGrain} from './BerxGrain';
import {BerxScrim} from './BerxScrim';
import {useBerxColors} from '../theme';

export interface BerxStageProps {
	/**
	 * 0..1 — how far through the sequence this screen is. Raises the
	 * camera (the city drops down the frame) and lifts the key with it.
	 */
	depth?: number;
	/** Changes the city without changing the composition. */
	seed?: number;
	/** Reading scrim height under the content, as a fraction. 0 disables. */
	scrim?: number;
	children?: React.ReactNode;
	style?: ViewStyle;
}

export function BerxStage({depth = 0, seed = 19, scrim = 0.46, children, style}: BerxStageProps) {
	const colors = useBerxColors();
	const d = Math.max(0, Math.min(1, depth));
	const styles = useMemo(
		() =>
			StyleSheet.create({
				screen: {flex: 1, backgroundColor: colors.bg, overflow: 'hidden'},
				// The city sinks as the camera rises; the bottom inset keeps it
				// clear of the action area on every step.
				horizon: {top: `${40 + d * 16}%` as unknown as number, bottom: 132},
			}),
		[colors, d],
	);

	return (
		<View style={[styles.screen, style]}>
			<BerxLightField
				vignette={0.95}
				sources={[
					// ONE key, low and left of centre, sitting on the roofline so
					// the city is backlit. Wide and flattened: a source at a
					// distance behind a horizon spreads along it rather than
					// glowing as a ball.
					{x: 0.34, y: 0.56 + d * 0.14, r: 1.25, color: colors.accent, intensity: 0.95, falloff: 2.3, stretch: 0.4},
					// Upper atmosphere — enough that the top of the frame is night
					// sky rather than dead black, faint enough never to compete.
					{x: 0.68, y: 0.16, r: 1.0, color: colors.accentHover, intensity: 0.26, falloff: 2.6, stretch: 0.7},
				]}
			/>
			<BerxHorizon color={colors.mediaScrim} rim={colors.accent} seed={seed} fade={0.3} style={styles.horizon} />
			<BerxGrain opacity={0.06} />
			{scrim > 0 ? <BerxScrim coverage={scrim} strength={0.82} /> : null}
			{children}
		</View>
	);
}
