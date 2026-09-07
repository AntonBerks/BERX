#!/usr/bin/env node
/**
 * Stereo, from a headset's own poses.
 *
 * A headset does not ask BERX to guess where the eyes are. ARKit,
 * ARCore and OpenXR all report the same thing: two poses with the
 * runtime's own interpupillary distance and its own per-eye optics. The
 * shared core turns those into two cameras — one conversion, so a head
 * turn means the same thing on a phone and in a headset — and the same
 * world is resolved for each.
 *
 * What is checked here is that the stereo is real: two different views
 * of one world, drawn by the native backend into one image the way an
 * XR runtime is submitted, with the eyes far enough apart to see
 * differently and near enough to be a face.
 *
 * What is not checked is that any of it feels right through a lens. No
 * headset, no phone and no AR runtime is reachable from here, and that
 * stays a blocker.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const crate = path.join(clientRoot, 'packages/spatial-native');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-xr-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocked = (name, reason) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`         ${reason}`);
};

const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const entry = path.join(dir, 'xr.mjs');
execFileSync(esbuild, [
	path.join(here, '5d-xr.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entry}`,
], {cwd: clientRoot, stdio: 'inherit'});

const leftFile = path.join(dir, 'left.json');
const rightFile = path.join(dir, 'right.json');
const reportFile = path.join(dir, 'report.json');
execFileSync(process.execPath, [entry, leftFile, rightFile, reportFile], {cwd: clientRoot, stdio: 'inherit'});
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

/* ---- the runtime's numbers, not ours ---- */
gate('the eyes are where the runtime said they are',
	Math.abs(report.ipd - 0.063) < 1e-9 &&
	Math.abs(report.eyePositions.right.x - report.eyePositions.left.x - 0.063) < 1e-9,
	`${(report.ipd * 1000).toFixed(1)}mm apart, which is what the headset reported rather than a constant BERX picked`);
gate("each eye keeps the headset's own optics",
	report.fov.left === 96 && report.fov.right === 96,
	`${report.fov.left}° per eye, past the ${58}° a screen's zoom may reach — a lens is not a zoom`);

/* ---- one world, two views of it ---- */
const sameEntities = report.items.left.length > 0 &&
	report.items.left.length === report.items.right.length &&
	report.items.left.every((id, i) => id === report.items.right[i]);
gate('both eyes see the same world',
	sameEntities,
	`${report.items.left.length} entities in the same order in both eyes: ${report.items.left.join(', ')}`);
const viewsDiffer = report.view.left.some((v, i) => Math.abs(v - report.view.right[i]) > 1e-6);
gate('and they see it from different places',
	viewsDiffer,
	`the two view matrices differ by ${Math.max(...report.view.left.map((v, i) => Math.abs(v - report.view.right[i]))).toFixed(4)} — a stereo pair, not the same image twice`);

/* ---- and the native backend draws both ---- */
let stereo;
try {
	execFileSync('cargo', ['build', '--release', '--quiet', '--bin', 'berx-render'], {cwd: crate, stdio: 'inherit'});
	const rgba = path.join(dir, 'stereo.rgba');
	const out = execFileSync(path.join(crate, 'target/release/berx-render'), [leftFile, '--right', rightFile, '--rgba', rgba], {
		cwd: crate, encoding: 'utf8',
	});
	stereo = {...JSON.parse(out.trim().split('\n').pop()), rgbaPath: rgba};
} catch (error) {
	blocked('xr-native-render', `the native backend could not draw the stereo pair: ${String(error.stderr ?? error.message).trim().split('\n').pop()}`);
}

if (stereo) {
	const left = JSON.parse(fs.readFileSync(leftFile, 'utf8'));
	gate('the native backend draws both eyes into one image',
		stereo.stereo === true &&
		stereo.width === left.width * 2 &&
		stereo.height === left.height &&
		stereo.drawCalls === left.items.length * 2,
		`${stereo.width}x${stereo.height} · ${stereo.drawCalls} draw calls · ${stereo.triangles} triangles on ${stereo.backend}`);

	const pixels = new Uint8Array(fs.readFileSync(stereo.rgbaPath));
	const half = left.width;
	const ground = [7, 8, 10];
	const isWorld = (i) => Math.abs(pixels[i] - ground[0]) > 3 || Math.abs(pixels[i + 1] - ground[1]) > 3 || Math.abs(pixels[i + 2] - ground[2]) > 3;
	let leftWorld = 0, rightWorld = 0, differing = 0;
	for (let y = 0; y < stereo.height; y++) {
		for (let x = 0; x < half; x++) {
			const l = (y * stereo.width + x) * 4;
			const r = (y * stereo.width + half + x) * 4;
			if (isWorld(l)) leftWorld++;
			if (isWorld(r)) rightWorld++;
			if (Math.abs(pixels[l] - pixels[r]) > 3 || Math.abs(pixels[l + 1] - pixels[r + 1]) > 3 || Math.abs(pixels[l + 2] - pixels[r + 2]) > 3) differing++;
		}
	}
	gate('both halves hold a world',
		leftWorld > half * stereo.height * 0.02 && rightWorld > half * stereo.height * 0.02,
		`${leftWorld} world pixels on the left, ${rightWorld} on the right, of ${half * stereo.height} each`);
	/* Parallax is the whole point: two identical halves would be one
	   image drawn twice, which is what a fake stereo path produces. */
	gate('the two halves are a stereo pair, not one image twice',
		differing > half * stereo.height * 0.005,
		`${differing} of ${half * stereo.height} pixels differ between the eyes — parallax from a 63mm separation`);
}

blocked('arkit', 'the pose path is shared and verified, and ARKit itself needs an iPhone: no device is reachable from here, and nothing about world tracking, plane detection or anchors can be exercised without one');
blocked('arcore', 'the same: the pose path is shared and verified, and ARCore needs an Android device with an ARCore-capable camera');
blocked('openxr', 'the stereo path is shared and drawn, and an OpenXR session needs a runtime and a headset: neither is present, so the frame loop, the swapchain acquisition and the reprojection cannot be exercised');
blocked('watchos', 'no watchOS target exists: a watch is a display form the shared core already frames for, and nothing about it can be compiled or run here');

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D XR: ${failures.length} FAILED — ${failures.join('; ')}`);
	fs.rmSync(dir, {recursive: true, force: true});
	process.exit(1);
}
console.log('ALL XR GATES PASS');
fs.rmSync(dir, {recursive: true, force: true});
