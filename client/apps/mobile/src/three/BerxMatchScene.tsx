/**
 * BERX MATCH SCENE — 2D spatial fallback.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxMatchScene.native.tsx on iOS/Android; the esbuild harness has no
 * `.native.` resolution and always lands here).
 *
 * Same real event, same real refusal to fabricate a face: two BerxOrb
 * identity objects (the same object PROFILE/BERX ID already uses)
 * travel in from opposite sides and meet at the centre, exactly the
 * choreography the GL scene performs — real RN Animated driving
 * translateX + scale, decelerating into contact with a brief emissive-
 * style brighten (opacity pulse on an overlaid glow) at the meeting
 * point, then settling. No bounce.
 */
import {useEffect, useRef} from 'react';
import {View, Animated, Easing, StyleSheet} from 'react-native';
import {BerxOrb} from '@berx/design-system/components/BerxOrb';
import {SPATIAL_KEY_LIGHT, SPATIAL_FILL_LIGHT} from '@berx/design-system/spatial/engine/stage';

const APPROACH_MS = 1100;
const SPARK_MS = 420;
const ORB_SIZE = 108;
const START_OFFSET = 84;

export default function BerxMatchScene() {
	const approach = useRef(new Animated.Value(0)).current;
	const spark = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const seq = Animated.sequence([
			Animated.timing(approach, {toValue: 1, duration: APPROACH_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
			Animated.timing(spark, {toValue: 1, duration: SPARK_MS * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: true}),
			Animated.timing(spark, {toValue: 0, duration: SPARK_MS * 0.6, easing: Easing.in(Easing.quad), useNativeDriver: true}),
		]);
		seq.start();
		return () => seq.stop();
	}, [approach, spark]);

	const leftX = approach.interpolate({inputRange: [0, 1], outputRange: [-START_OFFSET, 0]});
	const rightX = approach.interpolate({inputRange: [0, 1], outputRange: [START_OFFSET, 0]});

	return (
		<View style={styles.wrap}>
			<Animated.View style={[styles.sparkGlow, {opacity: spark, transform: [{scale: spark.interpolate({inputRange: [0, 1], outputRange: [0.7, 1.6]})}]}]} />
			<Animated.View style={[styles.orbSlot, {transform: [{translateX: leftX}]}]}>
				<BerxOrb size={ORB_SIZE} light={SPATIAL_KEY_LIGHT} />
			</Animated.View>
			<Animated.View style={[styles.orbSlot, {transform: [{translateX: rightX}]}]}>
				<BerxOrb size={ORB_SIZE} light={SPATIAL_FILL_LIGHT} />
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {width: '100%', aspectRatio: 1.15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'},
	orbSlot: {marginHorizontal: -ORB_SIZE * 0.22},
	sparkGlow: {
		position: 'absolute',
		width: ORB_SIZE * 1.4,
		height: ORB_SIZE * 1.4,
		borderRadius: (ORB_SIZE * 1.4) / 2,
		backgroundColor: SPATIAL_KEY_LIGHT,
	},
});
