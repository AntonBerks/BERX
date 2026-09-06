#!/usr/bin/env node
/**
 * What BERX does not have, kept honest.
 *
 * Every entry below is a capability this repository genuinely cannot
 * provide, with the evidence for why. The gate does two things: it
 * prints them, so a blocker cannot quietly become invisible, and it
 * fails if the code ever starts claiming one — a capability flag
 * flipped to true without the implementation behind it is exactly the
 * failure mode this whole suite exists to prevent.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const renderer = read(path.join(clientRoot, 'packages/spatial-web/src/threeRuntime.ts'));

/**
 * A blocker is real when its evidence still holds. `claimed` is the
 * check that the code has not started saying otherwise.
 */
const BLOCKERS = [
	{
		what: 'Native iOS (Metal) and Android (Vulkan) renderers',
		evidence: () =>
			!fs.existsSync(path.join(clientRoot, 'apps/mobile/ios')) && !fs.existsSync(path.join(clientRoot, 'apps/mobile/android'))
				? 'client/apps/mobile has no ios/ or android/ project, so a native backend cannot be compiled, linked, launched, rendered or verified here'
				: undefined,
		claimed: () => /kind\s*=\s*'(metal|vulkan)'/.test(renderer),
	},
	{
		what: 'WebGPU renderer',
		evidence: () => 'navigator.gpu is present on a served origin but requestAdapter() resolves null — there is no GPU adapter on this machine, so a WebGPU backend cannot be launched, rendered or read back. A renderer that cannot be run is not one.',
		claimed: () => /kind\s*=\s*'webgpu'/.test(renderer),
	},
	{
		what: 'Shadow maps',
		evidence: () => 'the forward pass has no depth-from-light pass and no shadow sampler',
		claimed: () => /shadows\s*:\s*true/.test(renderer),
	},
	{
		what: 'Ambient occlusion and post-processing',
		evidence: () => 'there is no G-buffer and no post chain: the pass writes straight to the default framebuffer',
		claimed: () => /postProcessing\s*:\s*true/.test(renderer),
	},
	{
		what: 'Image-based lighting',
		evidence: () => 'ambient is a single term standing in for the bounced room; there is no environment map and no light probe',
		claimed: () => /environmentMap|lightProbe|irradianceMap/.test(renderer),
	},
	{
		what: 'Server-side authorization, ownership and privacy behaviour',
		evidence: () =>
			!fs.existsSync(path.join(repoRoot, 'backend/opensource-socialnetwork-master/components/OssnApi'))
				? 'backend/opensource-socialnetwork-master/components/OssnApi is absent from this checkout; only upstream OSSN components are present, so server-side behaviour cannot be read or exercised'
				: undefined,
		claimed: () => false,
	},
	{
		what: 'Map, realtime transport, payments and entitlements',
		evidence: () => 'no map provider, realtime transport, payment provider or entitlement service exists in this repository',
		claimed: () => false,
	},
];

const failures = [];
console.log('BERX 5D — capabilities this repository does not have');
console.log('='.repeat(64));
for (const blocker of BLOCKERS) {
	const evidence = blocker.evidence();
	if (!evidence) {
		/* the reason it was blocked has gone away: that is good news, and
		   it means this entry needs removing rather than silently passing */
		console.log(`STALE   ${blocker.what}`);
		console.log('        the evidence for this blocker no longer holds — implement it or remove the entry');
		failures.push(blocker.what);
		continue;
	}
	if (blocker.claimed()) {
		console.log(`CLAIMED ${blocker.what}`);
		console.log(`        the code says it has this, and it does not: ${evidence}`);
		failures.push(blocker.what);
		continue;
	}
	console.log(`BLOCKED ${blocker.what}`);
	console.log(`        ${evidence}`);
}

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} BLOCKER RECORDS ARE WRONG`);
	process.exit(1);
}
console.log(`${BLOCKERS.length} blockers recorded, none claimed as implemented.`);
