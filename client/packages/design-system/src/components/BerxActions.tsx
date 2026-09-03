/**
 * BERX ACTIONS — the two controls a premium composition needs.
 *
 * A primary that reads as a lit, physical object: a real gradient
 * across it, a bright top edge where the light lands, a coloured glow
 * beneath it so it floats above the glass, and dark ink on the fill so
 * it never becomes a flat block of accent.
 *
 * A quiet one that is text and nothing else — because a secondary
 * button drawn as a second filled pill destroys the hierarchy the
 * primary just established.
 */
import {useMemo} from 'react';
import {Pressable, Text, View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {typography, spacing} from '../tokens';

export interface BerxPrimaryActionProps {
	label: string;
	onPress: () => void;
	/** The lit colour of the control. */
	tone?: string;
	/** Ink on the fill. */
	ink?: string;
	style?: ViewStyle;
}

export function BerxPrimaryAction({label, onPress, tone = '#00E5CC', ink = '#04121A', style}: BerxPrimaryActionProps) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	return (
		<Pressable
			onPress={onPress}
			style={({pressed}: {pressed: boolean}) => [
				styles.primary,
				{shadowColor: tone},
				pressed && styles.primaryPressed,
				style,
			]}>
			<Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
				<Defs>
					{/* Two jobs, cleanly split. This gradient is the BODY shading —
					    tone to slightly-dimmer tone down the height, which is what
					    gives the pill volume. The specular is `primaryEdge` below:
					    a 1px line, because that is what a highlight on a hard
					    glossy edge actually is.

					    The white stop used to run all the way to 18%, which on a
					    60px control is an ~11px white-to-cyan smear across the top
					    — it read as a grey band laid over the button, not as light
					    on it, and it was doing the specular's job badly on top of
					    the specular already doing it well. Pulled in to 6% and cut
					    to a fraction of the opacity, it now just keeps the top edge
					    from going flat under the hairline. */}
					<LinearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0.15" y2="1">
						<Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
						<Stop offset="6%" stopColor={tone} stopOpacity={1} />
						<Stop offset="100%" stopColor={tone} stopOpacity={0.82} />
					</LinearGradient>
				</Defs>
				<Rect x="0" y="0" width="100%" height="100%" rx={30} ry={30} fill={`url(#${uid}-fill)`} />
			</Svg>
			<View pointerEvents="none" style={styles.primaryEdge} />
			<Text style={[styles.primaryLabel, {color: ink}]}>{label}</Text>
		</Pressable>
	);
}

export function BerxQuietAction({label, onPress, style}: {label: string; onPress: () => void; style?: ViewStyle}) {
	return (
		<Pressable
			onPress={onPress}
			style={({pressed}: {pressed: boolean}) => [styles.quiet, pressed && {opacity: 0.55}, style]}>
			<Text style={styles.quietLabel}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	primary: {
		height: 60,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		// The control glows onto what it floats above — this is most of
		// what makes it read as lit rather than painted.
		shadowOpacity: 0.5,
		shadowRadius: 22,
		shadowOffset: {width: 0, height: 10},
		elevation: 12,
	},
	primaryPressed: {transform: [{scale: 0.985}], shadowOpacity: 0.3},
	primaryEdge: {
		position: 'absolute',
		top: 1,
		left: 22,
		right: 22,
		height: 1,
		backgroundColor: '#FFFFFF',
		opacity: 0.6,
	},
	primaryLabel: {fontSize: typography.sizeBase, fontWeight: typography.weightBold, letterSpacing: 0.2},
	quiet: {height: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs},
	quietLabel: {fontSize: typography.sizeSm, color: 'rgba(255,255,255,0.62)', letterSpacing: 0.2},
});
