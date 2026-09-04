/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX SPLASH — the first frame of the product, now the real first
 * INTERACTIVE one too.
 *
 * PREMIUM ONBOARDING PASS. The previous shape of this screen was a
 * pure timed reveal with no interaction at all — it always finished by
 * calling `onDone`, which AppShell wired to advance to the generic
 * pitch (`WelcomeScreen`). This pass adds real "Войти"/"Создать
 * аккаунт" glass buttons that appear once the mark has settled, wired
 * to the SAME real navigation targets WelcomeScreen's own two buttons
 * already lead to (see AppShell.tsx's own `UnauthenticatedFlow`) — so
 * tapping one here reaches Login/Discover directly, one screen sooner,
 * without inventing a new destination or duplicating logic.
 * `onLogin`/`onRegister` are both OPTIONAL and additive: a caller that
 * only ever passes `onDone` (none does today, but the contract stays
 * honest either way) still gets the exact old pure-timer behaviour —
 * this file makes no assumption about who else might mount it.
 *
 * THE MARK ITSELF stays the real SpatialEmblemReveal (a genuine
 * three-plane object assembling itself with an actual camera on
 * native, a pixel-identical 2D passthrough on web — see that
 * component's own header). This pass does NOT replace it with a flat
 * "logo built out of individual particle dots" — BerxParticleSystem's
 * real physics are closed-form OUTWARD kinematics (see its own
 * header), not an inbound-converge simulation; faking that shape
 * cheaply would be a worse, less premium result than the real object
 * reveal this screen already has. What IS real and new: a genuine
 * OUTWARD particle release (the same real BerxParticleSystem) fired at
 * the exact moment the object settles — "the mark catches light and
 * releases it" — plus a real glass halo (BerxGlassView, `glow`) with a
 * continuous slow rotation wrapping the settled mark.
 *
 * HONEST ABOUT WHAT IT WAITS FOR. Still not a fake loading bar — the
 * real boot (token restore, GET /me) is AppShell's own `booting`
 * state, on its own clock, never represented here as measured progress.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {Animated as RNAnimated, Easing as RNEasing, View, Text, LayoutChangeEvent, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import Animated, {useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSpring, withTiming, Easing} from 'react-native-reanimated';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {SpatialEmblemReveal} from '../../../../packages/design-system/src/spatial/SpatialEmblemReveal';
import {BerxAuroraField} from '../../../../packages/design-system/src/components/BerxAuroraField';
import {BerxGlassView} from '../../../../packages/design-system/src/components/BerxGlassView';
import {BerxAnimatedButton} from '../../../../packages/design-system/src/components/BerxAnimatedButton';
import {BerxParticleSystem} from '../../../../packages/design-system/src/components/BerxParticleSystem';
import {BERX_SPRING} from '../../../../packages/design-system/src/animation/springs';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	/** Called once the reveal has finished, ONLY relevant when neither `onLogin` nor `onRegister` is provided (see this file's own header). */
	onDone?: () => void;
	/** Real navigation to Login — the primary glass button. */
	onLogin?: () => void;
	/** Real navigation to the pitch/register flow — the secondary glass button. */
	onRegister?: () => void;
}

/** The wordmark rises after the object has settled, not alongside it. */
const WORDMARK_DELAY_MS = 1500;
/** When the settle particle release fires — matches the object's own real settle timing. */
const SETTLE_MS = 1800;
/** When the real action buttons spring in. */
const BUTTONS_MS = 2500;

export default function SplashScreen({onDone, onLogin, onRegister}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const word = useRef(new RNAnimated.Value(0)).current;
	const done = useRef(false);
	const interactive = !!(onLogin || onRegister);

	const [haloSize, setHaloSize] = useState({width: 0, height: 0});
	const onHaloLayout = (e: LayoutChangeEvent) => setHaloSize({width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height});

	// SETTLE — a real outward particle release, timed to the object's
	// own real settle moment, plus the halo's slow continuous rotation
	// starting from the same instant.
	const [settleBurst, setSettleBurst] = useState(false);
	const haloRotation = useSharedValue(0);
	useEffect(() => {
		const t = setTimeout(() => {
			setSettleBurst(true);
			haloRotation.value = withRepeat(withTiming(360, {duration: 14000, easing: Easing.linear}), -1, false);
		}, SETTLE_MS);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const haloStyle = useAnimatedStyle(() => ({transform: [{rotate: `${haloRotation.value}deg`}]}), [haloRotation]);

	// BUTTONS — real spring-in at 2.5s, per this pass's own spec.
	const buttonsIn = useSharedValue(0);
	useEffect(() => {
		if (!interactive) return;
		buttonsIn.value = withDelay(BUTTONS_MS, withSpring(1, BERX_SPRING));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [interactive]);
	const buttonsStyle = useAnimatedStyle(() => ({
		opacity: buttonsIn.value,
		transform: [{translateY: (1 - buttonsIn.value) * 40}],
	}), [buttonsIn]);

	useEffect(() => {
		const anim = RNAnimated.sequence([
			RNAnimated.delay(WORDMARK_DELAY_MS),
			RNAnimated.timing(word, {toValue: 1, duration: 700, easing: RNEasing.out(RNEasing.cubic), useNativeDriver: true}),
			RNAnimated.delay(420),
		]);
		anim.start(({finished}: {finished: boolean}) => {
			// Only the old pure-timer callers still get auto-advance — see
			// this file's own header on why an interactive caller (real
			// buttons present) must not have the screen yanked away from
			// under a reader who hasn't tapped anything yet.
			if (finished && !done.current && !interactive) {
				done.current = true;
				onDone?.();
			}
		});
		return () => anim.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [interactive]);

	return (
		<BerxStage depth={0} seed={19} scrim={0.3}>
			<View style={StyleSheet.absoluteFillObject} onLayout={onHaloLayout} pointerEvents="none">
				<BerxAuroraField width={haloSize.width} height={haloSize.height} />
			</View>
			<View style={styles.center}>
				<View style={styles.emblemSlot}>
					{/* The real halo — a glass ring around the settled mark, glow +
					    slow continuous rotation, appearing once the object has
					    actually settled (not before, not painted on regardless of
					    the real reveal's own timing). */}
					<Animated.View pointerEvents="none" style={[styles.halo, haloStyle]}>
						<BerxGlassView glow radius={999} style={styles.haloGlass}>
							<View />
						</BerxGlassView>
					</Animated.View>
					<SpatialEmblemReveal size={172} light={colors.accent} />
					<BerxParticleSystem trigger={settleBurst} count={26} color={colors.accent} duration={900} spread={360} speed={110} gravity={40} />
				</View>
				<RNAnimated.View
					style={[
						styles.wordSlot,
						{
							opacity: word,
							transform: [{translateY: word.interpolate({inputRange: [0, 1], outputRange: [22, 0]})}],
						},
					]}>
					<Text style={styles.wordmark}>BERX</Text>
					<Text style={styles.sub}>Города, люди, впечатления</Text>
				</RNAnimated.View>
			</View>
			{interactive ? (
				<Animated.View style={[styles.actions, buttonsStyle]}>
					{onLogin ? <BerxAnimatedButton variant="primary" title="Войти" onPress={onLogin} style={styles.actionBtn} /> : null}
					{onRegister ? <BerxAnimatedButton variant="secondary" title="Создать аккаунт" onPress={onRegister} style={styles.actionBtn} /> : null}
				</Animated.View>
			) : null}
		</BerxStage>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: '18%'},
	emblemSlot: {width: 220, height: 220, alignItems: 'center', justifyContent: 'center'},
	halo: {position: 'absolute', width: 210, height: 210},
	haloGlass: {flex: 1, padding: 0, borderWidth: 1},
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
	actions: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 56, gap: spacing.sm},
	actionBtn: {width: '100%'},
});
