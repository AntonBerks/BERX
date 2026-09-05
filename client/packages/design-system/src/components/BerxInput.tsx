/**
 * BerxInput — the field, as a real surface in the scene.
 *
 * REFACTORED for v9. It used to be one fixed translucent fill and one
 * grey hairline: identical in every scene, unchanged on focus, and
 * invisible to the depth system. A form built from it was a stack of
 * flat rectangles inside a lit room.
 *
 * The planes it answers to:
 *   D3 — a field is where content is entered, so at rest it takes the
 *        content plane's own material and sits as a distinct object on
 *        the D2 surface holding the form.
 *   D5 — focus is energy in v9, not a blue outline. A focused field
 *        takes the focus plane's rim and glow, which is the same
 *        treatment the scene gives anything currently active.
 *
 * The separation between the two is material and light, not opacity:
 * the fill is the resolved surface (opaque when the material resolver
 * says text would not otherwise carry 4.5:1), the border is the
 * plane's own, and focus adds a rim rather than swapping the colour
 * scheme.
 *
 * Outside a scene it keeps its previous static look rather than
 * throwing — the same deliberate fallback BerxGlassSurface makes, for
 * the same reason.
 */
import React, {useCallback, useState} from 'react';
import {TextInput, StyleSheet, type NativeSyntheticEvent, type TextInputFocusEventData, type TextInputProps} from 'react-native';
import {colors, radius, spacing, typography} from '../tokens';
import {useBerxSceneOptional} from '../spatial/BerxSpatialScene';

export function BerxInput(props: TextInputProps) {
	const scene = useBerxSceneOptional();
	const [focused, setFocused] = useState(false);

	const onFocus = useCallback(
		(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
			setFocused(true);
			props.onFocus?.(e);
		},
		[props],
	);
	const onBlur = useCallback(
		(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
			setFocused(false);
			props.onBlur?.(e);
		},
		[props],
	);

	const spatial = scene
		? (() => {
				const content = scene.scene.layers.D3;
				const focus = scene.scene.layers.D5;
				return {
					backgroundColor: content.surface.backgroundColor,
					borderColor: focused ? focus.surface.rimColor : content.surface.borderColor,
					borderWidth: focused ? Math.max(1, focus.surface.rimWidth) : 1,
					/* focus is energy: the field glows with the scene's own
					   active light instead of gaining a foreign outline */
					shadowColor: focus.surface.glowColor,
					shadowOpacity: focused ? 1 : 0,
					shadowRadius: focused ? focus.surface.glowRadius : 0,
					shadowOffset: {width: 0, height: 0},
					elevation: focused ? 4 : 0,
				};
		  })()
		: null;

	return (
		<TextInput
			placeholderTextColor={colors.textDim}
			{...props}
			onFocus={onFocus}
			onBlur={onBlur}
			style={[styles.input, spatial, props.style]}
		/>
	);
}

const styles = StyleSheet.create({
	input: {
		backgroundColor: colors.glass1,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		borderRadius: radius.sm,
		color: colors.text,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		fontSize: typography.sizeBase,
		minHeight: 48,
	},
});
