/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX THEME RUNTIME — one centralized source for which environment
 * (Day or Night) the app is actually rendering in, and the real
 * palette that follows from it.
 *
 * Why this exists: every screen used to build its StyleSheet once, at
 * module load, against the imported Night palette. That is a snapshot
 * — it can never change at runtime, which is why BERX shipped with a
 * fully-defined Day palette that nothing could actually reach. The
 * fix is structural: styles become a FACTORY that takes a palette,
 * and each screen resolves the live palette through this context, so
 * both environments are the same product rather than one real theme
 * and one dead token block.
 *
 * MODE:
 *   'night' / 'day' — explicit.
 *   'auto'          — resolved from the device's own real local hour
 *                     (07:00-18:59 Day, otherwise Night). Deterministic,
 *                     no persistence layer and no server round-trip:
 *                     the same local hour always resolves the same way.
 *
 * There is no storage module installable in this sandbox (npm is
 * blocked), so the chosen mode lives for the session rather than
 * being written to disk — stated honestly here rather than pretending
 * a preference is persisted.
 */
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {colors as nightColors, colorsDay, glassNight, glassDay} from '../tokens';
import type {BerxColorTokens, BerxEnvironment, BerxGlassLevelTokens} from '../tokens';

export type BerxThemeMode = 'night' | 'day' | 'auto';

export interface BerxThemeValue {
	mode: BerxThemeMode;
	/** The environment actually being rendered — 'auto' has already been resolved here. */
	env: BerxEnvironment;
	colors: BerxColorTokens;
	glass: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens>;
	setMode: (mode: BerxThemeMode) => void;
}

/** Real, deterministic resolution of 'auto' from a real local hour. Exported so it is unit-testable without a renderer. */
export function resolveBerxEnvironment(mode: BerxThemeMode, hour: number): BerxEnvironment {
	if (mode === 'day') return 'day';
	if (mode === 'night') return 'night';
	return hour >= 7 && hour < 19 ? 'day' : 'night';
}

const DEFAULT_VALUE: BerxThemeValue = {
	mode: 'night',
	env: 'night',
	colors: nightColors,
	glass: glassNight,
	setMode: () => undefined,
};

const BerxThemeContext = createContext<BerxThemeValue>(DEFAULT_VALUE);

export function BerxThemeProvider({
	children,
	initialMode = 'night',
}: {
	children: React.ReactNode;
	initialMode?: BerxThemeMode;
}) {
	const [mode, setMode] = useState<BerxThemeMode>(initialMode);

	const handleSetMode = useCallback((next: BerxThemeMode) => setMode(next), []);

	const value = useMemo<BerxThemeValue>(() => {
		const env = resolveBerxEnvironment(mode, new Date().getHours());
		return {
			mode,
			env,
			colors: env === 'day' ? (colorsDay as unknown as BerxColorTokens) : nightColors,
			glass: env === 'day' ? glassDay : glassNight,
			setMode: handleSetMode,
		};
	}, [mode, handleSetMode]);

	return <BerxThemeContext.Provider value={value}>{children}</BerxThemeContext.Provider>;
}

/** The live palette. Outside a provider this is the Night palette — the same values every screen used before the migration, so an un-wrapped tree still renders correctly. */
export function useBerxColors(): BerxColorTokens {
	return useContext(BerxThemeContext).colors;
}

/** The live glass ladder for the current environment. */
export function useBerxGlass(): Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> {
	return useContext(BerxThemeContext).glass;
}

export function useBerxTheme(): BerxThemeValue {
	return useContext(BerxThemeContext);
}
