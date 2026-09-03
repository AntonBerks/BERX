/**
 * BERX TRIP SCENE — 2D spatial fallback.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxTripScene.native.tsx on iOS/Android; the esbuild harness has no
 * `.native.` resolution and always lands here).
 *
 * Same real semantics as the GL scene: z is `day_number`, a real
 * server-assigned field — Day 1 nearest, later days receding, stops
 * sharing a day at the same depth in a small row. Depth carried by
 * scale/opacity falloff instead of a GL camera; a thin ring per day
 * marks the same real boundary the native scene's DayRing does.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxTripStop} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {useBerxColors} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const BOX = 280;
/** How many of the trip's real days are legible in 280px before they compress into mush. */
const VISIBLE_DAYS = 6;

interface Props {
	days: [number, BerxTripStop[]][];
}

export default function BerxTripScene({days}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const shownDays = days.slice(0, VISIBLE_DAYS);

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox}>
				<View style={styles.axis} />
				{shownDays.map(([day, stops], di) => {
					const t = shownDays.length > 1 ? di / (shownDays.length - 1) : 0;
					const y = -t * (BOX * 0.32) + BOX * 0.16;
					const ringWidth = (BOX * 0.62) * (1 - t * 0.55);
					return (
						<View key={day}>
							<View style={[styles.dayRing, {width: ringWidth, top: y + BOX / 2 - ringWidth * 0.14, opacity: 0.9 - t * 0.6}]} />
							<View style={[styles.stopRow, {top: y + BOX / 2}]}>
								{stops.slice(0, 5).map((s: BerxTripStop, i: number) => {
									const size = (s.item_type === 'place' ? 16 : 14) * (1 - t * 0.55);
									const offset = (i - (stops.length - 1) / 2) * (26 * (1 - t * 0.4));
									return (
										<View
											key={s.stop_id}
											style={[
												styles.stop,
												s.item_type !== 'place' && styles.stopEvent,
												{width: size, height: size, borderRadius: s.item_type === 'place' ? size / 2 : 3, opacity: 1 - t * 0.5, transform: [{translateX: offset}]},
											]}
										/>
									);
								})}
							</View>
						</View>
					);
				})}
			</View>
			<Text style={styles.hint}>Глубина — это день маршрута: ближе то, что раньше</Text>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: BOX,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		alignItems: 'center',
	},
	axis: {position: 'absolute', width: 1, height: BOX * 0.55, backgroundColor: colors.accent, opacity: 0.25, top: BOX * 0.18},
	dayRing: {position: 'absolute', height: 1, backgroundColor: colors.accent, alignSelf: 'center'},
	stopRow: {position: 'absolute', flexDirection: 'row', alignSelf: 'center'},
	stop: {backgroundColor: colors.accent},
	stopEvent: {backgroundColor: colors.white},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
});
