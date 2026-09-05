/**
 * BerxTypingIndicator — someone is typing, according to the server.
 *
 * Rendered only when the real typing endpoint says so. The three dots
 * animate on the scene's ambient loop and hold still when that loop
 * is suspended; the announced text is identical either way, so a
 * screen-reader user learns the same fact as a sighted one.
 */
import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxTypingIndicatorProps {
	/** Real names from the typing endpoint. Empty renders nothing. */
	names: readonly string[];
	testID?: string;
}

export function BerxTypingIndicator({names, testID}: BerxTypingIndicatorProps) {
	const {scene} = useBerxScene();
	const wave = useRef(new Animated.Value(0)).current;
	const animated = scene.budget.allowAmbientMotion && !scene.reducedMotion;

	useEffect(() => {
		if (!animated || names.length === 0) return;
		const loop = Animated.loop(
			Animated.timing(wave, {toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
		);
		loop.start();
		return () => loop.stop();
	}, [animated, names.length, wave]);

	if (names.length === 0) return null;

	const label = names.length === 1 ? `${names[0]} печатает` : `${names.slice(0, 2).join(' и ')} печатают`;

	return (
		<View testID={testID} accessible accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={label} style={styles.root}>
			<View style={styles.dots}>
				{[0, 1, 2].map((i) => (
					<Animated.View
						key={i}
						style={[
							styles.dot,
							{
								backgroundColor: scene.accent,
								opacity: animated
									? wave.interpolate({
											inputRange: [0, 0.33, 0.66, 1],
											outputRange: i === 0 ? [1, 0.35, 0.35, 1] : i === 1 ? [0.35, 1, 0.35, 0.35] : [0.35, 0.35, 1, 0.35],
										})
									: 0.7,
							},
						]}
					/>
				))}
			</View>
			<BerxText role="meta" emphasis="secondary">{label}</BerxText>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	dots: {flexDirection: 'row', gap: 3},
	dot: {width: 6, height: 6, borderRadius: 3},
});
