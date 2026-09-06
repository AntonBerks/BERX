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
import {loadBerxConversation, loadBerxWorld, mapFeedItemToSpatial} from '@berx/scenes';
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
		/**
		 * Arriving at a conversation reads it.
		 *
		 * The first load brings the conversations a person has, not every
		 * message in all of them — that would be reading the whole
		 * account to show one world. Travelling into one is what fetches
		 * its messages, and they land in the same world: the person you
		 * are talking to is the entity that was already there.
		 */
		loadRegion: async (position) => {
			if (position.region !== 'conversation' || !position.focusId) return undefined;
			const guid = Number(position.focusId.split(':')[1]);
			if (!Number.isFinite(guid)) return undefined;
			return loadBerxConversation(api, guid);
		},
		/**
		 * Publishing creates a real post and reads it back.
		 *
		 * `createPost` answers with a guid and nothing else, so the entity
		 * that enters the world is built from what the server then
		 * returns for that guid — not from the text that was typed, which
		 * would be showing someone their own draft and calling it
		 * published.
		 */
		publish: async (text) => {
			const {guid} = await api.createPost(text);
			const post = await api.getPost(guid);
			const mapped = mapFeedItemToSpatial({
				guid: post.guid,
				text: post.text,
				owner_guid: post.owner_guid,
				owner_username: post.owner_username,
				time_created: post.time_created,
			});
			return {object: mapped.object, relations: mapped.relations, media: mapped.media};
		},
		/**
		 * Where this person was standing, kept for this browser only.
		 *
		 * The world's entities are never stored: they come from the
		 * server every time, and a feed restored from disk would be a
		 * world made of yesterday. What is kept is the place — camera
		 * pose, region, focus, time, and the way back.
		 */
		restore: () => {
			try {
				const raw = localStorage.getItem('berx.place');
				return raw ? JSON.parse(raw) : undefined;
			} catch {
				return undefined;
			}
		},
		remember: (state) => {
			try {
				localStorage.setItem('berx.place', JSON.stringify(state));
			} catch {
				/* storage blocked: the session simply starts fresh next time */
			}
		},
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
