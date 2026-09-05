/**
 * BerxPlaceRating — a real average over a real count.
 *
 * A rating with no reviews is not shown as "0.0" (which reads as a
 * bad place); it renders the honest "нет оценок". The count is always
 * shown next to the average, because an average of one review and an
 * average of two hundred are not the same claim.
 */
import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxIcon} from '../icons';
import {colors, spacing, typography} from '../tokens';

export interface BerxPlaceRatingProps {
	/** Server average, or undefined when there are no reviews. */
	average?: number;
	count: number;
	compact?: boolean;
	testID?: string;
}

export function BerxPlaceRating({average, count, compact, testID}: BerxPlaceRatingProps) {
	const {scene} = useBerxScene();

	if (average === undefined || count === 0) {
		return (
			<Text testID={testID} accessibilityLabel="Оценок пока нет" style={styles.empty}>
				Нет оценок
			</Text>
		);
	}

	const rounded = Math.round(average * 10) / 10;
	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="text"
			accessibilityLabel={`Рейтинг ${rounded} из 5, отзывов: ${count}`}
			style={[styles.root, compact ? null : {backgroundColor: rgba(scene.accent, 0.1), borderColor: rgba(scene.accent, 0.3), borderWidth: 1}]}>
			{/* the icon set's own star at the type's own size, not a
			    glyph from whatever font the platform resolves */}
			<BerxIcon name="star" size={13} state="active" decorative />
			<Text style={styles.value}>{rounded.toFixed(1)}</Text>
			<Text style={styles.count}>({count})</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start'},
	value: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	count: {color: colors.textDim, fontSize: typography.sizeXs},
	empty: {color: colors.textFaint, fontSize: typography.sizeSm},
});
