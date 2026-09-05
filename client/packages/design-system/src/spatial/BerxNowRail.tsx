/**
 * BerxNowRail — what is happening around the viewer, right now.
 *
 * Ordered by real distance from real coordinates, because "now" in
 * BERX is spatial as well as temporal. Items with no distance sort
 * last rather than being given a made-up one.
 */
import {StyleSheet, Text, View} from 'react-native';
import {useBerxScene} from './BerxSpatialScene';
import {BerxHorizontalRail} from './BerxHorizontalRail';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxNowPulse} from './BerxNowPulse';
import {spacing, typography} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxNowItem {
	id: string;
	kind: 'place' | 'event';
	title: string;
	subtitle?: string;
	/** Metres. undefined when the item has no coordinates. */
	distanceM?: number;
	/** Real liveness: an event happening now, or a place with activity now. */
	live?: boolean;
	onPress: () => void;
}

export interface BerxNowRailProps {
	items: readonly BerxNowItem[];
	accessibilityLabel?: string;
	testID?: string;
}

const ITEM_WIDTH = 208;

export function sortByDistance(items: readonly BerxNowItem[]): BerxNowItem[] {
	return [...items].sort((a, b) => {
		if (a.distanceM === undefined && b.distanceM === undefined) return 0;
		if (a.distanceM === undefined) return 1;
		if (b.distanceM === undefined) return -1;
		return a.distanceM - b.distanceM;
	});
}

export function BerxNowRail({items, accessibilityLabel = 'Рядом сейчас', testID}: BerxNowRailProps) {
	const {scene} = useBerxScene();
	const sorted = sortByDistance(items);

	return (
		<BerxHorizontalRail
			testID={testID}
			data={sorted}
			itemWidth={ITEM_WIDTH}
			accessibilityLabel={accessibilityLabel}
			keyExtractor={(item) => item.id}
			renderItem={({item}) => (
				<BerxSpatialCard
					depth="D3"
					onPress={item.onPress}
					accessibilityLabel={[item.title, item.subtitle, item.distanceM !== undefined ? `${Math.round(item.distanceM)} метров` : undefined, item.live ? 'идёт сейчас' : undefined]
						.filter(Boolean)
						.join(', ')}
					padding={spacing.md}
					radius={18}
					style={{width: ITEM_WIDTH}}>
					<View style={styles.body}>
						{item.live ? <BerxNowPulse live label={item.kind === 'event' ? 'Идёт' : 'Активно'} /> : null}
						<BerxText role="callout" numberOfLines={2}>
							{item.title}
						</BerxText>
						{item.subtitle ? (
							<BerxText role="meta" emphasis="secondary" numberOfLines={1}>
								{item.subtitle}
							</BerxText>
						) : null}
						{item.distanceM !== undefined ? (
							<Text style={[styles.distance, {color: scene.accent}]}>
								{item.distanceM < 1000 ? `${Math.round(item.distanceM)} м` : `${(item.distanceM / 1000).toFixed(1)} км`}
							</Text>
						) : null}
					</View>
				</BerxSpatialCard>
			)}
		/>
	);
}

const styles = StyleSheet.create({
	body: {gap: spacing.xs, minHeight: 96, justifyContent: 'flex-end'},
	distance: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
