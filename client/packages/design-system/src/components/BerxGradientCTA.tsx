/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * Real, DELIBERATE, SCOPED exception to "cyan #4fd6e8 only"
 * (BERX_DECISIONS.md, "Design") — user-directed, explicit reference
 * image, confirmed in-session. Cyan stays the app's one systemic
 * accent everywhere else (links, focus rings, primary buttons,
 * badges); this violet→orange gradient exists ONLY for the one social
 * "Follow"-class action this component is used for — never applied
 * system-wide, never silently spreading to other buttons. See
 * BERX_DECISIONS.md's own "Editorial CTA gradient" entry.
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
import React from 'react';
import {Pressable, Text, View, ActivityIndicator, StyleSheet, PressableProps} from 'react-native';
import {colors, radius, spacing, typography} from '../tokens';

const GRADIENT_FROM = {r: 0x8b, g: 0x5c, b: 0xf6}; // violet #8b5cf6
const GRADIENT_TO = {r: 0xff, g: 0x6a, b: 0x00}; // orange #ff6a00
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

const styles = StyleSheet.create({
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
