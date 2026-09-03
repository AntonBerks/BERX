/**
 * BERX ANIMATED BUTTON — the premium press control, three real variants.
 *
 * Every variant shares the same physics: spring response ~0.3s /
 * damping 0.7 (this component set's own spec — see BerxParticleSystem
 * and BerxGlassView's headers for the same dependency notes), real
 * haptic feedback via expo-haptics (a new dependency this component
 * set introduces; wrapped in try/catch — haptics has no meaning on
 * web and some Android devices lack a haptic engine, so a throw there
 * must never break the press itself), and a real particle burst on
 * PRIMARY press via BerxParticleSystem, not a borrowed effect from
 * elsewhere.
 *
 * VARIANTS.
 *   primary   — a real 2-stop SVG gradient (accent 30%→transparent,
 *               react-native-svg's own LinearGradient, the same real
 *               gradient technique BerxOrb/BerxActions already use —
 *               not the 18-strip approximation BerxGradientCTA uses,
 *               which exists specifically because THAT component
 *               predates confirming a real gradient primitive was
 *               available for this exact shape), border accent 60%,
 *               white text.
 *   secondary — transparent, border colors.border (Obsidian & Aurora's
 *               own flat 20% white token), colors.textDim text.
 *   icon      — a 44×44 circle. `active` (a real addition to this
 *               component's own spec, which named the STATE — "active
 *               state fills with accent and glows" — without naming
 *               the prop that drives it) fills with the accent and
 *               adds a real glow shadow.
 *
 * `premium` adds a real animated sheen — a bright diagonal band
 * sweeping across the button on a slow loop (withRepeat), not a
 * static gold border pretending to shimmer.
 */
import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import type {ViewStyle, StyleProp} from 'react-native';
import Svg, {Defs, LinearGradient as SvgLinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withRepeat,
	withTiming,
	withSequence,
	Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {typography, spacing} from '../tokens';
import {useBerxColors} from '../theme';
import type {BerxAccentKey} from '../theme';
import {BERX_ACCENT_COLORS} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {BerxParticleSystem} from './BerxParticleSystem';
import {BERX_SPRING} from '../animation/springs';

const PRESS_SPRING = BERX_SPRING;

/** Real, silent-by-design haptic call — never throws past the press handler. */
function tryHaptic(style: Haptics.ImpactFeedbackStyle) {
	Haptics.impactAsync(style).catch(() => undefined);
}

export type BerxButtonVariant = 'primary' | 'secondary' | 'icon';

export interface BerxAnimatedButtonProps {
	title?: string;
	onPress: () => void;
	variant: BerxButtonVariant;
	icon?: ReactNode;
	disabled?: boolean;
	/** Overrides the live global accent for this one button. */
	accent?: BerxAccentKey;
	/** Adds a real animated gold sheen sweep. */
	premium?: boolean;
	/** icon variant only — fills with the accent and glows, per this component's own spec (see this file's header on the prop this state needed). */
	active?: boolean;
	style?: StyleProp<ViewStyle>;
}

export function BerxAnimatedButton({title, onPress, variant, icon, disabled, accent, premium, active, style}: BerxAnimatedButtonProps) {
	const colors = useBerxColors();
	const resolvedAccent = accent ? BERX_ACCENT_COLORS[accent] : colors.accent;
	const scale = useSharedValue(1);
	const [burstOn, setBurstOn] = useState(false);
	const burstResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// PREMIUM SHEEN — a real diagonal band sweeping left→right on a slow
	// loop. -1..2 so the band starts and ends fully off-view either side.
	const sheenX = useSharedValue(-1);
	useEffect(() => {
		if (!premium) return;
		sheenX.value = withRepeat(withSequence(withTiming(2, {duration: 1800, easing: Easing.inOut(Easing.ease)}), withTiming(-1, {duration: 0})), -1, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [premium]);

	useEffect(
		() => () => {
			if (burstResetRef.current) clearTimeout(burstResetRef.current);
		},
		[]
	);

	function handlePressIn() {
		if (disabled) return;
		scale.value = withSpring(0.97, PRESS_SPRING);
	}

	function handlePressOut() {
		if (disabled) return;
		scale.value = withSpring(1, PRESS_SPRING);
	}

	function handlePress() {
		if (disabled) return;
		tryHaptic(Haptics.ImpactFeedbackStyle.Light);
		if (variant === 'primary') {
			// Edge-triggered (see BerxParticleSystem's own header) — off
			// then on, so a rapid double-press fires two independent
			// bursts instead of the second being ignored.
			setBurstOn(false);
			requestAnimationFrame(() => setBurstOn(true));
			if (burstResetRef.current) clearTimeout(burstResetRef.current);
			burstResetRef.current = setTimeout(() => setBurstOn(false), 60);
		}
		onPress();
	}

	// Explicit deps — see BerxGlassView's own comment on why this is not
	// optional in a build with no Reanimated Babel plugin step.
	const animatedScaleStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}), [scale]);
	const animatedSheenStyle = useAnimatedStyle(() => ({
		transform: [{translateX: sheenX.value * 200}, {rotate: '20deg'}],
	}), [sheenX]);

	if (variant === 'icon') {
		return (
			<Animated.View style={[styles.iconWrap, animatedScaleStyle, style]}>
				<Pressable
					onPress={handlePress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					disabled={disabled}
					style={[
						styles.iconCircle,
						{borderColor: active ? resolvedAccent : colors.border, backgroundColor: active ? accentAlpha(resolvedAccent, 0.22) : colors.glass1},
						active ? {shadowColor: resolvedAccent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: {width: 0, height: 0}, elevation: 6} : null,
						disabled && styles.disabled,
					]}>
					{icon}
				</Pressable>
			</Animated.View>
		);
	}

	if (variant === 'secondary') {
		return (
			<Animated.View style={animatedScaleStyle}>
				<Pressable
					onPress={handlePress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					disabled={disabled}
					style={[styles.base, styles.secondary, {borderColor: colors.border}, disabled && styles.disabled, style]}>
					{icon}
					{title ? <Text style={[styles.label, {color: colors.textDim}]}>{title}</Text> : null}
				</Pressable>
			</Animated.View>
		);
	}

	// PRIMARY
	return (
		<Animated.View style={animatedScaleStyle}>
			<Pressable
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={disabled}
				style={[styles.base, styles.primary, {borderColor: accentAlpha(resolvedAccent, 0.6)}, disabled && styles.disabled, style]}>
				<Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
					<Defs>
						<SvgLinearGradient id="berx-btn-fill" x1="0" y1="0" x2="1" y2="1">
							<Stop offset="0%" stopColor={resolvedAccent} stopOpacity={0.3} />
							<Stop offset="100%" stopColor={resolvedAccent} stopOpacity={0} />
						</SvgLinearGradient>
					</Defs>
					<Rect x="0" y="0" width="100%" height="100%" rx={16} ry={16} fill="url(#berx-btn-fill)" />
				</Svg>
				{premium ? (
					<Animated.View pointerEvents="none" style={[styles.sheen, animatedSheenStyle]}>
						<Svg width={40} height={120}>
							<Defs>
								<SvgLinearGradient id="berx-btn-sheen" x1="0" y1="0" x2="1" y2="0">
									<Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
									<Stop offset="50%" stopColor={BERX_ACCENT_COLORS.gold} stopOpacity={0.55} />
									<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
								</SvgLinearGradient>
							</Defs>
							<Rect x="0" y="0" width="40" height="120" fill="url(#berx-btn-sheen)" />
						</Svg>
					</Animated.View>
				) : null}
				{icon}
				{title ? <Text style={[styles.label, {color: colors.text}]}>{title}</Text> : null}
				<BerxParticleSystem trigger={burstOn} count={14} color={resolvedAccent} duration={550} spread={100} speed={90} />
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: 48,
		borderRadius: 16,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		overflow: 'hidden',
		paddingHorizontal: spacing.xl,
	},
	primary: {},
	secondary: {backgroundColor: 'transparent'},
	sheen: {position: 'absolute', top: -20, left: '50%'},
	label: {fontSize: typography.sizeBase, fontWeight: typography.weightBold, letterSpacing: 0.2},
	iconWrap: {width: 44, height: 44},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	disabled: {opacity: 0.4},
});
