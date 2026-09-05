/**
 * BerxPartialNotice — "this part did not load", said out loud.
 *
 * A screen that loads several things can succeed at most of them and
 * fail at one, and the honest answer is neither an error screen nor
 * silence. BERX was choosing silence: a failed stories feed rendered
 * as an empty rail, indistinguishable from having no stories, and a
 * failed unread count rendered as zero, which is not a degradation but
 * a wrong number.
 *
 * This is the third answer. The screen keeps its content, and the part
 * that failed says so where it would have been, with a retry for
 * itself alone. It is the archive's "partial data" state — not one of
 * the seven whole-screen states, because the screen is not in it; one
 * region is.
 *
 * It sits on the control plane, because it carries an action, and it
 * is announced as an alert so it is not silence for a screen-reader
 * user either.
 */
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {BERX_V9_TOUCH} from '@berx/spatial';
import {colors, radius, spacing, typography} from '../tokens';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxPartialNoticeProps {
	/** What is missing, in the screen's own words. Never "something went wrong". */
	message: string;
	onRetry?: () => void;
	retryLabel?: string;
	testID?: string;
}

export function BerxPartialNotice({message, onRetry, retryLabel = 'Повторить', testID}: BerxPartialNoticeProps) {
	const {scene} = useBerxScene();
	const controls = scene.layers.D4;

	return (
		<View
			testID={testID}
			accessibilityRole="alert"
			accessibilityLabel={message}
			style={[
				styles.root,
				{
					backgroundColor: controls.surface.backgroundColor,
					borderColor: controls.surface.borderColor,
				},
			]}>
			<View pointerEvents="none" style={[styles.edge, {backgroundColor: controls.surface.edgeHighlightColor}]} />
			<Text style={styles.message}>{message}</Text>
			{onRetry ? (
				<Pressable
					onPress={onRetry}
					accessibilityRole="button"
					accessibilityLabel={`${retryLabel}: ${message}`}
					style={styles.retry}>
					<Text style={[styles.retryText, {color: scene.accent}]}>{retryLabel}</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.md,
		borderWidth: 1,
		overflow: 'hidden',
	},
	edge: {position: 'absolute', top: 0, left: 0, right: 0, height: 1},
	message: {flex: 1, color: colors.textDim, fontSize: typography.sizeSm},
	retry: {minHeight: BERX_V9_TOUCH.preferredDp - 12, justifyContent: 'center', paddingHorizontal: spacing.sm},
	retryText: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
});
