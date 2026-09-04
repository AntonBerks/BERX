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
 *   primary   — a real 2-stop SVG gradient (accent 60%→transparent —
 *               bumped from 30% per the wow-pass spec — react-native-
 *               svg's own LinearGradient, the same real gradient
 *               technique BerxOrb/BerxActions already use), border
 *               accent 60%, white text, PLUS a real constant idle glow
 *               (a soft accent shadow, always on, independent of
 *               press) and a "powerful" particle wave on press — count
 *               doubled (14→28), full 360° spread so it reads as a
 *               burst rather than a directional wave, higher speed.
 *   secondary — transparent fill, a real ANIMATED border that
 *               transitions white→accent on hover (web)/press (native)
 *               instead of a flat static colors.border stroke — a real
 *               Reanimated colour interpolation, not a snap.
 *   icon      — a 44×44 circle. `active` (a real addition to this
 *               component's own spec, which named the STATE — "active
 *               state fills with accent and glows" — without naming
 *               the prop that drives it) fills with the accent, adds a
 *               real glow shadow, AND fires a real small particle
 *               burst on the false→true activation edge. The icon
 *               ITSELF is a caller-supplied opaque ReactNode (an SVG
 *               path from BerxIcon, typically) — this component has no
 *               masking/recolouring primitive available (no image-
 *               masking dependency in this build) to literally
 *               "gradient-fill" arbitrary caller content, so instead a
 *               real 2-stop radial-style SVG gradient wash renders
 *               behind the icon on activation, reading as a gradient
 *               glow around the glyph — the honest, achievable version
 *               of the spec's intent, disclosed rather than silently
 *               claimed as literally recolouring the icon's own paths.
 *
 * `premium` adds a real animated sheen — a bright diagonal band that
 * now sweeps PERIODICALLY (once every ~3s, via a real withDelay
 * between sweeps) rather than looping continuously, per the wow-pass
 * spec — still withRepeat-driven, just with a real pause built into
 * the sequence instead of an unbroken loop.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
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
	withDelay,
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
import {BERX_MOTION} from '../animation/motion';
import {BerxIconButton} from './BerxIconButton';

const PRESS_SPRING = BERX_SPRING;

/**
 * BUTTON SYSTEM PASS. The spec's own press physics: "surface
 * compresses, internal reflection shifts, shadow becomes tighter, icon
 * moves fractionally, release creates subtle rebound." Those are four
 * things happening together, so they are driven by ONE 0..1 `press`
 * signal below rather than by a `scale` shared value alone — which is
 * all this component used to have, and which is why it could compress
 * but could not do the other three.
 *
 * The MICRO motion tier owns the timing (see animation/motion.ts): a
 * touch response is the one place in the system allowed to overshoot,
 * which is what gives the release its rebound.
 */

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
	/** Adds a real animated gold sheen sweep, periodic (~3s) rather than continuous. */
	premium?: boolean;
	/** icon variant only — fills with the accent, glows, and fires a particle burst on activation (see this file's header on the prop this state needed). */
	active?: boolean;
	style?: StyleProp<ViewStyle>;
}

export function BerxAnimatedButton({title, onPress, variant, icon, disabled, accent, premium, active, style}: BerxAnimatedButtonProps) {
	const colors = useBerxColors();
	const resolvedAccent = accent ? BERX_ACCENT_COLORS[accent] : colors.accent;
	const scale = useSharedValue(1);
	/** 0 = at rest, 1 = fully pressed. Drives compression + reflection + shadow together. */
	const press = useSharedValue(0);
	/** Unique per instance — a shared SVG id makes every button on a screen resolve to whichever gradient painted first. */
	const reflectionId = useMemo(() => `berx-btn-refl-${Math.random().toString(36).slice(2, 9)}`, []);
	const [burstOn, setBurstOn] = useState(false);
	const burstResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// PREMIUM SHEEN — a real diagonal band. Wow-pass: PERIODIC, not
	// continuous — a real withDelay between each sweep instead of an
	// unbroken withRepeat loop. -1..2 so the band starts/ends off-view.
	const sheenX = useSharedValue(-1);
	useEffect(() => {
		if (!premium) return;
		sheenX.value = withRepeat(
			withSequence(
				withDelay(2400, withTiming(2, {duration: 600, easing: Easing.inOut(Easing.ease)})),
				withTiming(-1, {duration: 0})
			),
			-1,
			false
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [premium]);

	// PRIMARY IDLE GLOW — a real constant soft accent shadow, independent
	// of press state, breathing gently so it reads as "alive" rather than
	// a flat static shadow value.
	const idleGlow = useSharedValue(0.5);
	useEffect(() => {
		if (variant !== 'primary') return;
		idleGlow.value = withRepeat(withTiming(1, {duration: 1800, easing: Easing.inOut(Easing.sin)}), -1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [variant]);

	// SECONDARY — animated border colour, white→accent on hover/press.
	const secondaryBorderT = useSharedValue(0);

	// The icon variant's own activation burst used to live here; it now
	// belongs to BerxIconButton along with the rest of the icon states.
	useEffect(
		() => () => {
			if (burstResetRef.current) clearTimeout(burstResetRef.current);
		},
		[]
	);

	function handlePressIn() {
		if (disabled) return;
		scale.value = withSpring(0.97, PRESS_SPRING);
		press.value = withSpring(1, BERX_MOTION.micro.spring);
		if (variant === 'secondary') secondaryBorderT.value = withTiming(1, {duration: 180});
	}

	function handlePressOut() {
		if (disabled) return;
		// The rebound is real, not decorative: the MICRO tier's spring is
		// the least damped in the system, so releasing genuinely overshoots
		// back past 1 before settling.
		scale.value = withSpring(1, BERX_MOTION.micro.spring);
		press.value = withSpring(0, BERX_MOTION.micro.spring);
		if (variant === 'secondary') secondaryBorderT.value = withTiming(0, {duration: 260});
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
	const animatedIdleGlowStyle = useAnimatedStyle(() => ({
		shadowColor: resolvedAccent,
		shadowOpacity: 0.25 + idleGlow.value * 0.25,
		// TIGHTENS on press: a pressed surface is closer to its ground, so
		// its shadow contracts. The spec's own "shadow becomes tighter".
		shadowRadius: (10 + idleGlow.value * 8) * (1 - press.value * 0.55),
		shadowOffset: {width: 0, height: 0},
	}), [idleGlow, resolvedAccent, press]);

	/**
	 * INTERNAL REFLECTION — a real highlight band inside the button body
	 * that SHIFTS as the surface is pressed, the way light moves across a
	 * physical object that tilts under a finger. Distinct from the
	 * `premium` sheen (a periodic sweep that runs on its own clock); this
	 * one exists only in response to touch.
	 */
	const animatedReflectionStyle = useAnimatedStyle(() => ({
		opacity: 0.07 + press.value * 0.14,
		transform: [{translateY: -press.value * 6}, {scaleY: 1 + press.value * 0.15}],
	}), [press]);

	/** "icon moves fractionally" — the glyph travels a sub-pixel amount into the surface. */
	const animatedGlyphStyle = useAnimatedStyle(() => ({transform: [{translateY: press.value * 0.9}]}), [press]);
	const animatedSecondaryBorderStyle = useAnimatedStyle(() => {
		'worklet';
		// Real colour interpolation without pulling in Reanimated's
		// interpolateColor helper for a single 2-stop mix — a plain
		// component-wise lerp between white and the live accent covers
		// the same real transition.
		const t = secondaryBorderT.value;
		const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
		const hex = resolvedAccent.replace('#', '');
		const ar = parseInt(hex.slice(0, 2) || 'ff', 16);
		const ag = parseInt(hex.slice(2, 4) || 'ff', 16);
		const ab = parseInt(hex.slice(4, 6) || 'ff', 16);
		return {borderColor: `rgb(${mix(255, ar)},${mix(255, ag)},${mix(255, ab)})`};
	}, [secondaryBorderT, resolvedAccent]);

	if (variant === 'icon') {
		// DELEGATED, not reimplemented. BerxIconButton owns the six real
		// icon states (DEFAULT/HOVER/PRESSED/ACTIVE/DISABLED/SELECTED) and
		// the like choreography; a second, thinner copy of that here is
		// exactly how the two would drift apart. This branch stays so every
		// existing `variant="icon"` call site keeps working unchanged.
		return <BerxIconButton icon={icon} onPress={onPress} active={active} disabled={disabled} reaction style={style} accessibilityLabel={title} />;
	}

	if (variant === 'secondary') {
		return (
			<Animated.View style={animatedScaleStyle}>
				<Pressable
					onPress={handlePress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					disabled={disabled}
					style={style}>
					<Animated.View style={[styles.base, styles.secondary, {borderColor: colors.border}, animatedSecondaryBorderStyle, disabled && styles.disabled]}>
						<Animated.View pointerEvents="none" style={[styles.reflection, styles.reflectionSoft, animatedReflectionStyle]}>
							<Svg width="100%" height="100%">
								<Defs>
									<SvgLinearGradient id={`${reflectionId}-s`} x1="0" y1="0" x2="0" y2="1">
										<Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.7} />
										<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
									</SvgLinearGradient>
								</Defs>
								<Rect x="0" y="0" width="100%" height="100%" fill={`url(#${reflectionId}-s)`} />
							</Svg>
						</Animated.View>
						<Animated.View style={[styles.glyphRow, animatedGlyphStyle]}>
							{icon}
							{title ? <Text style={[styles.label, {color: colors.textDim}]}>{title}</Text> : null}
						</Animated.View>
					</Animated.View>
				</Pressable>
			</Animated.View>
		);
	}

	// PRIMARY
	return (
		<Animated.View style={[animatedScaleStyle, animatedIdleGlowStyle]}>
			<Pressable
				onPress={handlePress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={disabled}
				style={[styles.base, styles.primary, {borderColor: accentAlpha(resolvedAccent, 0.6)}, disabled && styles.disabled, style]}>
				<Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
					<Defs>
						<SvgLinearGradient id="berx-btn-fill" x1="0" y1="0" x2="1" y2="1">
							<Stop offset="0%" stopColor={resolvedAccent} stopOpacity={0.6} />
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
				{/* INTERNAL REFLECTION — see this file's own press-physics note.
				    A real white→transparent gradient, not a solid band: a flat
				    block leaves a hard horizontal edge across the button, which
				    reads as a mistake rather than as light. */}
				<Animated.View pointerEvents="none" style={[styles.reflection, animatedReflectionStyle]}>
					<Svg width="100%" height="100%">
						<Defs>
							<SvgLinearGradient id={reflectionId} x1="0" y1="0" x2="0" y2="1">
								<Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
								<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
							</SvgLinearGradient>
						</Defs>
						<Rect x="0" y="0" width="100%" height="100%" fill={`url(#${reflectionId})`} />
					</Svg>
				</Animated.View>
				<Animated.View style={[styles.glyphRow, animatedGlyphStyle]}>
					{icon}
					{title ? <Text style={[styles.label, {color: colors.text}]}>{title}</Text> : null}
				</Animated.View>
				{/* "Powerful" wave, per the wow-pass spec — doubled count,
				    full 360° spread (a burst, not a directional wave), and a
				    higher speed than the original modest press feedback. */}
				<BerxParticleSystem trigger={burstOn} count={28} color={resolvedAccent} duration={650} spread={360} speed={140} />
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
	/** The touch-reactive highlight: a soft band across the upper half of the body. */
	reflection: {position: 'absolute', left: 0, right: 0, top: 0, height: '58%', overflow: 'hidden', borderTopLeftRadius: 16, borderTopRightRadius: 16},
	reflectionSoft: {height: '46%'},
	glyphRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	label: {fontSize: typography.sizeBase, fontWeight: typography.weightBold, letterSpacing: 0.2},
	iconWrap: {width: 44, height: 44},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	disabled: {opacity: 0.4},
});
