#!/usr/bin/env node
/**
 * TEMPORAL STABILITY — does the picture flicker when nothing is
 * happening?
 *
 * Every other gate here renders a FRAME. Flicker does not exist in a
 * frame: a still image in which an object is drawn and a still image in
 * which it is not are both perfectly correct, and the defect is the
 * pair. So this one renders a sequence — a camera creeping forward at a
 * hundredth of a unit a frame, slower than any person would move — and
 * looks at what changes between consecutive frames.
 *
 * At that speed the picture must change by a fraction of a pixel per
 * frame. So any frame that JUMPS is not the world moving; it is a
 * decision flipping. And the runtime makes several yes/no decisions per
 * frame out of continuous quantities — is this near enough for full
 * geometry, does it fit the budget, can this device afford the expensive
 * tier — every one of which was a bare threshold, and a bare threshold
 * on a quantity that wobbles flips every frame.
 *
 * THE CONTROL IS THE POINT. The same walk is rendered twice: once
 * carrying the previous frame's decisions forward, once deciding
 * everything afresh. A single sequence cannot say whether it is stable —
 * stable compared with what? The difference between the two runs is the
 * measurement, and it is also the proof that the fixture can show the
 * defect at all.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-stability-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const nodeEntry = path.join(dir, 'stability.mjs');
execFileSync(esbuild, [
	path.join(here, 'stabilitycore.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${nodeEntry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(nodeEntry);

/* ---------------- 1. the decisions, on their own ---------------- */

/** An object sitting AT the threshold while the camera breathes. */
const D = core.BERX_LOD_DISTANCE;
let lod = 0;
const wobble = [];
for (let i = 0; i < 200; i++) {
	/* a tenth of a metre of noise: far more than a real camera drift */
	const distance = D + Math.sin(i * 1.7) * 0.1;
	const next = core.berxStableLod(distance, D, lod);
	if (next !== lod) wobble.push(i);
	lod = next;
}
gate('an object standing at the LOD distance never changes geometry',
	wobble.length === 0,
	`200 frames of ±0.1m noise across a ${D}m threshold, ${wobble.length} geometry changes — a bare threshold would swap its mesh on roughly half of them, sixty times a second, and that is what flicker IS: not a rendering artefact, a decision boundary`);

/* And it must still change when the object genuinely goes somewhere. */
let far = 0, near = 1, changes = 0;
for (let i = 0; i < 60; i++) {
	const next = core.berxStableLod(D - 5 + i * 0.25, D, far);
	if (next !== far) changes++;
	far = next;
}
for (let i = 0; i < 60; i++) {
	const next = core.berxStableLod(D + 10 - i * 0.25, D, near);
	if (next !== near) changes++;
	near = next;
}
gate('an object that really travels does change geometry',
	far === 1 && near === 0 && changes === 2,
	`crossing outward then inward over 15m: ${changes} changes, ending reduced then full — the band makes a state sticky, not permanent. A filter would have added lag to every decision including the ones that should be instant`);

/* The budget's edge: two objects a hair apart at ranks N and N+1. */
const incumbent = core.berxBudgetDistance(10.0, true);
const challenger = core.berxBudgetDistance(10.0 - 0.2, false);
const decisive = core.berxBudgetDistance(10.0 - 3, false);
gate('an object already on screen is not displaced by a hair',
	incumbent < challenger && incumbent > decisive,
	`on screen at 10.0m competes as ${incumbent.toFixed(2)}m; something 0.2m nearer competes as ${challenger.toFixed(2)}m and does NOT take its place; something 3m nearer competes as ${decisive.toFixed(2)}m and does — being dropped from the frame is a bigger event than losing a few triangles, so it takes a little more provocation to undo`);

/* The tier, against a measurement that cannot make up its mind. */
let settling = core.berxTierSettled('high');
const flapped = [];
for (let i = 0; i < 120; i++) {
	settling = core.berxSettleTier(settling, i % 2 ? 'medium' : 'high');
	flapped.push(settling.tier);
}
gate('a flapping measurement never changes the render tier',
	flapped.every((t) => t === 'high'),
	`120 frames alternating high/medium: the tier stayed ${flapped[flapped.length - 1]} throughout. A device alternating between two tiers has not quietly become the second one — it is on the boundary, and the right answer on a boundary is to stay put. The run RESETS on disagreement rather than decaying`);

let settled = core.berxTierSettled('high');
let changedAt = -1;
for (let i = 0; i < 40; i++) {
	settled = core.berxSettleTier(settled, 'low');
	if (settled.tier === 'low' && changedAt < 0) changedAt = i + 1;
}
gate('a measurement that keeps saying the same thing does change it',
	settled.tier === 'low' && changedAt === core.BERX_TIER_SETTLE_FRAMES,
	`${core.BERX_TIER_SETTLE_FRAMES} consecutive frames of agreement moved high → low, on frame ${changedAt} — a fifth of a second, fast enough that a device genuinely struggling is helped almost at once and slow enough that one long frame during a texture upload cannot do it`);

/* ---------------- 2. the pixels, over a sequence ---------------- */

execFileSync(esbuild, [
	path.join(here, 'stability.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D stability</title>
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

let walked, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_STABILITY !== 'undefined');
	walked = await page.evaluate(() => window.BERX_STABILITY.walk(48, 6));
} finally {
	await browser.close();
	server.close();
}

gate('the walk renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

/** How many pixels changed between two consecutive frames, and by how much. */
const between = (a, b) => {
	let moved = 0, worst = 0;
	for (let i = 0; i < a.length; i += 4) {
		let d = 0;
		for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a[i + k] - b[i + k]));
		if (d > 8) moved++;
		if (d > worst) worst = d;
	}
	return {moved, worst};
};

const deltas = (run) => run.shots.slice(1).map((s, i) => between(run.shots[i], s));

const stable = deltas(walked.withMemory);
const control = deltas(walked.withoutMemory);

/**
 * A pop is a frame that changes far more than its neighbours.
 *
 * Measured against the run's own median rather than a fixed number: the
 * world is moving, so every frame changes, and the question is whether
 * ONE of them changes out of proportion. That is what a decision flip
 * looks like and it is what a smooth walk cannot otherwise produce.
 */
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const pops = (ds) => {
	const mid = Math.max(1, median(ds.map((d) => d.moved)));
	return ds.map((d, i) => ({frame: i + 1, ...d, ratio: d.moved / mid})).filter((d) => d.ratio > 6);
};

const stablePops = pops(stable);
const controlPops = pops(control);

gate('a slow walk produces no frame that jumps',
	stablePops.length === 0,
	stablePops.length
		? stablePops.map((p) => `frame ${p.frame}: ${p.moved} pixels moved, ${p.ratio.toFixed(1)}x the median`).join('; ')
		: `${stable.length} frame pairs, median ${median(stable.map((d) => d.moved))} pixels moved, worst ${Math.max(...stable.map((d) => d.moved))} — the camera advances a hundredth of a unit a frame, so any frame changing six times the median would be a decision flipping rather than the world moving`);

/**
 * The control run has to actually SHOW something, or the check above is
 * measuring a fixture that could not fail.
 */
const lodFlips = (run) => {
	let n = 0;
	for (let i = 1; i < run.lods.length; i++) {
		for (const id of Object.keys(run.lods[i])) {
			if (run.lods[i - 1][id] !== undefined && run.lods[i - 1][id] !== run.lods[i][id]) n++;
		}
	}
	return n;
};
const drawnFlips = (run) => {
	let n = 0;
	for (let i = 1; i < run.drawn.length; i++) {
		const before = new Set(run.drawn[i - 1]);
		const after = new Set(run.drawn[i]);
		for (const id of after) if (!before.has(id)) n++;
		for (const id of before) if (!after.has(id)) n++;
	}
	return n;
};

const stableFlips = lodFlips(walked.withMemory) + drawnFlips(walked.withMemory);
const controlFlips = lodFlips(walked.withoutMemory) + drawnFlips(walked.withoutMemory);
/**
 * The control has to actually FAIL, or the check above is measuring a
 * fixture that could not have failed.
 *
 * The first version of this fixture was a pure walk, and none of its
 * objects happened to sit on a decision boundary during it: neither run
 * flickered, the control showed nothing, and the gate said so rather
 * than claiming a win. So the camera is now placed with one object
 * standing EXACTLY at the LOD distance and given a twelve-centimetre
 * drift — the size of a hand holding a phone. That is the condition a
 * bare threshold cannot survive, and this is the check that says the two
 * runs really do differ under it.
 */
gate('carrying the last frame\'s decisions forward is what makes it steady',
	controlFlips > 0 && stableFlips < controlFlips,
	`over the same drift, with one object standing exactly at the ${core.BERX_LOD_DISTANCE}m boundary: ${stableFlips} decision changes with a memory against ${controlFlips} without`
	+ (controlFlips > 0
		? ' — the control run is the proof this fixture can show the defect at all, and the difference between them is the whole claim'
		: ' — the CONTROL DID NOT FLICKER, so this fixture cannot demonstrate anything and the check above is measuring nothing. Place an object on a boundary or this gate is decoration'));

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D stability: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL STABILITY GATES PASS');
