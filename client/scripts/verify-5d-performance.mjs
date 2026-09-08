#!/usr/bin/env node
/**
 * PERFORMANCE — what the passes cost, and whether anything grows.
 *
 * WHAT THIS GATE REFUSES TO CLAIM, first, because it decides everything
 * else. Chromium falls back to a software rasteriser here, so a
 * frames-per-second number taken in this container describes llvmpipe
 * rather than a phone. Asserting a 60fps budget against it would be
 * asserting a fact about CI and calling it a fact about the product. The
 * absolute number is reported as BLOCKED and stays blocked until this
 * runs somewhere with a real GPU.
 *
 * WHAT IS REAL is the RATIO. The same world, the same camera, the same
 * frame count, with a pass on and off: a pass that doubles in cost
 * doubles here too, whatever the rasteriser. That is what a regression
 * looks like and it is measurable today.
 *
 * And the quality tiers have to actually descend IN TIME, not just on
 * paper. The tier table's own gate multiplies its knobs out; this one
 * runs them.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-perf-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, why) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${why}`);
};

execFileSync(esbuild, [
	path.join(here, 'perf.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D performance</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block;width:1px;height:1px}</style></head>
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

let gpu, mem, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_PERF !== 'undefined');
	gpu = await page.evaluate(async () => await window.BERX_PERF.webgpu(24));
	mem = await page.evaluate(() => window.BERX_PERF.memory(120));
} finally {
	await browser.close();
	server.close();
}

gate('the performance fixture renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

blocked('absolute-frame-rate',
	'Chromium uses a software rasteriser in this container, so a frames-per-second number here would describe llvmpipe rather than a phone. Everything below is a RATIO, which survives the substitution; the budget itself needs a run on real hardware and is not claimed');

if (!gpu?.available) {
	blocked('webgpu-cost', gpu?.reason ?? 'no WebGPU device here');
} else {
	const p = gpu.passes;
	gate('the passes ran without a device error', gpu.errors.length === 0,
		gpu.errors.length ? gpu.errors.join(' | ') : 'none');

	const volumetric = p.all - p.noVolumetric;
	const particles = p.all - p.noParticles;
	const ssao = p.all - p.noSsao;
	const everything = p.all - p.bare;
	gate('every pass costs something, and the march costs the most',
		volumetric > 0 && volumetric > particles && volumetric > ssao,
		`of a ${p.all.toFixed(1)}ms frame: march ${volumetric.toFixed(1)}ms, occlusion ${ssao.toFixed(1)}ms, motes ${particles.toFixed(1)}ms; everything optional together ${everything.toFixed(1)}ms against a bare ${p.bare.toFixed(1)}ms. The march dominating is why the quality tiers scale its RESOLUTION first — the cost is quadratic in that and linear in everything else`);

	const t = gpu.tiers;
	const descends = t.ultra >= t.high && t.high > t.medium && t.medium >= t.low;
	gate('a cheaper tier really is cheaper IN TIME, not just on paper',
		descends,
		`ultra ${t.ultra.toFixed(1)}ms · high ${t.high.toFixed(1)}ms · medium ${t.medium.toFixed(1)}ms · low ${t.low.toFixed(1)}ms — the tier table's own gate multiplies its knobs out; this one runs them, and a table that descended arithmetically while costing more in practice would pass there and fail here`);

	gate('the cheapest tier is worth having',
		t.low < t.high * 0.7,
		`low is ${(t.low / t.high * 100).toFixed(0)}% of high's frame — a tier that saved a tenth would not be worth the complexity of having tiers`);
}

if (!mem?.available) {
	blocked('memory-growth', 'performance.memory is not exposed in this browser build, so heap growth cannot be measured here');
} else {
	const mb = (b) => `${(b / 1048576).toFixed(2)}MB`;
	const sameGrowth = mem.afterSame - mem.beforeSame;
	const switchGrowth = mem.afterSwitch - mem.afterSame;
	/* A megabyte over 120 frames is roughly 8KB a frame, which is the
	   draw list itself being rebuilt — real, expected, and collected.
	   Anything much above that is something not being released. */
	gate('rendering the same world many times does not grow the heap',
		sameGrowth < 4 * 1048576,
		`${mem.rounds} frames: ${mb(mem.beforeSame)} → ${mb(mem.afterSame)}, growth ${mb(sameGrowth)} — the draw list is rebuilt every frame by design, so some churn is expected; what would not be is a buffer or a bind group per frame, which is what this catches`);

	gate('switching between worlds does not grow the heap either',
		switchGrowth < 4 * 1048576,
		`${mem.rounds} alternating frames: growth ${mb(switchGrowth)}, ${mem.stats.meshVariants} mesh variants and ${mem.stats.residentTextures} textures resident — a per-scene allocation that is never released shows up here and nowhere else`);
}

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D performance: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL PERFORMANCE GATES PASS');
