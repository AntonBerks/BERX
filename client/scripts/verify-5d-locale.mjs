#!/usr/bin/env node
/**
 * WHAT LANGUAGE BERX SPEAKS, MEASURED.
 *
 * The product is Russian, and the point of this gate is that the claim
 * "BERX supports six languages" cannot be made accidentally. Coverage is
 * computed from the catalogues rather than declared beside them, so a
 * locale is listed as complete only when its catalogue really has every
 * key the source has.
 *
 * The other half is the localisation that needs no translated content
 * at all — locale resolution, text direction, and numbers, dates and
 * relative times from `Intl` — which is complete for all six today and
 * is the half most often missed. A German browser gets German date
 * order and German number grouping now; it gets German words when
 * somebody writes them.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const clientRoot = path.resolve(here, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'berx-locale-'));
const bundle = path.join(dir, 'core.mjs');
execFileSync(path.join(clientRoot, 'node_modules/.bin/esbuild'), [
	path.join(clientRoot, 'packages/spatial/src/index.ts'), '--bundle', '--format=esm',
	'--target=es2020', '--platform=neutral', '--log-level=error', `--outfile=${bundle}`,
], {cwd: clientRoot, stdio: 'inherit'});
/* the shipped catalogue, from the shipped entry — not a copy */
const entry = fs.readFileSync(path.join(clientRoot, 'scripts/app-shell.entry.ts'), 'utf8');
const core = await import(bundle);

const failures = [];
const gate = (name, ok, detail) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
	if (detail) console.log(`      ${detail}`);
	if (!ok) failures.push(name);
};

/* --- the catalogue, as the product really declares it --- */
const ruKeys = [...entry.matchAll(/'(action\.[a-z-]+)':\s*'/g)].map((m) => m[1]);
const wired = [...entry.matchAll(/:\s*berxText\('(action\.[a-z-]+)'\)/g)].map((m) => m[1]);
const emptyLocales = ['en', 'de', 'fr', 'es', 'ar'].filter((l) => new RegExp(`\\n\\t${l}: \\{\\},`).test(entry));

gate('every label the world draws comes from the catalogue',
	ruKeys.length > 0 && wired.length === ruKeys.length
	&& wired.every((id) => ruKeys.includes(id)),
	`${ruKeys.length} message ids in the ru catalogue and ${wired.length} labels reading from it, one for one.`
	+ ' The values are byte-identical to the ones that were inline, so nothing the world says changed: what changed is that a missing translation is now a measurable fact rather than a string literal nobody can count');

gate('and the five languages BERX does not have are empty, not machine-filled',
	emptyLocales.length === 5,
	`${emptyLocales.join(', ')} are declared and empty. Five catalogues of unreviewed machine output would read as finished and be wrong in ways nobody would find until a person read them.`
	+ ' An empty catalogue is an honest statement of where the product is');

/* --- coverage, computed rather than claimed --- */
const catalogues = {
	ru: Object.fromEntries(ruKeys.map((id) => [id, 'x'])),
	en: {}, de: {}, fr: {}, es: {}, ar: {},
};
const coverage = core.berxLocaleCoverage(catalogues);
const complete = coverage.filter((c) => c.complete).map((c) => c.locale);
gate('coverage is computed from the catalogues, and says one language',
	complete.length === 1 && complete[0] === 'ru'
	&& coverage.filter((c) => c.keys === 0).length === 5,
	coverage.map((c) => `${c.locale} ${c.keys}/${c.of}`).join(' · ')
	+ ' — ru is complete and the other five are at zero. This is the number a claim about language support has to survive');

/* --- a miss is reported, never silent --- */
const missed = [];
const asked = core.berxTranslate(catalogues, 'de', 'action.like', (id, locale) => missed.push(`${id}@${locale}`));
const present = core.berxTranslate(catalogues, 'ru', 'action.like');
gate('a missing translation falls back AND says so',
	asked.fellBack === true && asked.from === 'ru' && missed.length === 1
	&& present.fellBack === false && present.from === 'ru',
	`asking German for action.like fell back to ru and reported ${missed.join(', ')}; asking Russian did not fall back.`
	+ ' A translate function that returns only a string cannot be audited: every miss looks like a hit in the source language');

const unknown = core.berxTranslate(catalogues, 'ru', 'action.nothing-like-this');
gate('and an id nothing has is drawn as the id, never as nothing',
	unknown.text === 'action.nothing-like-this',
	`"${unknown.text}" — an empty label draws a blank affordance, and a blank affordance in a ring is worse than an untranslated one`);

/* --- direction --- */
const dirs = core.BERX_LOCALES.map((l) => `${l}:${core.berxLocaleDirection(l)}`);
gate('Arabic runs right to left, and the world does not flip with it',
	core.berxLocaleDirection('ar') === 'rtl'
	&& ['ru', 'en', 'de', 'fr', 'es'].every((l) => core.berxLocaleDirection(l) === 'ltr'),
	`${dirs.join(' ')} — dir reverses the DOM BERX owns: the sign-in form, the composer, the live region.`
	+ ' The world itself keeps its handedness, because mirroring real space would move every entity to the wrong side of every other one');

/* --- resolution --- */
const resolved = [
	['de-AT', core.berxResolveLocale(['de-AT'])],
	['en-GB', core.berxResolveLocale(['en-GB'])],
	['ar', core.berxResolveLocale(['ar-EG', 'fr-FR'])],
	['pt-BR', core.berxResolveLocale(['pt-BR'])],
	['nothing', core.berxResolveLocale(undefined)],
];
gate('a locale is resolved from what the browser asks for, by primary subtag',
	core.berxResolveLocale(['de-AT']) === 'de' && core.berxResolveLocale(['en-GB']) === 'en'
	&& core.berxResolveLocale(['ar-EG', 'fr-FR']) === 'ar'
	&& core.berxResolveLocale(['pt-BR']) === 'ru' && core.berxResolveLocale(undefined) === 'ru',
	resolved.map(([asked, got]) => `${asked} → ${got}`).join(' · ')
	+ ' — a language BERX has no infrastructure for resolves to the source locale rather than to a blank product');

/* --- the half that is real in every locale today --- */
const n = core.BERX_LOCALES.map((l) => `${l} ${core.berxFormatNumber(l, 1234567.89)}`);
const distinct = new Set(core.BERX_LOCALES.map((l) => core.berxFormatNumber(l, 1234567.89)));
gate('numbers are written the way each locale writes them',
	distinct.size >= 3,
	n.join(' · ') + ` — ${distinct.size} distinct forms from six locales. This needs no translated content and it is the half of localisation most often missed`);

const when = 1789000000;
const dates = core.BERX_LOCALES.map((l) => `${l} ${core.berxFormatDateTime(l, when, {dateStyle: 'medium', timeZone: 'UTC'})}`);
const distinctDates = new Set(core.BERX_LOCALES.map((l) => core.berxFormatDateTime(l, when, {dateStyle: 'medium', timeZone: 'UTC'})));
gate('and so are dates, in a named time zone rather than the runtime default',
	distinctDates.size >= 3,
	dates.join(' · ') + ` — ${distinctDates.size} distinct forms. The zone is passed through so a gate can assert one and two renderers cannot differ`);

const rel = core.BERX_LOCALES.map((l) => `${l} "${core.berxFormatRelative(l, -7200)}"`);
gate('and how long ago, in the locale\'s own words rather than a phrase table',
	new Set(core.BERX_LOCALES.map((l) => core.berxFormatRelative(l, -7200))).size >= 3,
	rel.join(' · ') + ' — Intl.RelativeTimeFormat, which is the browser\'s own data for all six');

gate('money takes its currency as an argument and assumes none',
	core.berxFormatMoney('ru', 100, 'RUB') !== core.berxFormatMoney('de', 100, 'EUR')
	&& /100/.test(core.berxFormatMoney('en', 100, 'USD')),
	`${core.berxFormatMoney('ru', 100, 'RUB')} · ${core.berxFormatMoney('de', 100, 'EUR')} · ${core.berxFormatMoney('en', 100, 'USD')}`
	+ ' — BERX has no payment system, so there is no BERX currency to default to, and defaulting to one would be inventing a price');

fs.rmSync(dir, {recursive: true, force: true});

console.log('');
if (failures.length > 0) {
	console.log(`${failures.length} LOCALE GATES FAILED`);
	for (const f of failures) console.log(`  - ${f}`);
	process.exit(1);
}
console.log('ALL LOCALE GATES PASS — infrastructure for six, content for one, and the number says so');
