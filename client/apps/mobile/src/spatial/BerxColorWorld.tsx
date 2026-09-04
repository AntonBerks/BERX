/**
 * The BERX Color World — the archive's personalisation layer.
 *
 * Six worlds (v9 02_FOUNDATION/color_worlds.json). Choosing one
 * changes the accent that every scene's lighting, focus ring, energy
 * halo and stateful icon derives from, so the whole app's atmosphere
 * shifts while the BERX identity — the near-black ground, the glass,
 * the depth grammar — stays exactly as it is. Turquoise is the
 * default and the locked brand accent.
 *
 * Persistence is device-local, and that is a real limit rather than a
 * shortcut: `POST /api/v1/me` accepts firstname, lastname, email and
 * password only, and BERX has no profile-preference resource. So the
 * choice is stored on the device with AsyncStorage and the chooser
 * says plainly that it does not follow the account. When a
 * preferences endpoint exists, this provider is the single place that
 * has to change.
 */
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	BERX_COLOR_WORLDS,
	BERX_DEFAULT_COLOR_WORLD,
	type BerxColorWorld,
	type BerxColorWorldName,
} from '@berx/spatial';

const STORAGE_KEY = 'berx.colorWorld';

export interface BerxColorWorldValue {
	world: BerxColorWorldName;
	definition: BerxColorWorld;
	/** All six, in archive order, for the chooser. */
	available: {name: BerxColorWorldName; definition: BerxColorWorld}[];
	setWorld: (next: BerxColorWorldName) => void;
	/** False until the stored choice has been read — the app renders the default meanwhile. */
	loaded: boolean;
	/** Device-local only; there is no account field to sync to. */
	syncedToAccount: false;
}

const Context = createContext<BerxColorWorldValue | null>(null);

function isWorld(value: string | null): value is BerxColorWorldName {
	return value !== null && Object.prototype.hasOwnProperty.call(BERX_COLOR_WORLDS, value);
}

export function BerxColorWorldProvider({children}: {children: React.ReactNode}) {
	const [world, setWorldState] = useState<BerxColorWorldName>(BERX_DEFAULT_COLOR_WORLD);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		AsyncStorage.getItem(STORAGE_KEY)
			.then((stored) => {
				if (cancelled) return;
				/* an unknown or corrupt value falls back to the brand default rather than throwing */
				if (isWorld(stored)) setWorldState(stored);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setLoaded(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const setWorld = useCallback((next: BerxColorWorldName) => {
		setWorldState(next);
		/* best-effort: a failed write means the choice lasts this run only, which is still true */
		AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
	}, []);

	const value = useMemo<BerxColorWorldValue>(
		() => ({
			world,
			definition: BERX_COLOR_WORLDS[world],
			available: (Object.keys(BERX_COLOR_WORLDS) as BerxColorWorldName[]).map((name) => ({
				name,
				definition: BERX_COLOR_WORLDS[name],
			})),
			setWorld,
			loaded,
			syncedToAccount: false,
		}),
		[world, setWorld, loaded],
	);

	return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * Returns the brand default outside a provider rather than throwing:
 * a colour world is a preference, and a screen rendered without the
 * provider should still be BERX-coloured, not broken.
 */
export function useBerxColorWorld(): BerxColorWorldValue {
	const value = useContext(Context);
	if (value) return value;
	return {
		world: BERX_DEFAULT_COLOR_WORLD,
		definition: BERX_COLOR_WORLDS[BERX_DEFAULT_COLOR_WORLD],
		available: (Object.keys(BERX_COLOR_WORLDS) as BerxColorWorldName[]).map((name) => ({
			name,
			definition: BERX_COLOR_WORLDS[name],
		})),
		setWorld: () => undefined,
		loaded: true,
		syncedToAccount: false,
	};
}
