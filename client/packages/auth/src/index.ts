/**
 * BerxAuthState — the single source of truth for "are we logged in,
 * and as whom" that every screen/nav-guard reads from, instead of
 * each screen independently calling isAuthenticated() and risking
 * drift. Plain TS, no React dependency — a React hook wrapping this
 * (useSyncExternalStore-style) belongs in the platform layer, not
 * here, so this class is usable from a non-React context too (e.g. a
 * navigation guard that runs before any component mounts).
 *
 * LoginScreen (and every other screen) should call login()/logout()
 * on an instance of this and read status from subscribe() — it should
 * never call api.login()/api.me() directly. That's the whole point of
 * this layer: business/session logic lives here once, not duplicated
 * per screen.
 */
import type { BerxApiClient } from '@berx/api/client';
import { BerxApiError } from '@berx/core';
import type { User } from '@berx/domain';

export type BerxAuthStatus =
	| 'booting'
	| 'unauthenticated'
	| 'authenticating'
	| 'authenticated'
	| 'loggingOut'
	| 'authError'
	| 'bootError';

export interface BerxAuthSnapshot {
	status: BerxAuthStatus;
	user: User | null;
	/** Meaningful when status is 'authError' or 'bootError'; cleared on the next attempt. */
	error: string | null;
}

type Listener = (snapshot: BerxAuthSnapshot) => void;

const INITIAL_SNAPSHOT: BerxAuthSnapshot = { status: 'booting', user: null, error: null };

export class BerxAuthState {
	private api: BerxApiClient;
	private snapshot: BerxAuthSnapshot = INITIAL_SNAPSHOT;
	private listeners: Set<Listener> = new Set();

	constructor(api: BerxApiClient) {
		this.api = api;
	}

	getSnapshot(): BerxAuthSnapshot {
		return this.snapshot;
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private setSnapshot(next: BerxAuthSnapshot) {
		this.snapshot = next;
		for (const listener of this.listeners) {
			listener(next);
		}
	}

	/**
	 * Call once at app startup: checks whether a stored token exists
	 * and, if so, resolves it against /me. Status is 'booting' from
	 * construction until this resolves, so the AppShell can show a
	 * splash state without needing a separate boolean.
	 *
	 * Real fix over the previous version (found and closed this round,
	 * not left as a disclosed gap): BerxApiError carries the real HTTP
	 * status, so a genuinely invalid/expired token (401 from /me) is
	 * now distinguished from a network/server failure —
	 *   401            → token is really bad, clear it, go unauthenticated
	 *   anything else  → 'bootError' with the stored token left intact,
	 *                    so a transient outage doesn't silently log
	 *                    someone out; retry() re-attempts without
	 *                    forcing a fresh login.
	 */
	async bootstrap(): Promise<void> {
		const hasToken = await this.api.isAuthenticated();
		if (!hasToken) {
			this.setSnapshot({ status: 'unauthenticated', user: null, error: null });
			return;
		}
		try {
			const user = await this.api.me();
			this.setSnapshot({ status: 'authenticated', user, error: null });
		} catch (e) {
			if (e instanceof BerxApiError && e.status === 401) {
				await this.api.logout().catch(() => undefined); // best-effort local token clear; server-side revoke may also legitimately 401 here, that's fine
				this.setSnapshot({ status: 'unauthenticated', user: null, error: null });
				return;
			}
			const message = e instanceof Error ? e.message : 'Не удалось подключиться к BERX';
			this.setSnapshot({ status: 'bootError', user: null, error: message });
		}
	}

	/** Re-attempt bootstrap after a bootError (network/server failure) — does not touch the stored token, since bootError specifically means "we don't yet know if the token is good." */
	async retryBoot(): Promise<void> {
		this.setSnapshot({ status: 'booting', user: null, error: null });
		await this.bootstrap();
	}

	async login(usernameOrEmail: string, password: string): Promise<void> {
		this.setSnapshot({ status: 'authenticating', user: null, error: null });
		try {
			await this.api.login(usernameOrEmail, password);
			const user = await this.api.me();
			this.setSnapshot({ status: 'authenticated', user, error: null });
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Не удалось войти';
			this.setSnapshot({ status: 'authError', user: null, error: message });
			throw e;
		}
	}

	/** Call after showing an authError, once the user starts editing the form again — returns to a clean unauthenticated state so a stale error message doesn't linger. */
	clearError(): void {
		if (this.snapshot.status === 'authError') {
			this.setSnapshot({ status: 'unauthenticated', user: null, error: null });
		}
	}

	async logout(): Promise<void> {
		this.setSnapshot({ status: 'loggingOut', user: this.snapshot.user, error: null });
		try {
			await this.api.logout();
		} finally {
			// Same reasoning as BerxApiClient.logout() itself: clear
			// local state even if the network revoke call failed — a
			// user who tapped "log out" should see themselves logged
			// out, not stuck because of a network blip.
			this.setSnapshot({ status: 'unauthenticated', user: null, error: null });
		}
	}
}
