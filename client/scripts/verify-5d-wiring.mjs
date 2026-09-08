#!/usr/bin/env node
/**
 * IS THE PRODUCT DRIVING WHAT WAS BUILT FOR IT?
 *
 * This gate exists because of a gap nothing else could see. The quality
 * tiers and the Core state machine were both built, both verified by
 * their own gates, and both never called by the shipped shell — the
 * tiers had a gate proving MEDIUM costs a sixth of HIGH, the Core had a
 * gate proving its field reaches the pixels, and a real product session
 * resolved no tier and stepped no Core. Every one of those gates passed,
 * because every one of them drove the module directly.
 *
 * A verified module the shell does not drive is a library, not a
 * feature, and the difference is invisible from inside a gate that
 * supplies its own caller. So this one drives the SHELL — the same host
 * a browser session runs — and reads back what the session actually did.
 *
 * The test to apply to anything added here: if someone deleted the line
 * that wires it up, would this fail? If not, it is not checking the
 * wiring.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-wiring-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

execFileSync(esbuild, [
	path.join(here, 'wiring.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D wiring</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block;width:480px;height:360px}</style></head>
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
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_WIRING !== 'undefined');
	out = await page.evaluate(async () => await window.BERX_WIRING.run());
} finally {
	await browser.close();
	server.close();
}

gate('a real host session starts without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

/* ---------------- the tier ---------------- */

gate('a real session resolves a render tier, and says why',
	['ultra', 'high', 'medium', 'low'].includes(out.tier?.tier) && (out.tier?.reason ?? '').length > 10,
	`${out.tier?.tier}: ${out.tier?.reason} — resolved once from what the platform will say about itself, not re-resolved per frame: a device does not become a different device, and a tier that moved with the frame rate would be the flicker the stability work removed`);

gate('and the tier\'s knobs are the ones the draw list is given',
	out.tier?.quality?.volumetricSteps > 0 && out.tier?.quality?.volumetricScale >= 1
		&& out.list?.volumetric?.[4] === out.tier.quality.volumetricSteps
		&& out.list?.volumetric?.[5] === out.tier.quality.volumetricScale,
	`the session's tier says ${out.tier?.quality?.volumetricSteps} march steps at 1/${out.tier?.quality?.volumetricScale}, and the draw list a real frame produced carries ${out.list?.volumetric?.[4]} at 1/${out.list?.volumetric?.[5]}. Delete the line that passes quality through and this is the check that fails`);

gate('every pass still runs at whatever tier this device got',
	out.tier?.quality?.volumetricSteps > 0 && out.tier?.quality?.ssaoSamples > 0
		&& out.tier?.quality?.shadowMapSize > 0 && out.tier?.quality?.particleScale > 0,
	`march ${out.tier?.quality?.volumetricSteps} steps, occlusion ${out.tier?.quality?.ssaoSamples} taps, shadow ${out.tier?.quality?.shadowMapSize}, motes x${out.tier?.quality?.particleScale} — a tier changes what an effect costs, never whether it exists`);

/* ---------------- the Core ---------------- */

gate('a real frame loop steps the Core',
	out.core?.moved === true,
	`over ${out.core?.frames} frames the field moved by ${out.core?.travelled?.toFixed(5)} — a Core nobody stepped would be identical after any number of frames, which is exactly what a product session was doing before this`);

gate('and the Core\'s field reaches the draw list',
	out.list?.airDensity !== undefined && Math.abs(out.list.airDensity - out.core.expectedDensity) < 1e-6,
	`the Core's haze put the volumetric density at ${out.list?.airDensity?.toFixed(5)}, which is the room's own ${out.core?.baseDensity?.toFixed(5)} scaled by the field — not a number the renderer chose`);

gate('a real event moves the Core, and nothing else does',
	out.core?.afterEvent !== out.core?.atStart && out.core?.idleStaysPut === true,
	`${out.core?.atStart} → ${out.core?.afterEvent} when something actually happened; ${out.core?.idleFrames} frames with nothing happening left the state where it was. Every cause is a thing that occurred — there is no function that makes the Core look interesting`);

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D wiring: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL WIRING GATES PASS');
