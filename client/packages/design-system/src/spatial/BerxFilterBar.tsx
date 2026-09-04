/**
 * BerxFilterBar — real, server-backed filters.
 *
 * Options come from the API (place categories, event categories), not
 * from a hardcoded list, so the bar cannot offer a filter the backend
 * will not honour. Each chip is a toggle button with a real selected
 * state, and the bar reports how many filters are active.
 */

import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {colors, spacing, typography} from '../tokens';

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
									borderColor: active ? rgba(scene.accent, 0.5) : scene.layers.D4.surface.borderColor,
									backgroundColor: active ? rgba(scene.accent, 0.14) : 'transparent',
									opacity: pressed ? 0.75 : 1,
								},
							]}>
							<Text style={[styles.label, {color: active ? scene.accent : colors.textDim}]}>{o.label}</Text>
							{o.count !== undefined ? (
								<Text style={[styles.count, {color: active ? scene.accent : colors.textFaint}]}>{o.count}</Text>
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
	chip: {
		minHeight: 44,
		paddingHorizontal: spacing.lg,
		borderRadius: 999,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	label: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	count: {fontSize: typography.sizeXs},
});
