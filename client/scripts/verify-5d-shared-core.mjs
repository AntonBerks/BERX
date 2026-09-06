#!/usr/bin/env node
/**
 * The 5D core must be shared, and stay shared.
 *
 * BERX is one world, not one per operating system. @berx/spatial holds
 * the world graph, spatial identity, X/Y/Z/T/R, domain state,
 * relationships, temporal state and spatial semantics, and every
 * platform runs exactly that. A platform is only allowed to differ in
 * its renderer, its input, its display form factor and its real
 * capabilities.
 *
 * The way that stops being true is gradually: one `document` reference
 * for a quick fix, one `react-native` import for a shortcut, and the
 * core has quietly forked. This fails the build the first time it
 * happens, so the shared core is a fact about the repository rather
 * than an intention in a document.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const coreDir = path.join(clientRoot, 'packages/spatial/src');

/* Platform surfaces that must never appear in the shared core. Each is
   a real global or module, not a substring that could match prose. */
const FORBIDDEN = [
	{name: 'DOM document', re: /\bdocument\s*\./},
	{name: 'DOM window', re: /\bwindow\s*\./},
	{name: 'DOM navigator', re: /\bnavigator\s*\./},
	{name: 'HTML element types', re: /\bHTML[A-Z]\w*Element\b/},
	{name: 'WebGL', re: /\bWebGL\w*\b/},
	{name: 'react-native', re: /from\s+'react-native/},
	{name: 'react', re: /from\s+'react'/},
	{name: 'node builtins', re: /from\s+'node:/},
	{name: 'browser timers as globals', re: /\brequestAnimationFrame\s*\(/},
];

/* What the core is required to contain, so "shared" means something. */
const REQUIRED = [
	['world graph', 'world.ts', /class BerxSpatialWorld/],
	['temporal dimension', 'temporal.ts', /export function berxProjectTemporal/],
	['relational dimension', 'relational.ts', /export function berxRelationalLayout/],
	['platform boundary', 'platform.ts', /export interface BerxSpatialRendererBackend/],
	['world application', 'worldApp.ts', /export class Berx5DWorldApp/],
	['spatial camera', 'spatialCamera.ts', /class BerxSpatialCamera/],
	['spatial identity in picking', 'spatialInteraction.ts', /export function pickSpatialObject/],
];

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const files = fs.readdirSync(coreDir).filter((f) => f.endsWith('.ts'));
const offences = [];
for (const file of files) {
	const source = fs.readFileSync(path.join(coreDir, file), 'utf8');
	/* comments talk about platforms; code must not use them */
	const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
	for (const {name, re} of FORBIDDEN) {
		if (re.test(code)) offences.push(`${file}: ${name}`);
	}
}
gate(
	'the shared core names no platform',
	offences.length === 0,
	offences.length === 0 ? `${files.length} modules, none touching DOM, React Native, Node or a GPU API` : offences.join('; '),
);

for (const [name, file, re] of REQUIRED) {
	const full = path.join(coreDir, file);
	const ok = fs.existsSync(full) && re.test(fs.readFileSync(full, 'utf8'));
	gate(`the shared core owns the ${name}`, ok, `packages/spatial/src/${file}`);
}

/* Every platform package must depend on the core, never reimplement it.
   A backend that carries its own world graph is a second product. */
const backends = ['spatial-web'];
for (const backend of backends) {
	const dir = path.join(clientRoot, 'packages', backend, 'src');
	if (!fs.existsSync(dir)) continue;
	const sources = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));
	const usesCore = sources.some((f) => /@berx\/spatial/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
	const reimplements = sources.filter((f) => /class Berx(SpatialWorld|5DRuntime|SpatialCamera)\b/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
	gate(
		`@berx/${backend} is a backend, not a second product`,
		usesCore && reimplements.length === 0,
		reimplements.length > 0 ? `reimplements core classes in ${reimplements.join(', ')}` : `${sources.length} modules, all built on @berx/spatial`,
	);
}

/* The native backend is Rust, so the same rule needs a different check:
   it must consume the shared core's draw list and decide nothing about
   the world for itself. A renderer that culls, picks its own level of
   detail, or carries its own material table is a second BERX in another
   language, and the cross-renderer comparison would be comparing it to
   itself rather than to the core. */
const nativeDir = path.join(clientRoot, 'packages/spatial-native/src');
if (fs.existsSync(nativeDir)) {
	const rust = fs.readdirSync(nativeDir).filter((f) => f.endsWith('.rs'))
		.map((f) => [f, fs.readFileSync(path.join(nativeDir, f), 'utf8')]);
	const all = rust.map(([, body]) => body).join('\n');
	const owns = /\b(struct|enum)\s+(World|Camera|Runtime|SpatialWorld|WorldGraph)\b/.test(all);
	const decides = /\bfn\s+(cull\w*|frustum\w*|select_lod|lod_for|material_for|resolve_lights)\b/.test(all)
		|| /\bLOD_DISTANCE\b/.test(all);
	gate('@berx/spatial-native is a renderer, not a second world',
		!owns && !decides && /struct DrawList/.test(all),
		owns || decides
			? 'the native crate has started deciding what the shared core decides'
			: `${rust.length} modules, all driven by the shared core's draw list`);

	/* The wire mirror must not drift from the interfaces it mirrors. Only
	   drawlist.rs is checked: it is the boundary, and the rest of the
	   crate is renderer internals that have no counterpart in the core. */
	const mirror = rust.find(([f]) => f === 'drawlist.rs')?.[1] ?? '';
	const shared = ['packages/spatial/src/drawList.ts', 'packages/spatial/src/worldLighting.ts']
		.map((f) => fs.readFileSync(path.join(clientRoot, f), 'utf8')).join('\n');
	const snake = [...mirror.matchAll(/^\s{4}pub ([a-z_0-9]+):/gm)].map((m) => m[1]);
	const camel = (n) => n.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
	const fields = [...new Set(snake.map(camel))];
	const missing = fields.filter((f) => !new RegExp(`\\b${f}\\b`).test(shared));
	gate('the native draw list mirrors the shared one field for field',
		mirror.length > 0 && fields.length > 0 && missing.length === 0,
		missing.length > 0 ? `fields the shared core does not have: ${missing.join(', ')}` : `${fields.length} fields, every one declared in packages/spatial/src`);
}

/* One shader, not one per backend. The native crate include_str!s
   world.wgsl and the WebGPU backend imports the generated mirror of it;
   if those two ever stop being the same text, two renderers that are
   supposed to be comparable have quietly started drawing differently. */
const shaderDir = path.join(clientRoot, 'packages/spatial-shaders');
if (fs.existsSync(shaderDir)) {
	const wgsl = fs.readFileSync(path.join(shaderDir, 'world.wgsl'), 'utf8');
	const mirrorTs = fs.readFileSync(path.join(shaderDir, 'src/index.ts'), 'utf8');
	const literal = mirrorTs.slice(mirrorTs.indexOf('BERX_WORLD_WGSL = ') + 'BERX_WORLD_WGSL = '.length).trim().replace(/;\s*$/, '');
	let mirrored = '';
	try { mirrored = JSON.parse(literal); } catch { mirrored = ''; }
	gate('one WGSL shader, mirrored without drift',
		mirrored === wgsl,
		mirrored === wgsl
			? `${wgsl.length} bytes, identical in world.wgsl and src/index.ts`
			: 'packages/spatial-shaders/src/index.ts is stale — run npm run generate:shaders');

	const nativeUses = fs.existsSync(path.join(clientRoot, 'packages/spatial-native/src/lib.rs')) &&
		/include_str!\("\.\.\/\.\.\/spatial-shaders\/world\.wgsl"\)/.test(fs.readFileSync(path.join(clientRoot, 'packages/spatial-native/src/lib.rs'), 'utf8'));
	const webUses = fs.existsSync(path.join(clientRoot, 'packages/spatial-web/src/webgpuRuntime.ts')) &&
		/BERX_WORLD_WGSL/.test(fs.readFileSync(path.join(clientRoot, 'packages/spatial-web/src/webgpuRuntime.ts'), 'utf8'));
	gate('both WGSL backends read that one shader',
		nativeUses && webUses,
		nativeUses && webUses ? 'berx-spatial-native include_str!s it; @berx/spatial-web imports it' : 'a backend carries its own copy of the shader');
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} SHARED-CORE GATES FAILED`);
	process.exit(1);
}
console.log('ALL SHARED-CORE GATES PASS');
