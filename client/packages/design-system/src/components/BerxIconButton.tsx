/**
 * !!! VERIFICATION STATUS: UNVERIFIED beyond this container's web
 * harness — see BerxButton.tsx's header for the standing note.
 *
 * BERX ICON BUTTON — the six real icon states, in one control.
 *
 * The product spec names them: DEFAULT, HOVER, PRESSED, ACTIVE,
 * DISABLED, SELECTED. Before this component those states existed only
 * as ad-hoc colour swaps at call sites (a `color={active ? accent :
 * textDim}` here, an opacity there), so "hover" and "pressed" were not
 * distinguishable at all on any surface, and SELECTED vs ACTIVE was not
 * a distinction the system could express. This is the one place that
 * owns them:
 *
 *   DEFAULT   — dim ink, glass at rest.
 *   HOVER     — real pointer signal (web) / touch-down (native): the
 *               surface lifts one depth step and the ink comes up.
 *   PRESSED   — compression, per the spec's own physical language:
 *               the surface goes to 96%, its shadow TIGHTENS (a
 *               pressed object is closer to its ground, so its shadow
 *               shrinks rather than growing), and the glyph itself
 *               moves a fraction — "the icon moves fractionally".
 *   ACTIVE    — the momentary "this just happened" state: accent ink,
 *               accent fill, glow, and the reaction choreography below.
 *   SELECTED  — the persistent "this is the current one" state. Reads
 *               differently from ACTIVE on purpose: a filled ring and
 *               accent ink, but no glow and no burst, because a nav
 *               item that is merely CURRENT should not keep announcing
 *               itself the way a like that JUST FIRED does.
 *   DISABLED  — flattened, no depth response, and genuinely inert (the
 *               spec's own "Disabled: no movement").
 *
 * THE REACTION, exactly as specified for LIKE: "tap → icon compresses
 * to 96%, expands to 104%, soft circular wave expands behind, small
 * particles react, count changes, icon settles. Total 350-500ms." That
 * is a real sequence here (withSequence at the spec's own numbers,
 * summing inside that window via the STANDARD motion tier), not a
 * generic bounce. `reaction` is opt-in: a nav icon does not need a
 * particle burst, so it does not pay for one.
 *
 * Depth and timing come from the Experience System tokens (BERX_DEPTH,
 * BERX_MOTION) rather than per-component numbers, so this control sits
 * on the same physical scale as every panel and card.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Platform, Pressable, StyleSheet} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, Easing} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {useBerxColors} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {BERX_DEPTH, depthShadow} from '../tokens/depth';
import {BERX_MOTION} from '../animation/motion';
import {BerxParticleSystem} from './BerxParticleSystem';

export type BerxIconButtonSize = 'sm' | 'md' | 'lg';

const SIZES: Record<BerxIconButtonSize, number> = {sm: 34, md: 44, lg: 54};

export interface BerxIconButtonProps {
	/** The glyph. A caller-supplied node (typically <BerxIcon/>) so this control never owns the icon family. */
	icon: ReactNode;
	/** The same glyph in its selected/active form, when one exists (e.g. a filled heart). Falls back to `icon`. */
	activeIcon?: ReactNode;
	onPress?: () => void;
	/** Momentary "this just fired" state — accent fill, glow, and the reaction choreography. */
	active?: boolean;
	/** Persistent "this is the current one" state — quieter than active on purpose (see this file's header). */
	selected?: boolean;
	disabled?: boolean;
	size?: BerxIconButtonSize;
	/** Fires the spec's own like choreography (compress → overshoot → wave → particles → settle) on the false→true edge of `active`. */
	reaction?: boolean;
	/** Drop the glass body and render the glyph alone, still with every state. For dense rows where a circle per icon would be noise. */
	bare?: boolean;
	style?: StyleProp<ViewStyle>;
	accessibilityLabel?: string;
}

function tryHaptic(style: Haptics.ImpactFeedbackStyle) {
	Haptics.impactAsync(style).catch(() => undefined);
}

export function BerxIconButton({
	icon,
	activeIcon,
	onPress,
	active = false,
	selected = false,
	disabled = false,
	size = 'md',
	reaction = false,
	bare = false,
	style,
	accessibilityLabel,
}: BerxIconButtonProps) {
	const colors = useBerxColors();
	const dim = SIZES[size];

	// One shared value per real state signal, so they compose instead of
	// fighting over a single "scale" the way per-call-site animation did.
	const press = useSharedValue(0);
	const hover = useSharedValue(0);
	const pop = useSharedValue(1);
	const wave = useSharedValue(0);
	const [burst, setBurst] = useState(false);
	const wasActive = useRef(active);

	// THE REACTION — the spec's own sequence and numbers.
	useEffect(() => {
		if (!reaction || disabled) {
			wasActive.current = active;
			return;
		}
		if (active && !wasActive.current) {
			pop.value = withSequence(
				withTiming(0.96, {duration: 90, easing: Easing.out(Easing.quad)}),
				withTiming(1.04, {duration: 130, easing: Easing.out(Easing.back(2))}),
				withSpring(1, BERX_MOTION.micro.spring)
			);
			wave.value = 0;
			wave.value = withTiming(1, {duration: BERX_MOTION.standard.duration, easing: Easing.out(Easing.quad)});
			setBurst(false);
			requestAnimationFrame(() => setBurst(true));
		}
		wasActive.current = active;
	}, [active, reaction, disabled, pop, wave]);

	// Reset the burst arm so a rapid re-tap fires a second, independent one.
	useEffect(() => {
		if (!burst) return;
		const t = setTimeout(() => setBurst(false), 60);
		return () => clearTimeout(t);
	}, [burst]);

	const bodyStyle = useAnimatedStyle(() => {
		// PRESSED compresses; HOVER lifts. Both feed one transform so they
		// can never overwrite each other (a real, previously-hit bug class
		// in this codebase: two style objects each defining `transform`).
		const compression = 1 - press.value * 0.04;
		const lift = hover.value * (1 - press.value);
		return {
			transform: [{scale: compression * pop.value * (1 + lift * 0.02)}],
			// A pressed object sits CLOSER to its ground, so its shadow
			// tightens rather than growing — the spec's own "shadow becomes
			// tighter" on press.
			shadowRadius: BERX_DEPTH[4].elevation.radius * (1 - press.value * 0.6) * (bare ? 0 : 1),
			shadowOpacity: (BERX_DEPTH[4].elevation.opacity + lift * 0.1) * (bare ? 0 : 1),
		};
	}, [press, hover, pop, bare]);

	// "the icon moves fractionally" — a real sub-pixel travel on press,
	// separate from the body so the glyph reads as sitting IN the control.
	const glyphStyle = useAnimatedStyle(() => ({
		transform: [{translateY: press.value * 0.8}],
		opacity: disabled ? 0.4 : 1,
	}), [press, disabled]);

	const waveStyle = useAnimatedStyle(() => ({
		opacity: (1 - wave.value) * 0.55,
		transform: [{scale: 0.6 + wave.value * 1.5}],
	}), [wave]);

	const on = active || selected;
	const styles = useMemo(() => makeStyles(dim), [dim]);

	const pointerHandlers =
		Platform.OS === 'web' && !disabled
			? ({
					onMouseEnter: () => {
						hover.value = withTiming(1, {duration: BERX_MOTION.micro.duration});
					},
					onMouseLeave: () => {
						hover.value = withTiming(0, {duration: BERX_MOTION.micro.duration});
						press.value = withSpring(0, BERX_MOTION.micro.spring);
					},
				} as unknown as Record<string, unknown>)
			: {};

	return (
		<Animated.View
			style={[
				styles.body,
				bare ? null : {backgroundColor: on ? accentAlpha(colors.accent, 0.18) : colors.glass1, borderColor: on ? colors.accent : colors.border, borderWidth: 1},
				bare ? null : depthShadow(4, colors.mediaScrim),
				// ACTIVE glows; SELECTED deliberately does not (see header).
				active && !bare ? {shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 12} : null,
				bodyStyle,
				style,
			]}>
			{/* The soft circular wave, behind the glyph, per the spec. */}
			{reaction ? <Animated.View pointerEvents="none" style={[styles.wave, {borderColor: colors.accent}, waveStyle]} /> : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
				accessibilityState={{disabled, selected: on}}
				disabled={disabled || !onPress}
				onPress={() => {
					if (disabled || !onPress) return;
					tryHaptic(Haptics.ImpactFeedbackStyle.Light);
					onPress();
				}}
				onPressIn={() => {
					if (disabled) return;
					press.value = withSpring(1, BERX_MOTION.micro.spring);
					hover.value = withTiming(1, {duration: BERX_MOTION.micro.duration});
				}}
				onPressOut={() => {
					if (disabled) return;
					press.value = withSpring(0, BERX_MOTION.micro.spring);
					if (Platform.OS !== 'web') hover.value = withTiming(0, {duration: BERX_MOTION.standard.duration});
				}}
				style={styles.hit}
				{...pointerHandlers}>
				<Animated.View style={glyphStyle}>{on && activeIcon ? activeIcon : icon}</Animated.View>
			</Pressable>
			{reaction ? <BerxParticleSystem trigger={burst} count={12} color={colors.accent} duration={420} spread={360} speed={70} /> : null}
		</Animated.View>
	);
}

const makeStyles = (dim: number) =>
	StyleSheet.create({
		body: {width: dim, height: dim, borderRadius: dim / 2, alignItems: 'center', justifyContent: 'center'},
		hit: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
		wave: {position: 'absolute', width: dim, height: dim, borderRadius: dim / 2, borderWidth: 1.5},
	});
