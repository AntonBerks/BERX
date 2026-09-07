#!/usr/bin/env node
/**
 * Eight transitions, or eight names?
 *
 * That is the only interesting question about a transition system, and
 * it is not answered by a file existing or by eight entries in a
 * record. It is answered by rendering the SAME world, at the same
 * camera pose, with nothing different but the transition — and finding
 * that the pixels differ, per effect, in the way each effect claims.
 *
 * So this gate does three things, in order of how much they prove:
 *
 *  1. the specs are distinct and well-formed in the core (cheap, and
 *     catches a copied entry immediately);
 *  2. the DRAW LIST really carries each effect — which is what makes it
 *     reach WebGL2, WebGPU and the native backend identically, rather
 *     than being a web-only flourish;
 *  3. the same world rendered through the real WebGL2 backend produces
 *     a measurably different image per effect, read back as pixels.
 *
 * And one structural check that matters more than any of them: that
 * there is still exactly ONE camera transition. Eight effects arriving
 * as a second system that interpolates its own camera would be the
 * failure this whole architecture exists to prevent.
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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-transitions-'));

/* ---------------- 1. the specs, in the core ---------------- */
const coreBundle = path.join(dir, 'core.mjs');
execFileSync(esbuild, [
	path.join(here, 'transitions.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${coreBundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {
	BERX_TRANSITION_KINDS, berxTransitionSpec, berxTransitionModulation, berxTransitionArcOffset,
	berxTransitionForTravel, berxBuildDrawList, berxCrossRendererFrame, BERX_CROSS_RENDERER_VIEWPORT,
} = await import(`file://${coreBundle}`);

gate('there are eight, and each is a different shape rather than a different name',
	BERX_TRANSITION_KINDS.length === 8 &&
	new Set(BERX_TRANSITION_KINDS.map((k) => {
		const s = berxTransitionSpec(k);
		/* the whole signature of an effect: pacing, path and what it
		   does to the world at its midpoint */
		const m = s.modulate(0.5);
		return [s.durationSeconds, s.arcMetres, s.ease(0.25).toFixed(4), s.ease(0.75).toFixed(4), m.opacity, m.emissive, m.scale, m.fov].join('|');
	})).size === 8,
	BERX_TRANSITION_KINDS.map((k) => {
		const s = berxTransitionSpec(k);
		const m = s.modulate(0.5);
		return `${k} ${s.durationSeconds}s arc${s.arcMetres} o${m.opacity.toFixed(2)} e${m.emissive.toFixed(2)} s${m.scale.toFixed(2)} f${m.fov.toFixed(2)}`;
	}).join('; '));

gate('every easing really starts at the start and ends at the end',
	BERX_TRANSITION_KINDS.every((k) => {
		const {ease} = berxTransitionSpec(k);
		return ease(0) === 0 && ease(1) === 1 && Number.isFinite(ease(0.5));
	}),
	'a curve that does not reach 1 leaves the camera short of where the world says it is — checked for all eight, at both ends');

const identity = (m) => m.opacity === 1 && m.emissive === 0 && m.scale === 1 && m.fov === 1;
const startsClean = BERX_TRANSITION_KINDS.filter((k) => identity(berxTransitionModulation(k, 0)));
gate('a transition leaves no trace once it is over, and only the cut announces itself at the start',
	BERX_TRANSITION_KINDS.every((k) => identity(berxTransitionModulation(k, 1))) &&
	identity(berxTransitionModulation(undefined, 0.5)) &&
	/* teleport is deliberately NOT the identity at t=0: its flash IS the
	   cut, and a cut acknowledged one frame late reads as a glitch. It
	   is the only exception, and the gate names it rather than loosening
	   the rule for everyone. */
	startsClean.length === 7 && !startsClean.includes('teleport'),
	`all eight are the identity at t=1 and no transition at all is the identity everywhere — so a world mid-collapse is exactly the world it was when the transition ends. Seven are also the identity at t=0; teleport is not, because its flash is the cut (${berxTransitionModulation('teleport', 0).emissive} emissive at the instant it happens)`);

gate('the same navigation always gets the same transition, decided in one table',
	berxTransitionForTravel('back') === 'collapse' &&
	berxTransitionForTravel('live') === 'bloom' &&
	berxTransitionForTravel('return') === 'teleport' &&
	berxTransitionForTravel('focus') === 'flow' &&
	new Set(['travel', 'travel-far', 'back', 'focus', 'live', 'time', 'region', 'return'].map(berxTransitionForTravel)).size >= 6,
	'a journey feels the same whether it started at a keyboard, a pointer, the action ring or a realtime event — because the choice is made from what the navigation MEANS, once');

gate('only one kind leaves the straight line, and it is the one that says it does',
	berxTransitionArcOffset('fold', 0.5) > 3 &&
	berxTransitionArcOffset('wormhole', 0.5) === 0 &&
	berxTransitionArcOffset(undefined, 0.5) === 0 &&
	BERX_TRANSITION_KINDS.filter((k) => berxTransitionSpec(k).arcMetres > 2).length === 1,
	`fold lifts ${berxTransitionArcOffset('fold', 0.5).toFixed(2)}m off the straight line at its midpoint; it is the only kind you can recognise from the camera path alone`);

/* ---------------- 2. the draw list carries it ---------------- */
const listFor = (kind) => berxBuildDrawList(
	berxCrossRendererFrame(kind ? {transition: {kind, progress: 0.5}} : {}),
	{width: BERX_CROSS_RENDERER_VIEWPORT.width, height: BERX_CROSS_RENDERER_VIEWPORT.height},
);
const baseline = listFor(undefined);
/**
 * Everything about the list an effect can change: the projection (a
 * dolly-zoom lives there, not on the camera) and each item's opacity,
 * emissive and model matrix.
 *
 * The projection was missing at first, and the gate correctly reported
 * that `flow` — whose whole effect is a slow breath of the field of
 * view — did nothing. It was the signature that was incomplete, not
 * the effect; the pixel readback below is what settled which.
 */
const signature = (list) => [
	list.projection.map((v) => v.toFixed(6)).join(','),
	...list.items.map((i) =>
		[i.id, i.opacity.toFixed(4), i.emissive.map((v) => v.toFixed(4)).join(','), i.model.map((v) => v.toFixed(4)).join(',')].join('|')),
].join(';');
const baseSignature = signature(baseline);
const changed = BERX_TRANSITION_KINDS.filter((k) => signature(listFor(k)) !== baseSignature);
gate('every effect really reaches the draw list, which is what makes it reach all three backends',
	changed.length === 8,
	changed.length === 8
		? 'all eight change the opacity, the emissive term or the model matrix of the shared draw list — so WebGL2, WebGPU and the native backend show the same transition and the cross-renderer pixel comparison stays meaningful'
		: `these do nothing to the list, and so would be a name only: ${BERX_TRANSITION_KINDS.filter((k) => !changed.includes(k)).join(', ')}`);

const listSignatures = new Map(BERX_TRANSITION_KINDS.map((k) => [k, signature(listFor(k))]));
gate('no two effects produce the same draw list',
	new Set(listSignatures.values()).size === 8,
	'eight distinct lists from one world — the difference between two of them is the effect and nothing else');

/* ---------------- the structural rule ---------------- */
const camera = fs.readFileSync(path.join(clientRoot, 'packages/spatial/src/spatialCamera.ts'), 'utf8');
const transitions = fs.readFileSync(path.join(clientRoot, 'packages/spatial/src/transitions.ts'), 'utf8');
gate('there is still exactly one camera transition',
	(camera.match(/class BerxCameraTransition/g) ?? []).length === 1 &&
	!/class \w*Transition\w*System/.test(transitions) &&
	!/private\s+\w*elapsed|step\s*\(/.test(transitions),
	'transitions.ts holds specs and no state: it never interpolates a camera, never steps a clock and defines no second system. BerxCameraTransition remains the only thing that moves the camera — two systems interpolating one camera is how a world ends up with a pose nothing agrees on');

/* ---------------- 3. the pixels ---------------- */
execFileSync(esbuild, [
	path.join(here, '5d-crossrender.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D transitions</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block}</style></head>
<body><canvas id="world"></canvas><canvas id="gpu"></canvas><script type="module" src="./world.js"></script></body></html>`);

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

let rendered;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	rendered = await page.evaluate((kinds) => {
		const out = {};
		out.none = window.BERX_CROSS.render();
		for (const kind of kinds) out[kind] = window.BERX_CROSS.renderTransition(kind, 0.5);
		return out;
	}, [...BERX_TRANSITION_KINDS]);
	if (errors.length > 0) gate('the real backend renders every transition without errors', false, errors.join(' | '));
	else gate('the real backend renders every transition without errors', true, `${BERX_TRANSITION_KINDS.length} transitions plus the untouched world, drawn by the real WebGL2 backend`);
} finally {
	await browser.close();
	server.close();
}

/** Mean luminance and lit-pixel count: what an effect changes about an image. */
const measure = (image) => {
	const px = image.rgba;
	let sum = 0;
	let lit = 0;
	for (let i = 0; i < px.length; i += 4) {
		const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
		sum += l;
		/* the ground is #07080A ≈ 8; anything meaningfully above it is world */
		if (l > 14) lit++;
	}
	return {mean: sum / (px.length / 4), lit};
};

const none = measure(rendered.none);
const measured = Object.fromEntries(BERX_TRANSITION_KINDS.map((k) => [k, measure(rendered[k])]));

const differs = BERX_TRANSITION_KINDS.filter((k) =>
	Math.abs(measured[k].mean - none.mean) > 0.05 || Math.abs(measured[k].lit - none.lit) > 40);
gate('every effect changes the actual pixels, measured on a real GPU readback',
	differs.length === 8,
	differs.length === 8
		? BERX_TRANSITION_KINDS.map((k) => `${k} Δmean ${(measured[k].mean - none.mean).toFixed(2)} Δlit ${measured[k].lit - none.lit}`).join('; ')
		: `these rendered identically to no transition at all: ${BERX_TRANSITION_KINDS.filter((k) => !differs.includes(k)).join(', ')}`);

gate('the effects that add light really add it, and the ones that take it away really do',
	measured.bloom.mean > none.mean &&
	measured.teleport.mean > none.mean &&
	measured.dissolve.lit < none.lit &&
	measured.collapse.lit < none.lit,
	`bloom ${measured.bloom.mean.toFixed(2)} and teleport ${measured.teleport.mean.toFixed(2)} against ${none.mean.toFixed(2)} untouched; dissolve leaves ${measured.dissolve.lit} lit pixels and collapse ${measured.collapse.lit} against ${none.lit} — brighter is brighter and thinner is thinner, in the readback rather than in the intent`);

const byImage = new Set(BERX_TRANSITION_KINDS.map((k) => rendered[k].rgba.join(',')));
gate('no two effects render the same image',
	byImage.size === 8,
	'eight distinct framebuffers from one world, one camera and one set of lights');

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D transitions: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL TRANSITION GATES PASS');
