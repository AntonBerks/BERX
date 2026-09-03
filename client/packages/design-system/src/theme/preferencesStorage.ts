/**
 * BERX THEME PREFERENCES — real persisted storage, web/harness half.
 *
 * The web/harness half of the True3D/2D-style file split this codebase
 * already uses elsewhere (see any *.native.tsx's own header): the
 * esbuild harness has no `.native.` resolution and always lands here,
 * and so does a genuine react-native-web deployment, which this
 * codebase treats as a real target, not a throwaway stub — so this is
 * real, working `localStorage` persistence, not a no-op placeholder.
 * `@react-native-async-storage/async-storage` has no web implementation
 * of its own (no `.web.js` in the installed package — checked before
 * writing this), so importing it here would either fail to bundle or
 * silently no-op; this file exists so the same public API genuinely
 * persists on web too.
 *
 * Wrapped in try/catch: a private browsing tab or a harness page with
 * storage access blocked must not crash theme resolution — it just
 * falls back to the caller's own in-memory default for that session,
 * same fallback discipline the rest of this app's localStorage use
 * (see artifact-capabilities-style guidance) already follows.
 */
const KEY_MODE = 'berx.themeMode';
const KEY_ACCENT = 'berx.primaryAccent';

function safeGet(key: string): string | null {
	try {
		return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	} catch {
		return null;
	}
}

function safeSet(key: string, value: string): void {
	try {
		if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
	} catch {
		// storage unavailable — the caller keeps its in-memory value for this session
	}
}

export async function loadThemePrefs(): Promise<{mode: string | null; accent: string | null}> {
	return {mode: safeGet(KEY_MODE), accent: safeGet(KEY_ACCENT)};
}

export async function saveThemeMode(mode: string): Promise<void> {
	safeSet(KEY_MODE, mode);
}

export async function saveAccent(accent: string): Promise<void> {
	safeSet(KEY_ACCENT, accent);
}
