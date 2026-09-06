#!/usr/bin/env node
/**
 * The desktop build is a real renderer, and it agrees with the web one.
 *
 * BERX's rule is that platforms differ only in renderer, input, display
 * and capabilities — never in world, identity, time or relations. That
 * is a claim about behaviour, and the only way to hold it to account is
 * to give two entirely different GPU backends the same frame from the
 * same shared core and compare what comes back.
 *
 * So this runs the world once in Node, resolves it to a draw list with
 * the shared resolver, and then:
 *
 *   - renders it natively through wgpu (Vulkan/Metal/D3D12/GL) and reads
 *     the pixels back off the GPU
 *   - renders the same frame through the real WebGL2 backend in headless
 *     Chromium and reads its framebuffer back
 *   - compares the two images
 *
 * If the native backend held a world of its own, or culled differently,
 * or picked its own materials or level of detail, the images would not
 * line up and these gates would fail. That is the point.
 *
 * What is not compared is stated rather than hidden: the native backend
 * has no image decoder and no text rasteriser, so media surfaces and
 * world-space labels are absent from it, and the shared frame used here
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

let web;
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 640, height: 480}, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(base, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_CROSS !== 'undefined');
	web = await page.evaluate(() => {
		const drawList = window.BERX_CROSS.drawList();
		const rendered = window.BERX_CROSS.render();
		return {drawList, rendered};
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

/* ---- 3. the two renderers agree ---- */
if (native && web?.rendered) {
	const nativeRgba = new Uint8Array(fs.readFileSync(path.join(dir, 'native.rgba')));
	const webRgba = Uint8Array.from(web.rendered.rgba);
	const {width, height} = list;
	const sizeOk = nativeRgba.length === width * height * 4 && webRgba.length === width * height * 4;
	gate('both renderers produced the same size image', sizeOk, `${width}x${height}, ${nativeRgba.length} and ${webRgba.length} bytes`);

	if (sizeOk) {
		/* Compared as 8x8 tile means. Two different rasterisers put edge
		   pixels in slightly different places, so a per-pixel equality
		   test would be measuring the rasteriser rather than whether the
		   backends agree about the world. Tile means are insensitive to
		   that and still catch a wrong position, a wrong form, a wrong
		   material or a wrong light. */
		const TILE = 8;
		const tilesX = Math.floor(width / TILE);
		const tilesY = Math.floor(height / TILE);
		const ground = [Math.round(list.clearColor[0] * 255), Math.round(list.clearColor[1] * 255), Math.round(list.clearColor[2] * 255)];
		const isWorld = (buf, i) => Math.abs(buf[i] - ground[0]) > 3 || Math.abs(buf[i + 1] - ground[1]) > 3 || Math.abs(buf[i + 2] - ground[2]) > 3;
		const tileOf = (buf, tx, ty) => {
			let r = 0, g = 0, b = 0, lit = 0;
			for (let y = 0; y < TILE; y++) {
				for (let x = 0; x < TILE; x++) {
					const i = (((ty * TILE + y) * width) + tx * TILE + x) * 4;
					r += buf[i]; g += buf[i + 1]; b += buf[i + 2];
					if (isWorld(buf, i)) lit++;
				}
			}
			const n = TILE * TILE;
			return {mean: [r / n, g / n, b / n], lit};
		};
		/* Only tiles that hold something. Two thirds of this frame is empty
		   ground, identical in both images by construction, and averaging
		   it in would dilute a real disagreement into nothing — a shading
		   error of several per cent would still read as a mean under one.
		   The tiles the world is actually in are the ones that carry the
		   evidence. */
		let worst = 0, worstAt = '', sum = 0, tiles = 0;
		for (let ty = 0; ty < tilesY; ty++) {
			for (let tx = 0; tx < tilesX; tx++) {
				const a = tileOf(nativeRgba, tx, ty), b = tileOf(webRgba, tx, ty);
				if (a.lit === 0 && b.lit === 0) continue;
				const d = Math.max(Math.abs(a.mean[0] - b.mean[0]), Math.abs(a.mean[1] - b.mean[1]), Math.abs(a.mean[2] - b.mean[2]));
				sum += d; tiles++;
				if (d > worst) { worst = d; worstAt = `${tx * TILE},${ty * TILE}`; }
			}
		}
		const mean = sum / Math.max(1, tiles);
		gate('the native and web renderers draw the same world',
			tiles > 0 && worst <= 6 && mean <= 1,
			`${tiles} of ${tilesX * tilesY} tiles of ${TILE}x${TILE} hold the world: mean difference ${mean.toFixed(2)}/255, worst ${worst.toFixed(1)}/255 at ${worstAt}`);

		/* the silhouettes agree: the same pixels are world rather than ground */
		let both = 0, either = 0, nativeOnly = 0, webOnly = 0;
		for (let i = 0; i < nativeRgba.length; i += 4) {
			const n = isWorld(nativeRgba, i), w = isWorld(webRgba, i);
			if (n && w) both++;
			if (n || w) either++;
			if (n && !w) nativeOnly++;
			if (w && !n) webOnly++;
		}
		const overlap = either === 0 ? 0 : both / either;
		gate('the same pixels are world in both renderers',
			either > 0 && overlap >= 0.97,
			`${(overlap * 100).toFixed(2)}% intersection over union · ${nativeOnly} native-only, ${webOnly} web-only of ${either}`);

		/* the world is actually there, in both */
		gate('both renderers drew a world rather than an empty room',
			both > width * height * 0.05,
			`${both} pixels carry the world in both images, of ${width * height}`);
	}
}

/* ---- 4. what the desktop backend still cannot do ---- */
blocked('desktop-media', 'packages/spatial-native has no image decoder: an item with a media surface is counted and left undrawn rather than substituted');
blocked('desktop-labels', 'packages/spatial-native has no text rasteriser: world-space labels are not drawn');
blocked('desktop-window', 'packages/spatial-native renders offscreen and reads back; there is no windowing/input layer, and no display is reachable from this environment to verify one');

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D desktop: ${failures.length} FAILED — ${failures.join('; ')}`);
	fs.rmSync(dir, {recursive: true, force: true});
	process.exit(1);
}
console.log('ALL DESKTOP GATES PASS');
fs.rmSync(dir, {recursive: true, force: true});
