/**
 * BerxPlaceHours — opening hours, and an honest answer about "open now".
 *
 * BERX stores structured weekly intervals for places that have them
 * and free text for those that do not. Where the intervals exist the
 * open/closed state is computed from the caller-supplied local time;
 * where they do not, the component says the hours are unstructured
 * rather than guessing a state from prose. /api/v1/nearby returns
 * `open_now_available: false` for exactly this reason.
 */
import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {colors, spacing, typography} from '../tokens';

export interface BerxOpeningInterval {
	/** 0 = Sunday, matching Date#getDay. */
	day: number;
	/** Minutes from midnight. */
	openMinute: number;
	closeMinute: number;
}

export interface BerxPlaceHoursProps {
	intervals?: readonly BerxOpeningInterval[];
	/** Free-text hours, when that is all the place has. */
	rawHours?: string;
	/** Local time to evaluate against. Passed in so the result is testable and timezone-explicit. */
	now?: Date;
	testID?: string;
}

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function fmt(minute: number): string {
	const h = Math.floor(minute / 60) % 24;
	const m = minute % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Returns null — not false — when the data cannot answer the
 * question. "Unknown" and "closed" are different facts and must not
 * collapse into one.
 */
export function isOpenNow(intervals: readonly BerxOpeningInterval[] | undefined, now: Date): boolean | null {
	if (!intervals || intervals.length === 0) return null;
	const day = now.getDay();
	const minute = now.getHours() * 60 + now.getMinutes();
	for (const i of intervals) {
		if (i.day !== day) continue;
		/* an interval that ends past midnight closes on the following day */
		const close = i.closeMinute <= i.openMinute ? i.closeMinute + 1440 : i.closeMinute;
		if (minute >= i.openMinute && minute < close) return true;
	}
	return false;
}

export function BerxPlaceHours({intervals, rawHours, now = new Date(), testID}: BerxPlaceHoursProps) {
	const {scene} = useBerxScene();
	const open = isOpenNow(intervals, now);

	return (
		<View testID={testID} style={styles.root}>
			{open === null ? (
				<Text style={styles.unknown}>
					{rawHours ? `Часы работы: ${rawHours}` : 'Часы работы не указаны'}
				</Text>
			) : (
				<View
					accessible
					accessibilityRole="text"
					accessibilityLabel={open ? 'Сейчас открыто' : 'Сейчас закрыто'}
					style={[
						styles.badge,
						{
							backgroundColor: open ? rgba(colors.success, 0.14) : rgba(colors.textDim, 0.12),
							borderColor: open ? rgba(colors.success, 0.4) : scene.layers.D4.surface.borderColor,
						},
					]}>
					<Text style={[styles.badgeText, {color: open ? colors.success : colors.textDim}]}>
						{open ? 'Открыто' : 'Закрыто'}
					</Text>
				</View>
			)}

			{intervals && intervals.length > 0 ? (
				<View accessibilityRole="list" style={styles.list}>
					{[...intervals]
						.sort((a, b) => a.day - b.day || a.openMinute - b.openMinute)
						.map((i, idx) => (
							<Text key={`${i.day}-${idx}`} style={styles.row} accessibilityLabel={`${DAYS[i.day]}: с ${fmt(i.openMinute)} до ${fmt(i.closeMinute)}`}>
								{DAYS[i.day]}  {fmt(i.openMinute)}–{fmt(i.closeMinute)}
							</Text>
						))}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.sm},
	badge: {alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: 999, borderWidth: 1},
	badgeText: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	unknown: {color: colors.textFaint, fontSize: typography.sizeSm},
	list: {gap: 2},
	row: {color: colors.textDim, fontSize: typography.sizeSm},
});
