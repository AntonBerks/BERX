/**
 * BerxSearchField — the entry point to EXPLORE.
 *
 * A real search box: role, label, submit handling, a clear button
 * that is itself a labelled 44dp control, and a live-region result
 * count so a screen reader hears "12 результатов" instead of nothing
 * changing.
 */

import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {colors, spacing, typography} from '../tokens';

export interface BerxSearchFieldProps {
	value: string;
	onChangeText: (text: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
	accessibilityLabel?: string;
	/** Real count from the last completed search. Announced politely. */
	resultCount?: number;
	autoFocus?: boolean;
	testID?: string;
}

export function BerxSearchField({
	value,
	onChangeText,
	onSubmit,
	placeholder = 'Поиск',
	accessibilityLabel = 'Поиск по BERX',
	resultCount,
	autoFocus,
	testID,
}: BerxSearchFieldProps) {
	const {scene} = useBerxScene();
	const layer = scene.layers.D4;

	return (
		<View style={styles.root}>
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={999}>
				<View style={styles.row}>
					<Text style={[styles.glyph, {color: colors.textDim}]} accessibilityElementsHidden importantForAccessibility="no">
						⌕
					</Text>
					<TextInput
						testID={testID}
						value={value}
						onChangeText={onChangeText}
						onSubmitEditing={onSubmit}
						returnKeyType="search"
						autoFocus={autoFocus}
						accessibilityLabel={accessibilityLabel}
						accessibilityRole="search"
						placeholder={placeholder}
						placeholderTextColor={colors.textFaint}
						style={styles.input}
					/>
					{value.length > 0 ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Очистить поиск"
							onPress={() => onChangeText('')}
							style={[styles.clear, {backgroundColor: rgba(scene.accent, 0.12)}]}>
							<Text style={[styles.clearGlyph, {color: scene.accent}]}>✕</Text>
						</Pressable>
					) : null}
				</View>
			</BerxSurface>
			{resultCount !== undefined ? (
				<Text accessibilityLiveRegion="polite" style={styles.count}>
					{resultCount} результатов
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.xs},
	row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, minHeight: 48, gap: spacing.sm},
	glyph: {fontSize: typography.sizeLg},
	input: {flex: 1, color: colors.text, fontSize: typography.sizeBase, paddingVertical: spacing.md},
	clear: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
	clearGlyph: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	count: {color: colors.textDim, fontSize: typography.sizeXs, paddingHorizontal: spacing.lg},
});
