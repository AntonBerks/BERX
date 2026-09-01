/**
 * !!! VERIFICATION STATUS: UNVERIFIED — same disclosure as
 * apps/mobile/src/screens/LoginScreen.tsx. Real React Native code,
 * not compiled/run in this sandbox (npm registry confirmed blocked,
 * 403, tested directly). Verify by dropping into a real RN project.
 */
import {useMemo} from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, PressableProps } from 'react-native';
import {radius, spacing, typography, shadow} from '../tokens';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

export type BerxButtonVariant = 'primary' | 'secondary' | 'danger';

export interface BerxButtonProps extends Omit<PressableProps, 'style'> {
	label: string;
	variant?: BerxButtonVariant;
	loading?: boolean;
	fullWidth?: boolean;
}

/**
 * The one Button every screen uses — matches the real web theme's
 * .btn-primary/.btn/.btn-danger classes in intent (orange fill /
 * glass outline / red), not pixel values copied from any other
 * product's button component.
 */
export function BerxButton({ label, variant = 'primary', loading, fullWidth, disabled, ...rest }: BerxButtonProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const isDisabled = disabled || loading;
	return (
		<Pressable
			disabled={isDisabled}
			style={({ pressed }: {pressed: boolean}) => [
				styles.base,
				variant === 'primary' && styles.primary,
				variant === 'secondary' && styles.secondary,
				variant === 'danger' && styles.danger,
				fullWidth && styles.fullWidth,
				pressed && !isDisabled && styles.pressed,
				isDisabled && styles.disabled,
			]}
			{...rest}
		>
			{loading ? (
				<ActivityIndicator color={variant === 'primary' ? colors.black : colors.text} />
			) : (
				<Text
					style={[
						styles.label,
						variant === 'primary' && styles.labelOnPrimary,
					]}
				>
					{label}
				</Text>
			)}
		</Pressable>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	base: {
		borderRadius: radius.pill,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 48, // real touch-target minimum, not arbitrary
	},
	primary: {
		backgroundColor: colors.accent,
		// Real accent glow (tokens/shadow.glow) — designed for exactly this
		// ("hero/primary surfaces") but never actually wired to a
		// component before now. iOS renders it directly via shadow*;
		// Android has no shadow blur/spread, so `elevation` (already part
		// of shadow.glow) is the real fallback there.
		...shadow.glow,
	},
	secondary: {
		backgroundColor: colors.glass2,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	danger: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: colors.danger,
	},
	fullWidth: {
		width: '100%',
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
	label: {
		color: colors.text,
		fontSize: typography.sizeBase,
		fontWeight: typography.weightMedium,
	},
	labelOnPrimary: {
		color: colors.black,
	},
});
