#!/usr/bin/env node
/**
 * DOES A BRAND COLOUR ARRIVE AS THE COLOUR IT WAS?
 *
 * The exposure exists because it did not. BERX's palette is authored as
 * APPEARANCES — #15191E is what a surface should look like — and the
 * renderer used those numbers as ALBEDOS, what a surface reflects. A
 * surface of albedo A under transport L appears at A·L, so every colour
 * arrived dimmed by exactly the factor the room dims it: graphite's best
 * case was 7.1/255 against a background of 7, an object and a void the
 * same colour to within half a code value.
 *
 * So this gate is not "is there a tone-map". It is the ORACLE: the
 * shared core predicts a pixel, a real GPU renders a real frame, and the
 * two are compared. Three backends agreeing with each other is a weaker
 * claim than three backends computing what the core says — two
 * renderers can agree perfectly on the wrong answer.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-exposure-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const core = await import(path.join(clientRoot, 'packages/spatial/src/lighting/berxExposure.ts'))
	.catch(async () => {
		/* the gates run TypeScript through a bundle, not directly */
		const out = path.join(dir, 'core.mjs');
		execFileSync(esbuild, [
			path.join(clientRoot, 'packages/spatial/src/lighting/berxExposure.ts'),
			'--bundle', '--format=esm', '--platform=neutral', '--log-level=error', `--outfile=${out}`,
		], {cwd: clientRoot, stdio: 'inherit'});
		return await import(out);
	});

/* ---------------- 1. the gain is derived, not chosen ---------------- */

gate('the exposure is the reciprocal of the measured transport',
	Math.abs(core.BERX_EXPOSURE - 1 / core.BERX_SCENE_TRANSPORT) < 1e-9,
	`transport ${core.BERX_SCENE_TRANSPORT} measured off a real frame (lit pearl over its own albedo), exposure ${core.BERX_EXPOSURE.toFixed(4)} = 1/that. Not "about three because three looked right": the number that undoes a measured dimming, so what was authored is what appears`);

/* ---------------- 2. the shoulder is a shoulder ---------------- */

/**
 * HEADROOM, stated as the number it actually is.
 *
 * The first version of this gate asserted the curve never reaches 1,
 * and that was my expectation rather than the fit's behaviour: the
 * Narkowicz constants saturate at about 7.5x. The property worth
 * holding is not "never white" — it is that the curve keeps SEPARATING
 * values over a real range, where a clamp separates none of them past
 * 1.0, and that the range is wide enough to be worth having.
 */
const curve = [0.18, 1, 2, 4].map((x) => core.berxShoulder(x));
let headroom = 1;
while (headroom < 64 && core.berxShoulder(headroom) < 1) headroom += 0.05;
gate('the curve keeps separating values where a clamp would stop',
	curve.every((v, i) => i === 0 || v > curve[i - 1])
		&& core.berxShoulder(0.18) > 0.18 && headroom > 4,
	`f(0.18)=${curve[0].toFixed(3)} f(1)=${curve[1].toFixed(3)} f(2)=${curve[2].toFixed(3)} f(4)=${curve[3].toFixed(3)}, saturating at ${headroom.toFixed(2)}x — so 2 and 4 stay different numbers on screen instead of both being white, which is exactly what a clamp does to them, and there is ${headroom.toFixed(1)}x of range above white to work in. The middle is LIFTED too, which is why the gain does not have to be larger than the transport says`);

/* ---------------- 3. an appearance survives the round trip ---------------- */

const tokens = [['#07080A', 7], ['#0D1014', 13], ['#15191E', 21], ['#4FD6E8', 214]];
const trips = tokens.map(([hex, v]) => [hex, v, Math.round(core.berxShoulder(core.berxRadianceFor(v / 255) * core.BERX_EXPOSURE) * 255)]);
gate('a colour authored as an appearance comes back as itself',
	trips.every(([, want, got]) => got === want),
	trips.map(([hex, want, got]) => `${hex} ${want}→${got}`).join(', ')
	+ ' — the environment and the clear colour are RADIANCE, not albedo, so they go through berxRadianceFor on the way in and come out of the tone-map unchanged. Applying the gain to them made the void three times lighter than the void was designed to be, which is a fog, not an exposure');

/* ---------------- 4. graphite separates from the void ---------------- */

/* A graphite object is an ALBEDO — dimmed by the light, which is what
   the gain corrects. The void it stands against is the room's own
   RADIANCE, which arrives as authored. Comparing the two the way they
   really reach the eye is the whole question the exposure exists for. */
const g = core.berxAppearance(0x15 / 255);
const voidNow = 7 / 255;
const before = 0x15 / 255 * core.BERX_SCENE_TRANSPORT;
gate('a graphite surface is no longer the same colour as the void',
	Math.abs(g - voidNow) >= core.BERX_VISIBLE_STEP,
	`#15191E appears at ${(g * 255).toFixed(1)}/255 against a void that stays at ${(voidNow * 255).toFixed(0)}/255 — ${((g - voidNow) * 255).toFixed(1)} apart, where un-exposed the same surface managed ${(before * 255).toFixed(1)} against the same 7 and the object and the void were the same colour to within half a code value. The visible floor is ${(core.BERX_VISIBLE_STEP * 255).toFixed(0)}/255 on a good screen in a dark room`);

/* ---------------- 5. THE ORACLE: what a real GPU actually wrote ---------------- */

execFileSync(esbuild, [
	path.join(here, 'exposure.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D exposure</title>
<style>html,body{margin:0;background:#07080A;overflow:hidden}canvas{display:block;width:480px;height:360px}</style></head>
<body><canvas id="world"></canvas><script type="module" src="./world.js"></script></body></html>`);

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
	const page = await browser.newPage({viewport: {width: 600, height: 460}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_EXPOSURE_SHOT !== 'undefined');
	out = await page.evaluate(async () => await window.BERX_EXPOSURE_SHOT.run());
} finally {
	await browser.close();
	server.close();
}

gate('a real exposed frame renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

const v = out?.voidPixel ?? [];
gate('and the void a real GPU wrote is the void the core predicted',
	v.length === 3 && v.every((c, i) => Math.abs(c - out.predictedVoid[i]) <= 1),
	`the core says the background should arrive at ${out?.predictedVoid?.join(',')} and the GPU wrote ${v.join(',')} — read back off a real frame with the air off, so this is the room itself rather than lit air over it. This is the whole claim: not that three backends agree, but that they compute what the core says`);

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D exposure: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL EXPOSURE GATES PASS');
