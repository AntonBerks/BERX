/**
 * WHAT BERX SAYS, AND WHEN IT SAYS NOTHING.
 *
 * The second half of that sentence is the harder one and it is most of
 * this file. An assistant that narrates the screen is an assistant
 * people turn off: if someone can see "19:30, 2.4 km", reading it to
 * them is not service, it is noise standing between them and the thing
 * they asked for. Voice earns its place by adding what is NOT on screen
 * — or by staying quiet and letting the world answer.
 *
 * THE REGISTER. Short, level, certain. "Понял." "Сейчас посмотрю." "Вот
 * что нашёл." "Не нашёл. Попробуем иначе?" Never "Конечно! С
 * удовольствием помогу вам с этим!" — which is a machine performing
 * helpfulness rather than being helpful, and which every extra word
 * makes worse. The test for a line is whether a competent person who
 * respected your time would say it.
 *
 * NOTHING HERE INVENTS FACTS. Every line is built from what the plan and
 * the world actually contain. A count comes from a real result set; an
 * absence is reported as an absence. There is no phrasing in this file
 * that can describe something that did not happen — which is the same
 * rule the action graph enforces, said in words.
 */
import type {BerxVoiceIntent} from './berxIntent';
import type {BerxOutcome, BerxPlan} from './berxActionGraph';
import {berxChangesTheWorld} from './berxActionGraph';
import type {BerxSituation} from './berxWorldState';

export interface BerxUtterancePlan {
	/** What to say. Empty string means say nothing, deliberately. */
	text: string;
	/**
	 * Why this was or was not said, for a gate and for a log.
	 *
	 * Kept because "silence" is a decision that has to be defensible: a
	 * reader six months from now needs to be able to tell a considered
	 * quiet from a bug that swallowed the line.
	 */
	because: string;
}

const SILENT = (because: string): BerxUtterancePlan => ({text: '', because});

/**
 * What to say when a person has asked for something.
 *
 * Called BEFORE the work, so the line covers the wait rather than
 * following it. A person who has asked a question and heard nothing for
 * two seconds assumes they were not heard.
 */
export function berxAcknowledge(plan: BerxPlan): BerxUtterancePlan {
	if (plan.blocked.length > 0) {
		/* The specific obstacle, not an apology. "Не понял" tells someone
		   to try again; "не знаю, где ты" tells them what to fix. */
		return {text: `${plan.blocked[0][0].toUpperCase()}${plan.blocked[0].slice(1)}.`, because: 'the plan cannot run and the person needs to know which part'};
	}
	const first = plan.steps[0];
	if (!first) return SILENT('there is nothing to do');
	/* A camera move is its own acknowledgement: the world visibly starts
	   moving, and saying "иду туда" over it is narration. */
	if (first.effect === 'move') return SILENT('the world is about to move, which the person can see');
	return {text: first.says, because: 'work is starting that takes long enough to be worth covering'};
}

/**
 * What to say once the work is done — usually less than expected.
 *
 * The count is the one fact worth speaking, because it is the one thing
 * a person cannot get at a glance from a world they have not looked at
 * yet. Everything else is on screen.
 */
export function berxReport(
	intent: BerxVoiceIntent,
	outcome: BerxOutcome,
	found: number,
): BerxUtterancePlan {
	if (outcome.awaiting) {
		return {text: 'Нужно подтвердить.', because: 'a person must agree some way other than out loud'};
	}
	if (!outcome.ok) {
		const stopped = outcome.stoppedAt;
		/* Where it stopped, in one clause. A person who knows the search
		   failed can ask differently; one who hears "что-то пошло не так"
		   can only shrug. */
		const why = stopped?.reason ? ` ${stopped.reason}` : '';
		return {text: `Не получилось.${why}`, because: 'a step did not finish, and saying otherwise would be a lie the person would catch'};
	}
	if (!berxChangesTheWorld(intent.kind)) {
		return SILENT('the camera moved and the person watched it happen');
	}
	if (found === 0) {
		/* An empty answer, offered as a next move rather than a dead end.
		   No invented results, ever: nothing is worse than a world that
		   fills up when it has nothing to show. */
		return {text: 'Ничего не нашёл. Попробуем иначе?', because: 'an empty result is a real answer and inventing one would be worse than silence'};
	}
	if (found === 1) {
		return {text: 'Одно место.', because: 'the count is the one thing not visible at a glance'};
	}
	/* No list read out. The world has just filled with them. */
	return {text: `${found}. Вот что происходит.`, because: 'the count, and then the world speaks for itself'};
}

/**
 * Whether to speak the detail of one entity.
 *
 * The answer is almost always no, and the exception is the useful part:
 * speak about what the person can NOT see — something behind them,
 * something too far to read, something the screen has no room for. If it
 * is in front of them, the screen has already said it better.
 */
export function berxShouldDescribe(entity: {id: string; distanceM: number}, state: BerxSituation): boolean {
	if (state.focusId === entity.id) return false;
	/* Beyond this a label is unreadable, so the voice is adding rather
	   than repeating. */
	return entity.distanceM > 12;
}

/**
 * The line for a reference nobody could resolve.
 *
 * A question, not an error. "Какое именно?" is what a person who was
 * listening would say, and it costs one exchange; a wrong guess costs
 * the trust that the thing was listening at all.
 */
export function berxAskWhich(count: number): BerxUtterancePlan {
	if (count === 0) return {text: 'Не вижу, о чём речь.', because: 'nothing is in view to refer to'};
	return {text: 'Какое именно?', because: 'the reference is real but ambiguous, and asking costs one exchange where guessing costs trust'};
}


/**
 * What each kind of request is called, when it has to be offered as a
 * choice.
 *
 * Nouns, not sentences. "Места или события?" is a question a person
 * answers in one word; "Вы имели в виду поиск мест или поиск событий?"
 * is an interface reading its own menu aloud.
 */
const CHOICE: Readonly<Record<string, string>> = Object.freeze({
	'now-nearby': 'что рядом',
	'find-places': 'места',
	'find-events': 'события',
	'find-people': 'люди',
	discover: 'что-нибудь интересное',
});

/**
 * Ask between two readings, when the sentence really fits both.
 *
 * The rule this enforces is the one that matters: ASKING COSTS ONE
 * EXCHANGE, GUESSING WRONG COSTS TRUST IN EVERY ANSWER AFTER IT. A
 * system that is confidently wrong is worse than one that checks, and it
 * is worse in a way people do not forgive — they stop believing the
 * answers that were right.
 *
 * Two options at most, and never three: a spoken list of three is a menu,
 * and a menu is the thing this product does not have.
 */
export function berxAskBetween(readings: readonly {kind: string}[]): BerxUtterancePlan | undefined {
	const named = readings.map((r) => CHOICE[r.kind]).filter(Boolean);
	if (named.length < 2) return undefined;
	return {
		text: `${named[0][0].toUpperCase()}${named[0].slice(1)} или ${named[1]}?`,
		because: 'the sentence fits both readings, and asking costs one exchange where guessing wrong costs trust in every answer after it',
	};
}

/**
 * What to say when something cannot be done — WITH the way that can.
 *
 * A refusal that ends the conversation is a dead end, and a dead end is
 * where a person stops using a voice interface. "Не могу удалить" is a
 * fact; "не могу удалить — скрыть?" is the same fact and a way forward,
 * and it costs one clause.
 *
 * `instead` must be something the product can really do. An offer that
 * cannot be taken is worse than no offer: the person says yes and
 * nothing happens.
 */
export function berxRefuseWithWay(reason: string, instead?: string): BerxUtterancePlan {
	const head = `${reason[0].toUpperCase()}${reason.slice(1)}`;
	return instead
		? {text: `${head}. ${instead}?`, because: 'a refusal that ends the conversation is where a person stops using a voice interface'}
		: {text: `${head}.`, because: 'the reason, and nothing invented on top of it'};
}
