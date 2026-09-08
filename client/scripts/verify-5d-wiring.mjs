#!/usr/bin/env node
/**
 * IS THE PRODUCT DRIVING WHAT WAS BUILT FOR IT?
 *
 * This gate exists because of a gap nothing else could see. The quality
 * tiers and the Core state machine were both built, both verified by
 * their own gates, and both never called by the shipped shell — the
 * tiers had a gate proving MEDIUM costs a sixth of HIGH, the Core had a
 * gate proving its field reaches the pixels, and a real product session
 * resolved no tier and stepped no Core. Every one of those gates passed,
 * because every one of them drove the module directly.
 *
 * A verified module the shell does not drive is a library, not a
 * feature, and the difference is invisible from inside a gate that
 * supplies its own caller. So this one drives the SHELL — the same host
 * a browser session runs — and reads back what the session actually did.
 *
 * The test to apply to anything added here: if someone deleted the line
 * that wires it up, would this fail? If not, it is not checking the
 * wiring.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchChromium} from './lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-wiring-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

execFileSync(esbuild, [
	path.join(here, 'wiring.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'world.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'index.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D wiring</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block;width:480px;height:360px}</style></head>
<body><script type="module" src="./world.js"></script></body></html>`);

const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8'};
const server = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
	const file = path.join(dir, name === '/' ? 'index.html' : path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
	if (!file.startsWith(dir) || !fs.existsSync(file)) return void res.writeHead(404).end();
	res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
	fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

let out, errors = [];
const browser = await launchChromium();
try {
	const page = await browser.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_WIRING !== 'undefined');
	out = await page.evaluate(async () => await window.BERX_WIRING.run());
} finally {
	await browser.close();
	server.close();
}

gate('a real host session starts without a page error', errors.length === 0,
	errors.length ? errors.join('; ') : 'clean');

/* ---------------- the tier ---------------- */

gate('a real session resolves a render tier, and says why',
	['ultra', 'high', 'medium', 'low'].includes(out.tier?.tier) && (out.tier?.reason ?? '').length > 10,
	`${out.tier?.tier}: ${out.tier?.reason} — resolved once from what the platform will say about itself, not re-resolved per frame: a device does not become a different device, and a tier that moved with the frame rate would be the flicker the stability work removed`);

gate('and the tier\'s knobs are the ones the draw list is given',
	out.tier?.quality?.volumetricSteps > 0 && out.tier?.quality?.volumetricScale >= 1
		&& out.list?.volumetric?.[4] === out.tier.quality.volumetricSteps
		&& out.list?.volumetric?.[5] === out.tier.quality.volumetricScale,
	`the session's tier says ${out.tier?.quality?.volumetricSteps} march steps at 1/${out.tier?.quality?.volumetricScale}, and the draw list a real frame produced carries ${out.list?.volumetric?.[4]} at 1/${out.list?.volumetric?.[5]}. Delete the line that passes quality through and this is the check that fails`);

gate('every pass still runs at whatever tier this device got',
	out.tier?.quality?.volumetricSteps > 0 && out.tier?.quality?.ssaoSamples > 0
		&& out.tier?.quality?.shadowMapSize > 0 && out.tier?.quality?.particleScale > 0,
	`march ${out.tier?.quality?.volumetricSteps} steps, occlusion ${out.tier?.quality?.ssaoSamples} taps, shadow ${out.tier?.quality?.shadowMapSize}, motes x${out.tier?.quality?.particleScale} — a tier changes what an effect costs, never whether it exists`);

/* ---------------- the Core ---------------- */

gate('a real frame loop steps the Core',
	out.core?.moved === true,
	`over ${out.core?.frames} frames the field moved by ${out.core?.travelled?.toFixed(5)} — a Core nobody stepped would be identical after any number of frames, which is exactly what a product session was doing before this`);

gate('and the Core\'s field reaches the draw list',
	out.list?.airDensity !== undefined && Math.abs(out.list.airDensity - out.core.expectedDensity) < 1e-6,
	`the Core's haze put the volumetric density at ${out.list?.airDensity?.toFixed(5)}, which is the room's own ${out.core?.baseDensity?.toFixed(5)} scaled by the field — not a number the renderer chose`);

gate('a real event moves the Core, and nothing else does',
	out.core?.afterEvent !== out.core?.atStart && out.core?.idleStaysPut === true,
	`${out.core?.atStart} → ${out.core?.afterEvent} when something actually happened; ${out.core?.idleFrames} frames with nothing happening left the state where it was. Every cause is a thing that occurred — there is no function that makes the Core look interesting`);

/* ---------------- the voice, attached to the world ----------------

   BerxWebVoice turned a microphone into a transcript and
   berxSpeakToWorld turned a sentence into a confirmed change of the
   world, and nothing joined them: a session had a voice that could hear
   and a world that could change and no path between the two. Both sides
   had gates. The gap did not.

   These drive a REAL host with a REAL binding against a client that
   answers the way the server does — and, for the failure case, one that
   does not. */

execFileSync(esbuild, [
	path.join(here, 'voicewire.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'voice.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'voice.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D voice wiring</title>
<style>html,body{margin:0;background:#07080A}canvas{display:block;width:240px;height:180px}</style></head>
<body><script type="module" src="./voice.js"></script></body></html>`);

let voice, voiceErrors = [];
const server2 = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
	const file = path.join(dir, name === '/' ? 'voice.html' : path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
	if (!file.startsWith(dir) || !fs.existsSync(file)) return void res.writeHead(404).end();
	res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
	fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server2.listen(0, '127.0.0.1', r));
const browser2 = await launchChromium();
try {
	const page = await browser2.newPage({viewport: {width: 900, height: 500}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => voiceErrors.push(e.message));
	await page.goto(`http://127.0.0.1:${server2.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_VOICE_WIRE !== 'undefined');
	voice = {
		barge: await page.evaluate(async () => await window.BERX_VOICE_WIRE.bargeIn()),
		recogniser: await page.evaluate(() => window.BERX_VOICE_WIRE.recogniser()),
		conversation: await page.evaluate(async () => await window.BERX_VOICE_WIRE.conversation()),
		fails: await page.evaluate(async () => await window.BERX_VOICE_WIRE.serverFails()),
		missing: await page.evaluate(async () => await window.BERX_VOICE_WIRE.missingCapability()),
	};
} finally {
	await browser2.close();
	server2.close();
}

gate('a real voice session runs without a page error', voiceErrors.length === 0,
	voiceErrors.length ? voiceErrors.join('; ') : 'clean');

const c = voice.conversation;

gate('a spoken question calls the REAL API method the plan names',
	c.calls.length === 1 && c.calls[0].startsWith('nearbyNow(55.75,37.62)'),
	`"что происходит рядом?" reached the client as ${c.calls.join(', ')} — the plan names a capability by the client method's own name, and the bridge calls that method with the arguments it really takes. Nothing about the sentence is interpreted here`);

gate('and the world shows what came back, rather than a sentence about it',
	c.asked.change === 'composed' && c.asked.shown.length === 3
		&& c.afterAsk.count > c.before.count
		&& c.asked.shown.every((s) => c.afterAsk.ids.includes(s.id)),
	`${c.before.count} entities before, ${c.afterAsk.count} after: ${c.asked.shown.map((s) => s.label).join(', ')} are IN the world, Core in ${c.asked.core}. A question answered with a sentence while the room stays as it was is a chatbot`);

/* Guarded: a gate that throws reports nothing at all, and the first
   version of this one crashed on an empty list instead of saying which
   check failed and why. */
const secondShown = c.asked.shown[1];
gate('a reference into what was just shown travels there, silently',
	secondShown !== undefined && c.second.change === 'travelled'
		&& c.second.objectId === secondShown.id && c.second.said === '',
	secondShown === undefined
		? 'nothing was shown, so there is no second thing to refer to — the check above says why'
		: `"а второй?" → ${c.second.objectId} (${secondShown.label}), Core ${c.second.core}, nothing said — the camera is visibly moving, and narrating that would be the assistant reading its own screen`);

gate('a dismissal really removes it from what is in front of the person',
	c.dismissed.change === 'removed' && c.dismissed.left.length === 2,
	`"убери это" left ${c.dismissed.left.length}: ${c.dismissed.left.join(', ')} — the same spatial memory the next "второй" will count in`);

/* THE ONE THAT MATTERS MOST. */
const f = voice.fails;
gate('a server that refuses leaves the world exactly as it was',
	f.ok === false && f.change === 'none' && f.shown === 0
		&& f.after.count === f.before.count && f.core === 'error',
	`the client was called (${f.calls.join(', ')}) and threw "${f.reason}": ${f.before.count} entities before and ${f.after.count} after, nothing composed, Core in ${f.core}, and the person was told — "${f.said}". Showing a set the server did not give is the same lie as a spoken "готово" and much harder to notice`);

const m = voice.missing;
gate('a capability the client does not have fails rather than being invented',
	m.ok === false && m.change === 'none' && m.after.count === m.before.count
		&& (m.reason ?? '').length > 0,
	`against a client with no such method: "${m.reason}", nothing composed, world unchanged. A name with no method behind it is refused, not guessed at — which is what keeps this binding thin enough to trust`);

/* ---------------- barge-in ----------------

   Interruption is not an error and not a reset: it is how people talk.
   What is measured is not that a second sentence is ACCEPTED — anything
   accepts a second call — but that speaking stops at once, that the
   superseded turn does not rearrange the world when it finally returns,
   and that the correction carries the original request forward. */

const b = voice.barge;

gate('speaking stops the instant a person starts talking',
	b.silencedCount === 1,
	`stop was called ${b.silencedCount} time(s), before the new sentence was even read. A person who starts talking has already decided BERX should stop, and every millisecond after that decision is the system talking over them`);

gate('a correction carries forward what it corrects, rather than starting over',
	b.second.intent === 'refine' && b.second.refining === 'find-events'
		&& b.second.capability.includes('events'),
	`"нет, только вечерние" read as ${b.second.intent} of ${b.second.refining}, and planned ${b.second.capability.join(', ')} — the SAME search with one more constraint. This was hardcoded to places, so a correction after "покажи события" went looking for restaurants: the definition of starting from scratch`);

gate('the interrupted turn does not rearrange the world when it lands',
	b.calls.filter((c) => c === 'events').length === 2
		&& b.worldIds.filter((id) => id.startsWith('event:')).length === 2,
	`the client was called ${b.calls.join(', ')} — the first request was already in the air and still came back, and only the second one's result is in the world (${b.worldIds.join(', ')}). A turn that was superseded must not apply an answer to a question that has been replaced`);

gate('the conversation keeps everything it knew',
	b.busyDuring === true && b.second.change === 'composed',
	`BERX was still working when it was cut off (busy=${b.busyDuring}), and the new sentence was read against everything the conversation already knew — what was shown, what was dismissed, and what was last requested. Interruption keeps context; only a reset would lose it`);

gate('the platform\'s own recogniser is what a session would listen with',
	typeof voice.recogniser?.present === 'boolean',
	voice.recogniser.present
		? 'SpeechRecognition is present in this browser, so BerxWebVoice drives it directly'
		: 'this browser exposes no SpeechRecognition, and BerxWebVoice reports that rather than pretending — the touch and keyboard paths reach every capability the voice can (see BERX_WITHOUT_VOICE)');

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D wiring: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL WIRING GATES PASS');
