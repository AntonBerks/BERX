/**
 * BerxEnergyHalo — the D5 focus/energy layer.
 *
 * D5 is reserved for focus, active state and transient energy, so
 * this is the only component allowed to emit. It breathes on the
 * scene's ambient loop when one is running, and holds a steady glow
 * when the loop has been suspended by reduced motion or the frame
 * budget — the state stays visible either way, only the movement
 * goes.
 */
import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxEnergyHaloProps {
	/** 0..1 — how much energy this object currently carries. */
	intensity?: number;
	size?: number;
	/** Decorative by default; give it a label only when the halo itself carries meaning. */
	accessibilityLabel?: string;
	testID?: string;
}

export function BerxEnergyHalo({intensity = 1, size = 64, accessibilityLabel, testID}: BerxEnergyHaloProps) {
	const {scene} = useBerxScene();
	const pulse = useRef(new Animated.Value(0)).current;
	const ambient = scene.motion.ambient;
	const animated = ambient.loop === true && ambient.durationMs > 0;

	useEffect(() => {
		if (!animated) {
			pulse.setValue(0.5);
			return;
		}
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, {toValue: 1, duration: ambient.durationMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
				Animated.timing(pulse, {toValue: 0, duration: ambient.durationMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [animated, ambient.durationMs, pulse]);

	const energy = Math.max(0, Math.min(1, intensity));
	const opacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.32 * energy, 0.68 * energy]});
	const scale = pulse.interpolate({inputRange: [0, 1], outputRange: [0.94, 1.06]});

	return (
		<View
			testID={testID}
			pointerEvents="none"
			accessible={accessibilityLabel !== undefined}
			accessibilityLabel={accessibilityLabel}
			accessibilityElementsHidden={accessibilityLabel === undefined}
			importantForAccessibility={accessibilityLabel === undefined ? 'no-hide-descendants' : 'auto'}
			style={styles.root}>
			<Animated.View
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: rgba(scene.accent, 0.18),
					borderWidth: 1,
					borderColor: rgba(scene.accent, 0.42),
					shadowColor: scene.accent,
					shadowOpacity: 1,
					shadowRadius: size * 0.45,
					shadowOffset: {width: 0, height: 0},
					opacity,
					transform: [{scale}],
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {alignItems: 'center', justifyContent: 'center'},
});
