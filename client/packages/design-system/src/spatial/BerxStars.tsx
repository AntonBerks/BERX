/**
 * BerxStars — a rating, drawn.
 *
 * Reviews rendered their rating as `'★'.repeat(n) + '☆'.repeat(5-n)`.
 * That is a string of glyphs from whatever font the platform happens
 * to resolve, at whatever weight and baseline that font gives them,
 * beside an icon set drawn on a 24 grid at a 1.7 stroke — so the one
 * place in BERX where a number becomes a picture was the one place
 * not using BERX's own drawings.
 *
 * Cyan is stateful by contract, so the filled stars are active and
 * the rest are neutral: an unset star is not a dimmer accent, it is
 * not accented at all.
 *
 * It announces the rating as a number. Five separate star glyphs read
 * aloud one after another tell a screen-reader user nothing.
 */
import {StyleSheet, View} from 'react-native';
import {BerxIcon} from '../icons';

export interface BerxStarsProps {
	/** Whole stars filled, 0..max. */
	value: number;
	max?: number;
	size?: number;
	testID?: string;
}

export function BerxStars({value, max = 5, size = 14, testID}: BerxStarsProps) {
	const filled = Math.max(0, Math.min(max, Math.round(value)));
	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="image"
			accessibilityLabel={`Оценка ${filled} из ${max}`}
			style={styles.row}>
			{Array.from({length: max}, (_, i) => (
				<BerxIcon key={i} name="star" size={size} state={i < filled ? 'active' : 'disabled'} decorative />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', alignItems: 'center', gap: 1},
});
