/**
 * BERX THEME PREFERENCES — real persisted storage, native half.
 *
 * A user's theme mode / accent choice, not a secret — plain
 * @react-native-async-storage/async-storage (real, iOS Keystore-backed
 * on… no: it is NOT Keychain-backed, it is plain on-disk storage, which
 * is the RIGHT tool here. `secureTokenStorage.ts` uses react-native-
 * keychain for the auth bearer token specifically because that IS a
 * secret; reusing Keychain for "the user likes Purple" would be the
 * wrong primitive for the data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_MODE = 'berx.themeMode';
const KEY_ACCENT = 'berx.primaryAccent';

export async function loadThemePrefs(): Promise<{mode: string | null; accent: string | null}> {
	const [mode, accent] = await Promise.all([AsyncStorage.getItem(KEY_MODE), AsyncStorage.getItem(KEY_ACCENT)]);
	return {mode, accent};
}

export async function saveThemeMode(mode: string): Promise<void> {
	await AsyncStorage.setItem(KEY_MODE, mode);
}

export async function saveAccent(accent: string): Promise<void> {
	await AsyncStorage.setItem(KEY_ACCENT, accent);
}
