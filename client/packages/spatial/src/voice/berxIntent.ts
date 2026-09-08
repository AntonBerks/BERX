/**
 * BERX VOICE INTENT — what a person meant, as something the product can
 * do.
 *
 * NAMED `BerxVoiceIntent` because `BerxIntent` is already taken, by
 * berxPhrases.ts, for the four things someone can be looking for when
 * they arrive: love, friendship, creation, search. That is a different
 * idea entirely and the clash is worth avoiding by name rather than by
 * prefix.
 *
 * "Мне скучно" is not a command and there is no screen called Boredom.
 * It is a person expressing a state, and the useful response is the same
 * one a friend would give: show them what is happening near them right
 * now. That translation — from how people actually talk to a capability
 * that exists — is this file, and it is the difference between a voice
 * interface and a spoken menu.
 *
 * WHAT THIS IS NOT. It is not a language model and it does not try to be
 * one. It is a deterministic reading of a declared vocabulary onto a
 * declared set of capabilities, which buys three things a model cannot:
 * the same sentence gives the same intent on every device and every run,
 * a gate can enumerate what is understood, and an utterance that is NOT
 * understood comes back as `unknown` rather than as a confident wrong
 * answer. Where a model belongs — paraphrase, long tail, other languages
 * — it belongs BEHIND this interface, proposing a BerxVoiceIntent that then
 * goes through the same validation as everything else. The type is the
 * seam.
 *
 * EVERY CAPABILITY NAMES A REAL CALL. `BerxVoiceIntentKind` is not a wish
 * list: each one maps to a method that exists on the API client, and the
 * gate checks that mapping against the client itself. An intent nothing
 * can execute is not an intent, it is a promise — and a promise the
 * product cannot keep is worse than a shrug.
 *
 * REFERENCES ARE RESOLVED, NEVER GUESSED. "Здесь", "этот", "второй" are
 * pointers into the world state and the spatial memory. When they point
 * at nothing, the intent carries `needs` rather than a best guess: the
 * right response to an unresolvable reference is a short question, which
 * reads as attention, where a wrong guess reads as a machine pretending
 * and costs far more.
 */
import type {BerxSituation} from './berxWorldState';
import {berxUtteranceFeatures, berxFeatureConfidence, berxUtteranceAlternatives, type BerxUtteranceFeatures} from './berxUtterance';
import {berxHere, berxNth} from './berxWorldState';
import type {BerxSpatialMemory} from './berxSpatialMemory';
import {berxNthShown} from './berxSpatialMemory';

/**
 * What BERX can be asked to do.
 *
 * Small on purpose. Each of these is a real capability with a real call
 * behind it; the richness of the interface comes from the WORLD, not
 * from the number of verbs.
 */
export type BerxVoiceIntentKind =
	/** What is happening near me, right now. The heart of BERX NOW. */
	| 'now-nearby'
	/** Somewhere to go. Places, optionally filtered by what was said. */
	| 'find-places'
	/** Something to go to. Events, optionally filtered. */
	| 'find-events'
	/** Someone to meet. People. */
	| 'find-people'
	/** Show me something I would not have asked for. */
	| 'discover'
	/** Go to the thing being referred to. */
	| 'open'
	/** Take this one away. */
	| 'dismiss'
	/** Not that — the same question, different constraints. */
	| 'refine'
	/** Back to where I was. */
	| 'back'
	/** Nothing was understood. An honest outcome, not a failure state. */
	| 'unknown';

/** What an intent could not work out for itself. */
export type BerxVoiceIntentGap =
	/** A word like "здесь" that points at nothing in view. */
	| 'referent'
	/** Needs to know where the person is, and does not. */
	| 'location'
	/** Needs a microphone or notification permission that is not granted. */
	| 'permission';

export interface BerxVoiceIntent {
	kind: BerxVoiceIntentKind;
	/** The entity this is about, once resolved. */
	objectId?: string;
	/**
	 * What was said that narrows it: "поужинать", "тихое", "рядом".
	 * Passed to the API as a query, never interpreted further here.
	 */
	query?: string;
	/** True when the person asked for something OPEN or LIVE now. */
	openNow?: boolean;
	/** What stopped this being executable. Empty means it is. */
	needs: readonly BerxVoiceIntentGap[];
	/**
	 * Other readings this sentence also fits, when it genuinely fits more
	 * than one.
	 *
	 * Empty when the reading is clear, which is most of the time. Present
	 * only when two parts of the sentence point different ways — a place
	 * word and a named day, say — so the voice can ask rather than commit.
	 */
	alternatives?: readonly string[];
	/**
	 * 0..1, and it means "how sure am I this is what they asked for" —
	 * not how sure the speech recogniser was. The two multiply
	 * downstream.
	 */
	confidence: number;
	/** The words this reading came from, so a gate can show its work. */
	matched: readonly string[];
}

const UNKNOWN: BerxVoiceIntent = Object.freeze({kind: 'unknown', needs: [], confidence: 0, matched: []});

/**
 * Vocabulary, in Russian and English.
 *
 * Written out rather than stemmed: an explicit list is a list a gate can
 * read back and a person can extend, and Russian morphology defeats
 * naive stemming in exactly the cases that matter ("сходить"/"схожу",
 * "поужинать"/"ужин"). Where a model belongs is above this, not instead
 * of it.
 */
const NOW_WORDS = [
	'что происходит', 'что сейчас', 'что рядом', 'что вокруг', 'кто рядом',
	'что тут происходит', 'что здесь происходит', "what's happening", 'what is happening',
	'around me', 'near me', 'right now',
];
/* A state, not a request — and the useful answer to it is the same. */
const RESTLESS_WORDS = [
	'скучно', 'мне скучно', 'нечего делать', 'хочу куда-нибудь', 'хочу выбраться',
	'куда бы сходить', 'куда пойти', 'чем заняться',
	'bored', 'nothing to do', 'somewhere to go',
];
const PLACE_WORDS = ['мест', 'место', 'заведени', 'ресторан', 'бар', 'кафе', 'поужинать', 'поесть', 'выпить', 'place', 'restaurant', 'bar', 'cafe', 'eat', 'dinner'];
const EVENT_WORDS = ['событи', 'мероприяти', 'концерт', 'выставк', 'что начинается', 'event', 'concert', 'gig'];
const PEOPLE_WORDS = ['люд', 'познакомит', 'кто-нибудь', 'кого-нибудь', 'people', 'meet someone'];
const DISCOVER_WORDS = ['неожиданн', 'интересн', 'удиви', 'что-нибудь', 'surprise', 'something interesting', 'anything'];
const OPEN_WORDS = ['открой', 'покажи это', 'зайди', 'перейди', 'open', 'go there', 'take me'];
const DISMISS_WORDS = ['убери', 'не это', 'не хочу это', 'скрой', 'remove', 'hide', 'not this'];
const REFINE_WORDS = ['нет,', 'не так', 'слишком', 'другое', 'что-нибудь ещё', 'ещё вариант', 'no,', 'too ', 'something else'];
const BACK_WORDS = ['назад', 'обратно', 'верни', 'back', 'go back'];
const OPEN_NOW_WORDS = ['открыт', 'сейчас работа', 'где жизнь', 'где люди', 'open now', 'still open', 'lively'];

/**
 * "здесь", "тут", "это", "этот" — a pointer at whatever is in focus.
 *
 * WHOLE WORDS, matched as such. The first version wrote "это " with a
 * trailing space to stop it matching inside "этот", and the space made
 * it fail at the END of a sentence: "убери это" contains no "это " and
 * the reference silently vanished, so a dismissal executed against
 * nothing. Found by driving a real conversation through the loop rather
 * than by reading the list.
 */
const HERE_WORDS = ['здесь', 'тут', 'это', 'этот', 'эта', 'сюда', 'here', 'this one', 'this place'];
/** "туда", "там" — a pointer at whatever was just selected or opened. */
const THERE_WORDS = ['туда', 'там', 'there'];

/** Ordinals a person actually says. Index is one-based. */
const ORDINALS: Record<string, number> = {
	'первый': 1, 'первое': 1, 'первая': 1, 'first': 1,
	'второй': 2, 'второе': 2, 'вторая': 2, 'second': 2,
	'третий': 3, 'третье': 3, 'третья': 3, 'third': 3,
	'четвёртый': 4, 'четвертый': 4, 'fourth': 4,
	'пятый': 5, 'fifth': 5,
};

const has = (text: string, words: readonly string[]): string | undefined =>
	words.find((w) => text.includes(w));

/**
 * The same, for entries that are whole words rather than stems.
 *
 * Padding both sides is what makes a word match at the start and the end
 * of a sentence as well as the middle — and \b cannot be used here,
 * because JavaScript's word boundary is defined over [A-Za-z0-9_] and
 * treats every Cyrillic letter as a boundary, which would match "это"
 * inside "этот" and defeat the point.
 */
const hasWord = (text: string, words: readonly string[]): string | undefined => {
	const padded = ` ${text.replace(/[.,!?;:]/g, ' ')} `;
	return words.find((w) => padded.includes(` ${w} `));
};

/**
 * Read one utterance, against the world it was said in.
 *
 * The world state and the memory are not optional extras — they are how
 * half of these sentences mean anything at all. "А что здесь сегодня?"
 * is a complete, unambiguous question when you know what the person is
 * looking at, and gibberish when you do not.
 */
export function berxReadIntent(
	utterance: string,
	state: BerxSituation,
	memory: BerxSpatialMemory,
): BerxVoiceIntent {
	const text = utterance.trim().toLowerCase();
	if (text === '') return UNKNOWN;

	const matched: string[] = [];
	const needs: BerxVoiceIntentGap[] = [];

	/* ---- the reference, if there is one ---- */
	let objectId: string | undefined;
	let referenced = false;

	const ordinalWord = Object.keys(ORDINALS).find((w) => text.includes(w));
	if (ordinalWord) {
		referenced = true;
		matched.push(ordinalWord);
		/* What was SHOWN, in the order it was shown — the order the person
		   is counting in. Falling back to what is merely visible would
		   count things they were never offered. */
		const nth = berxNthShown(memory, ORDINALS[ordinalWord]) ?? berxNth(state, ORDINALS[ordinalWord]);
		objectId = nth?.id;
	}

	const hereWord = !objectId ? hasWord(text, HERE_WORDS) : undefined;
	if (hereWord) {
		referenced = true;
		matched.push(hereWord);
		objectId = berxHere(state)?.id;
	}

	const thereWord = !objectId ? hasWord(text, THERE_WORDS) : undefined;
	if (thereWord) {
		referenced = true;
		matched.push(thereWord);
		objectId = memory.selected ?? state.focusId;
	}

	if (referenced && !objectId) needs.push('referent');

	/* ---- the verb ---- */
	const openNowWord = has(text, OPEN_NOW_WORDS);
	if (openNowWord) matched.push(openNowWord);

	const decide = (kind: BerxVoiceIntentKind, word: string, confidence: number): BerxVoiceIntent => {
		matched.push(word);
		/* Anything that answers "рядом" needs to know where you are, and
		   an intent that cannot be executed says so here rather than
		   failing later with a shrug. */
		if ((kind === 'now-nearby' || (kind === 'find-places' && Boolean(openNowWord)))) {
			if (!state.allowed.location) needs.push('permission');
			else if (!state.location) needs.push('location');
		}
		/**
		 * DOES THE SENTENCE ALSO SAY SOMETHING ELSE?
		 *
		 * Computed here rather than in the decomposition arm below,
		 * because that arm is the LAST resort and most sentences never
		 * reach it — they are answered by a phrase list, and a list
		 * matches one word and stops. "Куда завтра сходить поесть?" is
		 * answered as a request for places on the word "поесть" and never
		 * notices the "завтра", which is a second, equally real reading.
		 *
		 * Only genuine competition counts: a reading that came from a
		 * DIFFERENT part of the sentence than the one chosen. Two signals
		 * agreeing is agreement, and offering someone a choice they did
		 * not pose would be the interface performing uncertainty it does
		 * not have.
		 *
		 * Never on an action. "Убери это" with a time in it is still a
		 * dismissal; asking "убрать или показать события?" would be
		 * absurd, and the sentences that are genuinely two-way are always
		 * requests for things.
		 */
		const askable = kind === 'find-places' || kind === 'find-events'
			|| kind === 'find-people' || kind === 'discover' || kind === 'now-nearby';
		/**
		 * ONLY A NAMED HOUR COMPETES.
		 *
		 * The comment above says an alternative must come from a DIFFERENT
		 * part of the sentence than the one chosen, and the first version
		 * of this did not check that — it offered any reading of a
		 * different kind. So "что происходит рядом?" asked "что рядом или
		 * события?", because "происходит" chose the live reading AND
		 * counted as an event word: the very signal that decided the
		 * answer was also counted as competition against it. Nine gates
		 * caught it.
		 *
		 * A time word is the one signal that is reliably a different part
		 * of the sentence from whatever named the subject, which makes it
		 * the only honest source of a second reading here. "Куда завтра
		 * сходить поесть?" is the case this exists for: answered on
		 * "поесть", and the "завтра" is a real, separate question.
		 */
		const also = askable
			? berxUtteranceAlternatives(berxUtteranceFeatures(text))
				.filter((r) => r.from === 'time' && r.kind !== kind)
				.map((r) => r.kind)
			: [];
		return {
			kind,
			objectId,
			query: kind === 'find-places' || kind === 'find-events' || kind === 'find-people' ? text : undefined,
			openNow: Boolean(openNowWord) || undefined,
			needs,
			confidence,
			matched,
			...(also.length > 0 ? {alternatives: also} : {}),
		};
	};

	const dismiss = has(text, DISMISS_WORDS);
	if (dismiss) return decide('dismiss', dismiss, objectId ? 0.9 : 0.5);

	const back = has(text, BACK_WORDS);
	if (back) return decide('back', back, 0.85);

	const open = has(text, OPEN_WORDS);
	if (open) return decide('open', open, objectId ? 0.9 : 0.5);

	/* A bare reference with no verb IS an intent: someone who says "а
	   второй?" while looking at three places is asking to see the second
	   one, and asking them to say "открой" would be the interface making
	   them speak its language. */
	/**
	 * ASKED BEFORE the bare-reference path, and the order is the fix.
	 *
	 * "Что тут происходит?" is three words and contains "тут", so the
	 * reference path below read it as pointing at whatever was in focus
	 * and answered by opening that thing. But "тут" there is LOCATIVE —
	 * it means "around here", not "this one" — and the sentence says so
	 * explicitly by asking what is happening. An explicit question about
	 * what is going on is never a pointing gesture, whatever else is in
	 * it, so it is answered first.
	 */
	const now = has(text, NOW_WORDS);
	if (now) return decide('now-nearby', now, 0.9);

	/**
	 * Pointing, with nothing else in the sentence.
	 *
	 * "А второй?" while looking at three places is asking to see the
	 * second one, and making a person say "открой" would be the interface
	 * making them speak its language.
	 *
	 * But a sentence that ASKS FOR a named kind of thing is not merely
	 * pointing. "Где тут завтракают?" contains "тут" and is three words
	 * long, and it is a request for places — the "тут" narrows it to
	 * here rather than pointing at the thing in focus.
	 *
	 * The exception is a QUESTION about the thing. "Кто это?" has the
	 * subject `people`, because "кто" is a people word — and it is not a
	 * request for people, it is a question about what is being pointed
	 * at. So a named subject blocks the pointing path unless the sentence
	 * is asking what something IS.
	 *
	 * Requiring an act of show or find instead was too narrow: "есть тут
	 * кофейни?" names its subject and has no verb this file recognises,
	 * and it is plainly a request for places.
	 */
	const pointingFeatures = berxUtteranceFeatures(text);
	if (referenced && objectId && text.split(/\s+/).length <= 4
		&& !(pointingFeatures.subject !== undefined && pointingFeatures.act !== 'identify')) {
		return {kind: 'open', objectId, needs, confidence: 0.7, matched};
	}

	const restless = has(text, RESTLESS_WORDS);
	if (restless) {
		/**
		 * A state, not a request, and the answer is what is worth seeing.
		 *
		 * This answered with what is NEARBY, on the reasoning that it is
		 * what a friend would say. The reasoning is decent and the product
		 * decision went the other way: someone at a loose end is asking to
		 * be shown something good, not something close, and the two are
		 * different answers in a city. Nearby stays the answer to "что
		 * рядом", which is the question that actually asks it.
		 *
		 * Confidence stays low because this is a reading of intent rather
		 * than of words, and low confidence is what lets the voice offer
		 * rather than assert.
		 *
		 * A NAMED HOUR still outranks it, the same way it outranks a
		 * generic interest word: "куда бы сходить сегодня?" is at a loose
		 * end AND says when, and what is on today is a better answer than
		 * anything worth seeing in general.
		 */
		const restlessWhen = berxUtteranceFeatures(text).time;
		if (restlessWhen === 'today' || restlessWhen === 'tonight' || restlessWhen === 'tomorrow') {
			return decide('find-events', `${restless}+${restlessWhen}`, 0.75);
		}
		return decide('discover', restless, 0.6);
	}

	const refine = has(text, REFINE_WORDS);
	if (refine && memory.shown.length > 0) return decide('refine', refine, 0.75);

	const place = has(text, PLACE_WORDS);
	if (place) return decide('find-places', place, 0.85);

	const event = has(text, EVENT_WORDS);
	if (event) return decide('find-events', event, 0.85);

	const people = has(text, PEOPLE_WORDS);
	if (people) return decide('find-people', people, 0.8);

	const discover = has(text, DISCOVER_WORDS);
	if (discover) {
		/**
		 * A STATED HOUR OUTRANKS "something interesting".
		 *
		 * "Где сегодня будет интересно?" contains an interest word and is
		 * not a request for interesting things — it asks what is ON today,
		 * and the word carrying that is the TIME. A list cannot see this
		 * because it matches one word and stops; reading the sentence can.
		 *
		 * Only for a NAMED day or evening. "Интересно" with "сейчас" stays
		 * discovery: what is interesting right now is a different question
		 * from what is on tonight, and nearby already answers it.
		 */
		const timed = berxUtteranceFeatures(text).time;
		if (timed === 'today' || timed === 'tonight' || timed === 'tomorrow') {
			return decide('find-events', `${discover}+${timed}`, 0.8);
		}
		return decide('discover', discover, 0.6);
	}

	/**
	 * Nothing was understood — but WHY matters, and it was nearly lost
	 * here.
	 *
	 * Someone who says "что здесь сегодня?" while looking at nothing has
	 * been perfectly clear; what they lack is a referent, not a verb.
	 * Returning the bare UNKNOWN constant discarded the gap that had
	 * already been worked out above, and turned "не вижу, о чём речь" —
	 * which is useful, and which invites one more word — into "не понял",
	 * which is a dead end. The gate caught it: a reference to nothing came
	 * back with no needs at all.
	 */
	/**
	 * READ THE SENTENCE FIRST, and only then give up.
	 *
	 * This early return used to come BEFORE the decomposition below, and
	 * it short-circuited it for exactly the sentences the decomposition
	 * exists to catch: "где тут завтракают?" put "тут" into `matched`,
	 * which made `matched.length > 0` true, which returned unknown while
	 * a perfectly readable request for places sat one branch away. It is
	 * the root of a whole class of misses, and it looked like several
	 * different bugs until the returns were listed in order.
	 */
	/**
	 * NOTHING IN ANY LIST MATCHED — so read the sentence instead.
	 *
	 * The lists above are fast and exact and they stop at their own edge,
	 * which is the difference between a set of commands and a
	 * conversation. Measured on sixteen sentences a person would really
	 * say, six fell through to here, and none of them was a missing
	 * phrase: "куда все идут?" has no event word in it, "что делать
	 * вечером?" carries its subject in the TIME, and "что это?" carries
	 * its subject in the POINTING.
	 *
	 * So this takes the sentence apart — what is being asked ABOUT, WHEN,
	 * and what is being asked FOR — and combines the parts. A sentence
	 * with no word from any list can still be understood, and that is the
	 * whole reason this arm exists.
	 *
	 * It runs LAST, deliberately. Every phrase the lists know is answered
	 * exactly as it was before, so this can only add understanding and
	 * never change it.
	 */
	const f = berxUtteranceFeatures(text);
	const fromFeatures = berxIntentFromFeatures(f, objectId !== undefined);
	if (fromFeatures) {
		const read = decide(fromFeatures, f.matched.join(' '), berxFeatureConfidence(f));
		/**
		 * When two parts of the sentence point different ways, say so.
		 *
		 * "Что сегодня в центре?" has a place signal and a day signal and
		 * both are real: it could be asking which places, or what is on.
		 * One has to be chosen, and this records what was nearly chosen
		 * instead so the voice can ask rather than commit.
		 */
		const also = berxUtteranceAlternatives(f).map((r) => r.kind).filter((k) => k !== read.kind);
		return also.length > 0 ? {...read, alternatives: also} : read;
	}

	/**
	 * Nothing was understood — but WHY matters.
	 *
	 * Someone who says "что здесь сегодня?" while looking at nothing has
	 * been perfectly clear; what they lack is a referent, not a verb.
	 * Returning the bare UNKNOWN constant would discard the gap worked
	 * out above and turn "не вижу, о чём речь" — which is useful, and
	 * which invites one more word — into "не понял", which is a dead end.
	 */
	if (needs.length > 0 || matched.length > 0) {
		return {kind: 'unknown', objectId, needs, confidence: 0, matched};
	}

	return UNKNOWN;
}

/**
 * The API capability each intent needs.
 *
 * The names are methods on BerxApiClient, and the gate checks them
 * against the client rather than trusting this table — which is the
 * point of writing it down separately. An intent whose capability has
 * been renamed or removed should break a build, not a conversation.
 *
 * `open`, `dismiss` and `back` are absent because they change where the
 * viewer is standing and nothing on the server: travelling to a place
 * you were already shown is a camera move, and asking a backend for
 * permission to look at something would be theatre.
 */
export const BERX_VOICE_CAPABILITY: Readonly<Partial<Record<BerxVoiceIntentKind, string>>> = Object.freeze({
	'now-nearby': 'nearbyNow',
	'find-places': 'nearbyPlaces',
	'find-events': 'events',
	'find-people': 'searchUsers',
	discover: 'feed',
});

/** True when this intent has everything it needs to be executed. */
export function berxExecutable(intent: BerxVoiceIntent): boolean {
	return intent.kind !== 'unknown' && intent.needs.length === 0;
}


/**
 * What a decomposed sentence asks for.
 *
 * Combination rather than lookup, and every rule here is a rule about
 * MEANING rather than about words:
 *
 * A question ABOUT something, when something is being pointed at, is a
 * request to open it — "что это?" is not a search for things, it is a
 * question about one thing.
 *
 * A time on its own carries a subject. "Что делать вечером?" names no
 * events and is about nothing else: what a person wants at a stated
 * hour is what is ON at that hour.
 *
 * And a subject with no act is still a request. Someone who says
 * "рестораны" has asked for restaurants, and answering "не понял" to
 * that is pedantry rather than caution.
 */
export function berxIntentFromFeatures(
	f: BerxUtteranceFeatures,
	hasReferent: boolean,
): BerxVoiceIntentKind | undefined {
	/* A question about a thing, not a request for things. */
	if (f.act === 'identify') return hasReferent || f.pointing ? 'open' : undefined;
	if (f.act === 'remove') return 'dismiss';
	if (f.act === 'back') return 'back';
	if (f.act === 'refine') return 'refine';
	if (f.act === 'go' && (hasReferent || f.pointing)) return 'open';

	if (f.subject === 'people') return 'find-people';
	if (f.subject === 'places') return 'find-places';
	if (f.subject === 'events') return 'find-events';
	if (f.subject === 'content') return 'discover';

	/* A stated hour is a subject. Tonight, today and tomorrow are all
	   questions about what is ON then; "now" is the live question, which
	   is what nearby answers. */
	if (f.time === 'tonight' || f.time === 'today' || f.time === 'tomorrow') return 'find-events';
	if (f.time === 'now') return 'now-nearby';

	/* At a loose end, with nothing else in the sentence: the answer is
	   something worth seeing, not a list of what is close. */
	if (f.restless) return 'discover';

	/* An act with nothing to act on says only that someone wants to be
	   shown something. */
	if (f.act === 'show' || f.act === 'find') return 'discover';

	return undefined;
}
