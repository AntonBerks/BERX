/**
 * BerxPlaceCard — a place on the content plane.
 *
 * Distance is only shown when the caller actually has coordinates to
 * measure from; a card that always says "рядом" is a claim the data
 * has not made. `placePin` is the shared element, so opening a place
 * carries the same object into the detail scene.
 */
import {Image, StyleSheet, View, type ImageSourcePropType} from 'react-native';
import {sharedElementTag} from '@berx/spatial';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxPlaceRating} from './BerxPlaceRating';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxPlaceCardProps {
	placeGuid: number;
	name: string;
	category?: string;
	cover?: ImageSourcePropType;
	rating?: number;
	ratingCount?: number;
	/** Metres from the viewer. Omitted when no real location is available. */
	distanceM?: number;
	/** Real open/closed, or undefined when the hours are unstructured. */
	openNow?: boolean;
	onPress: () => void;
	trailing?: React.ReactNode;
	testID?: string;
}

function formatDistance(m: number): string {
	return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} км`;
}

export function BerxPlaceCard({
	placeGuid,
	name,
	category,
	cover,
	rating,
	ratingCount = 0,
	distanceM,
	openNow,
	onPress,
	trailing,
	testID,
}: BerxPlaceCardProps) {
	const meta = [category, distanceM !== undefined ? formatDistance(distanceM) : undefined, openNow === undefined ? undefined : openNow ? 'открыто' : 'закрыто']
		.filter(Boolean)
		.join(' · ');

	return (
		<BerxSpatialCard
			depth="D3"
			onPress={onPress}
			accessibilityLabel={[name, meta, rating !== undefined && ratingCount > 0 ? `рейтинг ${rating.toFixed(1)}` : undefined].filter(Boolean).join(', ')}
			padding={0}
			sharedTag={sharedElementTag('placePin', placeGuid)}
			testID={testID}>
			<View style={styles.row}>
				{cover ? <Image source={cover} resizeMode="cover" accessible={false} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbEmpty]} />}
				<View style={styles.text}>
					<BerxText role="callout" numberOfLines={1}>
						{name}
					</BerxText>
					{meta ? (
						<BerxText role="meta" emphasis="secondary" numberOfLines={1}>
							{meta}
						</BerxText>
					) : null}
					<BerxPlaceRating average={rating} count={ratingCount} compact />
				</View>
				{trailing}
			</View>
		</BerxSpatialCard>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'center'},
	thumb: {width: 72, height: 72, borderRadius: 16},
	thumbEmpty: {backgroundColor: 'rgba(255,255,255,0.05)'},
	text: {flex: 1, gap: 3},
});
