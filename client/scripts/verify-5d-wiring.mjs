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

/* ---------------- the ears ----------------

   BerxWebSpatialAudio had a gate proving a sound to the right is louder
   on the right, and a real session had no listener at all: the backend
   was a library nothing called, so every sound BERX could ever play
   would have been panned from the origin facing -Z while the camera was
   somewhere else entirely. These read the REAL AudioListener a real
   session moved. */

const near = (a, b, tolerance) => a !== undefined && b !== undefined
	&& Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance && Math.abs(a.z - b.z) <= tolerance;
const say = (v) => v ? `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})` : 'nowhere';
const au = out.audio ?? {};

gate('a real session gives the world real ears',
	au.spatial === true && !near(au.beforeAnyFrame?.position, au.heardFrom?.position, 1e-6),
	`Web Audio starts every listener at ${say(au.beforeAnyFrame?.position)}; after real frames this session's listener is at ${say(au.heardFrom?.position)} — a backend nobody drove would still be at the origin`);

gate('and the ears are where the camera is',
	near(au.heardFrom?.position, au.cameraAt, 0.05),
	`the frame the pixels came from puts the camera at ${say(au.cameraAt)}, and the real AudioListener is at ${say(au.heardFrom?.position)}. Delete the setListener line in the frame loop and this is the check that fails`);

gate('travelling carries the ears with it',
	au.travelled === true && !near(au.heardFrom?.position, au.heardAfter?.position, 0.05)
		&& near(au.heardAfter?.position, au.cameraAfter, 0.05),
	`travelling to an entity moved the camera from ${say(au.cameraAt)} to ${say(au.cameraAfter)}, and the listener went from ${say(au.heardFrom?.position)} to ${say(au.heardAfter?.position)} — one pose, not two`);

gate('and the ears face the way the camera looks',
	au.heardFrom?.forward !== undefined
		&& Math.abs(Math.hypot(au.heardAfter.forward.x, au.heardAfter.forward.y, au.heardAfter.forward.z) - 1) < 1e-3
		&& Math.abs(au.heardAfter.up.y - 1) < 1e-6,
	`facing ${say(au.heardAfter?.forward)} with up ${say(au.heardAfter?.up)} — a unit direction from the same camera, so what is behind you sounds behind you`);

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
		coreFrame: await page.evaluate(async () => await window.BERX_VOICE_WIRE.coreInTheFrame()),
		placed: await page.evaluate(async () => await window.BERX_VOICE_WIRE.placement()),
		providers: await page.evaluate(async () => await window.BERX_VOICE_WIRE.providers()),
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

/* ---------------- and WHERE it lands ----------------

   Counting objects is what let the last one of these through: three
   entities went in, three were counted, and one of them was at NaN
   while another sat on the camera. `as never` had been used to push a
   hand-built relation past the compiler, and the shape was wrong in
   three ways at once. A frame caught it — the world went darker when it
   filled — so these measure what a frame would show. */

const pl = voice.placed;

gate('everything the voice composes lands at a real position',
	pl.shown === 3 && pl.atNonPosition.length === 0,
	pl.atNonPosition.length
		? `at a non-position: ${pl.atNonPosition.join(', ')}`
		: `${pl.objects.map((o) => `${o.id}(${o.p.x.toFixed(1)},${o.p.y.toFixed(1)},${o.p.z.toFixed(1)})`).join(' ')} — every coordinate finite. One of these was NaN, because the relation it was placed from had a strength of undefined`);

gate('and each one carries an edge the world can actually place it by',
	pl.edges.length >= pl.shown && pl.wellFormedEdges === pl.edges.length,
	`${pl.edges.length} edges, all with an id, a type the layout knows and a finite strength: ${pl.edges.map((e) => `${e.type}(${e.strength})`).join(', ')}. Without ids they all collapsed onto the key \`undefined\` and exactly one survived — which is why two of three entities had nothing to be positioned against`);

gate('no two things are standing in the same place',
	pl.closest > 0.5,
	`closest pair ${pl.closest.toFixed(2)}m apart, and every object kept its name (${pl.labels} labelled). Two entities at one point is not a set a person can look at`);

/* ---------------- the Core a person actually sees ----------------

   Every Core check above reads `turn.core`, which is the loop's answer
   about itself. It was right the whole time, and the Core being drawn
   never heard any of it: the loop stepped one Core and the frame loop
   stepped another. The screenshots found it — five frames through a
   real spoken exchange, all of them in the state a pointer had set.

   These read `host.core`: the motion the frame loop steps and the draw
   list draws. */

const cf = voice.coreFrame;

gate('a spoken turn moves the Core that is actually drawn',
	cf.duringSearch === 'searching' && cf.afterResults === 'discovering',
	`at rest ${cf.atRest} → ${cf.afterTouch} on a hand → ${cf.duringSearch} while the server was still thinking → ${cf.afterResults} when it answered. Read off host.core, not off the turn: the loop's own Core was already correct while the drawn one sat in ${cf.afterTouch} for the whole exchange`);

gate('and SEARCHING is visible WHILE a person waits, not after',
	cf.duringSearch === 'searching' && cf.previousDuringSearch === 'understanding',
	`mid-flight the Core was in ${cf.duringSearch}, having come from ${cf.previousDuringSearch} — the sentence was read, then the search began, and both happened before the answer did. A state that only appeared once the server replied would be a progress bar that fills after the download`);

gate('a server that refuses puts the drawn Core in error',
	cf.duringFailing === 'searching' && cf.afterFailure === 'error',
	`${cf.duringFailing} while it tried, ${cf.afterFailure} when it could not — the same failure the world-untouched gate above measures, now visible in the room rather than only in a turn object`);

gate('the whole exchange is a path, not a jump',
	Array.isArray(cf.seen) && cf.seen.length >= 5
		&& cf.seen[0] === 'idle' && cf.seen.includes('aware')
		&& cf.seen.includes('searching') && cf.seen.includes('discovering')
		&& cf.seen[cf.seen.length - 1] === 'error',
	`${cf.seen.join(' → ')} — sampled off the rendered Core every 8ms for the length of the conversation. Delete the line that forwards causes into the host and this collapses to "idle → aware"`);

/* ---------------- the voice, and whose voice it is ----------------

   There is no BERX text-to-speech service and none is invented here.
   What is measured is the SEAM a real one plugs into: a provider that
   fails is fallen back from, the fallback is reported rather than
   silent, a language reaches the provider that claims it, and silence
   gets a reason. */
const pr = voice.providers;

gate('a provider that fails is fallen back from, and the failure is said out loud',
	pr.paidSaid === 0 && pr.platformSaid?.length === 2 && pr.using === 'web-speech'
		&& pr.log?.some((l) => l.startsWith('paid-tts:failed')),
	`the first provider refused both lines and the second spoke both; the chain reports ${pr.log?.join(' ')} and says it is using ${pr.using}. A deployment that has paid for a voice needs to see when it is silently not being used`);

gate('the language reaches the provider, and can be changed',
	pr.platformSaid?.[0]?.language === 'ru-RU' && pr.platformSaid?.[1]?.language === 'en-GB' && pr.language === 'en-GB',
	`"${pr.platformSaid?.[0]?.text}" went out as ${pr.platformSaid?.[0]?.language} and "${pr.platformSaid?.[1]?.text}" as ${pr.platformSaid?.[1]?.language} — BerxWebVoice took one language at construction and could not be asked for another, which is not multilingual`);

gate('the chain reports what it really is, pessimistically',
	pr.capability?.speaks === true && pr.capability?.listens === true
		&& pr.capability?.offDevice === true
		&& pr.capability?.id?.startsWith('chain('),
	`${pr.capability?.id}: speaks=${pr.capability?.speaks} listens=${pr.capability?.listens} offDevice=${pr.capability?.offDevice}. One provider in the chain posts audio to a remote service, so the CHAIN does — a person deciding whether to open a microphone is entitled to the pessimistic answer`);

gate('listening falls to whoever can hear, and stop reaches everyone',
	pr.heard === 'heard by mic' && Array.isArray(pr.stopped) && pr.stopped.every((n) => n === 1),
	`a provider that only listens was asked and answered "${pr.heard}"; stop() reached all ${pr.stopped?.length} providers. A person who wants silence gets it from the whole chain, not from whoever happens to be speaking`);

gate('the platform\'s own recogniser is what a session would listen with',
	typeof voice.recogniser?.present === 'boolean',
	voice.recogniser.present
		? 'SpeechRecognition is present in this browser, so BerxWebVoice drives it directly'
		: 'this browser exposes no SpeechRecognition, and BerxWebVoice reports that rather than pretending — the touch and keyboard paths reach every capability the voice can (see BERX_WITHOUT_VOICE)');

/* ---------------- the world, kept live ----------------

   applyBerxRealtimeEvent had a gate. BerxRealtimeClient had a gate
   against the real PHP socket server (verify:5d-realtime, which dials a
   real TCP socket with real accounts). Nothing joined them, so a shipped
   session opened no socket at all and a world was live only in the sense
   that reloading produced a newer one.

   These drive the REAL join against a socket that answers exactly the
   way berx-realtime-server.php answers — same frames, same order, same
   authorization rule. */

execFileSync(esbuild, [
	path.join(here, 'livewire.entry.ts'), '--bundle', '--format=esm', '--target=es2020',
	'--platform=browser', '--log-level=error', `--outfile=${path.join(dir, 'live.js')}`,
], {cwd: clientRoot, stdio: 'inherit'});
fs.writeFileSync(path.join(dir, 'live.html'),
	`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>BERX 5D live wiring</title>
<style>html,body{margin:0;background:#07080A}</style></head>
<body><script type="module" src="./live.js"></script></body></html>`);

let liveOut, liveErrors = [];
const server3 = http.createServer((req, res) => {
	const name = (req.url ?? '/').split('?')[0];
	if (name === '/favicon.ico') return void res.writeHead(204).end();
	const file = path.join(dir, name === '/' ? 'live.html' : path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
	if (!file.startsWith(dir) || !fs.existsSync(file)) return void res.writeHead(404).end();
	res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
	fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server3.listen(0, '127.0.0.1', r));
const browser3 = await launchChromium();
try {
	const page = await browser3.newPage({viewport: {width: 640, height: 400}, deviceScaleFactor: 1});
	page.on('pageerror', (e) => liveErrors.push(e.message));
	await page.goto(`http://127.0.0.1:${server3.address().port}/`, {waitUntil: 'load'});
	await page.waitForFunction(() => typeof window.BERX_LIVE_WIRE !== 'undefined');
	liveOut = await page.evaluate(async () => await window.BERX_LIVE_WIRE.run());
} finally {
	await browser3.close();
	server3.close();
}

gate('a real live session runs without a page error', liveErrors.length === 0,
	liveErrors.length ? liveErrors.join('; ') : 'clean');

gate('a session really opens a socket, with a credential the server minted',
	liveOut.opened?.protocol === 'berx-realtime-1'
		&& liveOut.post?.calls?.includes('mintRealtimeToken')
		&& JSON.stringify(liveOut.opened?.handshake) === JSON.stringify(['auth', 'subscribe']),
	`the session minted a credential and sent ${liveOut.opened?.handshake?.join(' then ')} on subprotocol ${liveOut.opened?.protocol} — nothing here is subscribed to before the server says who this socket is`);

gate('and it subscribes to the channels this world implies, not to a list',
	JSON.stringify(liveOut.opened?.channels) === JSON.stringify(['person:77', 'person:78', 'self:77']),
	`granted ${liveOut.opened?.channels?.join(', ')} — the viewer's own, and the people who are really standing in their world. Delete the line that derives them and there is nothing to send`);

gate('a real write somewhere else becomes an entity in this world',
	liveOut.post?.heard === true
		&& JSON.stringify(liveOut.post?.gained) === JSON.stringify(['moment:5150'])
		&& liveOut.post?.applied?.[0]?.applied === 'ingested',
	`${liveOut.post?.before?.length} entities before the event, ${liveOut.post?.after?.length} after: ${liveOut.post?.gained?.join(', ')} arrived with nobody polling`);

gate('and what arrived is the server\'s entity, never the event\'s payload',
	liveOut.post?.calls?.includes('feed(30)') && liveOut.post?.label === 'реальный пост с сервера',
	`the event said {kind: post:created, guid: 5150} and carried no text; the world shows "${liveOut.post?.label}", read back through ${liveOut.post?.calls?.filter((c) => c !== 'mintRealtimeToken').join(', ')} — the same endpoint a cold load uses, which is what makes a live world and a reloaded one the same world`);

gate('a channel this session was never granted delivers nothing',
	liveOut.unentitled?.delivered === false,
	'an event on person:999 reached no listener — the server filters by what each connection was actually granted, and this session asked for nothing it is not entitled to');

gate('a world that grew starts listening to who arrived in it',
	liveOut.grew?.heard === true
		&& liveOut.grew?.objects?.includes('person:79')
		&& !liveOut.grew?.channelsBefore?.includes('person:79')
		&& liveOut.grew?.channelsAfter?.includes('person:79')
		&& liveOut.grew?.subscribes === 2,
	`Вера arrived through an event; the session's channels went from ${liveOut.grew?.channelsBefore?.join(', ')} to ${liveOut.grew?.channelsAfter?.join(', ')} on the SAME socket (${liveOut.grew?.subscribes} subscribe frames, no reconnect, no second credential). A person on screen nobody is listening to is a world that is live only for the people who were there at boot`);

gate('a deployment with no socket refuses rather than pretending',
	typeof liveOut.noUrl?.refused === 'string' && liveOut.noUrl.refused.includes('no socket URL')
		&& liveOut.noUrl?.called?.includes('mintRealtimeToken'),
	`"${liveOut.noUrl?.refused}" — it asked the server, the server had no URL configured, and it refused to dial a guessed address. A handle that silently never delivers is the failure this makes impossible`);

gate('a world with nobody signed in has no channels to ask for',
	typeof liveOut.noViewer?.refused === 'string' && liveOut.noViewer.refused.includes('no signed-in viewer')
		&& liveOut.noViewer?.dialled === 0,
	`"${liveOut.noViewer?.refused}", and the token endpoint was never called — every channel is derived from who the viewer is`);

gate('an entity the server cannot return leaves the world exactly as it was',
	liveOut.broken?.before === liveOut.broken?.after
		&& liveOut.broken?.applied?.[0]?.startsWith('failed:')
		&& liveOut.broken?.state === 'open',
	`the read threw "сеть не ответила": ${liveOut.broken?.before} entities before and ${liveOut.broken?.after} after, and the socket is still ${liveOut.broken?.state}. One unreachable entity is not a reason to drop a live session, and it is never a reason to show something the server did not give`);

gate('a server that keeps refusing is retried, never multiplied',
	liveOut.storm?.opened > 0 && liveOut.storm?.opened <= liveOut.storm?.ceiling
		&& liveOut.storm?.stoppedAfterClose === true,
	`${liveOut.storm?.opened} sockets opened against a server that refused every one, over 400ms at a 20ms floor — linear, and none after close(). One failure used to schedule TWO reconnects (the socket's close handler and the rejected promise's catch), each of which became two: a real session held 4,546 open connections. Anything that doubles blows the ceiling of ${liveOut.storm?.ceiling} immediately`);

gate('closing the session closes the socket',
	liveOut.closed?.socketClosed === true && liveOut.closed?.state === 'closed',
	'destroy() reaches the socket — a world that is gone must not keep a connection open behind it');

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX 5D wiring: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL WIRING GATES PASS');
