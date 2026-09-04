/**
 * Generates packages/scenes/src/contracts.generated.ts from
 * docs/v9/scenes.v9.json (the normalized v9 archive contract).
 *
 * Run from client/:  node scripts/generate-v9-scenes.mjs
 *
 * The generated file is committed so the app has no build step, and
 * regenerating it must be a no-op unless docs/v9 actually changed —
 * scripts/verify-v9-contracts.mjs asserts exactly that in CI/QA.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const source = path.join(repoRoot, 'docs', 'v9', 'scenes.v9.json');
const target = path.join(here, '..', 'packages', 'scenes', 'src', 'contracts.generated.ts');

const data = JSON.parse(fs.readFileSync(source, 'utf8'));
if (!Array.isArray(data.screens) || data.screens.length !== data.count) {
	throw new Error(`scenes.v9.json count mismatch: declared ${data.count}, found ${data.screens?.length}`);
}

const rows = data.screens
	.map((s) => {
		const components = s.components.map((c) => `'${c}'`).join(', ');
		return `\t['${s.screenId}', '${s.title.replace(/'/g, "\\'")}', '${s.family}', '${s.routeName}', '${s.routePath}', '${s.mood}', '${s.material}', '${s.lightRecipe}', '${s.contentDepth}', [${components}]],`;
	})
	.join('\n');

const out = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: docs/v9/scenes.v9.json (normalized from
 * ${data.source}).
 * Regenerate: cd client && node scripts/generate-v9-scenes.mjs
 * Verify:     cd client && node scripts/verify-v9-contracts.mjs
 *
 * Only the ten fields that actually vary across the 300 archive
 * contracts are stored per screen. Everything else is invariant and
 * lives once, in registry.ts, as BERX_V9_CONTRACT_DEFAULTS — which
 * the verifier checks against the archive rather than trusting.
 */
import type {BerxDepthKey, BerxLightRecipeName, BerxMaterialName} from '@berx/spatial';
import type {BerxFamily, BerxMood} from '@berx/spatial';

/** [screenId, title, family, routeName, routePath, mood, material, lightRecipe, contentDepth, components] */
export type BerxSceneRow = readonly [
	string,
	string,
	BerxFamily,
	string,
	string,
	BerxMood,
	BerxMaterialName,
	BerxLightRecipeName,
	BerxDepthKey,
	readonly string[],
];

export const BERX_V9_SCENE_ROWS: readonly BerxSceneRow[] = [
${rows}
] as const;

export const BERX_V9_SCENE_COUNT = ${data.count};
`;

fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, out);
console.log(`generated ${data.count} scene rows -> ${path.relative(repoRoot, target)}`);
