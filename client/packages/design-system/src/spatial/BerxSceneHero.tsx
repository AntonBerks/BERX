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
				{/* scrim strong enough that D3/D4 text keeps its contrast over any image */}
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: rgba(scene.background, media ? 0.55 : 0.86)}]} />
				<View style={[StyleSheet.absoluteFillObject, {backgroundColor: atmosphere.lighting.accentGlow}]} />
				<View style={[styles.bottomScrim, {backgroundColor: rgba(scene.background, 0.92)}]} />
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
	bottomScrim: {position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', opacity: 0.85},
	content: {padding: spacing.lg, gap: spacing.sm},
	badges: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
	title: {color: colors.text, fontSize: typography.sizeHero, fontWeight: typography.weightBold, lineHeight: typography.sizeHero * 1.15},
	meta: {color: colors.textDim, fontSize: typography.sizeBase},
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', paddingTop: spacing.xs},
});
