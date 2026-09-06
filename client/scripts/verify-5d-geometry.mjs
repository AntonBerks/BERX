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
// Every closed mesh must be wound counter-clockwise seen from outside.
// The renderer runs with CULL_FACE on, so a mesh wound the other way is
// discarded entirely rather than drawn wrong — the hardest kind of bug
// to notice, and exactly the one this caught: the sphere was inverted,
// which silently erased every person, community node and create object
// from the world.
//
// Signed volume, not a centroid test: sum of v0 · (v1 × v2) over the
// triangles is six times the enclosed volume, positive for outward
// winding, and it does not care whether the hull is centred on the
// origin — so the frame's four offset bars are measurable too.
const signedVolume = (mesh) => {
  let total = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const p = [0, 1, 2].map((k) => {
      const o = mesh.indices[i + k] * 6;
      return [mesh.vertices[o], mesh.vertices[o + 1], mesh.vertices[o + 2]];
    });
    total += p[0][0] * (p[1][1] * p[2][2] - p[1][2] * p[2][1])
           - p[0][1] * (p[1][0] * p[2][2] - p[1][2] * p[2][0])
           + p[0][2] * (p[1][0] * p[2][1] - p[1][1] * p[2][0]);
  }
  return total / 6;
};
for (const [name, mesh] of meshes) {
  if (name === 'ring') continue; // open form; checked as two-sided below
  const volume = signedVolume(mesh);
  if (volume <= 0) throw new Error('5D geometry invariant: ' + name + ' is wound inward (signed volume ' + volume.toFixed(4) + ') and would be culled away');
}

// The ring encloses nothing, so it must carry both faces itself rather
// than rely on a culling mode set somewhere else. Every +Z normal must
// have a -Z twin.
const ring = meshes.find(([name]) => name === 'ring')[1];
let front = 0, back = 0;
for (let o = 0; o < ring.vertices.length; o += 6) {
  if (ring.vertices[o + 5] > 0.5) front++;
  else if (ring.vertices[o + 5] < -0.5) back++;
}
if (front === 0 || back === 0) throw new Error('5D geometry invariant: ring is single-sided (' + front + ' front, ' + back + ' back) and half of it would be culled');
if (front !== back) throw new Error('5D geometry invariant: ring faces are unbalanced (' + front + ' front, ' + back + ' back)');
// It must also stand up in XY: a ring lying flat in XZ is a hairline to
// a camera at eye level, which is what an event used to look like.
let spanY = 0, spanZ = 0;
for (let o = 0; o < ring.vertices.length; o += 6) {
  spanY = Math.max(spanY, Math.abs(ring.vertices[o + 1]));
  spanZ = Math.max(spanZ, Math.abs(ring.vertices[o + 2]));
}
if (spanY <= spanZ) throw new Error('5D geometry invariant: ring is not upright (Y span ' + spanY.toFixed(3) + ', Z span ' + spanZ.toFixed(3) + ')');

// Quality tiers, as real ordering rather than as a list of flags. The
// old check asserted that reduced motion switched off shadows and
// post-processing; this renderer has neither, so it was asserting the
// absence of something that never existed.
const tiers = [
  ['cinematic', resolveSpatialQuality({devicePixelRatio: 1, width: 1440, height: 900, reducedMotion: false, visibleObjectCount: 20})],
  ['high', resolveSpatialQuality({devicePixelRatio: 2, width: 1440, height: 900, reducedMotion: false, visibleObjectCount: 40})],
  ['balanced', resolveSpatialQuality({devicePixelRatio: 2, width: 1180, height: 820, reducedMotion: false, visibleObjectCount: 70})],
  ['conservative', resolveSpatialQuality({devicePixelRatio: 3, width: 1170, height: 2532, reducedMotion: false, visibleObjectCount: 400})],
];
for (const [expected, tier] of tiers) {
  if (tier.quality !== expected) throw new Error('5D quality invariant: expected ' + expected + ' tier, resolved ' + tier.quality);
}
// Heavier load never buys a bigger budget or more pixels.
for (let i = 1; i < tiers.length; i++) {
  const prev = tiers[i - 1][1], next = tiers[i][1];
  if (next.maxObjects > prev.maxObjects) throw new Error('5D quality invariant: ' + tiers[i][0] + ' draws more objects than ' + tiers[i - 1][0]);
}
const reduced = resolveSpatialQuality({devicePixelRatio: 3, width: 1440, height: 900, reducedMotion: true, visibleObjectCount: 4});
if (reduced.ambientMotion) throw new Error('5D quality invariant: reduced motion kept the world breathing');
if (reduced.quality !== 'conservative') throw new Error('5D quality invariant: reduced motion did not resolve the most conservative tier');
if (reduced.maxObjects > 40) throw new Error('5D quality invariant: reduced motion object budget exceeded');
if (reduced.pixelRatio > 1.5) throw new Error('5D quality invariant: reduced motion did not cap the backing store');
// A light load must not talk a stated preference out of itself.
if (resolveSpatialQuality({devicePixelRatio: 1, width: 1440, height: 900, reducedMotion: true, visibleObjectCount: 1}).ambientMotion) {
  throw new Error('5D quality invariant: a light load overrode reduced motion');
}
console.log('BERX 5D geometry/quality invariants passed: ' + meshes.length + ' meshes, winding and ring facing verified, ' + tiers.length + ' quality tiers ordered.');
`;

fs.writeFileSync(entry, source);
execFileSync('npx', ['--yes', 'esbuild', entry, '--bundle', '--platform=node', '--format=esm', '--outfile=' + path.join(temp, 'bundle.mjs')], { cwd: root, stdio: 'inherit' });
execFileSync('node', [path.join(temp, 'bundle.mjs')], { cwd: root, stdio: 'inherit' });
