#!/usr/bin/env node
/**
 * Shadows — does an occluder darken what is under it?
 *
 * That is the whole question, and it is not answered by a depth
 * texture existing, a pipeline compiling, or a capability flag turning
 * true. It is answered by two images of the SAME world, one with the
 * key light casting and one without, and a measurable difference in
 * exactly the place the geometry says a shadow must fall.
 *
 * The fixture is deliberately unambiguous — a wide flat floor, one orb
 * directly above its centre, a key light straight down — because a
 * question about where light falls needs known geometry to have an
 * answer at all. Everything else about it is real: real spatial
 * objects, the real palette and material resolution, the real camera,
 * the real draw list, the real backend.
 *
 * The maths is checked as well as the pixels, and separately: the
 * light camera is fitted in the shared core so all three backends put
 * the light in the same place, and a camera that is wrong in the same
 * way everywhere would still be wrong.
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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-shadows-'));

/* ---------------- the light camera, in the core ---------------- */
const coreBundle = path.join(dir, 'core.mjs');
execFileSync(esbuild, [
	path.join(here, 'shadows.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${coreBundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {berxShadowCamera, berxBuildDrawList, berxShadowFixtureFrame, berxShadowFixtureLighting, BERX_SHADOW_MAP_SIZE} =
	await import(`file://${coreBundle}`);

const down = {x: 0, y: -1, z: 0};
const camera = berxShadowCamera([{position: {x: 0, y: 0, z: 0}, radius: 4}], down);
gate('the light gets a real camera, fitted to what is being drawn',
	camera !== undefined && camera.mapSize === BERX_SHADOW_MAP_SIZE &&
	camera.viewProjection.length === 16 && camera.texelWorldSize > 0 && camera.depthBias > 0,
	`a ${camera.mapSize}² map over a 4m radius: ${(camera.texelWorldSize * 1000).toFixed(2)}mm per texel, depth bias ${camera.depthBias.toFixed(5)}, normal bias ${camera.normalBias.toFixed(5)} — both scaled by the texel, so they are correct at any box size rather than tuned for one scene`);

gate('an empty world gets no shadow pass at all',
	berxShadowCamera([], down) === undefined,
	'a pass over nothing is a wasted pass, and an ortho box fitted to nothing is a division by zero waiting to happen');

/* The snapping check. Moving the world by a fraction of a texel must
   NOT move the light box, or every shadow edge crawls as the viewer
   walks — the classic shimmer, and the one thing about a shadow map
   that is invisible in a still image and obvious in motion. */
const a = berxShadowCamera([{position: {x: 0, y: 0, z: 0}, radius: 4}], down);
const nudged = berxShadowCamera([{position: {x: a.texelWorldSize * 0.2, y: 0, z: 0}, radius: 4}], down);
const bigMove = berxShadowCamera([{position: {x: a.texelWorldSize * 40, y: 0, z: 0}, radius: 4}], down);
/* compared on the VIEW, not the projection: since the snapping moved
   ahead of the view, the ortho box is always centred and the projection
   no longer carries the offset. Comparing it would have been a test
   that passes without testing anything. */
gate('the light box is snapped to whole texels, so shadow edges do not crawl',
	JSON.stringify(a.viewProjection) === JSON.stringify(nudged.viewProjection) &&
	JSON.stringify(a.viewProjection) !== JSON.stringify(bigMove.viewProjection),
	`moving the world a fifth of a texel (${(a.texelWorldSize * 0.2 * 1000).toFixed(2)}mm) leaves the projection identical; moving it 40 texels changes it. The box moves in discrete steps the depth samples land on identically`);

const turned = berxShadowCamera([{position: {x: 0, y: 0, z: 0}, radius: 4}], {x: 0.4, y: -1, z: 0.3});
gate('the fit does not change size when the light turns',
	Math.abs(turned.texelWorldSize - a.texelWorldSize) < 1e-9,
	'fitted to the bounding SPHERE, not the box: a box-fitted camera changes size as the light turns and every shadow in the world resizes with it');

/* ---------------- the draw list carries it, and can turn it off ---------------- */
const frame = berxShadowFixtureFrame();
const lighting = berxShadowFixtureLighting();
const on = berxBuildDrawList(frame, {width: 480, height: 360, lighting});
const off = berxBuildDrawList(frame, {width: 480, height: 360, lighting, shadows: false});
gate('the shared draw list carries the light camera, and the switch really removes it',
	on.shadow !== undefined && off.shadow === undefined &&
	JSON.stringify(on.items) === JSON.stringify(off.items),
	'one list, two answers: with shadows the light has a camera, without it there is none — and every item is byte-identical either way, so turning shadows off changes the lighting and nothing else about the world');

/* ---------------- the pixels ---------------- */
execFileSync(esbuild, [
	path.join(here, '5d-crossrender.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D shadows</title>
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

let pair;
let webgpu;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	pair = await page.evaluate(() => window.BERX_CROSS.renderShadowPair());
	webgpu = await page.evaluate(async () => await window.BERX_CROSS.renderShadowPairWebGPU());
	gate('the shadow pass runs on a real GPU without errors',
		errors.length === 0,
		errors.length === 0 ? 'the depth pass, the comparison sampler and the 3x3 kernel all compiled and ran' : errors.join(' | '));
} finally {
	await browser.close();
	server.close();
}

const {width, height, withShadows, withoutShadows} = pair;
const luminance = (px, x, y) => {
	const i = (y * width + x) * 4;
	return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
};
/** Mean luminance of a box, which is what a shadow changes. */
const region = (px, x0, y0, x1, y1) => {
	let sum = 0;
	let n = 0;
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			sum += luminance(px, x, y);
			n++;
		}
	}
	return sum / Math.max(1, n);
};

/**
 * Where the shadow MUST be, predicted from the geometry rather than
 * picked by eye.
 *
 * The occluder stands at (0, 1.4, 0) and the light points straight
 * down, so its shadow lands on the floor at (0, −1.2, 0). That world
 * point is projected through the same matrices the frame was drawn
 * with, which turns "the shadow is under the orb" into a pixel
 * coordinate the gate can sample. A hand-picked screen box would pass
 * or fail for reasons that have nothing to do with the renderer.
 */
const project = (x, y, z) => {
	const {projection, view} = pair;
	const apply = (m, v) => [
		m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
		m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
		m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
		m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
	];
	const clip = apply(projection, apply(view, [x, y, z, 1]));
	const w = Math.max(1e-6, clip[3]);
	return {
		x: Math.round((clip[0] / w * 0.5 + 0.5) * width),
		/* the readback was flipped to top-row-first when it was taken */
		y: Math.round((0.5 - clip[1] / w * 0.5) * height),
	};
};
const half = 14;
const under = project(0, -1.2, 0);
/* the same floor, well outside the occluder's footprint */
const aside = project(-3.6, -1.2, 0);
const box = (at) => [
	Math.max(0, at.x - half), Math.max(0, at.y - half),
	Math.min(width, at.x + half), Math.min(height, at.y + half),
];
const [uX0, uY0, uX1, uY1] = box(under);
const [aX0, aY0, aX1, aY1] = box(aside);

const underLit = region(withoutShadows, uX0, uY0, uX1, uY1);
const underShadowed = region(withShadows, uX0, uY0, uX1, uY1);
const asideLit = region(withoutShadows, aX0, aY0, aX1, aY1);
const asideShadowed = region(withShadows, aX0, aY0, aX1, aY1);

gate('the floor under the occluder really darkens',
	underShadowed < underLit - 3,
	`under the orb — the world point (0, −1.2, 0) projected to pixel (${under.x}, ${under.y}) — ${underLit.toFixed(2)} lit → ${underShadowed.toFixed(2)} shadowed (${(100 * (1 - underShadowed / Math.max(underLit, 1e-6))).toFixed(1)}% darker), measured on a real GPU readback of the same world twice`);

gate('the floor away from the occluder does not',
	Math.abs(asideShadowed - asideLit) < 1.5,
	`beside the orb, at (−3.6, −1.2, 0) → pixel (${aside.x}, ${aside.y}): ${asideLit.toFixed(2)} → ${asideShadowed.toFixed(2)} — a shadow that darkened the whole floor would be a global dimming, not a shadow`);

gate('the shadow is where the geometry says, not merely somewhere',
	(underLit - underShadowed) > (Math.abs(asideLit - asideShadowed) + 3),
	`the darkening under the orb (${(underLit - underShadowed).toFixed(2)}) is far larger than anywhere else on the same floor (${Math.abs(asideLit - asideShadowed).toFixed(2)})`);

/* A shadow that is not in shadow must still be lit: a surface out of
   the sun receives the ambient room, and a black pixel is a cutout. */
gate('a shadowed surface still receives the room',
	underShadowed > 2,
	`the shadowed floor sits at ${underShadowed.toFixed(2)} rather than at zero: only the KEY is removed, because a surface out of the sun still receives the bounced room. Zeroing the pixel is what makes a render look like a cutout`);

let differing = 0;
for (let i = 0; i < withShadows.length; i += 4) {
	if (withShadows[i] !== withoutShadows[i] || withShadows[i + 1] !== withoutShadows[i + 1] || withShadows[i + 2] !== withoutShadows[i + 2]) differing++;
}
gate('turning shadows off really changes the image, and only where it should',
	differing > 500 && differing < width * height * 0.5,
	`${differing} of ${width * height} pixels differ between the two renders — enough to be a shadow, far from the whole frame, which is what a global dimming would look like`);

/* ---------------- the same question, asked of WebGPU ---------------- */
if (!webgpu?.available) {
	console.log('BLOCKED  webgpu-shadows');
	console.log(`         ${webgpu?.reason ?? 'no WebGPU device here'} — the WebGL2 evidence above stands on its own, and the cross-renderer gate compares the two backends pixel for pixel when a device exists`);
} else {
	const gpuUnderLit = region(webgpu.withoutShadows, uX0, uY0, uX1, uY1);
	const gpuUnderShadowed = region(webgpu.withShadows, uX0, uY0, uX1, uY1);
	const gpuAsideLit = region(webgpu.withoutShadows, aX0, aY0, aX1, aY1);
	const gpuAsideShadowed = region(webgpu.withShadows, aX0, aY0, aX1, aY1);
	gate('WebGPU casts the same shadow, asked directly rather than by agreement',
		gpuUnderShadowed < gpuUnderLit - 3 && Math.abs(gpuAsideShadowed - gpuAsideLit) < 1.5,
		`the same world through the WebGPU backend: under the orb ${gpuUnderLit.toFixed(2)} → ${gpuUnderShadowed.toFixed(2)}, beside it ${gpuAsideLit.toFixed(2)} → ${gpuAsideShadowed.toFixed(2)}. Agreement with WebGL2 is evidence that two backends are the same; this is evidence that this one casts`);
	gate('and it casts it in the same place, to within a rounding difference',
		Math.abs((gpuUnderLit - gpuUnderShadowed) - (underLit - underShadowed)) < 6,
		`WebGL2 darkened the floor by ${(underLit - underShadowed).toFixed(2)} and WebGPU by ${(gpuUnderShadowed ? gpuUnderLit - gpuUnderShadowed : 0).toFixed(2)} — one shared light camera, one shared shader source, two APIs`);
}

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D shadows: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL SHADOW GATES PASS');
