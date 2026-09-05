/**
 * BerxPlaceCard — a place on the content plane.
 *
 * A place BERX has a photograph of is that photograph: the card is
 * the picture, and the name, the category, the distance and the
 * rating sit in the picture's own falloff at the bottom of it. A
 * 64px thumbnail beside two lines of text is a directory entry, and
 * PLACES is the family the whole spatial grammar was designed around.
 *
 * A place with no cover keeps the compact row. BERX does not ship a
 * stock photograph to make the two look the same, and a large empty
 * frame is worse than a small honest one.
 *
 * Distance is only shown when the caller actually has coordinates to
 * measure from; a card that always says "рядом" is a claim the data
 * has not made. `placePin` is the shared element, so opening a place
 * carries the same object into the detail scene.
 */
import {StyleSheet, View, type ImageSourcePropType} from 'react-native';
import {sharedElementTag} from '@berx/spatial';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxObjectCard} from './BerxObjectCard';
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

	const label = [name, meta, rating !== undefined && ratingCount > 0 ? `рейтинг ${rating.toFixed(1)}` : undefined]
		.filter(Boolean)
		.join(', ');

	if (cover) {
		return (
			<BerxObjectCard
				title={name}
				subtitle={meta || undefined}
				media={cover}
				mediaAlt={name}
				badges={ratingCount > 0 ? <BerxPlaceRating average={rating} count={ratingCount} compact /> : undefined}
				actions={trailing}
				onPress={onPress}
				accessibilityLabel={label}
				sharedTag={sharedElementTag('placePin', placeGuid)}
				testID={testID}
			/>
		);
	}

	return (
		<BerxSpatialCard
			depth="D3"
			onPress={onPress}
			accessibilityLabel={label}
			padding={0}
			sharedTag={sharedElementTag('placePin', placeGuid)}
			testID={testID}>
			<View style={styles.row}>
				<View style={[styles.thumb, styles.thumbEmpty]} />
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
