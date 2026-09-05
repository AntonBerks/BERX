/**
 * BerxStatRail — a row of real counts.
 *
 * Every value must come from the server. A stat with no real source
 * is not shown as a zero (which reads as "this person has none"): the
 * caller omits it, and the rail simply has fewer items.
 */

import {Pressable, StyleSheet, View} from 'react-native';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxStat {
	key: string;
	label: string;
	/** Real server value. Pass undefined to omit rather than showing a placeholder. */
	value?: number | string;
	onPress?: () => void;
}

export interface BerxStatRailProps {
	stats: readonly BerxStat[];
	testID?: string;
}

export function BerxStatRail({stats, testID}: BerxStatRailProps) {
	const {scene} = useBerxScene();
	const visible = stats.filter((s) => s.value !== undefined && s.value !== null);
	if (visible.length === 0) return null;

	return (
		<View testID={testID} style={styles.root} accessibilityRole="list">
			{visible.map((s) => {
				const label = `${s.label}: ${s.value}`;
				const content = (
					<>
						<BerxText role="heading">{s.value}</BerxText>
						<BerxText role="meta" emphasis="secondary">{s.label}</BerxText>
					</>
				);
				return s.onPress ? (
					<Pressable
						key={s.key}
						accessibilityRole="button"
						accessibilityLabel={label}
						onPress={s.onPress}
						style={({pressed}) => [styles.item, styles.pressable, {opacity: pressed ? 0.7 : 1, borderColor: scene.layers.D4.surface.borderColor}]}>
						{content}
					</Pressable>
				) : (
					<View key={s.key} accessible accessibilityLabel={label} style={styles.item}>
						{content}
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', gap: spacing.xl, flexWrap: 'wrap'},
	item: {gap: 2, minHeight: 44, justifyContent: 'center'},
	pressable: {paddingHorizontal: spacing.md, borderRadius: 12, borderWidth: 1},
});
