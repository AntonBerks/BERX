/**
 * WHAT A SENTENCE IS ABOUT, before anything decides what to do with it.
 *
 * The intent layer began as phrase lists — "что рядом", "мне скучно",
 * "покажи интересное" — matched first-wins. That works exactly as far
 * as the list goes and not one word further, which is the difference
 * between a set of commands and a conversation. Measured against
 * sixteen sentences a person would really say: ten resolved, six did
 * not, and the six failed for reasons no longer list could fix.
 *
 *   "куда все идут?"          nothing in it is an event word
 *   "что делать вечером?"     the subject is carried by the TIME
 *   "что это?"                the subject is carried by the POINTING
 *
 * None of those is a missing phrase. Each is a sentence whose meaning
 * comes from how its parts combine, so this file takes them apart
 * instead of looking them up: what is being asked ABOUT, WHEN, and what
 * is being asked FOR. A sentence with no words from any list can still
 * be understood, which is the whole point.
 *
 * DETERMINISTIC, and it has to be. Every gate in this repository
 * predicts what a sentence resolves to; a model that scored differently
 * on a Tuesday would make all of them meaningless. What is here is
 * morphology and combination, not learning.
 */

/** What the sentence is about. */
export type BerxUtteranceSubject = 'people' | 'places' | 'events' | 'content';

/**
 * When it is about.
 *
 * `now` and `today` are different questions: "что происходит" asks what
 * is live this minute, "что сегодня" asks what the day holds. Collapsing
 * them would make an evening plan and a live event the same request.
 */
export type BerxUtteranceTime = 'now' | 'today' | 'tonight' | 'tomorrow' | 'past';

/** What is being asked for. */
export type BerxUtteranceAct =
	/** Put it in front of me. */
	| 'show'
	/** Look for it. */
	| 'find'
	/** Take me there. */
	| 'go'
	/** Take it away. */
	| 'remove'
	/** Back where I was. */
	| 'back'
	/** What IS this — a question about a thing, not a request for things. */
	| 'identify'
	/** Not that; something else. */
	| 'refine';

export interface BerxUtteranceFeatures {
	subject?: BerxUtteranceSubject;
	time?: BerxUtteranceTime;
	act?: BerxUtteranceAct;
	/** The sentence points at something rather than naming it. */
	pointing: boolean;
	/** A state rather than a request: bored, restless, at a loose end. */
	restless: boolean;
	/** "открыто", "где жизнь" — a filter on places, not a subject. */
	openNow: boolean;
	/** Every feature that fired, for the gate's report and for a log. */
	matched: string[];
}

/**
 * Stems, not words.
 *
 * Russian inflects everything, and a list of full forms is a list that
 * is wrong for the next case ending. "событи" covers событие, события,
 * событий, событиям; "ресторан" covers all six cases plus the plural.
 * The cost is that a stem can appear inside an unrelated word, which is
 * why the ordering below resolves conflicts rather than the matching.
 */
const SUBJECT: Readonly<Record<BerxUtteranceSubject, readonly string[]>> = Object.freeze({
	people: [
		'люд', 'человек', 'познаком', 'друз', 'подруг', 'знаком', 'поболта', 'пообща',
		/* Russian pronouns decline in ways no stem covers: кто, кого,
		   кому, кем, ком. Listed rather than stemmed, because "к" is not
		   a stem and "ко" appears in half the language. */
		'кто', 'кого', 'кому', 'кем', 'о ком',
		'people', 'someone', 'who', 'meet', 'talk to',
	],
	places: [
		'мест', 'заведени', 'ресторан', 'бар', 'кафе', 'кофейн', 'поесть', 'поужина',
		'выпить', 'перекус', 'ужин', 'обед', 'завтрак',
		'place', 'restaurant', 'bar', 'cafe', 'eat', 'dinner', 'lunch', 'coffee',
	],
	events: [
		'событи', 'мероприяти', 'концерт', 'выставк', 'вечеринк', 'лекци', 'спектакл',
		'начина', 'идут', 'идти', 'происходит', 'афиш',
		'event', 'concert', 'gig', 'show', 'party', 'happening',
	],
	content: ['пост', 'запис', 'фото', 'момент', 'лент', 'post', 'photo', 'feed'],
});

const TIME: Readonly<Record<BerxUtteranceTime, readonly string[]>> = Object.freeze({
	now: ['сейчас', 'прямо сейчас', 'в данный момент', 'now', 'right now'],
	today: ['сегодня', 'today'],
	tonight: ['вечер', 'вечером', 'вечерам', 'ночью', 'tonight', 'this evening'],
	tomorrow: ['завтра', 'на выходных', 'tomorrow', 'this weekend'],
	past: ['вчера', 'на прошлой', 'раньше', 'yesterday', 'last '],
});

const ACT: Readonly<Record<BerxUtteranceAct, readonly string[]>> = Object.freeze({
	show: ['покажи', 'показать', 'что тут', 'что здесь', 'что вокруг', 'что рядом', 'show', 'what is'],
	find: ['найди', 'найти', 'ищи', 'поищи', 'куда', 'где', 'find', 'look for', 'where'],
	go: ['открой', 'зайди', 'перейди', 'веди', 'пойдём', 'open', 'go', 'take me'],
	remove: ['убери', 'убрать', 'скрой', 'спрячь', 'не хочу', 'remove', 'hide'],
	back: ['назад', 'обратно', 'верни', 'back'],
	identify: ['что это', 'кто это', 'что за', 'кто такой', 'расскажи про', 'what is this', 'who is this'],
	refine: ['не так', 'слишком', 'другое', 'другие', 'ещё вариант', 'something else', 'too '],
});

const POINTING = ['это', 'этот', 'эта', 'эти', 'тот', 'та', 'те', 'здесь', 'тут', 'там', 'туда', 'сюда',
	'this', 'that', 'these', 'here', 'there'];

const RESTLESS = ['скучно', 'нечего делать', 'хочу куда-нибудь', 'хочу выбраться', 'чем заняться',
	'bored', 'nothing to do'];

const OPEN_NOW = ['открыт', 'работа', 'где жизнь', 'где люди', 'оживл', 'open now', 'lively'];

const stem = (text: string, list: readonly string[]): string | undefined =>
	list.find((w) => text.includes(w));

/** Whole words, padded so they match at both ends of a sentence. */
const word = (text: string, list: readonly string[]): string | undefined => {
	const padded = ` ${text.replace(/[.,!?;:]/g, ' ')} `;
	return list.find((w) => padded.includes(` ${w} `));
};

/**
 * Take a sentence apart.
 *
 * Order matters in exactly two places and both are conflicts between
 * stems that legitimately overlap:
 *
 * `identify` is checked before every other act, because "что это" also
 * contains "что" and would otherwise read as a request for things
 * rather than a question about one.
 *
 * `events` is checked before `people`, because "кто" is a people stem
 * and "куда все идут" is about events — the people in it are the
 * evidence, not the subject.
 */
export function berxUtteranceFeatures(utterance: string): BerxUtteranceFeatures {
	const text = utterance.trim().toLowerCase();
	const matched: string[] = [];
	const take = <T extends string>(kind: T, hit: string | undefined): T | undefined => {
		if (hit === undefined) return undefined;
		matched.push(`${kind}:${hit}`);
		return kind;
	};

	/* the act, with identify first */
	let act: BerxUtteranceAct | undefined;
	const identify = stem(text, ACT.identify);
	if (identify) act = take('identify', identify);
	else {
		for (const kind of ['remove', 'back', 'refine', 'go', 'show', 'find'] as const) {
			const hit = kind === 'back' || kind === 'go' ? word(text, ACT[kind]) : stem(text, ACT[kind]);
			if (hit) { act = take(kind, hit); break; }
		}
	}

	/* the subject, events before people */
	let subject: BerxUtteranceSubject | undefined;
	for (const kind of ['events', 'places', 'content', 'people'] as const) {
		const hit = stem(text, SUBJECT[kind]);
		if (hit) { subject = take(kind, hit); break; }
	}

	/**
	 * Time by WHOLE WORD, not by stem.
	 *
	 * "Завтрак" contains "завтра", so "где тут завтракают?" read as a
	 * question about tomorrow — breakfast became a day. Every other
	 * feature here can be stemmed safely because its words are long and
	 * distinctive; the time words are short, common, and sit inside
	 * unrelated ones, so they are matched as words.
	 */
	let time: BerxUtteranceTime | undefined;
	for (const kind of ['now', 'tonight', 'tomorrow', 'past', 'today'] as const) {
		const hit = word(text, TIME[kind]) ?? TIME[kind].find((w) => w.endsWith(' ') && text.includes(w));
		if (hit) { time = take(kind, hit); break; }
	}

	const pointingWord = word(text, POINTING);
	if (pointingWord) matched.push(`pointing:${pointingWord}`);
	const restlessWord = stem(text, RESTLESS);
	if (restlessWord) matched.push(`restless:${restlessWord}`);
	const openWord = stem(text, OPEN_NOW);
	if (openWord) matched.push(`open-now:${openWord}`);

	return {
		subject, time, act,
		pointing: pointingWord !== undefined,
		restless: restlessWord !== undefined,
		openNow: openWord !== undefined,
		matched,
	};
}

/**
 * How sure the features make us, 0..1.
 *
 * Two independent signals agreeing is worth much more than one: a
 * sentence with a subject AND a time is almost certainly about that
 * subject at that time, while a bare subject could be anything. This is
 * what the clarification layer reads to decide whether to ask.
 */
export function berxFeatureConfidence(f: BerxUtteranceFeatures): number {
	const signals = [f.subject, f.time, f.act].filter(Boolean).length
		+ (f.pointing ? 1 : 0) + (f.restless ? 1 : 0);
	if (signals === 0) return 0;
	if (signals === 1) return 0.5;
	if (signals === 2) return 0.75;
	return 0.9;
}
