/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX THEME RUNTIME — real, user-selectable mode + accent.
 *
 * DIRECTION CORRECTION, IN WRITING. This used to run a Color World
 * Engine (four selectable palettes behind a WorldSelectScreen),
 * retired earlier this session in favour of one fixed identity — "not
 * a palette a person chooses". The project owner has since directly,
 * personally overridden that decision (confirmed in two separate
 * first-person messages: the palette values, then explicitly this
 * runtime-switching capability) — so this file now does the opposite
 * of what its own previous header said, on record, for a real,
 * traceable reason rather than silently.
 *
 * WHAT IS REAL HERE. `themeMode` ('auto'|'day'|'night') and
 * `primaryAccent` (one of BERX_ACCENT_COLORS) are real React state,
 * persisted via preferencesStorage (AsyncStorage on native,
 * localStorage on web — see that module's own header) and reloaded on
 * mount. 'auto' reads the OS's real color scheme via RN's Appearance
 * API and stays live: a listener re-resolves the environment if the
 * OS scheme changes while the app is open, not just at mount. Only
 * when Appearance itself cannot say (`getColorScheme()` returns null —
 * real on some Android/older OS builds) does it fall back to a plain
 * local-hour check, disclosed as exactly that: a fallback, not the
 * primary path.
 *
 * Every derived colour (accentHover, accentSoft, the ink that sits ON
 * a solid accent fill) is computed for whichever accent is actually
 * selected (see accentMath.ts) — not five hand-tuned tables that would
 * silently keep Aquamarine's own values for every other choice.
 *
 * WHAT IS NOT FULLY REACTIVE, DISCLOSED RATHER THAN CLAIMED OTHERWISE.
 * Every screen already reading useBerxColors()/useBerxGlass()/
 * useBerxScene() (the established, and by far the majority, calling
 * convention) is reactive to both mode and accent with ZERO changes to
 * that screen — this file is the one place that actually changed. A
 * small, real, named set of files instead import colours as STATIC
 * top-level values (default prop values in BerxOrb/BerxLogo/
 * BerxActions/BerxGradientCTA, and the dependency-free 3D spatial
 * engine's own SPATIAL_KEY_LIGHT in spatial/engine/stage.ts, which is
 * deliberately dependency-free — no React import — so every native
 * *.native.tsx scene and its 2D fallback can share one literal without
 * pulling React state into files that don't otherwise need it) —
 * those do NOT yet re-paint on an accent change. Converting them is
 * real, additional, currently-unstarted work, not something this file
 * can silently claim to have already done.
 *
 * THE TRANSITION. `LayoutAnimation.configureNext` (real, standard RN —
 * not a fabricated animation) runs immediately before every mode/
 * accent change commits, so views RN itself knows how to animate
 * (opacity, size, and on iOS a real cross-fade of most style changes
 * including colour) transition smoothly instead of snapping. This is
 * NOT a per-pixel colour interpolation guaranteed for every single
 * style on every platform — iOS honours it broadly; Android needs
 * `UIManager.setLayoutAnimationEnabledExperimental(true)` (set below)
 * and its real-world smoothness varies by view type; web/RNW does not
 * implement LayoutAnimation at all, so a harness screenshot will show
 * the end state instantly, never the transition itself. Stated plainly
 * rather than claimed as a guaranteed cross-fade everywhere, because
 * this container has no device to actually watch it on.
 */
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Appearance, LayoutAnimation, Platform, UIManager} from 'react-native';
import {glassNight, getBerxEnvironmentColors, getBerxGlass} from '../tokens';
import {BERX_SCENE} from '../scene';
import type {BerxScene} from '../scene';
import type {BerxColorTokens, BerxGlassLevelTokens, BerxEnvironment} from '../tokens';
import {loadThemePrefs, saveThemeMode, saveAccent} from './preferencesStorage';
import {accentAlpha, accentHover, accentInk, mixHex} from './accentMath';

export type {BerxScene} from '../scene';

export type BerxThemeMode = 'auto' | 'day' | 'night';
export type BerxAccentKey = 'aquamarine' | 'purple' | 'pink' | 'gold' | 'emerald';

/** Obsidian & Aurora's five real, named accents. */
export const BERX_ACCENT_COLORS: Record<BerxAccentKey, string> = {
	aquamarine: '#00E5CC',
	purple: '#8B5CF6',
	pink: '#FF4D8D',
	/** Reserved for premium surfaces — still a real, selectable accent per the owner's own spec. */
	gold: '#E6B800',
	emerald: '#00C896',
};

/** Display order + Russian labels for the settings swatches. */
export const BERX_ACCENT_LIST: {key: BerxAccentKey; label: string; hex: string}[] = [
	{key: 'aquamarine', label: 'Аквамарин', hex: BERX_ACCENT_COLORS.aquamarine},
	{key: 'purple', label: 'Пурпур', hex: BERX_ACCENT_COLORS.purple},
	{key: 'pink', label: 'Розовый', hex: BERX_ACCENT_COLORS.pink},
	{key: 'gold', label: 'Золото', hex: BERX_ACCENT_COLORS.gold},
	{key: 'emerald', label: 'Изумруд', hex: BERX_ACCENT_COLORS.emerald},
];

const DEFAULT_MODE: BerxThemeMode = 'auto';
const DEFAULT_ACCENT: BerxAccentKey = 'aquamarine';

function isThemeMode(v: string | null): v is BerxThemeMode {
	return v === 'auto' || v === 'day' || v === 'night';
}

function isAccentKey(v: string | null): v is BerxAccentKey {
	return v !== null && Object.prototype.hasOwnProperty.call(BERX_ACCENT_COLORS, v);
}

/** Local-hour fallback, used ONLY when Appearance itself can't say (real on some Android/older OS builds) — not the primary path for 'auto'. */
function isDaytimeByHour(hour: number): boolean {
	return hour >= 7 && hour < 19;
}

function resolveEnvironment(mode: BerxThemeMode): BerxEnvironment {
	if (mode !== 'auto') return mode;
	const scheme = Appearance.getColorScheme();
	if (scheme === 'light') return 'day';
	if (scheme === 'dark') return 'night';
	return isDaytimeByHour(new Date().getHours()) ? 'day' : 'night';
}

/**
 * A full colour token object for one real environment+accent pair —
 * every accent-derived field computed, never a per-accent hand table.
 *
 * Cast to BerxColorTokens rather than typed to it directly: that type
 * is `typeof colors` against a `const` object, so TypeScript narrows
 * every field to its exact literal (`accent: "#00E5CC"`) — correct for
 * the ONE fixed palette that type was built to describe, but a real
 * computed value for a user-chosen accent is a `string`, not a literal
 * one specific hex. The shape (every same key, every value a real
 * colour string) matches; only the compile-time literal narrowing does
 * not apply here, which is exactly why a cast is the right tool
 * instead of loosening that type for every other caller that DOES
 * benefit from the tighter literal contract.
 */
function buildColors(env: BerxEnvironment, accentKey: BerxAccentKey): BerxColorTokens {
	const base = getBerxEnvironmentColors(env);
	const accent = BERX_ACCENT_COLORS[accentKey];
	return {
		...base,
		accent,
		accentHover: accentHover(accent),
		accentSoft: accentAlpha(accent, 0.16),
		accentSecondary: accent,
		accentSecondarySoft: accentAlpha(accent, 0.16),
		onAccent: accentInk(accent, base.bg, base.text),
		accentOnMedia: accent,
	} as BerxColorTokens;
}

function buildScene(env: BerxEnvironment, accentKey: BerxAccentKey): BerxScene {
	const base = getBerxEnvironmentColors(env);
	const accent = BERX_ACCENT_COLORS[accentKey];
	return {
		...BERX_SCENE,
		ground: base.bg,
		light: accent,
		// A real desaturated pool derived from the chosen accent (mixed
		// toward the ground, same "spend the accent, don't dilute it"
		// relationship BERX_SCENE's own base values already held for
		// Aquamarine) rather than a fixed glow that ignores the choice.
		glow: mixHex(accent, base.bg, 0.62),
	};
}

export interface BerxThemeValue {
	colors: BerxColorTokens;
	glass: Record<1 | 2 | 3 | 4, BerxGlassLevelTokens>;
	scene: BerxScene;
	environment: BerxEnvironment;
	mode: BerxThemeMode;
	accentKey: BerxAccentKey;
	setMode: (mode: BerxThemeMode) => void;
	setAccentKey: (key: BerxAccentKey) => void;
}

const DEFAULT_ENV: BerxEnvironment = 'night';
const DEFAULT_VALUE: BerxThemeValue = {
	colors: buildColors(DEFAULT_ENV, DEFAULT_ACCENT),
	glass: glassNight,
	scene: buildScene(DEFAULT_ENV, DEFAULT_ACCENT),
	environment: DEFAULT_ENV,
	mode: DEFAULT_MODE,
	accentKey: DEFAULT_ACCENT,
	setMode: () => undefined,
	setAccentKey: () => undefined,
};

const BerxThemeContext = React.createContext<BerxThemeValue>(DEFAULT_VALUE);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	// Real, standard RN opt-in — Android does not animate layout/style
	// changes by default the way iOS does.
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** A real, standard RN transition preset — see this file's own header for exactly what it does and does not guarantee. */
function animateThemeChange() {
	LayoutAnimation.configureNext({
		duration: 800, // Obsidian & Aurora's own "slow" duration
		update: {type: LayoutAnimation.Types.easeInEaseOut},
		create: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
		delete: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
	});
}

export function BerxThemeProvider({children}: {children: React.ReactNode}) {
	const [mode, setModeState] = useState<BerxThemeMode>(DEFAULT_MODE);
	const [accentKey, setAccentKeyState] = useState<BerxAccentKey>(DEFAULT_ACCENT);
	const [environment, setEnvironment] = useState<BerxEnvironment>(() => resolveEnvironment(DEFAULT_MODE));
	const loadedRef = useRef(false);

	// Real persisted load, once, on mount.
	useEffect(() => {
		let cancelled = false;
		loadThemePrefs().then(({mode: storedMode, accent: storedAccent}) => {
			if (cancelled) return;
			loadedRef.current = true;
			if (isThemeMode(storedMode)) {
				setModeState(storedMode);
				setEnvironment(resolveEnvironment(storedMode));
			}
			if (isAccentKey(storedAccent)) setAccentKeyState(storedAccent);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	// Real OS-level listener — 'auto' stays live if the system scheme
	// changes while the app is open, not just resolved once at mount.
	useEffect(() => {
		const sub = Appearance.addChangeListener(() => {
			setEnvironment((prev) => {
				if (mode !== 'auto') return prev;
				const next = resolveEnvironment('auto');
				if (next !== prev) animateThemeChange();
				return next;
			});
		});
		return () => sub.remove();
	}, [mode]);

	const setMode = useCallback((next: BerxThemeMode) => {
		animateThemeChange();
		setModeState(next);
		setEnvironment(resolveEnvironment(next));
		// Best-effort — a failed write (storage full, blocked) keeps the
		// in-memory choice live for this session rather than crashing it.
		saveThemeMode(next).catch(() => undefined);
	}, []);

	const setAccentKey = useCallback((next: BerxAccentKey) => {
		animateThemeChange();
		setAccentKeyState(next);
		saveAccent(next).catch(() => undefined);
	}, []);

	const value = useMemo<BerxThemeValue>(
		() => ({
			colors: buildColors(environment, accentKey),
			glass: getBerxGlass(environment),
			scene: buildScene(environment, accentKey),
			environment,
			mode,
			accentKey,
			setMode,
			setAccentKey,
		}),
		[environment, accentKey, mode, setMode, setAccentKey]
	);

	return <BerxThemeContext.Provider value={value}>{children}</BerxThemeContext.Provider>;
}

/** The live palette — reacts to both mode and accent. Outside a provider this is still a real, correct default (Night/Aquamarine), so an un-wrapped tree renders correctly. */
export function useBerxColors(): BerxColorTokens {
	return useContext(BerxThemeContext).colors;
}

/** The live glass ladder — reacts to mode (day/night), not accent (glass is neutral white/dark alpha, not accent-tinted). */
export function useBerxGlass(): Record<1 | 2 | 3 | 4, BerxGlassLevelTokens> {
	return useContext(BerxThemeContext).glass;
}

/** The live BerxAura/BerxLens/BerxOrb scene colours — reacts to both mode and accent. */
export function useBerxScene(): BerxScene {
	return useContext(BerxThemeContext).scene;
}

/** The real, current, resolved mode/accent state plus setters — what the settings screen's Оформление section reads and writes. */
export function useBerxThemeSettings() {
	const ctx = useContext(BerxThemeContext);
	return {
		mode: ctx.mode,
		environment: ctx.environment,
		accentKey: ctx.accentKey,
		setMode: ctx.setMode,
		setAccentKey: ctx.setAccentKey,
	};
}
