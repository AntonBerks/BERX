/**
 * BerxFilterBar — real, server-backed filters.
 *
 * Options come from the API (place categories, event categories), not
 * from a hardcoded list, so the bar cannot offer a filter the backend
 * will not honour. Each chip is a toggle button with a real selected
 * state, and the bar reports how many filters are active.
 */

import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxFilterOption {
	key: string;
	label: string;
	/** Real count from the server, when the endpoint returns one. */
	count?: number;
}

export interface BerxFilterBarProps {
	options: readonly BerxFilterOption[];
	selected: readonly string[];
	onToggle: (key: string) => void;
	multiple?: boolean;
	accessibilityLabel?: string;
	testID?: string;
}

export function BerxFilterBar({
	options,
	selected,
	onToggle,
	multiple = true,
	accessibilityLabel = 'Фильтры',
	testID,
}: BerxFilterBarProps) {
	const {scene} = useBerxScene();
	if (options.length === 0) return null;

	return (
		<View testID={testID} accessibilityLabel={accessibilityLabel} accessibilityRole={multiple ? 'list' : 'radiogroup'}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
				{options.map((o) => {
					const active = selected.includes(o.key);
					return (
						<Pressable
							key={o.key}
							accessibilityRole={multiple ? 'checkbox' : 'radio'}
							accessibilityState={{checked: active, selected: active}}
							accessibilityLabel={o.count !== undefined ? `${o.label}, ${o.count}` : o.label}
							onPress={() => onToggle(o.key)}
							style={({pressed}) => [
								styles.chip,
								{
									/**
									 * Selection is depth, not only colour.
									 *
									 * An unselected chip is an outline standing on the
									 * room. A selected one is a real object on the
									 * control plane — the plane's own fill, its lit
									 * edge, its shadow — so the set reads as one chip
									 * having come forward rather than one having been
									 * tinted. The accent still marks it, because cyan
									 * is stateful by contract; it is no longer the
									 * only thing marking it.
									 */
									borderColor: active ? rgba(scene.accent, 0.5) : scene.layers.D4.surface.borderColor,
									backgroundColor: active ? scene.layers.D4.surface.effectiveColor : 'transparent',
									shadowColor: scene.layers.D4.lighting.shadow.color,
									shadowOpacity: active ? 1 : 0,
									shadowRadius: active ? scene.layers.D4.lighting.shadow.radius : 0,
									shadowOffset: {width: 0, height: active ? scene.layers.D4.lighting.shadow.offsetY : 0},
									elevation: active ? scene.layers.D4.lighting.shadow.elevation : 0,
									opacity: pressed ? 0.75 : 1,
								},
							]}>
							{active ? (
								/* the lit edge of the object that came forward */
								<View
									pointerEvents="none"
									style={[styles.chipEdge, {backgroundColor: scene.layers.D4.surface.edgeHighlightColor}]}
								/>
							) : null}
							<BerxText role="label" emphasis={active ? 'accent' : 'secondary'}>
								{o.label}
							</BerxText>
							{o.count !== undefined ? (
								<BerxText role="micro" emphasis={active ? 'accent' : 'tertiary'}>
									{String(o.count)}
								</BerxText>
							) : null}
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm},
	chipEdge: {position: 'absolute', top: 0, left: 0, right: 0, height: 1, borderTopLeftRadius: 999, borderTopRightRadius: 999},
	chip: {
		minHeight: 44,
		paddingHorizontal: spacing.lg,
		borderRadius: 999,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
});
