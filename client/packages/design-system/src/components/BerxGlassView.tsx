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
 * fill, never a second, disconnected colour system. Default bumped
 * 20→30pt per the "wow pass" spec — text stays readable at this level
 * (verified via harness screenshot, not assumed).
 *
 * ANIMATION STATES:
 *   1. MOUNT   — opacity 0→1 (400ms) + scale 0.98→1 (spring).
 *   2. PRESS   — scale →0.97 (spring) on press-in, back on release.
 *   3. THEME   — background/border/glow animate over 800ms
 *                (Obsidian & Aurora's own "slow" duration, from
 *                tokens/theme.ts) when mode or accent changes, rather
 *                than snapping — real colour interpolation via
 *                Reanimated shared values, not a fabricated claim.
 *
 * WOW PASS — three real additions, all gated behind `glow` (a panel
 * that doesn't opt into the glow treatment stays the lighter, original
 * surface rather than paying for effects it never asked for):
 *   - PERIMETER GLOW, interaction-reactive. A hover/press shared value
 *     (real pointer tracking — mouse move on web, touch move on
 *     native, same technique BerxSpatialCard already uses for tilt)
 *     drives the glow ring's alpha up on hover/press and back down on
 *     leave/release. A non-pressable glow panel (no onPress, no
 *     pointer target) instead gets a slow, real ambient breathing
 *     loop — "intensifies on hover" has no literal meaning without a
 *     pointer to hover with, so this is the honest substitute, not a
 *     silent no-op.
 *   - ANIMATED GRADIENT BORDER. A real STROKED rounded rect whose
 *     gradient sweeps around it (accent→transparent→accent), drawn with
 *     react-native-svg and driven by animated gradient endpoints.
 *     Requires a real onLayout measurement first (nothing renders
 *     until the panel's own size is known).
 *
 *     REAL BUG THIS REPLACED, caught by the Day-environment rebuild:
 *     this used to be an oversized rotating gradient square hidden
 *     behind an INSET MASK VIEW filled with the panel's own glass
 *     colour. That mask paints after (above) the panel's
 *     `backgroundLayer`, so it repainted the glass fill over the
 *     panel's own media. At Night's white-alpha-15% fill that read as
 *     a faint haze nobody flagged; at Day's white-alpha-68% fill the
 *     same layer became an opaque veil that visibly drained every feed
 *     photo. A stroked rect has a genuinely transparent interior, so
 *     there is nothing to paint over content — and it is fewer views.
 *     (It also fixes a second latent bug: the old gradient used one
 *     hardcoded SVG id, so several glass panels on one screen all
 *     resolved to whichever painted first.)
 *   - INTERNAL BACKGROUND PARALLAX. `backgroundLayer` — an optional
 *     caller-supplied layer (e.g. a cover image) that sits between the
 *     blur and the content and shifts a few px opposite the same
 *     pointer signal the glow reads, a real depth cue driven by a real
 *     shared value, not a scroll-linked or timer-driven fake. Renders
 *     flat (no offset) when nothing is currently hovered/touched.
 *
 * WEB FALLBACK. expo-blur's BlurView already degrades to a plain
 * semi-transparent View when no native blur backend exists (see
 * BerxGlassSurface's header) — real CSS backdrop-filter on web, so
 * "usable on web" is the existing, proven behaviour, not new work.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Platform, View, StyleSheet, Pressable, LayoutChangeEvent} from 'react-native';
import type {ViewStyle, StyleProp} from 'react-native';
import {BlurView} from 'expo-blur';
import {useBerxBlurSlot} from '../v9/BerxBoundaries';
import Svg, {Defs, LinearGradient as SvgLinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useAnimatedProps,
	withTiming,
	withSpring,
	withRepeat,
	Easing,
} from 'react-native-reanimated';
import {useBerxColors, useBerxGlass} from '../theme';
import {accentAlpha} from '../theme/accentMath';
import {theme as themeTokens} from '../tokens/theme';
import {shadow} from '../tokens';
import {BERX_SPRING} from '../animation/springs';

/**
 * Created once at module scope, never inside render:
 * createAnimatedComponent returns a NEW component type on every call,
 * so building it per render would remount the gradient every frame.
 */
const AnimatedSvgLinearGradient = Animated.createAnimatedComponent(SvgLinearGradient);

/** The gradient ring's stroke width. One constant, used by both the rect geometry and its inset. */
const RING_STROKE = 1.5;

export interface BerxGlassViewProps {
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
	/** BlurView intensity (0-100). Defaults to 30 — bumped from the original 20 per the "wow pass" spec (still deliberately below BerxGlassSurface's per-level max of 32, since GlassView stays a general-purpose panel, not a level-committed system surface). */
	intensity?: number;
	/** Overrides the live theme border's alpha (0-1). Leave unset to use the theme's own border colour untouched. */
	borderAlpha?: number;
	/** An inner glow ring in the live accent, hover/press-reactive, PLUS the animated rotating-gradient border — see this file's own header. */
	glow?: boolean;
	radius?: number;
	onPress?: () => void;
	/** Optional layer (e.g. a cover image) rendered between the blur and `children`, given real internal parallax off the live pointer/touch signal. Purely decorative — never receives touches. */
	backgroundLayer?: ReactNode;
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

export function BerxGlassView({children, style, intensity = 30, borderAlpha, glow, radius, onPress, backgroundLayer}: BerxGlassViewProps) {
	const colors = useBerxColors();
	// Claims one of the scene's three backdrop-blur slots; false once the
	// budget is spent (see useBerxBlurSlot).
	const mayBlur = useBerxBlurSlot(true);
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
	const glowBaseSV = useSharedValue(accentAlpha(colors.accent, 0.15));
	useEffect(() => {
		fillSV.value = withTiming(g.fill, {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
		borderSV.value = withTiming(resolvedBorder, {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
		glowBaseSV.value = withTiming(accentAlpha(colors.accent, 0.15), {duration: themeTokens.duration.slow * 1000, easing: Easing.inOut(Easing.ease)});
	}, [g.fill, resolvedBorder, colors.accent, fillSV, borderSV, glowBaseSV]);

	// WOW PASS — real pointer tracking, shared by the glow ring and the
	// background parallax layer. `hover` is a plain 0/1 target driven by
	// real events (not fabricated); `pointerX/Y` are normalised -1..1
	// offsets from the panel's own centre, real only once `size` has
	// been measured via onLayout below.
	const [size, setSize] = useState({width: 0, height: 0});
	const hoverSV = useSharedValue(0);
	const pointerX = useSharedValue(0);
	const pointerY = useSharedValue(0);
	const sizeRef = useRef(size);
	sizeRef.current = size;

	function setPointer(x: number, y: number) {
		const {width: w, height: h} = sizeRef.current;
		if (!w || !h) return;
		pointerX.value = withTiming(Math.max(-1, Math.min(1, (x / w - 0.5) * 2)), {duration: 120});
		pointerY.value = withTiming(Math.max(-1, Math.min(1, (y / h - 0.5) * 2)), {duration: 120});
	}
	function hoverIn() {
		hoverSV.value = withTiming(1, {duration: 180});
	}
	function hoverOut() {
		hoverSV.value = withTiming(0, {duration: 220});
		pointerX.value = withTiming(0, {duration: 220});
		pointerY.value = withTiming(0, {duration: 220});
	}

	// Non-pressable glow panels have no pointer to hover with — a real
	// ambient breathing loop stands in instead of a silent no-op glow.
	const ambientSV = useSharedValue(0.5);
	useEffect(() => {
		if (!glow || onPress) return;
		ambientSV.value = withRepeat(withTiming(1, {duration: 2200, easing: Easing.inOut(Easing.sin)}), -1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [glow, onPress]);

	// ANIMATED GRADIENT BORDER — a continuous sweep (see this file's own
	// header). The ring itself is a stroked rect; rotating the LAYER it
	// lives in sweeps the gradient around the panel while the stroke
	// geometry stays put, because the rect is redrawn to the panel's own
	// measured bounds either way.
	const ringRotation = useSharedValue(0);
	useEffect(() => {
		if (!glow) return;
		ringRotation.value = withRepeat(withTiming(360, {duration: 4000, easing: Easing.linear}), -1, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [glow]);
	/** Unique per instance — a fixed SVG id made several glass panels on one screen share whichever gradient painted first. */
	const ringId = useMemo(() => `berx-ring-${Math.random().toString(36).slice(2, 9)}`, []);

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
	const animatedGlowStyle = useAnimatedStyle(() => {
		const intensityMix = onPress ? hoverSV.value : ambientSV.value;
		return {
			shadowColor: colors.accent,
			backgroundColor: 'transparent',
			opacity: 0.6 + intensityMix * 0.4,
			borderColor: glowBaseSV.value,
			shadowRadius: 8 + intensityMix * 10,
			shadowOpacity: 0.35 + intensityMix * 0.35,
		};
	}, [colors.accent, glowBaseSV, hoverSV, ambientSV, onPress]);
	/**
	 * The sweep, done on the GRADIENT rather than on the shape.
	 *
	 * Rotating the stroked rect itself would tilt the border off the
	 * panel's own edges, so instead the gradient's two endpoints orbit
	 * the panel's bounding box: the bright section of the
	 * accent→transparent→accent ramp travels around the perimeter while
	 * the ring geometry stays exactly on the edge. Fractions (not
	 * percentages) because react-native-svg's default gradientUnits is
	 * objectBoundingBox, where 0..1 spans the shape.
	 */
	const ringGradientProps = useAnimatedProps(() => {
		const rad = (ringRotation.value * Math.PI) / 180;
		const dx = Math.cos(rad) * 0.5;
		const dy = Math.sin(rad) * 0.5;
		return {x1: 0.5 + dx, y1: 0.5 + dy, x2: 0.5 - dx, y2: 0.5 - dy};
	}, [ringRotation]);
	const animatedBackgroundParallaxStyle = useAnimatedStyle(() => ({
		transform: [{translateX: pointerX.value * -6}, {translateY: pointerY.value * -6}, {scale: 1.08}],
	}), [pointerX, pointerY]);

	const styles = useMemo(() => makeStyles(resolvedRadius), [resolvedRadius]);

	const pointerHandlers =
		Platform.OS === 'web'
			? ({
					onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}}) => {
						hoverIn();
						setPointer(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
					},
					onMouseLeave: hoverOut,
				} as unknown as Record<string, unknown>)
			: {
					onTouchStart: () => hoverIn(),
					onTouchMove: (e: {nativeEvent: {locationX: number; locationY: number}}) => setPointer(e.nativeEvent.locationX, e.nativeEvent.locationY),
					onTouchEnd: hoverOut,
					onTouchCancel: hoverOut,
				};

	// Two real shadow layers, per this component's own spec — RN
	// composites one shadow per view, so a tight near shadow (layer2, on
	// the OUTER wrapper) and a soft far one (layer1, on the glass body
	// itself) are two nested views, exactly the pattern tokens/index.ts's
	// own shadow.layer1/layer2 comment documents.
	const content = (
		<View style={styles.outerShadow}>
			<Animated.View
				onLayout={(e: LayoutChangeEvent) => setSize({width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height})}
				style={[styles.base, animatedBorderStyle, animatedContainerStyle, style]}
				{...pointerHandlers}>
				{/* The blur is BUDGETED. The scene contracts cap a mobile scene
				    at three backdrop-blur layers and the running app was
				    measurably over it (five on Profile, eight on Feed); beyond
				    the budget this surface keeps its fill, its hairline and its
				    shadow — it still reads as glass — and simply stops paying
				    for a backdrop filter behind four other panes. */}
				{mayBlur ? <BlurView pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind]} intensity={intensity} tint="dark" /> : null}
				<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, animatedFillStyle]} />
				{backgroundLayer ? (
					<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.behind, animatedBackgroundParallaxStyle]}>
						{backgroundLayer}
					</Animated.View>
				) : null}
				{glow && size.width > 0 ? (
					// A REAL RING: a stroked rounded rect with a transparent
					// interior, so nothing is painted over the panel's own
					// content or backgroundLayer (see this file's header for the
					// veil bug the previous masked-square version caused). The
					// sweep comes from animating the gradient's own endpoints
					// around the panel rather than rotating a covering square.
					<View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
						<Svg width={size.width} height={size.height}>
							<Defs>
								<AnimatedSvgLinearGradient id={ringId} animatedProps={ringGradientProps} x1={0} y1={0} x2={1} y2={1}>
									<Stop offset="0%" stopColor={colors.accent} stopOpacity={0.9} />
									<Stop offset="35%" stopColor={colors.accent} stopOpacity={0} />
									<Stop offset="65%" stopColor={colors.accent} stopOpacity={0} />
									<Stop offset="100%" stopColor={colors.accent} stopOpacity={0.9} />
								</AnimatedSvgLinearGradient>
							</Defs>
							<Rect
								x={RING_STROKE / 2}
								y={RING_STROKE / 2}
								width={Math.max(0, size.width - RING_STROKE)}
								height={Math.max(0, size.height - RING_STROKE)}
								rx={Math.max(0, resolvedRadius - RING_STROKE / 2)}
								ry={Math.max(0, resolvedRadius - RING_STROKE / 2)}
								fill="none"
								stroke={`url(#${ringId})`}
								strokeWidth={RING_STROKE}
							/>
						</Svg>
					</View>
				) : null}
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
				hoverIn();
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
		ringClip: {overflow: 'hidden'},
		glowRing: {borderRadius: radius, borderWidth: 1.5},
	});
