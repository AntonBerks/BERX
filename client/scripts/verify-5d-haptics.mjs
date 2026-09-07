#!/usr/bin/env node
/**
 * Haptics, measured.
 *
 * `BerxSpatialFeedbackAdapter.impact()` was a declaration with no
 * implementation anywhere — a five-name vocabulary that nothing spoke.
 * What has to hold now is not that files exist but that:
 *
 *   the pattern is decided ONCE, in the shared core, so "focus" means
 *   the same thing in the hand on every platform;
 *   the web backend really reaches the browser's vibration API with
 *   that exact waveform;
 *   the accessibility and anti-smear rules are real, not comments;
 *   and the iOS and Android files, which cannot read the core at run
 *   time, have not drifted from it.
 *
 * The last one is the interesting check. A native app starts before any
 * JavaScript exists in the process, so BerxHaptics.java carries the
 * waveform as constants and BerxHaptics.swift carries the generator
 * names. That duplication is a real risk, so it is READ OUT OF THE
 * SOURCE and compared against the core table here — the gate fails when
 * they disagree rather than when someone notices.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

/* the real modules, compiled from source the way the app compiles them */
const bundle = path.join(os_tmp(), `berx-haptics-${Date.now().toString(36)}.mjs`);
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, 'haptics.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${bundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const {BERX_HAPTICS, BERX_HAPTIC_PATTERNS, BerxHaptics, BerxWebHaptics, berxHapticWaveform, berxHapticDuration, berxHapticForMoment} =
	await import(`file://${bundle}`);

/* ---------------- the vocabulary itself ---------------- */
gate('every pattern is defined once, in the core, with a real waveform',
	BERX_HAPTIC_PATTERNS.length === 5 &&
	BERX_HAPTIC_PATTERNS.every((p) => BERX_HAPTICS[p].waveform.length > 0 && BERX_HAPTICS[p].waveform.every((ms) => ms > 0)) &&
	BERX_HAPTIC_PATTERNS.every((p) => typeof BERX_HAPTICS[p].meaning === 'string' && BERX_HAPTICS[p].meaning.length > 0),
	BERX_HAPTIC_PATTERNS.map((p) => `${p} ${JSON.stringify(BERX_HAPTICS[p].waveform)}`).join(', '));

gate('intensity scales the real durations and never rounds a pattern to nothing',
	JSON.stringify(berxHapticWaveform('transition', 1)) === JSON.stringify([28, 22, 48]) &&
	JSON.stringify(berxHapticWaveform('transition', 0.5)) === JSON.stringify([14, 11, 24]) &&
	JSON.stringify(berxHapticWaveform('selection', 0.01)) === JSON.stringify([1]) &&
	berxHapticWaveform('selection', 0).length === 0,
	'0.5 halves every step, 0.01 floors at 1ms (a motor cannot play less), and 0 is silence rather than a 0ms pattern that would look played');

gate('the same five patterns are what the world speaks, mapped in one place',
	berxHapticForMoment('travel') === 'transition' &&
	berxHapticForMoment('focus') === 'focus' &&
	berxHapticForMoment('action-refused') === 'error' &&
	berxHapticForMoment('blur') === undefined,
	'travel→transition, focus→focus, refusal→error, and letting go of something is deliberately silent');

/* ---------------- the rules, exercised ---------------- */
let clock = 0;
const played = [];
const backend = {play: (pattern, intensity) => (played.push([pattern, intensity]), true)};
const haptics = new BerxHaptics(backend, () => clock);

gate('a pattern really reaches the hardware',
	haptics.play('focus') === true && played.length === 1 && played[0][0] === 'focus',
	'BerxHaptics.play() called the backend and reported that it really played');

const during = haptics.play('error');
clock += berxHapticDuration('focus') + 1;
const after = haptics.play('error');
gate('a second pattern does not start on top of one still playing',
	during === false && after === true,
	`a play during the ${berxHapticDuration('focus')}ms window was refused and reported false; the same call after it succeeded — two patterns at once are a smear, not two signals`);

haptics.setReducedMotion(true);
const whileReduced = haptics.play('success');
haptics.setReducedMotion(false);
gate('reduced motion silences haptics, and says so',
	whileReduced === false && haptics.available === true,
	'a device asking for less motion is asking for less buzzing; the call reports false rather than pretending it played');

const noBackend = new BerxHaptics(undefined, () => 0);
gate('no hardware is reported as no hardware',
	noBackend.play('focus') === false && noBackend.available === false,
	'a haptic that did not happen is never counted as one that did');

/* ---------------- the web backend against a real API shape ---------------- */
const calls = [];
const web = new BerxWebHaptics({vibrate: (pattern) => (calls.push(pattern), true)});
web.play('transition', 1);
web.play('selection', 1);
gate('the web backend hands the browser the core waveform, unchanged',
	JSON.stringify(calls[0]) === JSON.stringify([28, 22, 48]) && calls[1] === 10,
	`navigator.vibrate received ${JSON.stringify(calls[0])} for transition and ${calls[1]} for selection — a one-step pattern is passed as a number, which some engines require`);

const refusing = new BerxWebHaptics({vibrate: () => false});
const throwing = new BerxWebHaptics({vibrate: () => {
	throw new Error('blocked by permissions policy');
}});
gate('a browser that refuses to vibrate is reported truthfully',
	refusing.play('focus') === false && throwing.play('focus') === false &&
	new BerxWebHaptics({}).supported === false,
	'vibrate() returning false, a permissions-policy throw, and a browser with no API at all are three real "no"s — none of them is reported as a played haptic');

/* ---------------- the native files have not drifted ---------------- */
const java = fs.readFileSync(path.join(clientRoot, 'apps/native/android/app/src/main/java/com/berx/native/BerxHaptics.java'), 'utf8');
const swift = fs.readFileSync(path.join(clientRoot, 'apps/native/ios/Sources/BerxApp/BerxHaptics.swift'), 'utf8');

const javaWaveforms = {};
for (const match of java.matchAll(/([A-Z]+)\(new long\[\]\{([^}]*)\}\)/g)) {
	javaWaveforms[match[1].toLowerCase()] = match[2].split(',').map((n) => Number(n.trim()));
}
const drift = BERX_HAPTIC_PATTERNS.filter(
	(p) => JSON.stringify(javaWaveforms[p]) !== JSON.stringify([...BERX_HAPTICS[p].waveform]),
);
gate('the Android waveforms are the core waveforms, checked rather than trusted',
	drift.length === 0 && Object.keys(javaWaveforms).length === 5,
	drift.length === 0
		? `all five read out of BerxHaptics.java match BERX_HAPTICS exactly — ${Object.entries(javaWaveforms).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ')}`
		: `drifted: ${drift.join(', ')}`);

const swiftGenerators = {
	selection: /case \.selection:\s*\n\s*light\./.test(swift),
	focus: /case \.focus:\s*\n\s*medium\./.test(swift),
	transition: /case \.transition:\s*\n\s*heavy\./.test(swift),
	success: /case \.success:\s*\n\s*\/\/[\s\S]*?notification\.notificationOccurred\(\.success\)/.test(swift),
	error: /case \.error:\s*\n\s*notification\.notificationOccurred\(\.error\)/.test(swift),
};
const swiftMismatch = BERX_HAPTIC_PATTERNS.filter((p) => !swiftGenerators[p]);
gate('the iOS generators are the ones the core names for each pattern',
	swiftMismatch.length === 0,
	swiftMismatch.length === 0
		? `BerxHaptics.swift plays ${BERX_HAPTIC_PATTERNS.map((p) => `${p}→${BERX_HAPTICS[p].ios}`).join(', ')} — UIKit takes no waveform, which is why the core carries the generator name instead of milliseconds for this platform`
		: `these do not play what the core names: ${swiftMismatch.join(', ')}`);

gate('Android really asks for permission to vibrate',
	/android\.permission\.VIBRATE/.test(fs.readFileSync(path.join(clientRoot, 'apps/native/android/app/src/main/AndroidManifest.xml'), 'utf8')),
	'without VIBRATE the OS ignores createWaveform() silently, which looks exactly like a device with no motor');

gate('Android reaches the vibrator the way each OS version really provides it',
	/VibratorManager/.test(java) && /Build\.VERSION_CODES\.S/.test(java) && /hasVibrator\(\)/.test(java),
	'VibratorManager on API 31+, the legacy service below it, and hasVibrator() answered honestly — the deprecated path is not the only path');

/* ---------------- it is wired to what the world does ---------------- */
const host = fs.readFileSync(path.join(clientRoot, 'packages/spatial-web/src/runtimeHost5d.ts'), 'utf8');
const moments = ['focus', 'select', 'travel', 'back', 'action-ok', 'action-refused'].filter((m) => host.includes(`haptics.moment('${m}')`) || host.includes(`'${m}'`));
gate('the runtime host really plays them, at the moments the world has',
	host.includes("haptics.moment('focus')") &&
	host.includes("haptics.moment('travel')") &&
	host.includes("haptics.moment('back')") &&
	host.includes("haptics.moment(done ? 'action-ok' : 'action-refused')"),
	`runtimeHost5d.ts plays ${moments.join(', ')} — focusing, travelling, going back and an action taken or refused, not a decorative buzz on a render`);

fs.rmSync(bundle, {force: true});

console.log('');
if (failures.length > 0) {
	console.error(`BERX 5D haptics: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('ALL HAPTIC GATES PASS');
console.log('BLOCKED  haptics-device-verification');
console.log('         a motor cannot be felt from a container: the web path is exercised against a real vibration API shape, and the iOS/Android files are checked against the core, but whether a phone actually buzzes needs a phone');

function os_tmp() {
	return process.env.TMPDIR ?? '/tmp';
}
