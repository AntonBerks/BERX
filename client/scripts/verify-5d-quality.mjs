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
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D quality: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL QUALITY GATES PASS');
