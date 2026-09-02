/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX THEME RUNTIME — now driven by the Color World Engine
 * (../worlds.ts) rather than a plain Day/Night switch.
 *
 * Every screen already resolves its palette through this context
 * (`useBerxColors()`/`useBerxGlass()`) instead of importing tokens
 * directly — that migration is what makes a real, app-wide World
 * system possible without touching every screen: this file swaps
 * `colors`/`glass` for whichever World is selected, and the whole app
 * follows, immediately, everywhere it's already wired.
 *
 * Default world is `night_ice` — today's shipped palette, unchanged —
 * so an app that never opens World Select looks exactly as it did
 * before this file existed. `useBerxScene()` is new: it exposes the
 * live World's BerxAura/BerxLens/BerxOrb colours (ground/glow/
 * counter/light/object/fill), for real spatial screens (World Select,
 * Welcome) to read instead of hardcoding one scene's palette.
 *
 * PERSISTENCE — same honest constraint the old Day/Night mode had: no
 * storage module is installable in this sandbox (npm is blocked), so
 * the chosen World lives for the session only, not across app
 * restarts. Stated here rather than silently dropped.
 */
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {BERX_WORLDS} from '../worlds';
import type {BerxWorld, BerxWorldScene} from '../worlds';
import type {BerxColorTokens, BerxGlassLevelTokens} from '../tokens';

export type {BerxWorld, BerxWorldScene} from '../worlds';
export {BERX_WORLDS, BERX_WORLD_ORDER} from '../worlds';

export interface BerxThemeValue {
	world: BerxWorld;
	colors: BerxColorTokens;
	glass: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens>;
	scene: BerxWorldScene;
	setWorld: (world: BerxWorld) => void;
}

const DEFAULT_WORLD: BerxWorld = 'night_ice';
const DEFAULT_DEF = BERX_WORLDS[DEFAULT_WORLD];

const DEFAULT_VALUE: BerxThemeValue = {
	world: DEFAULT_WORLD,
	colors: DEFAULT_DEF.colors,
	glass: DEFAULT_DEF.glass,
	scene: DEFAULT_DEF.scene,
	setWorld: () => undefined,
};

const BerxThemeContext = createContext<BerxThemeValue>(DEFAULT_VALUE);

export function BerxThemeProvider({
	children,
	initialWorld = DEFAULT_WORLD,
}: {
	children: React.ReactNode;
	initialWorld?: BerxWorld;
}) {
	const [world, setWorldState] = useState<BerxWorld>(initialWorld);
	const setWorld = useCallback((next: BerxWorld) => setWorldState(next), []);

	const value = useMemo<BerxThemeValue>(() => {
		const def = BERX_WORLDS[world] ?? DEFAULT_DEF;
		return {world, colors: def.colors, glass: def.glass, scene: def.scene, setWorld};
	}, [world, setWorld]);

	return <BerxThemeContext.Provider value={value}>{children}</BerxThemeContext.Provider>;
}

/** The live palette. Outside a provider this is Night/Ice — the same values every screen used before Worlds existed, so an un-wrapped tree still renders correctly. */
export function useBerxColors(): BerxColorTokens {
	return useContext(BerxThemeContext).colors;
}

/** The live glass ladder for the current World. */
export function useBerxGlass(): Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> {
	return useContext(BerxThemeContext).glass;
}

/** The live World's BerxAura/BerxLens/BerxOrb scene colours. */
export function useBerxScene(): BerxWorldScene {
	return useContext(BerxThemeContext).scene;
}

export function useBerxTheme(): BerxThemeValue {
	return useContext(BerxThemeContext);
}
