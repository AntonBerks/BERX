/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * These four cover the "every screen needs loading/error/empty state"
 * requirement — real components, not a checklist item left unbuilt.
 */
import {useEffect, useRef} from 'react';
import {View, Text, ActivityIndicator, Animated, StyleSheet} from 'react-native';
import {colors, spacing, radius, typography} from '../tokens';
import {BerxButton} from './BerxButton';

export function BerxLoadingState({label}: {label?: string}) {
	return (
		<View style={styles.center}>
			<ActivityIndicator color={colors.accent} size="large" />
			{label ? <Text style={styles.dimText}>{label}</Text> : null}
		</View>
	);
}

export function BerxErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
	return (
		<View style={styles.center}>
			<Text style={styles.errorText}>{message}</Text>
			{onRetry ? <BerxButton label="Повторить" variant="secondary" onPress={onRetry} /> : null}
		</View>
	);
}

export function BerxEmptyState({title, subtitle}: {title: string; subtitle?: string}) {
	return (
		<View style={styles.center}>
			<Text style={styles.emptyTitle}>{title}</Text>
			{subtitle ? <Text style={styles.dimTextSmall}>{subtitle}</Text> : null}
		</View>
	);
}

/** Pulsing placeholder block — used for a list of these while real content loads, instead of a bare spinner on content-heavy screens (feed, profile). */
export function BerxSkeleton({width = '100%', height = 16, style}: {width?: number | string; height?: number; style?: object}) {
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

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
		gap: spacing.md,
	},
	dimText: {color: colors.textDim, fontSize: typography.sizeBase},
	dimTextSmall: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	errorText: {color: colors.danger, fontSize: typography.sizeBase, textAlign: 'center'},
	emptyTitle: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	skeleton: {
		backgroundColor: colors.glass2,
		borderRadius: radius.sm,
	},
});
