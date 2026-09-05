/**
 * BerxSceneHero — the shared hero used by Place, Event and Business.
 *
 * The three heroes differ in what they say, not in how they occupy
 * space: real media at D1 behind a scrim, title and meta at D3, and
 * the actions at D4 where they stay legible over any photograph.
 * Building them on one base keeps that spatial arrangement identical
 * across families instead of three drifting copies.
 */
import {Image, StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxActionShelf} from './BerxActionShelf';
import {BerxSharedElementTarget} from './BerxSharedElement';
import {BerxScrim} from './BerxScrim';
import {colors, spacing, typography} from '../tokens';

export interface BerxSceneHeroProps {
	title: string;
	/** One-line context: category, date, place. Real values only. */
	meta?: string;
	/** Real media. Omitted renders a lit surface, not a stock photo. */
	media?: ImageSourcePropType;
	mediaAlt?: string;
	/** Live/verified/rating chips. */
	badges?: React.ReactNode;
	actions?: React.ReactNode;
	sharedTag?: string;
	height?: number;
	testID?: string;
}

export function BerxSceneHero({
	title,
	meta,
	media,
	mediaAlt,
	badges,
	actions,
	sharedTag,
	height = 260,
	testID,
}: BerxSceneHeroProps) {
	const {scene} = useBerxScene();
	const atmosphere = scene.layers.D1;

	return (
		/* the destination half of the archive's shared element: when the
		   card that opened this scene recorded where it was, the hero
		   travels from there instead of appearing */
		<BerxSharedElementTarget tag={sharedTag ?? ''} testID={testID} style={[styles.root, {height}]}>
			{/* D1 — atmosphere */}
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFillObject}>
				{media ? (
					<Image source={media} resizeMode="cover" accessible={mediaAlt !== undefined} accessibilityLabel={mediaAlt} style={StyleSheet.absoluteFillObject} />
				) : null}
				{/* the media is clear where nothing is written on it and ramps
				    to the room's own colour where the title sits — a falloff,
				    not a sheet laid over the photograph */}
				<BerxScrim
					color={scene.background}
					strength={media ? 0.94 : 0.88}
					textStart={media ? 0.5 : 0.2}
					id={`berx-hero-scrim-${scene.screenId}`}
				/>
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: atmosphere.lighting.accentGlow}]} />
			</View>

			{/* D3 — content */}
			<View style={styles.content}>
				{badges ? <View style={styles.badges}>{badges}</View> : null}
				<Text accessibilityRole="header" style={styles.title} numberOfLines={3}>
					{title}
				</Text>
				{meta ? <Text style={styles.meta}>{meta}</Text> : null}
				{/* D4 — controls */}
				{/* promoted to the control plane and anchored to the hero above it */}
				{actions ? <BerxActionShelf variant="anchored">{actions}</BerxActionShelf> : null}
			</View>
		</BerxSharedElementTarget>
	);
}

const styles = StyleSheet.create({
	root: {justifyContent: 'flex-end', overflow: 'hidden'},
	content: {padding: spacing.lg, gap: spacing.sm},
	badges: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
	title: {color: colors.text, fontSize: typography.sizeHero, fontWeight: typography.weightBold, lineHeight: typography.sizeHero * 1.15},
	meta: {color: colors.textDim, fontSize: typography.sizeBase},
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', paddingTop: spacing.xs},
});
