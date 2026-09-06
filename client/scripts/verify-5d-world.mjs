#!/usr/bin/env node
/** X/Y/Z + T + R, executed against the real world application. */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-world-'));
try {
	const outFile = path.join(outDir, 'world.mjs');
	execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [
		path.join(root, 'packages/scenes/src/worldAssertions.ts'),
		'--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${outFile}`,
	], {cwd: root, stdio: 'inherit'});
	const {assertBerx5DWorldInvariants} = await import(pathToFileURL(outFile).href);
	assertBerx5DWorldInvariants();
	console.log('BERX 5D world invariants (X/Y/Z + T + R): PASS');
} finally {
	fs.rmSync(outDir, {recursive: true, force: true});
}
