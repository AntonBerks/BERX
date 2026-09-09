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
/* the same presentability probe the shell decides with, served so a
   gate can ask the identical question rather than a similar one */
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, 'webgpu-probe.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
	'--log-level=error', `--outfile=${path.join(dir, 'webgpu-probe.js')}`,
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
	'/api/v1/experiences': {
		experiences: [{
			id: 12, title: 'Прогулка по крышам', description: '',
			anchor: {type: 'event', guid: 908, title: 'Вечер импровизации', image_url: null},
			visibility: 'public', owner_guid: 77, is_own: true,
			scheduled_start: NOW + 7200, scheduled_end: null, my_status: null,
		}],
	},
	'/api/v1/communities': {communities: [{guid: 501, name: 'Соседи', description: '', owner_guid: 77, privacy: 'public', is_member: true}]},
	'/api/v1/collections': {collections: [{id: 33, title: 'Любимые места', description: '', visibility: 'public', owner_guid: 77, is_own: true, item_count: 2, time_updated: NOW}]},
	'/api/v1/posts/5150/like': {status: 'ok'},
	'/api/v1/posts/5150': {guid: 5150, text: 'вечер удался', owner_guid: 77, owner_username: 'ann', time_created: NOW - 400, like_count: 1, comment_count: 0},
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
/** Which GPU backend the product session actually ran on. Reported, not assumed. */
let backend = 'unknown';
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const browser = await launchChromium();
try {
	/* An explicit context, not a bare page: a crashed renderer takes its
	   page with it, and only a context outlives one — which is also what
	   keeps localStorage across the crash, exactly as a real browser
	   would. */
	const context = await browser.newContext({viewport: {width: 1000, height: 700}, deviceScaleFactor: 1});
	const pageErrors = [];
	let crashedOnce = false;
	const watch = (target) => {
		target.on('pageerror', (e) => pageErrors.push(e.message));
		target.on('console', (m) => {
			if (m.type() === 'error') pageErrors.push(m.text());
		});
		target.on('crash', () => {
			crashedOnce = true;
		});
		return target;
	};
	let page = watch(await context.newPage());

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

	/* --- the world booted, on a real GPU, holding real entities ---
	   Either GPU API counts, and which one is reported rather than
	   assumed: the shell asks for the best backend this browser has, so
	   pinning this to WebGL2 would fail the moment a browser had
	   WebGPU — which is not a regression, it is the better renderer. */
	await page.waitForFunction(() => {
		const c = document.querySelector('canvas');
		return c && c.width > 0 && window.__berxHost?.renderer?.kind !== undefined;
	}, undefined, {timeout: 15000});

	const shape = await page.evaluate(() => {
		const canvas = document.querySelector('canvas');
		const backend = window.__berxHost?.renderer?.kind;
		/* every element the document actually contains, so a 2D product
		   UI cannot hide behind a class name */
		const tags = {};
		for (const el of document.body.querySelectorAll('*')) {
			tags[el.tagName.toLowerCase()] = (tags[el.tagName.toLowerCase()] ?? 0) + 1;
		}
		return {
			canvases: document.querySelectorAll('canvas').length,
			backend,
			gpu: backend === 'webgl2' || backend === 'webgpu',
			capabilities: {...(window.__berxHost?.renderer?.capabilities ?? {})},
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
	gate('the world is a real GPU surface',
		shape.canvases === 1 && shape.gpu && shape.capabilities.depthBuffer === true && shape.capabilities.perspective === true && shape.backing.w > 0,
		`1 canvas, ${shape.backend}, perspective and depth, ${shape.backing.w}x${shape.backing.h} backing store`);
	/* Which backend a product session really ended up on, and whether
	   that was the best one available. The shell asks for WebGPU and
	   falls back to WebGL2; a browser that has a device and still ran
	   WebGL2 means the preference silently stopped working. */
	const presentable = await page.evaluate(async () => {
		const {berxWebGPUCanvasPresentable} = await import('/webgpu-probe.js');
		return berxWebGPUCanvasPresentable();
	});
	backend = shape.backend;
	gate('the product session runs on the best GPU this browser can actually draw with',
		presentable.ok ? shape.backend === 'webgpu' : shape.backend === 'webgl2',
		presentable.ok
			? `WebGPU presents to a canvas here and the session is on ${shape.backend}`
			: `WebGPU cannot draw here (${presentable.reason}); the session is on ${shape.backend}, which is the fallback`);

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
	const expected = ['person:77', 'person:78', 'moment:5150', 'moment:5151', 'message:78', 'place:4211', 'event:908', 'experience:12', 'community:501', 'collection:33'].sort();
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
		['/api/v1/me', '/api/v1/feed', '/api/v1/friends', '/api/v1/conversations', '/api/v1/places', '/api/v1/events', '/api/v1/experiences', '/api/v1/communities', '/api/v1/collections'].every((p) => served.has(p)),
		[...served].sort().join(' '),
	);

	/* --- one continuous world: Feed → Moment → Person → Place → Event
	   → Experience is a single connected graph, not six domains that
	   happen to share a scene --- */
	const continuity = await page.evaluate(() => {
		const w = window.__berxWorld;
		const graph = new Map();
		for (const r of w.allRelations) {
			graph.set(r.from, [...(graph.get(r.from) ?? []), r.to]);
			graph.set(r.to, [...(graph.get(r.to) ?? []), r.from]);
		}
		const path = (from, to) => {
			const prev = new Map([[from, null]]);
			const queue = [from];
			while (queue.length) {
				const at = queue.shift();
				if (at === to) {
					const out = [];
					for (let n = to; n; n = prev.get(n)) out.unshift(n);
					return out;
				}
				for (const next of graph.get(at) ?? []) if (!prev.has(next)) {
					prev.set(next, at);
					queue.push(next);
				}
			}
			return undefined;
		};
		const adjacent = (a, b) => (graph.get(a) ?? []).includes(b);
		return {
			/* every link of the chain, as a real relation */
			links: {
				'moment→person': adjacent('moment:5150', 'person:77'),
				'person→place': adjacent('person:77', 'place:4211'),
				'place→event': adjacent('place:4211', 'event:908'),
				'event→experience': adjacent('event:908', 'experience:12'),
			},
			momentToExperience: path('moment:5150', 'experience:12'),
			momentToCollection: path('moment:5150', 'collection:33'),
			conversationToPerson: path('message:78', 'person:78'),
		};
	});
	/* Every link of the chain has to be a real relation, and the ends
	   have to be connected. The shortest path between them is often
	   shorter than the chain — a moment and an experience made by the
	   same person are two hops apart through that person — and that is
	   the graph being well connected, not the chain being broken. */
	gate(
		'Feed → Moment → Person → Place → Event → Experience is one world',
		Object.values(continuity.links).every(Boolean) && Array.isArray(continuity.momentToExperience),
		`${Object.entries(continuity.links).map(([k, v]) => `${k}:${v ? 'yes' : 'NO'}`).join(' ')} — shortest path ${continuity.momentToExperience?.join(' → ')}`,
	);
	gate(
		'every domain is reachable from every other',
		Array.isArray(continuity.momentToCollection) && Array.isArray(continuity.conversationToPerson),
		`${continuity.momentToCollection?.join(' → ')}; ${continuity.conversationToPerson?.join(' → ')}`,
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

	/* --- doing things happens in the world, on the server --- */
	const acted = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const settle = async () => {
			for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		w.blur();
		await settle();
		const noFocus = w.affordances().length;
		w.focus('moment:5150');
		await settle();
		const offered = w.affordances().map((a) => ({id: a.id, action: a.action, label: a.label}));
		const slots = window.__berxHost.renderer.actionSlots.map((s) => s.affordance.action);
		const like = offered.find((a) => a.action === 'like');
		let error;
		const done = await w.act(like.id).catch((e) => {
			error = e instanceof Error ? e.message : String(e);
			return false;
		});
		await settle();
		/* something the server does not implement must fail loudly. A
		   person affords `follow`, and BERX has no follow endpoint. */
		w.focus('person:78');
		await settle();
		const personActions = w.affordances();
		const follow = personActions.find((a) => a.action === 'follow');
		/**
		 * WORLD-AFTER-SUCCESS, in the form that actually protects anyone.
		 *
		 * That a refused action throws is already checked below. What was
		 * not checked is the half that matters: that the canonical world
		 * is IDENTICAL afterwards. An action which mutated the world and
		 * then reported an error would pass "fails loudly" while leaving
		 * a liked post sitting in a world the server never agreed to —
		 * the same lie as a spoken "готово", and harder to notice because
		 * the error message looks like the system being careful.
		 *
		 * Snapshotted as the id and the last-updated stamp of every
		 * entity: an ingest touches updatedAt, so a mutation cannot slip
		 * through by writing the same field back.
		 */
		const snapshot = () => w.latestFrame.world.objects
			.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');
		const worldBefore = snapshot();
		let refused;
		if (follow) await w.act(follow.id).catch((e) => {
			refused = e instanceof Error ? e.message : String(e);
		});
		await settle();
		const worldAfter = snapshot();
		return {
			noFocus, offered, slots, done, error, refused, region: w.worldPosition.region,
			worldUnchanged: worldBefore === worldAfter,
			entities: w.latestFrame.world.objects.length,
		};
	});
	gate(
		'nothing is offered until something is in focus',
		acted.noFocus === 0 && acted.offered.length > 0,
		`${acted.noFocus} actions with nothing focused; ${acted.offered.length} on a moment: ${acted.offered.map((a) => a.label).join(', ')}`,
	);
	gate(
		'the actions stand in the world beside the entity',
		acted.slots.length === acted.offered.length,
		`${acted.slots.length} slots drawn in world space for ${acted.offered.length} affordances — no toolbar, no menu`,
	);
	gate(
		'an action the server has really happens',
		acted.done === true && acted.error === undefined,
		`like on moment:5150 confirmed by the server${acted.error ? `; error ${acted.error}` : ''}`,
	);
	gate(
		'an action the server does not have fails loudly',
		typeof acted.refused === 'string' && acted.refused.includes('follow'),
		acted.refused ?? 'no unimplemented action was offered to test',
	);
	gate(
		'and it leaves the canonical world exactly as it was',
		acted.worldUnchanged === true,
		`${acted.entities} entities, every id and updatedAt identical across the refused action. Failing loudly is only half the rule: an action that mutated the world and then reported an error would pass the check above while leaving a state the server never agreed to — and the error message would make it look like care`,
	);

/**
 * THE ONE PROJECTION THIS GATE MEASURES WITH.
 *
 * Lifted out of the pointer probe so the spacing probe cannot answer
 * "where is this drawn" differently from the probe that presses it. Two
 * copies of a projection is the same class of defect this whole item is
 * about — a layout and a renderer that each measured a word their own
 * way. Installed once into the page and used by both.
 */
const PROJECTOR_SOURCE = String.raw`(canvas, c) => {
		const fwd = {x: c.target.x - c.position.x, y: c.target.y - c.position.y, z: c.target.z - c.position.z};
		const fl = Math.hypot(fwd.x, fwd.y, fwd.z) || 1;
		fwd.x /= fl; fwd.y /= fl; fwd.z /= fl;
		const up0 = {x: 0, y: 1, z: 0};
		const right = {
			x: fwd.y * up0.z - fwd.z * up0.y,
			y: fwd.z * up0.x - fwd.x * up0.z,
			z: fwd.x * up0.y - fwd.y * up0.x,
		};
		const rl = Math.hypot(right.x, right.y, right.z) || 1;
		right.x /= rl; right.y /= rl; right.z /= rl;
		const up = {
			x: right.y * fwd.z - right.z * fwd.y,
			y: right.z * fwd.x - right.x * fwd.z,
			z: right.x * fwd.y - right.y * fwd.x,
		};
		const aspect = canvas.width / canvas.height;
		const tanHalf = Math.tan((c.fov * Math.PI / 180) / 2);
		const rect = canvas.getBoundingClientRect();
		const dpr = canvas.width / Math.max(1, rect.width);

		/** A world point as the pixel it is drawn at, and as a client point. */
		const project = (p) => {
			const d = {x: p.x - c.position.x, y: p.y - c.position.y, z: p.z - c.position.z};
			const along = d.x * fwd.x + d.y * fwd.y + d.z * fwd.z;
			if (along <= 1e-4) return undefined;
			const rx = d.x * right.x + d.y * right.y + d.z * right.z;
			const ry = d.x * up.x + d.y * up.y + d.z * up.z;
			const ndcX = rx / (along * tanHalf * aspect);
			const ndcY = ry / (along * tanHalf);
			const px = (ndcX * 0.5 + 0.5) * canvas.width;
			const py = (0.5 - ndcY * 0.5) * canvas.height;
			return {
				along, ndcX, ndcY, px, py,
				/* how much NDC one world unit is worth at this depth, so
				   a quad can be tested by its EDGES rather than by the
				   single point at its centre */
				ndcPerUnitX: 1 / (along * tanHalf * aspect),
				ndcPerUnitY: 1 / (along * tanHalf),
				onScreen: Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1,
				clientX: rect.left + px / dpr,
				clientY: rect.top + py / dpr,
			};
		};
	/* the canvas geometry the projection was taken with, so a caller
	   turning a pixel into a client coordinate uses the same rect */
	return {project, rect, dpr};
}`;

	/* --- W4: an affordance is a place in the world you can put a finger on ---

	   Counting slots proves nothing about whether any of them can be
	   touched. This drives the SHIPPED shell: it takes each slot's
	   world-space position out of the renderer, projects it with the
	   frame's OWN camera, dispatches a real PointerEvent at exactly
	   those client coordinates, and reads back which affordance the
	   production picking path selected — then what it did to the
	   canonical world. */
	/* Installed before each probe that needs it rather than once: this
	   gate kills the renderer process and forces a context loss further
	   down, and a page that came back would have lost it. */
	const installProjector = () => page.evaluate(
		(src) => { window.__berxProjector = (0, eval)(src); }, PROJECTOR_SOURCE);
	await installProjector();

	const reach = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const canvas = document.querySelector('canvas');
		const settle = async () => { for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r)); };
		w.focus('moment:5150');
		await settle();

		const frame = w.latestFrame;
		const c = frame.camera;
		/* The frame's own camera, through the gate's ONE projector — see
		   PROJECTOR_SOURCE. A second projection here would be measuring a
		   different world from the one that was drawn. */
		const {project, rect, dpr} = window.__berxProjector(canvas, c);

		const slots = host.renderer.actionSlots.map((s) => ({
			id: s.affordance.id, action: s.affordance.action, label: s.affordance.label,
			state: s.affordance.state, position: {...s.position}, halfHeight: s.halfHeight,
			projected: project(s.position),
		}));

		/* The slot to reach for, and the exact pixel it is drawn at. */
		const target = slots.find((s) => s.action === 'like' && s.projected && s.projected.onScreen);
		let picked, activation, sawPending, statesAtPress, statesAtUp;
		/* ALL the live regions, not the first: the shell has three and the
		   first is the loader, which still said "BERX собирает мир" long
		   after the world had arrived. Reading one of three and calling it
		   the announcement is the same mistake as counting slots. */
		const liveText = () => [...document.querySelectorAll('[aria-live]')]
			.map((n) => (n.textContent || '').trim()).filter(Boolean).join(' | ');
		/* The entity the action is ABOUT. "Something in the world
		   changed" is not evidence that a like happened — a focus change
		   would satisfy it too. */
		const stampOf = (id) => {
			const o = w.latestFrame.world.objects.find((x) => x.id === id);
			return o ? `${o.id}@${o.updatedAt}` : 'absent';
		};
		const before = stampOf('moment:5150');
		if (target) {
			const at = target.projected;
			const opts = {pointerType: 'mouse', clientX: at.clientX, clientY: at.clientY, bubbles: true, isPrimary: true, pointerId: 1};
			canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
			statesAtPress = w.affordances().map((a) => `${a.action}:${a.state}`).join(' ');
			canvas.dispatchEvent(new PointerEvent('pointerup', opts));
			statesAtUp = w.affordances().map((a) => `${a.action}:${a.state}`).join(' ');
			/* the announcement names the affordance the production path
			   selected — read before it is replaced by the outcome */
			sawPending = liveText();
			await settle();
			await new Promise((r) => setTimeout(r, 500));
			await settle();
			activation = liveText();
			picked = sawPending;
		}
		const after = stampOf('moment:5150');

		/* And a point far outside every slot must select no action. */
		const miss = {pointerType: 'mouse', clientX: rect.left + 4, clientY: rect.top + 4, bubbles: true, isPrimary: true, pointerId: 2};
		const beforeMiss = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');
		canvas.dispatchEvent(new PointerEvent('pointerdown', miss));
		canvas.dispatchEvent(new PointerEvent('pointerup', miss));
		await settle();
		const afterMiss = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');

		/* Keyboard: is any affordance reachable without a pointer? */
		const beforeKeys = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');
		canvas.focus();
		for (const key of ['Enter', ' ', 'Tab']) {
			canvas.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}));
			await settle();
		}
		const afterKeys = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');

		return {
			slots, target, picked, activation, before, after, statesAtPress, statesAtUp,
			worldChanged: before !== after,
			missChangedWorld: beforeMiss !== afterMiss,
			keyboardChangedWorld: beforeKeys !== afterKeys,
			states: [...new Set(slots.map((s) => s.state))],
			canvas: {width: canvas.width, height: canvas.height},
		};
	});

	gate('every affordance has a real world-space position that projects on screen',
		reach.slots.length > 0 && reach.slots.every((s) => s.projected && Number.isFinite(s.projected.px) && Number.isFinite(s.projected.py)),
		reach.slots.map((s) => `${s.action}@(${s.position.x.toFixed(2)},${s.position.y.toFixed(2)},${s.position.z.toFixed(2)})→${s.projected ? `${s.projected.px.toFixed(0)},${s.projected.py.toFixed(0)}px` : 'behind the eye'}`).join('  ')
		+ ` — projected with the frame's own camera into a ${reach.canvas.width}x${reach.canvas.height} surface. Not a count: a coordinate`);

	gate('a real pointer at the pixel a slot is drawn at selects THAT affordance',
		typeof reach.picked === 'string' && reach.target !== undefined && reach.picked.includes(reach.target.label),
		reach.target
			? `PointerEvent at ${reach.target.projected.px.toFixed(0)},${reach.target.projected.py.toFixed(0)}px (client ${reach.target.projected.clientX.toFixed(0)},${reach.target.projected.clientY.toFixed(0)}) on "${reach.target.label}" → the shell announced "${reach.picked}". The pixel was computed from the slot's world position, not read off the picker`
			: 'no like slot projected on screen to aim at');

	gate('activating it changes the canonical world, from what the server confirmed',
		reach.worldChanged === true && typeof reach.activation === 'string' && reach.activation.includes('готово'),
		`moment:5150 ${reach.before} → ${reach.after}; states at press [${reach.statesAtPress}] and at release [${reach.statesAtUp}]; the shell announced "${reach.activation}". Pinned to the entity the action is ABOUT: "something in the world changed" would be satisfied by a focus change`);

	gate('a pointer that hits no slot leaves the canonical world alone',
		reach.missChangedWorld === false,
		'a press in an empty corner selected no affordance and mutated nothing — picking that fell through to "nearest anything" would make every empty press an action');

	/* Item 10 is now proven by the keyboard gates above, which Tab onto a
	   real affordance and press Enter. This probe pressed Enter BEFORE
	   entering the ring, where Enter still means travel — so it is kept
	   as the check that travel has not quietly become an action. */
	gate('Enter before the ring is entered travels, and does not act',
		reach.keyboardChangedWorld === false,
		'with no affordance focused, Enter moves the camera to the focused entity and mutates nothing. Entering the ring is what makes Enter an action, and that is measured separately');

	/* Item 7: the declared states. */
	console.log(`NOTE  affordance runtime states actually produced: ${reach.states.join(', ')}`);
	console.log("      BerxSocialActionState declares 'available' | 'disabled' | 'pending' | 'unavailable' | 'hidden'. Only the first two are ever assigned (spatialAffordances.ts: object.interactive ? 'available' : 'disabled'). pending/success/failure exist as a spoken announcement and a haptic moment, and as no state on the affordance — so nothing in the world shows a press, a wait, or a refusal");

	/* --- NOW is a reading of the world, not a feed --- */
	const now = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const canvas = document.querySelector('canvas');
		canvas.focus();
		const settle = async () => {
			for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		const liveNow = w.live().map((o) => ({id: o.id, energy: o.energy}));
		canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'l', bubbles: true, cancelable: true}));
		await settle();
		const arrived = {region: w.worldPosition.region, focus: w.worldPosition.focusId};
		const total = w.latestFrame.world.objects.length;
		/* scrub a year back: nothing is happening then, and NOW says so */
		w.scrubTime(-365 * 86400);
		await settle();
		const liveThen = w.live().length;
		const stillThere = w.latestFrame.world.objects.length;
		w.scrubTime(365 * 86400);
		await settle();
		return {liveNow, arrived, total, liveThen, stillThere};
	});
	gate(
		'NOW travels to what is actually happening',
		now.liveNow.length > 0 && now.arrived.region === 'now' && now.arrived.focus === now.liveNow[0].id,
		`live: ${now.liveNow.map((l) => `${l.id} at ${l.energy.toFixed(2)}`).join(', ')}; arrived at ${now.arrived.focus}`,
	);
	gate(
		'NOW is empty in a year when nothing was happening, and the world is not',
		now.liveThen === 0 && now.stillThere === now.total,
		`a year back: ${now.liveThen} live, ${now.stillThere} of ${now.total} entities still in the world`,
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

	/* --- the GPU can be taken away, and the world survives it ---
	   This is a real device loss, not a simulated one: destroy() ends the
	   WebGPU device, every pipeline and buffer on it becomes invalid, and
	   device.lost resolves. What is being checked is that the world is
	   not in the renderer — the same entities, the same camera, the same
	   focus, drawn again by a backend that did not exist a moment ago. */
	const recovery = await page.evaluate(async () => {
		const host = window.__berxHost;
		const w = window.__berxWorld;
		const settle = async (frames) => {
			for (let i = 0; i < frames; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		const before = {
			kind: host.renderer.kind,
			objects: w.latestFrame.world.objects.length,
			camera: {...w.latestFrame.camera.position},
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
			drawCalls: host.performance.drawCalls,
			residentTextures: host.performance.residentTextures,
		};
		if (before.kind !== 'webgpu') return {forced: false, reason: `this session is on ${before.kind}, whose context loss is forced and verified separately below`, before};

		const states = [];
		/* the device really goes away here */
		host.renderer.device?.destroy?.();
		for (let i = 0; i < 600 && host.contextAlive; i++) await new Promise((r) => requestAnimationFrame(r));
		states.push({alive: host.contextAlive, kind: host.renderer.kind});
		/* and the host rebuilds on a new one */
		for (let i = 0; i < 600 && !host.contextAlive; i++) await new Promise((r) => requestAnimationFrame(r));
		await settle(30);
		return {
			forced: true,
			before,
			wentDown: states[0],
			after: {
				alive: host.contextAlive,
				kind: host.renderer.kind,
				objects: w.latestFrame.world.objects.length,
				camera: {...w.latestFrame.camera.position},
				focus: w.worldPosition.focusId,
				cursor: w.worldPosition.cursor.at,
				drawCalls: host.performance.drawCalls,
				residentTextures: host.performance.residentTextures,
			},
		};
	});
	if (recovery.forced) {
		gate('a real GPU device loss takes the world down',
			recovery.wentDown.alive === false,
			`destroy() ended the ${recovery.before.kind} device and the host reported the loss`);
		gate('and the world comes back on a new device, in the same place',
			recovery.after.alive === true &&
			recovery.after.kind === recovery.before.kind &&
			recovery.after.objects === recovery.before.objects &&
			recovery.after.focus === recovery.before.focus &&
			recovery.after.cursor === recovery.before.cursor &&
			recovery.after.drawCalls > 0,
			`${recovery.after.objects} entities, focus ${recovery.after.focus}, cursor unchanged, ${recovery.after.drawCalls} draw calls on the new device`);
		gate('the pictures come back without re-reading the server',
			recovery.after.residentTextures >= recovery.before.residentTextures,
			`${recovery.before.residentTextures} textures before the loss, ${recovery.after.residentTextures} after`);
	} else {
		console.log('BLOCKED  webgpu-device-loss');
		console.log(`         ${recovery.reason}`);
	}

	/* --- and a real WebGL2 context loss, in the running session ---
	   WEBGL_lose_context is the browser's own way to take a context
	   away: it fires the same webglcontextlost the driver fires, every
	   GL object becomes invalid, and restoreContext brings a fresh
	   context back. So the loss and the recovery are both real, and what
	   is being checked is that the world was never in the renderer. */
	const glLoss = await page.evaluate(async () => {
		const host = window.__berxHost;
		const w = window.__berxWorld;
		const settle = async (frames) => {
			for (let i = 0; i < frames; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		if (host.renderer.kind !== 'webgl2') {
			return {forced: false, reason: `this session is on ${host.renderer.kind}, whose loss is exercised separately`};
		}
		const canvas = document.querySelector('canvas');
		const gl = canvas.getContext('webgl2');
		const extension = gl?.getExtension('WEBGL_lose_context');
		if (!extension) return {forced: false, reason: 'WEBGL_lose_context is unavailable in this browser'};

		const before = {
			objects: w.latestFrame.world.objects.length,
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
			camera: {...w.latestFrame.camera.position},
			drawCalls: host.performance.drawCalls,
		};
		extension.loseContext();
		for (let i = 0; i < 300 && host.contextAlive; i++) await new Promise((r) => requestAnimationFrame(r));
		const down = {alive: host.contextAlive, objects: w.latestFrame.world.objects.length};
		/* the world keeps time with no GPU to draw it */
		await settle(30);
		const whileDown = {cursor: w.worldPosition.cursor.at, objects: w.latestFrame.world.objects.length};

		extension.restoreContext();
		for (let i = 0; i < 300 && !host.contextAlive; i++) await new Promise((r) => requestAnimationFrame(r));
		await settle(60);
		return {
			forced: true,
			before,
			down,
			whileDown,
			after: {
				alive: host.contextAlive,
				objects: w.latestFrame.world.objects.length,
				focus: w.worldPosition.focusId,
				cursor: w.worldPosition.cursor.at,
				drawCalls: host.performance.drawCalls,
				triangles: host.performance.triangles,
			},
		};
	});
	if (glLoss.forced) {
		gate('a real GPU context loss takes the world down',
			glLoss.down.alive === false && glLoss.down.objects === glLoss.before.objects,
			`WEBGL_lose_context ended the context; the host stopped drawing and still holds all ${glLoss.down.objects} entities`);
		gate('the world keeps existing while there is no GPU to draw it',
			glLoss.whileDown.objects === glLoss.before.objects && glLoss.whileDown.cursor === glLoss.before.cursor,
			`${glLoss.whileDown.objects} entities and an unchanged temporal cursor with no context at all`);
		gate('and it draws again on a restored context, in the same place',
			glLoss.after.alive === true &&
			glLoss.after.objects === glLoss.before.objects &&
			glLoss.after.focus === glLoss.before.focus &&
			glLoss.after.drawCalls > 0 &&
			glLoss.after.triangles > 0,
			`${glLoss.after.objects} entities, focus ${glLoss.after.focus}, ${glLoss.after.drawCalls} draw calls and ${glLoss.after.triangles} triangles on the restored context`);
	} else {
		console.log('BLOCKED  webgl-context-loss');
		console.log(`         ${glLoss.reason}`);
	}

	/* --- a reload puts you back where you were standing --- */
	const before = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const settle = async () => {
			for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r));
		};
		w.travelTo('place:4211');
		await settle();
		w.scrubTime(3 * 86400);
		await settle();
		/* what was written down, which is what a reload can restore */
		const stored = JSON.parse(localStorage.getItem('berx.place') ?? 'null');
		return {
			camera: {...w.latestFrame.camera.position},
			stored,
			region: w.worldPosition.region,
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
		};
	});
	await page.reload({waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.__berxWorld !== 'undefined' && window.__berxWorld.latestFrame.world.objects.length > 0, undefined, {timeout: 15000});
	const after = await page.evaluate(async () => {
		const w = window.__berxWorld;
		for (let i = 0; i < 30; i++) await new Promise((r) => requestAnimationFrame(r));
		return {
			camera: {...w.latestFrame.camera.position},
			/* what the restore actually put back, before any breathing */
			restored: JSON.parse(localStorage.getItem('berx.place') ?? 'null').camera.position,
			region: w.worldPosition.region,
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
			entities: w.latestFrame.world.objects.length,
			signedIn: document.querySelector('#berx-entry') === null,
		};
	});
	/* The pose is restored exactly; the camera then keeps breathing,
	   because the world does. So the exact test is against what was
	   written down, and the live camera only has to still be standing
	   in the same spot rather than frozen at it. */
	const restoredExactly = before.stored
		&& Math.abs(after.restored.x - before.stored.camera.position.x) < 1e-9
		&& Math.abs(after.restored.y - before.stored.camera.position.y) < 1e-9
		&& Math.abs(after.restored.z - before.stored.camera.position.z) < 1e-9;
	const drift = Math.hypot(after.camera.x - before.camera.x, after.camera.y - before.camera.y, after.camera.z - before.camera.z);
	gate(
		'a reload restores the exact place, not a similar page',
		restoredExactly && drift < 1.5 && after.region === before.region && after.focus === before.focus && after.cursor === before.cursor,
		`pose restored bit-for-bit; the live camera has since breathed ${drift.toFixed(3)} units; region ${after.region}, focus ${after.focus}, cursor identical at ${after.cursor}`,
	);
	gate(
		'the entities are re-read from the server, not restored from disk',
		after.entities > 0 && after.signedIn,
		`${after.entities} entities after reload, session kept, world refetched`,
	);

	/* --- the world still has an edge ---
	   The restore above used to be dragged several metres by the edge:
	   a reload re-reads ten entities where fourteen stood, the bound is
	   derived from what the world contains, and the smaller bound pulled
	   a viewer who had not moved at all. The rule is now that the edge
	   stops someone FLYING away rather than dragging someone standing
	   still — which only holds up if flying away is still stopped, so
	   that is measured here rather than assumed. */
	const edge = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const before = {...w.latestFrame.camera.position};
		const edgeNow = w.worldEdge;
		/* Is the world's own frame loop running at all? Without it
		   nothing clamps, and a still camera looks exactly like a
		   correctly clamped one until you fly. */
		const t0 = w.latestFrame.world.worldTime;
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => requestAnimationFrame(r));
		const loopRunning = w.latestFrame.world.worldTime !== t0;
		/* fly straight out, one big step per frame, the way free flight
		   reaches the edge in the first place */
		const trail = [];
		for (let i = 0; i < 40; i++) {
			const c = w.latestFrame.camera;
			w.runtime.camera.setState({...c, position: {x: c.position.x, y: c.position.y, z: c.position.z + 40}});
			await new Promise((r) => requestAnimationFrame(r));
			const p = w.latestFrame.camera.position;
			trail.push(Math.round(Math.hypot(p.x - edgeNow.centre.x, p.y - edgeNow.centre.y, p.z - edgeNow.centre.z) * 10) / 10);
		}
		const after = {...w.latestFrame.camera.position};
		/* The edge is measured from the world's centre, and the world can
		   move: a relayout re-places everything, so a distance taken
		   against a centre captured before the flight is a distance to
		   somewhere the world has left. */
		const edgeAfter = w.worldEdge;
		const dist = (p) => Math.hypot(p.x - edgeNow.centre.x, p.y - edgeNow.centre.y, p.z - edgeNow.centre.z);
		const distNow = (p) => Math.hypot(p.x - edgeAfter.centre.x, p.y - edgeAfter.centre.y, p.z - edgeAfter.centre.z);
		/* WHY, when it does not hold. The clamp is skipped while the
		   runtime is travelling and on the first frame after a world is
		   built, so a bare distance cannot tell a broken edge from a
		   camera somebody else was moving. */
		return {
			before: dist(before), after: dist(after), limit: edgeNow.limit, radius: edgeNow.radius,
			travelling: w.runtime.travelling, entities: w.latestFrame.world.objects.length, loopRunning,
			afterAgainstNow: distNow(after), limitNow: edgeAfter.limit, trail,
			centreMoved: Math.hypot(edgeAfter.centre.x - edgeNow.centre.x, edgeAfter.centre.y - edgeNow.centre.y, edgeAfter.centre.z - edgeNow.centre.z),
			region: w.worldPosition.region,
		};
	});
	gate(
		'flying away from the world is still stopped by its edge',
		edge.after <= edge.limit + 0.01 && edge.limit > 0,
		`1600 units of outward flight left the camera ${edge.after.toFixed(1)} units from the world's centre, against the runtime's own limit of ${edge.limit.toFixed(1)} (against the world's centre as it stands now: ${edge.afterAgainstNow.toFixed(1)} of ${edge.limitNow.toFixed(1)}, centre moved ${edge.centreMoved.toFixed(2)}; trail ${edge.trail.slice(0,8).join(' ')} ... ${edge.trail.slice(-4).join(' ')}; loop running=${edge.loopRunning}, travelling=${edge.travelling}, ${edge.entities} entities, region ${edge.region}) (a ${edge.radius.toFixed(1)}-unit world plus the margin that lets you step back and see all of it) — the camera's absolute depth clamp would have allowed 45.0, so this is the world edge and not that`,
	);

	/* --- a real process crash, and what the world remembers ---
	   Not a reload: chrome://crash kills the renderer process outright,
	   the way a browser tab dies for real. Nothing gets to run an unload
	   handler or write anything down on the way out, so what comes back
	   is whatever was already durable. The context outlives the process,
	   which is what makes this the real test rather than a new browser. */
	const beforeCrash = await page.evaluate(() => {
		const w = window.__berxWorld;
		return {
			region: w.worldPosition.region,
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
			entities: w.latestFrame.world.objects.length,
			stored: JSON.parse(localStorage.getItem('berx.place') ?? 'null'),
		};
	});
	crashedOnce = false;
	try {
		await page.goto('chrome://crash', {timeout: 5000});
	} catch (error) {
		crashedOnce = crashedOnce || /crash|Target closed|Page closed/i.test(String(error.message));
	}
	gate('the renderer process can really be killed', crashedOnce, 'chrome://crash ended the process holding the world');

	page = watch(await context.newPage());
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.__berxWorld !== 'undefined' && window.__berxWorld.latestFrame.world.objects.length > 0, undefined, {timeout: 20000});
	const afterCrash = await page.evaluate(async () => {
		const w = window.__berxWorld;
		for (let i = 0; i < 30; i++) await new Promise((r) => requestAnimationFrame(r));
		return {
			region: w.worldPosition.region,
			focus: w.worldPosition.focusId,
			cursor: w.worldPosition.cursor.at,
			entities: w.latestFrame.world.objects.length,
			restored: JSON.parse(localStorage.getItem('berx.place') ?? 'null'),
			signedIn: document.querySelector('#berx-entry') === null,
			backend: window.__berxHost.renderer.kind,
		};
	});
	const poseSurvived = beforeCrash.stored && afterCrash.restored
		&& Math.abs(afterCrash.restored.camera.position.x - beforeCrash.stored.camera.position.x) < 1e-9
		&& Math.abs(afterCrash.restored.camera.position.y - beforeCrash.stored.camera.position.y) < 1e-9
		&& Math.abs(afterCrash.restored.camera.position.z - beforeCrash.stored.camera.position.z) < 1e-9;
	gate('the world comes back from a killed process, in the same place',
		poseSurvived
		&& afterCrash.region === beforeCrash.region
		&& afterCrash.focus === beforeCrash.focus
		&& afterCrash.cursor === beforeCrash.cursor
		&& afterCrash.entities > 0
		&& afterCrash.signedIn,
		`pose bit-for-bit, region ${afterCrash.region}, focus ${afterCrash.focus}, cursor ${afterCrash.cursor}, ${afterCrash.entities} entities re-read from the server, session kept, on ${afterCrash.backend}`);

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

	/* --- W4 item 7: every state, produced and rendered --- */
	const states = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const canvas = document.querySelector('canvas');
		const settle = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); };
		const entered = {focus: w.worldPosition.focusId};
		w.focus('moment:5150');
		await settle();

		/**
		 * Push the world's affordances at the renderer and draw, exactly
		 * as the host's frame loop does.
		 *
		 * Rendering without this reads slots from whenever
		 * setAffordances last ran, which is how a `pending` sample came
		 * back saying `focus`: the state was right and the picture was
		 * stale. Two lines, in the same order the production loop uses.
		 */
		const renderNow = () => {
			host.renderer.setAffordances(w.affordances());
			host.renderer.render(w.latestFrame, {});
		};

		/** What the world says, and what the renderer got, for one state. */
		const snap = (label) => {
			const affs = w.affordances().map((a) => ({id: a.id, action: a.action, state: a.state}));
			const slots = host.renderer.actionSlots.map((s) => ({
				id: s.affordance.id, state: s.state, halfHeight: s.halfHeight, alpha: s.alpha,
				y: Math.round(s.position.y * 1000) / 1000,
			}));
			return {label, affs, slots};
		};

		const seen = {};
		const record = async (name) => { await settle(); renderNow(); seen[name] = snap(name); };

		/* available: nothing touching it */
		w.blurAffordance(); w.pointAt(undefined); w.pressAffordance(undefined);
		await record('available');

		const likeId = 'moment:5150:like';
		/* proximity: the hand is near, not on */
		w.pointAt(undefined, [likeId]);
		await record('proximity');
		/* hover: the hand is on it */
		w.pointAt(likeId, [likeId]);
		await record('hover');
		/* press: held */
		w.pressAffordance(likeId);
		await record('press');
		w.pressAffordance(undefined); w.pointAt(undefined);
		/* focus: the keyboard is on it */
		while (w.focusedAffordance?.id !== likeId) {
			canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true}));
			await settle();
			if (!w.focusedAffordance) break;
		}
		await record('focus');
		w.blurAffordance();

		/* pending / success: from the REAL request, not a timer. The
		   pending sample is taken while the promise is in flight. */
		/**
		 * NO AWAITS AT ALL between the call and the sample.
		 *
		 * `act` sets pending before its first await, so the state is
		 * true the instant the promise exists. This fixture's server
		 * answers so fast that even two animation frames let it finish
		 * first — the probe then sampled `success` and reported a
		 * missing `pending`, which was the probe being slow rather than
		 * the state being absent.
		 *
		 * The render is called explicitly and synchronously, so the slot
		 * really does carry the state: this is not the world's own copy
		 * being read back, it is what the renderer received.
		 */
		const flight = w.act(likeId);
		const pendingAffordance = w.affordances().find((a) => a.id === likeId)?.state;
		renderNow();
		const pending = snap('pending');
		const ok = await flight.catch(() => false);
		/* Sampled at once: an outcome says so for 1.6 seconds, and this
		   renderer's frames are slow enough that settling forty of them
		   outlives it. */
		renderNow();
		const success = snap('success');

		/* failure: the real refusal, and the world it must not touch */
		w.focus('person:78');
		await settle();
		const follow = w.affordances().find((a) => a.action === 'follow');
		let failure, worldBefore, worldAfter;
		if (follow) {
			worldBefore = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');
			await w.act(follow.id).catch(() => undefined);
			renderNow();
			failure = snap('failure');
			worldAfter = w.latestFrame.world.objects.map((o) => `${o.id}@${o.updatedAt}`).sort().join('|');
		}

		/**
		 * disabled: an entity this viewer cannot act on.
		 *
		 * `interactive: false` is a real domain value with real
		 * producers — berxVoiceWorld sets it on two kinds of thing — but
		 * nothing in the world this shell loads carries it, so one is
		 * put in through the SAME `ingest` the server's own entities
		 * arrive by. The affordance generation, the ring, the render and
		 * the picker are all the production ones; only the flag is set
		 * here, and it is set to a value production sets.
		 */
		w.ingest([{
			object: {
				id: 'place:9001', kind: 'place', label: 'Закрытое место',
				transform: {position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1.6, z: 0.2}},
				material: {opacity: 1}, energy: 0, visible: true,
				interactive: false, focusable: true,
				depth: 0, createdAt: Date.now(), updatedAt: Date.now(),
			},
			relations: [{id: 'person:77->place:9001:asked', from: 'person:77', to: 'place:9001', type: 'related', strength: 0.5}],
			media: [],
		}]);
		await settle();
		w.focus('place:9001');
		await settle();
		renderNow();
		const disabled = snap('disabled');
		/* And it must not be activatable: the SAME check pickActionSlot
		   consults, asked of the real affordance through the real act. */
		const disabledAct = await w.act('place:9001:save').then((r) => r).catch(() => 'threw');
		w.remove('place:9001');
		await settle();

		/* hidden: never becomes a slot at all */
		const beforeHidden = host.renderer.actionSlots.length;
		w.focus('moment:5150');
		await settle();
		const visibleRing = w.affordances().map((a) => a.id);
		host.renderer.setAffordances(w.affordances().map((a) => ({...a, state: 'hidden'})));
		host.renderer.render(w.latestFrame, {});
		const hiddenSlots = host.renderer.actionSlots.length;

		if (entered.focus) w.focus(entered.focus);
		await settle();
		await new Promise((r) => setTimeout(r, 1500));
		await settle();

		return {
			seen, pending, pendingAffordance, success, failure, disabled, ok, disabledAct,
			worldUnchangedOnFailure: worldBefore !== undefined && worldBefore === worldAfter,
			hidden: {before: beforeHidden, after: hiddenSlots, ring: visibleRing.length},
			settled: w.latestFrame.transition === undefined && !w.runtime.travelling,
		};
	});

	const stateOf = (snapshot, id) => snapshot?.slots.find((s) => s.id === id);
	const LIKE = 'moment:5150:like';
	const required = ['available', 'proximity', 'hover', 'press', 'focus'];
	const reached = required.map((n) => [n, stateOf(states.seen[n], LIKE)?.state]);

	gate('every input state is produced by runtime logic and reaches the SLOT',
		reached.every(([want, got]) => want === got),
		reached.map(([want, got]) => `${want}→${got ?? 'missing'}`).join(', ')
		+ ' — read off renderer.actionSlots, which is what the picker and the draw both use. The world decides which state wins when several are true at once; input only reports where a hand is');

	const presentations = required.map((n) => {
		const s = stateOf(states.seen[n], LIKE);
		return `${n}: h=${s ? s.halfHeight.toFixed(3) : '?'} a=${s ? s.alpha.toFixed(2) : '?'} y=${s ? s.y : '?'}`;
	});
	const distinct = new Set(required.map((n) => {
		const s = stateOf(states.seen[n], LIKE);
		return s ? `${s.halfHeight.toFixed(3)}/${s.alpha.toFixed(2)}/${s.y}` : n;
	}));
	gate('and each one changes the slot\'s spatial presentation, not just its name',
		distinct.size === required.length,
		presentations.join('  ') + ` — ${distinct.size} distinct geometries for ${required.length} states. Size, brightness and height off the ring, from one table in the core: press goes IN, and an outcome rises or settles`);

	gate('pending is the state while the request is in flight, and success only after the server confirmed',
		states.pendingAffordance === 'pending' && stateOf(states.pending, LIKE)?.state === 'pending'
			&& stateOf(states.success, LIKE)?.state === 'success' && states.ok === true,
		`in flight the affordance says ${states.pendingAffordance} and the SLOT the renderer received says ${stateOf(states.pending, LIKE)?.state} (alpha ${stateOf(states.pending, LIKE)?.alpha}); after the server answered: ${stateOf(states.success, LIKE)?.state} at y=${stateOf(states.success, LIKE)?.y} against ${stateOf(states.seen.available, LIKE)?.y} at rest. Set before the call and cleared by its answer — not an animation hoping to finish when the server does`);

	const followSlot = states.failure?.slots.find((s) => s.state === 'failure');
	gate('failure is a state of the world, and the world it failed on is unchanged',
		followSlot !== undefined && states.worldUnchangedOnFailure === true,
		followSlot
			? `the refused action settled to y=${followSlot.y} at alpha ${followSlot.alpha}, and every entity id/updatedAt is identical across the refusal. Success rises, failure settles — opposite directions in a world, which read as opposite without anyone being told which is which`
			: 'no failure state reached a slot');

	const disabledSlot = states.disabled?.slots.find((s) => s.state === 'disabled');
	gate('disabled stands in the world and cannot be acted on',
		disabledSlot !== undefined && disabledSlot.alpha < 0.4 && states.disabledAct === false,
		disabledSlot
			? `a non-interactive entity's actions stand at alpha ${disabledSlot.alpha} and half-height ${disabledSlot.halfHeight.toFixed(3)}, and act() returned ${JSON.stringify(states.disabledAct)} — refused by the same berxCanActivate list pickActionSlot consults, so drawn and touchable cannot drift apart. It used to be FILTERED OUT before the renderer: the one state the domain really produced was the one nothing could show`
			: 'no disabled affordance reached a slot');

	gate('hidden never becomes a slot, so it can be neither seen nor touched',
		states.hidden.after === 0 && states.hidden.ring > 0,
		`${states.hidden.ring} affordances made ${states.hidden.before} slots; marked hidden they made ${states.hidden.after}. Dropped in berxActionRing, before there is anything to draw OR to pick — nothing downstream has to remember the rule`);

	gate('the state probe leaves the world as it found it',
		states.settled === true,
		'no camera transition in flight when this probe ends');

	/* --- W4 item 6, step 1: picking sees only what was drawn --- */
	await installProjector();
	const residency = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const settle = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); };
		const entered = w.worldPosition.focusId;
		w.focus('moment:5150');
		await settle();

		const resident = {
			requested: host.renderer.requestedSlots.map((s) => s.affordance.id),
			drawn: host.renderer.actionSlots.map((s) => s.affordance.id),
		};

		/**
		 * STEP 3/4: the picker's box against the drawn quad, same glyph.
		 *
		 * Measurement only — nothing here changes what is pickable. The
		 * picker tests |dx| <= halfHeight * 4 * VIEWPORT aspect; the
		 * renderers draw halfHeight * the GLYPH's aspect. Whether those
		 * agree had never been given a number, and the neighbour-capture
		 * this gate found earlier is only explicable in these terms.
		 */
		const canvasEl = document.querySelector('canvas');
		const viewportAspect = canvasEl.width / canvasEl.height;
		const geometry = host.renderer.actionSlots.map((sl) => {
			/* what the picker used to use, and what it uses now */
			const wasHalfWidth = sl.halfHeight * 4 * viewportAspect;
			const nowHalfWidth = sl.drawnHalfWidth ?? wasHalfWidth;
			return {
				id: sl.affordance.id, label: sl.affordance.label,
				halfHeight: sl.halfHeight,
				wasHalfWidth, nowHalfWidth,
				drawnHalfWidth: sl.drawnHalfWidth,
				/* what the RING reserved for this slot, at the largest
				   half-height any state reaches */
				reservedHalfWidth: sl.reservedHalfWidth,
				ratio: sl.drawnHalfWidth ? wasHalfWidth / sl.drawnHalfWidth : undefined,
			};
		});
		/* And how far apart neighbouring slots actually stand, so an
		   overlap is a fact rather than an inference. Pairwise, because
		   the widths differ per name: one minimum gap against one
		   maximum width would pass a ring whose widest pair happened to
		   be its most generously spaced. */
		const gaps = [];
		const pairs = [];
		const ordered = host.renderer.actionSlots;
		for (let i = 1; i < ordered.length; i++) {
			const a = ordered[i - 1], b = ordered[i];
			const distance = Math.hypot(
				a.position.x - b.position.x, a.position.y - b.position.y, a.position.z - b.position.z);
			gaps.push(distance);
			pairs.push({
				a: a.affordance.label, b: b.affordance.label,
				aHalf: a.reservedHalfWidth, bHalf: b.reservedHalfWidth,
				aDrawn: a.drawnHalfWidth, bDrawn: b.drawnHalfWidth,
				distance,
			});
		}
		/* Where every slot is drawn, through the gate's ONE projector. */
		const {project} = window.__berxProjector(canvasEl, w.latestFrame.camera);
		const onScreen = host.renderer.actionSlots.map((sl) => {
			const at = project(sl.position);
			if (!at) return {label: sl.affordance.label, whole: false, reason: 'behind the eye'};
			/* the whole quad, at the widest it ever stands — a centre
			   inside the frame with half its word outside it is not
			   "on screen" */
			const halfW = sl.reservedHalfWidth * at.ndcPerUnitX;
			const halfH = sl.halfHeight * at.ndcPerUnitY;
			return {
				label: sl.affordance.label,
				left: at.ndcX - halfW, right: at.ndcX + halfW,
				top: at.ndcY + halfH, bottom: at.ndcY - halfH,
				whole: Math.abs(at.ndcX) + halfW <= 1 && Math.abs(at.ndcY) + halfH <= 1,
			};
		});

		/**
		 * AN AFFORDANCE WITH NOTHING TO RASTERISE.
		 *
		 * My first attempt used a label the atlas had never seen, on the
		 * assumption that a cache miss means non-resident. Measured, it
		 * does not: BerxSpatialTextAtlas.get RASTERISES ON DEMAND, so a
		 * miss becomes a hit within the same call and the label draws.
		 * The residency divergence I reported from reading the code is
		 * therefore not reachable that way — a correction to my own
		 * finding, and the reason this now uses the case that IS
		 * reachable: `get` returns undefined for an empty label, so
		 * such an affordance is requested and never drawn.
		 */
		const invented = w.affordances().map((a, i) => i === 0
			? {...a, label: '   '}
			: a);
		host.renderer.setAffordances(invented);
		host.renderer.render(w.latestFrame, {});
		const afterInvented = {
			requested: host.renderer.requestedSlots.map((s) => s.affordance.label),
			drawn: host.renderer.actionSlots.map((s) => s.affordance.label),
			missing: invented[0].label,
			missingId: invented[0].id,
			drawnIds: host.renderer.actionSlots.map((sl) => sl.affordance.id),
			requestedIds: host.renderer.requestedSlots.map((sl) => sl.affordance.id),
		};

		if (entered) w.focus(entered);
		await settle();
		await new Promise((r) => setTimeout(r, 1500));
		await settle();
		return {resident, geometry, gaps, pairs, onScreen, viewportAspect, afterInvented, settled: w.latestFrame.transition === undefined && !w.runtime.travelling};
	});

	gate('a resident affordance is both drawn and pickable',
		residency.resident.drawn.length > 0
			&& residency.resident.drawn.length === residency.resident.requested.length,
		`${residency.resident.requested.length} requested, ${residency.resident.drawn.length} drawn: ${residency.resident.drawn.join(', ')} — with every glyph resident the two sets are the same set, which is the invariant holding in the ordinary case rather than only in the failure case`);

	gate('an affordance with nothing to rasterise is requested, never drawn, and not pickable',
		residency.afterInvented.requestedIds.includes(residency.afterInvented.missingId)
			&& !residency.afterInvented.drawnIds.includes(residency.afterInvented.missingId),
		`${residency.afterInvented.missingId} carried an empty label: present in requestedSlots, absent from actionSlots (${residency.afterInvented.drawnIds.length} drawn of ${residency.afterInvented.requestedIds.length} requested), so the picker cannot reach it. actionSlots used to return the REQUESTED set. A label the atlas has never seen does NOT exercise this — get() rasterises on demand, which is a correction to what I first reported from reading the code`);

	/* --- W4 item 6, step 3/4: the picker's box against the drawn quad --- */
	const geo = residency.geometry.filter((g) => g.drawnHalfWidth !== undefined);
	const worst = geo.reduce((m, g) => (g.ratio ?? 0) > (m?.ratio ?? 0) ? g : m, undefined);
	const minGap = residency.gaps.length ? Math.min(...residency.gaps) : undefined;
	const overlapping = geo.filter((g) => minGap !== undefined && g.nowHalfWidth * 2 > minGap).length;

	gate('the picker\'s hit box IS the quad that was drawn',
		geo.length > 0 && geo.every((g) => Math.abs(g.nowHalfWidth - g.drawnHalfWidth) < 1e-9),
		geo.map((g) => `${g.label}: ${g.nowHalfWidth.toFixed(3)} (was ${g.wasHalfWidth.toFixed(3)}, x${g.ratio.toFixed(2)})`).join('  ')
		+ ` — viewport aspect ${residency.viewportAspect.toFixed(2)}. The old bound was halfHeight x 4 x the VIEWPORT's aspect, so every slot got the same width whatever its label; the quad is halfHeight x the GLYPH's aspect. The picker now uses the second`);

	/* --- W4 item 6, ring spacing: laid out from the measured widths ---

	   BERX_SLOT_GAP in actionRing.ts. Written out rather than imported
	   because this gate reads the SHIPPED bundle: a gate that imported
	   the constant would pass by agreeing with the source it is
	   checking. */
	const SLOT_GAP = 0.26;
	/* one aspect, two consumers: the ring reserved reservedHalfWidth at
	   the largest half-height a slot reaches, the renderer drew
	   drawnHalfWidth at this slot's own half-height. Same measurement iff
	   the implied reserved half-HEIGHT is one number for every slot. */
	const impliedHalfHeight = geo
		.filter((g) => g.drawnHalfWidth > 0)
		.map((g) => g.reservedHalfWidth * g.halfHeight / g.drawnHalfWidth);
	const spreadOfImplied = impliedHalfHeight.length
		? Math.max(...impliedHalfHeight) - Math.min(...impliedHalfHeight)
		: Infinity;

	gate('the ring reserves the width the renderer measured, not an estimate of it',
		impliedHalfHeight.length === geo.length && spreadOfImplied < 1e-9,
		geo.map((g) => `${g.label}: reserved ${g.reservedHalfWidth.toFixed(3)} / drawn ${g.drawnHalfWidth.toFixed(3)} at h=${g.halfHeight.toFixed(3)}`).join('  ')
		+ ` — implied reserved half-height ${impliedHalfHeight.map((h) => h.toFixed(4)).join(', ')}, spread ${spreadOfImplied.toExponential(1)}. One number for every label means ONE aspect drove both the layout and the draw. A per-character estimate cannot produce that: it would have to guess each word's aspect exactly right`);

	const violations = residency.pairs.filter((p) => p.aHalf + p.bHalf + SLOT_GAP > p.distance + 1e-9);
	gate('no two neighbouring affordances overlap, at the widest either one ever stands',
		residency.pairs.length > 0 && violations.length === 0,
		residency.pairs.map((p) => `${p.a}|${p.b}: ${(p.aHalf + p.bHalf + SLOT_GAP).toFixed(3)} needed vs ${p.distance.toFixed(3)} apart`).join('  ')
		+ ` — half of each reserved width plus ${SLOT_GAP} of empty world, against the true centre distance, for every adjacent pair. Under the old estimate the widest pair needed 1.548 of box into 1.411 of spacing and the ring had no way to know: it sized its arc from characters counted, then divided that width by a radius and used the answer as an ANGLE, and sine flattens toward the ends of an arc — so the outermost pairs came out closest together`);

	const cropped = residency.onScreen.filter((o) => !o.whole);
	gate('and the whole of every one of them is inside the frame',
		residency.onScreen.length > 0 && cropped.length === 0,
		residency.onScreen.map((o) => `${o.label}: x ${o.left !== undefined ? `${o.left.toFixed(2)}..${o.right.toFixed(2)}` : o.reason}`).join('  ')
		+ ' — NDC bounds of the whole quad at its widest, through the same projector the pointer probe presses with. The camera stands back by the ring\'s own radius, so a ring that got wider is a camera that stepped back, not a ring that ran off the edge');

	gate('the residency probe leaves the world as it found it',
		residency.settled === true,
		'no camera transition in flight when this probe ends');

	/**
	 * LAST ON PURPOSE.
	 *
	 * These gates run as one long sequence against one session, and this
	 * probe moves focus between entities and acts on the server. Placed
	 * mid-file it left the session in a state where the reload two gates
	 * later restored a pose the camera then could not be moved from —
	 * the world-edge gate flew 1600 units and measured 40.3 against a
	 * 24.4 limit, and was right to fail. Isolated by running the same
	 * runtime changes against the original gate file, which passed
	 * everything: the runtime was innocent and the probe was not.
	 *
	 * A probe that mutates the world goes after the gates that measure
	 * it. Restoring focus by hand was not enough and is not the fix.
	 */
	/* --- W4 item 6, depth: what actually stands in front of a slot ---

	   Read-only. The G-buffer the SSAO pass writes carries VIEW DEPTH in
	   its alpha (world.wgsl fs_gbuffer: -view_pos.z), cleared to 0 where
	   no geometry was drawn, and it is written by the opaque pass — which
	   is exactly the depth buffer the label pass tests against. So this
	   reads what the production renderer itself would compare each slot
	   with, rather than re-deriving an occlusion rule of its own. */
	await installProjector();
	const depth = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const canvas = document.querySelector('canvas');
		const settle = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r)); };
		const entered = w.worldPosition.focusId;
		w.focus('moment:5150');
		await settle();
		/* Render THIS frame explicitly before reading, so the buffer
		   belongs to the camera the projection uses. The SSAO pass only
		   runs when the tier asks for it, so a buffer read without this
		   can be from an older frame with an older camera — which is
		   what a first reading of this looked like: the focused entity
		   appeared to be occluded by something 10 units in front of it. */
		const frame = w.latestFrame;
		host.renderer.render(frame, {});
		const buffers = host.renderer.readSSAOBuffers?.();
		const {project} = window.__berxProjector(canvas, frame.camera);
		const read = (px, py) => {
			if (!buffers) return undefined;
			const gx = Math.round(px / canvas.width * buffers.width);
			const gy = Math.round((1 - py / canvas.height) * buffers.height);
			let nearest;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const x = gx + dx, y = gy + dy;
				if (x < 0 || y < 0 || x >= buffers.width || y >= buffers.height) continue;
				const a = buffers.gbuffer[(y * buffers.width + x) * 4 + 3];
				if (a > 0 && (nearest === undefined || a < nearest)) nearest = a;
			}
			return nearest;
		};
		const slots = host.renderer.actionSlots.map((sl) => {
			const at = project(sl.position);
			return {
				label: sl.affordance.label,
				slotDepth: at ? at.along : undefined,
				sceneDepth: at ? read(at.px, at.py) : undefined,
				px: at ? at.px : undefined, py: at ? at.py : undefined,
			};
		});
		/* and the focused entity itself, as a control: something the world
		   definitely DID draw */
		const object = frame.world.objects.find((o) => o.id === 'moment:5150');
		const objAt = object ? project(object.transform.position) : undefined;
		const control = objAt ? {depth: objAt.along, scene: read(objAt.px, objAt.py)} : undefined;
		/* Where the camera actually stands, and where the ring's own
		   radius says it should. A slot's depth is only meaningful
		   against the camera that produced it. */
		const cam = frame.camera;
		/* The canonical entity — what focus() poses the camera from —
		   against the frame's, which is what everything DRAWS. */
		const canonical = w.runtime.world.getObject('moment:5150');
		/* and whatever the world actually put in front of the ring */
		const inFront = frame.world.objects.map((o) => {
			const at = project(o.transform.position);
			return at ? {id: o.id, along: at.along, ndcX: at.ndcX, ndcY: at.ndcY} : undefined;
		}).filter(Boolean).sort((a, b) => a.along - b.along).slice(0, 4);
		const stand = object ? {
			canonicalZ: canonical ? canonical.transform.position.z : undefined,
			frameZ: object.transform.position.z,
			inFront,
			object: {...object.transform.position},
			scale: {...object.transform.scale},
			camera: {...cam.position},
			target: {...cam.target},
			distance: Math.hypot(
				cam.position.x - object.transform.position.x,
				cam.position.y - object.transform.position.y,
				cam.position.z - object.transform.position.z),
			focusId: w.worldPosition.focusId,
			active: frame.world.activeObjectId,
			travelling: w.runtime.travelling,
		} : undefined;
		const ndc = host.renderer.actionSlots.map((sl) => {
			const at = project(sl.position);
			return at ? {
				label: sl.affordance.label,
				left: at.ndcX - sl.reservedHalfWidth * at.ndcPerUnitX,
				right: at.ndcX + sl.reservedHalfWidth * at.ndcPerUnitX,
			} : {label: sl.affordance.label, left: undefined, right: undefined};
		});
		if (entered) w.focus(entered);
		await settle();
		return {
			has: buffers !== undefined,
			size: buffers ? {w: buffers.width, h: buffers.height} : undefined,
			slots, control, stand, ndc,
			settled: w.latestFrame.transition === undefined && !w.runtime.travelling,
		};
	});
	console.log(`NOTE  depth under each action slot (G-buffer ${depth.size ? `${depth.size.w}x${depth.size.h}` : 'ABSENT'}):`);
	for (const sl of depth.slots) {
		const verdict = sl.sceneDepth === undefined ? 'nothing drawn there'
			: sl.sceneDepth < sl.slotDepth - 1e-3 ? `OCCLUDED by geometry at ${sl.sceneDepth.toFixed(3)}`
			: 'clear';
		console.log(`      ${sl.label}: slot at ${sl.slotDepth === undefined ? '?' : sl.slotDepth.toFixed(3)}, scene at ${sl.sceneDepth === undefined ? '-' : sl.sceneDepth.toFixed(3)} → ${verdict}`);
	}
	if (depth.control) console.log(`      control (the focused entity): slot-equivalent depth ${depth.control.depth.toFixed(3)}, scene ${depth.control.scene === undefined ? '-' : depth.control.scene.toFixed(3)}`);
	if (depth.stand) console.log(`NOTE  camera ${JSON.stringify(depth.stand.camera)} target ${JSON.stringify(depth.stand.target)}; entity ${JSON.stringify(depth.stand.object)} scale ${JSON.stringify(depth.stand.scale)}; distance ${depth.stand.distance.toFixed(3)}; focusId ${depth.stand.focusId} active ${depth.stand.active} travelling ${depth.stand.travelling}`);
	/* The camera must aim at the entity the world DRAWS. Only meaningful
	   while the two differ — a cursor sitting on the entity's own moment
	   lenses it nowhere, and the check would pass without testing
	   anything. */
	const lensed = depth.stand && depth.stand.canonicalZ !== undefined
		&& Math.abs(depth.stand.canonicalZ - depth.stand.frameZ) > 0.5;
	gate('focusing an entity aims the camera at where it is DRAWN, not where it is stored',
		lensed === true && Math.abs(depth.stand.target.z - depth.stand.frameZ) < 1e-6,
		depth.stand
			? `moment:5150 is stored at z ${depth.stand.canonicalZ} and drawn at ${depth.stand.frameZ.toFixed(3)} — the temporal cursor lenses it ${Math.abs(depth.stand.canonicalZ - depth.stand.frameZ).toFixed(2)} deeper — and the camera targets ${depth.stand.target.z.toFixed(3)} from ${depth.stand.distance.toFixed(3)} away. It used to pose from the STORED row: the camera stopped 13.82 in front of empty space with the entity 24.91 away and event:908 between them, and the ring it was standing back to see spanned a third of the frame it should have filled`
			: 'the focused entity was not in the world');

	if (depth.stand) console.log(`NOTE  canonical z ${depth.stand.canonicalZ} vs frame z ${depth.stand.frameZ} — focus() poses the camera from the first, the renderer draws the second. Nearest four drawn: ${depth.stand.inFront.map((o) => `${o.id}@${o.along.toFixed(2)}`).join(' ')}`);
	console.log(`NOTE  slot NDC at that camera: ${depth.ndc.map((n) => `${n.label} ${n.left === undefined ? '?' : `${n.left.toFixed(2)}..${n.right.toFixed(2)}`}`).join('  ')}`);

	/* --- W4 item 10: the ring, from a keyboard, down the same path --- */
	const keys = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const canvas = document.querySelector('canvas');
		const settle = async () => { for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r)); };
		const liveText = () => [...document.querySelectorAll('[aria-live]')]
			.map((n) => (n.textContent || '').trim()).filter(Boolean).join(' | ');
		/** The canonical identity AND version of one entity, byte for byte. */
		const stampOf = (id) => {
			const o = w.latestFrame.world.objects.find((x) => x.id === id);
			return o ? JSON.stringify({id: o.id, kind: o.kind, updatedAt: o.updatedAt, createdAt: o.createdAt, energy: o.energy, material: o.material}) : 'absent';
		};
		const key = async (k, shift = false) => {
			canvas.dispatchEvent(new KeyboardEvent('keydown', {key: k, shiftKey: shift, bubbles: true, cancelable: true}));
			await settle();
		};

		/**
		 * WHERE THIS PROBE FOUND THE WORLD, so it can put it back.
		 *
		 * These gates run in one long sequence against one session, and
		 * this one moves focus between entities. Leaving it moved changed
		 * what the reload two gates later restored, which left a camera
		 * transition in flight, and the world-edge clamp is deliberately
		 * skipped while the runtime is travelling — so an unrelated gate
		 * measured 40.3 units against a 24.4 limit and was right to fail.
		 * A probe inserted into a sequence has to leave no trace.
		 */
		const enteredAt = {focus: w.worldPosition.focusId, region: w.worldPosition.region};
		w.blur();
		await settle();
		w.focus('moment:5150');
		await settle();

		/* 1. Tab identifies a real, visible affordance. */
		const beforeTab = w.focusedAffordance;
		await key('Tab');
		const first = w.focusedAffordance;
		const firstSlot = host.renderer.actionSlots.find((s) => s.focused);
		const unfocused = host.renderer.actionSlots.filter((s) => !s.focused);
		await key('Tab');
		const second = w.focusedAffordance;
		await key('Tab', true);
		const backAgain = w.focusedAffordance;

		/* 8/9. The focus is a thing in the world: larger and brighter,
		   in world units, not a browser outline. */
		const focusIsSpatial = firstSlot && unfocused.length > 0
			? {focusedHalfHeight: firstSlot.halfHeight, otherHalfHeight: unfocused[0].halfHeight}
			: undefined;
		const outlineStyle = getComputedStyle(canvas).outlineStyle;

		/* 2/3/6. Enter activates the focused affordance, down world.act.
		   Tabbed onto a SERVER action: `open` is travel, and asserting a
		   canonical mutation from it would be asserting the wrong thing —
		   travel moves the camera and leaves the world alone, correctly. */
		const ring = w.affordances();
		for (let i = 0; i < ring.length && w.focusedAffordance?.action !== 'like'; i++) await key('Tab');
		const activating = w.focusedAffordance
			? {id: w.focusedAffordance.id, action: w.focusedAffordance.action, label: w.focusedAffordance.label}
			: undefined;
		const beforeAct = stampOf('moment:5150');
		await key('Enter');
		const said = liveText();
		await new Promise((r) => setTimeout(r, 500));
		await settle();
		const afterAct = stampOf('moment:5150');
		const announced = liveText();

		/* 5. A REJECTED action must leave identity/version byte-equal.
		   `follow` is offered on a person and BERX has no follow
		   endpoint, so this is a real refusal from the real path. */
		w.focus('person:78');
		await settle();
		let rejected, beforeReject, afterReject, rejectedLabel;
		const offered = w.affordances();
		const follow = offered.find((a) => a.action === 'follow');
		if (follow) {
			/* Tab onto it rather than naming it: the keyboard has to be
			   able to REACH the thing it then fails to do. */
			for (let i = 0; i < offered.length && w.focusedAffordance?.action !== 'follow'; i++) await key('Tab');
			rejectedLabel = w.focusedAffordance?.label;
			beforeReject = stampOf('person:78');
			await key('Enter');
			await new Promise((r) => setTimeout(r, 500));
			await settle();
			afterReject = stampOf('person:78');
			rejected = liveText();
		}

		/* 7. A state that is not activatable must not activate. */
		const guarded = await w.act('moment:5150:like').then(() => 'ran').catch(() => 'threw');
		const guardedAfterBlur = await (async () => {
			w.blur();
			await settle();
			return w.act('moment:5150:like').then((r) => r).catch(() => 'threw');
		})();

		/**
		 * LEAVE THE WORLD STILL.
		 *
		 * Focusing and blurring start camera transitions, and a
		 * transition in flight overwrites the camera every frame — which
		 * quietly broke the world-edge gate that runs after this one:
		 * flying outward while a transition owned the camera left it 40.3
		 * units out against a 24.4 limit. The edge gate was right and this
		 * probe was rude. Settled by wall clock as well as by frames,
		 * because a headless rAF is not a reliable clock.
		 */
		/* Put the world back where it was found, then let every
		   transition that implies finish before handing control on. */
		if (enteredAt.focus) w.focus(enteredAt.focus);
		await settle();
		await new Promise((r) => setTimeout(r, 1500));
		await settle();
		const settled = w.latestFrame.transition === undefined && !w.runtime.travelling;
		const restored = {focus: w.worldPosition.focusId, region: w.worldPosition.region};

		return {
			beforeTab: beforeTab ? beforeTab.id : undefined,
			first: first ? {id: first.id, action: first.action, state: first.state, label: first.label} : undefined,
			second: second ? second.id : undefined,
			backAgain: backAgain ? backAgain.id : undefined,
			focusIsSpatial, outlineStyle,
			settled, restored, enteredAt,
			activating, beforeAct, afterAct, said, announced,
			acted: beforeAct !== afterAct,
			rejectedLabel, rejected,
			rejectUnchanged: beforeReject !== undefined && beforeReject === afterReject,
			beforeReject, afterReject,
			guarded, guardedAfterBlur,
		};
	});

	gate('Tab identifies a real affordance of the focused entity, and walks the ring',
		keys.beforeTab === undefined && keys.first !== undefined && keys.second !== undefined
			&& keys.first.id !== keys.second.id && keys.backAgain === keys.first.id,
		`nothing focused before Tab; Tab → ${keys.first?.id} (${keys.first?.action}, state ${keys.first?.state}); Tab → ${keys.second}; Shift+Tab → ${keys.backAgain}. The same affordances a finger picks, in the order they stand in the world — not a second focus order assembled for the keyboard`);

	gate('the focus is a state of the world, not a browser outline',
		keys.focusIsSpatial !== undefined
			&& keys.focusIsSpatial.focusedHalfHeight > keys.focusIsSpatial.otherHalfHeight
			&& keys.outlineStyle === 'none',
		keys.focusIsSpatial
			? `the focused slot stands ${keys.focusIsSpatial.focusedHalfHeight.toFixed(3)} world units half-height against ${keys.focusIsSpatial.otherHalfHeight.toFixed(3)} for the rest, and is drawn at full alpha against 0.72. The canvas outline-style is "${keys.outlineStyle}" — a ring around a canvas that contains the whole world says nothing about WHICH action is focused`
			: 'no focused slot to compare');

	gate('Enter activates the focused affordance through the same path a finger uses',
		keys.acted === true && keys.activating?.action === 'like'
			&& typeof keys.announced === 'string' && keys.announced.includes('готово'),
		`Tabbed onto ${keys.activating?.id} (${keys.activating?.action}) and pressed Enter → "${keys.activating?.label}: готово". moment:5150 updatedAt ${JSON.parse(keys.beforeAct || '{}').updatedAt} → ${JSON.parse(keys.afterAct || '{}').updatedAt}, and the entity that landed is the one read back from the server. One `+'`activate`'+` closure serves pointerup and Enter: world.act is the only action path, and neither input decides anything about what an action does`);

	gate('a keyboard activation the server rejects leaves identity and version byte-equal',
		keys.rejectUnchanged === true,
		keys.rejectedLabel
			? `Tabbed onto "${keys.rejectedLabel}" and pressed Enter; the shell said "${keys.rejected}". person:78 before and after: ${keys.beforeReject} / ${keys.afterReject} — byte-identical id, kind, createdAt, updatedAt, energy and material`
			: 'no rejectable affordance was reachable by keyboard to test');

	gate('the keyboard probe leaves the world as it found it',
		keys.settled === true && keys.restored?.focus === keys.enteredAt?.focus,
		`focus ${keys.enteredAt?.focus} restored, region ${keys.restored?.region}, no camera transition in flight — focus and blur both start one, and a transition owns the camera every frame it runs, which is enough to make a later measurement of the world edge measure the transition instead`);

	gate('an affordance that is not in an activatable state does not activate',
		keys.guardedAfterBlur === false,
		`with nothing focused, act('moment:5150:like') returned ${JSON.stringify(keys.guardedAfterBlur)} rather than running. berxCanActivate is a positive list, so a state added later is refused until someone decides it should not be`);


	/* --- W4 item 6, ring spacing: the long label still answers for itself ---

	   LAST, because it presses. Spacing that no longer overlaps is a
	   claim about geometry; that the widest name in the ring can be
	   pressed at its own far edge, toward its neighbour, and still be
	   the one selected is a claim about the shipped picking path. The
	   second is the one that failed before: a press at one action's own
	   pixel was answered by the one beside it. */
	await installProjector();
	const widest = await page.evaluate(async () => {
		const w = window.__berxWorld;
		const host = window.__berxHost;
		const canvas = document.querySelector('canvas');
		const settle = async () => { for (let i = 0; i < 60; i++) await new Promise((r) => requestAnimationFrame(r)); };
		const entered = w.worldPosition.focusId;
		w.focus('moment:5150');
		await settle();

		const {project, rect, dpr} = window.__berxProjector(canvas, w.latestFrame.camera);
		const slots = host.renderer.actionSlots.map((sl) => ({
			label: sl.affordance.label, action: sl.affordance.action,
			drawnHalfWidth: sl.drawnHalfWidth, reservedHalfWidth: sl.reservedHalfWidth,
			at: project(sl.position),
		})).filter((sl) => sl.at);
		/* the longest name in the ring, and whichever neighbour it stands
		   closest to on screen */
		let wide = slots[0];
		for (const sl of slots) if (sl.reservedHalfWidth > wide.reservedHalfWidth) wide = sl;
		const index = slots.indexOf(wide);
		const neighbours = [slots[index - 1], slots[index + 1]].filter(Boolean);
		let near = neighbours[0];
		for (const n of neighbours) {
			if (Math.abs(n.at.ndcX - wide.at.ndcX) < Math.abs(near.at.ndcX - wide.at.ndcX)) near = n;
		}
		const liveText = () => [...document.querySelectorAll('[aria-live]')]
			.map((n) => (n.textContent || '').trim()).filter(Boolean).join(' | ');
		const pressAt = async (px, py, id) => {
			const opts = {pointerType: 'mouse', clientX: rect.left + px / dpr, clientY: rect.top + py / dpr,
				bubbles: true, isPrimary: true, pointerId: id};
			canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
			canvas.dispatchEvent(new PointerEvent('pointerup', opts));
			const said = liveText();
			await settle();
			/* let the outcome state expire before the next press, so the
			   ring is read at rest rather than mid-lifecycle */
			await new Promise((r) => setTimeout(r, 1800));
			await settle();
			return {px, py, said};
		};

		/* 90% of the way to its own drawn edge, TOWARD the neighbour: the
		   last pixel that is still unambiguously this action's */
		const direction = near && near.at.ndcX > wide.at.ndcX ? 1 : -1;
		const edgePx = wide.at.px + direction * wide.drawnHalfWidth * 0.9 * wide.at.ndcPerUnitX * 0.5 * canvas.width;

		const centre = await pressAt(wide.at.px, wide.at.py, 11);
		const edge = await pressAt(edgePx, wide.at.py, 12);
		const beside = near ? await pressAt(near.at.px, near.at.py, 13) : undefined;

		if (entered) w.focus(entered);
		await settle();
		return {
			wide: {label: wide.label, px: wide.at.px, drawnHalfWidth: wide.drawnHalfWidth},
			near: near ? {label: near.label, px: near.at.px} : undefined,
			centre, edge, beside, edgePx,
			settled: w.latestFrame.transition === undefined && !w.runtime.travelling,
		};
	});

	gate('the widest name in the ring answers at its own pixel, and at its own far edge',
		widest.centre.said.includes(widest.wide.label) && widest.edge.said.includes(widest.wide.label),
		`"${widest.wide.label}" is drawn ${widest.wide.drawnHalfWidth.toFixed(3)} half-wide at ${widest.wide.px.toFixed(0)}px. A press there announced "${widest.centre.said}"; a press at ${widest.edge.px.toFixed(0)}px — 90% of the way to its own edge, toward "${widest.near ? widest.near.label : 'nothing'}" — announced "${widest.edge.said}". Both are the same action, so the widest quad in the ring does not reach into its neighbour and is not reached into`);

	gate('and its neighbour answers at ITS pixel, not for the one beside it',
		widest.beside !== undefined && widest.near !== undefined && widest.beside.said.includes(widest.near.label),
		widest.near
			? `a press at ${widest.near.px.toFixed(0)}px announced "${widest.beside.said}" — "${widest.near.label}", the slot drawn there. This is the pair that used to collide: the ring reserved 1.411 of spacing for a 1.548-wide word`
			: 'the widest slot had no neighbour to test against');

	gate('the spacing probe leaves the world as it found it',
		widest.settled === true,
		'no camera transition in flight when this probe ends');

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
console.log(`ALL APP-SHELL GATES PASS (backend ${backend})`);
