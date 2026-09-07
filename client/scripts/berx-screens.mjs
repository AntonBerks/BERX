#!/usr/bin/env node
/**
 * Photographs of BERX, taken from the running product.
 *
 * The same shell, the same bundle and the same API-shaped responses the
 * app-shell verification boots — driven instead to a set of real
 * moments and captured. Nothing here is a mockup or a render of a
 * design file: every pixel comes out of the world the product actually
 * draws.
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


const shots = process.argv[2] ?? path.join(clientRoot, 'docs/screens');
fs.mkdirSync(shots, {recursive: true});
const taken = [];

const browser = await launchChromium();
try {
	const context = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
	const page = await context.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));

	const settle = async (frames = 90) => {
		await page.evaluate(async (n) => {
			for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
		}, frames);
	};
	const shot = async (name, note) => {
		const file = path.join(shots, `${name}.png`);
		await page.screenshot({path: file});
		taken.push({name, note, file});
		console.log(`${name}  ${note}`);
	};

	await page.goto(base, {waitUntil: 'load'});
	await page.waitForSelector('#berx-entry', {timeout: 20000});
	await settle(20);
	await shot('01-entry', 'вход — единственная 2D-форма во всём продукте');

	await page.fill('#berx-entry input[name="username"]', 'ann');
	await page.fill('#berx-entry input[name="password"]', 'Berx-Verify-1');
	await page.click('#berx-entry button[type="submit"]');
	await page.waitForFunction(() => typeof window.__berxWorld !== 'undefined' && window.__berxWorld.latestFrame.world.objects.length > 0, undefined, {timeout: 25000});
	await settle(120);
	await shot('02-world-as-it-opens', 'мир сразу после входа — камера стоит там, куда её поставил мир');

	/* the whole world in one frame: the camera pulled back to the
	   bounds the world application itself reports, so nothing is
	   cropped and the layout can be seen for what it is */
	await page.evaluate(() => {
		const world = window.__berxWorld;
		const {centre, radius} = world.bounds;
		const center = centre;
		const distance = Math.max(6, radius * 2.4);
		world.runtime.camera.setState({
			position: {x: center.x + distance * 0.35, y: center.y + distance * 0.45, z: center.z + distance},
			target: {...center},
			rotation: {x: 0, y: 0, z: 0},
			fov: 46,
			near: 0.1,
			far: 400,
		});
	});
	await settle(90);
	await shot('03-world-whole', 'весь мир целиком — люди, места, события, моменты и связи между ними');

	await page.evaluate(() => window.__berxWorld.focus('person:77'));
	await settle(150);
	await shot('04-person-focus', 'человек в фокусе — камера подъехала, вокруг него кольцо действий');

	await page.evaluate(() => window.__berxWorld.travelTo('place:4211'));
	await settle(150);
	await shot('05-place', 'место — камера долетела внутрь, это не переход на экран');

	await page.evaluate(() => window.__berxWorld.focus('event:908'));
	await settle(120);
	await shot('06-event-now', 'событие идёт сейчас — BERX Energy горит только на живом');

	await page.evaluate(() => window.__berxWorld.scrubTime(-14 * 86400));
	await settle(150);
	await shot('07-time-past', 'время как измерение — две недели назад, мир ушёл в глубину');

	await page.evaluate(() => window.__berxWorld.live());
	await settle(150);
	await shot('08-time-now', 'обратно в NOW');

	await page.evaluate(() => window.__berxWorld.blur());
	await settle(60);
	await page.evaluate(() => {
		const host = window.__berxHost;
		host.renderer.render(window.__berxWorld.latestFrame, {stereo: {ipd: 0.063}});
	});
	await shot('09-stereo', 'стерео — тот же мир двумя глазами, для шлема');

	if (errors.length > 0) console.log(`page errors: ${errors.join(' | ')}`);
} finally {
	await browser.close();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log(`\n${taken.length} screens written to ${shots}`);
