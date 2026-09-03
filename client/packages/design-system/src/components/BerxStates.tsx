/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX STATES — the four moments every screen in the product passes
 * through: working, empty, failed, done. They are in ONE file and share
 * ONE skeleton on purpose, because they are the parts of the product
 * users see most and notice least, and the fastest way to make an app
 * feel cheap is to let them drift apart.
 *
 * THE SHARED SKELETON: an object, a title, a quiet line under it, and
 * at most one action. Every state fills the same four slots in the same
 * rhythm, so moving from "loading" to "empty" to "failed" is one
 * element changing rather than the screen being rebuilt.
 *
 * WHAT THE OBJECT IS. All four use BerxOrb — the real BERX identity
 * object, the same one Profile/BERX ID and every spatial hero uses. The
 * state is carried by the LIGHT falling on it, not by swapping in a
 * different picture: alive and breathing while working, cool and still
 * when there is nothing here, a dim warning ember when something broke,
 * a confirming glow when it worked. That is the same idea the 3D engine
 * runs on, where SPATIAL_EMISSIVE encodes meaning as light on one
 * shared object. One object, four lights, no new assets.
 *
 * WHAT THIS REPLACED, AND WHY IT WAS WRONG:
 *  - loading was the platform's bare <ActivityIndicator> — the OS
 *    default spinner, the single most generic object it is possible to
 *    put on a screen, and it was what EVERY screen showed while it
 *    loaded.
 *  - error was a wall of pure red body text. It was the largest thing
 *    on the screen and the only saturated red anywhere in the product,
 *    so a routine "no connection" read like a system fault. Now the
 *    message is ordinary readable text at title weight and the red is
 *    spent on the ember and one hairline — an accent, not the medium.
 *    A failure the user can fix should be legible first and alarming
 *    second.
 */
import {useEffect, useRef, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, Text, Animated, Easing, StyleSheet} from 'react-native';
import {spacing, radius, typography, motion} from '../tokens';
import {BerxButton} from './BerxButton';
import {BerxOrb} from './BerxOrb';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

/** The slot every state's object sits in, so all four line up vertically. */
const OBJECT_SIZE = 72;

/**
 * The one layout all four states are built from. Not exported: states
 * are a closed set, and a fifth one should be added here as a named
 * state rather than assembled ad hoc by a screen.
 */
function StateFrame({object, title, subtitle, action}: {object: ReactNode; title?: string; subtitle?: string; action?: ReactNode}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.center}>
			<View style={styles.objectSlot}>{object}</View>
			{title ? <Text style={styles.title}>{title}</Text> : null}
			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
			{action ? <View style={styles.actionSlot}>{action}</View> : null}
		</View>
	);
}

/**
 * A slow scale + opacity cycle on the breath token.
 *
 * Deliberately calm: a fast spinner reads as anxiety, a slow breath
 * reads as composure. `still` freezes it at the settled end for the
 * states where the object is present but not working — an empty shelf
 * is not busy, and animating it would say otherwise.
 */
function useBreath(still = false) {
	const breath = useRef(new Animated.Value(still ? 1 : 0)).current;
	useEffect(() => {
		if (still) return;
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(breath, {toValue: 1, duration: motion.durationBreath, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
				Animated.timing(breath, {toValue: 0, duration: motion.durationBreath, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
			])
		);
		loop.start();
		return () => loop.stop();
	}, [breath, still]);
	return breath;
}

function BreathingOrb({light, dim = 1, still = false}: {light: string; dim?: number; still?: boolean}) {
	const breath = useBreath(still);
	return (
		<Animated.View
			style={{
				opacity: still ? dim : breath.interpolate({inputRange: [0, 1], outputRange: [0.55 * dim, dim]}),
				transform: [{scale: breath.interpolate({inputRange: [0, 1], outputRange: [0.94, 1.02]})}],
			}}>
			<BerxOrb size={OBJECT_SIZE} light={light} />
		</Animated.View>
	);
}

export function BerxLoadingState({label}: {label?: string}) {
	const colors = useBerxColors();
	// The one state whose object is genuinely working, so it is the one
	// that breathes.
	return <StateFrame object={<BreathingOrb light={colors.accent} />} subtitle={label} />;
}

/**
 * Nothing here yet — which is a neutral fact, not a failure. The object
 * is present and unlit rather than absent: the shelf exists, it is
 * empty. Held still, and without its ring, so it reads as dormant next
 * to the loading state's identical-but-alive orb.
 */
export function BerxEmptyState({title, subtitle}: {title: string; subtitle?: string}) {
	const colors = useBerxColors();
	return <StateFrame object={<BreathingOrb light={colors.textDim} dim={0.5} still />} title={title} subtitle={subtitle} />;
}

/**
 * Something broke. The message is the TITLE — ordinary readable ink at
 * title weight, because the user has to be able to read it — and the
 * danger colour is spent on the ember in the object and the hairline
 * under it, where it marks the state without shouting it.
 */
export function BerxErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<StateFrame
			object={
				<View style={styles.markedObject}>
					<BreathingOrb light={colors.danger} dim={0.6} still />
					<View style={styles.dangerRule} />
				</View>
			}
			title={message}
			action={onRetry ? <BerxButton label="Повторить" variant="secondary" onPress={onRetry} /> : null}
		/>
	);
}

/**
 * It worked. Still — a success that keeps moving reads as still
 * working. Exists because "loading / empty / error" without it means
 * every screen invents its own confirmation, which is exactly the drift
 * this file is here to prevent.
 */
export function BerxSuccessState({title, subtitle, action}: {title: string; subtitle?: string; action?: ReactNode}) {
	const colors = useBerxColors();
	return <StateFrame object={<BreathingOrb light={colors.success} still />} title={title} subtitle={subtitle} action={action} />;
}

/** Pulsing placeholder block — used for a list of these while real content loads, instead of a bare spinner on content-heavy screens (feed, profile). */
export function BerxSkeleton({width = '100%', height = 16, style}: {width?: number | string; height?: number; style?: object}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const opacity = useRef(new Animated.Value(0.3)).current;
	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {toValue: 0.7, duration: 700, useNativeDriver: true}),
				Animated.timing(opacity, {toValue: 0.3, duration: 700, useNativeDriver: true}),
			])
		);
		loop.start();
		return () => loop.stop();
	}, [opacity]);

	return (
		<Animated.View
			style={[
				styles.skeleton,
				{width: width as never, height, opacity},
				style,
			]}
		/>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
	},
	// A fixed slot rather than letting each object set the rhythm, so the
	// title sits at the same height in all four states and switching
	// between them does not shift the page.
	objectSlot: {
		height: OBJECT_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: spacing.xl,
	},
	markedObject: {alignItems: 'center'},
	// The whole danger budget for the state: one hairline under the ember.
	dangerRule: {
		width: 28,
		height: 2,
		borderRadius: radius.pill,
		backgroundColor: colors.danger,
		marginTop: spacing.sm,
	},
	title: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightMedium,
		textAlign: 'center',
		maxWidth: 300,
	},
	subtitle: {
		color: colors.textFaint,
		fontSize: typography.sizeSm,
		lineHeight: 20,
		textAlign: 'center',
		marginTop: spacing.sm,
		maxWidth: 280,
	},
	// The action gets real air above it. A retry button crowded against
	// the message it retries reads as part of the message.
	actionSlot: {marginTop: spacing.xl},
	skeleton: {
		backgroundColor: colors.glass2,
		borderRadius: radius.sm,
	},
});
