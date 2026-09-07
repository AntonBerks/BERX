/**
 * BERX AURORA FIELD — the shared living background: real drifting
 * aurora pools + a real three-depth-layer particle field.
 *
 * Extracted from BerxFeedScene.tsx's own background (see that file's
 * header for the full reasoning this reuses verbatim, not
 * reinvents) once a SECOND real screen (the onboarding flow — Splash,
 * Discover) needed the same living-background language. One real
 * implementation, two callers, not a copy that drifts.
 *
 * Reads `useBerxScene()` for its colours — the same live scene palette
 * BerxAura/BerxFeedScene already read, not an invented second one, so
 * an accent/mode switch repaints this the same way it repaints
 * everything else.
 *
 * PARTICLE COST, disclosed the same way BerxFeedScene's own header
 * discloses it: every mote here is a real per-frame Reanimated View,
 * not a GPU point sprite — `particleCount` defaults to a real, tested,
 * perf-conscious number (90, 45 on Android), not the largest number
 * that would still look fine on a powerful device.
 *
 * PARALLAX (added for the cinematic onboarding rebuild — one background
 * now stays MOUNTED across many screens, so a depth cue that responds
 * to a real input reads far better than a purely ambient drift alone).
 * `parallax` is optional and additive — every existing caller (Splash,
 * Discover) that doesn't pass it gets byte-identical behaviour to
 * before. When passed, it's a pair of Reanimated shared values in
 * roughly [-1, 1] (the caller's own real pointer/tilt signal — see
 * CinematicOnboarding's own `useAmbientParallax` hook for what actually
 * drives them); each depth layer is offset by that signal scaled by its
 * OWN depth multiplier (near moves most, far moves least, the aurora
 * pools barely at all) — a real per-layer parallax, not one flat shift
 * applied to the whole field.
 */
import {useEffect, useMemo} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import type {ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, type SharedValue} from 'react-native-reanimated';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {useBerxScene} from '../theme';
import {useBerxReducedMotion} from '../v9/BerxBoundaries';

/** One soft drifting colour pool — a real radial-gradient falloff (a flat-opacity circle reads as a hard-edged coin, a real, previously-caught mistake — see BerxFeedScene.tsx's own git history). */
function GlowPool({color, size, top, left, opacity, driftX, driftY, duration, parallax, parallaxMul = 0}: {color: string; size: number; top: number; left: number; opacity: number; driftX: number; driftY: number; duration: number; parallax?: {x: SharedValue<number>; y: SharedValue<number>}; parallaxMul?: number}) {
	const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
	const t = useSharedValue(0);
	// REDUCED MOTION. This ambient drift used to run unconditionally, so
	// the atmosphere layer kept moving on every scene even when the OS had
	// asked for less motion — an accessibility contract that silently did
	// nothing, caught by measuring moving layers in a real browser under
	// prefers-reduced-motion. The pool still RENDERS (the depth cue and
	// the lighting survive); only the movement stops.
	const reduced = useBerxReducedMotion();
	useEffect(() => {
		if (reduced) {
			t.value = 0.5;
			return;
		}
		t.value = withRepeat(withTiming(1, {duration, easing: Easing.inOut(Easing.sin)}), -1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reduced]);
	const style = useAnimatedStyle(() => {
		const px = parallax ? parallax.x.value * parallaxMul : 0;
		const py = parallax ? parallax.y.value * parallaxMul : 0;
		return {
			transform: [{translateX: (t.value - 0.5) * 2 * driftX + px}, {translateY: (t.value - 0.5) * 2 * driftY + py}, {scale: 0.92 + t.value * 0.16}],
		};
	}, [t, driftX, driftY, parallax, parallaxMul]);
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

function seededField(count: number, seed: number): {x: number; y: number; sizeRand: number; phase: number; drift: number}[] {
	let s = seed;
	const rand = () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
	return Array.from({length: count}, () => ({x: rand(), y: rand(), sizeRand: rand(), phase: rand() * 1000, drift: 6 + rand() * 12}));
}

function DustMote({d, w, h, size, color, floatDuration, parallax, parallaxMul}: {d: {x: number; y: number; phase: number; drift: number}; w: number; h: number; size: number; color: string; floatDuration: number; parallax?: {x: SharedValue<number>; y: SharedValue<number>}; parallaxMul: number}) {
	const float = useSharedValue(0);
	// Same reduced-motion contract as GlowPool above: the mote keeps its
	// position and its opacity so the field still reads as depth, and
	// stops travelling.
	const reduced = useBerxReducedMotion();
	useEffect(() => {
		if (reduced) {
			float.value = 0.5;
			return;
		}
		float.value = withRepeat(
			withSequence(
				withTiming(1, {duration: floatDuration + d.phase, easing: Easing.inOut(Easing.sin)}),
				withTiming(0, {duration: floatDuration + d.phase, easing: Easing.inOut(Easing.sin)})
			),
			-1,
			false
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reduced]);
	const style = useAnimatedStyle(() => {
		const px = parallax ? parallax.x.value * parallaxMul : 0;
		const py = parallax ? parallax.y.value * parallaxMul : 0;
		return {
			opacity: 0.25 + float.value * 0.45,
			transform: [{translateX: d.x * w - d.drift / 2 + px}, {translateY: d.y * h + float.value * -d.drift + py}],
		};
	}, [d, w, h, parallax, parallaxMul]);
	return <Animated.View pointerEvents="none" style={[styles.dust, {width: size, height: size, borderRadius: size / 2, backgroundColor: color}, style]} />;
}

interface DustLayerConfig {
	name: 'near' | 'mid' | 'far';
	count: number;
	minSize: number;
	maxSize: number;
	floatBase: number;
	seed: number;
}

export interface BerxAuroraFieldProps {
	width: number;
	height: number;
	/** Real per-mote budget — 90 default (45 on Android), see this file's own header. */
	particleCount?: number;
	style?: ViewStyle;
	/** Optional real pointer/tilt-driven depth cue — see this file's own header. Omit for the original ambient-only behaviour. */
	parallax?: {x: SharedValue<number>; y: SharedValue<number>};
}

/** The three real depth layers — near (bigger/faster), mid, far (smaller/slower). Same real technique BerxFeedScene's own dust field uses; now optionally driven by a caller-supplied parallax signal too (see header). */
export function BerxAuroraField({width, height, particleCount, style, parallax}: BerxAuroraFieldProps) {
	const scene = useBerxScene();
	const total = particleCount ?? (Platform.OS === 'android' ? 45 : 90);
	const layers: DustLayerConfig[] = useMemo(
		() => [
			{name: 'near', count: Math.round(total * 0.22), minSize: 3, maxSize: 4.5, floatBase: 2000, seed: 11},
			{name: 'mid', count: Math.round(total * 0.35), minSize: 1.8, maxSize: 2.8, floatBase: 2900, seed: 23},
			{name: 'far', count: Math.round(total * 0.43), minSize: 0.8, maxSize: 1.5, floatBase: 3800, seed: 37},
		],
		[total]
	);
	const fields = useMemo(() => layers.map((layer) => ({layer, items: seededField(layer.count, layer.seed)})), [layers]);

	if (width <= 0 || height <= 0) return null;

	return (
		<View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
			{/* THREE real aurora pools, per this component's own callers'
			    shared spec — same live scene palette every other real
			    aurora-drawing surface in this codebase reads. */}
			<GlowPool color={scene.glow} size={width * 1.5} top={height * 0.2} left={width * 0.26} opacity={0.17} driftX={44} driftY={28} duration={18000} parallax={parallax} parallaxMul={4} />
			<GlowPool color={scene.counter} size={width * 1.25} top={height * 0.6} left={width * 0.8} opacity={0.13} driftX={-38} driftY={32} duration={24000} parallax={parallax} parallaxMul={3} />
			<GlowPool color={scene.fill} size={width * 1.1} top={height * 0.85} left={width * 0.24} opacity={0.11} driftX={30} driftY={-24} duration={32000} parallax={parallax} parallaxMul={2} />
			{/* The drifting ORB — a moving light source, distinct from the
			    three pools above. This is the one place the atmosphere
			    spends the brand accent (scene.light), and it is deliberately
			    the faintest thing in the field: "restrained highlights". */}
			<GlowPool color={scene.light} size={Math.max(width, height) * 0.72} top={height * 0.42} left={width * 0.5} opacity={0.1} driftX={64} driftY={48} duration={21000} parallax={parallax} parallaxMul={5} />
			{fields.map(({layer, items}, layerIdx) => (
				<View key={layer.name} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
					{items.map((d, i) => (
						// scene.dust, not scene.light — particles are a
						// LUMINANCE effect, not a hue one (see scene.ts's own
						// note on why this role was split out).
						<DustMote key={i} d={d} w={width} h={height} size={layer.minSize + d.sizeRand * (layer.maxSize - layer.minSize)} color={scene.dust} floatDuration={layer.floatBase} parallax={parallax} parallaxMul={[26, 15, 7][layerIdx]} />
					))}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	dust: {position: 'absolute'},
	glowPool: {position: 'absolute'},
});
