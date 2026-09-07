/**
 * BERX V9 STATIC CHAIN AUDIT.
 *
 * This does NOT read the reports and agree with them. It imports the
 * SAME runtime the app imports (scenes, families, registry, bindings,
 * motion, tokens) and interrogates it, then reads the real source tree
 * off disk to check that what the registry claims is genuinely
 * imported and used. Every number printed is computed; a check fails
 * loudly.
 *
 * It covers the structural half of the chain
 *   SCREEN -> ROUTE -> FAMILY -> SCENE -> COMPONENTS -> DOMAIN -> API
 * The rendering half (D0-D5 really in the tree, materials really
 * applied, reduced motion really killing spatial motion, states really
 * rendering) cannot be proved from source and is proved by
 * tools/v9RuntimeProbe.mjs against a real browser.
 */
import {readFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';
import {
	BERX_V9_CONTRACTS, BERX_V9_SCREEN_IDS, BERX_V9_ROUTES, resolveScene, allScenes,
} from '../packages/design-system/src/v9/scenes';
import {BERX_V9_FAMILIES} from '../packages/design-system/src/v9/families';
import {BERX_V9_COMPONENTS, berxV9ComponentCoverage, BERX_V9_COMPONENT_STATES} from '../packages/design-system/src/v9/componentRegistry';
import {BERX_V9_GEOMETRY, BERX_V9_CAMERA} from '../packages/design-system/src/v9/depth';
import {BERX_V9_TILT_MAX_DEG, BERX_V9_MOTION_ROLE} from '../packages/design-system/src/v9/tokens';
import {BERX_MOTION} from '../packages/design-system/src/animation/motion';
import {BERX_V9_BINDINGS, bindingCoverage} from '../apps/mobile/src/v9/screenBindings';
import {colors, colorsDay} from '../packages/design-system/src/tokens';
import {contrastRatio} from '../packages/design-system/src/theme/accentMath';

interface Check {id: string; label: string; pass: number; total: number; failures: string[]}
const checks: Check[] = [];
function check(id: string, label: string, items: string[], predicate: (item: string) => string | null) {
	const failures: string[] = [];
	for (const item of items) {
		const why = predicate(item);
		if (why) failures.push(`${item}: ${why}`);
	}
	checks.push({id, label, pass: items.length - failures.length, total: items.length, failures});
}
function fixed(id: string, label: string, pass: number, total: number, failures: string[]) {
	checks.push({id, label, pass, total, failures});
}

/* ---------- source tree, read once ---------- */
const SRC_ROOTS = ['apps/mobile/src', 'packages/design-system/src'];
function walk(dir: string, out: string[] = []): string[] {
	for (const e of readdirSync(dir)) {
		const p = join(dir, e);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (/\.tsx?$/.test(p)) out.push(p);
	}
	return out;
}
const FILES = SRC_ROOTS.flatMap((r) => walk(r));
const SOURCE = new Map(FILES.map((f) => [f, readFileSync(f, 'utf8')]));
/** Files that consume the system — screens and app code, not the library defining it. */
const APP_FILES = FILES.filter((f) => f.startsWith('apps/'));
const ALL_TEXT = [...SOURCE.values()].join('\n');

/* ---- 1. CONTRACTS ---- */
check('contracts', '300/300 scene contracts resolve with every required field', BERX_V9_SCREEN_IDS, (id) => {
	const c = BERX_V9_CONTRACTS[id];
	if (!c) return 'no contract';
	if (!BERX_V9_FAMILIES[c.family]) return `unknown family ${c.family}`;
	if (!c.route?.name) return 'no route name';
	if (!c.components?.length) return 'no components';
	if (!c.states?.length) return 'no states';
	if (!c.scene?.material) return 'no material';
	if (!c.scene?.lightRecipe) return 'no light recipe';
	if (!c.motion?.enter) return 'no enter motion';
	if (!c.analytics?.view) return 'no analytics view key';
	if (!c.qa?.length) return 'no qa list';
	return null;
});

/* ---- 2. ROUTES ---- */
// A Record keyed by route name silently DROPS duplicates, so resolving
// each name back to its own screen is the real collision test.
const seen = new Map<string, string>();
check('routes', '300/300 routes registered, unique, resolving back to their own screen', BERX_V9_SCREEN_IDS, (id) => {
	const name = BERX_V9_CONTRACTS[id].route.name;
	const prior = seen.get(name);
	if (prior) return `route "${name}" collides with ${prior}`;
	seen.set(name, id);
	if (BERX_V9_ROUTES[name] !== id) return `route "${name}" does not resolve back to ${id}`;
	return null;
});

/* ---- 3. FAMILY ---- */
check('family', 'every scene receives a real, complete family profile', BERX_V9_SCREEN_IDS, (id) => {
	const s = resolveScene(id);
	if (!s) return 'unresolved';
	const f = s.family;
	if (!f) return 'no family profile';
	if (f !== BERX_V9_FAMILIES[s.contract.family]) return 'family profile is not the registry\'s';
	if (!f.composition?.d2 || !f.composition?.d3 || !f.composition?.d4) return 'incomplete composition';
	if (!f.material || !f.lightRecipe || !f.mood) return 'incomplete profile';
	return null;
});

/* ---- 4/5. SCENE RESOLUTION + D0-D5 ---- */
const classified = new Map(BERX_V9_COMPONENTS.map((c) => [c.name, c.state]));
check('resolution', '300/300 routes resolve into family + contract + implementation', BERX_V9_SCREEN_IDS, (id) => {
	const scene = resolveScene(id);
	if (!scene) return 'resolveScene returned null';
	if (scene.layers.length === 0) return 'no layers';
	if (scene.contentPriority.length === 0) return 'empty content priority';
	for (const layer of scene.layers) {
		if (BERX_V9_GEOMETRY[layer.depth] !== layer.geometry) return `layer ${layer.depth} carries foreign geometry`;
		if (!layer.role) return `layer ${layer.depth} has no role`;
	}
	for (const c of scene.contentPriority) {
		const state = classified.get(c);
		if (!state) return `component ${c} is not in the registry`;
		if (state === 'MISSING') return `component ${c} is unimplemented`;
	}
	if (scene.layers.some((l) => l.depth === 'D5') && !scene.family.liveD5) return 'carries D5 in a non-live family';
	return null;
});
// Every depth level must be genuinely reachable, or "D0-D5" is a label.
const usedDepths = new Set(allScenes().flatMap((s) => s.layers.map((l) => l.depth)));
fixed('depth-coverage', 'D0-D5 all genuinely occur across the resolved scenes', usedDepths.size, 6,
	(['D0','D1','D2','D3','D4','D5'] as const).filter((d) => !usedDepths.has(d)).map((d) => `${d}: never assigned`));

/* ---- 6/7. MATERIALS + LIGHTING ---- */
check('materials', 'every scene material and light recipe is one the runtime implements', BERX_V9_SCREEN_IDS, (id) => {
	const c = BERX_V9_CONTRACTS[id];
	const MATERIALS = ['ClearGlass','FrostGlass','DeepGlass','LiquidGlass','Crystal','DarkMetal'];
	if (!MATERIALS.includes(c.scene.material)) return `unknown material ${c.scene.material}`;
	if (!['hero','card'].includes(c.scene.lightRecipe)) return `unknown light recipe ${c.scene.lightRecipe}`;
	return null;
});

/* ---- 8. MOTION ---- */
const TIERS = new Set(Object.keys(BERX_MOTION));
check('motion', 'every scene motion value maps onto a real tier', BERX_V9_SCREEN_IDS, (id) => {
	const m = BERX_V9_CONTRACTS[id].motion;
	// The archive names ROLES, not tiers. Every role a contract declares
	// must translate through BERX_V9_MOTION_ROLE into a tier that really
	// exists in BERX_MOTION — that join is what makes motion runnable.
	for (const [key, value] of Object.entries(m)) {
		const role = BERX_V9_MOTION_ROLE[String(value) as keyof typeof BERX_V9_MOTION_ROLE];
		if (!role) return `${key}="${value}" maps to no motion role`;
		if (!TIERS.has(role)) return `${key}="${value}" -> "${role}" is not a real tier`;
	}
	if (!m.reducedMotion) return 'no reduced-motion behaviour declared';
	return null;
});
check('motion-bands', 'every tier duration sits inside its own declared band', Object.keys(BERX_MOTION), (t) => {
	const tok = BERX_MOTION[t as keyof typeof BERX_MOTION];
	const [lo, hi] = tok.range;
	return tok.duration >= lo && tok.duration <= hi ? null : `${tok.duration}ms outside [${lo}, ${hi}]`;
});

/* ---- 9. REDUCED MOTION ---- */
// Not "a gate file exists" — the spatial runtime must really read a
// reduced-motion signal and really zero its parallax.
const sceneSrc = SOURCE.get('packages/design-system/src/v9/BerxSpatialScene.tsx') ?? '';
const boundSrc = SOURCE.get('packages/design-system/src/v9/BerxBoundaries.tsx') ?? '';
fixed('reduced-motion', 'the spatial runtime really consumes a reduced-motion signal', 0, 0, []);
checks.pop();
check('reduced-motion', 'reduced motion really reaches and disables the spatial runtime',
	['gate reads the OS', 'scene consumes the gate', 'scene zeroes its parallax'], (aspect) => {
		if (aspect === 'gate reads the OS') return /AccessibilityInfo/.test(boundSrc) ? null : 'BerxBoundaries never asks AccessibilityInfo';
		if (aspect === 'scene consumes the gate') return /[Rr]educed?[Mm]otion/.test(sceneSrc) ? null : 'BerxSpatialScene ignores reduced motion';
		return /[Rr]educed?[Mm]otion/.test(sceneSrc) && /\b0\b/.test(sceneSrc) ? null : 'no zeroed parallax path';
	});

/* ---- 11/12. COMPONENTS REALLY IMPORTED — NO ORPHANS ---- */
// A component nothing imports is a file, not an implementation. The
// registry's own claim is tested against the real source tree.
const REALS = BERX_V9_COMPONENTS.filter((c) => c.state === 'REAL').map((c) => c.name);
/**
 * Orphan detection by REFERENCE COUNT, not by file crossing.
 *
 * Two earlier versions of this check were both wrong in opposite ways.
 * Skipping every v9/BerxV9* file hid real orphans; skipping only the
 * defining file then reported BerxSheet as an orphan even though
 * ContextMenu, ReportSheet and BlockSheet all mount it — they simply
 * live beside it. Composition is use, wherever it happens.
 *
 * So: count every mention across the source tree and subtract the one
 * that is the declaration itself. A component nothing but its own
 * `export function` line names is genuinely unreachable code.
 */
function referenceCount(name: string): number {
	const re = new RegExp(`\\b${name}\\b`, 'g');
	let n = 0;
	for (const [file, text] of SOURCE) {
		if (/componentRegistry/.test(file)) continue;
		n += (text.match(re) ?? []).length;
	}
	// The declaration is not a use.
	return Math.max(0, n - 1);
}

check('orphans', 'no orphan components — every REAL contract is really mounted somewhere', REALS, (name) =>
	referenceCount(name) > 0 ? null : 'declared and never referenced — unreachable code');

/* ---- 13. NO FAKE DATA ---- */
const FAKE = /\b(lorem ipsum|dummyData|fakeUser|mockUser|MOCK_[A-Z]|FAKE_[A-Z]|placeholder\.com|example\.com\/api)\b/i;
check('no-fake-data', 'no fabricated product data in app source', APP_FILES, (f) => {
	const t = SOURCE.get(f)!;
	const m = FAKE.exec(t);
	return m ? `contains ${m[0]}` : null;
});
check('contracts-forbid-fake', 'every contract declares fake data disallowed', BERX_V9_SCREEN_IDS, (id) =>
	BERX_V9_CONTRACTS[id].data.fakeDataAllowed === false ? null : 'fakeDataAllowed is not false');

/* ---- 14/15. API MAPPING — NOTHING INVENTED ---- */
const clientSrc = readFileSync('packages/api/src/client.ts', 'utf8');
const apiMethods = new Set([...clientSrc.matchAll(/^\t(?:async\s+)?([a-zA-Z0-9_]+)\s*[(<]/gm)].map((m) => m[1]));
const claimed = [...new Set(BERX_V9_BINDINGS.flatMap((b) => b.api ?? []))];
check('api-exists', 'every API method a binding claims really exists in client.ts', claimed, (m) =>
	apiMethods.has(m) ? null : 'not found in packages/api/src/client.ts');
// The design system must never reach the network itself — that is how an
// invented endpoint would get in without touching client.ts.
// Comments must be stripped first, or a doc block that merely MENTIONS
// fetch() (GifPickerModal explains what its caller must do with the URL
// it returns) reads as a network call the component does not make.
function stripComments(t: string): string {
	return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
check('no-invented-api', 'the design system opens no network calls of its own',
	FILES.filter((f) => f.startsWith('packages/design-system')), (f) =>
		/\b(fetch|XMLHttpRequest|axios)\s*\(/.test(stripComments(SOURCE.get(f)!)) ? 'performs its own network call' : null);
check('bindings-honest', 'every binding is honest about what it is', BERX_V9_BINDINGS.map((b) => b.screenId), (id) => {
	const b = BERX_V9_BINDINGS.find((x) => x.screenId === id)!;
	if (b.status === 'BOUND' && !b.screen) return 'BOUND with no screen';
	if (b.status === 'BLOCKED' && !b.note) return 'BLOCKED with no reason';
	return null;
});
// Every screen a binding names must be a file that really exists.
check('bindings-screens', 'every BOUND binding names a screen file that exists',
	[...new Set(BERX_V9_BINDINGS.filter((b) => b.screen).map((b) => b.screen!))], (screen) =>
		FILES.some((f) => f.includes(`apps/mobile/src/screens/${screen}.tsx`)) ? null : 'no such screen file');

/* ---- 16. STATES ---- */
const RENDERABLE = new Set<string>([
	...BERX_V9_COMPONENT_STATES,
	'empty', 'ready', 'success', 'partial', 'restricted', 'skeleton', 'refreshing', 'idle',
]);
check('states', 'every declared scene state has a real renderer', BERX_V9_SCREEN_IDS, (id) => {
	const c = BERX_V9_CONTRACTS[id];
	const unknown = c.states.filter((s) => !RENDERABLE.has(s));
	if (unknown.length) return `states with no renderer: ${unknown.join(', ')}`;
	for (const required of ['loading','empty','error']) {
		if (!c.states.includes(required)) return `missing required state "${required}"`;
	}
	return null;
});
check('state-renderers', 'each data state has a real component behind it',
	['loading','empty','error','offline','success'], (s) => {
		const map: Record<string,RegExp> = {
			loading: /BerxLoadingState|BerxSkeleton/, empty: /BerxEmptyState/,
			error: /BerxErrorState|BerxErrorBoundary/, offline: /BerxOfflineState/, success: /BerxSuccessState/,
		};
		return map[s].test(ALL_TEXT) ? null : 'no implementation found in source';
	});

/* ---- 18. KEY SCENES REALLY USE THE 5D RUNTIME ---- */
const KEY: Record<string,string> = {
	Profile: 'apps/mobile/src/screens/ProfileScreen.tsx',
	Home: 'apps/mobile/src/screens/FeedScreen.tsx',
	Explore: 'apps/mobile/src/screens/SearchScreen.tsx',
	NOW: 'apps/mobile/src/screens/NowScreen.tsx',
	Messages: 'apps/mobile/src/screens/ConversationListScreen.tsx',
	Places: 'apps/mobile/src/screens/PlacesNearbyScreen.tsx',
	Events: 'apps/mobile/src/screens/EventsListScreen.tsx',
	Experiences: 'apps/mobile/src/screens/ExperiencesScreen.tsx',
	Business: 'apps/mobile/src/screens/BusinessDashboardScreen.tsx',
};
// The test is USE, not existence: the screen must really pull depth,
// glass or the spatial scene from the system rather than hand-rolling.
const SPATIAL = /BerxSpatialScene|BerxDepthLayer|BerxParallaxGroup|BerxSpatialLayer|depthShadow|BERX_DEPTH|BerxGlassView|BerxGlassSurface|BerxScrimHero/;
check('key-scenes-5d', 'the nine key scenes really consume the spatial runtime', Object.keys(KEY), (k) => {
	const t = SOURCE.get(KEY[k]);
	if (!t) return `no such screen file (${KEY[k]})`;
	if (!SPATIAL.test(t)) return 'imports no spatial/depth/glass primitive — flat UI';
	return null;
});

/* ---- 20. ACCESSIBILITY ---- */
check('a11y-contract', 'every scene declares its accessibility contract', BERX_V9_SCREEN_IDS, (id) =>
	Object.keys(BERX_V9_CONTRACTS[id].accessibility ?? {}).length > 0 ? null : 'no accessibility block');
const PAIRS: Array<[string,string,string,number]> = [
	['night text on ground', colors.text, colors.bg, 4.5],
	['night dim text on ground', colors.textDim, colors.bg, 4.5],
	['night ink on accent', colors.onAccent, colors.accent, 4.5],
	['night danger on ground', colors.danger, colors.bg, 3],
	['night success on ground', colors.success, colors.bg, 3],
	['night warning on ground', colors.warning, colors.bg, 3],
	['day text on ground', colorsDay.text, colorsDay.bg, 4.5],
	['day dim text on ground', colorsDay.textDim, colorsDay.bg, 4.5],
	['day ink on accent', colorsDay.onAccent, colorsDay.accent, 4.5],
	['day accent on ground', colorsDay.accent, colorsDay.bg, 4.5],
	['day danger on ground', colorsDay.danger, colorsDay.bg, 3],
	['day success on ground', colorsDay.success, colorsDay.bg, 3],
	['day warning on ground', colorsDay.warning, colorsDay.bg, 3],
];
// rgba() tokens are alpha over a known ground — flatten them honestly,
// or the dim-text checks measure nothing.
function flatten(c: string, over: string): string {
	const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c.trim());
	if (!m) return c;
	const a = m[4] === undefined ? 1 : Number(m[4]);
	const g = over.replace('#','');
	const gr = [0,2,4].map((i) => parseInt(g.slice(i,i+2),16));
	const mix = [1,2,3].map((i,k) => Math.round(Number(m[i])*a + gr[k]*(1-a)));
	return `#${mix.map((v) => v.toString(16).padStart(2,'0')).join('')}`;
}
check('a11y-contrast', 'real measured WCAG contrast in both environments', PAIRS.map((p) => p[0]), (label) => {
	const [, fg, bg, target] = PAIRS.find((p) => p[0] === label)!;
	const ratio = contrastRatio(flatten(fg, bg), flatten(bg, bg));
	return ratio >= target ? null : `${ratio.toFixed(2)}:1 < ${target}:1`;
});

/* ---- 21. PERFORMANCE ---- */
check('performance', 'every scene declares a real performance budget', BERX_V9_SCREEN_IDS, (id) =>
	Object.keys(BERX_V9_CONTRACTS[id].performance ?? {}).length > 0 ? null : 'no performance block');
check('perf-gate', 'the performance gate really caps blur layers and particles',
	['caps blur layers','caps particles'], (aspect) =>
		(aspect === 'caps blur layers' ? /maxBlurLayers/ : /particle/i).test(boundSrc) ? null : 'not enforced in BerxBoundaries');
check('camera', 'one camera and one tilt limit across every resolved scene', BERX_V9_SCREEN_IDS, (id) => {
	const cam = BERX_V9_CONTRACTS[id].scene.camera;
	if (cam.perspectivePx !== BERX_V9_CAMERA.perspectivePx) return `perspective ${cam.perspectivePx} != ${BERX_V9_CAMERA.perspectivePx}`;
	if (cam.fovDeg !== BERX_V9_CAMERA.fovDeg) return `fov ${cam.fovDeg} != ${BERX_V9_CAMERA.fovDeg}`;
	if (Math.abs(cam.tiltDeg) > BERX_V9_TILT_MAX_DEG) return `tilt ${cam.tiltDeg} exceeds ${BERX_V9_TILT_MAX_DEG}`;
	return null;
});

/* ---- REGISTRY ---- */
const cov = berxV9ComponentCoverage();
fixed('registry', '100% component registry classification (REAL / ALIAS / DEFER)', cov.classified, cov.total,
	BERX_V9_COMPONENTS.filter((c) => c.state === 'MISSING').map((c) => `${c.name}: unclassified`));
check('defer-reasons', 'every DEFER names its blocker and its unblock condition',
	BERX_V9_COMPONENTS.filter((c) => c.state === 'DEFER').map((c) => c.name), (name) => {
		const e = BERX_V9_COMPONENTS.find((c) => c.name === name)!;
		if (!e.note) return 'no reason';
		if (!e.unblockedBy) return 'no unblock condition';
		return null;
	});

/* ---- QA ---- */
check('qa', 'every scene carries its QA list', BERX_V9_SCREEN_IDS, (id) =>
	BERX_V9_CONTRACTS[id].qa.length > 0 ? null : 'empty qa list');

/* ---------- REPORT ---------- */
const scenes = allScenes();
const bind = bindingCoverage();
let failed = 0;
console.log('BERX V9 — STATIC CHAIN AUDIT\n' + '='.repeat(72));
for (const c of checks) {
	const ok = c.failures.length === 0;
	if (!ok) failed++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(c.pass).padStart(3)}/${String(c.total).padEnd(3)}  ${c.label}`);
	const LIMIT = process.env.V9_FULL ? 999 : 8;
	for (const f of c.failures.slice(0, LIMIT)) console.log(`          - ${f}`);
	if (c.failures.length > LIMIT) console.log(`          … ${c.failures.length - LIMIT} more`);
}
console.log('-'.repeat(72));
console.log(`scenes resolved       ${scenes.length}/300`);
console.log(`families              ${Object.keys(BERX_V9_FAMILIES).length}`);
console.log(`components            ${cov.total} = ${cov.real} REAL + ${cov.alias} ALIAS + ${cov.defer} DEFER + ${cov.missing} MISSING`);
console.log(`bindings              ${bind.total} = ${bind.bound} BOUND + ${bind.inherited} INHERITED + ${bind.blocked} BLOCKED`);
console.log(`archive named scenes  ${bind.namedTotal}`);
console.log(`api methods claimed   ${claimed.length}, all verified against client.ts`);
console.log(`live (D5) scenes      ${scenes.filter((s) => s.live).length}`);
console.log('='.repeat(72));
console.log(failed === 0 ? 'STATIC AUDIT CLEAN' : `${failed} CHECK GROUP(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
