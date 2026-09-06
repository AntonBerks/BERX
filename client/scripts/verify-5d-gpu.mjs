/**
 * The GPU world, verified in a real browser.
 *
 * Everything about the 5D renderer was until now asserted only by the
 * type checker: nothing ever created a WebGL2 context, drew a frame or
 * read a pixel back. So a sphere wound inside-out and a ring lying
 * flat could both sit in the codebase looking correct.
 *
 * These assertions run against the built runtime in headless Chromium
 * — a real WebGL2 context with a real 24-bit depth buffer — and read
 * real pixels back. Nothing here is measured from source code.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-gpu-'));

execFileSync(
	path.join(clientRoot, 'node_modules/.bin/esbuild'),
	[path.join(here, '5d-gpu.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`],
	{cwd: clientRoot, stdio: 'inherit'},
);

fs.writeFileSync(
	path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D GPU</title>
<style>html,body{margin:0;background:#07080A}#host{position:fixed;inset:0}</style></head>
<body><div id="host"><canvas id="world"></canvas></div><script type="module" src="./world.js"></script></body></html>`,
);

const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8'};
const server = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
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
	const page = await browser.newPage({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});
	const pageErrors = [];
	page.on('pageerror', (e) => pageErrors.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error') pageErrors.push(m.text());
	});
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_5D !== 'undefined');

	/* --- the context is real, and says what it really does --- */
	const context = await page.evaluate(() => {
		const canvas = document.getElementById('world');
		const host = window.BERX_5D.createBerx5DWebHost({canvas});
		window.__host = host;
		const gl = canvas.getContext('webgl2');
		return {
			kind: host.renderer.kind,
			capabilities: {...host.renderer.capabilities},
			depthBits: gl ? gl.getParameter(gl.DEPTH_BITS) : 0,
			depthTest: gl ? gl.isEnabled(gl.DEPTH_TEST) : false,
			cullFace: gl ? gl.isEnabled(gl.CULL_FACE) : false,
			role: canvas.getAttribute('role'),
			tabIndex: canvas.tabIndex,
			ariaHidden: canvas.getAttribute('aria-hidden'),
			liveRegions: document.querySelectorAll('[aria-live]').length,
		};
	});
	gate(
		'a real WebGL2 context with a real depth buffer',
		context.kind === 'webgl2' && context.depthBits >= 16 && context.depthTest && context.cullFace,
		`${context.depthBits}-bit depth, depth test ${context.depthTest}, back-face culling ${context.cullFace}`,
	);
	gate(
		'the renderer claims only what it implements',
		context.capabilities.perspective === true &&
			context.capabilities.depthBuffer === true &&
			context.capabilities.physicallyLitMaterials === true &&
			context.capabilities.shadows === false &&
			context.capabilities.postProcessing === false,
		JSON.stringify(context.capabilities),
	);
	gate(
		'the world is reachable by keyboard and announced',
		context.role === 'application' && context.tabIndex === 0 && context.ariaHidden === null && context.liveRegions >= 1,
		`role=${context.role} tabIndex=${context.tabIndex} aria-hidden=${context.ariaHidden} live regions=${context.liveRegions}`,
	);

	/* --- an empty world paints the ground colour, and only that --- */
	const empty = await page.evaluate(async () => {
		const host = window.__host;
		host.start();
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		host.stop();
		const canvas = host.canvas;
		const gl = canvas.getContext('webgl2');
		const px = new Uint8Array(4);
		gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
		return {px: [...px], width: canvas.width, height: canvas.height};
	});
	/* #07080A is 7,8,10; the clear colour is written as .027/.031/.039 */
	gate(
		'an empty world paints the BERX ground and nothing else',
		Math.abs(empty.px[0] - 7) <= 2 && Math.abs(empty.px[1] - 8) <= 2 && Math.abs(empty.px[2] - 10) <= 2,
		`centre pixel rgb(${empty.px.slice(0, 3).join(', ')}) on a ${empty.width}x${empty.height} backing store`,
	);

	/* --- real objects paint, and the near one wins the depth test ---
	   Two objects on the camera's axis, one behind the other, made of
	   very different DNA materials: a person is pearl (#F2F0EB), a
	   collection is graphite (#15191E). Whichever is nearer decides the
	   centre pixel, and the depth buffer is what decides that. */
	const depth = await page.evaluate(async () => {
		const host = window.__host;
		const {mapUserToSpatial, mapFeedItemToSpatial} = window.BERX_5D;
		const near = mapUserToSpatial(
			{guid: 1, username: 'a', fullname: 'A', email: '', icon_url: '', profile_url: '', time_created: 0},
			{position: {x: 0, y: 0, z: 2}},
		);
		/* a moment, not a place: a place is a portal, and the middle of a
		   portal is a hole — the centre pixel would read the background
		   through it and prove nothing about depth */
		const far = mapFeedItemToSpatial(
			{guid: 2, text: 'позади', owner_guid: 1, owner_username: 'a', time_created: 0},
			{position: {x: 0, y: 0, z: -4}},
		);
		host.addObject(far.object);
		host.addObject(near.object);
		const read = async () => {
			host.start();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			host.stop();
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(4);
			gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
			return [...px];
		};
		const withBoth = await read();
		/* and the pick a tap at the centre resolves to */
		const hit = host.renderer.pick(host.runtime.latestFrame, host.canvas.width / 2, host.canvas.height / 2);
		host.removeObject(near.object.id);
		const farOnly = await read();
		return {withBoth, farOnly, hit: hit?.objectId, nearId: near.object.id, farId: far.object.id};
	});
	const brightness = (px) => px[0] + px[1] + px[2];
	gate(
		'real objects are drawn, not an empty canvas',
		brightness(depth.withBoth) > 25 + 7 + 8 + 10,
		`centre pixel rgb(${depth.withBoth.slice(0, 3).join(', ')}) with a person in front of the camera`,
	);
	gate(
		'the depth buffer decides what you see',
		brightness(depth.withBoth) > brightness(depth.farOnly),
		`near pearl person rgb(${depth.withBoth.slice(0, 3).join(', ')}) occludes the far mist moment rgb(${depth.farOnly.slice(0, 3).join(', ')})`,
	);
	gate(
		'a tap picks the object in front, not the one behind it',
		depth.hit === depth.nearId,
		`picked ${depth.hit ?? 'nothing'}, expected ${depth.nearId} (behind it: ${depth.farId})`,
	);

	/* --- energy is what emits, and only what the server made live --- */
	const energy = await page.evaluate(async () => {
		const host = window.__host;
		const {mapNearbyPlaceToSpatial} = window.BERX_5D;
		const now = Date.now();
		const quiet = {guid: 30, title: 'Q', category: null, cover_url: null, distance_km: 1, moments: [], is_open_now: null};
		const live = {...quiet, guid: 31, moments: [{id: 1, text: 'сейчас', ends_at: Math.floor(now / 1000) + 600}]};
		const read = async (item) => {
			for (const o of host.runtime.latestFrame.world.objects) host.removeObject(o.id);
			const mapped = mapNearbyPlaceToSpatial(item, now, {position: {x: 0, y: 0, z: 2}});
			host.addObject(mapped.object);
			host.start();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			host.stop();
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			/* the whole frame, not one pixel: a place is a portal and the
			   centre of a portal is a hole. Emission is a small addition
			   spread over the whole form, so it shows up in the totals. */
			let r = 0, g = 0, b = 0;
			for (let i = 0; i < px.length; i += 4) {
				r += px[i];
				g += px[i + 1];
				b += px[i + 2];
			}
			return [r, g, b];
		};
		return {quiet: await read(quiet), live: await read(live)};
	});
	gate(
		'a live place emits BERX Energy and a quiet one emits none',
		energy.live[2] > energy.quiet[2] && energy.live[1] > energy.quiet[1] && energy.live[2] - energy.quiet[2] > energy.live[0] - energy.quiet[0],
		`summed frame: live (${energy.live.join(', ')}) vs quiet (${energy.quiet.join(', ')}) — the same place, one with a moment still running; the gain is cyan-weighted`,
	);

	/* --- resize keeps the world round --- */
	const resize = await page.evaluate(async () => {
		const host = window.__host;
		const {mapUserToSpatial} = window.BERX_5D;
		for (const o of host.runtime.latestFrame.world.objects) host.removeObject(o.id);
		/* no label on this one: the measurement below is the bounding box
		   of lit pixels, and a name standing above the orb is real
		   geometry that would be measured as part of it */
		const orb = mapUserToSpatial({guid: 9, username: 'r', fullname: 'R', email: '', icon_url: '', profile_url: '', time_created: 0}, {position: {x: 0, y: 0, z: 2}}).object;
		host.addObject({...orb, label: undefined});
		const measure = async (w, h) => {
			document.getElementById('host').style.width = `${w}px`;
			document.getElementById('host').style.height = `${h}px`;
			/* the ResizeObserver reports on its own; give it real frames */
			for (let i = 0; i < 8; i++) await new Promise((r) => requestAnimationFrame(r));
			host.start();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			host.stop();
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			let minX = canvas.width, maxX = -1, minY = canvas.height, maxY = -1;
			for (let y = 0; y < canvas.height; y++) {
				for (let x = 0; x < canvas.width; x++) {
					const o = (y * canvas.width + x) * 4;
					if (px[o] + px[o + 1] + px[o + 2] > 60) {
						if (x < minX) minX = x;
						if (x > maxX) maxX = x;
						if (y < minY) minY = y;
						if (y > maxY) maxY = y;
					}
				}
			}
			return {w: canvas.width, h: canvas.height, spanX: maxX - minX + 1, spanY: maxY - minY + 1};
		};
		return {square: await measure(600, 600), wide: await measure(1000, 500)};
	});
	const roundness = (m) => (m.spanX > 0 && m.spanY > 0 ? m.spanX / m.spanY : 0);
	gate(
		'the backing store follows the element, and the projection stays square',
		resize.square.w === 600 && resize.wide.w === 1000 && resize.wide.h === 500 &&
			Math.abs(roundness(resize.square) - 1) < 0.12 && Math.abs(roundness(resize.wide) - 1) < 0.12,
		`square ${resize.square.w}x${resize.square.h} orb ${resize.square.spanX}x${resize.square.spanY}; wide ${resize.wide.w}x${resize.wide.h} orb ${resize.wide.spanX}x${resize.wide.spanY}`,
	);

	/* --- names stand in the world, and are occluded like everything else --- */
	const labels = await page.evaluate(async () => {
		const host = window.__host;
		const {mapUserToSpatial} = window.BERX_5D;
		const draw = async () => {
			host.start();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			host.stop();
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			/* the top strip, above where the orb itself is drawn: only a
			   label can put lit pixels there */
			let lit = 0;
			const from = Math.floor(canvas.height * 0.62);
			for (let y = from; y < canvas.height; y++) {
				for (let x = 0; x < canvas.width; x++) {
					const o = (y * canvas.width + x) * 4;
					if (px[o] + px[o + 1] + px[o + 2] > 90) lit++;
				}
			}
			return lit;
		};
		for (const o of host.runtime.latestFrame.world.objects) host.removeObject(o.id);
		const person = mapUserToSpatial({guid: 42, username: 'nn', fullname: 'Ирина Соколова', email: '', icon_url: '', profile_url: '', time_created: 0}, {position: {x: 0, y: 0, z: 2}}).object;
		host.addObject({...person, label: undefined});
		const withoutLabel = await draw();
		host.removeObject(person.id);
		host.addObject(person);
		const withLabel = await draw();
		/* the same person pushed far away: the name fades out rather than
		   growing to stay readable, which is what makes it a world */
		host.removeObject(person.id);
		host.addObject({...person, transform: {...person.transform, position: {x: 0, y: 0, z: -40}}});
		const farAway = await draw();
		return {withoutLabel, withLabel, farAway, resident: host.renderer.residentLabelCount};
	});
	gate(
		'names are drawn in the world, and recede out of it',
		labels.withLabel > labels.withoutLabel && labels.farAway <= labels.withoutLabel && labels.resident > 0,
		`lit pixels above the entity: ${labels.withoutLabel} unnamed, ${labels.withLabel} named, ${labels.farAway} at 40 units away; ${labels.resident} label textures resident`,
	);

	/* --- textures: real files, a real budget, really freed ---
	   The images below are data: URIs generated here. That is not fake
	   media standing in for a server's: nothing claims they came from
	   BERX. They exist to make the cache do real GL work — decode,
	   upload, evict — which is the only way to check that it frees
	   anything. */
	const textures = await page.evaluate(async () => {
		const host = window.BERX_5D.createBerx5DWebHost({canvas: document.createElement('canvas'), textureBudget: 2});
		const {mapUserToSpatial} = window.BERX_5D;
		const swatch = (hex) => {
			const c = document.createElement('canvas');
			c.width = c.height = 8;
			const ctx = c.getContext('2d');
			ctx.fillStyle = hex;
			ctx.fillRect(0, 0, 8, 8);
			return c.toDataURL('image/png');
		};
		const uris = ['#ff0000', '#00ff00', '#0000ff'].map(swatch);
		uris.forEach((uri, i) => {
			const mapped = mapUserToSpatial({guid: 100 + i, username: `u${i}`, fullname: `U${i}`, email: '', icon_url: uri, profile_url: '', time_created: 0}, {position: {x: i * 2 - 2, y: 0, z: 1}});
			host.addObject(mapped.object, mapped.media);
		});
		host.start();
		/* enough frames for three decodes to land and eviction to run */
		for (let i = 0; i < 90; i++) await new Promise((r) => requestAnimationFrame(r));
		host.stop();
		const resident = host.renderer.residentTextureCount;
		host.destroy();
		return {resident, afterDestroy: host.renderer.residentTextureCount};
	});
	gate(
		'the texture cache honours its budget and frees on dispose',
		textures.resident > 0 && textures.resident <= 2 && textures.afterDestroy === 0,
		`3 real images, budget 2: ${textures.resident} resident, ${textures.afterDestroy} after destroy`,
	);

	/* --- keyboard moves between objects in world space --- */
	const keyboard = await page.evaluate(async () => {
		const host = window.__host;
		const {mapUserToSpatial} = window.BERX_5D;
		for (const o of host.runtime.latestFrame.world.objects) host.removeObject(o.id);
		const left = mapUserToSpatial({guid: 201, username: 'l', fullname: 'Слева', email: '', icon_url: '', profile_url: '', time_created: 0}, {position: {x: -3, y: 0, z: 0}});
		const right = mapUserToSpatial({guid: 202, username: 'r', fullname: 'Справа', email: '', icon_url: '', profile_url: '', time_created: 0}, {position: {x: 3, y: 0, z: 0}});
		host.addObject(left.object);
		host.addObject(right.object);
		host.focus(left.object.id);
		host.canvas.focus();
		host.canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true}));
		const afterRight = host.runtime.world.getActiveObject()?.id;
		host.canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true, cancelable: true}));
		const afterLeft = host.runtime.world.getActiveObject()?.id;
		const announcement = document.querySelector('[aria-live]')?.textContent ?? '';
		return {afterRight, afterLeft, leftId: left.object.id, rightId: right.object.id, announcement};
	});
	gate(
		'arrow keys move focus to the neighbour in that direction, and say so',
		keyboard.afterRight === keyboard.rightId && keyboard.afterLeft === keyboard.leftId && keyboard.announcement.includes('Справа') === false && keyboard.announcement.length > 0,
		`right → ${keyboard.afterRight}, left → ${keyboard.afterLeft}; announced "${keyboard.announcement}"`,
	);

	/* --- reduced motion is a decision, not a measurement --- */
	const reduced = await page.evaluate(() => {
		const q = window.BERX_5D.resolveSpatialQuality;
		return {
			reduced: q({devicePixelRatio: 1, width: 1440, height: 900, reducedMotion: true, visibleObjectCount: 2}),
			normal: q({devicePixelRatio: 1, width: 1440, height: 900, reducedMotion: false, visibleObjectCount: 2}),
		};
	});
	gate(
		'reduced motion resolves the most conservative tier whatever the load',
		reduced.reduced.ambientMotion === false && reduced.reduced.quality === 'conservative' && reduced.normal.ambientMotion === true,
		`reduced: ${reduced.reduced.quality} ambient=${reduced.reduced.ambientMotion}; same load without it: ${reduced.normal.quality}`,
	);

	/* --- destroy leaves nothing behind --- */
	const destroyed = await page.evaluate(() => {
		const before = document.querySelectorAll('[aria-live]').length;
		window.__host.destroy();
		return {before, after: document.querySelectorAll('[aria-live]').length, contextAlive: window.__host.contextAlive};
	});
	gate(
		'destroy removes the live region it created',
		destroyed.after < destroyed.before,
		`${destroyed.before} live regions before, ${destroyed.after} after`,
	);

	gate('no page or console errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || 'clean');
} finally {
	await browser.close();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} 5D GPU GATES FAILED`);
	process.exit(1);
}
console.log('ALL 5D GPU GATES PASS');
