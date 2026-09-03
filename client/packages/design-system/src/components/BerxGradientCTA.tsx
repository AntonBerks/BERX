/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX WORLD — the violet→orange gradient this used to carry (a
 * scoped, documented exception at the time — see BERX_DECISIONS.md's
 * "Editorial CTA gradient" entry) was retired for a single-hue sheen —
 * the bright accent deepening into itself — so a CTA that wants extra
 * visual weight still reads as unmistakably BERX rather than borrowing
 * a hue from nowhere else in the system. Now LIVE: the sheen is built
 * per-render from useBerxColors().accent, whichever of the five real
 * Obsidian & Aurora accents is actually selected (see theme/index.tsx
 * for the switching itself), not a module-level constant baked from
 * one fixed hex — a CTA left on screen through an accent change shows
 * the new accent's own gradient.
 *
 * No gradient library is installed (no expo-linear-gradient/
 * react-native-linear-gradient — same real npm constraint as every
 * other native module this session; adding an unverified native
 * dependency here isn't a risk worth taking blind). Same honest
 * simulation technique BerxScrimHero already uses for its vertical
 * fade, applied horizontally: N adjacent 1-flex strips, each
 * interpolated between the two real endpoint colors, inside a
 * rounded, overflow:hidden pill. Reads as a real gradient at normal
 * viewing distance; documented here as the honest reason it isn't a
 * shader, not left unexplained.
 */
import {useMemo} from 'react';
import {Pressable, Text, View, ActivityIndicator, StyleSheet, PressableProps} from 'react-native';
import {radius, spacing, typography} from '../tokens';

import {useBerxColors} from '../theme';
import {mixHex} from '../theme/accentMath';
import type {BerxColorTokens} from '../tokens';

const STRIPS = 18;

/**
 * Single-hue sheen — the LIVE accent deepening toward the ground, never
 * a second colour. Computed per-render from whichever accent is
 * actually selected (mixHex toward colors.bg), not a module-level
 * constant baked from one fixed hex — a CTA left on screen through an
 * accent change must show the new accent's own gradient, not
 * Aquamarine's forever.
 */
function buildStripColors(accent: string, ground: string): string[] {
	return Array.from({length: STRIPS}, (_, i) => {
		const t = STRIPS <= 1 ? 0 : i / (STRIPS - 1);
		return mixHex(accent, ground, t * 0.75);
	});
}

export interface BerxGradientCTAProps extends Omit<PressableProps, 'style'> {
	label: string;
	loading?: boolean;
	fullWidth?: boolean;
}

export function BerxGradientCTA({label, loading, fullWidth, disabled, ...rest}: BerxGradientCTAProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const stripColors = useMemo(() => buildStripColors(colors.accent, colors.black), [colors.accent, colors.black]);
	const isDisabled = disabled || loading;
	return (
		<Pressable
			disabled={isDisabled}
			style={({pressed}: {pressed: boolean}) => [styles.wrap, fullWidth && styles.fullWidth, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled]}
			{...rest}
		>
			<View style={styles.gradient} pointerEvents="none">
				{stripColors.map((c, i) => (
					<View key={i} style={[styles.strip, {backgroundColor: c}]} />
				))}
			</View>
			<View style={styles.content}>
				{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.label}>{label}</Text>}
			</View>
		</Pressable>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {
		borderRadius: radius.pill,
		minHeight: 44,
		overflow: 'hidden',
		alignSelf: 'flex-start',
	},
	fullWidth: {width: '100%', alignSelf: 'stretch'},
	gradient: {...StyleSheet.absoluteFillObject, flexDirection: 'row'},
	strip: {flex: 1},
	content: {paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center'},
	label: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	pressed: {opacity: 0.85},
	disabled: {opacity: 0.5},
});
