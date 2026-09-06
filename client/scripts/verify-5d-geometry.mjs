import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-geometry-'));
const entry = path.join(temp, 'verify.ts');
const geometry = path.resolve(root, 'packages/spatial-web/src/primitiveGeometry.ts').replaceAll('\\', '/');
const quality = path.resolve(root, 'packages/spatial-web/src/runtimeQuality.ts').replaceAll('\\', '/');

const source = `
import { createBox, createSphere, createRing, createFrame } from ${JSON.stringify(geometry)};
import { resolveSpatialQuality } from ${JSON.stringify(quality)};

const meshes = [
  ['box', createBox()],
  ['sphere', createSphere()],
  ['ring', createRing()],
  ['frame', createFrame()],
];
for (const [name, mesh] of meshes) {
  if (mesh.vertices.length === 0 || mesh.indices.length === 0) throw new Error('5D geometry invariant: empty ' + name);
  if (mesh.vertices.length % 6 !== 0) throw new Error('5D geometry invariant: invalid vertex stride for ' + name);
  for (const value of mesh.vertices) if (!Number.isFinite(value)) throw new Error('5D geometry invariant: non-finite vertex in ' + name);
  for (const index of mesh.indices) if (index < 0 || index >= mesh.vertices.length / 6) throw new Error('5D geometry invariant: index out of range in ' + name);
}
const cinematic = resolveSpatialQuality({devicePixelRatio: 1, width: 1440, height: 900, reducedMotion: false, visibleObjectCount: 20});
const reduced = resolveSpatialQuality({devicePixelRatio: 3, width: 1170, height: 2532, reducedMotion: true, visibleObjectCount: 100});
if (!cinematic.ambientMotion || cinematic.maxObjects < 80) throw new Error('5D quality invariant: cinematic tier degraded unexpectedly');
if (reduced.ambientMotion || reduced.shadows || reduced.postFx) throw new Error('5D quality invariant: reduced motion kept ambient effects');
if (reduced.maxObjects > 40) throw new Error('5D quality invariant: reduced motion object budget exceeded');
console.log('BERX 5D geometry/quality invariants passed: ' + meshes.length + ' meshes, quality tiers verified.');
`;

fs.writeFileSync(entry, source);
execFileSync('npx', ['--yes', 'esbuild', entry, '--bundle', '--platform=node', '--format=esm', '--outfile=' + path.join(temp, 'bundle.mjs')], { cwd: root, stdio: 'inherit' });
execFileSync('node', [path.join(temp, 'bundle.mjs')], { cwd: root, stdio: 'inherit' });
