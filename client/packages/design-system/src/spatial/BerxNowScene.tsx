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
import {StyleSheet, Text, View} from 'react-native';
import {useBerxScene} from './BerxSpatialScene';
import {BerxDepthLayer} from './BerxDepthLayer';
import {BerxEnergyHalo} from './BerxEnergyHalo';
import {BerxNowRail, type BerxNowItem} from './BerxNowRail';
import {colors, spacing, typography} from '../tokens';

export interface BerxNowSceneProps {
	items: readonly BerxNowItem[];
	/** Real count of things happening now, from the server. */
	liveCount: number;
	/**
	 * The server tells us whether it could decide "open now" at all
	 * (/api/v1/nearby returns open_now_available). Passed through so
	 * the scene can say "не знаем" instead of implying "закрыто".
	 */
	openNowAvailable: boolean;
	/** Set when the viewer has supplied real coordinates. */
	hasLocation: boolean;
	header?: React.ReactNode;
	testID?: string;
}

export function BerxNowScene({items, liveCount, openNowAvailable, hasLocation, header, testID}: BerxNowSceneProps) {
	const {scene} = useBerxScene();

	return (
		<View testID={testID} style={styles.root}>
			{header}

			{/* D5 — the energy layer, the only place that emits */}
			<BerxDepthLayer depth="D5" decorative={false} style={styles.pulseLayer}>
				<View style={styles.pulse}>
					<BerxEnergyHalo size={76} intensity={liveCount > 0 ? Math.min(1, 0.4 + liveCount / 12) : 0.15} />
					<View style={styles.pulseText}>
						<Text style={[styles.count, {color: scene.accent}]} accessibilityLiveRegion="polite">
							{liveCount}
						</Text>
						<Text style={styles.countLabel}>{liveCount === 1 ? 'событие сейчас' : 'событий сейчас'}</Text>
					</View>
				</View>
			</BerxDepthLayer>

			{/* D3 — the surroundings */}
			{hasLocation ? (
				<BerxNowRail items={items} />
			) : (
				<Text style={styles.note}>Укажите координаты, чтобы увидеть, что происходит рядом.</Text>
			)}

			{/* the honest limit, stated rather than hidden */}
			{!openNowAvailable ? (
				<Text style={styles.note}>
					Часы работы у части мест записаны текстом — «открыто сейчас» по ним определить нельзя, поэтому статус не
					показывается.
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.lg},
	pulseLayer: {alignItems: 'center'},
	pulse: {alignItems: 'center', justifyContent: 'center', height: 96},
	pulseText: {position: 'absolute', alignItems: 'center'},
	count: {fontSize: typography.sizeHero, fontWeight: typography.weightBold},
	countLabel: {color: colors.textDim, fontSize: typography.sizeXs},
	note: {color: colors.textFaint, fontSize: typography.sizeSm, paddingHorizontal: spacing.lg, lineHeight: typography.sizeSm * 1.5},
});
