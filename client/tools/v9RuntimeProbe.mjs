/**
 * BERX V9 RUNTIME PROBE — what the static audit cannot prove.
 *
 * The static audit reads source and contracts. This renders the real
 * app in a real browser and interrogates the real DOM: which depth
 * planes actually mounted, whether the camera's perspective genuinely
 * reached the compositor, whether materials and lighting really paint,
 * whether Reduced Motion really removes the spatial transforms, and
 * whether each scene renders without throwing.
 *
 * Everything reported here is measured from computed styles. Nothing is
 * asserted from the source.
 */
import {chromium} from 'playwright';

const BASE = 'http://localhost:8099';
const SCENES = ['search', 'conversations', 'experiences', 'profile', 'feed', 'now', 'placesnearby', 'eventdetail'];

const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});

async function probe(screen, mode, {reducedMotion = false} = {}) {
	const page = await browser.newPage({
		viewport: {width: 390, height: 844},
		deviceScaleFactor: 2,
		reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
	});
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
	await page.addInitScript((m) => {
		try { localStorage.setItem('berx.themeMode', m); } catch {}
	}, mode);
	await page.goto(`${BASE}/?screen=${screen}`, {waitUntil: 'networkidle'});
	await page.waitForTimeout(2500);
	// A real pointer move, so the web half of the interaction signal is
	// genuinely exercised rather than assumed.
	await page.mouse.move(90, 200);
	await page.mouse.move(300, 640);
	await page.waitForTimeout(500);

	// MOVEMENT, measured as CHANGE OVER TIME. Counting non-identity
	// transforms is not a movement test — a layer parked at a static
	// offset counts the same as one that is animating, which is exactly
	// how a broken Reduced Motion path passed its first version of this
	// check. Two samples 700ms apart, diffed, measures what actually moves.
	const sample = () => page.evaluate(() =>
		[...document.querySelectorAll('*')].map((n) => getComputedStyle(n).transform).join('|'));
	const before = await sample();
	await page.waitForTimeout(700);
	const after = await sample();
	const a = before.split('|');
	const bArr = after.split('|');
	const animating = a.reduce((n, t, i) => n + (t !== bArr[i] ? 1 : 0), 0);

	const r = await page.evaluate(() => {
		const all = [...document.querySelectorAll('*')];
		const cs = (n) => getComputedStyle(n);
		const transforms = all.map(cs).map((s) => s.transform).filter((t) => t && t !== 'none');
		return {
			nodes: all.length,
			// The camera: RN-web emits perspective as a transform function,
			// which the compositor resolves to a matrix3d.
			cameraLayers: transforms.filter((t) => t.includes('perspective') || t.startsWith('matrix3d')).length,
			movedLayers: transforms.filter((t) => t !== 'matrix(1, 0, 0, 1, 0, 0)').length,
			svgPaint: document.querySelectorAll('svg').length,
			lightStops: document.querySelectorAll('svg stop').length,
			backdropBlurs: all.map(cs).filter((s) => s.backdropFilter && s.backdropFilter !== 'none').length,
			shadows: all.map(cs).filter((s) => s.boxShadow && s.boxShadow !== 'none').length,
			translucentFills: new Set(all.map(cs).map((s) => s.backgroundColor)
				.filter((c) => /^rgba\(/.test(c) && !/,\s*0\)$/.test(c))).size,
			body: getComputedStyle(document.body).backgroundColor,
		};
	});
	await page.close();
	return {...r, animating, errors};
}

const rows = [];
for (const screen of SCENES) {
	for (const mode of ['night', 'day']) {
		rows.push({screen, mode, rm: false, ...(await probe(screen, mode))});
	}
}
// Reduced Motion, on the scene that carries the most spatial movement.
const rmOff = rows.find((r) => r.screen === 'search' && r.mode === 'night');
const rmOn = await probe('search', 'night', {reducedMotion: true});

const pad = (s, n) => String(s).padEnd(n);
console.log('BERX V9 — RUNTIME PROBE (measured in a real browser)');
console.log('='.repeat(88));
console.log(`${pad('scene', 15)}${pad('mode', 7)}${pad('camera', 8)}${pad('moved', 7)}${pad('light', 7)}${pad('blur', 6)}${pad('shadow', 8)}${pad('glass', 7)}${pad('anim', 6)}errors`);
let failures = 0;
for (const r of rows) {
	const bad = r.errors.length > 0;
	if (bad) failures++;
	console.log(`${pad(r.screen, 15)}${pad(r.mode, 7)}${pad(r.cameraLayers, 8)}${pad(r.movedLayers, 7)}${pad(r.lightStops, 7)}${pad(r.backdropBlurs, 6)}${pad(r.shadows, 8)}${pad(r.translucentFills, 7)}${pad(r.animating, 6)}${bad ? r.errors.join('; ') : '-'}`);
}
console.log('-'.repeat(88));

const checks = [];
const add = (label, pass, detail) => { checks.push({label, pass, detail}); if (!pass) failures++; };

add('every scene renders with no runtime error', rows.every((r) => r.errors.length === 0),
	rows.filter((r) => r.errors.length).map((r) => `${r.screen}/${r.mode}`).join(', '));
add('every scene mounts a real camera (perspective reaches the compositor)',
	rows.every((r) => r.cameraLayers > 0),
	rows.filter((r) => r.cameraLayers === 0).map((r) => `${r.screen}/${r.mode}`).join(', '));
add('every scene paints translucent material (the glass ladder is live)',
	rows.every((r) => r.translucentFills >= 2),
	rows.filter((r) => r.translucentFills < 2).map((r) => `${r.screen}/${r.mode}`).join(', '));
add('every scene casts real depth shadows',
	rows.every((r) => r.shadows > 0),
	rows.filter((r) => r.shadows === 0).map((r) => `${r.screen}/${r.mode}`).join(', '));
add('the performance budget holds (<= 3 blur layers per scene)',
	rows.every((r) => r.backdropBlurs <= 3),
	rows.filter((r) => r.backdropBlurs > 3).map((r) => `${r.screen}/${r.mode}=${r.backdropBlurs}`).join(', '));
add('Explore is really lit (real gradient stops, not a flat ground)',
	rows.filter((r) => r.screen === 'search').every((r) => r.lightStops > 20),
	rows.filter((r) => r.screen === 'search').map((r) => `${r.mode}=${r.lightStops}`).join(', '));
// The accessibility contract, measured: fewer moving layers under
// Reduced Motion than without it.
add('Reduced Motion really removes spatial movement',
	rmOn.animating === 0 && rmOff.animating > 0,
	`normal=${rmOff.animating} layers animating, reduced=${rmOn.animating}`);
add('Reduced Motion keeps the scene renderable (hierarchy survives)',
	rmOn.errors.length === 0 && rmOn.nodes > 20, `${rmOn.nodes} nodes, ${rmOn.errors.length} errors`);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.label}${c.detail ? `  [${c.detail}]` : ''}`);
console.log('='.repeat(88));
console.log(failures === 0 ? 'RUNTIME PROBE CLEAN' : `${failures} RUNTIME FAILURE(S)`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
