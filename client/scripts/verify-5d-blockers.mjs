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
const nativeRenderer = read(path.join(clientRoot, 'packages/spatial-native/src/lib.rs'));
const webgpuRenderer = read(path.join(clientRoot, 'packages/spatial-web/src/webgpuRuntime.ts'));

/**
 * A blocker is real when its evidence still holds. `claimed` is the
 * check that the code has not started saying otherwise.
 */
const BLOCKERS = [
	{
		what: 'Native iOS (Metal) and Android (Vulkan) renderers',
		evidence: () => {
			/* Both projects exist now — apps/native/ios (SwiftPM:
			   BerxViewController/BerxWorldView over the Rust C ABI) and
			   apps/native/android (Gradle: BerxActivity/BerxSurfaceView
			   over the JNI bridge). What is missing is downstream of the
			   source, so the blocker names that instead of pretending the
			   code is absent. */
			const ios = fs.existsSync(path.join(clientRoot, 'apps/native/ios/Package.swift'));
			const android = fs.existsSync(path.join(clientRoot, 'apps/native/android/settings.gradle'));
			return `the iOS (${ios ? 'SwiftPM project present' : 'absent'}) and Android (${android ? 'Gradle project present' : 'absent'}) shells wrap the same Rust/wgpu renderer, but neither can be built or run here: there is no Xcode/Apple SDK for the Metal path and no Android SDK/NDK for the Vulkan path, and no device of either kind is reachable — so nothing about a Metal or Vulkan surface, its swapchain or its pixels is verified`;
		},
		claimed: () => /kind\s*=\s*'(metal|vulkan)'/.test(renderer),
	},
	{
		what: 'Media surfaces in the desktop (native) renderer',
		evidence: () =>
			nativeRenderer
				? 'packages/spatial-native has no image decoder, so a draw item carrying a media surface is counted and left undrawn rather than substituted with something invented'
				: undefined,
		claimed: () => /media_surfaces:\s*true/.test(nativeRenderer),
	},
	{
		what: 'World-space labels in the desktop (native) renderer',
		evidence: () =>
			nativeRenderer
				? 'packages/spatial-native has no text rasteriser, so entity names are not drawn there; the shared frame used for cross-renderer comparison carries none'
				: undefined,
		claimed: () => /world_space_labels:\s*true/.test(nativeRenderer),
	},
	{
		what: 'A signed application for macOS and Windows',
		evidence: () =>
			nativeRenderer
				? 'the desktop shell packages into a .deb and a tarball that install and run, but there is no macOS .app bundle or notarisation, no Windows installer and no code signing — none of which can be produced or verified from this environment'
				: undefined,
		/* a shell that started navigating would be a second BERX */
		claimed: () => /worldNavigation":\s*true|Berx5DWorldApp|berxRelationalLayout/.test(read(path.join(clientRoot, 'packages/spatial-native/src/bin/berx_window.rs'))),
	},

	{
		what: 'Presenting WebGPU to a canvas on this driver',
		evidence: () =>
			webgpuRenderer && /berxWebGPUCanvasPresentable/.test(webgpuRenderer)
				? 'the first present to a canvas loses the device with "a valid external Instance reference no longer exists"; the offscreen path is unaffected, so the backend is verified there and the shell probes before choosing it rather than gambling a session on it'
				: undefined,
		/* choosing WebGPU without measuring whether it can draw is the lie */
		claimed: () => webgpuRenderer.length > 0 && !/berxWebGPUCanvasPresentable/.test(read(path.join(clientRoot, 'packages/spatial-web/src/webRenderer.ts'))),
	},
	{
		what: 'Reading a WebGPU canvas texture back',
		evidence: () =>
			webgpuRenderer
				? 'copyTextureToBuffer from a canvas texture fails on this driver ("a valid external Instance reference no longer exists"), so verification renders the same list through the same pipeline into an offscreen resolve target instead; only the attachment differs'
				: undefined,
		claimed: () => /getCurrentTexture\(\)[\s\S]{0,80}copyTextureToBuffer/.test(webgpuRenderer),
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
		what: 'The BERX components whose source no longer exists anywhere',
		evidence: () => {
			const components = path.join(repoRoot, 'backend/opensource-socialnetwork-master/components');
			const missing = ['OssnCommunities', 'OssnDating', 'OssnStories', 'OssnReport']
				.filter((name) => !fs.existsSync(path.join(components, name)));
			return missing.length > 0
				? `${missing.join(', ')} are registered active in ossn_components and their source is in no commit in this repository — lost to the same inherited .gitignore rule that hid OssnApi, and unlike OssnApi they cannot be restored from history because they were never committed. Their domain classes survive in classes/ (OssnDating, OssnStories, OssnReport; communities runs on core's own OssnGroup and never had a class of its own) and their schema is in the install SQL; what is gone is the component wrapper each one needs to load. This blocker does NOT explain the 500s that were once attributed to it: those were measured to two other causes, both now fixed — PHP 8 signature clashes in five classes, and OSSN core reading offset as a 1-based page number. POST /api/v1/posts, GET /api/v1/profiles/{username} and GET /api/v1/feed all answer 200 against the running server`
				: undefined;
		},
		/* claiming them present without the directories would be the lie */
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
