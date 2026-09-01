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

const SCRIM_STEPS = [0, 0.15, 0.35, 0.6, 0.92];

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
			<View style={StyleSheet.absoluteFillObject}>
				{SCRIM_STEPS.map((opacity, i) => (
					<View
						key={i}
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: 0,
							height: `${100 - i * 18}%`,
							backgroundColor: `rgba(5,5,5,${opacity})`,
						}}
					/>
				))}
			</View>
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
	wrap: {width: '100%', backgroundColor: colors.graphite, justifyContent: 'flex-end'},
	fill: {flex: 1},
	fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	fallbackGlyph: {fontSize: typography.sizeHero, color: colors.textFaint, fontWeight: typography.weightBold},
	content: {padding: spacing.lg, gap: spacing.xs},
	title: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold, letterSpacing: -0.3},
	subtitle: {fontSize: typography.sizeSm, color: colors.textDim},
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
	badgeText: {fontSize: typography.sizeXs, color: colors.white, fontWeight: typography.weightMedium},
	badgeTextAccent: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
});
