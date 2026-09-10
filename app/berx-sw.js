/**
 * THE SHELL, AND ONLY THE SHELL.
 *
 * BERX is a world read from a server. Almost nothing about it can be
 * cached: a feed, a conversation, who is nearby and what is happening
 * now are all answers that are only true for a moment, and several of
 * them are private. So this caches exactly two things — the page and
 * the bundle that draws the world — and refuses to touch anything
 * else.
 *
 * WHAT IT WILL NOT DO, and why each one matters:
 *
 *   /api/ IS NEVER INTERCEPTED. Not "cached carefully" — not touched.
 *   A service worker that held a copy of somebody's messages would put
 *   private data in a store that outlives the session, survives
 *   sign-out and is readable by any later visitor to the same browser
 *   profile. There is no cache policy that makes that safe, so there
 *   is no policy: the request goes to the network as if this file did
 *   not exist.
 *
 *   NOTHING BUT GET, and nothing cross-origin. A POST is somebody
 *   changing the world.
 *
 *   THE SHELL IS NETWORK-FIRST. Cache-first would be faster and would
 *   pin a person to whichever build they first loaded until the cache
 *   was manually broken. The network answer wins whenever there is
 *   one, is written back for the next cold start, and the cache is
 *   only read when the network genuinely has nothing to say — which is
 *   the case this exists for.
 *
 * OFFLINE IS HONEST HERE. With the shell cached and no network, BERX
 * opens, says it could not reach the server, and shows no world —
 * because there is no world without the server. It does not show a
 * remembered one.
 */
const CACHE = 'berx-shell-v1';

/* Scope-relative, so this works wherever BERX is mounted. */
const SHELL = ['./', './berx-app.js', './berx.webmanifest'];

self.addEventListener('install', (event) => {
	event.waitUntil((async () => {
		const cache = await caches.open(CACHE);
		/* one at a time and never fatal: a missing optional file must not
		   leave the worker permanently uninstalled */
		await Promise.all(SHELL.map((path) => cache.add(new Request(path, {cache: 'reload'})).catch(() => undefined)));
		/* take over at once. The shell is network-first, so a page
		   already open keeps getting whatever the server has; waiting
		   for every tab to close before an update applies is how a
		   browser ends up running last week's bundle. */
		await self.skipWaiting();
	})());
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		for (const name of await caches.keys()) {
			if (name !== CACHE) await caches.delete(name);
		}
		await self.clients.claim();
	})());
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	/* the line this file exists to hold */
	if (url.pathname.includes('/api/')) return;

	const wanted = request.mode === 'navigate'
		|| url.pathname.endsWith('/berx-app.js')
		|| url.pathname.endsWith('/berx.webmanifest');
	if (!wanted) return;

	event.respondWith((async () => {
		try {
			const fresh = await fetch(request);
			/* only a real answer is worth keeping: a 404 or a 500 cached
			   as the shell is an outage that survives the outage */
			if (fresh && fresh.ok) {
				const cache = await caches.open(CACHE);
				await cache.put(request, fresh.clone());
			}
			return fresh;
		} catch (error) {
			const cached = await caches.match(request, {ignoreSearch: true});
			if (cached) return cached;
			/* BERX has no routes — the world is the application — so any
			   navigation is the same page, and offline it should open
			   rather than fail because the URL carried a path */
			if (request.mode === 'navigate') {
				const shell = await caches.match('./', {ignoreSearch: true});
				if (shell) return shell;
			}
			throw error;
		}
	})());
});
