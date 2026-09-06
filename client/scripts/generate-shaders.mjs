#!/usr/bin/env node
/**
 * Mirror the canonical WGSL into a TypeScript module.
 *
 * The shader lives once, in packages/spatial-shaders/world.wgsl. The
 * native crate reads that file directly; TypeScript cannot, without a
 * bundler loader configured in every place that bundles this code, so
 * this writes the same text into a module the TypeScript backends can
 * import. The shared-core gate fails if the two stop matching.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '../packages/spatial-shaders');
const wgsl = fs.readFileSync(path.join(pkg, 'world.wgsl'), 'utf8');

const module = `/**
 * GENERATED FROM world.wgsl BY scripts/generate-shaders.mjs — DO NOT EDIT.
 *
 * Edit packages/spatial-shaders/world.wgsl and run
 * \`npm run generate:shaders\`. The shared-core gate fails if this file
 * and the .wgsl it mirrors ever disagree.
 */
export const BERX_WORLD_WGSL = ${JSON.stringify(wgsl)};
`;
fs.writeFileSync(path.join(pkg, 'src/index.ts'), module);
console.log(`packages/spatial-shaders/src/index.ts regenerated from world.wgsl (${wgsl.length} bytes)`);
