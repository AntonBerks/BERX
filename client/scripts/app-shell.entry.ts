/**
 * BERX. The application is the world.
 *
 * This file boots it and does nothing else. There is no router, no
 * screen, no card list, no tab bar. Sign-in is a real form because
 * text entry is one of the four things a GPU surface cannot honestly
 * provide; the moment there is a session, the form is gone and
 * everything after it is space.
 */
import {BerxApiClient} from '@berx/api/client';
import type {BerxTokenStorage} from '@berx/core';
import {loadBerxWorld} from '@berx/scenes';
import {startBerxApp} from '@berx/spatial-web/appShell';

/**
 * The session token, kept where the browser keeps things for one
 * origin. Not a cookie: the API authenticates with a bearer header,
 * and inventing a cookie flow it does not implement would be a fiction.
 */
const storage: BerxTokenStorage = {
	async getToken() {
		try {
			return localStorage.getItem('berx.token');
		} catch {
			/* private mode, or storage blocked — a real condition, and
			   signing in again is the honest consequence */
			return null;
		}
	},
	async setToken(token) {
		try {
			if (token === null) localStorage.removeItem('berx.token');
			else localStorage.setItem('berx.token', token);
		} catch {
			/* nothing to do: the session lives for this page only */
		}
	},
};

/* The BERX host, not the API root: BerxApiClient appends /api/v1
   itself. Passing the API root produced /api/v1/api/v1/auth/login. */
const apiHost = document.documentElement.dataset.berxHost || location.origin;
const api = new BerxApiClient(apiHost, storage);

const gate = document.getElementById('berx-entry') as HTMLFormElement | null;
const gateError = document.getElementById('berx-entry-error');
const identifier = document.getElementById('berx-identifier') as HTMLInputElement | null;
const password = document.getElementById('berx-password') as HTMLInputElement | null;
const submit = document.getElementById('berx-enter') as HTMLButtonElement | null;

async function enterWorld(): Promise<void> {
	gate?.remove();
	await startBerxApp({
		load: () => loadBerxWorld(api, {feedLimit: 30}),
		textureBudget: 96,
	});
}

async function boot(): Promise<void> {
	const token = await storage.getToken();
	if (token) {
		await enterWorld();
		return;
	}
	if (!gate || !identifier || !password || !submit) return;
	gate.hidden = false;
	gate.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (submit.disabled) return;
		submit.disabled = true;
		if (gateError) gateError.textContent = '';
		try {
			const session = await api.login(identifier.value.trim(), password.value);
			await storage.setToken(session.token);
			await enterWorld();
		} catch (error) {
			/* the server's own reason, never a generic one */
			if (gateError) gateError.textContent = error instanceof Error ? error.message : 'Не удалось войти';
			submit.disabled = false;
		}
	});
}

void boot();
