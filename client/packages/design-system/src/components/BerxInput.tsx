/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 */
import {TextInput, TextInputProps, StyleSheet} from 'react-native';
import {colors, radius, spacing, typography} from '../tokens';

export function BerxInput(props: TextInputProps) {
	return <TextInput placeholderTextColor={colors.textDim} style={[styles.input, props.style]} {...props} />;
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
