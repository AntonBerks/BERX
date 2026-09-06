#!/usr/bin/env node
/**
 * Three GPU backends, one world, one picture.
 *
 * BERX's rule is that platforms differ only in renderer, input, display
 * and capabilities — never in world, identity, time or relations. That
 * is a claim about behaviour, and the only way to hold it to account is
 * to give entirely different GPU backends the same frame from the same
 * shared core and compare what comes back.
 *
 * So this runs the world once in Node, resolves it to a draw list with
 * the shared resolver, and then renders that one list three ways:
 *
 *   - natively through wgpu (Vulkan here), read back off the GPU
 *   - through the WebGL2 backend in headless Chromium, read back with
 *     readPixels
 *   - through the WebGPU backend in the same browser, read back with
 *     copyTextureToBuffer
 *
 * The WGSL backends — native and WebGPU — run literally the same shader
 * text, from @berx/spatial-shaders. The GLSL one is a separate
 * translation of the same BRDF, which is why it is the interesting
 * comparison: if the shared core were not the only thing deciding what
 * the world looks like, these images would not line up.
 *
 * What is not compared is stated rather than hidden: neither WGSL
 * backend has a media or label path, so the shared frame used here
 * carries neither. Those remain gaps, reported below.
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
const crate = path.join(clientRoot, 'packages/spatial-native');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-desktop-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, reason) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${reason}`);
};

const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');

/* ---- the shared core produces one draw list ---- */
const emit = path.join(dir, 'emit.mjs');
execFileSync(esbuild, [
	path.join(here, '5d-desktop.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${emit}`,
], {cwd: clientRoot, stdio: 'inherit'});
const listFile = path.join(dir, 'drawlist.json');
execFileSync(process.execPath, [emit, listFile], {cwd: clientRoot, stdio: 'inherit'});
const list = JSON.parse(fs.readFileSync(listFile, 'utf8'));

/* ---- the native backend draws it ---- */
let cargoOk = true;
try {
	execFileSync('cargo', ['build', '--release', '--quiet'], {cwd: crate, stdio: 'inherit'});
} catch (error) {
	cargoOk = false;
	blocked('desktop-native-build', `cargo build failed in packages/spatial-native: ${error.message}`);
}

let native;
if (cargoOk) {
	const bin = path.join(crate, 'target/release/berx-render');
	try {
		const out = execFileSync(bin, [listFile, '--rgba', path.join(dir, 'native.rgba'), '--png', path.join(dir, 'native.png')], {
			cwd: crate, encoding: 'utf8',
		});
		native = JSON.parse(out.trim().split('\n').pop());
	} catch (error) {
		blocked('desktop-native-render', `${bin} could not render: no GPU adapter reachable, or the draw list no longer matches the shared core's shape (${String(error.stderr ?? error.message).trim().split('\n').pop()})`);
	}
}

/* ---- the web backend draws the same frame ---- */
execFileSync(esbuild, [
	path.join(here, '5d-crossrender.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D cross-render</title>
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

let web;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	web = await page.evaluate(async () => {
		const drawList = window.BERX_CROSS.drawList();
		const rendered = window.BERX_CROSS.render();
		const webgpu = await window.BERX_CROSS.renderWebGPU();
		return {drawList, rendered, webgpu};
	});
	if (errors.length > 0) gate('the web backend renders the shared frame without errors', false, errors.join(' | '));
} finally {
	await browser.close();
	server.close();
}

/* ---- 1. one core, one draw list ---- */
const webList = web.drawList;
const sameShape = webList.items.length === list.items.length &&
	webList.items.every((item, i) => item.id === list.items[i].id && item.primitive === list.items[i].primitive && item.lod === list.items[i].lod);
gate('the draw list is the same in Node and in the browser',
	sameShape,
	`${list.items.length} items in the same order: ${list.items.map((i) => `${i.id}/${i.primitive}`).join(', ')}`);

let maxMatrixDelta = 0;
for (let i = 0; i < Math.min(webList.items.length, list.items.length); i++) {
	for (let k = 0; k < 16; k++) {
		maxMatrixDelta = Math.max(maxMatrixDelta, Math.abs(webList.items[i].model[k] - list.items[i].model[k]));
	}
}
gate('the two runtimes place every object at the same coordinates',
	sameShape && maxMatrixDelta < 1e-6,
	`largest difference across every model matrix: ${maxMatrixDelta.toExponential(2)}`);

/* ---- 2. the native backend really ran on a GPU ---- */
if (native) {
	gate('a native GPU backend rendered the world',
		native.drawCalls === list.items.length && native.triangles > 0,
		`${native.backend} · ${native.adapter} · ${native.drawCalls} draw calls · ${native.triangles} triangles · ${native.meshVariants} mesh variants`);
	gate('the native frame came back off the GPU with a world in it',
		native.readback.nonGroundPixels > 0 && native.readback.nonGroundPixels < native.readback.totalPixels,
		`${native.readback.nonGroundPixels} of ${native.readback.totalPixels} pixels are not the ground; brightest luma ${native.readback.brightestLuma}`);
	gate('the native backend reports only what it implements',
		native.capabilities.shadows === false && native.capabilities.postProcessing === false &&
		native.capabilities.mediaSurfaces === false && native.capabilities.worldSpaceLabels === false &&
		native.capabilities.physicallyLitMaterials === true && native.capabilities.depthBuffer === true,
		'perspective, depth and physically lit materials true; shadows, post, media and labels false');
} else {
	failures.push('a native GPU backend rendered the world');
}

/* ---- 3. the renderers agree ---- */
const {width, height} = list;
const ground = [Math.round(list.clearColor[0] * 255), Math.round(list.clearColor[1] * 255), Math.round(list.clearColor[2] * 255)];
const isWorld = (buf, i) => Math.abs(buf[i] - ground[0]) > 3 || Math.abs(buf[i + 1] - ground[1]) > 3 || Math.abs(buf[i + 2] - ground[2]) > 3;

/**
 * Compare two readbacks as 8x8 tile means, over the tiles the world is
 * actually in.
 *
 * Two different rasterisers put edge pixels in slightly different
 * places, so a per-pixel equality test would be measuring the
 * rasteriser rather than whether the backends agree about the world.
 * Tile means are insensitive to that and still catch a wrong position,
 * a wrong form, a wrong material or a wrong light. Empty ground is
 * excluded because it is identical in both by construction and would
 * dilute a real disagreement into nothing — two thirds of this frame is
 * ground, and averaging it in turns an 8% shading error into a mean
 * under one.
 */
function compare(a, b) {
	const TILE = 8;
	const tilesX = Math.floor(width / TILE);
	const tilesY = Math.floor(height / TILE);
	const tileOf = (buf, tx, ty) => {
		let r = 0, g = 0, bl = 0, lit = 0;
		for (let y = 0; y < TILE; y++) {
			for (let x = 0; x < TILE; x++) {
				const i = (((ty * TILE + y) * width) + tx * TILE + x) * 4;
				r += buf[i]; g += buf[i + 1]; bl += buf[i + 2];
				if (isWorld(buf, i)) lit++;
			}
		}
		const n = TILE * TILE;
		return {mean: [r / n, g / n, bl / n], lit};
	};
	let worst = 0, worstAt = '', sum = 0, tiles = 0;
	for (let ty = 0; ty < tilesY; ty++) {
		for (let tx = 0; tx < tilesX; tx++) {
			const p = tileOf(a, tx, ty), q = tileOf(b, tx, ty);
			if (p.lit === 0 && q.lit === 0) continue;
			const d = Math.max(Math.abs(p.mean[0] - q.mean[0]), Math.abs(p.mean[1] - q.mean[1]), Math.abs(p.mean[2] - q.mean[2]));
			sum += d; tiles++;
			if (d > worst) { worst = d; worstAt = `${tx * TILE},${ty * TILE}`; }
		}
	}
	let both = 0, either = 0, aOnly = 0, bOnly = 0;
	for (let i = 0; i < a.length; i += 4) {
		const p = isWorld(a, i), q = isWorld(b, i);
		if (p && q) both++;
		if (p || q) either++;
		if (p && !q) aOnly++;
		if (q && !p) bOnly++;
	}
	return {
		tiles, total: tilesX * tilesY,
		mean: sum / Math.max(1, tiles), worst, worstAt,
		both, either, aOnly, bOnly,
		overlap: either === 0 ? 0 : both / either,
	};
}

function agree(name, a, b, detail) {
	if (!a || !b) { failures.push(name); console.log(`FAIL  ${name}`); console.log(`      one of the two images is missing`); return; }
	if (a.length !== width * height * 4 || b.length !== width * height * 4) {
		failures.push(name); console.log(`FAIL  ${name}`);
		console.log(`      expected ${width * height * 4} bytes each, got ${a.length} and ${b.length}`);
		return;
	}
	const c = compare(a, b);
	gate(name, c.tiles > 0 && c.worst <= 6 && c.mean <= 1 && c.overlap >= 0.97,
		`${detail} · ${c.tiles} of ${c.total} tiles hold the world: mean ${c.mean.toFixed(2)}/255, worst ${c.worst.toFixed(1)}/255 at ${c.worstAt} · ${(c.overlap * 100).toFixed(2)}% silhouette IoU (${c.aOnly}/${c.bOnly} disagreeing pixels of ${c.either})`);
	return c;
}

const nativeRgba = native ? new Uint8Array(fs.readFileSync(path.join(dir, 'native.rgba'))) : undefined;
const webglRgba = web?.rendered ? Uint8Array.from(web.rendered.rgba) : undefined;
const webgpuRgba = web?.webgpu?.available ? Uint8Array.from(web.webgpu.rgba) : undefined;

const nativeVsWebgl = agree('the native (wgpu) and WebGL2 renderers draw the same world', nativeRgba, webglRgba, 'Vulkan vs WebGL2');

if (webgpuRgba) {
	gate('a WebGPU backend of BERX rendered the world',
		web.webgpu.kind === 'webgpu' && web.webgpu.stats.drawCalls === list.items.length && web.webgpu.stats.triangles > 0,
		`${web.webgpu.stats.drawCalls} draw calls · ${web.webgpu.stats.triangles} triangles · ${web.webgpu.stats.meshVariants} mesh variants`);
	gate('the WebGPU backend reports only what it implements',
		web.webgpu.capabilities.shadows === false && web.webgpu.capabilities.postProcessing === false &&
		web.webgpu.capabilities.mediaSurfaces === false && web.webgpu.capabilities.worldSpaceLabels === false &&
		web.webgpu.capabilities.physicallyLitMaterials === true,
		'perspective, depth and physically lit materials true; shadows, post, media and labels false');
	agree('the WebGPU and WebGL2 renderers draw the same world', webgpuRgba, webglRgba, 'WebGPU vs WebGL2');
	agree('the WebGPU and native renderers draw the same world', webgpuRgba, nativeRgba, 'WebGPU vs Vulkan — the same WGSL, two implementations');
} else {
	blocked('webgpu-backend-render', `packages/spatial-web/src/webgpuRuntime.ts exists and is exercised, but this browser gave it no device: ${web?.webgpu?.reason ?? 'renderWebGPU() returned nothing'}`);
}

if (nativeVsWebgl) {
	gate('all three backends drew a world rather than an empty room',
		nativeVsWebgl.both > width * height * 0.05,
		`${nativeVsWebgl.both} pixels carry the world in both GPU images, of ${width * height}`);
}

/* ---- 4. what these backends still cannot do ---- */
blocked('wgsl-media', 'neither WGSL backend uploads media: packages/spatial-native has no image decoder, and copyExternalImageToTexture is unsupported on the driver these gates run against. The WebGL2 backend remains the only one that draws a photograph');
blocked('wgsl-labels', 'neither WGSL backend has a text rasteriser: world-space labels are drawn only by WebGL2, and the frame compared here carries none');
blocked('webgpu-product', 'the WebGPU backend draws the world pass and agrees with WebGL2, but it has no media, label, action-ring or picking path, so packages/spatial-web/src/runtimeHost5d.ts still runs WebGL2 and no end-to-end product session renders through WebGPU');
blocked('desktop-window', 'packages/spatial-native renders offscreen and reads back; there is no windowing/input layer, no installer, and no display is reachable from this environment to verify one');

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D cross-renderer: ${failures.length} FAILED — ${failures.join('; ')}`);
	fs.rmSync(dir, {recursive: true, force: true});
	process.exit(1);
}
console.log('ALL CROSS-RENDERER GATES PASS');
fs.rmSync(dir, {recursive: true, force: true});
