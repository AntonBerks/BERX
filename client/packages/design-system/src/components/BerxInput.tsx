/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * MAX BUILD — real focus state. RN's TextInput has no built-in focus
 * visual (unlike a browser's native :focus outline), so every field
 * in the app looked identical whether it was active or not — a real,
 * fixable gap on the single most universal input primitive, not a
 * cosmetic nice-to-have. Local-only state (never touches the caller's
 * controlled value/onChangeText); any caller-supplied onFocus/onBlur
 * still fires, this just also drives the visual ring.
 */
import {useState, useMemo} from 'react';
import {TextInput, TextInputProps, NativeSyntheticEvent, TextInputFocusEventData, StyleSheet} from 'react-native';
import {radius, spacing, typography} from '../tokens';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

export function BerxInput(props: TextInputProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [focused, setFocused] = useState(false);
	return (
		<TextInput
			placeholderTextColor={colors.textDim}
			{...props}
			onFocus={(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
				setFocused(true);
				props.onFocus?.(e);
			}}
			onBlur={(e: NativeSyntheticEvent<TextInputFocusEventData>) => {
				setFocused(false);
				props.onBlur?.(e);
			}}
			style={[styles.input, focused && styles.inputFocused, props.style]}
		/>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
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
	inputFocused: {
		borderColor: colors.accent,
		backgroundColor: colors.glass2,
	},
});
