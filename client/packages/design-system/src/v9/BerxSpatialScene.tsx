/**
 * BERX V9 SHARED SPATIAL COMPONENTS — the layer screens are built INSIDE.
 *
 * Architecture: 5D foundation -> scene families -> THESE -> individual
 * screen contracts -> real domain/API -> 300 scenes.
 *
 * `depth.ts` knows the geometry and `families.ts` knows the
 * composition; nothing rendered them. These three components are how a
 * screen actually stands inside the architecture instead of merely
 * agreeing with it on paper:
 *
 *   BerxSpatialScene  — the scene root. Establishes the camera the
 *                       contracts declare, owns the one parallax signal
 *                       the whole scene shares, and gates it on reduced
 *                       motion in ONE place so no layer can forget.
 *   BerxDepthLayer    — one D0-D5 plane. Takes the layer's real
 *                       projected scale, parallax factor, tilt,
 *                       atmospheric falloff and entry delay from the
 *                       foundation. A screen that needs no D5 simply
 *                       renders no D5 — still the same architecture.
 *   BerxParallaxGroup — a subtree that moves with a chosen depth's
 *                       factor without being a full layer, for content
 *                       that belongs to a plane it does not own.
 *
 * REDUCED MOTION is honoured at the source: the scene stops publishing
 * a parallax signal at all, so layers have nothing to move with. That
 * is stronger than each layer checking a flag, because a layer added
 * later cannot opt out of the accessibility contract by forgetting.
 *
 * WHAT IS REAL AND WHAT IS APPROXIMATED, stated plainly: the z values,
 * camera, parallax factors and tilt ceiling are the archive's own
 * numbers, and the scale each layer renders at is a genuine projection
 * of its z at that camera. React Native has no translateZ (only
 * translateX/Y), so depth is expressed as perspective + scale + rotateY
 * — this codebase's established, disclosed substitute, not a claim to a
 * transform the platform lacks.
 */
import {createContext, useContext, useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring, Easing, type SharedValue} from 'react-native-reanimated';
import {BERX_V9_CAMERA, BERX_V9_GEOMETRY, entryDelayMs, tiltDegFor, depthShadowV9} from './depth';
import {BERX_V9_MATERIAL, type BerxV9Depth, type BerxV9Material} from './tokens';
import {BERX_MOTION, reduce} from '../animation/motion';
import {useBerxColors, useBerxGlass} from '../theme';

interface SceneSignal {
	/** Shared pointer/gyro/scroll signal in roughly [-1, 1]; null when reduced motion is on. */
	x: SharedValue<number> | null;
	y: SharedValue<number> | null;
	reducedMotion: boolean;
	perspective: number;
}

const SceneContext = createContext<SceneSignal>({x: null, y: null, reducedMotion: false, perspective: BERX_V9_CAMERA.perspectivePx});

export function useBerxScene9(): SceneSignal {
	return useContext(SceneContext);
}

export interface BerxSpatialSceneProps {
	children: ReactNode;
	/** The real interaction signal driving parallax and tilt, normalised to [-1, 1]. Omit for a still scene. */
	signalX?: SharedValue<number>;
	signalY?: SharedValue<number>;
	reducedMotion?: boolean;
	/** Defaults to the camera every scene contract declares. */
	perspective?: number;
	style?: StyleProp<ViewStyle>;
}

export function BerxSpatialScene({children, signalX, signalY, reducedMotion = false, perspective = BERX_V9_CAMERA.perspectivePx, style}: BerxSpatialSceneProps) {
	const colors = useBerxColors();
	const value = useMemo<SceneSignal>(
		() => ({x: reducedMotion ? null : signalX ?? null, y: reducedMotion ? null : signalY ?? null, reducedMotion, perspective}),
		[signalX, signalY, reducedMotion, perspective]
	);
	return (
		<SceneContext.Provider value={value}>
			<View style={[styles.scene, {backgroundColor: colors.bg}, style]}>{children}</View>
		</SceneContext.Provider>
	);
}

export interface BerxDepthLayerProps {
	depth: BerxV9Depth;
	children?: ReactNode;
	/** Material for this layer's surface. Omit for a layer that paints nothing of its own. */
	material?: BerxV9Material;
	/** Run this layer's entry on the scene's own D0->D5 choreography. */
	animateEntry?: boolean;
	/** Absolutely fill the scene (environment/atmosphere layers) rather than sit in flow. */
	fill?: boolean;
    /** Layer-level opacity multiplier on top of the atmospheric falloff. */
	opacity?: number;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

export function BerxDepthLayer({depth, children, material, animateEntry = true, fill = false, opacity = 1, style, testID}: BerxDepthLayerProps) {
	const scene = useBerxScene9();
	const colors = useBerxColors();
	const glass = useBerxGlass();
	const g = BERX_V9_GEOMETRY[depth];
	const enter = useSharedValue(animateEntry ? 0 : 1);

	useEffect(() => {
		if (!animateEntry) return;
		enter.value = withDelay(
			entryDelayMs(depth, scene.reducedMotion),
			scene.reducedMotion
				? withTiming(1, {duration: reduce(BERX_MOTION.standard, true), easing: Easing.out(Easing.ease)})
				: withSpring(1, BERX_MOTION.spatial.spring)
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [depth, animateEntry, scene.reducedMotion]);

	const animated = useAnimatedStyle(() => {
		const e = enter.value;
		const sx = scene.x?.value ?? 0;
		const sy = scene.y?.value ?? 0;
		const factor = g.parallax ?? 0;
		// Parallax travel is proportional to the layer's own factor. The
		// magnitude is expressed in the archive's own z units so a nearer
		// layer moves further for the same signal, which is what makes the
		// planes read as separated rather than as one sliding image.
		const travel = g.z === 0 ? 24 : Math.min(48, g.z * 0.3);
		return {
			opacity: e * g.opacity * opacity,
			transform: [
				{perspective: scene.perspective},
				// Enter from slightly deeper than the layer's resting z.
				{scale: g.scale * (0.94 + e * 0.06)},
				{translateX: sx * factor * travel},
				{translateY: sy * factor * travel * 0.6},
				{rotateY: `${tiltDegFor(depth, sx, scene.reducedMotion)}deg`},
				{rotateX: `${-tiltDegFor(depth, sy, scene.reducedMotion)}deg`},
			],
		};
	}, [enter, g, scene.x, scene.y, scene.perspective, scene.reducedMotion, opacity, depth]);

	const surface = useMemo(() => {
		if (!material) return null;
		const recipe = BERX_V9_MATERIAL[material];
		// The material's fill comes from the LIVE glass ladder so the layer
		// stays correct in both environments, while WHICH rung it uses is
		// the archive's own recipe.
		const rung = recipe.fill === 'soft' ? glass[1] : recipe.fill === 'standard' ? glass[2] : glass[3];
		return {backgroundColor: rung.fill, borderColor: rung.border, borderWidth: StyleSheet.hairlineWidth};
	}, [material, glass]);

	return (
		<Animated.View
			testID={testID}
			pointerEvents={depth === 'D0' || depth === 'D1' ? 'none' : 'auto'}
			style={[fill ? StyleSheet.absoluteFillObject : null, surface, material ? depthShadowV9(depth, colors.mediaScrim) : null, animated, style]}>
			{children}
		</Animated.View>
	);
}

export interface BerxParallaxGroupProps {
	/** Move with this depth's factor without being a whole layer. */
	depth: BerxV9Depth;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}

export function BerxParallaxGroup({depth, children, style}: BerxParallaxGroupProps) {
	const scene = useBerxScene9();
	const g = BERX_V9_GEOMETRY[depth];
	const animated = useAnimatedStyle(() => {
		const sx = scene.x?.value ?? 0;
		const sy = scene.y?.value ?? 0;
		const factor = g.parallax ?? 0;
		return {transform: [{translateX: sx * factor * 18}, {translateY: sy * factor * 12}]};
	}, [g, scene.x, scene.y]);
	return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
	scene: {flex: 1, overflow: Platform.OS === 'web' ? 'hidden' : 'visible'},
});
