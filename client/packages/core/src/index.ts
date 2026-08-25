/**
 * BERX Core — the platform-agnostic transport primitives every other
 * package builds on. Nothing here imports React, React Native, or any
 * DOM-only API beyond what plain `fetch`/`FormData` already need
 * (declared in packages/api, not here) — this package has to compile
 * and be usable from a mobile app, a web app, and a desktop app
 * without any of them pulling in the other two's dependencies.
 */

/**
 * Every platform (mobile/web/desktop) stores the bearer token
 * differently — SecureStore/Keychain on mobile, an httpOnly-adjacent
 * mechanism or localStorage on web, OS keychain on desktop. This
 * interface is the only thing each platform has to implement.
 */
export interface BerxTokenStorage {
	getToken(): Promise<string | null>;
	setToken(token: string | null): Promise<void>;
}

/**
 * DEVELOPMENT-ONLY. Holds the token in a plain JS variable — gone on
 * every reload/restart, never touches disk, never encrypted. This
 * exists so app code has SOMETHING to construct a BerxApiClient with
 * while real platform storage isn't wired up yet (no npm access to
 * install expo-secure-store / react-native-keychain / a web
 * equivalent in this sandbox — see PLATFORM_STORAGE.md). Using this
 * in a real build would mean tokens don't survive an app restart and
 * live in unencrypted memory — never use it past local development.
 */
export class BerxInMemoryTokenStorage implements BerxTokenStorage {
	private token: string | null = null;
	async getToken(): Promise<string | null> {
		return this.token;
	}
	async setToken(token: string | null): Promise<void> {
		this.token = token;
	}
}

export interface BerxApiErrorBody {
	error: string;
	message?: string;
}

export class BerxApiError extends Error {
	status: number;
	code: string;
	constructor(status: number, body: BerxApiErrorBody) {
		super(body.message || body.error);
		this.status = status;
		this.code = body.error;
	}
}

/**
 * Which berx.online (or self-hosted BERX instance) a client instance
 * talks to. Centralized here rather than hardcoded per-app so a
 * staging/dev environment swap is a one-line change, not a
 * find-and-replace across mobile/web/desktop.
 */
export interface BerxEnvironment {
	apiBaseUrl: string;
}

export const BERX_PRODUCTION_ENV: BerxEnvironment = {
	apiBaseUrl: 'https://berx.online',
};

/**
 * Minimal logging seam — every package logs through this instead of
 * calling console.* directly, so a real app can later route logs to
 * crash reporting / remote logging without touching call sites. The
 * default implementation is deliberately just console — swapping it
 * out is the platform layer's job, not this package's.
 */
export interface BerxLogger {
	debug(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
	error(message: string, meta?: Record<string, unknown>): void;
}

export const consoleLogger: BerxLogger = {
	debug: (m, meta) => console.debug(`[BERX] ${m}`, meta ?? ''),
	warn: (m, meta) => console.warn(`[BERX] ${m}`, meta ?? ''),
	error: (m, meta) => console.error(`[BERX] ${m}`, meta ?? ''),
};
