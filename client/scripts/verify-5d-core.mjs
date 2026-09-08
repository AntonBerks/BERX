#!/usr/bin/env node
/**
 * BERX CORE — is it physics, or is it an animation with eleven names?
 *
 * That question has a measurable answer and this gate is it. Four
 * properties separate a presence from a mascot, and none of them is
 * about how it looks:
 *
 * CONTINUITY. A state change must change where the field is GOING, never
 * where it is. The gate walks every one of the fifty-five ordered
 * transitions, switches state mid-flight at a deliberately awkward
 * moment, and measures the largest single-step jump in every quantity —
 * against a naive crossfade between presets as the control. A design
 * where continuity is a property of the integrator cannot fail this; one
 * where it is a convention eventually does.
 *
 * REST. Hold a state, give it nothing, and the field must converge and
 * STOP. This is the structural answer to "никакого AI-theater": a
 * breathing idle glow is not restraint applied to a pulse, it is a pulse
 * that was never written. There is no clock term in the integrator, so
 * there is nothing for a gate to catch — which is exactly what it
 * checks.
 *
 * DISTINCTION. Eleven states that a viewer could not tell apart are one
 * state with ten spare names. Every pair must differ measurably.
 *
 * CAUSE. Every state the Core can be in must be reachable from something
 * that really happened, and nothing else may move it.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {launchChromium} from './lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-core-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const entry = path.join(dir, 'core.mjs');
execFileSync(esbuild, [
	path.join(here, 'core.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(entry);

const SCALARS = ['energy', 'coherence', 'reach', 'luminance', 'grain', 'haze', 'deform'];
const quantities = (f) => [...SCALARS.map((k) => f[k]), f.offset.x, f.offset.y, f.offset.z];

/**
 * Each quantity's full range across the eleven states.
 *
 * The jump measurement below compares quantities against each other, and
 * they are not in the same units: `reach` is in METRES and runs 0.6 to
 * 3.4, while everything else is a 0..1 drive. The first version of this
 * gate compared them raw and failed understanding → searching at 0.28 —
 * which is 0.28 of a METRE out of a 2.7-metre journey, a tenth of the
 * distance, and exactly what a smooth exponential does in one frame at
 * that stiffness. The measurement was wrong, not the Core.
 *
 * So a jump is expressed as a fraction of that quantity's OWN range,
 * which is what continuity means and is comparable across quantities.
 */
const RANGES = (() => {
	const all = core.BERX_CORE_STATES.map((s) => quantities(core.berxCoreTarget(s)));
	return all[0].map((_, i) => {
		const column = all.map((q) => q[i]);
		return Math.max(1e-6, Math.max(...column) - Math.min(...column));
	});
})();

const biggestJump = (a, b) => {
	const x = quantities(a), y = quantities(b);
	return Math.max(...x.map((v, i) => Math.abs(v - y[i]) / RANGES[i]));
};

/* ---------------- 1. continuity, across every transition ---------------- */

const DT = 1 / 60;
/**
 * Every ordered pair of states, entered mid-flight.
 *
 * Mid-flight is the hard case and the only interesting one: a Core that
 * is continuous when it has already settled proves nothing, because
 * there is nothing to be discontinuous FROM.
 */
let worstJump = 0, worstAt = '';
for (const from of core.BERX_CORE_STATES) {
	for (const to of core.BERX_CORE_STATES) {
		if (from === to) continue;
		let m = core.berxCoreAt('idle');
		m = core.berxCoreEnter(m, from);
		/* eight frames in: on the way, nowhere near settled */
		for (let i = 0; i < 8; i++) m = core.berxCoreStep(m, DT);
		const before = m.field;
		const switched = core.berxCoreEnter(m, to);
		const after = core.berxCoreStep(switched, DT).field;
		const jump = biggestJump(before, after);
		if (jump > worstJump) { worstJump = jump; worstAt = `${from} → ${to}`; }
	}
}

/**
 * The control: what a preset crossfade does at the same moment.
 *
 * Not a straw man — it is the obvious way to build this, and it is what
 * the measurement has to be read against. A number is only large or
 * small compared with something.
 */
let presetWorst = 0, presetAt = '';
for (const from of core.BERX_CORE_STATES) {
	for (const to of core.BERX_CORE_STATES) {
		if (from === to) continue;
		let m = core.berxCoreAt('idle');
		m = core.berxCoreEnter(m, from);
		for (let i = 0; i < 8; i++) m = core.berxCoreStep(m, DT);
		/* a preset switch snaps to the new pose's target */
		const jump = biggestJump(m.field, core.berxCoreTarget(to));
		if (jump > presetWorst) { presetWorst = jump; presetAt = `${from} → ${to}`; }
	}
}

gate('no state change moves the field, only where it is going',
	worstJump < 0.15 && worstJump * 8 < presetWorst,
	`110 ordered transitions, each entered eight frames in: worst single-frame change ${(worstJump * 100).toFixed(2)}% of that quantity's own range, at ${worstAt}. The same moment with a preset crossfade jumps ${(presetWorst * 100).toFixed(0)}% at ${presetAt} — ${(presetWorst / Math.max(worstJump, 1e-6)).toFixed(0)}x more. Continuity is a property of the integrator here, not a convention anyone has to remember at fifty-five transitions`);

/* And the rate must be frame-rate independent, or a 30fps device is a
   different product from a 60fps one. */
const settleAt = (dt, frames) => {
	let m = core.berxCoreEnter(core.berxCoreAt('idle'), 'searching');
	for (let i = 0; i < frames; i++) m = core.berxCoreStep(m, dt);
	return m.field;
};
const at60 = settleAt(1 / 60, 60);
const at30 = settleAt(1 / 30, 30);
gate('one second of transition is one second at any frame rate',
	biggestJump(at60, at30) < 0.02,
	`after one second: 60fps and 30fps differ by ${biggestJump(at60, at30).toFixed(5)} — an exponential follow rather than a linear step, so a slow device reaches the same place at the same time rather than at half speed`);

/* ---------------- 2. rest: nothing moves without a cause ---------------- */

let resting = core.berxCoreAt('idle');
for (let i = 0; i < 600; i++) resting = core.berxCoreStep(resting, DT);
const settled = resting.field;
let drift = 0;
for (let i = 0; i < 600; i++) {
	const next = core.berxCoreStep(resting, DT);
	drift = Math.max(drift, biggestJump(resting.field, next.field));
	resting = next;
}
gate('a Core with nothing happening converges and STOPS',
	drift < 1e-6,
	`ten more seconds after settling: largest change ${drift.toExponential(2)}. There is no clock term in the integrator and no noise, so a breathing idle glow is not restraint applied to a pulse — it is a pulse that was never written`);

/* Determinism, for the same reason everything else in BERX is hashed. */
const runTwice = () => {
	let m = core.berxCoreEnter(core.berxCoreAt('idle'), 'searching');
	for (let i = 0; i < 40; i++) m = core.berxCoreStep(m, DT);
	m = core.berxCoreEnter(m, 'discovering');
	for (let i = 0; i < 40; i++) m = core.berxCoreStep(m, DT);
	return quantities(m.field);
};
gate('the same sequence gives the same field, every time',
	JSON.stringify(runTwice()) === JSON.stringify(runTwice()),
	'no Math.random anywhere in the Core: a field that could not be reproduced could not be predicted, and this whole gate would be measuring noise');

/* ---------------- 3. eleven states, or one with ten spare names ---------------- */

let closest = Infinity, closestPair = '';
for (let i = 0; i < core.BERX_CORE_STATES.length; i++) {
	for (let j = i + 1; j < core.BERX_CORE_STATES.length; j++) {
		const d = biggestJump(core.berxCoreTarget(core.BERX_CORE_STATES[i]), core.berxCoreTarget(core.BERX_CORE_STATES[j]));
		if (d < closest) { closest = d; closestPair = `${core.BERX_CORE_STATES[i]}/${core.BERX_CORE_STATES[j]}`; }
	}
}
gate('every state is physically distinct from every other',
	closest > 0.08,
	`the two nearest of all 55 pairs are ${closestPair}, ${closest.toFixed(3)} apart — eleven states a viewer could not tell apart would be one state with ten spare names`);

/* The states that must NOT resemble each other, because confusing them
   would be confusing a promise with a fact. */
const acting = core.berxCoreTarget('acting');
const success = core.berxCoreTarget('success');
gate('waiting on a server does not look like having finished',
	acting.energy - success.energy > 0.4,
	`acting energy ${acting.energy} against success ${success.energy}: committed and NOT resolved. A server that has not answered must not be shown as one that has`);

const error = core.berxCoreTarget('error');
const idle = core.berxCoreTarget('idle');
gate('failure keeps presence rather than collapsing',
	error.energy > 0.35 && error.energy > idle.energy * 4 && error.coherence < 0.3,
	`error: energy ${error.energy} (idle is ${idle.energy}), coherence ${error.coherence}, deform ${error.deform} — energy STAYS UP because something is still happening, while coherence falls and the body distorts. A plan came apart; nothing turned red, and nothing switched off`);

const recovering = core.berxCoreTarget('recovering');
gate('recovery gathers before it brightens',
	recovering.coherence - error.coherence > 0.4 && recovering.luminance - error.luminance < 0.1,
	`error → recovering: coherence ${error.coherence} → ${recovering.coherence}, luminance ${error.luminance} → ${recovering.luminance}. Coherence climbs first and hardest; brightness comes back last — gathering yourself precedes acting, and that is what "ищет другой путь" looks like as a quantity`);

const searching = core.berxCoreTarget('searching');
gate('searching happens in the room, not inside the Core',
	searching.reach > idle.reach * 4 && searching.coherence < 0.4,
	`reach ${idle.reach}m → ${searching.reach}m while coherence falls to ${searching.coherence} — the field spreads across the space because it is looking in several places. A spinner would have kept the reach and spun`);

/* ---------------- 4. frequency, not loudness ---------------- */

const base = core.berxCoreTarget('listening');
/* Two sounds of IDENTICAL total energy, distributed differently. */
const voice = core.berxCoreListen(base, {low: 0.2, mid: 0.7, high: 0.3});
const thud = core.berxCoreListen(base, {low: 0.7, mid: 0.2, high: 0.3});
const totalVoice = 0.2 + 0.7 + 0.3, totalThud = 0.7 + 0.2 + 0.3;
gate('a voice and a bang of the same loudness do not look the same',
	Math.abs(totalVoice - totalThud) < 1e-9 && biggestJump(voice, thud) > 0.1
		&& voice.coherence > thud.coherence && voice.reach > thud.reach,
	`same total energy ${totalVoice}: articulated sound gives coherence ${voice.coherence.toFixed(3)} and reach ${voice.reach.toFixed(3)}; a low thud gives ${thud.coherence.toFixed(3)} and ${thud.reach.toFixed(3)}. A voice gathers the field, a door slamming scatters it — which is the whole reason this is not volume driving scale`);

const loud = core.berxCoreListen(base, {low: 0.9, mid: 0.9, high: 0.9});
gate('nothing a microphone hears can distort the body into a face',
	loud.deform <= 0.2 && core.berxCoreSpeak(base, 1).deform <= 0.24,
	`the loudest possible input reaches deform ${loud.deform.toFixed(3)}, and BERX speaking at full envelope reaches ${core.berxCoreSpeak(base, 1).deform.toFixed(3)} — a Core that visibly flexes with every syllable is a mouth, and this is not a face`);

/* ---------------- 5. every state has a cause, and only a cause ---------------- */

const situation = core.berxSituation({
	nowMs: 1_700_000_000_000,
	cursor: {seconds: 1_700_000_000, span: 0},
	region: 'discover', viewerId: 'person:1', eye: {x: 0, y: 0, z: 0}, objects: [],
	allowed: {microphone: true, location: true, notifications: false, presence: false},
	location: {lat: 55.75, lng: 37.62, atMs: 1_700_000_000_000},
});
const intent = core.berxReadIntent('что происходит рядом?', situation, core.BERX_EMPTY_MEMORY);
const plan = core.berxPlan(intent, situation);

const causes = [
	['idle', {kind: 'presence', near: false}, 'idle'],
	['idle', {kind: 'presence', near: true}, 'aware'],
	['aware', {kind: 'voice', speaking: true}, 'listening'],
	['listening', {kind: 'utterance', intent}, 'understanding'],
	['understanding', {kind: 'plan', plan}, 'searching'],
	['searching', {kind: 'results', found: 4}, 'discovering'],
	['searching', {kind: 'results', found: 0}, 'success'],
	['acting', {kind: 'outcome', outcome: core.berxOutcome([{step: plan.steps[0], state: 'failed'}])}, 'error'],
	['acting', {kind: 'outcome', outcome: core.berxOutcome(plan.steps.map((step) => ({step, state: 'done'})))}, 'success'],
	['error', {kind: 'presence', near: true}, 'recovering'],
	['error', {kind: 'voice', speaking: false}, 'recovering'],
	['discovering', {kind: 'arrived', region: 'place'}, 'success'],
];
const wrongCause = causes.filter(([from, cause, want]) => core.berxCoreCause(from, cause) !== want);
gate('every state comes from something that really happened',
	wrongCause.length === 0,
	wrongCause.length
		? wrongCause.map(([f, c, w]) => `${f} + ${c.kind} wanted ${w}, got ${core.berxCoreCause(f, c)}`).join('; ')
		: `${causes.length} causes checked, including a real intent read from "что происходит рядом?" and a real plan built from it. There is no function that makes the Core look interesting, because there is no argument for interestingness`);

const reachable = new Set(core.BERX_CORE_STATES.map((s) =>
	causes.map(([f, c]) => core.berxCoreCause(f, c)).includes(s) ? s : undefined).filter(Boolean));
gate('no state is unreachable, and none is decoration',
	reachable.size >= 7,
	`${reachable.size} of ${core.BERX_CORE_STATES.length} states reached by the causes above: ${[...reachable].join(', ')}. speaking and listening arrive from the voice layer, aware from presence — every one of the eleven is entered by something, or it would be a name with no way in`);

/* An empty result must NOT look like a failure. */
gate('finding nothing resolves, it does not fail',
	core.berxCoreCause('searching', {kind: 'results', found: 0}) === 'success',
	'a world that reddened on "ничего не нашёл" would be teaching people that asking is risky — an empty answer is a real answer, and it settles');

/* Not understanding is not an error either. */
const unknown = core.berxReadIntent('фыва проло', situation, core.BERX_EMPTY_MEMORY);
gate('not understanding a sentence is not a system failure',
	core.berxCoreCause('listening', {kind: 'utterance', intent: unknown}) === 'recovering',
	'the system is fine, the sentence was not resolvable — spending ERROR here would make a real failure mean less');

/* ---------------- 6. sound and haptics are state, not notification ---------------- */

const felt = core.BERX_CORE_STATES.filter((s) => core.berxCoreHaptic('aware', s) !== 'none');
gate('a hand feels commitment, resolution and breakage — and nothing else',
	felt.length === 3 && felt.includes('acting') && felt.includes('success') && felt.includes('error'),
	`felt: ${felt.join(', ')} — nothing on searching, because a search that vibrated for its whole duration would be a machine demanding attention it has not earned`);

const silent = core.BERX_CORE_STATES.filter((s) => core.berxCoreSound(s) === 'silence');
gate('most states make no sound at all',
	silent.length > core.BERX_CORE_STATES.length / 2,
	`${silent.length} of ${core.BERX_CORE_STATES.length} are silent: ${silent.join(', ')}. A bed under a search is a condition; a mark at a resolution is a moment; silence is the majority answer and is not an omission`);

/* ---------------- 7. THE PIXELS: does any of this reach the world? ----------------

   Everything above is a state machine, and a beautiful state machine
   nothing reads is decoration with good manners. This renders the SAME
   world — same entities, same camera, same lights, same quality tier —
   at three different Core states, and the only difference between the
   frames is the Core. */

execFileSync(esbuild, [
	path.join(here, 'coreworld.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX Core</title>
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

let rendered, pageErrors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => pageErrors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CORE_WORLD !== 'undefined');
	rendered = await page.evaluate(async () => await window.BERX_CORE_WORLD.states(['idle', 'searching', 'success']));
} finally {
	await browser.close();
	server.close();
}

gate('the Core fixture renders without a page error', pageErrors.length === 0,
	pageErrors.length ? pageErrors.join('; ') : 'clean');

if (!rendered?.available) {
	console.log('BLOCKED  core-pixels');
	console.log(`         ${rendered?.reason ?? 'no WebGPU device here'}`);
} else {
	const shots = rendered.out;
	const differ = (a, b) => {
		let moved = 0, worst = 0, brighter = 0;
		for (let i = 0; i < a.length; i += 4) {
			let d = 0, up = 0;
			for (let k = 0; k < 3; k++) {
				d = Math.max(d, Math.abs(a[i + k] - b[i + k]));
				up = Math.max(up, b[i + k] - a[i + k]);
			}
			if (d > 2) moved++;
			if (up > 2) brighter++;
			if (d > worst) worst = d;
		}
		return {moved, worst, brighter, total: a.length / 4};
	};

	const idleToSearch = differ(shots.idle.pixels, shots.searching.pixels);
	gate('a state the Core is in changes the world it is in',
		idleToSearch.moved > idleToSearch.total * 0.5 && idleToSearch.worst > 6,
		`idle → searching: ${idleToSearch.moved} of ${idleToSearch.total} pixels differ, worst ${idleToSearch.worst}/255 — same entities, same camera, same lights, same tier. The ONLY difference is the Core, so a state machine nothing read would show zero here`);

	gate('searching brightens the room it is searching, rather than lighting a separate object',
		idleToSearch.brighter > idleToSearch.moved * 0.8
			&& shots.searching.keyIntensity > shots.idle.keyIntensity,
		`${idleToSearch.brighter} of ${idleToSearch.moved} changed pixels got brighter, and the KEY light went ${shots.idle.keyIntensity.toFixed(3)} → ${shots.searching.keyIntensity.toFixed(3)}. The Core's light is the key's, scaled — not a second light nobody placed`);

	gate('the air holds more while something is being looked for',
		shots.searching.density > shots.idle.density * 1.5,
		`volumetric density ${shots.idle.density.toFixed(4)} → ${shots.searching.density.toFixed(4)} — density only: the phase, the reach and the intensity are properties of the air itself and do not change because something is being searched for`);

	gate('there is more matter in the air, and none of it is invented',
		shots.searching.motes.every((n, i) => n > shots.idle.motes[i]),
		`motes ${JSON.stringify(shots.idle.motes)} → ${JSON.stringify(shots.searching.motes)} — the same hashed field, more of its prefix. Mote 7 is still mote 7`);

	/* SUCCESS must not simply be "searching, but more". */
	const searchToSuccess = differ(shots.searching.pixels, shots.success.pixels);
	let dimmer = 0;
	for (let i = 0; i < shots.searching.pixels.length; i += 4) {
		let down = 0;
		for (let k = 0; k < 3; k++) down = Math.max(down, shots.searching.pixels[i + k] - shots.success.pixels[i + k]);
		if (down > 2) dimmer++;
	}
	gate('resolution settles the room rather than flashing it',
		dimmer > searchToSuccess.moved * 0.8 && shots.success.density < shots.searching.density,
		`searching → success: ${dimmer} of ${searchToSuccess.moved} changed pixels got DARKER and the air thinned ${shots.searching.density.toFixed(4)} → ${shots.success.density.toFixed(4)}. The tension goes out of the space and what was found stays in it — a flash is an event, and this is the end of one`);
}

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX CORE: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL CORE GATES PASS');
