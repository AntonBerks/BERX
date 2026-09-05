/**
 * The states thirty-seven screens share.
 *
 * They used to be centred text on whatever was behind them. In a lit
 * room that reads as nothing at all: a sentence floating in the
 * middle of a space, with no object holding it and nothing to
 * separate a failure from a blank. An error and an empty are both
 * things the person has to act on, so both are objects — the
 * structure plane's own surface, standing in the room, taking the
 * light that reaches their corner and flattening against what is
 * actually behind them.
 *
 * Loading stays centred and unboxed on purpose: a card drawn around a
 * spinner is a card the content will replace a moment later, and the
 * room behind it is already saying that the scene exists.
 *
 * Outside a scene all three keep the flat look rather than throwing —
 * an auth screen's first frame exists before the scene does.
 */
import React, {useEffect, useRef} from 'react';
import {View, ActivityIndicator, Animated, StyleSheet} from 'react-native';
import {colors, spacing, radius} from '../tokens';
import {BerxButton} from './BerxButton';
import {BerxText} from '../spatial/BerxText';
import {BerxSurface} from '../spatial/BerxSurface';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';
import {useBerxRoomLight} from '../spatial/useBerxRoomLight';

export function BerxLoadingState({label}: {label?: string}) {
	const scene = useBerxSceneOptional();
	/* the scene's own accent, not the token. Every loading state in
	   BERX was the same cyan whatever colour world the screen was in —
	   which is the one thing the Color World system exists to prevent.
	   Outside a scene the token is the honest answer. */
	return (
		<View style={styles.center}>
			<ActivityIndicator color={scene?.scene.accent ?? colors.accent} size="large" />
			{label ? <BerxText role="body" emphasis="secondary">{label}</BerxText> : null}
		</View>
	);
}

export function BerxErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
	return (
		<StateObject tone="danger">
			<BerxText role="callout" style={styles.errorText}>
				{message}
			</BerxText>
			{onRetry ? <BerxButton label="Повторить" variant="secondary" onPress={onRetry} /> : null}
		</StateObject>
	);
}

export function BerxEmptyState({title, subtitle}: {title: string; subtitle?: string}) {
	return (
		<StateObject>
			<BerxText role="heading" heading>
				{title}
			</BerxText>
			{subtitle ? (
				<BerxText role="body" emphasis="secondary" style={styles.dimTextSmall}>
					{subtitle}
				</BerxText>
			) : null}
		</StateObject>
	);
}

/**
 * The object a state stands in.
 *
 * The structure plane, because that is what a state is: architecture
 * holding a message, not content. A destructive one carries the
 * danger colour on its leading edge rather than in its fill — a red
 * panel reads as an alarm, and most of these are "we could not reach
 * the server", which is not one.
 */
function StateObject({children, tone}: {children: React.ReactNode; tone?: 'danger'}) {
	const scene = useBerxSceneOptional();
	const light = useBerxRoomLight();

	if (!scene) {
		return <View style={styles.center}>{children}</View>;
	}

	const structure = scene.scene.layers.D2;
	return (
		<View style={styles.center}>
			<View ref={light.measure} onLayout={light.onLayout} style={styles.objectWrap}>
				<BerxSurface
					surface={structure.surface}
					lighting={structure.lighting}
					radius={22}
					illumination={light.illumination}
					behind={light.behind}
					style={tone === 'danger' ? {borderLeftWidth: 2, borderLeftColor: colors.danger} : undefined}>
					<View style={styles.objectBody}>{children}</View>
				</BerxSurface>
			</View>
		</View>
	);
}

/**
 * Pulsing placeholder block — used for a list of these while real
 * content loads, instead of a bare spinner on content-heavy screens
 * (feed, profile).
 *
 * The block is the shape the content will have, so it is painted in
 * the plane that content will stand on rather than in a fixed grey:
 * a skeleton in a colour belonging to no plane announces itself as a
 * placeholder before the eye has read anything.
 */
export function BerxSkeleton({width = '100%', height = 16, style}: {width?: number | string; height?: number; style?: object}) {
	const scene = useBerxSceneOptional();
	const fill = scene?.scene.layers.D3.surface.backgroundColor ?? colors.glass2;
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
				{width: width as never, height, opacity, backgroundColor: fill},
				style,
			]}
		/>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
		gap: spacing.md,
	},
	dimTextSmall: {textAlign: 'center'},
	/* the object holds the message; it does not stretch to the frame */
	objectWrap: {maxWidth: 420, width: '100%'},
	objectBody: {padding: spacing.xl, gap: spacing.md, alignItems: 'center'},
	errorText: {color: colors.danger, textAlign: 'center'},
	skeleton: {
		borderRadius: radius.sm,
	},
});
