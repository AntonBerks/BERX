/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX THEME RUNTIME — one fixed BERX identity, not a picker.
 *
 * This used to run a Color World Engine (four selectable palettes
 * behind a WorldSelectScreen) — retired: BERX has one visual identity
 * (colors.bg / colors.accent, currently Obsidian & Aurora's
 * #05060A / #00E5CC — see tokens/index.ts's own header for the
 * palette-override history), not a palette a person chooses. That
 * retirement decision is separate from and unaffected by which exact
 * hex values colors.bg/accent hold — every screen still resolves its
 * palette through this
 * context (`useBerxColors()`/`useBerxGlass()`/`useBerxScene()`)
 * instead of importing tokens directly, so this remains the one place
 * that could change the whole app's paint — it just always resolves
 * to the same real, shipped values now.
 */
import React, {useContext} from 'react';
import {colors, glassNight} from '../tokens';
import {BERX_SCENE} from '../scene';
import type {BerxScene} from '../scene';
import type {BerxColorTokens, BerxGlassLevelTokens} from '../tokens';

export type {BerxScene} from '../scene';

export interface BerxThemeValue {
	colors: BerxColorTokens;
	glass: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens>;
	scene: BerxScene;
}

const DEFAULT_VALUE: BerxThemeValue = {
	colors,
	glass: glassNight,
	scene: BERX_SCENE,
};

const BerxThemeContext = React.createContext<BerxThemeValue>(DEFAULT_VALUE);

/** Kept as a real Provider (rather than dropped outright) so existing call sites don't need to change, and so a future systemic value genuinely could be swapped in one place — it just always resolves to the one BERX identity today. */
export function BerxThemeProvider({children}: {children: React.ReactNode}) {
	return <BerxThemeContext.Provider value={DEFAULT_VALUE}>{children}</BerxThemeContext.Provider>;
}

/** The live palette. Outside a provider this is still the real BERX palette, so an un-wrapped tree renders correctly. */
export function useBerxColors(): BerxColorTokens {
	return useContext(BerxThemeContext).colors;
}

/** The live glass ladder. */
export function useBerxGlass(): Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> {
	return useContext(BerxThemeContext).glass;
}

/** The live BerxAura/BerxLens/BerxOrb scene colours. */
export function useBerxScene(): BerxScene {
	return useContext(BerxThemeContext).scene;
}
