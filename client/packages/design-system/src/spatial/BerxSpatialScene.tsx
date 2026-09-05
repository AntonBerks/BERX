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
import React, {createContext, useCallback, useContext, useId, useMemo, useRef, useState} from 'react';
import {Animated, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle} from 'react-native';
import {
	resolveFocus,
	resolveScene,
	type BerxColorWorldName,
	type BerxDepthKey,
	type BerxDeviceSignals,
	type BerxFocusField,
	type BerxFocusRect,
	type BerxAtmosphere,
	type BerxSceneContract,
	type BerxSceneRuntime,
} from '@berx/spatial';
import {BerxFocusClearing} from './BerxFocusClearing';

/**
 * What the scene currently holds focus on.
 *
 * The id is what a component uses to ask "is the focus mine?" — the
 * focused object promotes itself to D5 and gains its material's
 * emission, and every other object is, by definition, the surround.
 */
export interface BerxSceneFocus {
	id: string;
	/** The object's box in scene coordinates, from onLayout. */
	rect: BerxFocusRect;
	/** 0..1. Defaults to full. */
	intensity?: number;
	/** The plane the focused object sits on. Defaults to the focus plane. */
	plane?: BerxDepthKey;
}

export interface BerxSceneContextValue {
	scene: BerxSceneRuntime;
	/** Live scroll offset in px. Layers read it for parallax. */
	scrollY: number;
	setScrollY: (y: number) => void;
	/**
	 * The room this scene resolved, once its backdrop has painted it.
	 *
	 * Objects standing in the room read it to find out how lit their
	 * own position is. Null until the backdrop has laid out — a scene
	 * with no backdrop has no room, and an object in it is lit evenly,
	 * which is the honest answer rather than an invented one.
	 */
	atmosphere: BerxAtmosphere | null;
	publishAtmosphere: (atmosphere: BerxAtmosphere | null) => void;
	/** Null when nothing is focused — which is most of the time. */
	focus: BerxSceneFocus | null;
	/** The resolved falloff and recession. Null when nothing is focused. */
	focusField: BerxFocusField | null;
	setFocus: (focus: BerxSceneFocus | null) => void;
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
	const [focus, setFocus] = useState<BerxSceneFocus | null>(null);
	const [atmosphere, setAtmosphere] = useState<BerxAtmosphere | null>(null);
	const publishAtmosphere = useCallback((next: BerxAtmosphere | null) => setAtmosphere(next), []);
	/* SVG gradient ids are global to the document and React's id
	   carries delimiters that do not belong in one. */
	const sceneId = useId().replace(/[^a-zA-Z0-9]/g, '');

	const scene = useMemo(
		() => resolveScene(contract, {device, viewportWidth: width, viewportHeight: height, colorWorld, highContrast}),
		[contract, device, width, height, colorWorld, highContrast],
	);

	/**
	 * Focus is resolved from the same numbers everything else is: the
	 * scene's substrate colour so the surround falls toward the room
	 * rather than toward black, the performance tier so a weak device
	 * pays for fewer stops, and whether D5 actually got its blur.
	 */
	const focusField = useMemo<BerxFocusField | null>(() => {
		if (!focus) return null;
		return resolveFocus({
			rect: focus.rect,
			viewportWidth: width,
			viewportHeight: height,
			background: scene.background,
			intensity: focus.intensity,
			plane: focus.plane,
			tier: scene.budget.tier,
			blurred: scene.layers.D5.blurred,
		});
	}, [focus, width, height, scene.background, scene.budget.tier, scene.layers.D5.blurred]);

	const value = useMemo<BerxSceneContextValue>(
		() => ({scene, scrollY, setScrollY, atmosphere, publishAtmosphere, focus, focusField, setFocus}),
		[scene, scrollY, atmosphere, publishAtmosphere, focus, focusField],
	);

	return (
		<SceneContext.Provider value={value}>
			<View testID={testID} style={[styles.root, {backgroundColor: scene.background}, style]}>
				{children}
				{focusField ? <BerxFocusClearing field={focusField} id={`berx-focus-${sceneId}`} testID="berx-focus-clearing" /> : null}
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
export function useBerxSceneEnter(delayMs = 0) {
	const {scene} = useBerxScene();
	const progress = useRef(new Animated.Value(0)).current;
	const started = useRef(false);

	/**
	 * A stagger, not a second animation.
	 *
	 * Every element still runs the scene's own enter preset — same
	 * duration, same distance, same easing — and the only thing the
	 * delay changes is when it starts. That is what makes a reveal
	 * read as one movement through a room rather than as three
	 * components animating independently.
	 *
	 * Under reduced motion resolveMotion has already replaced the
	 * preset with a cross-fade, and a staggered cross-fade is still a
	 * cross-fade: nothing travels, so nothing here needs a second
	 * branch.
	 */
	if (!started.current) {
		started.current = true;
		Animated.timing(progress, {
			toValue: 1,
			duration: scene.motion.enter.durationMs,
			delay: scene.reducedMotion ? 0 : delayMs,
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
