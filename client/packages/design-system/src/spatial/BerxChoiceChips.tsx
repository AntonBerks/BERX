/**
 * BerxChoiceChips — choosing one of a variable set, on real planes.
 *
 * The archive's segmented control (BerxSegmentTabs) covers a fixed
 * two- or three-way switch. It does not cover the other shape BERX
 * keeps needing: a set whose length comes from real data — a post's
 * visibility including every circle the person owns, a place's
 * categories as the server lists them, a report's reasons.
 *
 * Eight screens had hand-rolled that shape, each with its own
 * `styles.chip` and its own two fixed colours, and none of them
 * belonged to a depth plane. This is the one implementation, and it
 * says what selection means spatially: an unselected chip is
 * structure (D2) — part of the scaffolding of the choice — and the
 * selected one is promoted to the control plane (D4) and takes the
 * scene's accent rim. Choosing moves an option forward, which is a
 * thing you can see even with every blur switched off.
 *
 * It is a real radio group: one control per option with `selected`
 * state, so the choice is announced rather than only coloured.
 */
import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle} from 'react-native';
import {BERX_V9_TOUCH} from '@berx/spatial';
import {colors, radius, spacing, typography} from '../tokens';
import {useBerxSceneOptional} from './BerxSpatialScene';

export interface BerxChoiceOption<T extends string | number> {
	key: T;
	label: string;
}

export interface BerxChoiceChipsProps<T extends string | number> {
	options: readonly BerxChoiceOption<T>[];
	value: T | undefined;
	onChange: (key: T) => void;
	/** Names the choice for assistive technology, e.g. "Кто увидит пост". */
	accessibilityLabel: string;
	/** Long sets scroll horizontally rather than wrapping into a wall. */
	scroll?: boolean;
	disabled?: boolean;
	style?: ViewStyle;
	testID?: string;
}

export function BerxChoiceChips<T extends string | number>({
	options,
	value,
	onChange,
	accessibilityLabel,
	scroll = false,
	disabled,
	style,
	testID,
}: BerxChoiceChipsProps<T>) {
	const scene = useBerxSceneOptional();

	const chips = options.map((opt) => {
		const active = opt.key === value;
		const spatial = scene
			? active
				? {
						backgroundColor: scene.scene.layers.D4.surface.backgroundColor,
						borderColor: scene.scene.layers.D5.surface.rimColor,
						/* the selected chip is genuinely in front: the control
						   plane's own shadow, not a tint */
						shadowColor: scene.scene.layers.D4.lighting.shadow.color,
						shadowOpacity: 1,
						shadowRadius: scene.scene.layers.D4.lighting.shadow.radius,
						shadowOffset: {width: 0, height: scene.scene.layers.D4.lighting.shadow.offsetY},
						elevation: scene.scene.layers.D4.lighting.shadow.elevation,
				  }
				: {
						backgroundColor: scene.scene.layers.D2.surface.backgroundColor,
						borderColor: scene.scene.layers.D2.surface.borderColor,
				  }
			: null;

		return (
			<Pressable
				key={String(opt.key)}
				accessibilityRole="radio"
				accessibilityState={{selected: active, disabled: Boolean(disabled)}}
				accessibilityLabel={opt.label}
				disabled={disabled}
				onPress={() => onChange(opt.key)}
				style={[styles.chip, active ? styles.chipActive : null, spatial, disabled ? styles.disabled : null]}>
				<Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{opt.label}</Text>
			</Pressable>
		);
	});

	if (scroll) {
		return (
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				accessibilityRole="radiogroup"
				accessibilityLabel={accessibilityLabel}
				contentContainerStyle={[styles.row, style]}
				testID={testID}>
				{chips}
			</ScrollView>
		);
	}

	return (
		<View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.row, styles.wrap, style]} testID={testID}>
			{chips}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
	wrap: {flexWrap: 'wrap'},
	chip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.pill,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		backgroundColor: colors.glass1,
		minHeight: BERX_V9_TOUCH.preferredDp - 8,
		justifyContent: 'center',
	},
	chipActive: {borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.text, fontWeight: typography.weightMedium},
	disabled: {opacity: 0.5},
});
