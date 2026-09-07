#!/usr/bin/env node
/**
 * Compositions — does a region's shape reach the world, and is it the
 * SAME world underneath?
 *
 * A composition is the answer to a design request that arrived as CSS:
 * a ring of first choices, a core with orbits around it, a conversation
 * as a line between two people, one thing on a stage with the
 * alternatives behind. Those are real arrangements and they are worth
 * having — but as arrangements of the one world, not as DOM layouts,
 * because a DOM layout exists on the web and nowhere else.
 *
 * So this gate asks the questions that separate "an arrangement" from
 * "a decoration":
 *
 *   is it deterministic — the same entities in the same coordinates on
 *   every run, so a viewer can return to a place and find it;
 *   is each shape actually a different shape, measurably, rather than a
 *   different name for the relational layout;
 *   is each one the shape it CLAIMS (a ring is evenly spaced and flat,
 *   orbits are concentric, a thread is collinear, a stage recedes);
 *   and does no arrangement ever lose an entity.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-composition-'));
const bundle = path.join(dir, 'core.mjs');
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, 'composition.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${bundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {BERX_COMPOSITIONS, berxComposeLayout, berxCompositionFor, berxCrossRendererFrame} =
	await import(`file://${bundle}`);

/* a real world, from the real fixture */
const frame = berxCrossRendererFrame();
const objects = frame.world.objects;
const relations = frame.world.relations;
const rootId = objects[0].id;
const layoutOf = (composition) => berxComposeLayout(composition, objects, relations, {rootId});

gate('every arrangement places every entity',
	BERX_COMPOSITIONS.every((c) => layoutOf(c).size === objects.length),
	`${objects.length} entities, and all ${BERX_COMPOSITIONS.length} arrangements place all of them — an arrangement is a shape for what it understands, not a licence to lose an entity`);

gate('the same world lands in the same coordinates, every time',
	BERX_COMPOSITIONS.every((c) => JSON.stringify([...layoutOf(c)]) === JSON.stringify([...layoutOf(c)])),
	'no Math.random anywhere: a viewer returns to a place and finds it where they left it, and a gate can predict where a thing will be');

/* order must not decide position: the same graph shuffled is the same world */
const shuffled = [...objects].reverse();
const same = BERX_COMPOSITIONS.filter((c) => {
	const a = berxComposeLayout(c, objects, relations, {rootId});
	const b = berxComposeLayout(c, shuffled, relations, {rootId});
	return objects.every((o) => {
		const p = a.get(o.id);
		const q = b.get(o.id);
		return p && q && Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9 && Math.abs(p.z - q.z) < 1e-9;
	});
});
gate('the order the server sent them in does not decide where they stand',
	same.length === BERX_COMPOSITIONS.length,
	`all ${same.length} arrangements put the reversed list in identical coordinates — a viewer who has learned where a thing is finds it there next time, whatever order it arrived in`);

const signature = (c) => [...layoutOf(c)].map(([id, p]) => `${id}:${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).sort().join('|');
gate('each arrangement is a different shape, not a different name',
	new Set(BERX_COMPOSITIONS.map(signature)).size === BERX_COMPOSITIONS.length,
	`${BERX_COMPOSITIONS.length} distinct arrangements of one world — a composition that produced the relational layout would be a name`);

/* ---------------- each one is the shape it claims ---------------- */
const others = (map) => [...map].filter(([id]) => id !== rootId).map(([, p]) => p);

const ring = others(layoutOf('ring'));
const radii = ring.map((p) => Math.hypot(p.x, p.z));
const spread = Math.max(...radii) - Math.min(...radii);
const angles = ring.map((p) => Math.atan2(p.z, p.x)).sort((a, b) => a - b);
const gaps = angles.map((a, i) => (i === 0 ? a - angles[angles.length - 1] + Math.PI * 2 : a - angles[i - 1]));
const gapSpread = Math.max(...gaps) - Math.min(...gaps);
gate('a ring is a ring: one radius, evenly spaced, and you stand in it',
	spread < 1e-6 && gapSpread < 1e-6 && layoutOf('ring').get(rootId).x === 0 && layoutOf('ring').get(rootId).z === 0,
	`${ring.length} entities at radius ${radii[0].toFixed(2)}m (spread ${spread.toExponential(1)}), angular gaps equal to ${gapSpread.toExponential(1)} rad, and the viewer at the centre`);

const orbits = others(layoutOf('orbits'));
const orbitRadii = [...new Set(orbits.map((p) => Math.hypot(p.x, p.z).toFixed(4)))].map(Number).sort((a, b) => a - b);
/*
 * Evenly spaced, not geometrically: the rings step outward by a fixed
 * distance, which is what the design asks for and what keeps the third
 * ring from being twice as far away as the world is deep. The first
 * version of this check asserted geometric growth and failed on a
 * correct layout — the check was wrong, not the spacing.
 */
const orbitGaps = orbitRadii.slice(1).map((r, i) => r - orbitRadii[i]);
gate('orbits are concentric, evenly stepped, and each ring is clearly its own',
	orbitRadii.length >= 2 &&
	orbitRadii.every((r, i) => i === 0 || r > orbitRadii[i - 1]) &&
	Math.max(...orbitGaps) - Math.min(...orbitGaps) < 1e-6 &&
	Math.min(...orbitGaps) > 1.5,
	`rings at ${orbitRadii.map((r) => `${r.toFixed(1)}m`).join(', ')}, each ${orbitGaps[0].toFixed(2)}m further out than the last — a fixed step, so which ring a thing is on is legible from inside without the far one leaving the world`);

const thread = layoutOf('thread');
const ends = [...thread].filter(([id]) => id !== rootId).map(([, p]) => p).filter((p) => Math.abs(p.z) < 1e-9 && Math.abs(p.y) < 1e-9);
const strung = others(thread).filter((p) => !ends.includes(p));
gate('a thread has two ends, and what passed between them lies between them',
	ends.length === 2 && Math.abs(ends[0].x + ends[1].x) < 1e-9 &&
	strung.every((p) => p.x > Math.min(ends[0].x, ends[1].x) && p.x < Math.max(ends[0].x, ends[1].x)),
	`two ends at x=${ends.map((p) => p.x.toFixed(1)).join(' and ')}, with ${strung.length} between them and none outside — an exchange rather than a queue`);

const stage = others(layoutOf('stage'));
const depths = stage.map((p) => p.z);
gate('a stage recedes: what is considered is in front, the alternatives behind',
	depths.every((z, i) => i === 0 || z < depths[i - 1]) && depths[0] === 0,
	`depths ${depths.map((z) => z.toFixed(1)).join(' → ')} — depth rather than a row, because a row makes every option equal and a stage does not`);

/* ---------------- the region decides, and most regions stay honest ---------------- */
const regions = ['world', 'now', 'discover', 'person', 'place', 'conversation', 'create', 'self'];
const chosen = regions.map((r) => `${r}→${berxCompositionFor(r)}`);
gate('a region gets the shape it means, and a region with no shape keeps the relational one',
	berxCompositionFor('create') === 'ring' &&
	berxCompositionFor('conversation') === 'thread' &&
	berxCompositionFor('self') === 'orbits' &&
	berxCompositionFor('world') === 'relational' &&
	berxCompositionFor('discover') === 'relational' &&
	berxCompositionFor('nothing-like-this') === 'relational',
	`${chosen.join(', ')} — an arrangement imposed on a graph that does not have one is decoration, so anything unrecognised stays relational`);

const source = fs.readFileSync(path.join(clientRoot, 'packages/spatial/src/composition.ts'), 'utf8');
gate('the arrangements are in the platform-free core, and reach every renderer',
	!/document\.|window\.|HTMLElement|querySelector|style\./.test(source) && !/Math\.random\s*\(/.test(source),
	'composition.ts names no DOM and no browser: the same arrangement reaches WebGL2, WebGPU and the native renderer through the draw list, which is what a DOM layout could never do');

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D composition: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL COMPOSITION GATES PASS');
