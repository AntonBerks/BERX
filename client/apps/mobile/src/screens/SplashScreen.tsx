/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX SPLASH — the first frame of the product, and the logo reveal.
 *
 * It is the SAME stage the whole onboarding sequence stands on
 * (BerxStage): night sky, one key on the roofline, a city of three
 * receding bands. The camera is at ground level here and rises through
 * the sequence, so the last onboarding step is recognisably the same
 * place as this one, seen from further up.
 *
 * The mark is not painted on: BerxEmblemReveal assembles the object
 * plane by plane and settles out of a lean, ending in exactly the pose
 * BerxEmblem holds everywhere else in the app.
 *
 * HONEST ABOUT WHAT IT WAITS FOR. This screen is not a fake loading
 * bar. It holds for the length of its own reveal and then hands over —
 * the real boot (token restore, GET /me) is AppShell's `booting`
 * state, which runs on its own clock and is not represented here as
 * progress that BERX cannot actually measure.
 */
import {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {BerxEmblemReveal} from '../../../../packages/design-system/src/components/BerxEmblem';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	/** Called once the reveal has finished. */
	onDone: () => void;
}

/** The wordmark rises after the object has settled, not alongside it. */
const WORDMARK_DELAY_MS = 1500;

export default function SplashScreen({onDone}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const word = useRef(new Animated.Value(0)).current;
	const done = useRef(false);

	useEffect(() => {
		const anim = Animated.sequence([
			Animated.delay(WORDMARK_DELAY_MS),
			Animated.timing(word, {toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
			Animated.delay(420),
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
		<BerxStage depth={0} seed={19} scrim={0.3}>
			<View style={styles.center}>
				<BerxEmblemReveal size={172} light={colors.accent} />
				<Animated.View
					style={[
						styles.wordSlot,
						{
							opacity: word,
							transform: [{translateY: word.interpolate({inputRange: [0, 1], outputRange: [22, 0]})}],
						},
					]}>
					<Text style={styles.wordmark}>BERX</Text>
					<Text style={styles.sub}>Города, люди, впечатления</Text>
				</Animated.View>
			</View>
		</BerxStage>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: '18%'},
	wordSlot: {alignItems: 'center', marginTop: spacing.xl},
	wordmark: {
		fontSize: 44,
		fontWeight: typography.weightBold,
		color: colors.onMedia,
		letterSpacing: 10,
		// The wordmark is letterspaced, so the trailing space would push
		// the optical centre left without this.
		marginLeft: 10,
	},
	sub: {
		fontSize: typography.sizeXs,
		color: colors.onMediaFaint,
		textTransform: 'uppercase',
		letterSpacing: 2.6,
		marginTop: spacing.md,
	},
});
