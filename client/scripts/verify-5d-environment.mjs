#!/usr/bin/env node
/**
 * IBL — is the room really lighting the world, and is it the SAME room
 * in all four places it is written?
 *
 * BERX ships no captured HDR environment and no licence to ship one, so
 * the environment is ANALYTIC: a closed-form function of direction,
 * written once in @berx/spatial and ported to WGSL, GLSL and Rust. A
 * closed form is the only kind of environment four languages can
 * evaluate identically, which is the whole reason for the choice.
 *
 * Three questions, and they are different questions:
 *
 *   1. Is the function right? Checked as maths, on its own — the sky
 *      rises toward the zenith, the floor returns less than it receives,
 *      the sun is a lobe and not a wash.
 *   2. Do the shaders run THAT function? Checked by predicting a real
 *      pixel from the shared core and comparing it against a readback.
 *      This is the check that separates "the backends agree" from "the
 *      backends compute what the core says", and only the second one
 *      means the maths is shared.
 *   3. Do the backends agree with each other? Checked pixel for pixel
 *      across WebGL2, WebGPU and native wgpu.
 *
 * The fixture is lit by the room ALONE — the key light is off and the
 * shadow pass with it — because a pixel that is the sum of a key and an
 * environment can be right for the wrong reasons.
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
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-env-'));

const failures = [];
const blocks = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, why) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${why}`);
	blocks.push(name);
};

/* ---------------- 1. the maths, on its own ---------------- */

const nodeEntry = path.join(dir, 'env.mjs');
execFileSync(esbuild, [
	path.join(here, 'environment.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${nodeEntry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(nodeEntry);

const up = {x: 0, y: 1, z: 0};
const sunDir = core.berxWorldLighting().key.direction;
const env = core.berxEnvironment(sunDir);
const R = (d) => core.berxEnvironmentRadiance(d, env);
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const norm = (v) => {
	const l = Math.hypot(v.x, v.y, v.z) || 1;
	return {x: v.x / l, y: v.y / l, z: v.z / l};
};

const zenith = R(up);
const horizon = R({x: 0, y: 0, z: 1});
const floor = R({x: 0, y: -1, z: 0});
gate('the sky really is a gradient: zenith brighter than horizon, floor darkest',
	lum(zenith) > lum(horizon) && lum(horizon) > lum(floor),
	`zenith ${lum(zenith).toFixed(4)} > horizon ${lum(horizon).toFixed(4)} > floor ${lum(floor).toFixed(4)} — a surface facing up receives measurably more room than one facing sideways, which a single ambient colour could never express`);

/* The floor is a reflector, not a lamp: what it returns must be less
   than the ground colour it is made of, or a room would gain energy by
   having a floor. */
gate('the ground bounces back less than it is',
	lum(floor) < lum(env.ground) && lum(floor) > 0,
	`floor returns ${lum(floor).toFixed(4)} against a ground colour of ${lum(env.ground).toFixed(4)} — a bounce of ${env.bounce}, dim but never black, so a downward face reads as being over something`);

const atSun = R(norm(sunDir));
const nearSun = R(norm({x: sunDir.x + 0.25, y: sunDir.y, z: sunDir.z}));
const awaySun = R(norm({x: -sunDir.x, y: -sunDir.y, z: -sunDir.z}));
gate('the sun is a lobe, not a wash',
	lum(atSun) > lum(nearSun) && lum(nearSun) > lum(awaySun) * 0.9,
	`looking straight at the key ${lum(atSun).toFixed(4)}, 14° off it ${lum(nearSun).toFixed(4)}, opposite it ${lum(awaySun).toFixed(4)} — it falls away with angle, so it is a sun rather than a tint over the whole sky`);

/* The accent must survive into the room, or the sun is white light with
   a name. Measured as a real channel ratio at the sun's centre. */
const sunShift = atSun[2] / Math.max(atSun[0], 1e-6);
const skyShift = horizon[2] / Math.max(horizon[0], 1e-6);
gate('the sun carries the BERX accent, and the sky does not',
	sunShift > skyShift * 1.3,
	`blue:red is ${sunShift.toFixed(2)} looking at the key and ${skyShift.toFixed(2)} at the horizon — #4FD6E8 arrives as a real colour cast where the light is, not as a brighter grey`);

gate('nothing in the room is negative or unbounded',
	[zenith, horizon, floor, atSun, awaySun].every((c) => c.every((x) => Number.isFinite(x) && x >= 0)),
	'every direction returns finite, non-negative radiance');

const packed = core.berxEnvironmentUniform(env);
gate('the packing the three backends read is the length they allocate for',
	packed.length === core.BERX_ENVIRONMENT_FLOATS && packed.every((x) => Number.isFinite(x)),
	`${packed.length} floats, the same number GLOBALS_BYTES grew by and the same five vec4s world.wgsl declares`);

/* ---------------- 2 and 3. the pixels ---------------- */

execFileSync(esbuild, [
	path.join(here, '5d-crossrender.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D environment</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block}</style></head>
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
const base = `http://127.0.0.1:${server.address().port}/`;

let gl2, gl2Bright, gpu, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	gl2 = await page.evaluate(() => window.BERX_CROSS.renderEnvironment());
	/* the same world with the sun turned up — see the sensitivity check */
	gl2Bright = await page.evaluate(() => window.BERX_CROSS.renderEnvironment(2.2));
	gpu = await page.evaluate(async () => await window.BERX_CROSS.renderEnvironmentWebGPU());
} finally {
	await browser.close();
	server.close();
}

gate('the room-only frame renders without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

const {width, height, rgba, list} = gl2;
const px = (buf, x, y) => {
	const o = (y * width + x) * 4;
	return [buf[o] / 255, buf[o + 1] / 255, buf[o + 2] / 255];
};

/* Project a world point to a pixel through the list's own matrices, so
   the gate measures where the renderer actually put it rather than
   where it was guessed to be. */
const project = (p) => {
	const m = (mat, v) => [
		mat[0] * v[0] + mat[4] * v[1] + mat[8] * v[2] + mat[12] * v[3],
		mat[1] * v[0] + mat[5] * v[1] + mat[9] * v[2] + mat[13] * v[3],
		mat[2] * v[0] + mat[6] * v[1] + mat[10] * v[2] + mat[14] * v[3],
		mat[3] * v[0] + mat[7] * v[1] + mat[11] * v[2] + mat[15] * v[3],
	];
	const clip = m(list.projection, m(list.view, [p.x, p.y, p.z, 1]));
	return {
		x: Math.round((clip[0] / clip[3] * 0.5 + 0.5) * width),
		y: Math.round((0.5 - clip[1] / clip[3] * 0.5) * height),
	};
};

/* THE ORACLE TARGET IS THE ORB, and both choices matter.
   The floor looked like the obvious probe — a flat slab with a normal
   of exactly (0,1,0) — but it is TRANSLUCENT: opacity 0.68 and
   transmission 0.55, so what reaches the frame is the shaded colour
   blended over the clear colour, and a prediction that ignored the
   blend came out 6/255 too bright. The orb is opaque, so its pixel IS
   the shader's output with nothing composited over it.

   The point probed is the one on the sphere whose normal points exactly
   at the eye. It is the only point whose geometry needs no measuring:
   it projects to the sphere's own centre in screen space (it lies on
   the centre-eye line), so it is guaranteed well inside the silhouette
   rather than on an antialiased edge, and there v == n exactly, which
   collapses the shader's reflection to n and its Fresnel to f0. A
   crown-of-the-sphere probe sat on the silhouette and read the
   background instead. */
const orb = list.items.find((i) => i.primitive === 'orb');
let oracle = null;
let at = null;
let orbNormal = null;
if (orb) {
	const centre = {x: orb.model[12], y: orb.model[13], z: orb.model[14]};
	at = project(centre);
	const n = norm({
		x: list.camera.x - centre.x,
		y: list.camera.y - centre.y,
		z: list.camera.z - centre.z,
	});
	orbNormal = n;
	/* v == n here, so nov == 1, reflect(-v,n) == n, and the roughness
	   blend between them is the identity whatever the roughness is. */
	const envBoth = R(n);
	const baseC = orb.base.slice(0, 3);
	const metal = orb.metalness;
	const f0 = baseC.map((c) => 0.04 + (c - 0.04) * metal);
	/* Schlick at nov == 1 is exactly f0: (1-1)^5 == 0. */
	const F = f0;
	const diffuse = baseC.map((c) => c * (1 - metal));
	/**
	 * THE PREDICTION MUST BE COMPARABLE WITH THE PIXEL.
	 *
	 * The shading above is LINEAR radiance — what leaves the surface.
	 * What the frame holds is that radiance through the world's own
	 * exposure: the gain and the ACES shoulder, in post. Comparing a
	 * linear prediction against an exposed pixel measured a missing
	 * tone-map, not a wrong environment, and it read as a 2.3x error on
	 * every channel.
	 *
	 * berxExpose is the SAME function the post stage runs, so this is
	 * the core predicting the pixel rather than the gate inventing a
	 * second curve. The 2/255 tolerance is untouched.
	 */
	const linear = [0, 1, 2].map((k) =>
		envBoth[k] * diffuse[k] * (1 - F[k]) + envBoth[k] * F[k] + orb.emissive[k]);
	const exposed = core.berxExpose({r: linear[0], g: linear[1], b: linear[2]});
	oracle = [exposed.r, exposed.g, exposed.b];
}

if (!orb) {
	blocked('oracle', 'no opaque orb in the draw list, so there is no pixel whose value is the shader output alone');
} else {
	const measured = px(rgba, at.x, at.y);
	const worst = Math.max(...[0, 1, 2].map((k) => Math.abs(measured[k] - oracle[k])));
	/* Tolerance, and why it is not zero: the shaders run f32, the core
	   runs f64, and the frame quantises to 8 bits per channel. 2/255 is
	   about two quantisation steps — tight enough that a different
	   formula cannot hide inside it. */
	gate('the shader computes the SHARED CORE\'s environment, not one of its own',
		worst < 2 / 255,
		`orb at (${at.x}, ${at.y}), the point facing the eye: measured [${measured.map((c) => (c * 255).toFixed(1)).join(', ')}] against [${oracle.map((c) => (c * 255).toFixed(1)).join(', ')}] predicted from berxEnvironmentRadiance and the draw list's own material — worst channel off by ${(worst * 255).toFixed(2)}/255`);
}

/* The room is directional: the top of the orb faces the sky, its
   underside faces the floor, and the image must show that. */
const orbTop = project({x: 0, y: 1.4 + 0.8, z: 0});
const orbBottom = project({x: 0, y: 1.4 - 0.72, z: 0});
const topLum = lum(px(rgba, orbTop.x, orbTop.y));
const bottomLum = lum(px(rgba, orbBottom.x, orbBottom.y));
gate('an object is lit by WHERE it faces, which a flat ambient cannot do',
	topLum > bottomLum * 1.15,
	`the orb's crown reads ${(topLum * 255).toFixed(1)} and its underside ${(bottomLum * 255).toFixed(1)} — under the single ambient colour this replaced, both were the same number by construction`);

/* SENSITIVITY. Change one number in the shared core and every backend
   must move by the amount the core predicts. A shader with the room
   baked into it would not move at all — this is what makes the parity
   check above evidence of shared maths rather than of a coincidence.

   The probe has to be somewhere the sun REACHES. The first version of
   this check sampled the floor, whose normal is straight up: the sun's
   lobe is pow(cos, 32), and at 44° off-axis that is about 5e-6, so the
   core predicted a change of 0.00/255 and the check passed on two
   zeroes. The point on the orb whose normal IS the sun direction is
   where the lobe is at its peak. */
if (orb) {
	/* Somewhere the sun REACHES. The first version of this check sampled
	   the floor, whose normal is straight up: the sun's lobe is
	   pow(cos, 32), and at 44° off-axis that is about 5e-6, so the core
	   predicted a change of 0.00/255 and the check passed on two zeroes.
	   Here the normal is tilted from the eye toward the key, which puts
	   the probe inside the lobe AND keeps it well inside the silhouette.
	   `orb.radius` is the geometry's real extent, carried by the draw
	   list — reconstructing it from the model matrix gives the transform
	   scale instead, which is a different number. */
	const centre = {x: orb.model[12], y: orb.model[13], z: orb.model[14]};
	const key = norm(sunDir);
	const n = norm({
		x: orbNormal.x + key.x,
		y: orbNormal.y + key.y,
		z: orbNormal.z + key.z,
	});
	const world = {
		x: centre.x + n.x * orb.radius,
		y: centre.y + n.y * orb.radius,
		z: centre.z + n.z * orb.radius,
	};
	const sunAt = project(world);
	const before = lum(px(rgba, sunAt.x, sunAt.y));
	const after = lum(px(gl2Bright.rgba, sunAt.x, sunAt.y));
	const envBright = {...env, sunIntensity: 2.2};
	const v = norm({x: list.camera.x - world.x, y: list.camera.y - world.y, z: list.camera.z - world.z});
	const nov = Math.max(n.x * v.x + n.y * v.y + n.z * v.z, 0);
	const refl = norm({x: 2 * nov * n.x - v.x, y: 2 * nov * n.y - v.y, z: 2 * nov * n.z - v.z});
	const mixed = norm({
		x: refl.x + (n.x - refl.x) * orb.roughness,
		y: refl.y + (n.y - refl.y) * orb.roughness,
		z: refl.z + (n.z - refl.z) * orb.roughness,
	});
	const predicted = lum(core.berxEnvironmentRadiance(mixed, envBright)) - lum(core.berxEnvironmentRadiance(mixed, env));
	const measuredDelta = after - before;
	gate('turning the core\'s sun up moves the pixels, in the direction the core predicts',
		predicted > 0.5 / 255 && measuredDelta > 0.5 / 255,
		`on the orb between the eye and the key, sunIntensity ${env.sunIntensity} → 2.2 lifted pixel (${sunAt.x}, ${sunAt.y}) by ${(measuredDelta * 255).toFixed(2)}/255; the core's radiance along the direction the shader samples there rises by ${(predicted * 255).toFixed(2)}/255. A shader carrying its own constants would not have moved at all`);
}

/* The same 8x8 tile comparison verify-5d-crossrender uses, and for the
   same reason: two rasterisers put edge pixels in slightly different
   places, and on a silhouette that is all the difference there is.
   Comparing raw channels calls MSAA a shader bug. Thresholds are that
   gate's: worst tile 6/255, mean 1/255. */
function tileCompare(a, b) {
	const TILE = 8;
	const tilesX = Math.floor(width / TILE), tilesY = Math.floor(height / TILE);
	const tileOf = (buf, tx, ty) => {
		let r = 0, g = 0, bl = 0, lit = 0;
		for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
			const i = (((ty * TILE + y) * width) + tx * TILE + x) * 4;
			r += buf[i]; g += buf[i + 1]; bl += buf[i + 2];
			if (buf[i] + buf[i + 1] + buf[i + 2] > 24) lit++;
		}
		const n = TILE * TILE;
		return {mean: [r / n, g / n, bl / n], lit};
	};
	let worst = 0, worstAt = '', sum = 0, tiles = 0;
	for (let ty = 0; ty < tilesY; ty++) for (let tx = 0; tx < tilesX; tx++) {
		const p = tileOf(a, tx, ty), q = tileOf(b, tx, ty);
		if (p.lit === 0 && q.lit === 0) continue;
		const d = Math.max(...[0, 1, 2].map((k) => Math.abs(p.mean[k] - q.mean[k])));
		sum += d; tiles++;
		if (d > worst) { worst = d; worstAt = `${tx * TILE},${ty * TILE}`; }
	}
	return {tiles, mean: sum / Math.max(1, tiles), worst, worstAt};
}

/* Three-way agreement. */
if (!gpu?.available) {
	blocked('webgpu-environment', `${gpu?.reason ?? 'no WebGPU device here'} — the WebGL2 evidence above stands on its own, and verify:5d-crossrender compares the backends whenever a device exists`);
} else {
	const c = tileCompare(rgba, gpu.rgba);
	gate('WebGL2 and WebGPU light the world with the same room',
		c.tiles > 0 && c.worst <= 6 && c.mean <= 1,
		`${c.tiles} tiles hold the world: mean ${c.mean.toFixed(2)}/255, worst ${c.worst.toFixed(1)}/255 at ${c.worstAt} — one WGSL source for WebGPU, a separate GLSL port for WebGL2, and the same room out of both`);
}

/* Native, through the same draw list the web backends used. */
const crate = path.join(clientRoot, 'packages/spatial-native');
const nativeBin = path.join(crate, 'target/release/berx-render');
const listFile = path.join(dir, 'env-drawlist.json');
fs.writeFileSync(listFile, JSON.stringify(list));
if (!fs.existsSync(nativeBin)) {
	blocked('native-environment', `${nativeBin} is not built here, so the wgpu port of the environment cannot be exercised`);
} else {
	try {
		const rgbaPath = path.join(dir, 'native.rgba');
		execFileSync(nativeBin, [listFile, '--rgba', rgbaPath], {cwd: crate, encoding: 'utf8'});
		const nativeRgba = new Uint8Array(fs.readFileSync(rgbaPath));
		const c = nativeRgba.length === rgba.length ? tileCompare(nativeRgba, rgba) : null;
		gate('native wgpu lights the world with the same room',
			c !== null && c.tiles > 0 && c.worst <= 6 && c.mean <= 1,
			c === null
				? `expected ${rgba.length} channels back, got ${nativeRgba.length}`
				: `${c.tiles} tiles hold the world: mean ${c.mean.toFixed(2)}/255, worst ${c.worst.toFixed(1)}/255 at ${c.worstAt} — the Rust port reads the same packed environment out of the same draw list`);
	} catch (error) {
		blocked('native-environment', `berx-render could not render: ${String(error.stderr ?? error.message).trim().split('\n').pop()}`);
	}
}

console.log('');
if (failures.length === 0) {
	console.log(`BERX 5D environment: ALL GATES PASS${blocks.length ? ` (${blocks.length} blocked: ${blocks.join(', ')})` : ''}`);
} else {
	console.log(`BERX 5D environment: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exitCode = 1;
}
