#!/usr/bin/env node
/**
 * The lighting is real, measured in pixels.
 *
 * `physicallyLitMaterials: true` is a claim, and a flag is not
 * evidence. These read the framebuffer and check the things that are
 * only true of an actual microfacet BRDF integrated against actual
 * lights — a metal with no diffuse lobe, roughness that spreads a
 * highlight instead of scaling it, and point lights that fall off with
 * distance and stop at their range.
 *
 * If the shader were the old ad-hoc lambert-plus-phong, every one of
 * these would fail.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-light-'));
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, '5d-gpu.entry.ts'), '--bundle', '--format=esm', '--target=es2020', '--platform=browser',
	'--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D light</title>
<style>html,body{margin:0;background:#07080A}#host{position:fixed;inset:0}</style></head>
<body><div id="host"><canvas id="world"></canvas></div><script type="module" src="./world.js"></script></body></html>`);

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

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 480, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_5D !== 'undefined');

	const measured = await page.evaluate(async () => {
		const host = window.BERX_5D.createBerx5DWebHost({canvas: document.getElementById('world')});
		const {mapUserToSpatial} = window.BERX_5D;

		/* one sphere at the centre, whose material we vary */
		const sphere = (material) => {
			const base = mapUserToSpatial(
				{guid: 1, username: 'x', fullname: 'X', email: '', icon_url: '', profile_url: '', time_created: 0},
				{position: {x: 0, y: 0, z: 1.2}},
			).object;
			return {...base, label: undefined, material: {...base.material, ...material}};
		};

		const draw = async () => {
			host.start();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			host.stop();
			const canvas = host.canvas;
			const gl = canvas.getContext('webgl2');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			let total = 0, lit = 0, peak = 0, radiance = 0;
			const brightness = [];
			/* The tone curve's own inverse, from the shared core. */
			const inv = window.BERX_5D.shoulderInverse;
			for (let i = 0; i < px.length; i += 4) {
				const b = px[i] + px[i + 1] + px[i + 2];
				/* anything above the ground colour is the sphere */
				if (b > 30) {
					lit++;
					total += b;
					/* AND the same pixel as LIGHT. The frame is tone-mapped,
					   and the shoulder compresses relative contrast at high
					   values on purpose — so a question about how much a
					   light adds has to be asked of radiance, not of the
					   picture. Per channel and then summed, because the
					   curve is applied per channel. */
					radiance += inv(px[i] / 255) + inv(px[i + 1] / 255) + inv(px[i + 2] / 255);
					brightness.push(b);
					if (b > peak) peak = b;
				}
			}
			/* How much of the surface is within reach of its own brightest
			   point. A tight specular lobe leaves almost none of it there;
			   a broad one leaves most of it. Relative to each surface's own
			   peak, so this measures the shape of the highlight rather than
			   how bright the material happens to be. */
			const near = brightness.filter((b) => b >= peak * 0.6).length;
			return {
				lit, mean: lit ? total / lit : 0, peak, spread: lit ? near / lit : 0,
				radiance: lit ? radiance / lit : 0,
			};
		};
		const show = async (object) => {
			for (const o of host.runtime.latestFrame.world.objects) host.removeObject(o.id);
			host.addObject(object);
			return draw();
		};

		/* same base colour, same roughness: only the metalness differs */
		const dielectric = await show(sphere({metalness: 0, roughness: 0.35}));
		const metal = await show(sphere({metalness: 1, roughness: 0.35}));

		/* same metalness: only the roughness differs */
		const smooth = await show(sphere({metalness: 0, roughness: 0.05}));
		const rough = await show(sphere({metalness: 0, roughness: 0.95}));

		/* a point light near the sphere, and the same light out of range */
		const base = sphere({metalness: 0, roughness: 0.5});
		const unlit = await show(base);
		const lighting = host.renderer.worldLighting;
		host.renderer.setLighting({
			...lighting,
			points: [{position: {x: 0, y: 0, z: 2.4}, colour: [0.31, 0.84, 0.91], intensity: 6, range: 4}],
		});
		const nearLight = await draw();
		host.renderer.setLighting({
			...lighting,
			points: [{position: {x: 0, y: 0, z: 60}, colour: [0.31, 0.84, 0.91], intensity: 6, range: 4}],
		});
		const outOfRange = await draw();
		host.renderer.setLighting(lighting);
		host.destroy();
		return {dielectric, metal, smooth, rough, unlit, nearLight, outOfRange};
	});

	/* A metal has no diffuse lobe: away from the specular direction it
	   goes dark, so the same shape lit the same way is dimmer overall. */
	/* A metal has no diffuse lobe. Away from the specular direction it
	   goes dark, so the surface is dimmer overall — while keeping at
	   least as bright a highlight, because the reflection is all it has.
	   Both halves have to hold: something merely darker could be a
	   material with a lower albedo. */
	gate(
		'metalness removes the diffuse lobe and keeps the reflection',
		measured.metal.mean < measured.dielectric.mean && measured.metal.peak >= measured.dielectric.peak * 0.95 && measured.metal.lit > 0,
		`same sphere, same roughness: dielectric mean ${measured.dielectric.mean.toFixed(0)} peak ${measured.dielectric.peak}; metal mean ${measured.metal.mean.toFixed(0)} peak ${measured.metal.peak}, over ${measured.metal.lit} lit pixels`,
	);

	/* Roughness spreads the highlight rather than dimming everything:
	   a smooth surface reaches a higher peak over fewer hot pixels. */
	gate(
		'roughness spreads the highlight instead of scaling it',
		measured.smooth.peak > measured.rough.peak && measured.smooth.spread < measured.rough.spread,
		`smooth: peak ${measured.smooth.peak}, ${(measured.smooth.spread * 100).toFixed(1)}% of the surface within reach of it; rough: peak ${measured.rough.peak}, ${(measured.rough.spread * 100).toFixed(1)}%`,
	);

	/* A point light is a light: it brightens what is near it, and does
	   nothing at all beyond the range it declares. */
	/**
	 * MEASURED IN LIGHT, NOT IN PIXELS.
	 *
	 * This compared tone-mapped means and went red the day the exposure
	 * landed: 74.04 → 77.6, a ratio of 1.048 against a bound of 1.05.
	 * Nothing about the point light had changed. The shoulder compresses
	 * relative contrast at high display values — that is what a shoulder
	 * IS — so a light adding 6% of the radiance in a room shows up as
	 * 4.8% of the pixels.
	 *
	 * The bound is NOT loosened to 1.04; that would be tuning the check
	 * to the answer, and it would keep measuring the wrong quantity. The
	 * claim is about light, so the pixels are brought back through the
	 * curve's own inverse first, and the check then holds regardless of
	 * what the tone-map is doing.
	 */
	gate(
		'point lights light what is near them',
		measured.nearLight.radiance > measured.unlit.radiance * 1.05,
		`radiance ${measured.unlit.radiance.toFixed(4)} → ${measured.nearLight.radiance.toFixed(4)} (${((measured.nearLight.radiance / measured.unlit.radiance - 1) * 100).toFixed(1)}% more light), which the tone-map shows as ${measured.unlit.mean.toFixed(1)} → ${measured.nearLight.mean.toFixed(1)} (${((measured.nearLight.mean / measured.unlit.mean - 1) * 100).toFixed(1)}% more pixel). Both are true; only the first is a statement about the light`,
	);
	gate(
		'a light stops where its range says it stops',
		Math.abs(measured.outOfRange.mean - measured.unlit.mean) < 1,
		`out of range mean ${measured.outOfRange.mean.toFixed(2)} vs unlit ${measured.unlit.mean.toFixed(2)}`,
	);

	gate('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
} finally {
	await browser.close();
	server.close();
	fs.rmSync(dir, {recursive: true, force: true});
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} LIGHTING GATES FAILED`);
	process.exit(1);
}
console.log('ALL LIGHTING GATES PASS');
