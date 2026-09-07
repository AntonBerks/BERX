#!/usr/bin/env node
/**
 * Particles — is the air really carrying things, and are they the SAME
 * things in every backend?
 *
 * The interesting property of this pass is not that it draws dots. It is
 * that the field is DETERMINISTIC: every particle's position comes from
 * a hash of its own index, so the same world produces the same field on
 * every run, on every backend and in every language. That is what makes
 * a prediction possible at all — and a prediction is the only way to
 * tell "the GPU drew the core's field" from "the GPU drew a field".
 *
 * So the gate asks, in order:
 *
 *   is the field deterministic and free of Math.random?
 *   does each of the three kinds do what it claims (dust drifts, energy
 *   rises and fades, stars hold still)?
 *   is BERX Energy really reserved to the one kind the palette reserves
 *   it for, and only where the world says something is live?
 *   and finally: do particles land where the shared core says they will,
 *   in pixels, on a real GPU?
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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-particles-'));

const coreBundle = path.join(dir, 'core.mjs');
execFileSync(esbuild, [
	path.join(here, 'particles.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${coreBundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {
	BERX_PARTICLE_KINDS, berxBuildDrawList, berxCrossRendererFrame, berxParticleAt, berxParticleField,
	berxParticleHash, berxParticleSpec,
} = await import(`file://${coreBundle}`);

/* ---------------- deterministic, and no random anywhere ---------------- */
const sources = ['packages/spatial/src/lighting/berxParticles.ts', 'packages/spatial-shaders/particles.wgsl']
	.map((f) => fs.readFileSync(path.join(clientRoot, f), 'utf8'));
gate('nothing in the field is random, in any language',
	/* a CALL, not a mention: the first version matched this file's own
	   comment saying that nothing calls Math.random, which is a check
	   that fails on the documentation rather than on the code */
	sources.every((text) => !/Math\.random\s*\(/.test(text) && !/\brand\s*\(/.test(text)),
	'no Math.random and no rand() in the core or the WGSL — a random field is a different world on every run, so two backends could not be compared and no prediction could be made');

const first = berxParticleField('dust', 3.5);
const again = berxParticleField('dust', 3.5);
gate('the same world produces the same field, every time',
	JSON.stringify(first) === JSON.stringify(again) && first.length === berxParticleSpec('dust').count,
	`${first.length} dust motes, identical across two independent evaluations — the position, size and phase of each come from a hash of its own index`);

const hashes = new Set();
for (let i = 0; i < 200; i++) for (let lane = 1; lane <= 4; lane++) hashes.add(berxParticleHash(i, lane).toFixed(9));
gate('one index yields several independent numbers, all in range',
	hashes.size > 750 && [...hashes].every((v) => Number(v) >= 0 && Number(v) < 1),
	`${hashes.size} distinct values from 200 indices across 4 lanes — the lane is what turns one index into position, phase and size without four hashes or a table`);

/* ---------------- three kinds, three behaviours ---------------- */
const dustNow = berxParticleAt('dust', 7, 0);
const dustLater = berxParticleAt('dust', 7, 6);
const starNow = berxParticleAt('stars', 7, 0);
const starLater = berxParticleAt('stars', 7, 6);
gate('dust drifts and stars hold still',
	Math.hypot(dustLater.position.x - dustNow.position.x, dustLater.position.y - dustNow.position.y, dustLater.position.z - dustNow.position.z) > 0.05 &&
	starNow.position.x === starLater.position.x && starNow.position.y === starLater.position.y && starNow.position.z === starLater.position.z,
	`the same dust mote moved ${Math.hypot(dustLater.position.x - dustNow.position.x, dustLater.position.y - dustNow.position.y, dustLater.position.z - dustNow.position.z).toFixed(3)}m in six seconds; the same star did not move at all — a star that drifts is not far away`);

/**
 * Sampled by the particle's OWN phase, not by absolute time.
 *
 * Every particle carries a hashed phase offset so a field never restarts
 * as one, which means a fixed sweep of t crosses a wrap for most
 * particles — the first version of this check read the wrap as a
 * particle falling. The offset is subtracted so the sweep follows one
 * life from start to end.
 */
const energyPeriod = berxParticleSpec('energy').period;
const energyOffset = berxParticleHash(11, 4);
const atPhase = (phase) => berxParticleAt('energy', 11, (phase - energyOffset + 1) * energyPeriod);
const rise = [0.1, 0.3, 0.5, 0.7].map((f) => atPhase(f).position.y);
const fades = [0.02, 0.5, 0.98].map((f) => atPhase(f).alpha);
gate('energy rises, and fades in and out over its own life',
	rise[0] < rise[1] && rise[1] < rise[2] && rise[2] < rise[3] &&
	fades[0] < fades[1] && fades[2] < fades[1] && fades[0] >= 0,
	`height through one cycle: ${rise.map((v) => v.toFixed(2)).join(' → ')}; alpha ${fades.map((v) => v.toFixed(3)).join(' → ')} — a particle that appears at full brightness is a flicker, not a rising ember`);

/* ---------------- the palette rule, structurally ---------------- */
const energyColour = berxParticleSpec('energy').colour;
const isAccent = (c) => Math.abs(c[0] - 0x4f / 255) < 1e-6 && Math.abs(c[1] - 0xd6 / 255) < 1e-6 && Math.abs(c[2] - 0xe8 / 255) < 1e-6;
gate('BERX Energy belongs to exactly one kind of particle',
	isAccent(energyColour) &&
	BERX_PARTICLE_KINDS.filter((k) => isAccent(berxParticleSpec(k).colour)).length === 1,
	`#4FD6E8 is the energy field's colour and no other field's — dust is ${BERX_PARTICLE_KINDS.map((k) => k).join('/')} and only one of them carries the accent. A dust mote in accent colour would spend the rarest thing in the design on the most common object in the frame`);

gate('every kind is faint, and none of them is a foreground element',
	BERX_PARTICLE_KINDS.every((k) => berxParticleSpec(k).alpha <= 0.5 && berxParticleSpec(k).size <= 0.06),
	BERX_PARTICLE_KINDS.map((k) => `${k} α${berxParticleSpec(k).alpha} ${berxParticleSpec(k).size}m`).join(', '));

/* ---------------- the GPU ---------------- */
execFileSync(esbuild, [
	path.join(here, '5d-volumetric.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D particles</title>
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

let on;
let off;
let gpu;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_VOL !== 'undefined');
	on = await page.evaluate(() => window.BERX_VOL.particles(true));
	off = await page.evaluate(() => window.BERX_VOL.particles(false));
	gpu = await page.evaluate(async () => ({
		on: await window.BERX_VOL.particlesWebGPU(true),
		off: await window.BERX_VOL.particlesWebGPU(false),
	}));
	gate('the fields draw on a real GPU without errors',
		errors.length === 0,
		errors.length === 0 ? 'three fields, expanded from the vertex index alone — no vertex buffer at all' : errors.join(' | '));
} finally {
	await browser.close();
	server.close();
}

const {width, height} = on;
let changed = 0;
let brighter = 0;
for (let i = 0; i < on.rgba.length; i += 4) {
	const a = on.rgba[i] + on.rgba[i + 1] + on.rgba[i + 2];
	const b = off.rgba[i] + off.rgba[i + 1] + off.rgba[i + 2];
	if (a !== b) changed++;
	if (a > b) brighter++;
}
gate('the field really reaches the frame, and only adds light',
	changed > 200 && brighter === changed,
	`${changed} pixels of ${width * height} differ with the fields on, and every one of them is brighter — a mote is light, not a surface, so it is drawn additively and can never darken anything`);

/**
 * Where the core says each particle should land, projected by hand.
 *
 * This is the prediction: the shared core places the particle, this
 * projects it with the same matrices the frame was drawn with, and the
 * readback is asked whether that pixel actually got brighter. A field
 * drawn from a different hash, a different origin or a different clock
 * would land somewhere else and this would find it.
 */
const apply = (m, v) => [
	m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
	m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
	m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
	m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
];
const project = (p) => {
	const clip = apply(on.projection, apply(on.view, [p.x, p.y, p.z, 1]));
	if (clip[3] <= 0) return undefined;
	const x = Math.round((clip[0] / clip[3] * 0.5 + 0.5) * width);
	const y = Math.round((0.5 - clip[1] / clip[3] * 0.5) * height);
	if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) return undefined;
	return {x, y};
};
const brighterAt = (x, y) => {
	/* a 3x3 window: a mote is a few pixels across and the projection
	   rounds to the nearest one, so an exact-pixel test would fail on
	   rounding rather than on placement */
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			const i = (((y + dy) * width) + (x + dx)) * 4;
			if (on.rgba[i] + on.rgba[i + 1] + on.rgba[i + 2] > off.rgba[i] + off.rgba[i + 1] + off.rgba[i + 2]) return true;
		}
	}
	return false;
};

/**
 * The full prediction: which particles are visible AND which are not.
 *
 * A particle behind a surface is correctly invisible — the pass is
 * depth-tested — so a check that only looked for the visible ones would
 * pass just as well on a renderer that drew everything, everywhere. So
 * each particle's own view depth is compared against the G-buffer the
 * frame was drawn with, and the readback is asked to agree BOTH ways.
 */
const forward = {x: -on.view[2], y: -on.view[6], z: -on.view[10]};
const surfaceDepthAt = (x, y) => {
	if (!on.gbuffer) return undefined;
	/* the G-buffer is a GL target and counts rows from the bottom */
	const gy = height - 1 - y;
	return on.gbuffer[((gy * width) + x) * 4 + 3];
};
/* focal length in pixels, off the projection the frame was drawn with */
const focalPx = on.projection[5] * height * 0.5;
let subPixel = 0;
let visiblePredicted = 0;
let visibleFound = 0;
let hiddenPredicted = 0;
let hiddenCorrect = 0;
for (const field_ of on.particles) {
	const kind = BERX_PARTICLE_KINDS[field_[9]];
	const origin = {x: field_[12], y: field_[13], z: field_[14]};
	for (const particle of berxParticleField(kind, on.worldTime, origin)) {
		if (particle.alpha < 0.05) continue;
		const at = project(particle.position);
		if (!at) continue;
		const depth =
			(particle.position.x - on.camera.x) * forward.x +
			(particle.position.y - on.camera.y) * forward.y +
			(particle.position.z - on.camera.z) * forward.z;
		const surface = surfaceDepthAt(at.x, at.y);
		/* a margin of one particle radius: a mote straddling a surface is
		   neither clearly in front nor clearly behind, and predicting it
		   either way would be predicting a rounding */
		const margin = Math.max(particle.size * 2, 0.05);
		if (surface !== undefined && surface > 0 && depth > surface + margin) {
			hiddenPredicted++;
			if (!brighterAt(at.x, at.y)) hiddenCorrect++;
			continue;
		}
		if (surface !== undefined && surface > 0 && depth > surface - margin) continue;
		/*
		 * Sub-pixel particles are not predicted to be visible, and that is
		 * rasterisation rather than a loosened bound: a 0.035m quad at 20m
		 * subtends about 1.7 mrad where a pixel here subtends 2.0, so it
		 * may or may not cover the sample point. Predicting one either way
		 * would be predicting where a sample point happens to fall.
		 */
		const radiusPx = (particle.size * focalPx) / Math.max(depth, 1e-3);
		if (radiusPx < 0.7) {
			subPixel++;
			continue;
		}
		visiblePredicted++;
		if (brighterAt(at.x, at.y)) visibleFound++;
	}
}
gate('particles land where the shared core says they will, and only there',
	visiblePredicted > 30 && visibleFound / visiblePredicted > 0.95 &&
	hiddenPredicted > 10 && hiddenCorrect / hiddenPredicted > 0.95,
	`${visibleFound} of ${visiblePredicted} particles the core places in FRONT of a surface, and large enough to cover a pixel, were found brighter in the readback at the pixel they project to (${(100 * visibleFound / visiblePredicted).toFixed(1)}%); ${hiddenCorrect} of ${hiddenPredicted} it places BEHIND one were correctly absent (${(100 * hiddenCorrect / hiddenPredicted).toFixed(1)}%); ${subPixel} more are smaller than a pixel and are not predicted either way. Predicted both ways on purpose — a check that only looked for the visible ones would pass on a renderer that drew everything everywhere`);

/**
 * Energy exists where the world says something is live, and nowhere
 * else. Asked of BOTH kinds of world, because the interesting half is
 * the absence: a fixture with nothing live is what proves the field is
 * not simply always drawn.
 */
const quiet = on.particles.map((f) => BERX_PARTICLE_KINDS[f[9]]);
const liveList = berxBuildDrawList(berxCrossRendererFrame(), {width: 480, height: 360});
const liveFields = liveList.particles.map((f) => BERX_PARTICLE_KINDS[f[9]]);
const energyField = liveList.particles.find((f) => BERX_PARTICLE_KINDS[f[9]] === 'energy');
const liveItem = liveList.items
	.map((i) => ({energy: i.emissive[0] + i.emissive[1] + i.emissive[2], at: [i.model[12], i.model[13], i.model[14]]}))
	.sort((a, b) => b.energy - a.energy)[0];
gate('energy exists only around something the world says is live, and is arranged around it',
	!quiet.includes('energy') &&
	liveFields.includes('energy') &&
	energyField !== undefined &&
	Math.abs(energyField[12] - liveItem.at[0]) < 1e-5 &&
	Math.abs(energyField[13] - liveItem.at[1]) < 1e-5 &&
	Math.abs(energyField[14] - liveItem.at[2]) < 1e-5 &&
	Math.abs(energyField[0] - 0x4f / 255) < 1e-6,
	`a world with nothing live carries ${quiet.join(' and ')} and NO energy field; the world with a live event carries ${liveFields.join(', ')}, and its energy field is centred on the brightest live entity at (${liveItem.at.map((v) => v.toFixed(2)).join(', ')}) in #4FD6E8. Rare by construction rather than by promise`);

if (!gpu?.on?.available) {
	blocked('webgpu-particles', gpu?.on?.reason ?? 'no WebGPU device here');
} else {
	let gpuChanged = 0;
	let agreeing = 0;
	for (let i = 0; i < gpu.on.rgba.length; i += 4) {
		const gpuAdded = (gpu.on.rgba[i] + gpu.on.rgba[i + 1] + gpu.on.rgba[i + 2]) - (gpu.off.rgba[i] + gpu.off.rgba[i + 1] + gpu.off.rgba[i + 2]);
		const glAdded = (on.rgba[i] + on.rgba[i + 1] + on.rgba[i + 2]) - (off.rgba[i] + off.rgba[i + 1] + off.rgba[i + 2]);
		if (gpuAdded > 0) gpuChanged++;
		if (gpuAdded > 0 === glAdded > 0) agreeing++;
	}
	const share = agreeing / (gpu.on.rgba.length / 4);
	gate('WebGPU draws the same field in the same places',
		gpuChanged > 200 && share > 0.99,
		`${gpuChanged} pixels lit by the fields on WebGPU, and ${(share * 100).toFixed(2)}% of all pixels agree with WebGL2 about whether a particle is there — one hash, four languages, no buffer to keep in sync`);
}

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D particles: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL PARTICLE GATES PASS');
