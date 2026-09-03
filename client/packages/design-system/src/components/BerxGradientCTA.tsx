/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX WORLD — the violet→orange gradient this used to carry (a
 * scoped, documented exception at the time — see BERX_DECISIONS.md's
 * "Editorial CTA gradient" entry) is retired: the current, binding
 * rule is no purple/violet/magenta anywhere in BERX, without
 * exception, and a warm-orange second stop isn't part of the single
 * cyan identity either. This is now a single-hue cyan sheen — the
 * bright accent deepening into itself — so a CTA that wants extra
 * visual weight still reads as unmistakably BERX rather than
 * borrowing a hue from nowhere else in the system.
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
import type {BerxColorTokens} from '../tokens';

// Single-hue cyan sheen — the systemic accent deepening into a dark
// teal, never a second, unrelated hue.
const GRADIENT_FROM = {r: 0x4f, g: 0xd6, b: 0xe8}; // accent cyan #4FD6E8
const GRADIENT_TO = {r: 0x0b, g: 0x5f, b: 0x70}; // deep teal, same hue family
const STRIPS = 18;

function lerp(a: number, b: number, t: number): number {
	return Math.round(a + (b - a) * t);
}

function stripColor(i: number): string {
	const t = STRIPS <= 1 ? 0 : i / (STRIPS - 1);
	const r = lerp(GRADIENT_FROM.r, GRADIENT_TO.r, t);
	const g = lerp(GRADIENT_FROM.g, GRADIENT_TO.g, t);
	const b = lerp(GRADIENT_FROM.b, GRADIENT_TO.b, t);
	return `rgb(${r},${g},${b})`;
}

const STRIP_COLORS = Array.from({length: STRIPS}, (_, i) => stripColor(i));

export interface BerxGradientCTAProps extends Omit<PressableProps, 'style'> {
	label: string;
	loading?: boolean;
	fullWidth?: boolean;
}

export function BerxGradientCTA({label, loading, fullWidth, disabled, ...rest}: BerxGradientCTAProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const isDisabled = disabled || loading;
	return (
		<Pressable
			disabled={isDisabled}
			style={({pressed}: {pressed: boolean}) => [styles.wrap, fullWidth && styles.fullWidth, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled]}
			{...rest}
		>
			<View style={styles.gradient} pointerEvents="none">
				{STRIP_COLORS.map((c, i) => (
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
