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
		`--alias:@berx/spatial=${path.join(clientRoot, 'packages/spatial/src/index.ts')}`,
		`--outfile=${outFile}`,
	],
	{cwd: clientRoot, stdio: 'inherit'},
);

const bytes = fs.statSync(outFile).size;
console.log(`built ${path.relative(repoRoot, outFile)} (${(bytes / 1024).toFixed(1)} kB)`);
