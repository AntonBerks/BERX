#!/usr/bin/env node
/**
 * One world, seven ways of standing in it.
 *
 * These check that the platform boundary is real: that every target
 * declares what a build for it must provide, that a build failing
 * those requirements is refused by name rather than allowed to claim
 * the target, that framing differs by form while the world does not,
 * and that a stereo display draws the same world twice rather than
 * running a second product.
 *
 * The stereo half runs in a real browser and reads pixels, because
 * "renders twice" is not something source code can be trusted about.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {launchChromium} from './lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-platform-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

/* --- the targets themselves, in Node against the real core --- */
{
	const out = path.join(dir, 'targets.mjs');
	execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
		path.join(clientRoot, 'packages/spatial/src/index.ts'),
		'--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${out}`,
	], {cwd: clientRoot, stdio: 'inherit'});
	const core = await import(pathToFileURL(out).href);
	const {BERX_PLATFORM_TARGETS, berxPlatformSupported, berxPlatformGaps, berxFramingFor} = core;

	const forms = Object.keys(BERX_PLATFORM_TARGETS);
	gate(
		'every form BERX claims has a declared target',
		['watch', 'phone', 'tablet', 'desktop', 'ar', 'vr'].every((f) => forms.includes(f)),
		forms.join(', '),
	);

	/* a build that really can do what a target needs */
	const capable = (gpu) => ({
		gpu, depthBuffer: true, physicallyLitMaterials: true, shadows: false, postProcessing: false,
		spatialAudio: true, poseTracking: true, keyboard: true, pointer: true,
	});
	gate(
		'a real build is accepted for the forms its GPU serves',
		berxPlatformSupported('desktop', capable('webgl2')) &&
			berxPlatformSupported('vr', capable('vulkan')) &&
			berxPlatformSupported('phone', capable('metal')),
		'webgl2 → desktop, vulkan → vr, metal → phone',
	);

	/* and one that cannot is refused, with the reason named */
	const noPose = {...capable('webgl2'), poseTracking: false};
	const gaps = berxPlatformGaps('vr', noPose);
	gate(
		'a build that cannot meet a target is refused, by name',
		!berxPlatformSupported('vr', noPose) && gaps.length === 2 &&
			gaps.some((g) => g.includes('gpu webgl2')) && gaps.some((g) => g.includes('poseTracking')),
		gaps.join('; '),
	);
	gate(
		'a build with no GPU at all is not a build of BERX',
		!berxPlatformSupported('phone', {...capable('none'), depthBuffer: false}),
		berxPlatformGaps('phone', {...capable('none'), depthBuffer: false}).join('; '),
	);

	/* framing differs by body; the world does not */
	const watch = berxFramingFor({form: 'watch', width: 396, height: 484, pixelRatio: 3});
	const desktop = berxFramingFor({form: 'desktop', width: 1440, height: 900, pixelRatio: 2});
	const vr = berxFramingFor({form: 'vr', width: 2064, height: 2208, pixelRatio: 1, stereo: true});
	gate(
		'each body frames the same world differently',
		watch.distance < desktop.distance && vr.fov > desktop.fov && watch.fov < desktop.fov,
		`watch ${watch.fov}° at ${watch.distance.toFixed(2)}; desktop ${desktop.fov}° at ${desktop.distance.toFixed(2)}; vr ${vr.fov}° at ${vr.distance.toFixed(2)}`,
	);
	gate(
		'stereo is a property of the display, with a real interpupillary distance',
		vr.ipd > 0.05 && vr.ipd < 0.08 && desktop.ipd === 0,
		`vr ipd ${vr.ipd}m, desktop ipd ${desktop.ipd}`,
	);
}

/* --- stereo, drawn --- */
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, '5d-gpu.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
	'--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D platforms</title>
<style>html,body{margin:0;background:#07080A}#host{position:fixed;inset:0}</style></head>
<body><div id="host"><canvas id="world"></canvas></div><script type="module" src="./world.js"></script></body></html>`);

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

const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 800, height: 400}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_5D !== 'undefined');

	const stereo = await page.evaluate(async () => {
		const host = window.BERX_5D.createBerx5DWebHost({canvas: document.getElementById('world')});
		const {mapUserToSpatial} = window.BERX_5D;
		const person = mapUserToSpatial(
			{guid: 1, username: 'x', fullname: 'X', email: '', icon_url: '', profile_url: '', time_created: 0},
			{position: {x: 0, y: 0, z: 1.5}},
		).object;
		host.addObject({...person, label: undefined});
		await new Promise((r) => requestAnimationFrame(r));

		const centroid = (options) => {
			host.renderer.render(host.runtime.latestFrame, options);
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			/* the lit centroid on each half of the surface */
			const half = Math.floor(canvas.width / 2);
			const side = (from, to) => {
				let sx = 0, n = 0;
				for (let y = 0; y < canvas.height; y++) {
					for (let x = from; x < to; x++) {
						const o = (y * canvas.width + x) * 4;
						if (px[o] + px[o + 1] + px[o + 2] > 60) {
							sx += x;
							n++;
						}
					}
				}
				return {x: n ? sx / n : -1, lit: n};
			};
			return {left: side(0, half), right: side(half, canvas.width), width: canvas.width, height: canvas.height, stats: {...host.renderer.frameStats}};
		};

		const mono = centroid({});
		const two = centroid({stereo: {ipd: 0.063}});
		host.destroy();
		return {mono, two};
	});

	/* Each eye draws the whole world, not half of it. A centred object
	   in mono straddles the middle, so counting halves proves nothing on
	   its own — what does is that each stereo half holds about as many
	   lit pixels as the entire mono frame, which only happens if the
	   object was drawn twice, complete, once per eye. */
	const monoTotal = stereo.mono.left.lit + stereo.mono.right.lit;
	const ratio = (n) => n / monoTotal;
	gate(
		'a stereo display draws the whole world into each eye',
		ratio(stereo.two.left.lit) > 0.85 && ratio(stereo.two.right.lit) > 0.85,
		`mono draws ${monoTotal} lit pixels in total; each stereo eye draws ${stereo.two.left.lit} and ${stereo.two.right.lit} — ${(ratio(stereo.two.left.lit) * 100).toFixed(0)}% and ${(ratio(stereo.two.right.lit) * 100).toFixed(0)}% of a whole frame, in half the width`,
	);
	/* Both eyes must actually HAVE a centroid before their positions can
	   be compared. `side()` returns x = -1 for an empty half, and -1 sits
	   a long way from any real centroid — so while the right eye was
	   drawing nothing at all, this check passed on that sentinel and
	   reported that the eyes "see it from different places" about an eye
	   that saw nothing. That is how a real stereo bug (both eyes drawing
	   into the left half) sat behind a green check. */
	const bothEyesDrew = stereo.two.left.lit > 0 && stereo.two.right.lit > 0;
	gate(
		'the two eyes see it from different places',
		bothEyesDrew && Math.abs((stereo.two.right.x - stereo.two.width / 2) - stereo.two.left.x) > 0.05,
		bothEyesDrew
			? `left eye centroid at ${stereo.two.left.x.toFixed(2)}px of its half, right at ${(stereo.two.right.x - stereo.two.width / 2).toFixed(2)}px of its own`
			: `an eye drew nothing, so there is no position to compare: left ${stereo.two.left.lit} lit pixels, right ${stereo.two.right.lit}`,
	);
	gate(
		'stereo costs two passes over one world, not two worlds',
		stereo.two.stats.visible === stereo.mono.stats.visible && stereo.two.stats.drawCalls === stereo.mono.stats.drawCalls * 2,
		`${stereo.mono.stats.visible} entities either way; ${stereo.mono.stats.drawCalls} draw calls mono, ${stereo.two.stats.drawCalls} stereo`,
	);
	gate('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
} finally {
	await browser.close();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} PLATFORM GATES FAILED`);
	process.exit(1);
}
console.log('ALL PLATFORM GATES PASS');
