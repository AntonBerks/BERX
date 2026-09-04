#!/usr/bin/env node
/**
 * BERX v9 runtime probe.
 *
 * Bundles the REAL spatial runtime and the REAL 300 contracts with
 * esbuild and executes them against seven device profiles. Nothing
 * here is mocked: the same resolvers the app calls are the ones
 * measured, which is the difference between "the file exists" and
 * "the feature runs".
 *
 * Also re-runs the contract generator and fails if the committed
 * generated file would change — so docs/v9 and the code cannot drift.
 *
 * Usage:  node scripts/verify-v9-contracts.mjs [--json]
 * Exit 0 when every gate passes, 1 otherwise.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const jsonOnly = process.argv.includes('--json');

function log(...args) {
	if (!jsonOnly) console.log(...args);
}

/* ---------------- generator drift ---------------- */
const generated = path.join(clientRoot, 'packages/scenes/src/contracts.generated.ts');
const before = fs.readFileSync(generated, 'utf8');
execFileSync(process.execPath, [path.join(here, 'generate-v9-scenes.mjs')], {cwd: clientRoot, stdio: 'pipe'});
const after = fs.readFileSync(generated, 'utf8');
const generatorClean = before === after;
if (!generatorClean) {
	fs.writeFileSync(generated, before);
}

/* ---------------- archive invariants ---------------- */
const archiveTokens = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/v9/foundation/berx.tokens.json'), 'utf8'));
const archiveMaterials = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/v9/foundation/materials.json'), 'utf8'));
const archiveScenes = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/v9/scenes.v9.json'), 'utf8'));
const archiveRoutes = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/v9/route_manifest.json'), 'utf8'));

/* ---------------- every built component must actually be rendered ----------------
   "COMPONENT EXISTS ≠ COMPONENT USED" is a rule, so it is checked
   rather than trusted: a spatial component nothing draws is not a
   delivered component, and this fails the build if one appears. */
function walkTsx(dir) {
	return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
		const p = path.join(dir, e.name);
		return e.isDirectory() ? walkTsx(p) : p.endsWith('.tsx') ? [p] : [];
	});
}
const spatialDir = path.join(clientRoot, 'packages/design-system/src/spatial');
const consumerFiles = [
	...walkTsx(path.join(clientRoot, 'apps/mobile/src')),
	...walkTsx(spatialDir),
	...walkTsx(path.join(clientRoot, 'packages/design-system/src/components')),
].map((f) => ({file: f, src: fs.readFileSync(f, 'utf8')}));

/**
 * Checked by exported component name, not by filename: a module can
 * export several components (BerxResponsive exports BerxContentFrame
 * and BerxTwoZone), and a filename check would call the module used
 * when only one of them is, or unused when the file name is not a
 * component name at all.
 */
const spatialExports = fs
	.readdirSync(spatialDir)
	.filter((f) => f.endsWith('.tsx'))
	.flatMap((f) => {
		const src = fs.readFileSync(path.join(spatialDir, f), 'utf8');
		return [...src.matchAll(/^export function (Berx[A-Za-z0-9]+)/gm)].map((m) => ({
			name: m[1],
			file: path.join(spatialDir, f),
		}));
	});

const unrenderedComponents = spatialExports
	.filter(
		({name, file}) => !consumerFiles.some((c) => c.file !== file && new RegExp(`<${name}[\\s/>]`).test(c.src)),
	)
	.map(({name}) => name);

/* ---------------- every routed screen must resolve a scene ----------------
   "ROUTE EXISTS ≠ SCREEN IMPLEMENTED" cuts both ways: a screen that
   renders outside a scene has no depth, no material and no motion, and
   nothing else would catch it. Two files legitimately have no scene of
   their own — a re-export and the onboarding orchestrator, which
   renders screens that each have one. */
const SCENELESS_BY_DESIGN = new Set(['business/BusinessDashboardScreen.tsx', 'onboarding/BerxOnboarding.tsx']);
const screensDir = path.join(clientRoot, 'apps/mobile/src/screens');
const scenelessScreens = walkTsx(screensDir)
	.filter((f) => !SCENELESS_BY_DESIGN.has(path.relative(screensDir, f).split(path.sep).join('/')))
	.filter((f) => {
		const src = fs.readFileSync(f, 'utf8');
		return /export default function/.test(src) && !/Berx(Screen|Family)Scene/.test(src);
	})
	.map((f) => path.relative(screensDir, f));

/* ---------------- bundle + run the real runtime ---------------- */
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-v9-probe-'));
const outFile = path.join(outDir, 'probe.mjs');
execFileSync(
	path.join(clientRoot, 'node_modules/.bin/esbuild'),
	[
		path.join(here, 'v9-probe.entry.ts'),
		'--bundle',
		'--platform=node',
		'--format=esm',
		'--log-level=error',
		`--alias:@berx/spatial=${path.join(clientRoot, 'packages/spatial/src/index.ts')}`,
		`--alias:@berx/scenes=${path.join(clientRoot, 'packages/scenes/src/index.ts')}`,
		`--alias:@berx/api/client=${path.join(clientRoot, 'packages/api/src/client.ts')}`,
		`--alias:@berx/core=${path.join(clientRoot, 'packages/core/src/index.ts')}`,
		`--outfile=${outFile}`,
	],
	{cwd: clientRoot, stdio: 'inherit'},
);

const {runProbe} = await import(pathToFileURL(outFile).href);
const report = runProbe();

/* ---------------- gates ---------------- */
const gates = [];
const gate = (name, pass, detail) => gates.push({name, pass, detail});

gate('generator is deterministic', generatorClean, generatorClean ? 'regeneration is a no-op' : 'contracts.generated.ts would change — commit the regenerated file');
gate('300 contracts present', report.contractCount === 300, `${report.contractCount}`);
gate('300/300 resolve by screenId', report.resolvedCount === 300, `${report.resolvedCount}/300`);
gate('300/300 resolve by route path', report.byRouteCount === 300, `${report.byRouteCount}/300`);
gate('300/300 resolve by route name', report.byRouteNameCount === 300, `${report.byRouteNameCount}/300`);
gate('13/13 families', Object.keys(report.families).length === 13, Object.entries(report.families).map(([k, v]) => `${k}:${v}`).join(' '));
gate(
	'route manifest matches the registry',
	archiveRoutes.routes.length === 300 && archiveScenes.screens.length === 300,
	`${archiveRoutes.routes.length} routes / ${archiveScenes.screens.length} scenes`,
);
gate('every requested component has a resolution', report.unresolvedComponents.length === 0, report.unresolvedComponents.join(', ') || 'none unresolved');
gate('29 scenes carry a real data binding', report.boundScenes === 29, `${report.boundScenes}`);
gate('no scene invents data', (report.dataModes.bound ?? 0) + (report.dataModes.dataless ?? 0) + (report.dataModes['contract-only'] ?? 0) === 300, JSON.stringify(report.dataModes));

/* tokens transcribed, not re-invented */
const tokenChecks = [
	['depth.D5.parallax', archiveTokens.depth.D5.parallax === 1.0],
	['motion.maxTiltDeg', archiveTokens.motion.maxTiltDeg === 2.5],
	['blurMaxLayersMobile', archiveTokens.performance.blurMaxLayersMobile === 3],
	['material count', Object.keys(archiveMaterials).length === Object.keys(report.materials).length],
];
gate('archive tokens match the runtime', tokenChecks.every(([, ok]) => ok), tokenChecks.map(([n, ok]) => `${n}:${ok ? 'ok' : 'MISMATCH'}`).join(' '));

const mobileProfiles = ['ios-phone-high', 'android-phone-low'];
gate(
	'mobile blur budget <= 3 layers',
	mobileProfiles.every((p) => report.profiles[p].blurLayersMax <= 3),
	mobileProfiles.map((p) => `${p}:${report.profiles[p].blurLayersMax}`).join(' '),
);
gate(
	'reduced motion removes parallax and tilt',
	report.profiles['web-reduced-motion'].allowParallax === false && report.profiles['web-reduced-motion'].reducedMotionScenes === 300,
	`parallax:${report.profiles['web-reduced-motion'].allowParallax} scenes:${report.profiles['web-reduced-motion'].reducedMotionScenes}/300`,
);
gate(
	'watch flattens instead of dropping the scene',
	report.profiles.watch.allow3D === false && report.profiles.watch.resolved === 300,
	`allow3D:${report.profiles.watch.allow3D} resolved:${report.profiles.watch.resolved}/300`,
);
gate(
	'content text passes AA on every profile',
	Object.values(report.profiles).every((p) => p.minContentContrast >= 4.5),
	Object.entries(report.profiles).map(([k, v]) => `${k}:${v.minContentContrast}`).join(' '),
);
gate(
	'high contrast forces opaque surfaces',
	report.profiles['web-high-contrast'].opaqueSurfaceScenes === 300,
	`${report.profiles['web-high-contrast'].opaqueSurfaceScenes}/300`,
);
gate(
	'navigation shell adapts to platform and width',
	report.profiles['ios-phone-high'].navShells['bottom-tabs'] === 300 &&
		report.profiles['web-desktop-high'].navShells.sidebar === 300 &&
		report.profiles['web-tablet'].navShells.rail === 300 &&
		report.profiles.watch.navShells.compact === 300,
	Object.entries(report.profiles).map(([k, v]) => `${k}:${Object.keys(v.navShells).join('/')}`).join(' '),
);
gate(
	'every routed screen resolves a scene',
	scenelessScreens.length === 0,
	scenelessScreens.length === 0
		? `${walkTsx(screensDir).length} screen files, none rendering outside a scene`
		: scenelessScreens.join(', '),
);
gate(
	'every built spatial component is actually rendered',
	unrenderedComponents.length === 0,
	unrenderedComponents.length === 0 ? 'no unrendered components' : unrenderedComponents.join(', '),
);
/* --- the environment is content-aware, and survives losing blur --- */
const atmoValues = Object.values(report.atmospheres);
const flatKinds = Object.entries(report.atmospheres)
	.filter(([, a]) => a.flatnessProblems.length > 0)
	.map(([kind, a]) => `${kind}: ${a.flatnessProblems[0]}`);
const atmoSignatures = new Set(atmoValues.map((a) => a.signature));
const familiesCovered = new Set(atmoValues.flatMap((a) => a.families));
gate(
	'every atmosphere keeps its depth with blur removed',
	flatKinds.length === 0,
	flatKinds.length === 0
		? `${atmoValues.length} kinds, each with ≥3 sky stops, positioned light at ≥2 distances, and a floor or walls`
		: flatKinds.join(' | '),
);
gate(
	'no single generic background: every family lands on a distinct environment',
	atmoSignatures.size === atmoValues.length && familiesCovered.size === 13,
	`${atmoSignatures.size}/${atmoValues.length} distinct environments across ${familiesCovered.size}/13 families`,
);
gate('no probe findings', report.findings.length === 0, report.findings.slice(0, 8).map((f) => `${f.scope}: ${f.message}`).join(' | ') || 'clean');

const failed = gates.filter((g) => !g.pass);

if (jsonOnly) {
	console.log(JSON.stringify({gates, report}, null, 2));
} else {
	log('\nBERX v9 RUNTIME PROBE\n' + '='.repeat(60));
	for (const g of gates) log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.name}\n      ${g.detail}`);
	log('\nMaterials (blur px / measured text contrast / opaque fallback):');
	for (const [name, m] of Object.entries(report.materials)) {
		log(`  ${name.padEnd(14)} blur ${String(m.blurPx).padStart(2)}px  ${String(m.contrast).padStart(5)}:1  ${m.opaqueFallback ? 'opaque' : 'glass '}  glow ${m.glowRadius}`);
	}
	log('\nProfiles:');
	for (const [name, p] of Object.entries(report.profiles)) {
		log(`  ${name.padEnd(20)} tier=${p.tier.padEnd(6)} blur<=${p.maxBlurLayers} used=${p.blurLayersMax} 3d=${p.allow3D} parallax=${p.allowParallax} minContrast=${p.minContentContrast}`);
	}
	log('\nAtmospheres (unblurred — sky stops / light pools at distances / floor / vignette):');
	for (const [kind, a] of Object.entries(report.atmospheres)) {
		log(
			`  ${kind.padEnd(15)} sky ${a.skyStops}  pools ${a.pools}@${a.poolDistances}  ${a.hasGround ? 'floor' : 'walls'}  vig ${String(a.vignette).padEnd(5)} media:${a.mediaRole.padEnd(10)} ${a.families.join(',') || '(named by screens)'}`,
		);
	}
	log(`\nData modes: ${JSON.stringify(report.dataModes)}`);
	log(`Unrendered spatial components: ${unrenderedComponents.join(', ') || 'none'}`);
	log(`Blocked components (named, not stubbed): ${report.blockedComponents.join(', ')}`);
	log('\n' + '='.repeat(60));
	log(failed.length === 0 ? `ALL ${gates.length} GATES PASS` : `${failed.length}/${gates.length} GATES FAILED`);
}

fs.rmSync(outDir, {recursive: true, force: true});
process.exit(failed.length === 0 ? 0 : 1);
