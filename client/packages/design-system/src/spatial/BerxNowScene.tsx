/**
 * BerxNowScene — the NOW family's spatial container.
 *
 * NOW is the one family whose subject is time, so its scene is built
 * around the energy layer: a live pulse at D5, the surroundings rail
 * at D3, and an explicit, honest statement of what the location data
 * can and cannot answer.
 *
 * There is no map. react-native-maps is not installed and no tile
 * provider is configured, so a map frame here would be an empty box
 * that implies a feature. The same real coordinates drive a ranked
 * distance list instead, which is a smaller promise that BERX can
 * actually keep.
 */
import {StyleSheet, View} from 'react-native';
import {BerxDepthLayer} from './BerxDepthLayer';
import {BerxEnergyHalo} from './BerxEnergyHalo';
import {BerxNowRail, type BerxNowItem} from './BerxNowRail';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';
import {berxPlural} from '@berx/domain';

export interface BerxNowSceneProps {
	items: readonly BerxNowItem[];
	/** Real count of things happening now, from the server. */
	liveCount: number;
	/**
	 * How many of the returned places have structured opening hours.
	 * /api/v1/nearby answers is_open_now per place from
	 * ossn_place_hours, and returns null for a place that has none —
	 * "unknown" and "closed" are different facts, and a place with
	 * unknown hours is never hidden by the open-now filter. The scene
	 * says so out loud when some places cannot answer.
	 */
	placesWithoutHours: number;
	/** Set when the viewer has supplied real coordinates. */
	hasLocation: boolean;
	header?: React.ReactNode;
	testID?: string;
}

export function BerxNowScene({items, liveCount, placesWithoutHours, hasLocation, header, testID}: BerxNowSceneProps) {

	return (
		<View testID={testID} style={styles.root}>
			{header}

			{/* D5 — the energy layer, the only place that emits */}
			<BerxDepthLayer depth="D5" decorative={false} style={styles.pulseLayer}>
				<View style={styles.pulse}>
					<BerxEnergyHalo size={76} intensity={liveCount > 0 ? Math.min(1, 0.4 + liveCount / 12) : 0.15} />
					<View style={styles.pulseText}>
						<BerxText role="numeric" emphasis="accent" liveRegion="polite">
							{String(liveCount)}
						</BerxText>
						{/* three Russian forms, not two: "2 событий" is wrong,
						    and a live counter that prints the wrong word is
						    the first thing anybody notices about it */}
						<BerxText role="meta" emphasis="secondary">{`${berxPlural(liveCount, 'событие', 'события', 'событий')} сейчас`}</BerxText>
					</View>
				</View>
			</BerxDepthLayer>

			{/* D3 — the surroundings */}
			{hasLocation ? (
				<BerxNowRail items={items} />
			) : (
				<BerxText role="meta" emphasis="tertiary" style={styles.note}>Укажите координаты, чтобы увидеть, что происходит рядом.</BerxText>
			)}

			{/* the honest limit, stated rather than hidden */}
			{placesWithoutHours > 0 ? (
				<BerxText role="meta" emphasis="tertiary" style={styles.note}>
					У {placesWithoutHours} мест не указаны часы работы — для них статус «открыто сейчас» неизвестен, и фильтр их
					не скрывает.
				</BerxText>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.lg},
	pulseLayer: {alignItems: 'center'},
	pulse: {alignItems: 'center', justifyContent: 'center', height: 96},
	pulseText: {position: 'absolute', alignItems: 'center'},
	note: {paddingHorizontal: spacing.lg},
});
