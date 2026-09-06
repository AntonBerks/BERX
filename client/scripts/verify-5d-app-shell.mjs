#!/usr/bin/env node
/**
 * The world is the application, proved in a real browser.
 *
 * Not "the shell imports the host" — that is a source-code fact and
 * source-code facts are what this whole verification suite exists to
 * stop counting. This boots app/index.html in Chromium against a
 * server that answers with real API-shaped responses, and then checks
 * what is actually on the screen: a WebGL2 world holding entities that
 * came from those responses, no 2D product UI in the document, and
 * navigation that moves a camera instead of replacing anything.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchChromium} from './lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-app-shell-'));

/* the shipped shell, byte for byte, and the bundle the build produced */
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, 'app-shell.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
	'--log-level=error', `--outfile=${path.join(dir, 'berx-app.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.copyFileSync(path.join(repoRoot, 'app', 'index.html'), path.join(dir, 'index.html'));

/* ---------------------------------------------------------------- */
/* A server that answers exactly what components/OssnApi/v1 answers.  */
/* These are the response shapes the API types declare — the same     */
/* fields, the same nullability. Nothing here is a field BERX does    */
/* not send, and nothing the client reads is missing.                 */
/* ---------------------------------------------------------------- */
const NOW = Math.floor(Date.now() / 1000);
const API = {
	'/api/v1/auth/login': {token: 'test-token', user_guid: 77, expires_at: NOW + 86400},
	'/api/v1/me': {guid: 77, username: 'ann', fullname: 'Анна', email: 'a@b.c', icon_url: '', profile_url: '', time_created: NOW - 90000},
	'/api/v1/feed': {
		limit: 30, offset: 0,
		items: [
			{guid: 5150, text: 'вечер удался', owner_guid: 77, owner_username: 'ann', time_created: NOW - 400},
			{guid: 5151, text: 'до завтра', owner_guid: 78, owner_username: 'lev', time_created: NOW - 90000},
		],
	},
	'/api/v1/friends': {friends: [{guid: 78, username: 'lev', fullname: 'Лев', icon: ''}]},
	'/api/v1/conversations': {conversations: [{with_guid: 78, with_username: 'lev', last_message: 'до завтра', time: NOW - 500}]},
	'/api/v1/conversations/78': {
		messages: [
			{id: 9001, from_guid: 77, to_guid: 78, text: 'ты идёшь?', time: NOW - 900},
			{id: 9002, from_guid: 78, to_guid: 77, text: 'до завтра', time: NOW - 500},
			{id: 9003, from_guid: 78, to_guid: 77, text: 'в прошлом месяце', time: NOW - 30 * 86400},
		],
	},
	'/api/v1/places': {
		places: [{
			guid: 4211, title: 'Дом Культуры', description: '', category: 'venue', address: null, phone: null,
			website: null, hours: null, price: null, lat: null, lng: null, owner_guid: 77, cover_url: null,
			rating: 0, rating_count: 0, is_saved: false, is_business: false, business_type: null, verified: false,
		}],
	},
	'/api/v1/events': {
		events: [{
			guid: 908, title: 'Вечер импровизации', description: '', category: null,
			starts: NOW - 600, ends: NOW + 3600, location: null, place: {guid: 4211, title: 'Дом Культуры'},
			capacity: null, seats_left: null, attendee_count: 3, owner_guid: 77, cover_url: null,
			has_ended: false, is_going: true,
		}],
	},
};

const created = [];
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8'};
const served = new Set();
const server = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
	if (name.startsWith('/api/')) {
		served.add(name);
		/* creating a post really creates one, and reading it back returns
		   what the server has — which is what the world is built from */
		if (name === '/api/v1/posts' && req.method === 'POST') {
			const guid = 7700 + created.length;
			created.push(guid);
			API[`/api/v1/posts/${guid}`] = {
				guid, text: 'опубликовано через мир', owner_guid: 77, owner_username: 'ann',
				time_created: NOW, like_count: 0, comment_count: 0,
			};
			res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
			return void res.end(JSON.stringify({guid}));
		}
		const body = API[name];
		if (!body) {
			/* a path this server does not know is a real mismatch between
			   the client and the endpoints it claims to call — say which */
			console.log(`      unmatched API path: ${req.method} ${name}`);
			return void res.writeHead(404, {'content-type': 'application/json'}).end('{"error":"not_found"}');
		}
		res.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
		return void res.end(JSON.stringify(body));
	}
	const file = path.join(dir, name === '/' ? 'index.html' : path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
	if (!file.startsWith(dir) || !fs.existsSync(file)) return void res.writeHead(404).end();
	res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
	fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 1000, height: 700}, deviceScaleFactor: 1});
	const pageErrors = [];
	page.on('pageerror', (e) => pageErrors.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error') pageErrors.push(m.text());
	});

	await page.goto(base, {waitUntil: 'load'});

	/* --- signing in is the one form, and it is gone afterwards --- */
	await page.waitForSelector('#berx-entry:not([hidden])');
	const formBefore = await page.evaluate(() => document.querySelectorAll('form').length);
	await page.fill('#berx-identifier', 'ann');
	await page.fill('#berx-password', 'secret');
	await page.click('#berx-enter');
	try {
		await page.waitForFunction(() => document.querySelector('canvas') !== null && document.querySelector('#berx-entry') === null, undefined, {timeout: 15000});
	} catch (error) {
		console.log('      shell state:', JSON.stringify(await page.evaluate(() => ({
			canvas: document.querySelectorAll('canvas').length,
			form: document.querySelectorAll('form').length,
			error: document.getElementById('berx-entry-error')?.textContent ?? '',
			body: (document.body.innerText ?? '').slice(0, 200),
		}))));
		console.log('      page errors:', pageErrors.slice(0, 5).join(' | '));
		throw error;
	}
	gate('sign-in is a form, and the world replaces it', formBefore === 1 && (await page.evaluate(() => document.querySelectorAll('form').length)) === 0, `${formBefore} form before, 0 after`);

	/* --- the world booted, on a real GPU, holding real entities --- */
	await page.waitForFunction(() => {
		const c = document.querySelector('canvas');
		return c && c.width > 0 && c.getContext('webgl2') !== null;
	}, undefined, {timeout: 15000});

	const shape = await page.evaluate(() => {
		const canvas = document.querySelector('canvas');
		const gl = canvas.getContext('webgl2');
		/* every element the document actually contains, so a 2D product
		   UI cannot hide behind a class name */
		const tags = {};
		for (const el of document.body.querySelectorAll('*')) {
			tags[el.tagName.toLowerCase()] = (tags[el.tagName.toLowerCase()] ?? 0) + 1;
		}
		return {
			canvases: document.querySelectorAll('canvas').length,
			webgl2: gl !== null,
			backing: {w: canvas.width, h: canvas.height},
			role: canvas.getAttribute('role'),
			tabIndex: canvas.tabIndex,
			liveRegions: document.querySelectorAll('[aria-live]').length,
			outline: [...document.querySelectorAll('[aria-live]')].map((n) => n.textContent ?? '').join(' | '),
			tags,
			/* Text a person actually sees. The accessibility bridge is
			   text on purpose — a screen reader needs the world in words
			   — and it is 1x1 and clipped, so it paints nothing. What
			   this looks for is a product interface: text in a box big
			   enough to read. */
			visibleText: [...document.body.querySelectorAll('*')]
				.filter((el) => {
					const box = el.getBoundingClientRect();
					if (box.width <= 1 || box.height <= 1) return false;
					const style = getComputedStyle(el);
					return style.visibility !== 'hidden' && style.display !== 'none';
				})
				.map((el) => (el.childNodes ? [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent?.trim() ?? '').join(' ') : ''))
				.join(' ')
				.trim(),
			/* every element in the document, so nothing can be added or
			   removed without this noticing */
			elementCount: document.body.querySelectorAll('*').length,
		};
	});
	gate('the world is a real GPU surface', shape.canvases === 1 && shape.webgl2 && shape.backing.w > 0, `1 canvas, WebGL2, ${shape.backing.w}x${shape.backing.h} backing store`);
	gate('the world is focusable and announced', shape.role === 'application' && shape.tabIndex === 0 && shape.liveRegions >= 1, `role=${shape.role} tabIndex=${shape.tabIndex}, ${shape.liveRegions} live regions`);

	/* --- ZERO FLAT: the DOM owns no product UI --- */
	/* Only these tags may exist in the product document. Everything a
	   2D application is built from — lists, tables, headings, buttons,
	   navs, links, images, dialogs — is absent, because the world owns
	   all of it. */
	const ALLOWED = new Set(['canvas', 'div', 'p', 'script']);
	const flat = Object.entries(shape.tags).filter(([tag]) => !ALLOWED.has(tag));
	gate(
		'zero flat: the DOM owns no product interface',
		flat.length === 0,
		flat.length === 0
			? `document holds only ${Object.keys(shape.tags).sort().join(', ')} — no list, grid, nav, dialog, button or link`
			: `2D product elements present: ${flat.map(([t, n]) => `${t}×${n}`).join(', ')}`,
	);
	gate(
		'zero flat: no product text is painted by the DOM',
		shape.visibleText.length === 0,
		shape.visibleText.length === 0
			? `the document paints no visible text; ${shape.liveRegions} clipped live regions carry the world in words for a screen reader`
			: `visible DOM text: ${JSON.stringify(shape.visibleText.slice(0, 160))}`,
	);

	/* --- real API data reached the world --- */
	const world = await page.evaluate(() => {
		const w = window.__berxWorld;
		const objects = w.latestFrame.world.objects;
		return {
			count: objects.length,
			ids: objects.map((o) => o.id).sort(),
			kinds: [...new Set(objects.map((o) => o.kind))].sort(),
			viewer: w.viewer,
			region: w.worldPosition.region,
			cursorAt: w.worldPosition.cursor.at,
		};
	});
	const expected = ['person:77', 'person:78', 'moment:5150', 'moment:5151', 'message:78', 'place:4211', 'event:908'].sort();
	gate(
		'real API responses became entities in one world',
		expected.every((id) => world.ids.includes(id)),
		`${world.count} entities: ${world.ids.join(', ')}`,
	);
	gate(
		'the viewer is the signed-in person, and the world is theirs',
		world.viewer === 'person:77',
		`viewer ${world.viewer}, region ${world.region}`,
	);
	gate(
		'endpoints were really called',
		['/api/v1/me', '/api/v1/feed', '/api/v1/friends', '/api/v1/conversations', '/api/v1/places', '/api/v1/events'].every((p) => served.has(p)),
		[...served].sort().join(' '),
	);

	/* --- shared spatial identity: the same place, reached twice --- */
	const identity = await page.evaluate(() => {
		const w = window.__berxWorld;
		const before = w.latestFrame.world.objects.length;
		const place = w.latestFrame.world.objects.find((o) => o.id === 'place:4211');
		const event = w.latestFrame.world.objects.find((o) => o.id === 'event:908');
		const venue = w.allRelations.find((r) => r.from === 'event:908' && r.type === 'located-at');
		return {before, placeId: place?.id, eventId: event?.id, venueTo: venue?.to};
	});
	gate(
		'an event and its venue are the same objects everything else refers to',
		identity.venueTo === identity.placeId && identity.placeId === 'place:4211',
		`event:908 located-at ${identity.venueTo}; the place object is ${identity.placeId}`,
	);

	/* --- navigation is the camera moving, not a screen changing --- */
	const travel = await page.evaluate(async () => {
		const w = window.__berxWorld;
		/* a journey takes 0.65s of real transition; 90 frames covers it
		   even on a slow rasteriser, and arriving is what is measured */
		const settle = async () => {
			for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		await settle();
		/* The product DOM: everything except the accessibility bridge,
		   whose whole job is to change its text as the viewer moves. If
		   travelling were a screen change, elements would appear and
		   disappear here. */
		const productDom = () =>
			[...document.body.querySelectorAll('*')]
				.filter((el) => !el.hasAttribute('aria-live'))
				.map((el) => el.tagName)
				.join(',');
		const domBefore = productDom();
		const countBefore = w.latestFrame.world.objects.length;
		const cameraStart = {...w.latestFrame.camera.position};
		w.travelTo('place:4211');
		await settle();
		const cameraAtPlace = {...w.latestFrame.camera.position};
		const regionAtPlace = w.worldPosition.region;
		w.travelTo('person:78');
		await settle();
		const cameraAtPerson = {...w.latestFrame.camera.position};
		w.back();
		await settle();
		const cameraBack = {...w.latestFrame.camera.position};
		return {
			domBefore,
			domAfter: productDom(),
			countBefore,
			countAfter: w.latestFrame.world.objects.length,
			cameraStart, cameraAtPlace, cameraAtPerson, cameraBack,
			regionAtPlace,
			regionBack: w.worldPosition.region,
			focusBack: w.worldPosition.focusId,
		};
	});
	const moved = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
	gate(
		'travelling moves the camera through one world',
		moved(travel.cameraStart, travel.cameraAtPlace) > 0.5 && moved(travel.cameraAtPlace, travel.cameraAtPerson) > 0.5,
		`start → place ${moved(travel.cameraStart, travel.cameraAtPlace).toFixed(2)} units, place → person ${moved(travel.cameraAtPlace, travel.cameraAtPerson).toFixed(2)} units`,
	);
	gate(
		'travelling replaces nothing: the world and the document are unchanged',
		travel.countAfter === travel.countBefore && travel.domAfter === travel.domBefore,
		`${travel.countBefore} entities before and after; the product document is the same ${travel.domBefore.split(',').length} elements (${travel.domBefore})`,
	);
	gate(
		'back returns to where the viewer was standing, with its context',
		moved(travel.cameraBack, travel.cameraAtPlace) < 0.5 && travel.regionBack === 'place' && travel.focusBack === 'place:4211',
		`camera within ${moved(travel.cameraBack, travel.cameraAtPlace).toFixed(3)} units; region ${travel.regionBack}, focus ${travel.focusBack}`,
	);

	/* --- creating is done from inside the world, and what enters it is
	   the server's row --- */
	const create = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const canvas = document.querySelector('canvas');
		canvas.focus();
		const before = w.latestFrame.world.objects.length;
		const barsBefore = document.querySelectorAll('form').length;
		canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'n', bubbles: true, cancelable: true}));
		const form = document.querySelector('form');
		const field = form?.querySelector('input');
		field.value = 'опубликовано через мир';
		form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
		for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r));
		const made = w.latestFrame.world.objects.filter((o) => o.id.startsWith('moment:77'));
		return {
			before,
			barsBefore,
			after: w.latestFrame.world.objects.length,
			formsNow: document.querySelectorAll('form').length,
			madeId: made[0]?.id,
			madeLabel: made[0]?.label,
			region: w.worldPosition.region,
			focus: w.worldPosition.focusId,
		};
	});
	gate(
		'there is no compose bar until someone is writing',
		create.barsBefore === 0 && create.formsNow === 0,
		`${create.barsBefore} forms in the world before composing, ${create.formsNow} after publishing — the field exists only while it is being used`,
	);
	gate(
		'publishing creates a real server entity and it enters the world',
		create.after === create.before + 1 && create.madeId === 'moment:7700' && create.madeLabel === 'опубликовано через мир',
		`${create.before} entities → ${create.after}; the server made ${create.madeId} "${create.madeLabel}"`,
	);
	gate(
		'the camera travels to what was just made',
		create.region === 'now' && create.focus === 'moment:7700',
		`region ${create.region}, focus ${create.focus}`,
	);

	/* --- a conversation is a place, read by going into it --- */
	const conversation = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const settle = async () => {
			for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		const before = w.latestFrame.world.objects.filter((o) => o.id.startsWith('message:m')).length;
		w.travelTo('message:78');
		await settle();
		const messages = w.latestFrame.world.objects.filter((o) => o.id.startsWith('message:m'));
		const sender = w.allRelations.find((r) => r.from === 'message:m9002' && r.type === 'created-by');
		const thread = w.allRelations.find((r) => r.from === 'message:m9002' && r.type === 'messages');
		const depths = Object.fromEntries(messages.map((m) => [m.id, m.transform.position.z]));
		return {
			before,
			count: messages.length,
			region: w.worldPosition.region,
			senderTo: sender?.to,
			threadTo: thread?.to,
			depths,
			total: w.latestFrame.world.objects.length,
		};
	});
	gate(
		'travelling into a conversation reads it into the same world',
		conversation.before === 0 && conversation.count === 3 && conversation.region === 'conversation',
		`${conversation.before} messages before arriving, ${conversation.count} after; region ${conversation.region}; ${conversation.total} entities in one world`,
	);
	gate(
		'a message belongs to whoever sent it and to the conversation it is in',
		conversation.senderTo === 'person:78' && conversation.threadTo === 'person:78',
		`message:m9002 created-by ${conversation.senderTo}, messages ${conversation.threadTo} — the same person entity the feed already put in the world`,
	);
	gate(
		'the thread extends back through time, not down a list',
		conversation.depths['message:m9003'] < conversation.depths['message:m9002'],
		`last month at z ${conversation.depths['message:m9003'].toFixed(2)}, this morning at z ${conversation.depths['message:m9002'].toFixed(2)}`,
	);

	/* --- T is navigable from the same keyboard --- */
	const temporal = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const canvas = document.querySelector('canvas');
		canvas.focus();
		const at = (id) => w.latestFrame.world.objects.find((o) => o.id === id).transform.position.z;
		const before = {cursor: w.worldPosition.cursor.at, moment: at('moment:5150'), person: at('person:77')};
		for (let i = 0; i < 10; i++) canvas.dispatchEvent(new KeyboardEvent('keydown', {key: '.', bubbles: true, cancelable: true}));
		for (let i = 0; i < 20; i++) await new Promise((r) => requestAnimationFrame(r));
		const after = {cursor: w.worldPosition.cursor.at, moment: at('moment:5150'), person: at('person:77')};
		return {before, after, count: w.latestFrame.world.objects.length};
	});
	gate(
		'time is a direction the viewer can move in, and it moves entities',
		temporal.after.cursor === temporal.before.cursor + 10 * 86400 &&
			temporal.after.moment !== temporal.before.moment &&
			temporal.after.person === temporal.before.person,
		`cursor +${((temporal.after.cursor - temporal.before.cursor) / 86400).toFixed(0)} days; the moment moved ${(temporal.after.moment - temporal.before.moment).toFixed(2)} in depth, the person (timeless) did not`,
	);

	/* --- the real product frame, measured while it runs --- */
	const perf = await page.evaluate(async () => {
		const host = window.__berxHost;
		/* two seconds of real frames, so the p95 is over a real window */
		for (let i = 0; i < 120; i++) await new Promise((r) => requestAnimationFrame(r));
		return {...host.performance};
	});
	gate(
		'the running product reports what it really costs',
		perf.drawCalls > 0 && perf.triangles > 0 && perf.frameMs > 0 && perf.p95Ms > 0 && perf.visible >= 7,
		`${perf.visible} entities, ${perf.inFrustum} in frustum, ${perf.drawCalls} draw calls, ${perf.triangles} triangles, ${perf.lodReduced} at reduced detail, ${perf.budgetCut} cut by budget; ${perf.frameMs.toFixed(1)}ms last frame, p95 ${perf.p95Ms.toFixed(1)}ms, quality ${perf.quality}`,
	);
	gate(
		'the budget is spent on what the camera can see',
		perf.inFrustum <= perf.visible && perf.drawCalls <= perf.inFrustum * 2,
		`${perf.inFrustum} of ${perf.visible} entities inside the frustum; ${perf.drawCalls} draw calls including labels`,
	);

	gate('no page or console errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || 'clean');
} finally {
	await browser.close();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} APP-SHELL GATES FAILED`);
	process.exit(1);
}
console.log('ALL APP-SHELL GATES PASS');
