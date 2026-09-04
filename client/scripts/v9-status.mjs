#!/usr/bin/env node
/**
 * Collects the facts the v9 status reports are written from.
 *
 * Everything here is measured from the repository or produced by the
 * two probes — nothing is asserted. Run before updating the
 * BERX_V9_*.md reports so a DONE in those files traces to something
 * that was actually checked.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const screensDir = path.join(clientRoot, 'apps/mobile/src/screens');

function walk(dir) {
	return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
		const p = path.join(dir, e.name);
		return e.isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
	});
}

const screens = walk(screensDir);
const wired = [];
for (const file of screens) {
	const src = fs.readFileSync(file, 'utf8');
	const m = /screenId="(BERX-\d+)"/.exec(src);
	if (m) wired.push({file: path.relative(clientRoot, file), screenId: m[1]});
}

const spatialDir = path.join(clientRoot, 'packages/design-system/src/spatial');
const spatialComponents = fs
	.readdirSync(spatialDir)
	.filter((f) => f.endsWith('.tsx'))
	.map((f) => f.replace('.tsx', ''));

/* which spatial components are actually rendered by a screen or another component */
const appSpatialDir = path.join(clientRoot, 'apps/mobile/src/spatial');
const allSource = [
	...screens,
	...walk(spatialDir),
	...walk(appSpatialDir),
	path.join(clientRoot, 'apps/mobile/src/AppShell.tsx'),
]
	.map((f) => ({file: f, src: fs.readFileSync(f, 'utf8')}));

const componentUsage = {};
for (const name of spatialComponents) {
	const used = allSource.filter((s) => !s.file.endsWith(`${name}.tsx`) && new RegExp(`<${name}[\\s/>]`).test(s.src));
	componentUsage[name] = used.map((u) => path.basename(u.file));
}

const typecheck = (() => {
	try {
		execFileSync(path.join(clientRoot, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json', '--noEmit'], {
			cwd: clientRoot,
			stdio: 'pipe',
		});
		return {errors: 0, byCode: {}};
	} catch (e) {
		const out = String(e.stdout ?? '') + String(e.stderr ?? '');
		const lines = out.split('\n').filter((l) => /error TS/.test(l));
		const byCode = {};
		for (const l of lines) {
			const c = /error (TS\d+)/.exec(l)?.[1] ?? 'unknown';
			byCode[c] = (byCode[c] ?? 0) + 1;
		}
		return {errors: lines.length, byCode};
	}
})();

const contractProbe = JSON.parse(
	execFileSync(process.execPath, [path.join(here, 'verify-v9-contracts.mjs'), '--json'], {
		cwd: clientRoot,
		maxBuffer: 64 * 1024 * 1024,
	}).toString(),
);

let webProbe = null;
try {
	webProbe = JSON.parse(
		execFileSync(process.execPath, [path.join(here, 'v9-web-probe.mjs'), '--json'], {
			cwd: clientRoot,
			maxBuffer: 64 * 1024 * 1024,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).toString(),
	);
} catch (e) {
	webProbe = {error: e instanceof Error ? e.message : String(e)};
}

console.log(
	JSON.stringify(
		{
			generatedAt: new Date().toISOString(),
			wiredScenes: wired.sort((a, b) => a.screenId.localeCompare(b.screenId)),
			wiredCount: new Set(wired.map((w) => w.screenId)).size,
			totalScreens: screens.length,
			spatialComponents: spatialComponents.length,
			componentUsage,
			unusedSpatialComponents: Object.entries(componentUsage)
				.filter(([, u]) => u.length === 0)
				.map(([n]) => n),
			typecheck,
			contractProbe: {gates: contractProbe.gates, report: contractProbe.report},
			webProbe: webProbe?.gates ? {gates: webProbe.gates, results: webProbe.results} : webProbe,
		},
		null,
		2,
	),
);
