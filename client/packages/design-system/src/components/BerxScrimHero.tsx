/**
 * The cinematic hero: real media, with the falloff that lets the type
 * be read over it.
 *
 * The falloff used to be five stacked absolute Views at 0, 15, 35, 60
 * and 92 per cent, because when this was written no gradient library
 * was installed. That constraint is gone — react-native-svg is a real
 * dependency the icon set, the atmosphere and every BERX surface
 * already use — and five hard steps across a photograph are five
 * visible bands, not a gradient. It uses BerxScrim now: the same
 * falloff every other BERX object gets, in the scene's own substrate
 * colour, so the image darkens into the room rather than into a
 * black rectangle.
 *
 * Outside a scene it falls back to the substrate token rather than
 * throwing, which is what a hero rendered before its scene exists
 * actually needs.
 */
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {colors, spacing, typography, radius} from '../tokens';
import {BerxText} from '../spatial/BerxText';
import {BerxScrim} from '../spatial/BerxScrim';
import {BerxMediaWell} from '../spatial/BerxMediaWell';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';

export interface BerxScrimHeroProps {
	imageUrl: string | null;
	title: string;
	subtitle?: string;
	badge?: React.ReactNode;
	height?: number;
	children?: React.ReactNode;
}

export function BerxScrimHero({imageUrl, title, subtitle, badge, height = 280, children}: BerxScrimHeroProps) {
	const scene = useBerxSceneOptional();

	return (
		<View style={[styles.wrap, {height}]}>
			{imageUrl ? (
				<Image source={{uri: imageUrl}} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
			) : (
				/* a hero with no photograph is a recess in the room lit by
				   the room, carrying the object's own initial — not a slab
				   of grey with a letter on it */
				<BerxMediaWell radius={0} style={StyleSheet.absoluteFillObject}>
					<BerxText role="display" emphasis="tertiary">{title.charAt(0).toUpperCase()}</BerxText>
				</BerxMediaWell>
			)}
			<BerxScrim
				color={scene?.scene.background ?? colors.bg}
				strength={0.94}
				textStart={imageUrl ? 0.46 : 0.2}
				id={`berx-scrim-hero-${title}`}
			/>
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
	wrap: {width: '100%', justifyContent: 'flex-end'},
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
