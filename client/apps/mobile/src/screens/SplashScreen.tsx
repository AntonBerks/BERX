/**
 * BERX SPLASH — screen 01 of the entry sequence, and the logo reveal.
 *
 * The mark assembles rather than appears: the shadow stroke arrives
 * first, the lit stroke crosses over it, and the wordmark rises last.
 * That order is the mark's own construction played out in time — two
 * planes crossing — so the animation explains the logo instead of
 * merely animating it.
 *
 * HONEST ABOUT WHAT IT WAITS FOR. This is not a loading bar. It holds
 * for the length of its own reveal and hands over; the real boot
 * (token restore, GET /me) is AppShell's `booting` state, which runs on
 * its own clock and is not misrepresented here as progress BERX can
 * measure.
 */
import {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxEntryStage} from '../../../../packages/design-system/src/components/BerxEntryStage';
import {BerxMark, BerxWordmark} from '../../../../packages/design-system/src/components/BerxLogo';
import {BERX_SCENE} from '../../../../packages/design-system/src/palette';

interface Props {
	onDone: () => void;
}

export default function SplashScreen({onDone}: Props) {
	const styles = useMemo(() => makeStyles(), []);
	const mark = useRef(new Animated.Value(0)).current;
	const word = useRef(new Animated.Value(0)).current;
	const done = useRef(false);

	useEffect(() => {
		const anim = Animated.sequence([
			Animated.timing(mark, {
				toValue: 1,
				duration: 900,
				// Lands, does not bounce. A bouncing logo reads as a toy.
				easing: Easing.bezier(0.16, 1, 0.3, 1),
				useNativeDriver: true,
			}),
			Animated.timing(word, {toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
			Animated.delay(560),
		]);
		anim.start(({finished}: {finished: boolean}) => {
			if (finished && !done.current) {
				done.current = true;
				onDone();
			}
		});
		return () => anim.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<BerxEntryStage progress={0} field={0.62}>
			<View style={styles.centre}>
				<Animated.View
					style={{
						opacity: mark,
						transform: [
							{scale: mark.interpolate({inputRange: [0, 1], outputRange: [0.72, 1]})},
							{rotate: mark.interpolate({inputRange: [0, 1], outputRange: ['-14deg', '0deg']})},
						],
					}}>
					<BerxMark size={128} light={BERX_SCENE.light} body="#4A2C2A" />
				</Animated.View>
				<Animated.View
					style={{
						marginTop: spacing.xl,
						opacity: word,
						transform: [{translateY: word.interpolate({inputRange: [0, 1], outputRange: [18, 0]})}],
					}}>
					<BerxWordmark width={132} color="rgba(248,243,239,0.92)" />
				</Animated.View>
			</View>
		</BerxEntryStage>
	);
}

const makeStyles = () =>
	StyleSheet.create({
		centre: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: '14%'},
	});
