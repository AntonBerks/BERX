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
 * translateX + scale, decelerating into contact with a brief brighten
 * at the meeting point, then settling. No bounce.
 *
 * THE GLOW IS A REAL RADIAL FALLOFF, NOT A COLOURED CIRCLE. It used to
 * be a View with `backgroundColor: SPATIAL_KEY_LIGHT` and a border
 * radius — a flat, fully-saturated disc with a hard edge, sitting
 * behind the orbs. Light does not have an edge. At any opacity above
 * about 0.2 it read as a teal sticker pasted behind the objects, and it
 * was the first thing the eye landed on at the emotional peak of the
 * whole dating flow. It is now an SVG radial gradient falling to fully
 * transparent, which is the same technique BerxOrb already uses for its
 * own halo — so the two objects and the light between them are drawn
 * with one vocabulary instead of two.
 *
 * The flash is also SHORT and it PEAKS ON CONTACT. The old one was
 * still rising 100ms after the orbs had already met, so the brightest
 * moment landed after the event it was meant to punctuate.
 */
import {useEffect, useRef} from 'react';
import {View, Animated, Easing, StyleSheet} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {BerxOrb} from '@berx/design-system/components/BerxOrb';
import {SPATIAL_FILL_LIGHT} from '@berx/design-system/spatial/engine/stage';
import {useBerxColors} from '@berx/design-system/theme';

const APPROACH_MS = 1100;
const FLASH_UP_MS = 90;
const FLASH_DOWN_MS = 620;
const ORB_SIZE = 108;
const START_OFFSET = 84;
/** The glow reaches well past the orbs — light spills, it does not fit in a box. */
const GLOW_SIZE = ORB_SIZE * 3;

/** Soft light with no edge: full-strength core falling to fully transparent. */
function ContactGlow() {
	const colors = useBerxColors();
	const keyLight = colors.accent;
	return (
		<Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox="0 0 100 100">
			<Defs>
				<RadialGradient id="berx-match-glow" cx="50%" cy="50%" r="50%">
					<Stop offset="0%" stopColor={keyLight} stopOpacity={0.55} />
					<Stop offset="22%" stopColor={keyLight} stopOpacity={0.26} />
					<Stop offset="52%" stopColor={keyLight} stopOpacity={0.08} />
					<Stop offset="100%" stopColor={keyLight} stopOpacity={0} />
				</RadialGradient>
			</Defs>
			<Circle cx="50" cy="50" r="50" fill="url(#berx-match-glow)" />
		</Svg>
	);
}

export default function BerxMatchScene() {
	const approach = useRef(new Animated.Value(0)).current;
	const flash = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const seq = Animated.sequence([
			Animated.timing(approach, {toValue: 1, duration: APPROACH_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
			// Fast up, slow down — the shape of an actual flash. The reverse
			// (slow up) reads as a lamp being switched on.
			Animated.timing(flash, {toValue: 1, duration: FLASH_UP_MS, easing: Easing.out(Easing.quad), useNativeDriver: true}),
			Animated.timing(flash, {toValue: 0, duration: FLASH_DOWN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true}),
		]);
		seq.start();
		return () => seq.stop();
	}, [approach, flash]);

	const leftX = approach.interpolate({inputRange: [0, 1], outputRange: [-START_OFFSET, 0]});
	const rightX = approach.interpolate({inputRange: [0, 1], outputRange: [START_OFFSET, 0]});

	return (
		<View style={styles.wrap}>
			{/* A low resting glow the whole time, so the two objects are lit by
			    the space between them from the moment they start travelling —
			    the flash is a swell in something already there, not a light
			    switching on out of nothing. */}
			<Animated.View
				pointerEvents="none"
				style={[
					styles.glowSlot,
					{
						opacity: flash.interpolate({inputRange: [0, 1], outputRange: [0.32, 1]}),
						transform: [{scale: flash.interpolate({inputRange: [0, 1], outputRange: [0.82, 1.15]})}],
					},
				]}>
				<ContactGlow />
			</Animated.View>
			<Animated.View style={[styles.orbSlot, {transform: [{translateX: leftX}]}]}>
				<BerxOrb size={ORB_SIZE} />
			</Animated.View>
			<Animated.View style={[styles.orbSlot, {transform: [{translateX: rightX}]}]}>
				<BerxOrb size={ORB_SIZE} light={SPATIAL_FILL_LIGHT} />
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {width: '100%', aspectRatio: 1.15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'},
	// They meet and touch. The previous -0.22 drove them a fifth of a body
	// into each other, which reads as two shapes clipping rather than as
	// two identities arriving at the same place.
	orbSlot: {marginHorizontal: -ORB_SIZE * 0.1},
	glowSlot: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
});
