#!/usr/bin/env node
/**
 * BERX VOICE OS — is it a nervous system, or a spoken menu?
 *
 * The difference is measurable and this gate measures it in four places.
 *
 * ONE: does a sentence a person would actually say reach a capability
 * that exists? "Мне скучно" is not a command and there is no screen
 * called Boredom, but the useful response is obvious and the product can
 * give it. A voice layer that only understands "открой раздел места" has
 * not removed the menu, it has read it out loud.
 *
 * TWO: does a reference resolve, or does something guess? "Убери этот"
 * and "а второй?" are completely specific to a person standing in front
 * of five bars, and completely meaningless without that room. Every one
 * of them must resolve to an id that is really in view, or come back
 * needing one — never to a plausible choice.
 *
 * THREE: can a plan report success it did not earn? This is the check
 * that matters most, because the failure it prevents is the one that
 * destroys trust permanently: a "готово" for something that did not
 * happen. The rule is enforced structurally, and this proves the
 * structure holds.
 *
 * FOUR: does it know when to shut up? An assistant that reads the screen
 * aloud is an assistant people turn off. Silence is a designed outcome
 * here and it is checked like any other.
 *
 * AND ONE THING THAT IS NOT ABOUT VOICE AT ALL: every capability the
 * intent layer names is checked against the REAL BerxApiClient. Not a
 * list of endpoint names — the class itself, by reflection. An intent
 * that promises something the product cannot do is worse than one that
 * says it did not understand.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const esbuild = path.join(clientRoot, 'node_modules/.bin/esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-5d-voiceos-'));

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

const entry = path.join(dir, 'voiceos.mjs');
execFileSync(esbuild, [
	path.join(here, 'voiceos.entry.ts'), '--bundle', '--platform=node', '--format=esm',
	'--log-level=error', `--outfile=${entry}`,
], {cwd: clientRoot, stdio: 'inherit'});
const core = await import(entry);

/* ---------------- the room a person is standing in ---------------- */

const place = (id, label, x, energy = 0.2) => ({
	id, kind: id.split(':')[0], label, visible: true, interactive: true, focusable: true,
	energy, depth: 2, transform: {position: {x, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
	material: {opacity: 1, transmission: 0, metalness: 0, roughness: 0.4, emissive: [0, 0, 0], base: [1, 1, 1]},
});

const situation = (over = {}) => core.berxSituation({
	nowMs: 1_700_000_000_000,
	cursor: {seconds: 1_700_000_000, span: 0},
	region: 'discover',
	viewerId: 'person:1',
	eye: {x: 0, y: 0, z: 0},
	objects: [
		place('place:11', 'Дом Культуры', 3),
		place('place:12', 'Веранда', 6),
		place('place:13', 'Подвал', 9),
	],
	allowed: {microphone: true, location: true, notifications: false, presence: false},
	location: {lat: 55.75, lng: 37.62, atMs: 1_700_000_000_000 - 60_000},
	...over,
});

/* ---------------- 1. real sentences reach real capabilities ---------------- */

const said = (text, state = situation(), memory = core.BERX_EMPTY_MEMORY) =>
	core.berxReadIntent(text, state, memory);

const NATURAL = [
	['Куда бы сходить сегодня?', 'now-nearby'],
	['Хочу куда-нибудь выбраться', 'now-nearby'],
	['Мне скучно', 'now-nearby'],
	['Что сейчас происходит рядом?', 'now-nearby'],
	['Покажи что-нибудь неожиданное', 'discover'],
	['Хочу познакомиться с кем-нибудь', 'find-people'],
	['Найди место поужинать', 'find-places'],
	['Назад', 'back'],
	['Убери это', 'dismiss'],
];
/* "Что здесь сегодня?" is deliberately NOT in this list. With nothing in
   focus it SHOULD NOT resolve — the word "здесь" points at something,
   and if that something is not there the honest answer is a question.
   It was in the list at first, expected to reach `open`, and the gate
   was right to fail it: an expectation, not the code, was wrong. It is
   checked below with a focus, where it means something. */
const misread = NATURAL.filter(([text, want]) => said(text).kind !== want);
gate('sentences a person would actually say reach a real capability',
	misread.length === 0,
	misread.length
		? misread.map(([t, w]) => `"${t}" wanted ${w}, got ${said(t).kind}`).join('; ')
		: NATURAL.map(([t, w]) => `"${t}" → ${w}`).join(' · ')
		+ '. None of these is a command and there is no screen called Boredom — a voice layer that only understood "открой раздел места" would have read the menu aloud rather than removed it');

/* THE CHECK AGAINST THE REAL CLIENT. */
const clientMethods = new Set(
	Object.getOwnPropertyNames(core.BerxApiClient.prototype).filter((n) => n !== 'constructor'),
);
const promised = Object.entries(core.BERX_VOICE_CAPABILITY);
const missing = promised.filter(([, method]) => !clientMethods.has(method));
gate('every capability the voice layer names exists on the real API client',
	missing.length === 0 && promised.length > 0,
	missing.length
		? missing.map(([kind, m]) => `${kind} promises ${m}(), which BerxApiClient does not have`).join('; ')
		: promised.map(([kind, m]) => `${kind} → ${m}()`).join(' · ')
		+ ` — checked by reflection against the class, not against a list of names, out of ${clientMethods.size} methods it really has. An intent that promises something the product cannot do is worse than one that says it did not understand`);

/* ---------------- 2. references resolve or ask ---------------- */

const shown = core.berxShow(core.BERX_EMPTY_MEMORY, [
	{id: 'place:11', label: 'Дом Культуры'},
	{id: 'place:12', label: 'Веранда'},
	{id: 'place:13', label: 'Подвал'},
]);

const second = said('а второй?', situation(), shown);
gate('"а второй?" resolves to the second thing that was SHOWN',
	second.objectId === 'place:12' && second.kind === 'open',
	`→ ${second.kind} ${second.objectId} (${second.matched.join(', ')}) — ordered by what was offered, not by what happens to be visible: a person counts what they were shown`);

const afterDismiss = core.berxDismiss(shown, 'place:11');
const secondAgain = said('а второй?', situation(), afterDismiss);
gate('after a dismissal the set renumbers, as a person would count it',
	secondAgain.objectId === 'place:13',
	`with Дом Культуры removed, "второй" → ${secondAgain.objectId} (Подвал) — someone who took the first one away means the second of what is in front of them NOW; anything else asks them to remember a list they can no longer see`);

const hereFocused = said('что здесь сегодня?', situation({focusId: 'place:12'}), shown);
gate('"здесь" means the thing being looked at',
	hereFocused.objectId === 'place:12' && hereFocused.needs.length === 0,
	`focused on Веранда, "что здесь сегодня?" → ${hereFocused.objectId} — the context is in the room, not in the transcript. That is the whole reason a voice layer needs a world and not a chat history`);

const hereNothing = said('что здесь сегодня?', situation({focusId: undefined}), core.BERX_EMPTY_MEMORY);
gate('a reference to nothing comes back needing one, never guessing',
	hereNothing.needs.includes('referent') && hereNothing.objectId === undefined,
	`nothing in focus: needs [${hereNothing.needs.join(', ')}] — "${core.berxAskWhich(3).text}" costs one exchange; a wrong guess costs the trust that it was listening at all`);

const noFix = said('что происходит рядом?', situation({location: undefined}));
const noPermission = said('что происходит рядом?', situation({
	allowed: {microphone: true, location: false, notifications: false, presence: false},
}));
gate('a question about "рядом" says WHICH thing is missing',
	noFix.needs.includes('location') && noPermission.needs.includes('permission'),
	`no fix → [${noFix.needs.join(', ')}], no permission → [${noPermission.needs.join(', ')}] — they fail differently: a refusal is a choice to respect and say so, a missing fix is a condition to wait out, and the person gets to be told which`);

/* ---------------- 3. success cannot be reported unearned ---------------- */

const plan = core.berxPlan(said('что происходит рядом?'), situation());
const halfDone = core.berxOutcome([
	{step: plan.steps[0], state: 'done'},
	{step: plan.steps[1], state: 'failed', reason: 'сеть не ответила'},
]);
gate('a plan whose step failed cannot report success',
	halfDone.ok === false && halfDone.stoppedAt?.state === 'failed',
	`two steps, the second failed → ok=${halfDone.ok}, stopped at "${halfDone.stoppedAt?.step.id}" — ok is DERIVED from the steps, not set by anyone, so the "готово" that was never checked has nowhere to live. ${core.berxReport(plan.intent, halfDone, 0).text}`);

const allDone = core.berxOutcome(plan.steps.map((step) => ({step, state: 'done'})));
gate('a plan that really finished reports it',
	allDone.ok === true,
	`${plan.steps.length} steps, all done → ok=${allDone.ok}`);

gate('an empty outcome is not a success',
	core.berxOutcome([]).ok === false,
	'zero steps is nothing having happened, which is not the same as everything having worked');

/* The confirmation policy: voice is a channel, not a credential. */
const sensitive = {id: 'pay', effect: 'sensitive', says: 'x'};
const readOnly = {id: 'look', effect: 'read', says: 'x'};
gate('nothing sensitive can be completed by having been asked for out loud',
	core.berxNeedsConfirmation(sensitive) && !core.berxNeedsConfirmation(readOnly),
	'anyone in the room can speak, a recording can be played back, and a phone on a table hears everyone — so deletion, money, messages sent as you, account and privacy changes stop and ask some way other than by voice');

/* ---------------- 4. it knows when to say nothing ---------------- */

const travel = core.berxPlan(said('а второй?', situation(), shown), situation());
const travelSaid = core.berxAcknowledge(travel);
gate('a camera move is not narrated',
	travelSaid.text === '',
	`"иду туда" would be narration over something the person can watch happen — ${travelSaid.because}`);

const search = core.berxAcknowledge(core.berxPlan(said('найди место поужинать'), situation()));
gate('work that takes time IS covered, so silence never reads as deafness',
	search.text.length > 0 && search.text.length < 40,
	`"${search.text}" — ${search.because}`);

const empty = core.berxReport(said('что происходит рядом?'), allDone, 0);
const three = core.berxReport(said('что происходит рядом?'), allDone, 3);
gate('an empty result is said plainly and never filled in',
	empty.text.includes('Ничего') && !/\d/.test(empty.text),
	`"${empty.text}" — nothing is worse than a world that fills up when it has nothing to show`);
gate('a full result is a count and then silence, not a list read aloud',
	three.text.startsWith('3') && three.text.length < 30,
	`"${three.text}" — the count is the one thing not visible at a glance; the world has just filled with the rest`);

const terse = [empty.text, three.text, search.text, core.berxAskWhich(3).text];
gate('the register is short and level, never performed helpfulness',
	terse.every((t) => t.split(/\s+/).length <= 6) && !terse.some((t) => /удовольствием|конечно/i.test(t)),
	terse.map((t) => `"${t}"`).join(' · ')
	+ ' — the test for a line is whether a competent person who respected your time would say it');

const nearFar = core.berxShouldDescribe({id: 'place:13', distanceM: 30}, situation());
const nearClose = core.berxShouldDescribe({id: 'place:11', distanceM: 3}, situation());
gate('the voice describes what cannot be seen, and only that',
	nearFar === true && nearClose === false,
	'30m away: spoken, because a label that far is unreadable and the voice is adding. 3m away: silent, because the screen has already said it better');

/* ---------------- 5. interruption is normal ---------------- */

/**
 * A backend that can be stopped mid-sentence, and says when it was.
 *
 * Not a mock of a service — a stand-in for the ONE property that
 * matters here: a real synthesiser takes time to say a line and can be
 * cut off partway. Everything the gate measures is about what BERX does
 * around that, which is the part BERX owns.
 */
const makeBackend = () => {
	const state = {speaking: false, spoke: [], stops: 0, cutAfterMs: undefined, clock: 0};
	let cancel;
	return {
		state,
		backend: {
			available: true,
			async speak(text) {
				state.speaking = true;
				const started = state.clock;
				await new Promise((resolve) => {
					cancel = () => {
						state.cutAfterMs = state.clock - started;
						resolve();
					};
					/* a line takes 40 ticks of the fake clock to say */
					state.finish = () => resolve();
					queueMicrotask(() => {
						state.clock += 40;
						if (state.speaking) resolve();
					});
				});
				state.speaking = false;
				state.spoke.push(text);
			},
			async listen() { return undefined; },
			stop() {
				state.stops++;
				state.speaking = false;
				if (cancel) cancel();
			},
		},
	};
};

const line = (text) => ({text, emotion: 'calm'});

{
	const {state, backend} = makeBackend();
	const assistant = new core.BerxVoiceAssistant({backend, wait: async () => {}});
	assistant.grantMicrophone(true);
	const speaking = assistant.speak(line('Я нашёл несколько вариантов…'));
	assistant.interrupt();
	await speaking;

	gate('speaking over BERX stops the sentence at once',
		state.stops === 1 && !state.speaking,
		`one stop() reached the synthesiser and it fell silent — a person who says "нет, подожди, только не бары" halfway through has given the most useful thing they could, at the moment they realised it`);

	gate('an interrupted line is NOT recorded as having been said',
		assistant.transcript.length === 0 && assistant.interruptions === 1,
		`transcript ${assistant.transcript.length} lines, ${assistant.interruptions} interruption — a record that claims BERX told someone something it never finished saying makes every later disagreement unresolvable`);

	/* THE ONE THAT MATTERS: the conversation is still alive. */
	await assistant.speak(line('Понял.'));
	gate('the conversation continues rather than restarting',
		assistant.transcript.length === 1 && assistant.transcript[0].text === 'Понял.'
			&& assistant.wasInterrupted === false && assistant.canListen === true,
		`the next line went through, the microphone grant survived, and the interruption flag cleared — interrupt() is deliberately NOT stop(): stopping ends the session, interrupting ends the sentence, and a person saying "подожди" has not asked BERX to go away`);
}

{
	/* And the same intent machinery, on the same memory, afterwards. */
	const before = core.berxShow(core.BERX_EMPTY_MEMORY, [
		{id: 'place:11', label: 'Дом Культуры'},
		{id: 'place:12', label: 'Веранда'},
	]);
	const correction = core.berxReadIntent('нет, только не бары', situation(), before);
	gate('a correction spoken over BERX is read against what was already shown',
		correction.kind === 'refine' && before.shown.length === 2,
		`"нет, только не бары" → ${correction.kind}, against a set of ${before.shown.length} that survives the interruption — UPDATE INTENT and UPDATE WORLD happen on the same room, which is what "continue" means`);
}

/* ---------------- 6. registration: arriving, not filling in a form ----------------

   The nine stages are real, and they are not all the same KIND of thing
   — which is where a registration flow starts lying. Some commit to a
   server, some only ask, and one cannot be committed at all because the
   backend has nowhere to put it. */

const birthCapabilities = core.BERX_BIRTH_PLAN.filter((s) => s.capability);
const birthMissing = birthCapabilities.filter((s) => !clientMethods.has(s.capability));
gate('every stage that commits names a real method on the real client',
	birthMissing.length === 0 && birthCapabilities.length >= 3,
	birthMissing.length
		? birthMissing.map((s) => `${s.stage} promises ${s.capability}()`).join('; ')
		: birthCapabilities.map((s) => `${s.stage} → ${s.capability}()`).join(' · ')
		+ ' — checked by reflection against BerxApiClient, so a renamed endpoint breaks a build rather than a registration');

/**
 * THE ORDERING CONSTRAINT, and it is the API's rather than a designer's.
 *
 * Only register and login can be called without a session. A flow that
 * asked for a photograph first and held it in memory until the end
 * would lose it when the app was backgrounded, and would be showing
 * progress it had not made.
 */
const bornAt = core.BERX_BIRTH_PLAN.findIndex((s) => s.stage === 'birth');
const tooEarly = core.BERX_BIRTH_PLAN.filter((s, i) => s.needsSession && i < bornAt);
gate('nothing that needs an account is attempted before there is one',
	tooEarly.length === 0 && bornAt > 0,
	tooEarly.length
		? tooEarly.map((s) => `${s.stage} needs a session and runs before birth`).join('; ')
		: `birth is stage ${bornAt + 1} of ${core.BERX_BIRTH_PLAN.length}, and the two that need a token — ${core.BERX_BIRTH_PLAN.filter((s) => s.needsSession).map((s) => s.stage).join(', ')} — come after it. BIRTH is not last by sentiment; it is the stage after which the others become possible`);

const early = core.berxBirthReady('portrait', []);
const late = core.berxBirthReady('portrait', [{stage: 'birth', state: 'committed'}]);
gate('a portrait cannot be uploaded to an account that does not exist',
	early.ok === false && late.ok === true,
	`before birth: "${early.why}". after: allowed — the request would simply be rejected, so this is the API's constraint expressed rather than a rule invented on top of it`);

/* WHAT CANNOT BE SAVED IS MARKED, NOT FAKED. */
const blockedStages = core.BERX_BIRTH_PLAN.filter((s) => s.blocked);
gate('what this backend cannot store is declared, not invented',
	blockedStages.length === 1 && blockedStages[0].stage === 'interests'
		&& !blockedStages[0].capability,
	`${blockedStages[0].stage}: ${blockedStages[0].blocked}. It is collected because it shapes what the world shows on arrival, and it has no capability — writing it into the dating profile's interests string would be storing personal data somewhere this person did not agree to`);

/* Fields: exactly what register takes, and nothing invented to fill it. */
const oneName = core.berxBirthFields({
	name: 'Анна', username: 'anna', email: 'a@b.c', password: 'x', agreed: true,
});
gate('someone with one name gets one name, not an invented surname',
	oneName.ok && oneName.fields.firstname === 'Анна' && oneName.fields.lastname === '',
	`"Анна" → firstname "${oneName.fields.firstname}", lastname "${oneName.fields.lastname}" — the empty string is honest and the server accepts it; a filler would put a fiction in their profile`);

const notAgreed = core.berxBirthFields({name: 'Анна', username: 'anna', email: 'a@b.c', password: 'x'});
gate('nothing is created without an explicit agreement',
	notAgreed.ok === false && notAgreed.missing.includes('agreement'),
	`missing: ${notAgreed.missing.join(', ')} — and agreement is not something a voice can give: it is the one step in the arc that has to be made another way`);

const shape = Object.keys(oneName.fields).sort().join(',');
gate('the fields sent are exactly the fields the endpoint takes',
	shape === 'email,firstname,lastname,password,username',
	`${shape} — not a superset and not a guess. A field this backend does not accept is a field that should never have been asked for`);

/* And the same rule as everywhere else: progress is derived. */
const failedBirth = core.berxBirthProgress([
	{stage: 'name', state: 'collected'},
	{stage: 'interests', state: 'blocked'},
	{stage: 'identity', state: 'collected'},
	{stage: 'birth', state: 'failed', reason: 'адрес уже занят'},
]);
gate('a registration whose account creation failed is not a registration',
	failedBirth.born === false && failedBirth.failed.includes('birth'),
	`four stages reached, birth failed → born=${failedBirth.born}. Everything before it succeeded and none of that makes an account exist — the same rule the action graph enforces, in the one flow where getting it wrong would be worst`);

const realBirth = core.berxBirthProgress([
	{stage: 'birth', state: 'committed'},
	{stage: 'portrait', state: 'committed'},
]);
gate('an account the server really made is a real account',
	realBirth.born === true && realBirth.committed.includes('portrait'),
	`born=${realBirth.born}, committed: ${realBirth.committed.join(', ')}`);

const allStages = new Set(core.BERX_BIRTH_PLAN.map((s) => s.stage));
gate('the whole arc is present, in the order the API permits',
	core.BERX_BIRTH_STAGES.every((s) => allStages.has(s)) && allStages.size === 9,
	core.BERX_BIRTH_PLAN.map((s) => s.stage).join(' → ')
	+ ' — arrival and presence come before anything is asked, which is most of what makes this not a form: the first thing that happens is a world opening and someone being noticed, not a field gaining focus');

fs.rmSync(dir, {recursive: true, force: true});
if (failures.length) {
	console.error(`\nBERX VOICE OS: ${failures.length} FAILED — ${failures.join('; ')}`);
	process.exit(1);
}
console.log('\nALL VOICE OS GATES PASS');
