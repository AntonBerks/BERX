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
const SHADERS = [
	['world.wgsl', 'BERX_WORLD_WGSL'],
	['label.wgsl', 'BERX_LABEL_WGSL'],
	['volumetric.wgsl', 'BERX_VOLUMETRIC_WGSL'],
	['ssao.wgsl', 'BERX_SSAO_WGSL'],
];

const sources = SHADERS.map(([file, name]) => [name, file, fs.readFileSync(path.join(pkg, file), 'utf8')]);
const module = `/**
 * GENERATED FROM the .wgsl files BY scripts/generate-shaders.mjs — DO NOT EDIT.
 *
 * Edit packages/spatial-shaders/*.wgsl and run
 * \`npm run generate:shaders\`. The shared-core gate fails if this file
 * and the .wgsl it mirrors ever disagree.
 */
${sources.map(([name, , text]) => `export const ${name} = ${JSON.stringify(text)};`).join('\n')}
`;
fs.writeFileSync(path.join(pkg, 'src/index.ts'), module);
console.log(`packages/spatial-shaders/src/index.ts regenerated from ${sources.map(([, file, text]) => `${file} (${text.length} bytes)`).join(', ')}`);
