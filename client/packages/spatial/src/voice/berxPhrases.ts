/**
 * What the voice says at the door.
 *
 * Every line here is written to be SAID, not read — which is a
 * different craft, and the reason they are short, why almost none of
 * them is a complete sentence, and why the pauses in
 * BerxVoiceAssistant carry as much as the words do.
 *
 * ONE RULE ABOUT GRAMMAR, and it is not a detail. The brief's lines
 * were feminine — "{Имя}, которая ищет". Russian forces a gender on
 * that construction, and a product that guesses it from a name will
 * tell some people, at the very first moment they meet it, that it has
 * decided something about them. So every line here is written to avoid
 * agreement entirely: "{Имя}. Ты ищешь…" says the same thing and asks
 * nothing. Where a form genuinely needs it, the person is asked — not
 * inferred.
 *
 * The lines are DATA, not code: they are here so they can be read,
 * argued with and translated without touching the assistant. A
 * translator gets a file of sentences, not a file of logic.
 */
import type {BerxVoiceUtterance} from './BerxVoiceAssistant';

/** The four things a person can be looking for. */
export type BerxIntent = 'love' | 'friendship' | 'creation' | 'search';

/**
 * The spatial id each intent's sphere carries.
 *
 * The voice lifts the sphere it is talking about, so the phrase file
 * and the world have to agree on what a sphere is called. One list,
 * here, rather than a string typed twice.
 */
export const BERX_INTENT_OBJECT: Readonly<Record<BerxIntent, string>> = Object.freeze({
	love: 'create:intent-love',
	friendship: 'create:intent-friendship',
	creation: 'create:intent-creation',
	search: 'create:intent-search',
});

/**
 * Waking.
 *
 * Three lines and two long silences. The silences are the point: the
 * first thing BERX does is stop and wait, which is the opposite of what
 * every other first-run experience does.
 */
export const BERX_VOICE_WAKING: readonly BerxVoiceUtterance[] = Object.freeze([
	{text: 'Ты слышишь меня?', emotion: 'holding'},
	{text: 'Я слышу тебя.', emotion: 'tender'},
	{text: 'Ты здесь не случайно.', emotion: 'holding'},
]);

/**
 * The question.
 *
 * Deliberately not answerable in one word, and deliberately not a
 * field. The second line is what makes it askable at all — without it
 * the first is an interrogation.
 */
export const BERX_VOICE_IDENTITY: readonly BerxVoiceUtterance[] = Object.freeze([
	{text: 'Расскажи мне… кто ты на самом деле.', emotion: 'holding'},
	{text: 'Не то, что ты говоришь другим. А то, что знаешь только ты.', emotion: 'tender'},
]);

/** The offer of the four spheres, before any of them is chosen. */
export const BERX_VOICE_OFFER: readonly BerxVoiceUtterance[] = Object.freeze([
	{text: 'Здесь четыре стороны. Подойди к той, что ближе.', emotion: 'calm'},
]);

/**
 * What is said when a sphere is chosen.
 *
 * Each one names the choice back and then says something the person did
 * not say — which is the difference between a reaction and a receipt.
 * `about` is what makes the sphere itself flare while the line is
 * spoken.
 */
export const BERX_VOICE_CHOSEN: Readonly<Record<BerxIntent, BerxVoiceUtterance>> = Object.freeze({
	love: {
		text: 'Любовь… Ты говоришь это так, будто боишься. Здесь бояться не нужно.',
		emotion: 'tender',
		about: BERX_INTENT_OBJECT.love,
	},
	friendship: {
		text: 'Дружба… Это тихая сила. Не громкая. Но настоящая.',
		emotion: 'warm',
		about: BERX_INTENT_OBJECT.friendship,
	},
	creation: {
		text: 'Творчество… Ты будешь создавать миры. Я это чувствую.',
		emotion: 'warm',
		about: BERX_INTENT_OBJECT.creation,
	},
	search: {
		text: 'Поиск… Значит, ты ещё не знаешь. Это честнее всего остального.',
		emotion: 'tender',
		about: BERX_INTENT_OBJECT.search,
	},
});

/** The name. Asked, heard back, and said once more with what it now means. */
export const BERX_VOICE_NAME_ASK: BerxVoiceUtterance = Object.freeze({
	text: 'Как тебя зовут?',
	emotion: 'holding',
});

const INTENT_WORD: Readonly<Record<BerxIntent, string>> = Object.freeze({
	love: 'любовь',
	friendship: 'дружбу',
	creation: 'творчество',
	search: 'ответ',
});

/**
 * The name, said back.
 *
 * No gender agreement anywhere — see this file's header. `Ты ищешь…`
 * carries the same meaning as the brief's `которая ищет` and asks
 * nothing about the person.
 */
export function berxVoiceNameHeard(name: string, intent: BerxIntent): readonly BerxVoiceUtterance[] {
	const clean = name.trim();
	return Object.freeze([
		{text: `${clean}. Красивое имя.`, emotion: 'warm' as const},
		{text: `${clean}. Ты ищешь ${INTENT_WORD[intent]}.`, emotion: 'calm' as const},
		{text: `${clean}. И ты не боишься.`, emotion: 'certain' as const},
	]);
}

/** Arrival. One line, and the only one in the whole script that is a statement of fact. */
export function berxVoiceWelcome(name: string): BerxVoiceUtterance {
	return {text: `Добро пожаловать домой, ${name.trim()}.`, emotion: 'certain'};
}

/**
 * When the room could not hear.
 *
 * Not an error and not a retry loop: it is said once, and then the
 * person is offered the other way through. A voice that keeps asking
 * someone to repeat themselves is a voice that has stopped listening.
 */
export const BERX_VOICE_NOT_HEARD: readonly BerxVoiceUtterance[] = Object.freeze([
	{text: 'Я тебя не слышу. Ничего страшного.', emotion: 'tender'},
	{text: 'Можешь просто выбрать — рукой. Я никуда не денусь.', emotion: 'calm'},
]);

/**
 * When there is no voice at all — no synthesiser, no microphone, or a
 * person who asked for silence.
 *
 * The same words, as text in the world. Not a downgrade: the whole
 * script is legible without a single sound, which is what makes it
 * usable by someone who cannot hear it and by someone on a train.
 */
export const BERX_VOICE_SILENT_PATH: readonly BerxVoiceUtterance[] = Object.freeze([
	{text: 'Здесь можно и молча.', emotion: 'calm'},
	{text: 'Подойди к той стороне, что ближе.', emotion: 'calm'},
]);

/** Everything the script can say, for translators and for the gate. */
export const BERX_VOICE_ALL_LINES: readonly BerxVoiceUtterance[] = Object.freeze([
	...BERX_VOICE_WAKING,
	...BERX_VOICE_IDENTITY,
	...BERX_VOICE_OFFER,
	...Object.values(BERX_VOICE_CHOSEN),
	BERX_VOICE_NAME_ASK,
	...berxVoiceNameHeard('Имя', 'love'),
	berxVoiceWelcome('Имя'),
	...BERX_VOICE_NOT_HEARD,
	...BERX_VOICE_SILENT_PATH,
]);
