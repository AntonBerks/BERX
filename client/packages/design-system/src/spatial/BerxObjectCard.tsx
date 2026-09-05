/**
 * BerxObjectCard — the shared body of every BERX domain card.
 *
 * Experiences, trips, collections, communities, creators and rewards
 * are different objects with the same spatial job: a lit card on the
 * content plane carrying media, a title, real counts and one primary
 * action. Sharing this base is what stops six near-identical cards
 * drifting into six different ideas of a card.
 *
 * Domain-specific wrappers live in their own modules and are thin by
 * design — each supplies real fields, none re-implements the surface.
 */
import {Image, StyleSheet, View, type ImageSourcePropType} from 'react-native';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxActionShelf} from './BerxActionShelf';
import {BerxScrim} from './BerxScrim';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxObjectCardFact {
	label: string;
	/** Real server value. Omit the fact rather than render an invented zero. */
	value: string | number;
}

export interface BerxObjectCardProps {
	title: string;
	subtitle?: string;
	body?: string;
	media?: ImageSourcePropType;
	mediaAlt?: string;
	facts?: readonly BerxObjectCardFact[];
	badges?: React.ReactNode;
	actions?: React.ReactNode;
	onPress?: () => void;
	sharedTag?: string;
	/** Overrides the composed accessible name when the domain has a better sentence. */
	accessibilityLabel?: string;
	testID?: string;
}

export function BerxObjectCard({
	title,
	subtitle,
	body,
	media,
	mediaAlt,
	facts,
	badges,
	actions,
	onPress,
	sharedTag,
	accessibilityLabel,
	testID,
}: BerxObjectCardProps) {
	const {scene} = useBerxScene();
	const label =
		accessibilityLabel ??
		[title, subtitle, ...(facts ?? []).map((f) => `${f.label}: ${f.value}`)].filter(Boolean).join(', ');

	return (
		<BerxSpatialCard depth="D3" onPress={onPress} accessibilityLabel={onPress ? label : undefined} padding={0} sharedTag={sharedTag} testID={testID}>
			{media ? (
				/* the image belongs to the object rather than sitting on it:
				   it ramps into the card's own surface at its lower edge, so
				   the title below reads as the same thing continuing */
				<View style={styles.mediaWrap}>
					<Image
						source={media}
						resizeMode="cover"
						accessible={mediaAlt !== undefined}
						accessibilityLabel={mediaAlt}
						style={styles.media}
					/>
					<BerxScrim color={scene.background} strength={0.82} textStart={0.72} id={`berx-card-scrim-${testID ?? title}`} />
				</View>
			) : null}
			<View style={styles.body}>
				{badges ? <View style={styles.badges}>{badges}</View> : null}
				<BerxText role="subtitle" numberOfLines={2}>
					{title}
				</BerxText>
				{subtitle ? <BerxText role="meta" emphasis="secondary" numberOfLines={1}>{subtitle}</BerxText> : null}
				{body ? (
					<BerxText role="body" emphasis="secondary" numberOfLines={3}>
						{body}
					</BerxText>
				) : null}
				{facts && facts.length > 0 ? (
					<View style={styles.facts} accessibilityRole="list">
						{facts.map((f) => (
							<View key={f.label} style={styles.fact} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
								<BerxText role="heading">{f.value}</BerxText>
								<BerxText role="meta" emphasis="tertiary">{f.label}</BerxText>
							</View>
						))}
					</View>
				) : null}
				{/* actions are promoted to the control plane, attached to
				    the card rather than floating over it — see
				    BerxActionShelf */}
				{actions ? <BerxActionShelf inset={spacing.lg}>{actions}</BerxActionShelf> : null}
			</View>
		</BerxSpatialCard>
	);
}

const styles = StyleSheet.create({
	mediaWrap: {width: '100%', height: 148},
	media: {...StyleSheet.absoluteFillObject},
	body: {padding: spacing.lg, gap: spacing.xs},
	badges: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: 2},
	facts: {flexDirection: 'row', gap: spacing.xl, paddingTop: spacing.sm, flexWrap: 'wrap'},
	fact: {gap: 1},
});
