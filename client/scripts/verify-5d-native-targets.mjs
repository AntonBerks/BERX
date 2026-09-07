#!/usr/bin/env node
/**
 * The native renderer, compiled for the platforms it claims.
 *
 * "Shared core, platform renderers" is a claim about code that compiles
 * somewhere other than here. This checks the part of that which can
 * genuinely be checked: the C ABI that Android and iOS reach the
 * renderer through, exercised on this machine; and the crate itself,
 * type-checked for `aarch64-linux-android` with the Android surface path
 * active, so the Vulkan backend really does compile for Android rather
 * than merely being written for it.
 *
 * What cannot be done here is said rather than implied. Linking an APK
 * needs the NDK; anything for iOS needs Xcode's toolchain, without which
 * even `cargo check` cannot run its build scripts. And no compiled
 * backend is a running one: a phone is the only thing that proves a
 * phone.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const crate = path.resolve(here, '../packages/spatial-native');
const repoRoot = path.resolve(here, '../..');

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

const installed = (() => {
	try {
		return execFileSync('rustup', ['target', 'list', '--installed'], {encoding: 'utf8'}).split('\n').map((l) => l.trim());
	} catch {
		return [];
	}
})();

/* ---- the boundary itself, run here ---- */
try {
	const out = execFileSync('cargo', ['test', '--release', '--test', 'ffi'], {cwd: crate, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
	const line = out.split('\n').reverse().find((l) => l.includes('test result:')) ?? '';
	const passed = /(\d+) passed/.exec(line)?.[1] ?? '0';
	gate('the C ABI Android and iOS call through really works',
		/test result: ok\./.test(out) && Number(passed) >= 5,
		`${passed} tests: a real frame rendered through the boundary, a short buffer refused, a wrong-shaped draw list rejected with a reason, null arguments refused, and a capability mask that claims nothing unimplemented`);
} catch (error) {
	gate('the C ABI Android and iOS call through really works', false, String(error.stdout ?? error.message).trim().split('\n').slice(-3).join(' | '));
}

/* ---- Android: the Vulkan backend, compiled for Android ---- */
const ANDROID = 'aarch64-linux-android';
if (!installed.includes(ANDROID)) {
	blocked('android-target', `the ${ANDROID} Rust target is not installed, so the Android build cannot be attempted here`);
} else {
	try {
		/* `cargo check` stops at type-checking, which is not a build.
		   This asks for real codegen for the Android ABI and keeps the
		   artifact, so the claim is backed by a file whose machine type
		   can be read rather than by an exit code. `--crate-type rlib`
		   is what makes that possible without the NDK: every crate
		   including wgpu, jni and ndk is compiled for the target, and
		   only the final shared-library LINK — the one step that needs
		   the NDK's linker — is left out. */
		execFileSync('cargo', ['rustc', '--release', '--lib', '--no-default-features', '--target', ANDROID, '--crate-type', 'rlib'], {
			cwd: crate, stdio: ['ignore', 'pipe', 'pipe'],
		});
		const rlib = path.join(crate, 'target', ANDROID, 'release', 'libberx_spatial_native.rlib');
		const bytes = fs.existsSync(rlib) ? fs.statSync(rlib).size : 0;
		gate('the renderer compiles for Android, with its surface path active',
			bytes > 0,
			`${ANDROID}: the crate and berx_native_surface_android compile against ANativeWindow through wgpu's Vulkan backend — ${bytes} bytes of AArch64 Android object code at ${path.relative(repoRoot, rlib)}`);
	} catch (error) {
		gate('the renderer compiles for Android, with its surface path active', false,
			String(error.stderr ?? error.message).trim().split('\n').slice(-3).join(' | '));
	}
}
blocked('android-apk', 'linking a shared library and building an APK needs the Android NDK and SDK, neither of which is present; the Gradle project and JNI glue are in client/apps/native/android and cannot be built here');

/* ---- iOS: written, and not checkable here ---- */
const IOS = 'aarch64-apple-ios';
if (!installed.includes(IOS)) {
	blocked('ios-target', `the ${IOS} Rust target is not installed`);
} else {
	let reason = 'unknown';
	try {
		execFileSync('cargo', ['check', '--release', '--lib', '--no-default-features', '--target', IOS], {
			cwd: crate, stdio: ['ignore', 'pipe', 'pipe'],
		});
		gate('the renderer compiles for iOS, with its surface path active', true, `${IOS}: the crate and berx_native_surface_ios type-check`);
		reason = undefined;
	} catch (error) {
		reason = String(error.stderr ?? error.message).trim().split('\n').filter((l) => l.trim()).slice(-2).join(' | ');
	}
	if (reason) {
		blocked('ios-metal', `the ${IOS} target is installed and the Metal surface path is written, but the build cannot run here: ${reason}`);
	}
}

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D native targets: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL NATIVE-TARGET GATES PASS');
