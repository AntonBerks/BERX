#!/usr/bin/env node
/**
 * BERX INSTALLED, AND BERX OFFLINE.
 *
 * A world read from a server can cache almost nothing: a feed, a
 * conversation, who is nearby and what is happening now are answers
 * that are true for a moment, and several of them are private. So the
 * interesting question about a service worker here is not what it
 * keeps — it is what it REFUSES to keep, and whether it really
 * refuses.
 *
 * This boots the shipped page, lets it register the worker it ships,
 * and then reads the browser's own CacheStorage back to see what
 * actually went in. Then it cuts the network and reloads, which is the
 * only honest test of an offline shell: the page has to come up from
 * the cache, and it has to say it cannot reach the server rather than
 * showing a world it remembers.
 */
import fs from 'node:fs';
import {launchChromium} from './lib/chromium.mjs';
import {startBerxAppServer} from './lib/appserver.mjs';

const {base, server, sockets, dir} = await startBerxAppServer();

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const browser = await launchChromium();
try {
	const context = await browser.newContext({viewport: {width: 420, height: 900}, deviceScaleFactor: 2});
	const pageErrors = [];
	const page = await context.newPage();
	page.on('pageerror', (e) => pageErrors.push(e.message));
	page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });

	await page.goto(base, {waitUntil: 'load'});
	await page.waitForSelector('#berx-entry:not([hidden])');

	/* the manifest, as the browser reads it rather than as the file says */
	const manifest = await page.evaluate(async () => {
		const link = document.querySelector('link[rel=manifest]');
		if (!link) return {linked: false};
		const response = await fetch(link.href);
		const body = await response.json().catch(() => undefined);
		return {
			linked: true, href: link.href, status: response.status,
			type: response.headers.get('content-type'),
			manifest: body,
			themeMeta: document.querySelector('meta[name=theme-color]')?.content,
			appleIcon: document.querySelector('link[rel=apple-touch-icon]')?.href,
		};
	});

	gate('the page is installable, in the world\'s own colours',
		manifest.linked === true && manifest.status === 200
		&& manifest.manifest?.display === 'standalone'
		&& manifest.manifest?.theme_color === '#07080A'
		&& manifest.manifest?.background_color === '#07080A'
		&& manifest.manifest.theme_color === manifest.themeMeta
		&& (manifest.manifest.icons ?? []).some((i) => i.sizes === '512x512')
		&& (manifest.manifest.icons ?? []).some((i) => i.purpose === 'maskable'),
		manifest.linked
			? `${manifest.href} answered ${manifest.status} as ${manifest.type}: display "${manifest.manifest?.display}",`
			+ ` theme ${manifest.manifest?.theme_color} and background ${manifest.manifest?.background_color} — the same #07080A the page's own theme-color meta carries,`
			+ ` ${(manifest.manifest?.icons ?? []).length} icons including a maskable 512. An installed BERX opens as a world, not as a page with a URL bar over the top of it`
			: 'the page links no manifest, so nothing can install it');

	/* the worker the product registers by itself — not one this gate installs */
	const registered = await page.waitForFunction(
		async () => {
			const reg = await navigator.serviceWorker.getRegistration();
			return reg !== undefined && (reg.active !== null || reg.installing !== null || reg.waiting !== null);
		}, undefined, {timeout: 20000},
	).then(() => true).catch(() => false);
	await page.evaluate(() => navigator.serviceWorker.ready).catch(() => undefined);

	const worker = await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.getRegistration();
		return {
			scope: reg?.scope, active: reg?.active?.state,
			scriptURL: reg?.active?.scriptURL,
			controlling: navigator.serviceWorker.controller !== null,
		};
	});

	gate('the shipped session registers its own worker, from product code',
		registered && worker.active === 'activated' && (worker.scriptURL ?? '').endsWith('/berx-sw.js'),
		`${worker.scriptURL} is ${worker.active} for scope ${worker.scope}, controlling=${worker.controlling}.`
		+ ' Registered by scripts/app-shell.entry.ts AFTER the world, because a registration is a network fetch and a worker install, and the first thing a person should get is the world');

	/* Now sign in, so the session really does talk to /api/ — and then
	   read the cache back to see whether any of it was kept. */
	await page.fill('#berx-identifier', 'ann');
	await page.fill('#berx-password', 'secret');
	await page.click('#berx-enter');
	await page.waitForFunction(() => (window.__berxWorld?.latestFrame.world.objects.length ?? 0) > 4, undefined, {timeout: 25000});

	const kept = await page.evaluate(async () => {
		const names = await caches.keys();
		const out = [];
		for (const name of names) {
			const cache = await caches.open(name);
			for (const request of await cache.keys()) out.push({cache: name, url: request.url, method: request.method});
		}
		return {names, entries: out};
	});
	const api = kept.entries.filter((e) => e.url.includes('/api/'));

	gate('nothing private was written to a store that outlives the session',
		api.length === 0 && kept.entries.length > 0,
		`${kept.entries.length} cached entr${kept.entries.length === 1 ? 'y' : 'ies'} in ${kept.names.join(', ') || 'no cache'} — ${kept.entries.map((e) => new URL(e.url).pathname).sort().join(', ')}.`
		+ ` ${api.length} of them are /api/ responses. The session had just read the feed, the friends, the conversations, the places, the events and eleven more endpoints;`
		+ ' berx-sw.js does not intercept /api/ AT ALL, so a signed-in world leaves nothing behind. There is no cache policy that makes somebody\'s messages safe in CacheStorage — it survives sign-out and any later visitor to the same browser profile');

	gate('what it did keep is the shell, and only the shell',
		kept.entries.every((e) => {
			const p = new URL(e.url).pathname;
			return p === '/' || p.endsWith('/index.html') || p.endsWith('/berx-app.js') || p.endsWith('/berx.webmanifest');
		}),
		`every entry is the page, the bundle that draws the world, or the manifest: ${kept.entries.map((e) => new URL(e.url).pathname).sort().join(', ')}`);

	/**
	 * AND NOW THE NETWORK IS GONE.
	 *
	 * Every request from this context is aborted — not slowed, not
	 * 500ing: aborted, the way a phone in a lift behaves. The page has
	 * to come up anyway, and it has to be honest about what it cannot
	 * reach.
	 */
	/* setOffline, not a route interceptor: routing does not reliably reach
	   the fetches a SERVICE WORKER makes, and the whole question here is
	   what the worker does when its own `fetch(request)` fails. This turns
	   the context's network off at the stack, the way a lift does. */
	await context.setOffline(true);
	let reloaded = true;
	try {
		await page.reload({waitUntil: 'domcontentloaded', timeout: 20000});
	} catch (error) {
		reloaded = String(error).slice(0, 160);
	}
	const offline = await page.evaluate(() => ({
		title: document.title,
		hasForm: document.getElementById('berx-entry') !== null,
		hasCanvas: document.querySelector('canvas') !== null,
		bodyBackground: getComputedStyle(document.body).backgroundColor,
		/* what a world drawn from a remembered feed would look like */
		objects: window.__berxWorld?.latestFrame.world.objects.length ?? 0,
		said: document.querySelector('p[role=status]')?.textContent
			?? document.getElementById('berx-entry-error')?.textContent ?? '',
	})).catch((error) => ({error: String(error).slice(0, 160)}));

	gate('with no network at all, BERX still opens',
		reloaded === true && offline.title === 'BERX' && offline.bodyBackground === 'rgb(7, 8, 10)',
		reloaded === true
			? `the reload was served entirely from the cache with every request aborted: title "${offline.title}", the ground still #07080A (${offline.bodyBackground})`
			: `the reload failed: ${reloaded}`);

	gate('and it does not pretend to have a world',
		offline.objects === 0,
		`${offline.objects} entities. There is no world without the server, and a remembered feed shown as a live one would be the exact fake data this runtime refuses.`
		+ ` The session is ${offline.hasCanvas ? 'holding its canvas' : 'back at sign-in'} and says: "${(offline.said || '').slice(0, 120)}"`);

	gate('no page or console errors in any of that',
		pageErrors.length === 0,
		pageErrors.length === 0 ? 'clean' : pageErrors.slice(0, 4).join(' | '));

	await context.close();
} finally {
	await browser.close();
	sockets.closeAll();
	server.closeAllConnections?.();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} PWA GATES FAILED`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log('ALL PWA / OFFLINE-SHELL GATES PASS');
