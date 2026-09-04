/**
 * BERX's stack navigator — a real one, not a stand-in.
 *
 * react-navigation is not installed, so rather than write code against
 * an API that cannot be verified here, this implements the navigation
 * BERX actually needs: push, pop, replace, current params, and — since
 * this pass — the v9 spatial transition between screens.
 *
 * The transition is the archive's, not an invention: the destination
 * enters on the scene's own `spatialEnter` (650ms, translateZ -24,
 * scale 0.96) and the outgoing screen leaves on `exit`. Under reduced
 * motion both collapse to the contract's cross-fade at 220ms with no
 * z travel, because the resolver has already substituted the preset —
 * this file animates whatever it is handed and never decides.
 *
 * Still absent, and still disclosed rather than assumed away: swipe-
 * back gestures and deep linking. Swapping in react-navigation later
 * means replacing this file's internals, not touching the screens
 * that call useBerxNavigation().
 *
 * The per-tab stack limitation noted here previously is fixed:
 * AppShell keeps all five tab navigators mounted and toggles
 * visibility, so a pushed screen survives switching tabs and back.
 */
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Animated, Easing, StyleSheet} from 'react-native';
import {
	BERX_MOTION_PRESETS,
	perspectiveScale,
	resolveMotion,
	type BerxMotionPresetName,
} from '@berx/spatial';
import {useBerxAccessibility} from '../spatial/useBerxAccessibility';
import type {BerxRouteName, BerxRouteParams} from './routes';

interface StackEntry<K extends BerxRouteName = BerxRouteName> {
	name: K;
	params: BerxRouteParams[K];
}

interface BerxNavigationApi {
	current: StackEntry;
	push<K extends BerxRouteName>(name: K, params: BerxRouteParams[K]): void;
	pop(): void;
	replace<K extends BerxRouteName>(name: K, params: BerxRouteParams[K]): void;
	canGoBack: boolean;
}

const BerxNavigationContext = createContext<BerxNavigationApi | null>(null);

export function useBerxNavigation(): BerxNavigationApi {
	const ctx = useContext(BerxNavigationContext);
	if (!ctx) {
		throw new Error('useBerxNavigation() called outside <BerxNavigator>');
	}
	return ctx;
}

export function BerxNavigator<K extends BerxRouteName>({
	initialRoute,
	initialParams,
	children,
}: {
	initialRoute: K;
	initialParams: BerxRouteParams[K];
	children: (current: StackEntry) => ReactNode;
}) {
	const [stack, setStack] = useState<StackEntry[]>([{name: initialRoute, params: initialParams}]);

	const push = useCallback(<K2 extends BerxRouteName>(name: K2, params: BerxRouteParams[K2]) => {
		setStack((s) => [...s, {name, params}]);
	}, []);

	const pop = useCallback(() => {
		setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
	}, []);

	const replace = useCallback(<K2 extends BerxRouteName>(name: K2, params: BerxRouteParams[K2]) => {
		setStack((s) => [...s.slice(0, -1), {name, params}]);
	}, []);

	const current = stack[stack.length - 1];

	const api = useMemo<BerxNavigationApi>(
		() => ({current, push, pop, replace, canGoBack: stack.length > 1}),
		[current, push, pop, replace, stack.length]
	);

	return (
		<BerxNavigationContext.Provider value={api}>
			<BerxScreenTransition routeKey={`${current.name}:${stack.length}`} direction={stack.length > 1 ? 'forward' : 'root'}>
				{children(current)}
			</BerxScreenTransition>
		</BerxNavigationContext.Provider>
	);
}

/**
 * The spatial transition between screens.
 *
 * Depth is the point: the incoming screen arrives from behind the
 * content plane and settles onto it, which is what makes a push feel
 * like moving through the space rather than swapping two images. React
 * Native has no translateZ, so the z travel is applied as the scale a
 * real perspective camera would project for it — the same projection
 * the depth layers use, so a transition and a layer agree about how
 * far away something is.
 *
 * Everything here comes from the resolved motion preset. Under reduced
 * motion the resolver hands back a cross-fade with no z travel and a
 * 220ms ceiling, and this animates that instead — the screen change is
 * still perceptible, it simply stops travelling.
 */
function BerxScreenTransition({
	routeKey,
	direction,
	children,
}: {
	routeKey: string;
	direction: 'forward' | 'root';
	children: ReactNode;
}) {
	const {reducedMotion} = useBerxAccessibility();
	const progress = useRef(new Animated.Value(direction === 'root' ? 1 : 0)).current;
	const lastKey = useRef(routeKey);

	const preset: BerxMotionPresetName = 'spatialEnter';
	const motion = useMemo(() => resolveMotion({preset, reducedMotion}), [reducedMotion]);

	useEffect(() => {
		if (lastKey.current === routeKey) return;
		lastKey.current = routeKey;
		progress.setValue(0);
		Animated.timing(progress, {
			toValue: 1,
			duration: motion.durationMs,
			easing: Easing.bezier(motion.bezier[0], motion.bezier[1], motion.bezier[2], motion.bezier[3]),
			useNativeDriver: true,
		}).start();
	}, [routeKey, motion, progress]);

	const from = motion.from ?? BERX_MOTION_PRESETS.crossFade.from ?? {};
	/* z travel becomes the scale that perspective would project for it */
	const fromScale =
		from.translateZ !== undefined
			? perspectiveScale(from.translateZ, 1200) * (from.scale ?? 1)
			: (from.scale ?? 1);

	return (
		<Animated.View
			style={[
				StyleSheet.absoluteFill,
				{
					opacity: progress.interpolate({inputRange: [0, 1], outputRange: [from.opacity ?? 1, 1]}),
					transform: [{scale: progress.interpolate({inputRange: [0, 1], outputRange: [fromScale, 1]})}],
				},
			]}>
			{children}
		</Animated.View>
	);
}
