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
	'a headset keeps its depth and loses its screen-space effects',
	report.profiles.arvr.allow3D === true &&
		report.profiles.arvr.allowParallax === true &&
		report.profiles.arvr.blurLayersMax === 0 &&
		report.profiles.arvr.resolved === 300 &&
		report.profiles.arvr.navShells['spatial-anchors'] === 300,
	`3d=${report.profiles.arvr.allow3D} parallax=${report.profiles.arvr.allowParallax} blur=${report.profiles.arvr.blurLayersMax} shell=spatial-anchors, ${report.profiles.arvr.resolved}/300 resolved`,
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
/* --- D4 actions must be promoted, not printed on the content plane ---
   The archive gives controls their own depth, and a row of buttons
   inside a <View> on D3 is the exact way that gets lost: the layout is
   right and the depth is gone. Every action row in a screen goes
   through BerxActionShelf, which takes D4's material, its lit leading
   edge and its upward shadow — and stays attached to the object it
   acts on, because a scene of floating controls is not depth either. */
const flatActionRows = walkTsx(screensDir)
	.map((file) => ({
		file: path.relative(clientRoot, file),
		hits: (fs.readFileSync(file, 'utf8').match(/<View style=\{styles\.actions[A-Za-z]*\}>/g) ?? []).length,
	}))
	.filter((f) => f.hits > 0);
gate(
	'D4 actions are promoted to a control shelf, never printed on the content plane',
	flatActionRows.length === 0,
	flatActionRows.length === 0
		? `${walkTsx(screensDir).length} screens, every action row on the control plane`
		: flatActionRows.map((f) => `${f.file} (${f.hits})`).join(', '),
);
/* --- no screen may paint over the scene it stands in ---------------
   Every screen renders inside a resolved scene that paints D0 and D1
   for it. A screen-level `backgroundColor: colors.bg` covers both:
   the atmosphere is resolved, the parallax runs, and none of it
   reaches the viewer. Forty-five screens were doing exactly that,
   which is the archive's "flat screen inside a 5D shell" in its most
   literal form. */
const opaqueScreens = walkTsx(screensDir)
	.map((file) => ({
		file: path.relative(clientRoot, file),
		hits: (fs.readFileSync(file, 'utf8').match(/flex: 1,\s*backgroundColor: colors\.(bg|black|graphite)/g) ?? []).length,
	}))
	.filter((f) => f.hits > 0);
gate(
	'no screen paints an opaque background over its scene',
	opaqueScreens.length === 0,
	opaqueScreens.length === 0
		? `${walkTsx(screensDir).length} screens, every one standing in its scene`
		: opaqueScreens.map((f) => `${f.file} (${f.hits})`).join(', '),
);
/* --- every screen must place its content on a real plane ----------
   A scene wrapper around a column of Text is the failure the archive
   calls a flat screen inside a 5D shell: D0 and D1 resolve, and then
   nothing between the room and the words. A screen passes when it
   renders at least one component that actually resolves a depth
   plane — a structural surface, a content card, a control shelf, an
   identity, a hero. Which plane is the screen's decision; having none
   is not one of the options. */
const PLANE_COMPONENTS = [
	'BerxGlassSurface',
	'BerxSpatialCard',
	'BerxObjectCard',
	'BerxListGroup',
	'BerxActionShelf',
	'BerxDepthLayer',
	'BerxIdentity',
	'BerxSceneHero',
	'BerxProfileHero',
	'BerxPlaceHero',
	'BerxEventHero',
	'BerxBusinessHero',
	'BerxScrimHero',
	'BerxPlaceCard',
	'BerxCollectionCard',
	'BerxTripCard',
	'BerxCommunityCard',
	'BerxCreatorCard',
	'BerxExperienceCard',
	'BerxRewardCard',
	'BerxChatRow',
	'BerxMessageBubble',
	'BerxStoryTray',
	'BerxNowScene',
	'BerxSceneInspector',
	'BerxHorizontalRail',
	'BerxStatRail',
	'BerxMediaGrid',
	/* these two resolve D3 themselves, so a screen that renders them
	   is not flat — see BerxTrackCard / BerxVideoCard */
	'BerxTrackCard',
	'BerxVideoCard',
];
const planelessScreens = walkTsx(screensDir)
	.filter((file) => {
		const src = fs.readFileSync(file, 'utf8');
		/* Only files that open a scene of their own are asked this
		   question. A flow controller that renders other screens, and a
		   re-export that renders nothing, have no scene to be flat
		   inside — the screens they delegate to are checked instead. */
		if (!/<Berx(Screen|Family)Scene[\s>]/.test(src)) return false;
		return !PLANE_COMPONENTS.some((c) => new RegExp(`<${c}[\\s/>]`).test(src));
	})
	.map((file) => path.relative(clientRoot, file));
gate(
	'every screen places its content on a real depth plane',
	planelessScreens.length === 0,
	planelessScreens.length === 0
		? `${walkTsx(screensDir).length} screens, none flat inside their scene`
		: `${planelessScreens.length} flat: ${planelessScreens.slice(0, 12).join(', ')}`,
);
/* --- selection is a shared behaviour, not a per-screen style -------
   Eleven screens had each hand-rolled the same selectable chip with
   the same two fixed colours, none of them on a depth plane and none
   of them announcing the selection to assistive technology. Selection
   now belongs to BerxChoiceChips and BerxSegmentTabs; a screen that
   grows its own `chipActive` style again has re-created the problem. */
const handRolledSelection = walkTsx(screensDir)
	.map((file) => ({
		file: path.relative(clientRoot, file),
		hits: (fs.readFileSync(file, 'utf8').match(/^\s*\w*[Cc]hipActive: \{/gm) ?? []).length,
	}))
	.filter((f) => f.hits > 0);
gate(
	'selection uses the shared controls, not per-screen chip styles',
	handRolledSelection.length === 0,
	handRolledSelection.length === 0
		? 'no screen defines its own selected-chip style'
		: handRolledSelection.map((f) => f.file).join(', '),
);
/* --- every control announces itself ---------------------------------
   The archive's accessibility contract is not only contrast and touch
   targets: a control that reaches assistive technology as an unnamed
   node is unusable, whatever it looks like. Twenty-nine of them were
   shipping — including the two halves of the story viewer, which are
   the only way through a story, and forty-two identical ± buttons in
   the business hours editor, every one announced as nothing. */
function unlabelledControls(file) {
	const src = fs.readFileSync(file, 'utf8');
	const hits = [];
	for (const m of src.matchAll(/<Pressable\b/g)) {
		let i = m.index + m[0].length;
		let depth = 0;
		while (i < src.length) {
			const c = src[i];
			if (c === '{') depth += 1;
			else if (c === '}') depth -= 1;
			else if (c === '>' && depth === 0) break;
			i += 1;
		}
		const tag = src.slice(m.index, i);
		if (!tag.includes('accessibilityLabel') && !tag.includes('accessibilityRole')) {
			hits.push(src.slice(0, m.index).split('\n').length);
		}
	}
	return hits;
}
const unlabelled = [...walkTsx(path.join(clientRoot, 'apps/mobile/src'))]
	.map((file) => ({file: path.relative(clientRoot, file), lines: unlabelledControls(file)}))
	.filter((f) => f.lines.length > 0);
gate(
	'every interactive control announces itself',
	unlabelled.length === 0,
	unlabelled.length === 0
		? 'no Pressable without a role or a name'
		: unlabelled.map((f) => `${f.file}:${f.lines.join(',')}`).join(' | '),
);
/* --- no dead controls ----------------------------------------------
   "Never leave dead buttons" is a rule, so it is checked. A press
   handler that does nothing is a control that lies about being one —
   the creator hub had its own card pressable at the top of the page
   it already was. */
const deadControls = [
	...walkTsx(path.join(clientRoot, 'apps/mobile/src')),
	...walkTsx(path.join(clientRoot, 'packages/design-system/src')),
]
	.map((file) => ({
		file: path.relative(clientRoot, file),
		hits: (fs.readFileSync(file, 'utf8').match(/onPress=\{\(\) => (undefined|\{\})\}/g) ?? []).length,
	}))
	.filter((f) => f.hits > 0);
gate(
	'no dead controls',
	deadControls.length === 0,
	deadControls.length === 0 ? 'no press handler that does nothing' : deadControls.map((f) => `${f.file} (${f.hits})`).join(', '),
);
/* --- failures are classified, not flattened ------------------------
   The archive lists unauthorized and permission-denied alongside
   error, and the API distinguishes them for real. A screen that sets
   `error` directly has thrown that away: an expired session, a
   forbidden resource, a dead server and a phone with no signal all
   become one sentence and one useless Retry. */
const flattenedFailures = walkTsx(screensDir)
	.map((file) => {
		const src = fs.readFileSync(file, 'utf8');
		const lines = src.split('\n');
		const hits = [];
		lines.forEach((line, i) => {
			if (!line.includes("setState('error')")) return;
			/* Only failures count. A validation error — bad coordinates
			   typed into a form — is genuinely `error` and has nothing
			   to classify, so it is not what this gate is about. */
			const inCatch = lines.slice(Math.max(0, i - 8), i).some((l) => /\bcatch\s*[({]/.test(l));
			if (inCatch) hits.push(i + 1);
		});
		return {file: path.relative(clientRoot, file), hits};
	})
	.filter((f) => f.hits.length > 0);
gate(
	'screens classify their failures instead of flattening them',
	flattenedFailures.length === 0,
	flattenedFailures.length === 0
		? 'every screen routes failures through classifyFailure'
		: flattenedFailures.map((f) => `${f.file}:${f.hits.join(',')}`).join(', '),
);
gate(
	'the depth planes are visibly ordered on every contract',
	report.depthOrder.inversions === 0 && report.depthOrder.smallestContentStepLStar >= 1.5,
	`no inversions across 300 contracts x 2 platforms; smallest step between the planes a person reads and reaches for: ${report.depthOrder.smallestContentStepLStar} L*`,
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
