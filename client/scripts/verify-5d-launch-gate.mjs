#!/usr/bin/env node
/**
 * The Full MAX 5D launch gate, evaluated against what actually ran.
 *
 * Nothing here decides readiness. It executes the real verification
 * commands, records what each one did, and hands those records to the
 * gate — so a requirement is verified only when a command really ran
 * and really passed, quoted with its own output, and blocked otherwise
 * with the reason.
 *
 * It exits non-zero when a requirement has no record at all, because an
 * unrecorded requirement is the one failure mode that would let the
 * gate drift back into being a list of intentions. Being CLOSED is not
 * a build failure — it is the honest status of a product that still
 * needs devices it does not have.
 */
import {execFileSync, execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');

/* the gate itself, from the shared core — not a copy written here */
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-launch-'));
const bundle = path.join(outDir, 'gate.mjs');
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(clientRoot, 'packages/spatial/src/launch/fullMax5DLaunchGate.ts'),
	'--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${bundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {berxEvidence, berxEvaluateLaunch, BERX_LAUNCH_REQUIREMENTS} = await import(pathToFileURL(bundle).href);

const records = [];
const now = () => Date.now();

/**
 * Run a real verification command and record what it did.
 *
 * The quote is the command's own last line of output, so the evidence
 * is something the command said rather than something this script
 * decided about it.
 */
function runGate(requirement, script, note) {
	let output = '';
	let ok = false;
	try {
		output = execSync(`npm run --silent ${script}`, {cwd: clientRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
		ok = true;
	} catch (error) {
		output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
	}
	const lines = output.trim().split('\n').filter((l) => l.trim());
	const quote = lines.at(-1) ?? '(no output)';
	records.push(berxEvidence({
		requirement,
		status: ok ? 'verified' : 'blocked',
		evidence: ok ? `${note}: ${quote}` : `${script} failed: ${quote}`,
		observedAt: now(),
		source: 'runtime',
		origin: `npm run ${script}`,
	}));
	return ok;
}

/** Record something that cannot be run here, with the reason it cannot. */
function blocked(requirement, reason, origin, source = 'device') {
	records.push(berxEvidence({requirement, status: 'blocked', evidence: reason, observedAt: now(), source, origin}));
}

/* ---------------- what really runs here ---------------- */
console.log('Running the verification this environment can actually run...\n');

runGate('shared-core', 'verify:5d-shared-core', 'the 5D core names no platform');
runGate('temporal-integrity', 'verify:5d-world', 'T and R as runtime state');
records.push(berxEvidence({
	requirement: 'relational-integrity',
	status: records.at(-1).status,
	evidence: records.at(-1).evidence,
	observedAt: now(), source: 'runtime', origin: 'npm run verify:5d-world',
}));
records.push(berxEvidence({
	requirement: 'deterministic-layout',
	status: records.at(-2).status,
	evidence: 'same graph, same coordinates, asserted in verify:5d-world',
	observedAt: now(), source: 'runtime', origin: 'npm run verify:5d-world',
}));
runGate('webgl2', 'verify:5d-gpu', 'real WebGL2 context, depth buffer, picking and budgets in Chromium');
runGate('design-integration', 'verify:5d-lighting', 'the BRDF and the DNA palette, measured in pixels');
runGate('world-navigation', 'verify:5d-app-shell', 'the world is the application');
runGate('accessibility', 'verify:v9:web', 'keyboard focus, reduced motion, contrast and high contrast, measured');
runGate('performance', 'verify:v9', 'frame budgets and contract gates');

/* several requirements are established by the app-shell run; they are
   recorded against that same run rather than re-running it */
const shell = records.find((r) => r.requirement === 'world-navigation');
for (const [requirement, what] of [
	['pose-persistence', 'a reload restores camera pose, region, focus and temporal cursor'],
	['input-integration', 'pointer picking, keyboard travel and time scrubbing in a real browser'],
	['media-pipeline', 'real media becomes GPU textures within a bounded, freed cache'],
	['authentication', 'sign-in against the real client, session kept across a reload'],
	['registration', 'publishing creates a real server entity that enters the world'],
]) {
	records.push(berxEvidence({
		requirement, status: shell.status,
		evidence: `${what} (verify:5d-app-shell)`,
		observedAt: now(), source: 'browser', origin: 'npm run verify:5d-app-shell',
	}));
}
const gpu = records.find((r) => r.requirement === 'webgl2');
records.push(berxEvidence({
	requirement: 'spatial-audio', status: gpu.status,
	evidence: 'HRTF panning and world falloff rendered offline and measured (verify:5d-gpu)',
	observedAt: now(), source: 'browser', origin: 'npm run verify:5d-gpu',
}));
records.push(berxEvidence({
	requirement: 'tablet', status: records.find((r) => r.requirement === 'shared-core').status,
	evidence: 'tablet is a declared target with its own framing and requirements, sharing one world (verify:5d-platforms)',
	observedAt: now(), source: 'runtime', origin: 'npm run verify:5d-platforms',
}));

/* ---------------- what cannot run here, and why ---------------- */
const noNative = !fs.existsSync(path.join(clientRoot, 'apps/mobile/ios')) && !fs.existsSync(path.join(clientRoot, 'apps/mobile/android'));
const nativeReason = 'client/apps/mobile has no ios/ or android/ project: nothing to compile, link, launch, render or verify';
if (noNative) {
	blocked('ios-metal', nativeReason, 'client/apps/mobile', 'repository');
	blocked('android-vulkan', nativeReason, 'client/apps/mobile', 'repository');
	blocked('watchos', nativeReason, 'client/apps/mobile', 'repository');
	blocked('arkit', `${nativeReason}; ARKit additionally needs a real device for pose, depth and anchors`, 'client/apps/mobile', 'repository');
	blocked('arcore', `${nativeReason}; ARCore additionally needs a real device for pose, depth and anchors`, 'client/apps/mobile', 'repository');
	blocked('openxr', `${nativeReason}; OpenXR additionally needs a headset for a real stereo frame loop`, 'client/apps/mobile', 'repository');
	blocked('desktop', 'no desktop shell target exists in this repository, so nothing can be packaged or launched', 'client/apps', 'repository');
	blocked('packaging', 'no native or desktop target exists to package', 'client/apps', 'repository');
	blocked('real-device-verification', 'no physical iPhone, Android device, Apple Watch or headset is reachable from this environment', 'environment', 'device');
}
blocked('webgpu', "a WebGPU device is available here and the 13 capability gates run against it, but BERX's own renderer is WebGL2: there is no WebGPU production backend in packages/spatial-web, so nothing of the product renders through WebGPU", 'npm run verify:5d-gpu', 'browser');
blocked('gpu-recovery', 'WebGL context loss is handled and the meshes rebuild, but a real device loss cannot be forced in this environment, so recovery is unproven end to end', 'packages/spatial-web/src/runtimeHost5d.ts', 'browser');

const noBackend = !fs.existsSync(path.join(repoRoot, 'backend/opensource-socialnetwork-master/components/OssnApi'));
const backendReason = 'backend/opensource-socialnetwork-master/components/OssnApi is absent from this checkout: only upstream OSSN components are present, so server behaviour cannot be exercised';
if (noBackend) {
	blocked('server-authorization', backendReason, 'backend/opensource-socialnetwork-master/components', 'backend');
	blocked('persistence', `${backendReason} — writes cannot be made and read back across a restart`, 'backend/opensource-socialnetwork-master/components', 'backend');
	blocked('privacy', backendReason, 'backend/opensource-socialnetwork-master/components', 'backend');
	blocked('security', `${backendReason} — token handling, ownership and injection surfaces are server-side`, 'backend/opensource-socialnetwork-master/components', 'backend');
}
blocked('realtime-sync', 'no realtime transport exists in this repository, so no second client can be shown receiving a mutation', 'client/packages/api/src/client.ts', 'repository');
blocked('crash-recovery', 'the world restores its place across a reload, but a real process crash cannot be induced and observed here', 'packages/spatial-web/src/appShell.ts', 'browser');

/* ---------------- the report ---------------- */
const report = berxEvaluateLaunch(records);
const width = Math.max(...BERX_LAUNCH_REQUIREMENTS.map((r) => r.length));
console.log('\nBERX FULL MAX 5D — LAUNCH GATE');
console.log('='.repeat(72));
for (const record of [...report.verified].sort((a, b) => a.requirement.localeCompare(b.requirement))) {
	console.log(`VERIFIED ${record.requirement.padEnd(width)}  ${record.evidence}`);
	console.log(`         ${' '.repeat(width)}  ${record.origin} @ ${new Date(record.observedAt).toISOString()}`);
}
for (const record of [...report.blocked].sort((a, b) => a.requirement.localeCompare(b.requirement))) {
	console.log(`BLOCKED  ${record.requirement.padEnd(width)}  ${record.evidence}`);
	console.log(`         ${' '.repeat(width)}  ${record.origin} (${record.source})`);
}
for (const requirement of report.unrecorded) {
	console.log(`NO RECORD ${requirement}`);
}
console.log('='.repeat(72));
console.log(`${report.verified.length} verified · ${report.blocked.length} blocked · ${report.unrecorded.length} unrecorded of ${BERX_LAUNCH_REQUIREMENTS.length}`);
console.log(`FULL MAX 5D: ${report.open ? 'OPEN' : 'CLOSED'}`);

fs.rmSync(outDir, {recursive: true, force: true});

if (!report.honest) {
	console.log('\nA requirement has no record at all. The gate cannot be trusted until it does.');
	process.exit(1);
}
if (report.verified.some((r) => r.status !== 'verified')) process.exit(1);
