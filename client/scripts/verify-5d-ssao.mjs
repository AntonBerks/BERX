#!/usr/bin/env node
/**
 * SSAO — is the contact darkening real, and is it the SAME occlusion in
 * every backend?
 *
 * Ambient occlusion answers one question per pixel: how much of the room
 * can this point actually see? A point in the crease where a sphere
 * meets a floor sees very little. That darkening is what the eye reads
 * as CONTACT, and without it every object floats — the shadow pass gives
 * an object a shadow, but only occlusion says where it touches.
 *
 * Unlike the environment, this is not a closed form: a pixel has to ask
 * its neighbours, so the loop must live in a shader. What does not have
 * to live there is the part that decides the answer, and that is the
 * whole design — the kernel, the radius, the slope-scaled bias, the
 * range check and the falloff are all in @berx/spatial's berxSSAO, and
 * the shaders read them out of a buffer it fills.
 *
 * THE ORACLE IS THE POINT. The gate reads back BOTH the G-buffer the GPU
 * sampled AND the AO map it produced, then runs the shared core's
 * berxSSAOAt over those exact numbers and compares. Backends agreeing
 * with each other only says they are the same; this says they compute
 * what the core says.
 *
 * The fixture is an orb RESTING ON the floor. The shadow fixture floats
 * its orb 2.6 units up, which is right for a shadow and useless here:
 * with a 0.65-unit hemisphere the correct answer at that separation is
 * "no occlusion anywhere", and a gate measuring it would measure nothing.
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
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-ssao-'));

const failures = [];
const blocks = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, why) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${why}`);
	blocks.push(name);
};

/* ---------------- 1. the kernel, on its own ---------------- */

const nodeEntry = path.join(dir, 'ssao.mjs');
execFileSync(esbuild, [
	path.join(here, 'ssao.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${nodeEntry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(nodeEntry);

const kernel = core.berxSSAOKernel();
const params = core.berxSSAOParams();
gate('the kernel is deterministic — the same sixteen points every run',
	JSON.stringify(core.berxSSAOKernel()) === JSON.stringify(kernel) && kernel.length === core.BERX_SSAO_SAMPLES,
	`${kernel.length} samples from a golden-angle spiral, no Math.random anywhere: a random kernel means a different picture every run, and a picture that cannot be reproduced cannot be predicted`);

gate('every sample is inside the +Z hemisphere',
	kernel.every((s) => s.z >= 0 && Math.hypot(s.x, s.y, s.z) <= 1.0001),
	`lengths ${Math.min(...kernel.map((s) => Math.hypot(s.x, s.y, s.z))).toFixed(3)}–${Math.max(...kernel.map((s) => Math.hypot(s.x, s.y, s.z))).toFixed(3)}, denser near the origin — occlusion from something touching matters more than from something at arm's length`);

gate('the packing the three backends read is the length they allocate for',
	core.berxSSAOUniform().length === core.BERX_SSAO_FLOATS,
	`${core.BERX_SSAO_FLOATS} floats: ${core.BERX_SSAO_SAMPLES} offsets and one vec4 of radius ${params.radius}, bias ${params.bias}, strength ${params.strength}, power ${params.power}`);

/* ---------------- 2 and 3. the pixels ---------------- */

execFileSync(esbuild, [
	path.join(here, '5d-crossrender.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D SSAO</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block}</style></head>
<body><canvas id="world"></canvas><script type="module" src="./world.js"></script></body></html>`);

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

let gl2, gpu, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	gl2 = await page.evaluate(() => window.BERX_CROSS.renderSSAO());
	gpu = await page.evaluate(async () => await window.BERX_CROSS.renderSSAOWebGPU());
} finally {
	await browser.close();
	server.close();
}

gate('the occlusion fixture renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

const {width, height, list} = gl2;

/* ---- THE ORACLE, run against BOTH backends ----
   The shared core, over the very G-buffer each one sampled. Running it
   on both is what separates a wrong SIGN in one port from a wrong
   FORMULA in the shared core: a sign error shows up as one backend
   disagreeing with the core while the other matches it. */
/**
 * `bottomUp` says the readback's row 0 is the BOTTOM of the image.
 *
 * WebGL renders with the origin at bottom-left, so its G-buffer and AO
 * map come back upside down relative to WebGPU's. berxSSAOAt works in
 * screen convention — y increasing downward — so the gate turns the
 * buffer the right way up before predicting from it. Flipping here
 * rather than in the core is the point: the orientation is a property of
 * a graphics API's readback, not of ambient occlusion.
 */
const oracleAgainst = (name, gbufRaw, aoRaw, bottomUp) => {
	const flip4 = (b) => {
		if (!bottomUp) return b;
		const out = new Float64Array(b.length);
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			const src = ((height - 1 - y) * width + x) * 4, dst = (y * width + x) * 4;
			for (let k = 0; k < 4; k++) out[dst + k] = b[src + k];
		}
		return out;
	};
	const flip1 = (b) => {
		if (!bottomUp) return b;
		const out = new Float64Array(b.length);
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			out[y * width + x] = b[(height - 1 - y) * width + x];
		}
		return out;
	};
	const gbuf = flip4(gbufRaw);
	const aoMap = flip1(aoRaw);
	const fetch = (px, py) => {
		const i = (py * width + px) * 4;
		return {normal: {x: gbuf[i], y: gbuf[i + 1], z: gbuf[i + 2]}, depth: gbuf[i + 3]};
	};
	const focalPx = list.projection[5] * height * 0.5;
	let worst = 0, worstAt = '', compared = 0;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		if (gbuf[(y * width + x) * 4 + 3] <= 0) continue;
		const want = core.berxSSAOAt(x, y, width, height, fetch, focalPx);
		const got = aoMap[y * width + x];
		compared++;
		const d = Math.abs(want - got);
		if (d > worst) { worst = d; worstAt = `${x},${y}`; }
	}
	gate(`${name} computes the SHARED CORE's occlusion, not one of its own`,
		compared > 1000 && worst < 1e-4,
		`berxSSAOAt run over the same G-buffer that backend sampled, at all ${compared} drawn pixels: worst disagreement ${worst.toExponential(2)} at (${worstAt})`);
};

if (gl2.gbuffer && gl2.ao) {
	oracleAgainst('WebGL2', gl2.gbuffer, gl2.ao, true);
} else {
	blocked('webgl2-oracle', 'EXT_color_buffer_float is unavailable here, so this backend rendered no G-buffer to predict from');
}

if (!gpu?.available) {
	blocked('oracle', 'the oracle needs the G-buffer and the AO map read back off the device, and no WebGPU device was granted here');
} else {
	const g = gpu.gbuffer;
	const fetch = (px, py) => {
		const i = (py * width + px) * 4;
		return {normal: {x: g[i], y: g[i + 1], z: g[i + 2]}, depth: g[i + 3]};
	};
	/* focal length in pixels, off the projection the core built */
	const focalPx = list.projection[5] * height * 0.5;
	let worst = 0;
	let worstAt = '';
	let compared = 0;
	/* every pixel the fixture actually drew, not a sample of them */
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (g[(y * width + x) * 4 + 3] <= 0) continue;
			const want = core.berxSSAOAt(x, y, width, height, fetch, focalPx);
			const got = gpu.ao[y * width + x];
			compared++;
			const d = Math.abs(want - got);
			if (d > worst) { worst = d; worstAt = `${x},${y}`; }
		}
	}
	/* f32 on the device against f64 in the core, over a loop with a
	   branch in it: 1e-4 is far tighter than any formula difference could
	   survive and far looser than the last bit of a float. */
	gate('WebGPU computes the SHARED CORE\'s occlusion, not one of its own',
		compared > 1000 && worst < 1e-4,
		`berxSSAOAt run over the same G-buffer the GPU sampled, at all ${compared} drawn pixels: worst disagreement ${worst.toExponential(2)} at (${worstAt})`);
}

/* ---- the occlusion is where the geometry says ---- */
if (gpu?.available) {
	const ao = gpu.ao;
	const g = gpu.gbuffer;
	let darkest = 1, dx = 0, dy = 0;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const i = y * width + x;
		if (g[i * 4 + 3] > 0 && ao[i] < darkest) { darkest = ao[i]; dx = x; dy = y; }
	}
	gate('something is genuinely occluded, and it is not everything',
		darkest < 0.9 && darkest > 0,
		`darkest occlusion ${darkest.toFixed(4)} at (${dx}, ${dy}) — a crease, not a global dimming`);

	/* the same row, well away from where the orb meets the floor */
	const away = ao[dy * width + Math.max(0, dx - 200)];
	gate('the same surface, away from the contact, is not occluded',
		away > 0.985,
		`${(away).toFixed(4)} two hundred pixels along the same row: the darkening is at the crease, and a flat floor is not uniformly dirty`);

	let emptyWrong = 0;
	for (let i = 0; i < ao.length; i++) if (g[i * 4 + 3] <= 0 && ao[i] !== 1) emptyWrong++;
	gate('where nothing was drawn, nothing is occluded',
		emptyWrong === 0,
		`every one of the ${ao.length - gpu.gbuffer.filter ? '' : ''}pixels with no geometry reports 1.0 — there is nothing there to shade`);
}

if (gpu?.available) {
	const ao = gpu.ao, g = gpu.gbuffer;
	let darkest = 1, dx = 0, dy = 0;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const i = y * width + x;
		if (g[i * 4 + 3] > 0 && ao[i] < darkest) { darkest = ao[i]; dx = x; dy = y; }
	}
	gate('something is genuinely occluded, and it is not everything',
		darkest < 0.9 && darkest > 0,
		`darkest occlusion ${darkest.toFixed(4)} at (${dx}, ${dy}) — a crease, not a global dimming`);

	/* the same row, well away from where the orb meets the floor */
	const away = ao[dy * width + Math.max(0, dx - 200)];
	gate('the same surface, away from the contact, is not occluded',
		away > 0.985,
		`${(away).toFixed(4)} two hundred pixels along the same row: the darkening is at the crease, and a flat floor is not uniformly dirty`);

	let emptyWrong = 0;
	for (let i = 0; i < ao.length; i++) if (g[i * 4 + 3] <= 0 && ao[i] !== 1) emptyWrong++;
	gate('where nothing was drawn, nothing is occluded',
		emptyWrong === 0,
		`every one of the ${ao.length - gpu.gbuffer.filter ? '' : ''}pixels with no geometry reports 1.0 — there is nothing there to shade`);
}

if (gpu?.available) {
	const ao = gpu.ao, g = gpu.gbuffer;
	/*
	 * THE PROBE MUST BE ON AN OPAQUE SURFACE, and this is the second time
	 * that has mattered.
	 *
	 * The darkest occlusion in the frame is on the floor, in the crease —
	 * and the floor is translucent (opacity 0.68, transmission 0.55), so
	 * its pixel is the shaded colour composited over the clear colour and
	 * predicting `ambient * ao` from it came out 1.5/255 low. The orb is
	 * opaque, so its pixel is the shader's output with nothing over it.
	 *
	 * The floor is one plane, so it is the one view-space normal that
	 * repeats across most of the frame; anything far from it is the orb.
	 */
	const key = (i) => `${g[i * 4].toFixed(2)},${g[i * 4 + 1].toFixed(2)},${g[i * 4 + 2].toFixed(2)}`;
	const counts = new Map();
	for (let i = 0; i < ao.length; i++) if (g[i * 4 + 3] > 0) counts.set(key(i), (counts.get(key(i)) ?? 0) + 1);
	const planeKey = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
	const plane = planeKey.split(',').map(Number);
	const offPlane = (i) => Math.hypot(g[i * 4] - plane[0], g[i * 4 + 1] - plane[1], g[i * 4 + 2] - plane[2]) > 0.2;

	let darkest = 1, dx = 0, dy = 0;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const i = y * width + x;
		if (g[i * 4 + 3] > 0 && ao[i] < darkest) { darkest = ao[i]; dx = x; dy = y; }
	}
	gate('something is genuinely occluded, and it is not everything',
		darkest < 0.9 && darkest > 0,
		`darkest occlusion ${darkest.toFixed(4)} at (${dx}, ${dy}) — a crease, not a global dimming`);

	const away = ao[dy * width + Math.max(0, dx - 200)];
	gate('the same surface, away from the contact, is not occluded',
		away > 0.985,
		`${away.toFixed(4)} two hundred pixels along the same row: the darkening is at the crease, and a flat floor is not uniformly dirty`);

	let emptyWrong = 0;
	for (let i = 0; i < ao.length; i++) if (g[i * 4 + 3] <= 0 && ao[i] !== 1) emptyWrong++;
	gate('where nothing was drawn, nothing is occluded',
		emptyWrong === 0,
		'every pixel with no geometry reports 1.0 — there is nothing there to shade');

	/*
	 * THE PREDICTION HAS TO INCLUDE THE COMPOSITE.
	 *
	 * The most occluded pixel is in the crease, and the crease is on the
	 * floor — which is translucent (opacity 0.68, transmission 0.55). What
	 * reaches the frame there is not the shaded colour but the shaded
	 * colour composited over the clear colour, so predicting `ambient * ao`
	 * came out 1.5/255 low and looked like a shader disagreement. The alpha
	 * is the shader's own: clamp(opacity * (1 - transmission * 0.55), 0.02, 1).
	 *
	 * The key light is off in this fixture, so the shaded colour IS the
	 * ambient term and occlusion scales exactly it — the part of the pixel
	 * that came from the clear colour is untouched.
	 */
	const floorItem = list.items.find((i) => i.opacity < 1);
	const alpha = floorItem
		? Math.min(1, Math.max(0.02, floorItem.opacity * (1 - floorItem.transmission * 0.55)))
		: 1;
	const clear = list.clearColor.map((c) => c * 255);
	const at = (b) => [0, 1, 2].map((k) => b[(dy * width + dx) * 4 + k]);
	const off = at(gpu.withoutAo), on = at(gpu.withAo);
	const ground = clear.map((c) => c * (1 - alpha));
	const want = [0, 1, 2].map((k) => (off[k] - ground[k]) * darkest + ground[k]);
	const worstC = Math.max(...[0, 1, 2].map((k) => Math.abs(on[k] - want[k])));
	gate('the frame darkens by the amount the occlusion map says',
		on.every((c, k) => c <= off[k]) && worstC <= 1,
		`at the most occluded pixel (${dx}, ${dy}), ao ${darkest.toFixed(4)} on a surface compositing at alpha ${alpha.toFixed(3)}: [${off.join(', ')}] became [${on.join(', ')}], against [${want.map((v) => v.toFixed(1)).join(', ')}] predicted by scaling only the part of the pixel the ambient contributed — worst channel off by ${worstC.toFixed(2)}/255`);
}


/* ---- the backends agree ---- */
const tileCompare = (a, b) => {
	const TILE = 8;
	const tilesX = Math.floor(width / TILE), tilesY = Math.floor(height / TILE);
	const tileOf = (buf, tx, ty) => {
		let r = 0, gg = 0, bl = 0, lit = 0;
		for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
			const i = (((ty * TILE + y) * width) + tx * TILE + x) * 4;
			r += buf[i]; gg += buf[i + 1]; bl += buf[i + 2];
			if (buf[i] + buf[i + 1] + buf[i + 2] > 24) lit++;
		}
		const n = TILE * TILE;
		return {mean: [r / n, gg / n, bl / n], lit};
	};
	let worst = 0, worstAt = '', sum = 0, tiles = 0;
	for (let ty = 0; ty < tilesY; ty++) for (let tx = 0; tx < tilesX; tx++) {
		const p = tileOf(a, tx, ty), q = tileOf(b, tx, ty);
		if (p.lit === 0 && q.lit === 0) continue;
		const d = Math.max(...[0, 1, 2].map((k) => Math.abs(p.mean[k] - q.mean[k])));
		sum += d; tiles++;
		if (d > worst) { worst = d; worstAt = `${tx * TILE},${ty * TILE}`; }
	}
	return {tiles, mean: sum / Math.max(1, tiles), worst, worstAt};
};

if (!gpu?.available) {
	blocked('webgpu-ssao', `${gpu?.reason ?? 'no WebGPU device here'} — the WebGL2 evidence above stands on its own`);
} else {
	/* The same comparison with the pass OFF, as the control: it separates
	   anything the occlusion introduced from anything the two backends
	   already disagreed about. */
	const before = tileCompare(gl2.withoutAo, gpu.withoutAo);
	const c = tileCompare(gl2.withAo, gpu.withAo);
	gate('WebGL2 and WebGPU occlude the world the same way',
		c.tiles > 0 && c.worst <= 6 && c.mean <= 1,
		`${c.tiles} tiles hold the world: mean ${c.mean.toFixed(2)}/255, worst ${c.worst.toFixed(1)}/255 at ${c.worstAt}, against mean ${before.mean.toFixed(2)} with the pass off — a WGSL compute pass on one side, a GLSL fullscreen pass on the other, and the same creases out of both`);
}

console.log('');
if (failures.length === 0) {
	console.log(`BERX 5D SSAO: ALL GATES PASS${blocks.length ? ` (${blocks.length} blocked: ${blocks.join(', ')})` : ''}`);
} else {
	console.log(`BERX 5D SSAO: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exitCode = 1;
}
