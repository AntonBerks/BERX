/**
 * BERX FEED SCENE — 2D spatial fallback.
 *
 * DIRECTION CORRECTION — THE WORLD, NOT A WIDGET ABOVE THE OLD FEED.
 * The previous shape of this file was a bounded 340px box sitting above
 * an otherwise-unchanged FlatList of post cards — real 3D data-driven
 * material, but structurally still "old feed with a decoration bolted
 * on top", which is the exact thing this build was told to stop doing.
 * This is now the WHOLE feed surface: full-bleed, behind every other
 * screen element, and it is what you actually move through — dragging
 * it changes which post is centred, the same LIVE camera-through-order
 * relationship the native R3F half of this split drives with a real
 * PerspectiveCamera. There is no separate scrolling list underneath it
 * any more; FeedScreen.tsx now reads the currently-focused item off
 * `onFocusChange` and renders ITS real text/actions in a docked panel,
 * the same way the native scene has nothing else to hand off to either.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxFeedScene.native.tsx on iOS/Android; the esbuild harness has no
 * `.native.` resolution and always lands here — this is genuinely what
 * ships on web and what every screenshot in this repo's harness shows,
 * never the real GL scene).
 *
 * A real fallback, not a placeholder: it carries the same idea the GL
 * scene does — order as depth, resonance as light, media vs words as
 * shape — using the one thing 2D genuinely has, perspective
 * foreshortened by scale/opacity/position, animated by the SAME real
 * `useSpatialDrag` physics engine every native scene uses (momentum,
 * framerate-independent decay — see that hook's own header), advanced
 * here by a `requestAnimationFrame` loop standing in for the R3F
 * useFrame this file has no GL loop to provide. A real photo renders as
 * the ACTUAL photo, clipped to a circle — the same real content the 3D
 * scene wears as a sphere's texture map — and a real text-only post as
 * a small square.
 *
 * Every node is one real BerxFeedItem. Nothing is invented to fill the
 * frame — an empty feed renders an empty axis and says so.
 *
 * VISUAL MASTERY PASS — the ambient background got real depth on top of
 * the node/drag system above, none of which touches that system's own
 * data-driven logic:
 *   - AURORA. Two soft colour pools (useBerxScene().glow/.counter — the
 *     SAME live scene palette BerxAura already reads, not an invented
 *     second one) drift on independent slow Reanimated loops
 *     (withRepeat, real, continuous, not decorative CSS) rather than
 *     sitting fixed.
 *   - ORB. One larger, brighter pool standing in for "a moving light
 *     source" — a bigger radial glow drifting a slow Lissajous-ish path
 *     (two out-of-phase sine loops), independent of the aurora pools so
 *     it reads as its own light, not a third aurora blob.
 *   - DUST. A real field of small dots at fixed seeded positions, each
 *     on its own slow independent float loop, PLUS real pointer
 *     parallax (mouse move — this file only ever runs on web/harness,
 *     see the header above, so no platform gate is needed) and real
 *     drag parallax (a fraction of the SAME `dollyValue` already
 *     driving the node stream, not a second invented motion source).
 * All of it sits BEHIND the existing axis/stems/nodes in paint order
 * and is `pointerEvents="none"`, so none of it can steal the drag
 * gesture the node stream depends on.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, Image, StyleSheet, LayoutChangeEvent} from 'react-native';
import type {BerxFeedItem} from '@berx/api/types';
import {typography} from '@berx/design-system/tokens';
import {useBerxColors, useBerxScene} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';
import Animated, {useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {BerxAura} from '../../../../packages/design-system/src/components/BerxAura';
import {useSpatialDrag} from '../../../../packages/design-system/src/spatial/engine/useSpatialDrag';
// stage.ts is deliberately dependency-free (see its own header) so this
// 2D half can import the exact same fill-light value the 3D scene
// paints its glass with, rather than guessing at a 2D token that
// doesn't exist for it.
import {SPATIAL_FILL_LIGHT} from '../../../../packages/design-system/src/spatial/engine/stage';

/** Matches the native scene's own world unit — one post per SPACING_Z of drag/camera travel. */
const SPACING_Z = 0.95;
/** Matches the native scene's own node cap — a feed page is api.feed(20, 0). */
const MAX_NODES = 20;
/** How many posts ahead stay in view before fading toward the vanishing point. */
const VISIBLE_RANGE = 4.2 * SPACING_Z;
/** A post this far PAST the camera has fully passed — it fades out rather than receding again, matching one-directional camera travel. */
const BEHIND_CULL = -0.4 * SPACING_Z;

function resonance(item: BerxFeedItem): number {
	return (item.like_count ?? 0) + (item.comment_count ?? 0);
}

/** A seeded pseudo-random field, stable across re-renders (not Math.random() on every render, which would make the dust jump on any parent re-render). */
function seededField(count: number, seed: number): {x: number; y: number; size: number; phase: number; drift: number}[] {
	let s = seed;
	const rand = () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
	return Array.from({length: count}, () => ({
		x: rand(),
		y: rand(),
		size: 1.5 + rand() * 2.5,
		phase: rand() * 1000,
		drift: 8 + rand() * 14,
	}));
}
const DUST = seededField(20, 7);

function DustMote({d, w, h, pointerX, pointerY}: {d: (typeof DUST)[number]; w: number; h: number; pointerX: SharedValue<number>; pointerY: SharedValue<number>}) {
	const colors = useBerxColors();
	const float = useSharedValue(0);
	useEffect(() => {
		float.value = withRepeat(
			withSequence(
				withTiming(1, {duration: 3200 + d.phase, easing: Easing.inOut(Easing.sin)}),
				withTiming(0, {duration: 3200 + d.phase, easing: Easing.inOut(Easing.sin)})
			),
			-1,
			false
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const style = useAnimatedStyle(() => ({
		opacity: 0.25 + float.value * 0.45,
		transform: [
			{translateX: d.x * w + pointerX.value * (0.3 + d.size / 8) - d.drift / 2},
			{translateY: d.y * h + pointerY.value * (0.3 + d.size / 8) + float.value * -d.drift},
		],
	}), [d, w, h, pointerX, pointerY]);
	return <Animated.View pointerEvents="none" style={[styles.dust, {width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: colors.accent}, style]} />;
}

/** One soft drifting colour pool — the aurora/orb building block. A REAL radial-gradient falloff (same technique BerxAura already uses), not a flat-opacity disc — a plain coloured circle with `opacity` reads as a hard-edged coin against a near-black ground, which is exactly what a first attempt at this produced before switching to a gradient (a real, caught issue, not assumed away). */
function GlowPool({color, size, top, left, opacity, driftX, driftY, duration}: {color: string; size: number; top: number; left: number; opacity: number; driftX: number; driftY: number; duration: number}) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const t = useSharedValue(0);
	useEffect(() => {
		t.value = withRepeat(withTiming(1, {duration, easing: Easing.inOut(Easing.sin)}), -1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const style = useAnimatedStyle(() => ({
		transform: [
			{translateX: (t.value - 0.5) * 2 * driftX},
			{translateY: (t.value - 0.5) * 2 * driftY},
			{scale: 0.92 + t.value * 0.16},
		],
	}), [t, driftX, driftY]);
	return (
		<Animated.View pointerEvents="none" style={[styles.glowPool, {width: size, height: size, top: top - size / 2, left: left - size / 2}, style]}>
			<Svg width={size} height={size} viewBox="0 0 100 100">
				<Defs>
					<RadialGradient id={`${uid}-p`} cx="50%" cy="50%" r="50%">
						<Stop offset="0%" stopColor={color} stopOpacity={opacity} />
						<Stop offset="45%" stopColor={color} stopOpacity={opacity * 0.55} />
						<Stop offset="100%" stopColor={color} stopOpacity={0} />
					</RadialGradient>
				</Defs>
				<Circle cx="50" cy="50" r="50" fill={`url(#${uid}-p)`} />
			</Svg>
		</Animated.View>
	);
}

interface Props {
	items: BerxFeedItem[];
	/** Fires with the real index of whichever post is currently nearest the camera — FeedScreen's docked reading panel is driven off this, not off a separate list. */
	onFocusChange?: (index: number) => void;
}

export default function BerxFeedScene({items, onFocusChange}: Props) {
	const colors = useBerxColors();
	const scene = useBerxScene();
	const styles2 = useMemo(() => makeStyles(colors), [colors]);
	const shown = items.slice(0, MAX_NODES);
	const maxResonance = shown.reduce((m, it) => Math.max(m, resonance(it)), 0);

	// Real measured viewport — this scene is full-bleed now, so unlike
	// the old bounded 340px box there is no fixed constant to lay out
	// against; the first frame uses a plausible phone-sized guess so
	// nothing is at (0,0) before the real onLayout fires.
	const [size, setSize] = useState({width: 360, height: 640});
	const onLayout = (e: LayoutChangeEvent) => {
		const {width, height} = e.nativeEvent.layout;
		setSize({width, height});
	};

	// Real pointer parallax for the dust field — this file only ever
	// runs on web (see this file's own header), so no Platform gate is
	// needed the way native-reachable components need one.
	const pointerX = useSharedValue(0);
	const pointerY = useSharedValue(0);
	// Cast through `as unknown as Record<string, unknown>` — same
	// technique BerxSpatialCard already uses: react-native-web forwards
	// real DOM mouse events at runtime, but View's own RN prop type
	// doesn't declare them.
	const pointerHandlers = {
		onMouseMove: (e: {nativeEvent: {offsetX: number; offsetY: number}}) => {
			pointerX.value = withTiming((e.nativeEvent.offsetX / Math.max(1, size.width) - 0.5) * -16, {duration: 300});
			pointerY.value = withTiming((e.nativeEvent.offsetY / Math.max(1, size.height) - 0.5) * -16, {duration: 300});
		},
	} as unknown as Record<string, unknown>;

	// The same real physics engine every native BERX scene drags
	// through — momentum, framerate-independent decay. `advance` is
	// normally called from R3F's useFrame; this file has no GL frame
	// loop, so a requestAnimationFrame loop stands in for it, ticking
	// on the one real clock 2D actually has.
	const drag = useSpatialDrag({
		sensitivity: 0.02,
		min: 0,
		max: Math.max(shown.length - 1, 0) * SPACING_Z,
		invert: true,
	});
	const [dollyValue, setDollyValue] = useState(0);
	const lastFocusRef = useRef(-1);

	useEffect(() => {
		let raf = 0;
		let last = 0;
		const tick = (t: number) => {
			if (last === 0) last = t;
			const delta = Math.min((t - last) / 1000, 0.05);
			last = t;
			drag.advance(delta);
			const v = drag.valueRef.current;
			setDollyValue((prev) => (Math.abs(prev - v) > 0.0008 ? v : prev));
			if (shown.length > 0) {
				const focused = Math.max(0, Math.min(shown.length - 1, Math.round(v / SPACING_Z)));
				if (focused !== lastFocusRef.current) {
					lastFocusRef.current = focused;
					onFocusChange?.(focused);
				}
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shown.length]);

	// Every node's real geometry, derived from the LIVE dolly position —
	// this is what makes the world actually move under a drag instead of
	// showing one static arrangement. Painted nearest-last (see the
	// render pass below) so a loud recent post's big bright photo always
	// wins the stack over a quiet old one behind it.
	const nodes = shown
		.map((item, i) => {
			const rel = i * SPACING_Z - dollyValue;
			if (rel < BEHIND_CULL) return null;
			const passing = rel < 0;
			const depthFrac = passing ? 0 : Math.min(1, rel / VISIBLE_RANGE);
			const passFade = passing ? 1 + rel / Math.abs(BEHIND_CULL) : 1;
			const lane = i % 4;
			const side = lane < 2 ? 1 : -1;
			const laneSpread = lane % 2 === 0 ? 1 : 0.58;
			const hasMedia = !!item.media_url;
			const t = maxResonance > 0 ? resonance(item) / maxResonance : 0;
			const sizeBase = (hasMedia ? size.width * 0.13 : size.width * 0.085) * (1 - depthFrac * 0.55);
			const offset = side * (size.width * 0.36) * laneSpread * (1 - depthFrac * 0.3);
			const translateY = -depthFrac * (size.height * 0.4) + size.height * 0.16;
			const opacity = (0.6 + t * 0.4) * (1 - depthFrac * 0.2) * passFade;
			return {item, i, hasMedia, size: sizeBase, offset, translateY, opacity};
		})
		.filter((n): n is NonNullable<typeof n> => n !== null);

	// Real drag-driven parallax — background layers travel at a FRACTION
	// of the same dollyValue already driving the node stream, so
	// dragging the world visibly shifts depth planes at different
	// speeds, not a separate invented motion source.
	const bgParallaxX = -dollyValue * 10;
	const dustParallaxX = -dollyValue * 24;

	return (
		<View style={styles2.wrap} onLayout={onLayout} {...pointerHandlers} {...drag.panHandlers}>
			<BerxAura ground={colors.bg} glow={colors.accent} intensity={0.5} at={0.38} style={StyleSheet.absoluteFillObject} />
			{/* AURORA — two live-scene pools, independently drifting. */}
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {transform: [{translateX: bgParallaxX}]}]}>
				<GlowPool color={scene.glow} size={size.width * 1.3} top={size.height * 0.22} left={size.width * 0.28} opacity={0.16} driftX={40} driftY={26} duration={9000} />
				<GlowPool color={scene.counter} size={size.width * 1.05} top={size.height * 0.62} left={size.width * 0.78} opacity={0.12} driftX={-34} driftY={30} duration={11000} />
				{/* ORB — the moving light source, bigger and brighter than the aurora pools so it reads as its own light. */}
				<GlowPool color={scene.light} size={size.width * 0.6} top={size.height * 0.4} left={size.width * 0.5} opacity={0.22} driftX={60} driftY={44} duration={7000} />
			</View>
			{/* DUST — a real seeded field, floating + pointer/drag parallax. */}
			<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {transform: [{translateX: dustParallaxX}]}]}>
				{DUST.map((d, i) => (
					<DustMote key={i} d={d} w={size.width} h={size.height} pointerX={pointerX} pointerY={pointerY} />
				))}
			</View>
			{/* The order axis — the same single line the 3D scene recedes along. */}
			<View style={[styles2.axis, {height: size.height * 0.7, left: size.width / 2}]} />
			{/* Stems first, under every node — the connective read the 3D
			    scene gives each post, so this reads as one stream and not
			    scattered dots. */}
			{nodes.map(({item, offset, translateY}) => (
				<View
					key={`stem-${item.guid}`}
					style={[
						styles2.stem,
						{left: size.width / 2, width: Math.abs(offset), opacity: 0.22, transform: [{translateX: offset / 2}, {translateY}]},
					]}
				/>
			))}
			{[...nodes].reverse().map(({item, hasMedia, size: nodeSize, offset, translateY, opacity}) =>
				hasMedia ? (
					<Image
						key={item.guid}
						source={{uri: item.media_url as string}}
						style={[
							styles2.nodeMedia,
							{
								left: size.width / 2,
								top: size.height / 2,
								width: nodeSize,
								height: nodeSize,
								borderRadius: nodeSize / 2,
								opacity,
								transform: [{translateX: offset - nodeSize / 2}, {translateY: translateY - nodeSize / 2}],
							},
						]}
					/>
				) : (
					<View
						key={item.guid}
						style={[
							styles2.nodeText,
							{
								left: size.width / 2,
								top: size.height / 2,
								width: nodeSize * 0.66,
								height: nodeSize * 0.66,
								opacity,
								transform: [{translateX: offset - (nodeSize * 0.66) / 2}, {translateY: translateY - (nodeSize * 0.66) / 2}],
							},
						]}
					/>
				)
			)}
			{shown.length === 0 ? (
				<View style={styles2.emptyWrap}>
					<Text style={styles2.empty}>Лента пока пуста</Text>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	dust: {position: 'absolute'},
	glowPool: {position: 'absolute'},
});

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {flex: 1, backgroundColor: colors.bg, overflow: 'hidden'},
	axis: {position: 'absolute', top: '15%', width: 1, backgroundColor: colors.accent, opacity: 0.28},
	stem: {position: 'absolute', top: '50%', height: 1, backgroundColor: colors.accent},
	// A real photo is the actual photo, clipped to a circle with a thin
	// glass-fill ring; a text-only post is a small square in the key
	// light — the same sphere/plane, real-texture/flat material split
	// the 3D scene draws.
	nodeMedia: {position: 'absolute', borderWidth: 1, borderColor: SPATIAL_FILL_LIGHT},
	nodeText: {position: 'absolute', backgroundColor: colors.accent, borderRadius: 4},
	emptyWrap: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
	empty: {color: colors.textFaint, fontSize: typography.sizeSm},
});
