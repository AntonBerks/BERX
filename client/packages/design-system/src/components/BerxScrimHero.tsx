/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Cinematic hero image with bottom-anchored legibility scrim. No
 * gradient library is installed (no expo-linear-gradient — same npm
 * constraint as every native module this session), so the scrim is
 * simulated with 5 stacked, increasingly-opaque absolute Views
 * rather than a real gradient shader. Visually reads as a gradient
 * at normal viewing distance; documented here as the honest reason
 * it's not one, not left unexplained.
 */
import React, {useMemo} from 'react';
import {View, Image, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';

import {useBerxColors} from '../theme';
import {BerxScrim} from './BerxScrim';
import type {BerxColorTokens} from '../tokens';

export interface BerxScrimHeroProps {
	imageUrl: string | null;
	title: string;
	subtitle?: string;
	badge?: React.ReactNode;
	height?: number;
	/**
	 * BERX WORLD TRANSFORMATION — fill the parent's available space
	 * (flex: 1) instead of a fixed pixel height. Added for
	 * DatingDiscoverScreen's full-bleed card (its whole screen height
	 * minus the top bar and bottom panel, not a fixed number) rather
	 * than hand-rolling a second hero implementation for one caller.
	 * `height` is ignored when this is set.
	 */
	fill?: boolean;
	children?: React.ReactNode;
}


export function BerxScrimHero({imageUrl, title, subtitle, badge, height = 280, fill, children}: BerxScrimHeroProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={[styles.wrap, fill ? styles.fill : {height}]}>
			{imageUrl ? (
				<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
			) : (
				<View style={[StyleSheet.absoluteFillObject, styles.fallback]}>
					<Text style={styles.fallbackGlyph}>{title.charAt(0).toUpperCase()}</Text>
				</View>
			)}
			<BerxScrim coverage={0.68} strength={0.92} />
			<View style={styles.content}>
				{badge}
				<Text style={styles.title} numberOfLines={2}>{title}</Text>
				{subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
				{children}
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {width: '100%', backgroundColor: colors.mediaScrim, justifyContent: 'flex-end'},
	fill: {flex: 1},
	fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mediaScrim},
	fallbackGlyph: {fontSize: typography.sizeHero, color: colors.onMediaFaint, fontWeight: typography.weightBold},
	content: {padding: spacing.lg, gap: spacing.xs},
	title: {fontSize: typography.sizeTitle, color: colors.onMedia, fontWeight: typography.weightBold, letterSpacing: -0.3},
	subtitle: {fontSize: typography.sizeSm, color: colors.onMediaDim},
});

export const scrimBadgeStyles = StyleSheet.create({
	badge: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		backgroundColor: 'rgba(5,5,5,0.55)',
		borderWidth: 1,
		borderColor: colors.glassBusinessBorder,
	},
	badgeText: {fontSize: typography.sizeXs, color: colors.onMedia, fontWeight: typography.weightMedium},
	badgeTextAccent: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
});
