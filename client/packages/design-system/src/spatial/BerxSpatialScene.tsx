/**
 * The scene root. Every BERX screen renders inside one.
 *
 * It owns three things no individual component can own on its own:
 * the camera (so every layer shares one perspective), the scroll
 * position that parallax reads from, and the resolved scene the
 * layers below pull their material, lighting and motion from.
 *
 * Nothing here is decorative. A screen not wrapped in a scene has no
 * depth, and that is deliberate — depth is a property of the space,
 * not of a card.
 */
import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {Animated, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle} from 'react-native';
import {
	resolveScene,
	type BerxColorWorldName,
	type BerxDeviceSignals,
	type BerxSceneContract,
	type BerxSceneRuntime,
} from '@berx/spatial';

export interface BerxSceneContextValue {
	scene: BerxSceneRuntime;
	/** Live scroll offset in px. Layers read it for parallax. */
	scrollY: number;
	setScrollY: (y: number) => void;
}

const SceneContext = createContext<BerxSceneContextValue | null>(null);

/**
 * Throws rather than returning a default. A silently-defaulted scene
 * is how a screen ends up looking flat with no error anywhere — the
 * exact failure mode the runtime-first rule exists to catch.
 */
export function useBerxScene(): BerxSceneContextValue {
	const value = useContext(SceneContext);
	if (!value) {
		throw new Error('BERX: a spatial component was rendered outside <BerxSpatialScene>. Wrap the screen in a scene.');
	}
	return value;
}

/** Optional variant for components that can render flat when unscoped. */
export function useBerxSceneOptional(): BerxSceneContextValue | null {
	return useContext(SceneContext);
}

export interface BerxSpatialSceneProps {
	contract: BerxSceneContract;
	/**
	 * Real device signals. React Native exposes no deviceMemory or
	 * hardwareConcurrency and has no backdrop filter without a native
	 * module, so the defaults here state that honestly rather than
	 * claiming capabilities the platform does not have.
	 */
	device: BerxDeviceSignals;
	colorWorld?: BerxColorWorldName;
	highContrast?: boolean;
	children: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

export function BerxSpatialScene({
	contract,
	device,
	colorWorld,
	highContrast,
	children,
	style,
	testID,
}: BerxSpatialSceneProps) {
	const {width, height} = useWindowDimensions();
	const [scrollY, setScrollY] = useState(0);

	const scene = useMemo(
		() => resolveScene(contract, {device, viewportWidth: width, viewportHeight: height, colorWorld, highContrast}),
		[contract, device, width, height, colorWorld, highContrast],
	);

	const value = useMemo<BerxSceneContextValue>(() => ({scene, scrollY, setScrollY}), [scene, scrollY]);

	return (
		<SceneContext.Provider value={value}>
			<View testID={testID} style={[styles.root, {backgroundColor: scene.background}, style]}>
				{children}
			</View>
		</SceneContext.Provider>
	);
}

/**
 * Scroll handler for the scrollable surface inside a scene.
 *
 * Parallax needs the scroll offset, and reading layout in an
 * animation frame is exactly the layout thrashing the performance
 * contract forbids — so the offset arrives from the scroll event and
 * is throttled to roughly one update per frame at 60fps.
 */
export function useBerxSceneScroll() {
	const {setScrollY, scene} = useBerxScene();
	const last = useRef(0);
	const enabled = scene.budget.allowParallax;

	const onScroll = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			if (!enabled) return;
			const y = e.nativeEvent.contentOffset.y;
			const now = Date.now();
			if (now - last.current < 16) return;
			last.current = now;
			setScrollY(y);
		},
		[enabled, setScrollY],
	);

	return {onScroll, scrollEventThrottle: 16, parallaxEnabled: enabled};
}

/**
 * Entry animation for a scene's content, driven by the scene's own
 * resolved motion — so a reduced-motion session gets the cross-fade
 * and a normal one gets the spatial enter, with no per-screen
 * branching.
 */
export function useBerxSceneEnter() {
	const {scene} = useBerxScene();
	const progress = useRef(new Animated.Value(0)).current;
	const started = useRef(false);

	if (!started.current) {
		started.current = true;
		Animated.timing(progress, {
			toValue: 1,
			duration: scene.motion.enter.durationMs,
			useNativeDriver: true,
		}).start();
	}

	const from = scene.motion.enter.from ?? {};
	const style = {
		opacity: from.opacity !== undefined ? progress.interpolate({inputRange: [0, 1], outputRange: [from.opacity, 1]}) : 1,
		transform: [
			{
				translateY:
					from.translateY !== undefined
						? progress.interpolate({inputRange: [0, 1], outputRange: [from.translateY, 0]})
						: 0,
			},
			{
				scale: from.scale !== undefined ? progress.interpolate({inputRange: [0, 1], outputRange: [from.scale, 1]}) : 1,
			},
		],
	};

	return style;
}

const styles = StyleSheet.create({
	root: {flex: 1},
});
