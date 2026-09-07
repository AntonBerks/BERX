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
 *   - natively again, this time presented to a real desktop window and
 *     copied off its swapchain
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

/* ---- and the same list, presented to a real desktop window ---- */
let windowed;
if (cargoOk) {
	/* A window needs a window system. Under Xvfb there is one, so the
	   swapchain, the present and the resize are all real; without one
	   this is honestly blocked rather than skipped quietly. */
	const display = process.env.DISPLAY;
	const runner = display ? null : (fs.existsSync('/usr/bin/xvfb-run') ? '/usr/bin/xvfb-run' : null);
	if (!display && !runner) {
		blocked('desktop-window', 'no display and no Xvfb: a window cannot be opened here, so the swapchain and present path cannot be exercised');
	} else {
		const bin = path.join(crate, 'target/release/berx-window');
		const run = (argv) => {
			const out = runner
				? execFileSync(runner, ['-a', bin, ...argv], {cwd: crate, encoding: 'utf8'})
				: execFileSync(bin, argv, {cwd: crate, encoding: 'utf8'});
			return JSON.parse(out.trim().split('\n').pop());
		};
		const rgba = path.join(dir, 'window.rgba');
		try {
			/* two runs, because they answer different questions: one at the
			   draw list's own size, whose captured frame can be compared
			   byte for byte against the offscreen render of the same list;
			   and one that really resizes, which necessarily ends at a
			   different size and so cannot be. */
			const steady = run([listFile, '--frames', '8', '--rgba', rgba]);
			const resized = run([listFile, '--frames', '12', '--resize', '320x240']);
			windowed = {...steady, rgbaPath: rgba, resized};
		} catch (error) {
			blocked('desktop-window', `berx-window could not open or present: ${String(error.stderr ?? error.message).trim().split('\n').pop()}`);
		}
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

/* a real BERX photograph from the repository, not a generated swatch:
   the media path has to survive a real decode, a real aspect ratio and a
   real upload, and a flat colour would pass a test that a photograph
   would not */
const MEDIA_ASSET = path.resolve(clientRoot, '../assets/media/atmosphere/berx-atmosphere-wallpaper-01.jpg');

const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg'};
const server = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
	if (name === '/media.jpg') {
		res.writeHead(200, {'content-type': 'image/jpeg'});
		return void fs.createReadStream(MEDIA_ASSET).pipe(res);
	}
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
		const media = await window.BERX_CROSS.renderMedia(new URL('/media.jpg', location.href).href);
		const labelled = await window.BERX_CROSS.renderLabelled();
		const recovered = await window.BERX_CROSS.renderAfterDeviceLoss();
		return {drawList, rendered, webgpu, media, labelled, recovered};
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

/* One call per entity, plus one per particle field, plus one for the
   volumetric composite. Each of those is a real draw and is counted as
   one — an assertion of exactly items.length would now be asserting
   that the air is neither lit nor carrying anything. */
const compositeCalls = list.volumetric && list.shadow ? 1 : 0;
const particleCalls = list.basis ? list.particles.length : 0;
const airCalls = compositeCalls + particleCalls;
const airNote = `${list.items.length} entities + ${particleCalls} particle fields + ${compositeCalls} volumetric composite`;

/* ---- 2. the native backend really ran on a GPU ---- */
if (native) {
	gate('a native GPU backend rendered the world',
		native.drawCalls === list.items.length + airCalls && native.triangles > 0,
		`${native.backend} · ${native.adapter} · ${native.drawCalls} draw calls (${airNote}) · ${native.triangles} triangles · ${native.meshVariants} mesh variants`);
	gate('the native frame came back off the GPU with a world in it',
		native.readback.nonGroundPixels > 0 && native.readback.nonGroundPixels < native.readback.totalPixels,
		`${native.readback.nonGroundPixels} of ${native.readback.totalPixels} pixels are not the ground; brightest luma ${native.readback.brightestLuma}`);
	gate('the native backend reports only what it implements',
		native.capabilities.shadows === true && native.capabilities.postProcessing === false &&
		native.capabilities.mediaSurfaces === false && native.capabilities.worldSpaceLabels === false &&
		native.capabilities.physicallyLitMaterials === true && native.capabilities.depthBuffer === true,
		'perspective, depth, physically lit materials, shadows and volumetric light true; post, media and labels false — the shadow claim is not taken on trust here, it is what npm run verify:5d-shadows measures on a real readback, and what the three-way pixel agreement below would break if this backend cast differently from the other two');
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

/**
 * `worstTile` is 6/255 by default: two rasterisers put edge pixels in
 * slightly different places, and on solid forms that is all the
 * difference there is. The name pass gets 10, because a glyph is
 * one-pixel-wide strokes where every filtering difference lands on the
 * ink rather than being averaged against a surface — the WebGL2 mipmap
 * chain is built by the driver from non-premultiplied pixels and the
 * WebGPU one on the CPU from alpha-weighted ones, and that shows up on
 * a letter's edge and nowhere else.
 */
function agree(name, a, b, detail, worstTile = 6) {
	if (!a || !b) { failures.push(name); console.log(`FAIL  ${name}`); console.log(`      one of the two images is missing`); return; }
	if (a.length !== width * height * 4 || b.length !== width * height * 4) {
		failures.push(name); console.log(`FAIL  ${name}`);
		console.log(`      expected ${width * height * 4} bytes each, got ${a.length} and ${b.length}`);
		return;
	}
	const c = compare(a, b);
	gate(name, c.tiles > 0 && c.worst <= worstTile && c.mean <= 1 && c.overlap >= 0.97,
		`${detail} · ${c.tiles} of ${c.total} tiles hold the world: mean ${c.mean.toFixed(2)}/255, worst ${c.worst.toFixed(1)}/255 at ${c.worstAt} · ${(c.overlap * 100).toFixed(2)}% silhouette IoU (${c.aOnly}/${c.bOnly} disagreeing pixels of ${c.either})`);
	return c;
}

const nativeRgba = native ? new Uint8Array(fs.readFileSync(path.join(dir, 'native.rgba'))) : undefined;
const webglRgba = web?.rendered ? Uint8Array.from(web.rendered.rgba) : undefined;
const webgpuRgba = web?.webgpu?.available ? Uint8Array.from(web.webgpu.rgba) : undefined;

if (process.env.BERX_DEBUG_DUMP) {
	for (const [name, buf] of [['native', nativeRgba], ['webgl', webglRgba], ['webgpu', webgpuRgba]]) {
		if (buf) fs.writeFileSync(path.join(process.env.BERX_DEBUG_DUMP, `${name}.rgba`), Buffer.from(buf));
	}
	console.log(`dumped to ${process.env.BERX_DEBUG_DUMP}`);
}

const nativeVsWebgl = agree('the native (wgpu) and WebGL2 renderers draw the same world', nativeRgba, webglRgba, 'Vulkan vs WebGL2');

if (webgpuRgba) {
	gate('the WebGPU backend reported no device errors',
		web.webgpu.errors.length === 0,
		web.webgpu.errors.length === 0 ? 'no uncaptured validation or out-of-memory errors' : web.webgpu.errors.join(' | '));
	gate('a WebGPU backend of BERX rendered the world',
		web.webgpu.kind === 'webgpu' && web.webgpu.stats.drawCalls === list.items.length + airCalls && web.webgpu.stats.triangles > 0,
		`${web.webgpu.stats.drawCalls} draw calls (${airNote}) · ${web.webgpu.stats.triangles} triangles · ${web.webgpu.stats.meshVariants} mesh variants`);
	gate('the WebGPU backend reports only what it implements',
		web.webgpu.capabilities.shadows === true && web.webgpu.capabilities.postProcessing === false &&
		web.webgpu.capabilities.mediaMipmaps === true && web.webgpu.capabilities.labelMipmaps === true &&
		web.webgpu.capabilities.worldSpaceLabels === true &&
		web.webgpu.capabilities.mediaSurfaces === true && web.webgpu.capabilities.physicallyLitMaterials === true,
		'perspective, depth, physically lit materials, shadows, media surfaces, world-space labels and mipmapped textures true; post false');
	agree('the WebGPU and WebGL2 renderers draw the same world', webgpuRgba, webglRgba, 'WebGPU vs WebGL2');
	agree('the WebGPU and native renderers draw the same world', webgpuRgba, nativeRgba, 'WebGPU vs Vulkan — the same WGSL, two implementations');
} else {
	blocked('webgpu-backend-render', `packages/spatial-web/src/webgpuRuntime.ts exists and is exercised, but this browser gave it no device: ${web?.webgpu?.reason ?? 'renderWebGPU() returned nothing'}`);
}

/* ---- 3b. the media path, on its own ---- */
const media = web?.media;
if (media?.available) {
	const glMedia = Uint8Array.from(media.webgl.rgba);
	const gpuMedia = Uint8Array.from(media.webgpu.rgba);
	gate('both web backends uploaded the real photograph',
		media.webgl.residentTextures === 1 && media.webgpu.residentTextures === 1 && media.errors.length === 0,
		`${media.webgl.residentTextures} texture resident on WebGL2, ${media.webgpu.residentTextures} on WebGPU, ${media.errors.length} device errors`);

	/* the picture is actually on the surface: the frame with media must
	   differ from the same frame without it, and only where the surface is */
	const changed = (a, b) => {
		let n = 0;
		for (let i = 0; i < a.length; i += 4) {
			if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) n++;
		}
		return n;
	};
	const glChanged = webglRgba ? changed(glMedia, webglRgba) : 0;
	const gpuChanged = webgpuRgba ? changed(gpuMedia, webgpuRgba) : 0;
	gate('the photograph reaches the surface in both backends',
		glChanged > 2000 && gpuChanged > 2000,
		`${glChanged} pixels changed on WebGL2 and ${gpuChanged} on WebGPU when ${media.objectId} was given a picture`);

	agree('the WebGPU and WebGL2 media surfaces show the same photograph', gpuMedia, glMedia,
		'writeTexture from decoded pixels vs texImage2D');
} else if (media) {
	blocked('webgpu-media-render', `the media comparison could not run: ${media.reason}`);
}

/* ---- 3c. the names, on their own ---- */
const labelled = web?.labelled;
if (labelled?.available) {
	const glLabels = Uint8Array.from(labelled.webgl.rgba);
	const gpuLabels = Uint8Array.from(labelled.webgpu.rgba);
	gate('both web backends rasterised the same names',
		labelled.placed.length > 0 &&
		labelled.webgl.residentLabels === labelled.webgpu.residentLabels &&
		labelled.errors.length === 0,
		`${labelled.placed.length} names placed by the shared core (${labelled.placed.map((l) => l.text).join(', ')}); ${labelled.webgl.residentLabels} glyph textures resident on WebGL2, ${labelled.webgpu.residentLabels} on WebGPU`);

	const changedPixels = (a, b) => {
		let n = 0;
		for (let i = 0; i < a.length; i += 4) {
			if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) n++;
		}
		return n;
	};
	const glDrew = webglRgba ? changedPixels(glLabels, webglRgba) : 0;
	const gpuDrew = webgpuRgba ? changedPixels(gpuLabels, webgpuRgba) : 0;
	gate('the names actually reach the frame in both backends',
		glDrew > 500 && gpuDrew > 500,
		`${glDrew} pixels changed on WebGL2 and ${gpuDrew} on WebGPU when the world was given its names`);

	agree('the WebGPU and WebGL2 name passes put the same words in the same place', gpuLabels, glLabels,
		'one rasteriser, one set of placements, two GPU APIs', 10);
} else if (labelled) {
	blocked('webgpu-label-render', `the name comparison could not run: ${labelled.reason}`);
}

/* ---- 3d. a real device loss, and recovery from it ---- */
const recovered = web?.recovered;
if (recovered?.available) {
	gate('a WebGPU device can really be lost, and the backend notices',
		typeof recovered.reason === 'string' && recovered.reason.length > 0 && typeof recovered.lostFlag === 'string',
		`destroy() ended the device and device.lost resolved: ${recovered.reason}`);
	const beforeLoss = Uint8Array.from(recovered.before);
	const afterLoss = Uint8Array.from(recovered.after);
	gate('drawing into a dead device does nothing rather than throwing',
		recovered.errors.length === 0,
		recovered.errors.length === 0 ? 'no uncaptured errors on the replacement device' : recovered.errors.join(' | '));
	agree('the same world comes back identical on a new device', afterLoss, beforeLoss,
		'the draw list was never the renderer\'s to lose');
} else if (recovered) {
	blocked('webgpu-device-loss', `device-loss recovery could not be exercised: ${recovered.reason}`);
}

if (nativeVsWebgl) {
	gate('all three backends drew a world rather than an empty room',
		nativeVsWebgl.both > width * height * 0.05,
		`${nativeVsWebgl.both} pixels carry the world in both GPU images, of ${width * height}`);
}

/* ---- 3e. a real window, a real swapchain ---- */
if (windowed) {
	gate('a real desktop window presents the world',
		windowed.framesPresented >= 8 && windowed.drawCalls === list.items.length + airCalls && windowed.capabilities.swapchain === true,
		`${windowed.backend} · ${windowed.adapter} · ${windowed.framesPresented} frames presented to a ${windowed.surfaceFormat} swapchain, ${windowed.drawCalls} draw calls (${airNote})`);
	gate('the window really resizes, and keeps drawing',
		windowed.resized.resizedTo === windowed.resized.resizeRequested &&
		windowed.resized.window.width === 320 && windowed.resized.window.height === 240 &&
		windowed.resized.framesPresented >= 12,
		`the window system granted ${windowed.resized.resizedTo} mid-run, the swapchain was rebuilt for it, and ${windowed.resized.framesPresented} frames were presented across the change`);
	gate('the window shell reports input rather than acting on it',
		windowed.capabilities.worldNavigation === false && Array.isArray(windowed.resized.intents) && windowed.resized.intents.length > 0,
		`intents observed: ${windowed.resized.intents.join(', ')} — navigation stays in @berx/spatial`);

	/* The swapchain chose BGRA and the offscreen path is RGBA, so the
	   comparison swaps the channels. That is the only difference the
	   window is allowed to make: same list, same shader, same pass. */
	const windowRgba = fs.existsSync(windowed.rgbaPath) ? new Uint8Array(fs.readFileSync(windowed.rgbaPath)) : undefined;
	if (windowRgba && nativeRgba && windowRgba.length === nativeRgba.length) {
		const bgra = /Bgra/i.test(windowed.surfaceFormat);
		let differing = 0, worst = 0;
		for (let i = 0; i < nativeRgba.length; i += 4) {
			const r = bgra ? windowRgba[i + 2] : windowRgba[i];
			const g = windowRgba[i + 1];
			const b = bgra ? windowRgba[i] : windowRgba[i + 2];
			const d = Math.max(Math.abs(r - nativeRgba[i]), Math.abs(g - nativeRgba[i + 1]), Math.abs(b - nativeRgba[i + 2]));
			if (d > 0) differing++;
			if (d > worst) worst = d;
		}
		gate('what the window showed is what the offscreen path rendered, byte for byte',
			differing === 0,
			`${nativeRgba.length / 4} pixels compared through the ${windowed.surfaceFormat} swizzle, ${differing} differ, worst ${worst}`);
	} else {
		gate('what the window showed is what the offscreen path rendered, byte for byte', false,
			`captured ${windowRgba?.length ?? 0} bytes against ${nativeRgba?.length ?? 0} offscreen`);
	}
}

/* ---- 3f. something a person could actually install ---- */
let packaged;
try {
	const out = execFileSync(process.execPath, [path.join(here, 'package-desktop.mjs'), path.join(dir, 'package')], {
		cwd: clientRoot, encoding: 'utf8',
	});
	packaged = JSON.parse(out.trim().split('\n').pop());
} catch (error) {
	blocked('desktop-packaging', `the desktop package could not be built: ${String(error.stderr ?? error.message).trim().split('\n').pop()}`);
}
if (packaged) {
	gate('the desktop shell builds into an installable package',
		fs.existsSync(packaged.deb) && packaged.debBytes > 100_000 && fs.existsSync(packaged.tarball),
		`berx-desktop ${packaged.version} ${packaged.arch}: ${(packaged.debBytes / 1e6).toFixed(1)}MB .deb and ${(packaged.tarballBytes / 1e6).toFixed(1)}MB tarball`);

	/* installed into a root of its own, so what the package actually
	   contains is what is checked rather than what it meant to */
	const root = path.join(dir, 'installed');
	fs.mkdirSync(root, {recursive: true});
	execFileSync('dpkg-deb', ['-x', packaged.deb, root], {stdio: 'inherit'});
	const installed = ['usr/bin/berx', 'usr/share/applications/berx.desktop', 'usr/share/icons/hicolor/scalable/apps/berx.svg'];
	const present = installed.filter((f) => fs.existsSync(path.join(root, f)));
	gate('the package installs a launchable application, not just a binary',
		present.length === installed.length,
		`${present.join(', ')} — a launcher entry and the real BERX symbol, not a generated placeholder`);

	/* and the installed binary is the one that renders */
	const installedBin = path.join(root, 'usr/bin/berx');
	let ran;
	try {
		const display = process.env.DISPLAY;
		const runner = display ? null : (fs.existsSync('/usr/bin/xvfb-run') ? '/usr/bin/xvfb-run' : null);
		const argv = [listFile, '--frames', '4'];
		const out = runner
			? execFileSync(runner, ['-a', installedBin, ...argv], {encoding: 'utf8'})
			: execFileSync(installedBin, argv, {encoding: 'utf8'});
		ran = JSON.parse(out.trim().split('\n').pop());
	} catch (error) {
		ran = undefined;
	}
	gate('the installed application opens a window and draws the world',
		ran !== undefined && ran.framesPresented >= 4 && ran.drawCalls === list.items.length + airCalls,
		ran ? `${ran.framesPresented} frames presented by /usr/bin/berx from the unpacked package` : 'the installed binary did not present a frame');

	console.log('BLOCKED  desktop-signing');
	console.log(`         ${packaged.missing.join('; ')} — none of those can be produced or verified from here`);
}

/* ---- 4. what these backends still cannot do ---- */
blocked('native-media', 'packages/spatial-native has no image decoder: a draw item carrying a media surface is counted and left undrawn rather than substituted. The shader has the path; this backend has nothing to put in it');
blocked('native-labels', 'packages/spatial-native has no text rasteriser: the shared core places names for it, and it draws none. The three-way comparison therefore runs on a world with no names, and the WebGPU name pass is compared against WebGL2 separately');

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D cross-renderer: ${failures.length} FAILED — ${failures.join('; ')}`);
	fs.rmSync(dir, {recursive: true, force: true});
	process.exit(1);
}
console.log('ALL CROSS-RENDERER GATES PASS');
fs.rmSync(dir, {recursive: true, force: true});
