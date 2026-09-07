#!/usr/bin/env node
/**
 * The voice at the door — does it actually behave like someone talking
 * to you, and does what it says actually reach the world?
 *
 * WHAT THIS GATE CAN AND CANNOT PROVE, said first because the
 * difference is the whole honesty of the thing.
 *
 * It CANNOT prove that a voice sounds human. There is no audio device
 * and no microphone in this container, and even with them, whether a
 * synthesiser sounds alive is not a number. That is recorded as a
 * BLOCKER below, in the gate's own output, rather than being quietly
 * replaced by something easier to measure.
 *
 * What it CAN prove is everything the code is actually responsible
 * for, by running it:
 *
 *   the script is said in the order it is written, once each;
 *   the silences are the ones the brief asked for — 3s after a
 *     question, 2s after an answer — measured on a clock, not read
 *     off a constant;
 *   the pacing really changes with emotion, and in the right
 *     direction;
 *   a tone heard in a transcript is answered by a different voice;
 *   a line about a sphere lifts THAT sphere while it is spoken and
 *     puts it out afterwards — in world state, on real entities;
 *   the name really appears letter by letter, in order, in space;
 *   a microphone cannot be opened without a yes;
 *   nothing heard is met once and then let go, never a retry loop;
 *   the core contains no DOM, no randomness, and no second world;
 *   and the three platform adapters convert the SAME two numbers
 *     correctly for their own API, which is the one thing about them
 *     that can be checked without a device.
 *
 * The backend used below is a recording instrument, not a stand-in for
 * a capability: it exists to observe when the core asks for speech and
 * with what prosody. Nothing it returns is presented as a real voice.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};
const blocker = (name, detail) => {
	console.log(`BLOCKED  ${name}`);
	console.log(`      ${detail}`);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-voice-'));
const bundle = path.join(dir, 'voice.mjs');
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(here, 'voice.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${bundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
const V = await import(`file://${bundle}`);

/* ------------------------------------------------------------------ *
 * A clock we control, so three-second silences are measured rather
 * than waited out. Every pause the core takes goes through `wait`, so
 * the elapsed number below is the core's own decision, not a guess.
 * ------------------------------------------------------------------ */
function makeClock() {
	let t = 1_000_000;
	return {
		now: () => t,
		wait: async (ms) => { t += ms; },
		advance: (ms) => { t += ms; },
	};
}

/** Records every speak/listen the core performs, with its prosody and the time. */
function makeProbe(clock, {speakMs = 1200, answers = []} = {}) {
	const spoken = [];
	const listens = [];
	let queue = [...answers];
	return {
		spoken,
		listens,
		backend: {
			available: true,
			async speak(text, prosody) {
				const startedAt = clock.now();
				clock.advance(speakMs);
				spoken.push({text, prosody, startedAt, endedAt: clock.now()});
			},
			async listen(timeoutMs) {
				listens.push({at: clock.now(), timeoutMs});
				return queue.shift();
			},
			stop() {},
		},
	};
}

/* ------------------------------------------------------------------ *
 * 1. The pacing constants are the ones the brief asked for.
 * ------------------------------------------------------------------ */
gate('the pacing is 0.9 / 1.1, in one place',
	V.BERX_VOICE_RATE === 0.9 && V.BERX_VOICE_PITCH === 1.1 &&
	V.berxVoiceProsody('calm').rate === 0.9 && V.berxVoiceProsody('calm').pitch === 1.1,
	`rate ${V.BERX_VOICE_RATE}, pitch ${V.BERX_VOICE_PITCH} — and 'calm' is exactly that, so every other emotion is a stated departure from a base rather than five unrelated numbers`);

const emotions = ['calm', 'tender', 'warm', 'holding', 'certain'];
const p = Object.fromEntries(emotions.map((e) => [e, V.berxVoiceProsody(e)]));
gate('emotion really changes the voice, in the right direction',
	p.tender.rate < p.calm.rate && p.tender.pitch < p.calm.pitch &&
	p.warm.rate > p.calm.rate && p.warm.pitch > p.calm.pitch &&
	p.holding.rate < p.tender.rate && p.holding.pauseMs > p.calm.pauseMs &&
	p.certain.pitch < p.calm.pitch,
	`tender ${p.tender.rate.toFixed(2)}/${p.tender.pitch.toFixed(2)} is slower and lower than calm ${p.calm.rate.toFixed(2)}/${p.calm.pitch.toFixed(2)}; warm ${p.warm.rate.toFixed(2)}/${p.warm.pitch.toFixed(2)} is faster and brighter; holding is the slowest and waits ${p.holding.pauseMs}ms`);

gate('no emotion leaves a voice a platform cannot speak',
	emotions.every((e) => p[e].rate > 0.5 && p[e].rate < 1.5 && p[e].pitch > 0.5 && p[e].pitch < 2),
	`all five rates in ${Math.min(...emotions.map((e) => p[e].rate)).toFixed(2)}..${Math.max(...emotions.map((e) => p[e].rate)).toFixed(2)} — outside roughly 0.5..1.5 a synthesiser either garbles or refuses`);

gate('the two silences from the brief are the constants the code uses',
	V.BERX_VOICE_PAUSE_AFTER_QUESTION === 3000 && V.BERX_VOICE_PAUSE_AFTER_ANSWER === 2000 &&
	p.holding.pauseMs === 3000,
	`3000ms after a question, 2000ms after an answer, and 'holding' — the emotion every question is written in — carries the question pause itself`);

/* ------------------------------------------------------------------ *
 * 2. The script, run for real, in order and on a clock.
 * ------------------------------------------------------------------ */
async function runFlow({answers, choose, listenMs = 8000} = {}) {
	const clock = makeClock();
	const probe = makeProbe(clock, {answers});
	const world = [];
	/* The one wire between a voice and a world: the assistant reports a
	   moment, the flow turns it into energy on an entity. The gate uses
	   the real wire rather than calling the world functions itself. */
	const assistant = new V.BerxVoiceAssistant({backend: probe.backend, wait: clock.wait});
	const flow = new V.BerxVoiceRegistration({
		assistant,
		onWorld: (changed) => world.push(...changed.map((o) => ({id: o.id, energy: o.energy, at: clock.now()}))),
		listenMs,
		now: clock.now,
	});
	const wired = new V.BerxVoiceAssistant({
		backend: probe.backend,
		wait: clock.wait,
		onMoment: flow.applyMoment,
	});
	wired.grantMicrophone(true);
	flow.useAssistant(wired);
	if (choose) flow.choose(choose);
	const outcome = await flow.run();
	return {outcome, spoken: probe.spoken, listens: probe.listens, world, flow, clock};
}

const heardLove = {transcript: 'наверное, любовь', confidence: 0.8, hesitationMs: 900};
const heardName = {transcript: 'меня зовут Анна', confidence: 0.9, hesitationMs: 500};
const full = await runFlow({answers: [heardLove, heardName]});

const texts = full.spoken.map((s) => s.text);
const expected = [
	...V.BERX_VOICE_WAKING.map((u) => u.text),
	...V.BERX_VOICE_IDENTITY.map((u) => u.text),
	...V.BERX_VOICE_OFFER.map((u) => u.text),
	V.BERX_VOICE_CHOSEN.love.text,
	V.BERX_VOICE_NAME_ASK.text,
	...V.berxVoiceNameHeard('Анна', 'love').map((u) => u.text),
	V.berxVoiceWelcome('Анна').text,
];
gate('the script is spoken in the order it is written, once each',
	texts.length === expected.length && texts.every((t, i) => t === expected[i]),
	`${texts.length} lines: ${texts.slice(0, 3).join(' / ')} … ${texts.slice(-1)[0]}`);

gate('nothing empty is ever spoken',
	texts.every((t) => t.trim().length > 0),
	`the shortest line is "${texts.reduce((a, b) => (a.length <= b.length ? a : b))}" — reaching the microphone must never cost an empty utterance`);

/* the silence after each line, measured between when one line ended
   and the next began, on the clock the core advanced itself */
const gaps = full.spoken.slice(1).map((s, i) => s.startedAt - full.spoken[i].endedAt);
const questionIndex = texts.indexOf(V.BERX_VOICE_NAME_ASK.text);
gate('a question is followed by three real seconds of silence',
	gaps[questionIndex] === V.BERX_VOICE_PAUSE_AFTER_QUESTION + V.BERX_VOICE_PAUSE_AFTER_ANSWER,
	`"${V.BERX_VOICE_NAME_ASK.text}" ended at t=${full.spoken[questionIndex].endedAt}, the next line began at t=${full.spoken[questionIndex + 1].startedAt} — a ${gaps[questionIndex]}ms silence, of which 3000ms is the question pause and 2000ms is the pause after the answer`);

const offerIndex = texts.indexOf(V.BERX_VOICE_OFFER[0].text);
gate('an answer is followed by two real seconds before anything replies',
	gaps[offerIndex] === V.BERX_VOICE_PAUSE_AFTER_ANSWER + V.berxVoiceProsody(V.BERX_VOICE_OFFER[0].emotion).pauseMs,
	`the offer ended at t=${full.spoken[offerIndex].endedAt} and the reply began at t=${full.spoken[offerIndex + 1].startedAt}: ${gaps[offerIndex]}ms, which is the offer's own ${V.berxVoiceProsody(V.BERX_VOICE_OFFER[0].emotion).pauseMs}ms plus the ${V.BERX_VOICE_PAUSE_AFTER_ANSWER}ms a person gets after speaking`);

gate('every line carries the prosody of its own emotion into the backend',
	full.spoken.every((s) => {
		const u = V.BERX_VOICE_ALL_LINES.find((l) => l.text === s.text) ??
			[...V.berxVoiceNameHeard('Анна', 'love'), V.berxVoiceWelcome('Анна')].find((l) => l.text === s.text);
		const want = V.berxVoiceProsody(u.emotion);
		return s.prosody.rate === want.rate && s.prosody.pitch === want.pitch;
	}),
	`all ${full.spoken.length} lines arrived at the platform with the rate and pitch of the emotion they were written in — the emotion is not a comment`);

gate('the same run twice says the same thing at the same times',
	JSON.stringify((await runFlow({answers: [heardLove, heardName]})).spoken) === JSON.stringify(full.spoken),
	'the conversation is deterministic, which is what lets this gate predict it at all');

/* ------------------------------------------------------------------ *
 * 3. Voice → sphere. The flare, in world state.
 * ------------------------------------------------------------------ */
const loveId = V.BERX_INTENT_OBJECT.love;
const loveEvents = full.world.filter((w) => w.id === loveId);
gate('the sphere the voice is talking about flares while it speaks',
	loveEvents.length >= 2 && loveEvents[0].energy === 1 && loveEvents[loveEvents.length - 1].energy === 0,
	`${loveId} went to energy ${loveEvents[0].energy} at t=${loveEvents[0].at} and back to ${loveEvents[loveEvents.length - 1].energy} at t=${loveEvents[loveEvents.length - 1].at} — real energy on a real entity, so it reaches WebGL2, WebGPU and the native renderer through the ordinary draw list`);

const flaredIds = new Set(full.world.filter((w) => w.energy === 1).map((w) => w.id));
gate('only the sphere being spoken about lights',
	flaredIds.size === 1 && flaredIds.has(loveId),
	`exactly one entity ever reached full energy: ${[...flaredIds].join(', ')} — BERX Energy is #4FD6E8, and spending it on four spheres at once would make it decoration`);

const finalWorld = full.flow.world;
const stillLit = finalWorld.filter((o) => o.energy > 0);
gate('no sphere is left lit when the voice has finished with it',
	stillLit.length > 0 && stillLit.every((o) => o.id.startsWith('letter:')),
	`${finalWorld.length} entities at the end, and the only ${stillLit.length} still glowing are the letters of the name — every sphere went dark with the line about it, because the accent means NOW rather than "was mentioned"`);

/* The bug this exists for: the welcome line is about no sphere at all,
   and an earlier version read that as "put everything out" — which
   extinguished the name it had just spent three lines writing. */
const nameAtWelcome = finalWorld.filter((o) => o.id.startsWith('letter:'));
gate('the welcome line does not put out the name it just wrote',
	nameAtWelcome.length === 4 && nameAtWelcome.every((l) => l.energy > 0),
	`after the last line, all four letters are still lit at ${nameAtWelcome.map((l) => l.energy.toFixed(2)).join(', ')} — a line that is about no particular sphere must not own the energy of everything else in the room`);

/* ------------------------------------------------------------------ *
 * 4. Voice → name → letters in light.
 * ------------------------------------------------------------------ */
const letters = finalWorld.filter((o) => o.id.startsWith('letter:'));
gate('the name is written in the world, one entity per letter',
	letters.length === 4 && letters.map((l) => l.label).join('') === 'Анна',
	`"${letters.map((l) => l.label).join('')}" — ${letters.length} real spatial entities, not a text overlay, which is what lets the name be walked around and be occluded by what is in front of it`);

const xs = letters.map((l) => l.transform.position.x);
gate('the letters stand in a line, evenly, centred on the person',
	Math.abs(xs.reduce((a, b) => a + b, 0) / xs.length) < 1e-9 &&
	new Set(xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 1e6))).size === 1,
	`x = ${xs.map((x) => x.toFixed(2)).join(', ')} — even ${(xs[1] - xs[0]).toFixed(2)}m spacing, mean exactly 0`);

/* 0.375 of a four-letter name lands in the MIDDLE of the second letter,
   which is the only progress at which the claim below can be tested at
   all: one letter said, one being said, two not yet reached. */
const partial = V.berxNameInLight('Анна', 0.375, {x: 0, y: 0.2, z: -1.2}, 0);
gate('the letter being said is the brightest thing in the name',
	partial[0].energy > 0 && partial[1].energy > partial[0].energy &&
	partial[2].energy === 0 && partial[3].energy === 0,
	`mid-way through the second letter: ${partial.map((l) => l.energy.toFixed(2)).join(', ')} — the obvious ramp would have made the letter currently being said the DIMMEST of the lit ones, which is backwards`);

const walk = [0, 0.25, 0.5, 0.75, 1].map((t) => V.berxNameInLight('Анна', t, {x: 0, y: 0.2, z: -1.2}, 0)
	.reduce((sum, l) => sum + l.energy, 0));
gate('the light only ever grows across the name',
	walk.every((v, i) => i === 0 || v >= walk[i - 1]) && walk[0] === 0 && walk[4] > walk[0],
	`total lit energy at 0, ¼, ½, ¾, 1 = ${walk.map((v) => v.toFixed(2)).join(' → ')} — monotonic, so a letter never goes dark again mid-name`);

gate('the same name lights the same way every time',
	JSON.stringify(V.berxNameInLight('Анна', 0.6, {x: 0, y: 0.2, z: -1.2}, 0)) ===
	JSON.stringify(V.berxNameInLight('Анна', 0.6, {x: 0, y: 0.2, z: -1.2}, 0)),
	'deterministic — the same name and progress give the same world, which is what let this gate predict the positions above');

/* ------------------------------------------------------------------ *
 * 5. Tone, from real transcripts.
 * ------------------------------------------------------------------ */
const toneCases = [
	[{transcript: 'я', confidence: 0.6, hesitationMs: 6200}, 'trembling'],
	[{transcript: 'ну не знаю', confidence: 0.7, hesitationMs: 1200}, 'uncertain'],
	[{transcript: '', confidence: 0.9, hesitationMs: 200}, 'uncertain'],
	[{transcript: 'я ищу настоящую дружбу', confidence: 0.92, hesitationMs: 400}, 'confident'],
	[{transcript: 'любовь', confidence: 0.7, hesitationMs: 800}, 'plain'],
];
gate('a transcript is read for the cues it really carries',
	toneCases.every(([heard, want]) => V.berxDetectTone(heard) === want),
	toneCases.map(([h, w]) => `"${h.transcript || '(silence)'}" → ${w}`).join('; '));

gate('each tone is answered by a different voice',
	new Set(['trembling', 'uncertain', 'confident', 'plain'].map((t) => V.berxVoiceAnswerTo(t))).size === 4 &&
	V.berxVoiceProsody(V.berxVoiceAnswerTo('trembling')).rate <
		V.berxVoiceProsody(V.berxVoiceAnswerTo('confident')).rate,
	`trembling → ${V.berxVoiceAnswerTo('trembling')} (${V.berxVoiceProsody(V.berxVoiceAnswerTo('trembling')).rate.toFixed(2)}), confident → ${V.berxVoiceAnswerTo('confident')} (${V.berxVoiceProsody(V.berxVoiceAnswerTo('confident')).rate.toFixed(2)}) — someone whose voice is shaking is not met with a bright one`);

/* ------------------------------------------------------------------ *
 * 6. What was meant, and what was NOT.
 * ------------------------------------------------------------------ */
gate('a spoken choice reaches the right sphere',
	V.berxIntentFromSpeech('наверное, любовь') === 'love' &&
	V.berxIntentFromSpeech('я хочу найти друзей') === 'friendship' &&
	V.berxIntentFromSpeech('творчество') === 'creation' &&
	V.berxIntentFromSpeech('я ищу') === 'search',
	'stems rather than whole words, because Russian inflects every one of these');

gate('an answer that means two things, or nothing, is not guessed at',
	V.berxIntentFromSpeech('любовь и дружба') === undefined &&
	V.berxIntentFromSpeech('погода хорошая') === undefined &&
	V.berxIntentFromSpeech('') === undefined,
	'"любовь и дружба" names two spheres and is refused — picking one would be the machine deciding something about a person that they did not say');

gate('a name is taken from how people actually answer',
	V.berxNameFromSpeech('меня зовут Анна') === 'Анна' &&
	V.berxNameFromSpeech('Анна') === 'Анна' &&
	V.berxNameFromSpeech('  анна, очень приятно') === 'Анна' &&
	V.berxNameFromSpeech('') === undefined &&
	V.berxNameFromSpeech('...') === undefined,
	'one word, letters only — a recogniser\'s trailing noise must not be written across the room in light');

/* ------------------------------------------------------------------ *
 * 7. Consent, and what happens when the room cannot hear.
 * ------------------------------------------------------------------ */
{
	const clock = makeClock();
	const probe = makeProbe(clock, {answers: [heardLove]});
	const assistant = new V.BerxVoiceAssistant({backend: probe.backend, wait: clock.wait});
	const heard = await assistant.listen(8000);
	const asked = await assistant.ask({text: 'Как тебя зовут?', emotion: 'holding'});
	gate('a microphone cannot be opened without a yes',
		probe.listens.length === 0 && heard === undefined && asked === undefined,
		'listen() and ask() both returned nothing and the backend\'s listen was never called — consent is structural here, not a flag a caller can forget');
	assistant.grantMicrophone(true);
	await assistant.listen(8000);
	gate('and it opens the moment there is one',
		probe.listens.length === 1,
		'the same object, after grantMicrophone(true), reached the recogniser once');
}

{
	const clock = makeClock();
	const probe = makeProbe(clock, {answers: [{transcript: 'мм', confidence: 0.2, hesitationMs: 5000}]});
	const assistant = new V.BerxVoiceAssistant({backend: probe.backend, wait: clock.wait});
	assistant.grantMicrophone(true);
	const heard = await assistant.listen(8000);
	gate('a recogniser that is not sure is not believed',
		heard === undefined,
		`confidence 0.2 is below ${V.BERX_VOICE_MIN_CONFIDENCE} and is discarded rather than acted on — acting on it would be the product inventing what someone said`);
}

const nothing = await runFlow({answers: []});
gate('nothing heard is met once, and then let go',
	nothing.outcome.silentPath === true &&
	nothing.spoken.filter((s) => s.text === V.BERX_VOICE_NOT_HEARD[0].text).length === 1 &&
	nothing.spoken.some((s) => s.text === V.BERX_VOICE_SILENT_PATH[1].text),
	`"${V.BERX_VOICE_NOT_HEARD[0].text}" is said exactly once and then the silent path is offered — a voice that keeps asking someone to repeat themselves has stopped listening`);

const byHand = await runFlow({answers: [], choose: 'creation'});
gate('a hand can do everything the voice can',
	byHand.outcome.intent === 'creation' &&
	byHand.spoken.some((s) => s.text === V.BERX_VOICE_CHOSEN.creation.text),
	'the choice was made spatially and the voice answered it — speech is an addition to the world, never a requirement of it');

{
	const clock = makeClock();
	const probe = makeProbe(clock, {answers: [heardLove]});
	const assistant = new V.BerxVoiceAssistant({backend: probe.backend, wait: clock.wait, muted: true});
	assistant.grantMicrophone(true);
	await assistant.speak(V.BERX_VOICE_WAKING[0]);
	gate('a person who asked for silence gets it',
		probe.spoken.length === 0 && assistant.transcript.length === 1,
		'nothing reached the synthesiser, and the line is still in the transcript — the whole script stays legible with the sound off, which is what makes it usable by someone who cannot hear it');
}

/* ------------------------------------------------------------------ *
 * 8. The script itself.
 * ------------------------------------------------------------------ */
/* Russian past tense and short adjectives force a gender on the person
   being addressed. A product that guesses it from a name tells someone,
   at the first moment they meet it, that it has decided something about
   them. These are the forms that would do that. */
const GENDERED = /\b(пришёл|пришла|произнёс|произнесла|сказал|сказала|расслышал|расслышала|услышал|услышала|готов|готова|уверен|уверена|сам|сама|один|одна|рад|рада|нашёл|нашла|которая|который|устал|устала)\b/i;
const offenders = V.BERX_VOICE_ALL_LINES.filter((l) => GENDERED.test(l.text));
gate('the script never decides a person\'s gender for them',
	offenders.length === 0,
	offenders.length === 0
		? `all ${V.BERX_VOICE_ALL_LINES.length} lines avoid agreement entirely — "Ты ищешь…" says what "которая ищет" said and asks nothing`
		: offenders.map((l) => `"${l.text}"`).join('; '));

gate('every line is written to be said, not read',
	V.BERX_VOICE_ALL_LINES.every((l) => l.text.length <= 90) &&
	V.BERX_VOICE_ALL_LINES.every((l) => emotions.includes(l.emotion)),
	`the longest is ${Math.max(...V.BERX_VOICE_ALL_LINES.map((l) => l.text.length))} characters, and all ${V.BERX_VOICE_ALL_LINES.length} carry a real emotion`);

gate('every choice line names the sphere it lifts',
	Object.entries(V.BERX_VOICE_CHOSEN).every(([intent, line]) => line.about === V.BERX_INTENT_OBJECT[intent]),
	'the phrase file and the world agree on what a sphere is called, from one table rather than a string typed twice');

/* ------------------------------------------------------------------ *
 * 9. The core is the core: no DOM, no randomness, no second world.
 * ------------------------------------------------------------------ */
const voiceDir = path.join(clientRoot, 'packages/spatial/src/voice');
const coreSource = fs.readdirSync(voiceDir).map((f) => ({f, src: fs.readFileSync(path.join(voiceDir, f), 'utf8')}));
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const domHits = coreSource.filter(({src}) =>
	/\b(document|window\.|HTMLElement|createElement|addEventListener|localStorage|SpeechSynthesis|webkitSpeech)\b/.test(stripComments(src)));
gate('the voice core touches no DOM',
	domHits.length === 0,
	domHits.length === 0
		? `${coreSource.length} files in packages/spatial/src/voice, none of which can name a browser — a voice that lit up a <div> would exist on the web and nowhere else`
		: domHits.map(({f}) => f).join(', '));

const randomHits = coreSource.filter(({src}) => /Math\.random\s*\(/.test(stripComments(src)));
gate('nothing about the voice is random',
	randomHits.length === 0,
	randomHits.length === 0
		? 'no Math.random call anywhere in the voice core — which is why every timing and position above could be predicted'
		: randomHits.map(({f}) => f).join(', '));

const scene = V.berxRegistrationScene(0);
gate('the registration world is made of ordinary entities',
	scene.objects.length === 5 &&
	scene.objects.every((o) => o.material && typeof o.energy === 'number' && typeof o.createdAt === 'number') &&
	scene.relations.length === 4 &&
	scene.relations.every((r) => r.from === V.BERX_ARRIVAL_ID),
	`a silhouette and four spheres, all belonging to the person considering them — so the key light, the shadows, the picking ray and the action ring all apply to them for free, with no voice-specific rendering path`);

/* ------------------------------------------------------------------ *
 * 10. The three platform adapters convert the same two numbers.
 * ------------------------------------------------------------------ */
const read = (p) => fs.readFileSync(path.join(clientRoot, p), 'utf8');
const swift = read('apps/native/ios/Sources/BerxApp/BerxVoice.swift');
gate('iOS converts rate instead of passing it through',
	/AVSpeechUtteranceDefaultSpeechRate\s*\*\s*Float\(\s*rate\s*\)|AVSpeechUtteranceDefaultSpeechRate\s*\*\s*rate/.test(swift),
	'AVSpeechUtterance.rate is an ABSOLUTE 0…1 with a default near 0.5 — assigning 0.9 to it directly would be nearly double speed, so the core\'s multiplier is applied to the platform default');
gate('iOS releases the waiter when speech is cancelled, not only when it finishes',
	/didCancel/.test(swift) && /didFinish/.test(swift),
	'both delegate callbacks resume the continuation — without didCancel, a person who asks for silence leaves the flow awaiting a line that will never end');
gate('iOS asks for the microphone before opening it',
	/SFSpeechRecognizer\.requestAuthorization/.test(swift) && /AVAudioSession/.test(swift),
	'speech recognition and the audio session are two separate permissions on iOS, and both are requested');

const java = read('apps/native/android/app/src/main/java/com/berx/native/BerxVoice.java');
gate('Android passes the rate as the multiplier it already is',
	/setSpeechRate\(\s*\(float\)\s*rate\s*\)|setSpeechRate\(\s*rate\s*\)/.test(java) && /setPitch\(/.test(java),
	'TextToSpeech.setSpeechRate is a multiplier on the engine default — the same core 0.9 that iOS had to convert is passed straight through here, which is exactly why the conversion lives in the adapters and not in the core');
gate('Android gives every utterance an id',
	/KEY_PARAM_UTTERANCE_ID|utteranceId/.test(java),
	'without an utterance id onDone never fires and the flow would await the first line forever');
gate('Android reports an error as the end of a line',
	/onError/.test(java),
	'an engine failure resolves the waiter rather than hanging the conversation');

const manifest = read('apps/native/android/app/src/main/AndroidManifest.xml');
gate('Android declares what it needs to hear and to speak',
	/android\.permission\.RECORD_AUDIO/.test(manifest) &&
	/TTS_SERVICE|RecognitionService/.test(manifest),
	'RECORD_AUDIO, and the <queries> entries without which Android 11+ reports no speech engine at all');

const web = read('packages/spatial-web/src/voiceWeb.ts');
gate('the web adapter resolves when a line ENDS',
	/onend/.test(web) && /onerror/.test(web),
	'SpeechSynthesisUtterance fires onend when the line is actually finished — resolving on start would collapse every pause in the script to nothing');
gate('the web adapter handles the prefixed recogniser',
	/webkitSpeechRecognition/.test(web),
	'SpeechRecognition is still prefixed in the browsers that have it');
gate('the web adapter admits when it needs the network',
	/requiresNetwork/.test(web),
	'browser speech recognition is a server round-trip in most engines, and a product that pretends otherwise fails silently on a train');

/* ------------------------------------------------------------------ *
 * What could not be verified here, stated rather than skipped.
 * ------------------------------------------------------------------ */
blocker('a voice that actually sounds alive',
	'A synthesiser sounds synthetic. Everything above is the craft AROUND the voice — pacing, silence, emotion, what the world does while it speaks — and it is real. The voice itself needs one of two things that are not code: a recorded actor, or a neural TTS key (docs/BERX_5D_DESIGN_REQUIREMENTS.md §2, EXTERNAL). BerxVoiceBackend is the seam either drops into with nothing above it changing.');
blocker('speech and recognition on a real device',
	'This container has no audio output and no microphone. The three adapters are written against the real platform APIs and their prosody conversion is checked above by reading them, but "the voice spoke and the microphone heard" can only be observed on a device with both. Not claimed here.');

console.log('');
if (failures.length > 0) {
	console.log(`FAILED: ${failures.length}`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log('voice: all checks passed (2 BLOCKED, stated above)');
