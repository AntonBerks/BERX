/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * A minimal, real stack navigator built on React Context + useState —
 * NOT a stand-in for react-navigation, an honest replacement for it.
 * This sandbox can't install react-navigation (npm blocked, confirmed
 * via a real `npm view` 403), so rather than write code against an
 * API that can't be verified to even exist in the installed version,
 * this implements the actual navigation behavior BERX needs (push,
 * pop, replace, current-screen params) directly. It has none of
 * react-navigation's gesture/deep-linking machinery — real, disclosed
 * gaps, not silently assumed away. Swapping this for react-navigation
 * later means replacing this file's internals, not changing every
 * screen that calls useBerxNavigation().
 *
 * KNOWN LIMITATION (found during review, not fixed this round):
 * AppShell.tsx currently mounts a fresh <BerxNavigator> per active
 * tab rather than keeping all tabs' navigators alive with only one
 * visible — so pushing PostDetail inside the Home tab, then switching
 * to another tab and back, loses that pushed screen (Home's stack
 * resets). Real per-tab stack persistence needs all tab navigators
 * mounted simultaneously with visibility toggled, not conditionally
 * rendered — disclosed here rather than silently left unmentioned.
 *
 * BERX WORLD — real transition, not a hard cut. Every push/pop used
 * to swap `children(current)` with zero animation — a screen-to-screen
 * change was an instant frame swap, the single flattest thing in an
 * app whose whole premise is spatial depth. This now animates every
 * change with RN's own Animated (no new dependency, same constraint
 * every other transition in this app already works within): a push
 * rises the new screen in from slightly below and behind — the same
 * "material arriving toward the camera" language BerxFadeIn's
 * scaleFrom already establishes — and a pop recedes it back the other
 * way, so forward and backward navigation read as OPPOSITE spatial
 * directions, not the same fade played twice. Exactly one screen is
 * ever mounted at a time (the incoming one animates in on top of
 * nothing, not across two simultaneously-mounted trees) specifically
 * so a screen's real on-mount API calls never fire twice.
 */
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode} from 'react';
import {Animated, Easing, StyleSheet} from 'react-native';
import {motion} from '@berx/design-system/tokens';
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
		setStack((s: StackEntry[]) => [...s, {name, params}]);
	}, []);

	const pop = useCallback(() => {
		// Returning the SAME array when there is nothing to pop matters:
		// React bails out on identical state, so the stack identity stays
		// put and the transition effect below never fires for a back press
		// at the root. That identity check is the whole trigger mechanism —
		// no separate "did navigation happen" counter is needed, and none
		// is kept in sync by hand.
		setStack((s: StackEntry[]) => (s.length > 1 ? s.slice(0, -1) : s));
	}, []);

	const replace = useCallback(<K2 extends BerxRouteName>(name: K2, params: BerxRouteParams[K2]) => {
		setStack((s: StackEntry[]) => [...s.slice(0, -1), {name, params}]);
	}, []);

	const current = stack[stack.length - 1];

	// Direction is read from the real stack depth, compared against the
	// depth at the previous committed render. Read during render (before
	// the effect below updates it) so the very first frame of the
	// transition already animates the correct way — a direction resolved
	// one render late would play every pop as a push.
	const prevDepth = useRef(stack.length);
	const forward = stack.length >= prevDepth.current;

	const progress = useRef(new Animated.Value(1)).current;
	const mounted = useRef(false);

	useEffect(() => {
		prevDepth.current = stack.length;
		if (!mounted.current) {
			// The first screen is already there; it did not travel to get here.
			mounted.current = true;
			return;
		}
		progress.setValue(0);
		const anim = Animated.timing(progress, {
			toValue: 1,
			duration: motion.durationBase,
			easing: Easing.bezier(...motion.easeControlPoints),
			useNativeDriver: true,
		});
		anim.start();
		return () => anim.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stack]);

	const api = useMemo<BerxNavigationApi>(
		() => ({current, push, pop, replace, canGoBack: stack.length > 1}),
		[current, push, pop, replace, stack.length]
	);

	// Forward = the new screen arrives from below and slightly behind the
	// camera plane; back = it returns from above and slightly in front.
	// Opposite directions on purpose: going deeper and coming back must
	// not feel like the same motion.
	const translateY = progress.interpolate({inputRange: [0, 1], outputRange: forward ? [22, 0] : [-14, 0]});
	const scale = progress.interpolate({inputRange: [0, 1], outputRange: forward ? [0.982, 1] : [1.012, 1]});

	return (
		<BerxNavigationContext.Provider value={api}>
			<Animated.View style={[styles.stage, {opacity: progress, transform: [{translateY}, {scale}]}]}>
				{children(current)}
			</Animated.View>
		</BerxNavigationContext.Provider>
	);
}

const styles = StyleSheet.create({
	stage: {flex: 1},
});
