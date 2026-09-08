/**
 * BERX ACTION GRAPH — from what someone meant to what actually changed.
 *
 * A voice interface that says "готово" without having checked is worse
 * than one that cannot speak, because it teaches people to distrust
 * everything it says afterwards. So there is no path in this file from
 * an intent to a reported success that does not go through a real
 * answer from a real server.
 *
 *   INTENT -> PLAN -> VALIDATE -> PERMISSIONS -> CALL -> CONFIRM -> WORLD
 *
 * Each step can refuse, and a refusal is a RESULT rather than an
 * exception: the person hears what happened and where it stopped, which
 * is nearly always more useful than an apology.
 *
 * THE RULE THAT MATTERS MOST, stated as code rather than as a
 * convention: `berxOutcome` derives its success from the steps, so a
 * plan with an unfinished step CANNOT report success. It is not that we
 * remember not to; it is that there is no expression for it.
 *
 * WHY A PLAN AT ALL, when most intents are one call. Because some are
 * not — "найди место поужинать, где сейчас есть жизнь" is a search and a
 * filter and a travel — and because a plan is inspectable. A gate can
 * read what BERX was about to do before it does it, a person can be
 * told, and a step that needs confirmation can be found before anything
 * has happened rather than after.
 *
 * VOICE IS NOT AUTHENTICATION. It is a channel, and a channel anyone
 * within earshot can use. Nothing that spends money, sends something in
 * the person's name, changes who can see them, or destroys something can
 * be completed by having been asked for out loud. Those steps carry
 * `confirm` and stop.
 */
import type {BerxVoiceIntent, BerxVoiceIntentKind} from './berxIntent';
import {BERX_VOICE_CAPABILITY} from './berxIntent';
import type {BerxSituation} from './berxWorldState';

/**
 * What a step does to the world, which decides whether it needs asking
 * about.
 *
 * Not a severity ranking — a description of the blast radius. `read`
 * changes nothing. `move` changes only where the viewer is standing, and
 * is instantly undoable by looking somewhere else. `write` changes the
 * server. `sensitive` is the set the directive names: deletion, money,
 * messages sent as you, account changes, privacy, location sharing,
 * purchases.
 */
export type BerxStepEffect = 'read' | 'move' | 'write' | 'sensitive';

export interface BerxPlanStep {
	/** What this step is, for a person and for a log. */
	id: string;
	effect: BerxStepEffect;
	/**
	 * The API client method this step calls, or undefined for a step that
	 * only moves the camera. Checked against the real client by the gate.
	 */
	capability?: string;
	/** Human-readable, short, and in the voice's own register. */
	says: string;
}

export type BerxStepState = 'pending' | 'awaiting-confirmation' | 'done' | 'refused' | 'failed';

export interface BerxStepResult {
	step: BerxPlanStep;
	state: BerxStepState;
	/** Why, when it did not finish. Shown to the person, not swallowed. */
	reason?: string;
	/** What the server actually returned, when it returned something. */
	got?: unknown;
}

export interface BerxPlan {
	intent: BerxVoiceIntent;
	steps: readonly BerxPlanStep[];
	/** Everything that stopped this plan being runnable as it stands. */
	blocked: readonly string[];
}

/**
 * Effects that a spoken request alone can never complete.
 *
 * The list is the directive's, and the reasoning is one sentence: a
 * microphone is not a credential. Anyone in the room can speak, a
 * recording can be played back, and a phone on a table hears everyone.
 */
const NEEDS_CONFIRMATION: readonly BerxStepEffect[] = ['sensitive'];

/** Does this step need a person to say yes some way other than out loud? */
export function berxNeedsConfirmation(step: BerxPlanStep): boolean {
	return NEEDS_CONFIRMATION.includes(step.effect);
}

/**
 * The plan for an intent, in the world it was said in.
 *
 * Pure: the same intent and the same world always give the same plan, so
 * a gate can assert the whole thing without a server, and a person can
 * be told what is about to happen before it does.
 */
export function berxPlan(intent: BerxVoiceIntent, state: BerxSituation): BerxPlan {
	const blocked: string[] = [];
	if (intent.kind === 'unknown') blocked.push('nothing was understood');
	for (const need of intent.needs) {
		if (need === 'referent') blocked.push('that referred to something not in view');
		if (need === 'location') blocked.push('where you are is not known yet');
		if (need === 'permission') blocked.push('location has not been allowed');
	}

	const capability = BERX_VOICE_CAPABILITY[intent.kind];
	const steps: BerxPlanStep[] = [];

	switch (intent.kind) {
		case 'now-nearby':
			steps.push({
				id: 'nearby', effect: 'read', capability,
				says: 'Смотрю, что рядом.',
			});
			steps.push({id: 'compose', effect: 'move', says: 'Показываю.'});
			break;
		case 'find-places':
		case 'find-events':
		case 'find-people':
		case 'discover':
			steps.push({id: 'search', effect: 'read', capability, says: 'Сейчас посмотрю.'});
			steps.push({id: 'compose', effect: 'move', says: 'Вот что нашёл.'});
			break;
		case 'open':
			/* Travelling to something already in the world is a camera move
			   and nothing else. Asking a server for permission to look at
			   what it already sent would be theatre. */
			steps.push({id: 'travel', effect: 'move', says: 'Иду туда.'});
			break;
		case 'dismiss':
			steps.push({id: 'dismiss', effect: 'move', says: 'Убрал.'});
			break;
		case 'refine': {
			/**
			 * SEARCH WHAT WAS BEING SEARCHED.
			 *
			 * This was hardcoded to places, so "покажи события" followed by
			 * "нет, только вечерние" went looking for restaurants. A
			 * correction is not a new request: it is the SAME request with
			 * one more constraint, and the kind it applies to is the one
			 * the person already made.
			 *
			 * With nothing to correct — a refinement arriving first — the
			 * fallback is discovery rather than places: "покажи другое"
			 * with no history is a request to be shown something else, and
			 * guessing a category would be inventing half the sentence.
			 */
			const original = intent.refining ?? 'discover';
			const capability = BERX_VOICE_CAPABILITY[original as keyof typeof BERX_VOICE_CAPABILITY]
				?? BERX_VOICE_CAPABILITY.discover;
			steps.push({id: 'search', effect: 'read', capability, says: 'Попробую иначе.'});
			steps.push({id: 'compose', effect: 'move', says: 'Вот другое.'});
			break;
		}
		case 'back':
			steps.push({id: 'back', effect: 'move', says: 'Возвращаю.'});
			break;
		default:
			break;
	}

	/* A step that needs the server needs a viewer the server knows. */
	if (steps.some((s) => s.effect === 'write' || s.effect === 'sensitive') && !state.viewerId) {
		blocked.push('nobody is signed in');
	}

	return {intent, steps, blocked};
}

/**
 * What a plan came to, derived from its steps and from nothing else.
 *
 * This is the file's most important function and it is four lines,
 * which is the point: `ok` is not a flag anyone sets. It is true exactly
 * when every step finished, so a plan whose second call failed cannot
 * report success no matter what the caller would like to say. The
 * "готово" that was never checked is not a bug that can be reintroduced
 * here — there is nowhere to put it.
 */
export interface BerxOutcome {
	ok: boolean;
	/** The first step that did not finish, when one did not. */
	stoppedAt?: BerxStepResult;
	results: readonly BerxStepResult[];
	/** True when a person still has to confirm something. */
	awaiting: boolean;
}

export function berxOutcome(results: readonly BerxStepResult[]): BerxOutcome {
	const stoppedAt = results.find((r) => r.state !== 'done');
	return {
		ok: results.length > 0 && stoppedAt === undefined,
		stoppedAt,
		results,
		awaiting: results.some((r) => r.state === 'awaiting-confirmation'),
	};
}

/**
 * Which intents change the world and which only look at it.
 *
 * Used to decide whether the runtime should compose a new spatial set or
 * simply move the camera — and, separately, whether it is worth saying
 * anything at all. See berxSay: a person who can see the result does not
 * need to be told it.
 */
export function berxChangesTheWorld(kind: BerxVoiceIntentKind): boolean {
	return kind === 'now-nearby' || kind === 'find-places' || kind === 'find-events'
		|| kind === 'find-people' || kind === 'discover' || kind === 'refine';
}
