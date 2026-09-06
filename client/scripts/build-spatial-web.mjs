#!/usr/bin/env node
/**
 * Bundles @berx/spatial + @berx/spatial-web into the committed,
 * dependency-free web runtime at scripts/berx-5d.runtime.js.
 *
 * The site has no build step by design (see README), so the artefact
 * is committed. It is generated from the same TypeScript the React
 * Native app uses — that is the whole point: one resolver, two
 * platforms, no second implementation to drift.
 *
 * Run from client/:  node scripts/build-spatial-web.mjs
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const outFile = path.join(repoRoot, 'scripts', 'berx-5d.runtime.js');

execFileSync(
	path.join(clientRoot, 'node_modules/.bin/esbuild'),
	[
		path.join(clientRoot, 'packages/spatial-web/src/index.ts'),
		'--bundle',
		'--format=esm',
		'--target=es2020',
		'--platform=browser',
		'--log-level=error',
		'--banner:js=/* BERX 5D ULTIMATE v9 — web spatial runtime.\n * GENERATED from client/packages/spatial{,-web}/src by\n * client/scripts/build-spatial-web.mjs. Do not edit by hand.\n * Regenerate: cd client && node scripts/build-spatial-web.mjs\n */',
		`--outfile=${outFile}`,
	],
	{cwd: clientRoot, stdio: 'inherit'},
);

const bytes = fs.statSync(outFile).size;
console.log(`built ${path.relative(repoRoot, outFile)} (${(bytes / 1024).toFixed(1)} kB)`);

/**
 * The site's own scene contracts.
 *
 * berx.online is a real BERX surface and must stand in the same world
 * the app does, which means it needs real v9 contracts rather than a
 * hand-written approximation of one. It does not need all 300: the
 * page has a hero and a few sections, so only those contracts are
 * emitted — generated from @berx/scenes, so the site cannot drift
 * from the archive the app is built on.
 */
const SITE_SCREENS = ['BERX-001', 'BERX-061', 'BERX-176', 'BERX-201', 'BERX-226', 'BERX-266', 'BERX-031', 'BERX-291'];
const scenesEntry = path.join(clientRoot, 'scripts', '.site-scenes.entry.ts');
fs.writeFileSync(
	scenesEntry,
	`import {findContract} from '@berx/scenes';\n` +
		`const IDS = ${JSON.stringify(SITE_SCREENS)};\n` +
		`const out = Object.fromEntries(IDS.map((id) => [id, findContract(id)]).filter(([, c]) => c));\n` +
		`process.stdout.write(JSON.stringify(out));\n`,
);
const resolvedFile = path.join(clientRoot, 'scripts', '.site-scenes.bundle.mjs');
execFileSync(
	path.join(clientRoot, 'node_modules/.bin/esbuild'),
	[
		scenesEntry,
		'--bundle',
		'--format=esm',
		'--platform=node',
		'--log-level=error',
		`--outfile=${resolvedFile}`,
	],
	{cwd: clientRoot, stdio: 'inherit'},
);
/* Resolved once at build time and emitted as data. The site needs the
   contracts, not the registry that finds them — shipping the whole
   lookup to a landing page would be 90 kB to read seven objects. */
const resolved = execFileSync(process.execPath, [resolvedFile], {cwd: clientRoot}).toString();
const scenesOut = path.join(repoRoot, 'scripts', 'berx-5d.scenes.js');
fs.writeFileSync(
	scenesOut,
	'/* BERX 5D ULTIMATE v9 — the scene contracts the site uses.\n' +
		' * GENERATED from client/packages/scenes by\n' +
		' * client/scripts/build-spatial-web.mjs. Do not edit by hand.\n' +
		' */\n' +
		`export const BERX_SITE_CONTRACTS = ${JSON.stringify(JSON.parse(resolved), null, 1)};\n`,
);
fs.rmSync(scenesEntry, {force: true});
fs.rmSync(resolvedFile, {force: true});
console.log(
	`built ${path.relative(repoRoot, scenesOut)} (${(fs.statSync(scenesOut).size / 1024).toFixed(1)} kB, ${SITE_SCREENS.length} contracts)`,
);
