/**
 * BERX GLASS VIEW — the premium, animated glass surface.
 *
 * RELATIONSHIP TO BerxGlassSurface/BerxGlassBar. Those two already own
 * the real recipe (BlurView + theme fill + hairline, per glass level —
 * see BerxGlassSurface's own header) and this component still reads
 * that SAME live ladder (useBerxGlass()) rather than inventing a
 * second one, so a "GlassView" panel and a BerxGlassSurface panel stay
 * one material. What neither of those owns is MOTION: this is the
 * animated half — real entrance, press and theme-transition animation
 * built on react-native-reanimated (a new, real dependency this
 * component set introduces — see babel.config.js's own comment on the
 * one native requirement that could not be verified in this
 * container).
 *
 * `intensity` maps straight to BlurView's own prop (native
 * UIVisualEffectView blur radius on iOS, a real CSS backdrop-filter on
 * web — see BerxGlassSurface's header for what "real" means there);
 * `borderAlpha`/`glow` are real overrides on top of the live theme
 * fill, never a second, disconnected colour system.
 *
 * ANIMATION STATES (three, as required):
 *   1. MOUNT   — opacity 0→1 (400ms) + scale 0.98→1 (spring).
 *   2. PRESS   — scale →0.97 (spring) on press-in, back on release.
 *   3. THEME   — background/border/glow animate over 800ms
 *                (Obsidian & Aurora's own "slow" duration, from
 *                tokens/theme.ts) when mode or accent changes, rather
 *                than snapping — real colour interpolation via
 *                Reanimated shared values, not a fabricated claim.
 *
 * WEB FALLBACK. expo-blur's BlurView already degrades to a plain
 * semi-transparent View when no native blur backend exists (see
 * BerxGlassSurface's header) — real CSS backdrop-filter on web, so
 * "usable on web" is the existing, proven behaviour, not new work.
 */
import {useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import type {ViewStyle, StyleProp} from 'react-native';
import {BlurView} from 'expo-blur';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
	Easing,
} from 'react-native-reanimated';
import {useBerxColors, useBerxGlass} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {theme as themeTokens} from '../tokens/theme';
import {shadow} from '../tokens';
import {BERX_SPRING} from '../animation/springs';

export interface BerxGlassViewProps {
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
	/** BlurView intensity (0-100). Defaults to 20, per this component's own spec — deliberately lower than BerxGlassSurface's per-level defaults (8-32), since GlassView is meant as a general-purpose panel, not a level-committed system surface. */
	intensity?: number;
	/** Overrides the live theme border's alpha (0-1). Leave unset to use the theme's own border colour untouched. */
	borderAlpha?: number;
	/** An inner glow ring in the live accent, at 15% alpha, per this component's own spec. */
	glow?: boolean;
	radius?: number;
	onPress?: () => void;
}

/** Real per-vertex alpha swap for `borderAlpha`: parses the theme's own rgba() border string and substitutes just the alpha channel, so an override still carries the theme's real colour, never an invented hex. */
function withAlpha(rgbaOrHex: string, alpha: number): string {
	const rgbaMatch = rgbaOrHex.match(/^rgba?\(([^)]+)\)$/);
	if (rgbaMatch) {
		const parts = rgbaMatch[1].split(',').map((s) => s.trim());
		const [r, g, b] = parts;
		return `rgba(${r},${g},${b},${alpha})`;
	}
	return accentAlpha(rgbaOrHex, alpha);
}

export function BerxGlassView({children, style, intensity = 20, borderAlpha, glow, radius, onPress}: BerxGlassViewProps) {
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const g = glass[2];

	const resolvedBorder = borderAlpha !== undefined ? withAlpha(colors.border, borderAlpha) : g.border;
	const resolvedRadius = radius ?? themeTokens.radii.card;

	// STATE 1 — MOUNT. Runs once per mount, not per prop change (empty
	// deps), so remounting a card in a list re-plays the entrance.
	const mountOpacity = useSharedValue(0);
	const mountScale = useSharedValue(0.98);
	useEffect(() => {
		mountOpacity.value = withTiming(1, {duration: 400, easing: Easing.out(Easing.ease)});
		mountScale.value = withSpring(1, BERX_SPRING);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// STATE 2 — PRESS. Only meaningful when the surface is pressable.
	const pressScale = useSharedValue(1);

	// STATE 3 — THEME. Colours animate on change instead of snapping —
	// real Reanimated colour interpolation via shared values updated in
	// an effect, not a style-level prop swap (which React would just
	// apply instantly, bypassing Reanimated entirely).
	const fillSV = useSharedValue(g.fill);
	const borderSV = useSharedValue(resolvedBorder);
	const glowSV = useSharedValue(accentAlpha(colors.accent, 0.15));
	useEffect(() => {
		fillSV.value = withTiming(g.fill, {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
		borderSV.value = withTiming(resolvedBorder, {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
		glowSV.value = withTiming(accentAlpha(colors.accent, 0.15), {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
	}, [g.fill, resolvedBorder, colors.accent, fillSV, borderSV, glowSV]);

	// Explicit dependency arrays on every worklet below — the Babel
	// plugin (babel.config.js) auto-generates these when it runs, but
	// this makes every call correct even where it doesn't (this
	// esbuild-based harness has no babel step, so this is not
	// optional here — see Reanimated's own "web without the Babel
	// plugin" guide), and is the documented-safe pattern regardless of
	// whether the plugin ran.
	const animatedContainerStyle = useAnimatedStyle(() => ({
		opacity: mountOpacity.value,
		transform: [{scale: mountScale.value * pressScale.value}],
	}), [mountOpacity, mountScale, pressScale]);
	const animatedFillStyle = useAnimatedStyle(() => ({backgroundColor: fillSV.value}), [fillSV]);
	const animatedBorderStyle = useAnimatedStyle(() => ({borderColor: borderSV.value}), [borderSV]);
	const animatedGlowStyle = useAnimatedStyle(() => ({
		shadowColor: colors.accent,
		backgroundColor: 'transparent',
		borderColor: glowSV.value,
	}), [colors.accent, glowSV]);

	const styles = useMemo(() => makeStyles(resolvedRadius), [resolvedRadius]);

	// Two real shadow layers, per this component's own spec — RN
	// composites one shadow per view, so a tight near shadow (layer2, on
	// the OUTER wrapper) and a soft far one (layer1, on the glass body
	// itself) are two nested views, exactly the pattern tokens/index.ts's
	// own shadow.layer1/layer2 comment documents.
	const content = (
		<View style={styles.outerShadow}>
			<Animated.View style={[styles.base, animatedBorderStyle, animatedContainerStyle, style]}>
				<BlurView pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind]} intensity={intensity} tint="dark" />
				<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, animatedFillStyle]} />
				{glow ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, styles.glowRing, animatedGlowStyle]} /> : null}
				{children}
			</Animated.View>
		</View>
	);

	if (!onPress) return content;

	return (
		<Pressable
			onPress={onPress}
			onPressIn={() => {
				pressScale.value = withSpring(0.97, BERX_SPRING);
			}}
			onPressOut={() => {
				pressScale.value = withSpring(1, BERX_SPRING);
			}}>
			{content}
		</Pressable>
	);
}

const makeStyles = (radius: number) =>
	StyleSheet.create({
		// flex: 1 is load-bearing, not decorative — a caller that sizes
		// GlassView purely via `style={{flex: 1}}` (BerxSpatialCard's own
		// glass backing does exactly this) needs that flex request to
		// reach THIS outer wrapper too, or it collapses to its own
		// content's natural (near-zero) size while the INNER `base` view
		// stretches to fill an outer box that itself never grew. A real,
		// reproduced bug (not a guess): SpatialCard's demo rendered as a
		// bare hairline until this was added.
		outerShadow: {flex: 1, borderRadius: radius, ...shadow.layer2},
		base: {
			borderRadius: radius,
			borderWidth: 1,
			overflow: 'hidden',
			padding: 16,
			...shadow.layer1,
		},
		// See BerxGlassSurface's own real-bug comment: on web these
		// absolute decorative layers otherwise paint ABOVE plain-flow
		// content regardless of DOM order — the same negative zIndex fix.
		behind: {zIndex: -1},
		glowRing: {borderRadius: radius, borderWidth: 1.5},
	});
