/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX ACTION RAIL — the floating vertical glass column of actions
 * that sits ON immersive media (the signature element across the
 * supplied reference set: a stacked column of circular translucent
 * buttons, each with its real count underneath, pinned to the right
 * edge of the photograph rather than sitting in a toolbar below it).
 *
 * COUNTS ARE REAL OR ABSENT. Each action renders its number only when
 * the caller passes a real one — an action with `count` undefined
 * shows the glyph alone. Nothing here invents a "1.2k".
 *
 * Buttons are glass on top of photography, so they carry their own
 * dark base + hairline rather than relying on the image behind them
 * being dark enough — legibility is not left to chance over an
 * arbitrary photo.
 */
import {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography} from '../tokens';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

export interface BerxRailAction {
	key: string;
	glyph: string;
	/** Real count from the server. Omit entirely rather than passing 0 when the number simply isn't known here. */
	count?: number;
	active?: boolean;
	label?: string;
	onPress?: () => void;
}

export interface BerxActionRailProps {
	actions: BerxRailAction[];
	size?: number;
	style?: ViewStyle;
}

/** Real compact formatting — 1200 -> "1,2K". Never rounds a number up to look bigger. */
export function formatCount(n: number): string {
	if (n < 1000) {
		return String(n);
	}
	if (n < 1000000) {
		const k = n / 1000;
		return `${k < 10 ? k.toFixed(1).replace('.', ',') : Math.floor(k)}K`;
	}
	const m = n / 1000000;
	return `${m < 10 ? m.toFixed(1).replace('.', ',') : Math.floor(m)}M`;
}

export function BerxActionRail({actions, size = 44, style}: BerxActionRailProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={[styles.rail, style]}>
			{actions.map((a: BerxRailAction) => (
				<View key={a.key} style={styles.slot}>
					<Pressable
						onPress={a.onPress}
						disabled={!a.onPress}
						style={[styles.button, {width: size, height: size, borderRadius: size / 2}, a.active && styles.buttonActive]}>
						<Text style={[styles.glyph, a.active && styles.glyphActive]}>{a.glyph}</Text>
					</Pressable>
					{typeof a.count === 'number' ? (
						<Text style={styles.count}>{formatCount(a.count)}</Text>
					) : a.label ? (
						<Text style={styles.count}>{a.label}</Text>
					) : null}
				</View>
			))}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	rail: {alignItems: 'center', gap: spacing.md},
	slot: {alignItems: 'center', gap: 3},
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(7,8,10,0.42)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.18)',
	},
	buttonActive: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
	glyph: {color: colors.onMedia, fontSize: 17},
	glyphActive: {color: colors.accent},
	count: {color: colors.onMediaDim, fontSize: 11, fontWeight: typography.weightMedium},
});
