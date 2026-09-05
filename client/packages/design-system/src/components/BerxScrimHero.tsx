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
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';
import {BerxText} from '../spatial/BerxText';

export interface BerxScrimHeroProps {
	imageUrl: string | null;
	title: string;
	subtitle?: string;
	badge?: React.ReactNode;
	height?: number;
	children?: React.ReactNode;
}

const SCRIM_STEPS = [0, 0.15, 0.35, 0.6, 0.92];

export function BerxScrimHero({imageUrl, title, subtitle, badge, height = 280, children}: BerxScrimHeroProps) {
	return (
		<View style={[styles.wrap, {height}]}>
			{imageUrl ? (
				<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
			) : (
				<View style={[StyleSheet.absoluteFillObject, styles.fallback]}>
					<BerxText role="display" emphasis="tertiary">{title.charAt(0).toUpperCase()}</BerxText>
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
				<BerxText role="title" numberOfLines={2}>{title}</BerxText>
				{subtitle ? <BerxText role="meta" emphasis="secondary" numberOfLines={1}>{subtitle}</BerxText> : null}
				{children}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {width: '100%', backgroundColor: colors.graphite, justifyContent: 'flex-end'},
	fallback: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	content: {padding: spacing.lg, gap: spacing.xs},
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
