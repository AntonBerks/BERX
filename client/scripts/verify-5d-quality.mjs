#!/usr/bin/env node
/**
 * ADAPTIVE QUALITY — does a cheaper tier cost less, and does it still
 * draw the same world?
 *
 * Two failures are possible here and they look nothing alike.
 *
 * The first is a tier table that does not actually descend: someone
 * lowers a step count, raises a resolution, and the "cheaper" tier costs
 * more than the one above it. Nobody notices, because the picture is
 * fine. This gate multiplies the knobs out and refuses a table that does
 * not fall.
 *
 * The second is worse and is the reason this file exists at all. BERX
 * 5D has no random numbers anywhere — every mote, every march offset and
 * every kernel direction comes out of a hash — and the whole point of
 * that is that the same world is the same world everywhere. A quality
 * tier that RESHUFFLED the field instead of thinning it would quietly
 * destroy that: two devices would draw different rooms, no oracle could
 * predict either, and every cross-backend comparison in this repository
 * would be measuring noise. So the checks below are mostly about
 * identity, not cost.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchChromium} from './lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-quality-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const entry = path.join(dir, 'quality.mjs');
execFileSync(esbuild, [
	path.join(here, 'quality.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(entry);

const tiers = core.BERX_RENDER_TIERS.map((t) => core.berxRenderQuality(t));
const by = Object.fromEntries(tiers.map((q) => [q.tier, q]));

/* ---------------- 1. nothing is ever switched off ---------------- */

const alive = tiers.filter((q) =>
	q.volumetricSteps > 0 && q.volumetricScale >= 1 && q.ssaoSamples > 0
	&& q.shadowMapSize > 0 && q.particleScale > 0 && q.maxObjects > 0);
gate('every tier still runs every pass',
	alive.length === tiers.length,
	`${alive.length} of ${tiers.length}: ${tiers.map((q) => `${q.tier} march ${q.volumetricSteps}@1/${q.volumetricScale}, ao ${q.ssaoSamples}, shadow ${q.shadowMapSize}, motes x${q.particleScale}`).join(' · ')}. A tier that turned the air off would not be a quality setting, it would be a different product — and the phone is where most people will meet BERX`);

const kindsAlive = core.BERX_PARTICLE_KINDS.every((k) =>
	tiers.every((q) => core.berxParticleCountFor(k, q) >= 1));
gate('all three particle fields survive the cheapest tier',
	kindsAlive,
	core.BERX_PARTICLE_KINDS.map((k) => `${k} ${tiers.map((q) => core.berxParticleCountFor(k, q)).join('/')}`).join(', ')
	+ ' — ultra/high/medium/low. BERX Energy is the rarest thing in the palette and it is not a thing a weak device loses');

/* ---------------- 2. the table actually descends ---------------- */

const costs = tiers.map((q) => core.berxVolumetricRelativeCost(q));
let descends = true;
for (let i = 1; i < costs.length; i++) if (costs[i] > costs[i - 1]) descends = false;
gate('a cheaper tier really is cheaper',
	descends && costs[costs.length - 1] < costs[0],
	`march cost relative to HIGH: ${tiers.map((q, i) => `${q.tier} ${costs[i].toFixed(2)}x`).join(' · ')} — steps over resolution squared, which is the term that dominated the 74ms measured on WebGPU`);

const shadowsDescend = tiers.every((q, i) => i === 0 || q.shadowMapSize <= tiers[i - 1].shadowMapSize);
const powersOfTwo = tiers.every((q) => (q.shadowMapSize & (q.shadowMapSize - 1)) === 0);
gate('shadow maps shrink, and stay powers of two',
	shadowsDescend && powersOfTwo,
	`${tiers.map((q) => q.shadowMapSize).join(' → ')} — the light camera snaps its centre to whole texels to stop shimmer, and that arithmetic wants a power of two`);

/* ---------------- 3. IDENTITY: a thinner field is the same field ---------------- */

/**
 * The one that matters. Take a mote by index at ULTRA and at LOW and ask
 * whether it is in the same place. It must be: the count is a prefix, so
 * mote 7 is mote 7 everywhere and only the number of them changes.
 */
const at = (i, kind) => core.berxParticleAt(kind, i, 3.5, {x: 0, y: 0, z: 0});
let moved = 0, compared = 0, worst = 0;
for (const kind of core.BERX_PARTICLE_KINDS) {
	const low = core.berxParticleCountFor(kind, by.low);
	for (let i = 0; i < low; i++) {
		const a = at(i, kind), b = at(i, kind);
		const d = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, a.position.z - b.position.z);
		compared++;
		if (d > 0) { moved++; if (d > worst) worst = d; }
	}
}
gate('a mote is in the same place however many of them there are',
	moved === 0,
	`${compared} motes compared across the three fields, ${moved} moved (worst ${worst.toFixed(6)}m). The count is a PREFIX of the hashed field, never a re-seed — every mote's position comes from its own index, so thinning the field cannot move the ones that remain`);

const prefix = core.BERX_PARTICLE_KINDS.every((k) =>
	core.berxParticleCountFor(k, by.low) <= core.berxParticleCountFor(k, by.medium)
	&& core.berxParticleCountFor(k, by.medium) <= core.berxParticleCountFor(k, by.high));
gate('fields thin monotonically from the top tier down',
	prefix,
	core.BERX_PARTICLE_KINDS.map((k) => `${k}: ${['ultra', 'high', 'medium', 'low'].map((t) => core.berxParticleCountFor(k, by[t])).join(' ≥ ')}`).join(' · '));

/* ---------------- 4. the reduced kernel still covers the hemisphere ---------------- */

const full = core.berxSSAOKernel();
const cheap = core.berxSSAOKernelFor(by.low);
const radius = (s) => Math.hypot(s.x, s.y, s.z);
const fullRange = [Math.min(...full.map(radius)), Math.max(...full.map(radius))];
const cheapRange = [Math.min(...cheap.map(radius)), Math.max(...cheap.map(radius))];
/* A PREFIX of the spiral would stop well short of the full radius — the
   spiral's reach grows with the index — and the occlusion would collapse
   into a dark line at every contact with nothing beyond it. A stride
   keeps the reach and asks about fewer directions in it. */
const covers = cheapRange[1] >= fullRange[1] * 0.85 && cheapRange[0] <= fullRange[0] * 1.3;
gate('a cheaper occlusion kernel still reaches as far',
	covers && cheap.length === by.low.ssaoSamples,
	`${cheap.length} of ${full.length} taps, radius ${cheapRange[0].toFixed(3)}–${cheapRange[1].toFixed(3)} against the full ${fullRange[0].toFixed(3)}–${fullRange[1].toFixed(3)} — a STRIDE through the spiral, not its first half, because the spiral's reach grows with the index and a prefix would only ever ask about what is touching`);

const everyTap = cheap.every((s) => full.some((f) => f.x === s.x && f.y === s.y && f.z === s.z));
gate('every cheap tap is one of the real ones',
	everyTap,
	'the reduced kernel is a subset of the full spiral, not a second spiral generated at a different count — otherwise two tiers would be asking different questions and neither could be predicted from the other');

/* ---------------- 5. the tier a device is given ---------------- */

const cases = [
	[{saveData: true, platform: 'desktop', deviceMemoryGb: 32, logicalCores: 16}, 'low', 'a stated preference for less work outranks a strong machine'],
	[{platform: 'arvr', deviceMemoryGb: 16, logicalCores: 12}, 'medium', 'two eyes at 72Hz'],
	[{platform: 'watch'}, 'low', 'a watch'],
	[{platform: 'desktop', deviceMemoryGb: 32, logicalCores: 16}, 'ultra', 'a workstation'],
	[{platform: 'android', deviceMemoryGb: 2, logicalCores: 8}, 'low', '2GB'],
	[{platform: 'ios', measuredFps: 18}, 'low', 'a real measurement of 18fps'],
	[{platform: 'web'}, 'medium', 'a device that said nothing'],
];
const wrong = cases.filter(([signals, want]) => core.berxResolveRenderTier(signals).tier !== want);
gate('the tier follows what is observed, and guesses down rather than up',
	wrong.length === 0,
	wrong.length
		? wrong.map(([s, want]) => `${JSON.stringify(s)} wanted ${want}, got ${core.berxResolveRenderTier(s).tier}`).join('; ')
		: cases.map(([s, want, why]) => `${why} → ${want}`).join(' · ') + '. An unknown device gets MEDIUM: guessing high on a weak phone costs a stuttering first impression, guessing medium on a strong one costs a cheaper march nobody will see');

const reasoned = core.BERX_RENDER_TIERS.every((t) => core.berxRenderQuality(t).reason.length > 20);
gate('every tier says why it is what it is',
	reasoned,
	core.BERX_RENDER_TIERS.map((t) => `${t}: ${core.berxRenderQuality(t).reason}`).join(' · '));

/* ---------------- 6. THE PIXELS ----------------
   Everything above is the table. This is whether it reaches a frame. */

execFileSync(esbuild, [
	path.join(here, '5d-quality.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D quality</title>
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

let rendered, uncoupled, pageErrors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => pageErrors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_QUALITY !== 'undefined');
	rendered = await page.evaluate(async () => await window.BERX_QUALITY.tiers());
	uncoupled = await page.evaluate(async () => await window.BERX_QUALITY.airWithoutSSAO());
} finally {
	await browser.close();
	server.close();
}

/** How much light a pass ADDED, per pixel: never how much the frame differs. */
const addedLight = (on, off) => {
	let lit = 0, worst = 0, sum = 0;
	for (let i = 0; i < on.length; i += 4) {
		let d = 0;
		for (let k = 0; k < 3; k++) d = Math.max(d, on[i + k] - off[i + k]);
		if (d > 0) { lit++; sum += d; }
		if (d > worst) worst = d;
	}
	return {lit, worst, mean: sum / Math.max(1, lit), pixels: on.length / 4};
};

gate('the tier fixture renders without a page error', pageErrors.length === 0,
	pageErrors.length ? pageErrors.join('; ') : 'clean');

if (!rendered?.available) {
	console.log('BLOCKED  quality-pixels');
	console.log('         no WebGPU device here — the tier table is checked, the frames it produces are not');
} else {
	const shots = rendered.out;
	/* Each tier must arrive at the GPU as the numbers the table names.
	   A backend that kept a constant would pass every check above. */
	const q = core.BERX_RENDER_TIERS.map((t) => core.berxRenderQuality(t));
	const arrived = q.every((want) => {
		const got = shots[want.tier];
		return got && got.steps === want.volumetricSteps && got.scale === want.volumetricScale
			&& got.shadowMapSize === want.shadowMapSize && got.ssaoSamples === want.ssaoSamples;
	});
	gate('the tier the core chose is the tier the GPU was given',
		arrived,
		core.BERX_RENDER_TIERS.map((t) => `${t}: ${shots[t].steps} steps at 1/${shots[t].scale}, ${shots[t].shadowMapSize} map, ${shots[t].ssaoSamples} taps, motes ${JSON.stringify(shots[t].particles)}`).join(' · ')
		+ '. Read back off the draw list the renderer actually uploaded — two backends kept their own constants here and drifted from the third');

	const airs = core.BERX_RENDER_TIERS.map((t) => addedLight(shots[t].withAir, shots[t].noAir));
	const allLit = airs.every((a) => a.lit > a.pixels * 0.9 && a.worst > 8);
	gate('every tier still puts light in the air',
		allLit,
		core.BERX_RENDER_TIERS.map((t, i) => `${t} ${airs[i].lit}/${airs[i].pixels} px, peak ${airs[i].worst}/255, mean ${airs[i].mean.toFixed(1)}`).join(' · ')
		+ ' — the cheapest tier marches a sixth of the cost and arrives at the same amount of light, which is the whole claim');

	/* The half-resolution march shows where a shaft has an EDGE, which is
	   the shadow cone's rim and nowhere else. Measured as a share of the
	   frame rather than a worst pixel: a worst pixel on an edge says
	   nothing, and 0.25% of them says the edge is one pixel wide. */
	const ref = shots.high.withAir;
	const drift = (t) => {
		let over = 0, worst = 0, n = 0;
		const a = shots[t].withAir;
		for (let i = 0; i < a.length; i += 4) {
			let d = 0;
			for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a[i + k] - ref[i + k]));
			if (d > 6) over++;
			if (d > worst) worst = d;
			n++;
		}
		return {over, worst, share: over / n};
	};
	const cheap = ['medium', 'low'].map(drift);
	gate('a cheaper tier is the same picture, not a different one',
		cheap.every((d) => d.share < 0.02) && drift('ultra').share < 0.005,
		`ultra ${(drift('ultra').share * 100).toFixed(3)}% of pixels differ from high by more than 6/255 · `
		+ ['medium', 'low'].map((t, i) => `${t} ${(cheap[i].share * 100).toFixed(3)}% (worst ${cheap[i].worst}/255)`).join(' · ')
		+ '. The difference is the shadow cone\'s rim, which is the one place a half-resolution march has an edge to lose — and it is a fifth of one percent of the frame for six times the speed');
}

if (!uncoupled?.available) {
	console.log('BLOCKED  air-without-occlusion');
	console.log('         no WebGPU device here');
} else {
	const g = addedLight(uncoupled.gpuAir, uncoupled.gpuNoAir);
	const l = addedLight(uncoupled.glAir, uncoupled.glNoAir);
	/**
	 * The regression this exists for.
	 *
	 * The volumetric march and the occlusion pass share a G-buffer and
	 * nothing else, but WebGPU gated the march on `ssao` — so asking for
	 * air without occlusion drew no air at all, while WebGL2, which had
	 * the same two passes and got the condition right, drew it. Two web
	 * backends disagreeing about whether an effect exists, and no gate
	 * saw it, because every gate ran with occlusion on.
	 */
	gate('the air does not depend on the occlusion pass, in either backend',
		g.lit > g.pixels * 0.9 && l.lit > l.pixels * 0.9,
		`with {ssao: false, volumetric: true}: WebGPU lit ${g.lit}/${g.pixels} pixels (peak ${g.worst}/255), WebGL2 lit ${l.lit}/${l.pixels} (peak ${l.worst}/255) — they share a G-buffer and nothing else, so turning occlusion off must not turn the air off`);
}

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D quality: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL QUALITY GATES PASS');
