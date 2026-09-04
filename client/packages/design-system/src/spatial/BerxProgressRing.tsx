/**
 * BerxProgressRing — determinate and indeterminate progress.
 *
 * React Native has no SVG or conic gradient without a library, so an
 * arc is drawn from two half-circle masks rotated by the real
 * progress value. That is a genuine arc, not a bar wearing a circle's
 * name, and it degrades to a static ring under reduced motion.
 *
 * Determinate progress is announced as a real progressbar with
 * min/max/now so a screen reader reports a percentage rather than
 * "image".
 */
import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxProgressRingProps {
	/** 0..1. Omit for indeterminate. */
	progress?: number;
	size?: number;
	thickness?: number;
	accessibilityLabel: string;
	testID?: string;
}

export function BerxProgressRing({progress, size = 44, thickness = 3, accessibilityLabel, testID}: BerxProgressRingProps) {
	const {scene} = useBerxScene();
	const spin = useRef(new Animated.Value(0)).current;
	const indeterminate = progress === undefined;
	const spinAllowed = indeterminate && !scene.reducedMotion && scene.budget.allowAmbientMotion;

	useEffect(() => {
		if (!spinAllowed) return;
		const loop = Animated.loop(
			Animated.timing(spin, {toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true}),
		);
		loop.start();
		return () => loop.stop();
	}, [spinAllowed, spin]);

	const clamped = Math.max(0, Math.min(1, progress ?? 0));
	const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

	const ring = {
		width: size,
		height: size,
		borderRadius: size / 2,
		borderWidth: thickness,
	};

	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={indeterminate ? undefined : {min: 0, max: 100, now: Math.round(clamped * 100)}}
			style={[styles.root, {width: size, height: size}]}>
			{/* track */}
			<View style={[ring, {borderColor: rgba(scene.accent, 0.16), position: 'absolute'}]} />
			{/* arc: a ring with three transparent edges, rotated to the real progress */}
			<Animated.View
				style={[
					ring,
					{
						position: 'absolute',
						borderColor: 'transparent',
						borderTopColor: scene.accent,
						borderRightColor: clamped > 0.25 || indeterminate ? scene.accent : 'transparent',
						borderBottomColor: clamped > 0.5 ? scene.accent : 'transparent',
						borderLeftColor: clamped > 0.75 ? scene.accent : 'transparent',
						transform: spinAllowed ? [{rotate}] : [{rotate: `${clamped * 360}deg`}],
					},
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {alignItems: 'center', justifyContent: 'center'},
});
