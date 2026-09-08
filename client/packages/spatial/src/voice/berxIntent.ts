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
		return {
			kind,
			objectId,
			query: kind === 'find-places' || kind === 'find-events' || kind === 'find-people' ? text : undefined,
			openNow: Boolean(openNowWord) || undefined,
			needs,
			confidence,
			matched,
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
	if (referenced && objectId && text.split(/\s+/).length <= 4) {
		return {kind: 'open', objectId, needs, confidence: 0.7, matched};
	}

	const now = has(text, NOW_WORDS);
	if (now) return decide('now-nearby', now, 0.9);

	const restless = has(text, RESTLESS_WORDS);
	if (restless) {
		/* A state, answered the way a friend would: what is happening near
		   you. Lower confidence than a direct question, because it is a
		   reading of intent rather than a reading of words — and the
		   confidence is what lets the voice offer rather than assert. */
		return decide('now-nearby', restless, 0.6);
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
	if (discover) return decide('discover', discover, 0.6);

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
