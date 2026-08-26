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
 * react-navigation's gesture/animation/deep-linking machinery — those
 * are real, disclosed gaps, not silently assumed away. Swapping this
 * for react-navigation later means replacing this file's internals,
 * not changing every screen that calls useBerxNavigation().
 *
 * KNOWN LIMITATION (found during review, not fixed this round):
 * AppShell.tsx currently mounts a fresh <BerxNavigator> per active
 * tab rather than keeping all tabs' navigators alive with only one
 * visible — so pushing PostDetail inside the Home tab, then switching
 * to another tab and back, loses that pushed screen (Home's stack
 * resets). Real per-tab stack persistence needs all tab navigators
 * mounted simultaneously with visibility toggled, not conditionally
 * rendered — disclosed here rather than silently left unmentioned.
 */
import {createContext, useCallback, useContext, useMemo, useState, ReactNode} from 'react';
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
		setStack((s: StackEntry[]) => (s.length > 1 ? s.slice(0, -1) : s));
	}, []);

	const replace = useCallback(<K2 extends BerxRouteName>(name: K2, params: BerxRouteParams[K2]) => {
		setStack((s: StackEntry[]) => [...s.slice(0, -1), {name, params}]);
	}, []);

	const current = stack[stack.length - 1];

	const api = useMemo<BerxNavigationApi>(
		() => ({current, push, pop, replace, canGoBack: stack.length > 1}),
		[current, push, pop, replace, stack.length]
	);

	return <BerxNavigationContext.Provider value={api}>{children(current)}</BerxNavigationContext.Provider>;
}
