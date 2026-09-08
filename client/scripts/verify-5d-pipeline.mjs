#!/usr/bin/env node
/**
 * THE PIPELINE — do the three backends run the same passes, in the same
 * order, and does turning one off remove exactly the right ones?
 *
 * Every other gate in this repository compares PIXELS. That is the right
 * primary check and it has a blind spot big enough to drive two real
 * defects through, both of which were live in this repository:
 *
 *   WebGPU skipped the volumetric march whenever occlusion was off,
 *   because the two share a G-buffer and it gated the wrong one. Every
 *   gate ran with occlusion on, so every gate passed.
 *
 *   WebGL2 composited the air BEFORE the particles and WebGPU after.
 *   Both are additive, so the sum is identical and no pixel comparison
 *   could ever see it.
 *
 * Neither is visible in a frame. Both are visible the moment a backend
 * says what it did. So each renderer now records the name of every pass
 * at the point it encodes it, and this gate holds that record against
 * @berx/spatial's berxExpectedPasses — which derives the answer from the
 * declared dependencies rather than from a second hand-written list.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-pipeline-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const nodeEntry = path.join(dir, 'pipeline.mjs');
execFileSync(esbuild, [
	path.join(here, 'pipelinecore.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${nodeEntry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(nodeEntry);

/* ---------------- 1. the declaration is internally consistent ---------------- */

const violations = core.berxPipelineViolations();
gate('every stage\'s inputs are produced by something before it',
	violations.length === 0,
	violations.length ? violations.join('; ')
		: core.BERX_PIPELINE.map((s) => `${s.id}(${s.kind})`).join(' → ')
		+ ' — checked by walking the dependencies, not by reading the list and agreeing with it: a pipeline that is merely WRITTEN in order is a pipeline nobody has verified');

const kinds = core.BERX_PIPELINE.filter((s) => s.kind !== 'pass');
gate('the stages that are not passes say what they are instead',
	kinds.length > 0 && kinds.every((s) => s.why.length > 30),
	kinds.map((s) => `${s.id} is ${s.kind}`).join(', ')
	+ ' — IBL is a term in the world shader because berxEnvironment is a closed form, composition is coordinates in the draw list, and post does not exist. Written down rather than omitted, so a reader comparing the design to the code finds the difference explained');

const post = core.berxPipelineStage('post');
gate('what is not built says so',
	post?.kind === 'absent',
	`post: ${post?.why}`);

/* ---------------- 2. the dependency rules ---------------- */

const noShadow = core.berxExpectedPasses({shadows: false});
gate('no shadow map means no shaft, and the gate knows why',
	!noShadow.includes('volumetric') && !noShadow.includes('composite'),
	`with shadows off: ${noShadow.join(' → ')}. What the eye reads as a ray IS the boundary between lit and unlit air, so a march with nothing casting produces uniform haze — not a limitation to work around, the definition of a shaft`);

const noSsao = core.berxExpectedPasses({ssao: false});
gate('turning occlusion off leaves the G-buffer and the march alone',
	noSsao.includes('gbuffer') && noSsao.includes('volumetric') && !noSsao.includes('ssao'),
	`with occlusion off: ${noSsao.join(' → ')} — the G-buffer has two consumers, and this is the exact regression WebGPU shipped: it gated the buffer on one of them`);

const bare = core.berxExpectedPasses({ssao: false, volumetric: false, shadows: false, particles: false});
gate('with everything optional off, only the world is drawn',
	bare.join(',') === 'world,labels',
	`${bare.join(' → ')} — nothing optional is load-bearing for the surfaces`);

/* ---------------- 3. what the backends actually encoded ---------------- */

execFileSync(esbuild, [
	path.join(here, 'pipeline.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D pipeline</title>
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

let gl2, gpu, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_PIPELINE_PROBE !== 'undefined');
	gl2 = await page.evaluate(() => window.BERX_PIPELINE_PROBE.webgl2());
	gpu = await page.evaluate(async () => await window.BERX_PIPELINE_PROBE.webgpu());
} finally {
	await browser.close();
	server.close();
}

gate('the pipeline fixture renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

/** The six combinations the probe renders, and what each should encode. */
const EXPECT = {
	'everything': {},
	'no occlusion': {ssao: false},
	'no air': {volumetric: false},
	'no motes': {particles: false},
	'no shadows': {shadows: false},
	'nothing optional': {ssao: false, volumetric: false, particles: false, shadows: false},
};

/* The volumetric fixture has no labels, so no backend encodes that pass —
   which the expectation has to know, or it would fail every case for a
   reason that has nothing to do with the pipeline. */
const wanted = (name) => core.berxExpectedPasses({...EXPECT[name], labels: false});

const check = (backend, reported) => {
	const wrong = Object.keys(EXPECT).filter((name) => (reported[name] ?? []).join(',') !== wanted(name).join(','));
	gate(`${backend} encodes the declared pipeline, in order`,
		wrong.length === 0,
		wrong.length
			? wrong.map((n) => `${n}: encoded [${(reported[n] ?? []).join(' → ')}], expected [${wanted(n).join(' → ')}]`).join('; ')
			: Object.keys(EXPECT).map((n) => `${n}: ${(reported[n] ?? []).join(' → ')}`).join('  ·  '));
};

check('WebGL2', gl2);
if (!gpu?.available) {
	console.log('BLOCKED  webgpu-pipeline');
	console.log(`         ${gpu?.reason ?? 'no WebGPU device here'}`);
} else {
	check('WebGPU', gpu.out);
	/* The one that a pixel comparison structurally cannot make. */
	const same = Object.keys(EXPECT).every((n) => (gl2[n] ?? []).join(',') === (gpu.out[n] ?? []).join(','));
	gate('the two web backends run the SAME passes in the SAME order',
		same,
		same
			? Object.keys(EXPECT).map((n) => `${n}: ${(gl2[n] ?? []).join(' → ')}`).join('  ·  ')
			: Object.keys(EXPECT).filter((n) => (gl2[n] ?? []).join(',') !== (gpu.out[n] ?? []).join(',')).map((n) => `${n}: WebGL2 [${(gl2[n] ?? []).join(' → ')}] vs WebGPU [${(gpu.out[n] ?? []).join(' → ')}]`).join('; '));
}

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D pipeline: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL PIPELINE GATES PASS');
