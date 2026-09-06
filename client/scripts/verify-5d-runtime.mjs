#!/usr/bin/env node
/** Execute the core 5D invariants against the same TypeScript runtime shipped by BERX. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-runtime-'));
const outFile = path.join(outDir, 'runtime.mjs');
try {
  execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [
    path.join(root, 'packages/spatial/src/runtimeAssertions.ts'),
    '--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${outFile}`,
  ], { cwd: root, stdio: 'inherit' });
  const { assertBerx5DRuntimeInvariants } = await import(pathToFileURL(outFile).href);
  assertBerx5DRuntimeInvariants();
  console.log('BERX 5D runtime invariants: PASS');

  // The world graph being correct is not the same as real data reaching
  // it correctly. These run against rows shaped exactly as the API
  // types declare them, and check the two things the mapping exists to
  // guarantee: one real thing is one object in the world however it was
  // reached, and nothing emits BERX Energy without a server signal
  // behind it.
  const mappingFile = path.join(outDir, 'mapping.mjs');
  execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [
    path.join(root, 'packages/scenes/src/spatialMappingAssertions.ts'),
    '--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${mappingFile}`,
  ], { cwd: root, stdio: 'inherit' });
  const { assertBerxSpatialMappingInvariants } = await import(pathToFileURL(mappingFile).href);
  assertBerxSpatialMappingInvariants();
  console.log('BERX 5D data→world mapping invariants: PASS');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
