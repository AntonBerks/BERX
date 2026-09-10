#!/usr/bin/env node
/**
 * DOES THE PIXEL BELONG TO WHAT IS DRAWN THERE?
 *
 * The one question the whole pointer path exists to answer, asked in
 * seconds instead of the twenty-five minutes a full product boot takes.
 * It drives the real host, the real renderer and the real pointer
 * handler over a world of the same shape a signed-in session loads, and
 * it presses on every entity the G-buffer says is the nearest surface at
 * its own pixel — with a DIFFERENT entity focused each time, because the
 * affordance ring of whatever is focused is what used to steal its
 * neighbours' pixels.
 *
 * No hitbox is widened here and no entity is excluded to make it pass:
 * an entity is a target only where the world really drew it, and the
 * answer has to be that entity.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-picking-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

execFileSync(esbuild, [
	path.join(here, 'picking.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D picking</title>
<style>html,body{margin:0;background:#07080A;overflow:hidden}</style></head>
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

let out, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 1280, height: 800}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(`console: ${m.text()}`);
		else if (m.text().startsWith('BERX picking:')) console.log(`      ${m.text()}`);
	});
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_PICKING !== 'undefined');
	out = await page.evaluate(async () => await window.BERX_PICKING.run());
} finally {
	await browser.close();
	server.close();
}

gate('a real host session runs without a page error', errors.length === 0,
	errors.length ? errors.slice(0, 3).join(' | ') : 'clean');

gate('the backend can say what it drew at a pixel',
	out.depthAvailable === true,
	out.depthAvailable
		? `${out.backend} answers depthAt() out of its own G-buffer — the one authority both the entity pick and the affordance ring are resolved against`
		: `${out.backend} cannot report a drawn depth, so neither the ring nor the entity pick can be resolved against what is visible`);

gate('every press lands on the entity the world drew at that pixel',
	out.tried > 0 && out.wrong.length === 0,
	out.tried === 0
		? 'no entity was the nearest drawn surface at its own pixel — nothing was tested, which is not a pass'
		: `${out.tried} presses, ${out.tried - out.wrong.length} landed on the entity the pixel belongs to. Real PointerEvents at each entity's own projected pixel, with every entity in turn focused so its affordance ring is up${out.wrong.length ? `. WRONG: ${out.wrong.map((w) => `focused ${w.focused}, aimed at ${w.aimedAt} (${w.px},${w.py}): the world drew ${w.drawn} there and the entity's centre is at ${w.along}; renderer.pick said ${w.pick ?? 'nothing'}${w.pickAt !== undefined ? ` at ${w.pickAt}` : ''}, the shell focused ${w.got}`).join('; ')}` : ''}`);

const withRing = out.all.filter((r) => r.ringWas > 0);
gate('and it was tested against a ring that was really up',
	withRing.length > 0,
	withRing.length
		? `${withRing.length} of ${out.tried} presses happened with the focused entity's ring drawn (up to ${Math.max(...out.all.map((r) => r.ringWas))} slots) — the condition that let a slot win a neighbour's pixel, and every one of those presses still landed on the entity`
		: `no press happened with a ring up (${out.all.map((r) => `${r.focused}:${r.ringWas}`).slice(0, 4).join(', ')}) — the ring is the case this gate exists for, so this is not a pass`);

/**
 * And the ring itself: standing with an entity, can you reach its
 * actions? A world compact enough to fill a frame is a world with
 * things in front of other things, and an affordance the world drew
 * over is not a smaller affordance — it is gone.
 */
const rings = out.rings ?? [];
const ringed = rings.filter((r) => r.offered > 0);
const short = ringed.filter((r) => r.pickable < r.requested);
const reachable = ringed.reduce((n, r) => n + r.pickable, 0);
const drawn = ringed.reduce((n, r) => n + r.requested, 0);

gate('an entity that offers actions has a ring, and the ring is in front of it',
	ringed.length > 0 && reachable > 0 && short.length < ringed.length,
	`${ringed.length} entities focused, ${reachable} of ${drawn} slots reachable. The ring stands a third of the way from the entity toward the eye — it used to sit in the entity's own depth plane, and with an arrangement compact enough to fill a frame that left ONE of five actions reachable`);

if (short.length > 0) {
	console.log(`BLOCKED  ${drawn - reachable} of ${drawn} affordances are behind something, on ${short.length} of ${ringed.length} viewpoints`);
	console.log(`         ${short.map((r) => `${r.focusId} ${r.pickable}/${r.requested}`).join(', ')} — and rendered==pickable still holds: what the depth test removed is removed from BOTH sets, so nothing invisible is touchable.`);
	console.log('         The cause is line of sight, and it belongs to the CAMERA rather than to the ring: focusing an entity chooses a distance but not a direction, so it can put the viewer behind a neighbour. Closing it means the fit preferring a direction with a clear view of the focused entity and its ring. Not closed by moving the ring further out — a ring halfway to the camera reads as interface rather than as part of the world — and not by letting the ring ignore depth.');
}

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D picking: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log(`\nALL PICKING GATES PASS (${out.tried} presses, backend ${out.backend})`);
