#!/usr/bin/env node
/**
 * Volumetric light — is the key light really visible in the air?
 *
 * Two questions, and they fail differently, so they are asked
 * separately:
 *
 *   IS THE MARCH RIGHT?   The shared core's berxVolumetricAt is run on
 *   the CPU over the SAME rays and the SAME shadow map the GPU
 *   sampled, and the two are compared number for number. That is the
 *   oracle: a prediction made before looking, not a description of
 *   what came out.
 *
 *   IS THERE A SHAFT?     A ray that crosses the occluder's shadow
 *   volume must carry less light than one beside it. A pass that
 *   produced a uniform haze would satisfy the oracle and still be
 *   worthless, because a haze is not a light shaft.
 *
 * And one thing that is neither: the peak. A volumetric pass whose
 * brightest pixel clips at 1.0 has stopped being lighting and become a
 * white overlay, so the peak is measured and bounded.
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

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, reason) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${reason}`);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-volumetric-'));

/* ---------------- the core, on its own ---------------- */
const coreBundle = path.join(dir, 'core.mjs');
execFileSync(esbuild, [
	path.join(here, 'volumetric.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${coreBundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {
	BERX_VOLUMETRIC_STEPS, berxInvertMat4, berxMultiplyMat4, berxPhaseHG,
	berxVolumetricAt, berxVolumetricJitter, berxVolumetricParams,
} = await import(`file://${coreBundle}`);

const params = berxVolumetricParams();
gate('the phase function is forward-scattering, and bounded where it would blow out',
	berxPhaseHG(1, params.phaseG) > berxPhaseHG(0, params.phaseG) &&
	berxPhaseHG(0, params.phaseG) > berxPhaseHG(-1, params.phaseG) &&
	Number.isFinite(berxPhaseHG(1, 0.999)) && berxPhaseHG(1, 0.999) < 1e6,
	`Henyey–Greenstein at g=${params.phaseG}: ${berxPhaseHG(1, params.phaseG).toFixed(4)} toward the light, ${berxPhaseHG(0, params.phaseG).toFixed(4)} across it, ${berxPhaseHG(-1, params.phaseG).toFixed(4)} away — air scatters forward, which is why a shaft is bright when you look toward the light. At g=0.999 the lobe is singular and the clamp holds it at ${berxPhaseHG(1, 0.999).toExponential(2)} rather than infinity`);

const jitters = new Set();
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) jitters.add(berxVolumetricJitter(x, y).toFixed(9));
gate('the march offset is a hash, not a random, and differs per pixel',
	jitters.size >= 60 &&
	berxVolumetricJitter(11, 7) === berxVolumetricJitter(11, 7) &&
	[...jitters].every((v) => Number(v) >= 0 && Number(v) < 1),
	`${jitters.size} distinct offsets across 64 pixels, identical on every call — FNV-1a over the coordinate, so the dither is the same number in TypeScript, WGSL, GLSL and Rust without shipping a noise texture`);

/* A ray in fully lit air must scatter more than the same ray in the dark. */
const eye = {x: 0, y: 0, z: 0};
const ahead = {x: 0, y: 0, z: -1};
const toLight = {x: 0, y: 0, z: -1};
const lit = berxVolumetricAt(eye, ahead, 20, toLight, () => 1, 0, 0, params);
const dark = berxVolumetricAt(eye, ahead, 20, toLight, () => 0, 0, 0, params);
const half = berxVolumetricAt(eye, ahead, 20, toLight, (p) => (p.z > -10 ? 1 : 0), 0, 0, params);
gate('shadowed air scatters nothing, lit air scatters, and half-shadowed air is in between',
	dark === 0 && lit > 0 && half > 0 && half < lit,
	`fully lit ${lit.toFixed(5)}, fully shadowed ${dark.toFixed(5)}, lit for the first half ${half.toFixed(5)} — the shadow map is what makes a shaft a shaft rather than a haze`);

const near = berxVolumetricAt(eye, ahead, 4, toLight, () => 1, 0, 0, params);
gate('the march stops at the first surface',
	near < lit && near > 0,
	`a ray ending at 4m scatters ${near.toFixed(5)} against ${lit.toFixed(5)} for one ending at 20m — air behind a wall does not scatter light into the eye, and marching past it is how a volumetric pass glows through solid objects`);

/* ---------------- the GPU ---------------- */
execFileSync(esbuild, [
	path.join(here, '5d-volumetric.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D volumetric</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block}</style></head>
<body><script type="module" src="./world.js"></script></body></html>`);

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

let gl2;
let onFrame;
let offFrame;
let webgpu;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_VOL !== 'undefined');
	gl2 = await page.evaluate(() => window.BERX_VOL.webgl2());
	onFrame = await page.evaluate(() => window.BERX_VOL.webgl2Composited(true));
	offFrame = await page.evaluate(() => window.BERX_VOL.webgl2Composited(false));
	webgpu = await page.evaluate(async () => ({
		on: await window.BERX_VOL.webgpuComposited(true),
		off: await window.BERX_VOL.webgpuComposited(false),
	}));
	gate('the march runs on a real GPU without errors',
		errors.length === 0,
		errors.length === 0 ? 'the fullscreen march, the shadow lookup and the additive composite all compiled and ran' : errors.join(' | '));
} finally {
	await browser.close();
	server.close();
}

if (!gl2?.available) {
	blocked('volumetric', gl2?.reason ?? 'the backend produced no in-scatter buffer here');
	console.log('\nVOLUMETRIC GATES BLOCKED');
	process.exit(0);
}

const {width, height, inscatter, shadowDepth, shadowSize, shadowCamera, projection, view, camera, key, gbuffer} = gl2;
const scatterAt = (x, y) => inscatter[((y * width) + x) * 4];

/* the peak, and the bound on it */
let peak = 0;
let sum = 0;
for (let i = 0; i < inscatter.length; i += 4) {
	peak = Math.max(peak, inscatter[i]);
	sum += inscatter[i];
}
const mean = sum / (inscatter.length / 4);
gate('the air is lit, and nowhere near clipping',
	peak > 0.02 && peak < 0.6,
	`brightest in-scatter ${peak.toFixed(4)}, mean ${mean.toFixed(4)} — light in the air, not a white wash. A pass whose peak reaches 1.0 has stopped being lighting and become an overlay`);

/* ---------------- the oracle ---------------- */
const forward = {x: -view[2], y: -view[6], z: -view[10]};
const viewProj = berxMultiplyMat4(new Float32Array(projection), new Float32Array(view));
const invViewProj = berxInvertMat4(viewProj);
const apply = (m, v) => {
	const o = [
		m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
		m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
		m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
		m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
	];
	return o;
};

/**
 * The same visibility lookup the shader performed.
 *
 * One hard tap, because the march binds a NEAREST comparison sampler
 * rather than the world pass's LINEAR one: 32 dithered taps along a ray
 * do not need hardware PCF, and a filtered lookup would make the result
 * depend on a texel-weighting convention this twin would have to guess.
 */
const visible = (p) => {
	if (!shadowCamera || shadowCamera.strength <= 0) return 1;
	const clip = apply(new Float32Array(shadowCamera.viewProjection), [p.x, p.y, p.z, 1]);
	const w = Math.max(clip[3], 1e-6);
	const ndc = [clip[0] / w, clip[1] / w, clip[2] / w];
	if (ndc[0] < -1 || ndc[0] > 1 || ndc[1] < -1 || ndc[1] > 1 || ndc[2] > 1) return 1;
	const u = ndc[0] * 0.5 + 0.5;
	const v = ndc[1] * 0.5 + 0.5;
	const sx = Math.min(shadowSize - 1, Math.max(0, Math.floor(u * shadowSize)));
	const sy = Math.min(shadowSize - 1, Math.max(0, Math.floor(v * shadowSize)));
	const stored = shadowDepth[sy * shadowSize + sx];
	const reference = ndc[2] * 0.5 + 0.5 - shadowCamera.depthBias;
	return reference <= stored ? 1 : 0;
};

/* the same surface distance the shader read out of the G-buffer: the
   in-scatter buffer alone does not carry it, so it is re-derived from the
   ray and the fixture's own geometry-free rule — the march's far limit */
const predictAt = (x, y) => {
	const uv = [(x + 0.5) / width, (y + 0.5) / height];
	const ndc = [uv[0] * 2 - 1, 1 - uv[1] * 2];
	const nearH = apply(invViewProj, [ndc[0], ndc[1], -1, 1]);
	const farH = apply(invViewProj, [ndc[0], ndc[1], 1, 1]);
	const nearP = [nearH[0] / nearH[3], nearH[1] / nearH[3], nearH[2] / nearH[3]];
	const farP = [farH[0] / farH[3], farH[1] / farH[3], farH[2] / farH[3]];
	const d = [farP[0] - nearP[0], farP[1] - nearP[1], farP[2] - nearP[2]];
	const len = Math.hypot(d[0], d[1], d[2]) || 1;
	const direction = {x: d[0] / len, y: d[1] / len, z: d[2] / len};
	/* the jitter is hashed on the TOP-DOWN row in every backend (see the
	   note in the GLSL march), so the twin uses that index too */
	return {direction, jx: x, jy: y};
};

/* Sample a spread of pixels rather than one: a single agreeing pixel can
   agree by accident, and a disagreement that only appears at the edge of
   the shadow volume is exactly the kind a spot check misses. */
const probes = [];
for (let y = 40; y < height - 40; y += 37) {
	for (let x = 30; x < width - 30; x += 41) probes.push([x, y]);
}
let worst = 0;
let worstAt = null;
let compared = 0;
for (const [x, y] of probes) {
	const {direction, jx, jy} = predictAt(x, y);
	/* Where this ray actually ends, out of the same G-buffer the march
	   read. The buffer holds VIEW depth, so it is turned into a distance
	   along this ray exactly as the shader does — an oracle that skipped
	   that conversion would be predicting a different march. */
	const gy = height - 1 - y;
	const depth = gbuffer[((gy * width) + x) * 4 + 3];
	const along = Math.max(direction.x * forward.x + direction.y * forward.y + direction.z * forward.z, 1e-3);
	const surface = depth > 0 ? depth / along : params.maxDistance;
	const predicted = berxVolumetricAt(camera, direction, surface, key.direction, visible, jx, jy, params) *
		key.colour[0] * key.intensity;
	const actual = scatterAt(x, height - 1 - y);
	const delta = Math.abs(predicted - actual);
	if (delta > worst) {
		worst = delta;
		worstAt = [x, y, predicted, actual];
	}
	compared++;
}
gate('the GPU march is the shared core\'s march, checked against a prediction',
	worst < 0.01,
	`${compared} pixels predicted by @berx/spatial's berxVolumetricAt over the same rays and the same shadow map, worst disagreement ${worst.toExponential(3)}${worstAt ? ` at (${worstAt[0]}, ${worstAt[1]}): predicted ${worstAt[2].toFixed(6)}, read back ${worstAt[3].toFixed(6)}` : ''}`);

/* ---------------- is there a shaft ---------------- */
const region = (px, x0, y0, x1, y1, stride, channel) => {
	let total = 0;
	let n = 0;
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			total += px[((y * stride) + x) * 4 + channel];
			n++;
		}
	}
	return total / Math.max(1, n);
};
const behind = region(inscatter, Math.floor(width * 0.44), Math.floor(height * 0.44), Math.floor(width * 0.56), Math.floor(height * 0.56), width, 0);
const beside = region(inscatter, 10, Math.floor(height * 0.44), Math.floor(width * 0.12), Math.floor(height * 0.56), width, 0);
gate('a ray through the occluder\'s shadow carries less light than one beside it',
	behind < beside * 0.9,
	`in-scatter behind the occluder ${behind.toFixed(5)} against ${beside.toFixed(5)} beside it — ${(100 * (1 - behind / beside)).toFixed(1)}% dimmer. A uniform haze would satisfy the oracle above and still be worthless, because a haze is not a light shaft`);

/* ---------------- the composite ---------------- */
let brighter = 0;
let darker = 0;
for (let i = 0; i < onFrame.rgba.length; i += 4) {
	const a = onFrame.rgba[i] + onFrame.rgba[i + 1] + onFrame.rgba[i + 2];
	const b = offFrame.rgba[i] + offFrame.rgba[i + 1] + offFrame.rgba[i + 2];
	if (a > b) brighter++;
	else if (a < b) darker++;
}
gate('the pass adds light to the frame and never removes any',
	brighter > 1000 && darker === 0,
	`${brighter} pixels of ${onFrame.rgba.length / 4} are brighter with the pass on and ${darker} are darker — light in the air ADDS to what is behind it. A pass that blended over the world would darken something, and would be a fog overlay rather than scattering`);

if (!webgpu?.on?.available) {
	blocked('webgpu-volumetric', webgpu?.on?.reason ?? 'no WebGPU device here');
} else {
	/**
	 * The pass ON and the pass OFF are compared separately, and that
	 * separation is the point: two backends can disagree about a frame
	 * for reasons that have nothing to do with the pass being tested —
	 * a multisample edge resolves differently, a silhouette lands half a
	 * texel over. Comparing only the ON frames would blame the march for
	 * that. What the march has to match is the DIFFERENCE the pass makes.
	 */
	let maxDelta = 0;
	let maxBaseline = 0;
	let sumDelta = 0;
	let overThreshold = 0;
	let samples = 0;
	for (let i = 0; i < webgpu.on.rgba.length; i += 4) {
		let pixelDelta = 0;
		for (let c = 0; c < 3; c++) {
			const gpuAdded = webgpu.on.rgba[i + c] - webgpu.off.rgba[i + c];
			const glAdded = onFrame.rgba[i + c] - offFrame.rgba[i + c];
			const d = Math.abs(gpuAdded - glAdded);
			pixelDelta = Math.max(pixelDelta, d);
			sumDelta += d;
			samples++;
			maxDelta = Math.max(maxDelta, d);
			maxBaseline = Math.max(maxBaseline, Math.abs(webgpu.off.rgba[i + c] - offFrame.rgba[i + c]));
		}
		if (pixelDelta > 6) overThreshold++;
	}
	const meanDelta = sumDelta / samples;
	const overShare = overThreshold / (webgpu.on.rgba.length / 4);
	let gpuBrighter = 0;
	for (let i = 0; i < webgpu.on.rgba.length; i += 4) {
		const a = webgpu.on.rgba[i] + webgpu.on.rgba[i + 1] + webgpu.on.rgba[i + 2];
		const b = webgpu.off.rgba[i] + webgpu.off.rgba[i + 1] + webgpu.off.rgba[i + 2];
		if (a > b) gpuBrighter++;
	}
	/* where the disagreement is, not just how big: a difference at one
	   edge is a convention, a difference everywhere is a formula */
	let worstPx = null;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = ((y * width) + x) * 4;
			let d = 0;
			for (let c = 0; c < 3; c++) {
				d = Math.max(d, Math.abs(
					(webgpu.on.rgba[i + c] - webgpu.off.rgba[i + c]) - (onFrame.rgba[i + c] - offFrame.rgba[i + c]),
				));
			}
			if (!worstPx || d > worstPx[2]) worstPx = [x, y, d];
		}
	}
	const sample = (x, y) => {
		const i = ((y * width) + x) * 4;
		return `added ${webgpu.on.rgba[i] - webgpu.off.rgba[i]} on WebGPU vs ${onFrame.rgba[i] - offFrame.rgba[i]} on WebGL2`;
	};
	/**
	 * Mean and share rather than a maximum, and the reason is a real
	 * property of the pass rather than a loosened bound.
	 *
	 * The march ends each ray at the first surface, read out of the
	 * G-buffer. At a SILHOUETTE the two backends' rasterisers put that
	 * edge in neighbouring texels, so one backend's ray stops at the
	 * occluder and the other's continues past it — and the in-scatter
	 * for that one pixel differs a lot, correctly, in both. A maximum
	 * over every pixel measures that rasterisation difference, not the
	 * march. Measured here: the interior agrees to the byte (centre 26
	 * against 26, corner 40 against 40) and every disagreement is on an
	 * edge, so what is bounded is the mean and how many pixels are
	 * allowed to be edges.
	 */
	gate('WebGPU puts the same light in the same air',
		gpuBrighter > 1000 && meanDelta < 0.2 && overShare < 0.01,
		`${gpuBrighter} pixels brighter with the pass on. The LIGHT THE PASS ADDS differs by ${meanDelta.toFixed(4)}/255 on average, with ${(overShare * 100).toFixed(3)}% of pixels over 6/255 and a worst of ${maxDelta}/255 — one WGSL march, one GLSL port, the same shafts. The frames themselves already differed by ${maxBaseline}/255 with the pass off, which is the world pass's own multisample edges and not this pass's doing. Worst added-light pixel at (${worstPx?.[0]}, ${worstPx?.[1]}): ${sample(worstPx?.[0] ?? 0, worstPx?.[1] ?? 0)}; centre ${sample(240, 180)}; corner ${sample(20, 20)}`);
}

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D volumetric: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL VOLUMETRIC GATES PASS');
