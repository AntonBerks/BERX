/**
 * BERX LIVING WORLD — the one loop.
 *
 * Voice, Core and world were three correct subsystems that met only in a
 * gate, and that is exactly the failure the whole product is trying to
 * avoid: a person does not experience three things that agree, they
 * experience one thing or they experience seams. This file is the one
 * thing.
 *
 *   utterance → situation → intent → plan → CORE → execution → outcome
 *   → CORE → memory → speech → field → draw list
 *
 * Every arrow is a call to something that already existed. Nothing here
 * re-decides anything: the intent layer reads, the action graph plans,
 * the Core's closed union of causes moves the Core, and the draw list
 * renders whatever the field says. What this adds is that they happen in
 * ONE order, deterministically, so there is no second path through the
 * system and no state that only one of them knows about.
 *
 * TWO PROPERTIES IT EXISTS TO GUARANTEE, both measurable:
 *
 * A spoken intent that implies a spatial consequence HAS one. Asking
 * what is happening nearby and getting a sentence back is a chatbot; the
 * room has to change. So every turn reports what changed in the world,
 * and the gate checks that against what the intent implied.
 *
 * Where the world speaks, the voice does not. A person watching the
 * space fill with what they asked for does not need to be told it
 * filled. The turn carries both a world change and an utterance, and
 * they are near-exclusive by construction rather than by taste.
 *
 * IT EXECUTES NOTHING ITSELF. The API call is handed in, because this
 * module has no business knowing how to reach a server and because a
 * gate needs to drive the same loop with a failing one. What it does own
 * is the rule that the result decides everything downstream.
 */
import {berxReadIntent, type BerxVoiceIntent} from './voice/berxIntent';
import {
	berxPlan, berxOutcome, berxChangesTheWorld,
	type BerxOutcome, type BerxPlan, type BerxStepResult,
} from './voice/berxActionGraph';
import {berxAcknowledge, berxReport, berxAskWhich, berxAskBetween, type BerxUtterancePlan} from './voice/berxSay';
import {berxShow, berxDismiss, berxSelect, berxAsked, berxRequested, type BerxSpatialMemory, BERX_EMPTY_MEMORY} from './voice/berxSpatialMemory';
import type {BerxSituation} from './voice/berxWorldState';
import {
	berxCoreAt, berxCoreEnter, type BerxCoreMotion,
} from './core/berxCore';
import {berxCoreCause, type BerxCoreCause} from './core/berxCoreWorld';

/**
 * What one exchange did to the world.
 *
 * Named for what a person would notice, not for what the code did: the
 * question is always "did anything change out there", and these are the
 * only honest answers.
 */
export type BerxWorldChange =
	/** The space filled with something that was not there. */
	| 'composed'
	/** The viewer went somewhere. */
	| 'travelled'
	/** Something left the set. */
	| 'removed'
	/** The viewer went back. */
	| 'returned'
	/** Nothing moved. Which is correct for some turns and wrong for others. */
	| 'none';

export interface BerxTurn {
	intent: BerxVoiceIntent;
	plan: BerxPlan;
	outcome: BerxOutcome;
	/** What actually changed out there. */
	change: BerxWorldChange;
	/** The entities now in front of the person, in the order shown. */
	shown: readonly {id: string; label?: string}[];
	/** What to say, which is very often nothing. */
	say: BerxUtterancePlan;
	core: BerxCoreMotion;
	memory: BerxSpatialMemory;
}

/**
 * How a turn reaches the world.
 *
 * `execute` runs the plan and returns a result per step plus whatever
 * the world should now hold. It is handed in rather than imported: this
 * module has no business knowing how to reach a server, and a gate needs
 * to drive the identical loop with one that fails.
 */
export interface BerxWorldBridge {
	execute(plan: BerxPlan, situation: BerxSituation): Promise<{
		results: BerxStepResult[];
		/** What the server really returned, in the order to show it. */
		entities?: readonly {id: string; label?: string}[];
	}>;
	/** Move the viewer. False when the entity is not in the world. */
	travel?(objectId: string): boolean;
	/** Go back. False when there is nowhere to go. */
	back?(): boolean;
}

export interface BerxLivingWorldState {
	core: BerxCoreMotion;
	memory: BerxSpatialMemory;
}

export function berxLivingWorld(): BerxLivingWorldState {
	return {core: berxCoreAt('idle'), memory: BERX_EMPTY_MEMORY};
}

/**
 * Whether an intent PROMISES that the space will change.
 *
 * The gate's contract, written where the loop can be held to it. An
 * intent in this set that produces `change: 'none'` on a successful turn
 * is the exact failure this file exists to prevent: a question answered
 * with a sentence while the room stays as it was.
 */
export function berxImpliesSpatialChange(intent: BerxVoiceIntent): boolean {
	if (intent.kind === 'unknown') return false;
	if (intent.needs.length > 0) return false;
	return berxChangesTheWorld(intent.kind)
		|| intent.kind === 'open' || intent.kind === 'dismiss' || intent.kind === 'back';
}

/**
 * One exchange, start to finish.
 *
 * Deterministic given the same situation, memory and bridge results — so
 * a gate can drive a whole conversation and predict every step of it,
 * which is the only way "one system" is a claim rather than a hope.
 */
export async function berxSpeakToWorld(
	state: BerxLivingWorldState,
	utterance: string,
	situation: BerxSituation,
	bridge: BerxWorldBridge,
	/**
	 * Fired the instant the sentence is understood, before anything is
	 * attempted.
	 *
	 * What a person asked for is known when they ask, not when a server
	 * answers — and a conversation that only records the request on
	 * completion cannot be interrupted, because a correction arriving
	 * mid-flight finds nothing to correct.
	 */
	onIntent?: (intent: BerxVoiceIntent) => void,
	/**
	 * Fired with every cause that moves the Core, as it moves it.
	 *
	 * THE CORE A PERSON SEES IS THE ONE THE FRAME LOOP STEPS, and until
	 * this existed the loop moved a Core of its own that nothing rendered.
	 * Every state below was computed correctly, carried in `turn.core`,
	 * and thrown away — which photographs as a Core that never leaves the
	 * state a pointer put it in, however green the module's gates are.
	 *
	 * A CAUSE rather than a state, deliberately. The rule that keeps the
	 * Core honest is that nothing sets how it feels; things that happened
	 * do. Handing out the resolved state would be a setter with a longer
	 * name, and the first caller to reach for it would be the one making
	 * the Core interesting on purpose.
	 */
	onCore?: (cause: BerxCoreCause) => void,
): Promise<BerxTurn> {
	let memory = berxAsked(state.memory, utterance);
	const intent = berxReadIntent(utterance, situation, memory);
	/* What this turned out to mean, so the next correction has something
	   to correct. Recorded before anything is attempted: a request that
	   fails is still the request a person made. */
	memory = berxRequested(memory, intent.kind);
	onIntent?.(intent);

	/**
	 * The one place in this file that moves the Core.
	 *
	 * Every site below went through `berxCoreEnter(core, berxCoreCause(
	 * core.state, cause))` written out by hand, which is six chances to
	 * forget the new callback and six ways for the rendered Core and the
	 * loop's Core to drift apart. One helper means a cause cannot be
	 * applied without being announced.
	 */
	let core = state.core;
	const move = (cause: BerxCoreCause): void => {
		core = berxCoreEnter(core, berxCoreCause(core.state, cause, core.unresolved));
		onCore?.(cause);
	};

	move({kind: 'utterance', intent});

	/**
	 * TWO READINGS, SO ASK — before planning anything.
	 *
	 * The sentence fits more than one request and both are real. Running
	 * the first one and hoping is the behaviour that teaches people not to
	 * trust the answers that WERE right: asking costs one exchange,
	 * guessing wrong costs every answer after it.
	 *
	 * Nothing is attempted, so nothing can half-happen, and the world is
	 * untouched while the question stands.
	 */
	const ask = intent.alternatives && intent.alternatives.length > 0
		? berxAskBetween([{kind: intent.kind}, ...intent.alternatives.map((kind) => ({kind}))])
		: undefined;
	if (ask) {
		return {
			intent, plan: berxPlan(intent, situation), outcome: berxOutcome([]),
			change: 'none', shown: memory.shown, say: ask, core, memory,
		};
	}

	const plan = berxPlan(intent, situation);
	move({kind: 'plan', plan});

	/* A plan that cannot run stops here, and says which part. Nothing is
	   attempted, so nothing can half-happen. */
	if (plan.blocked.length > 0 || plan.steps.length === 0) {
		const say = intent.needs.includes('referent')
			? berxAskWhich(situation.visible.length)
			: berxAcknowledge(plan);
		return {
			intent, plan, outcome: berxOutcome([]), change: 'none',
			shown: memory.shown, say, core, memory,
		};
	}

	/* ---- the ones that only move the viewer ---- */

	if (intent.kind === 'open' && intent.objectId) {
		const moved = bridge.travel?.(intent.objectId) ?? false;
		const results: BerxStepResult[] = [{
			step: plan.steps[0],
			state: moved ? 'done' : 'failed',
			reason: moved ? undefined : 'этого нет в мире',
		}];
		const outcome = berxOutcome(results);
		if (moved) memory = berxSelect(memory, intent.objectId);
		move(moved ? {kind: 'arrived', region: situation.region} : {kind: 'outcome', outcome});
		return {
			intent, plan, outcome, change: moved ? 'travelled' : 'none',
			shown: memory.shown,
			/* Silent on success: the camera is visibly moving, and saying
			   "иду туда" over it is narration. */
			say: berxReport(intent, outcome, memory.shown.length),
			core, memory,
		};
	}

	if (intent.kind === 'dismiss' && intent.objectId) {
		const before = memory.shown.length;
		memory = berxDismiss(memory, intent.objectId);
		const removed = memory.shown.length < before;
		const outcome = berxOutcome([{step: plan.steps[0], state: removed ? 'done' : 'failed', reason: removed ? undefined : 'этого нет в наборе'}]);
		move({kind: 'outcome', outcome});
		return {
			intent, plan, outcome, change: removed ? 'removed' : 'none',
			shown: memory.shown, say: berxReport(intent, outcome, memory.shown.length), core, memory,
		};
	}

	if (intent.kind === 'back') {
		const went = bridge.back?.() ?? false;
		const outcome = berxOutcome([{step: plan.steps[0], state: went ? 'done' : 'failed', reason: went ? undefined : 'некуда возвращаться'}]);
		move({kind: 'outcome', outcome});
		return {
			intent, plan, outcome, change: went ? 'returned' : 'none',
			shown: memory.shown, say: berxReport(intent, outcome, memory.shown.length), core, memory,
		};
	}

	/* ---- the ones that ask the world ---- */

	const ran = await bridge.execute(plan, situation);
	const outcome = berxOutcome(ran.results);

	/**
	 * THE RULE, one line: the world only changes if the execution
	 * succeeded.
	 *
	 * A failed search must leave the room exactly as it was. Composing
	 * something anyway — a partial set, a cached one, anything — would be
	 * the world showing a result the server did not give, which is the
	 * same lie as a spoken "готово" and harder to notice.
	 */
	const entities = outcome.ok ? (ran.entities ?? []) : [];
	if (outcome.ok) memory = berxShow(memory, entities);

	move(outcome.ok ? {kind: 'results', found: entities.length} : {kind: 'outcome', outcome});

	return {
		intent, plan, outcome,
		change: outcome.ok && entities.length > 0 ? 'composed' : 'none',
		shown: memory.shown,
		say: berxReport(intent, outcome, entities.length),
		core, memory,
	};
}

/**
 * Whether a turn is coherent — the property the whole file exists for.
 *
 * Not a runtime check anybody calls: a description of what "one system"
 * means, in a form a gate can hold every turn to. Two conditions:
 *
 * An intent that promised the space would change, on a turn that
 * succeeded, must have changed it.
 *
 * And the two channels must not both be loud. Where the world answered,
 * the voice adds a count at most; where the world could not, the voice
 * carries the turn. Both speaking at once is the assistant narrating its
 * own interface.
 */
export function berxTurnCoherent(turn: BerxTurn): {ok: boolean; why?: string} {
	if (turn.outcome.ok && berxImpliesSpatialChange(turn.intent) && turn.change === 'none') {
		return {ok: false, why: `${turn.intent.kind} succeeded and nothing in the world moved`};
	}
	if (turn.change === 'none' && !turn.outcome.ok && turn.say.text === '') {
		return {ok: false, why: 'nothing happened and nothing was said, which is a person left waiting'};
	}
	/* A world change plus a long line is the assistant reading its own
	   screen. Six words is the count and a clause, which is the most
	   that adds anything. */
	if (turn.change !== 'none' && turn.say.text.split(/\s+/).filter(Boolean).length > 6) {
		return {ok: false, why: 'the world changed and the voice narrated it anyway'};
	}
	return {ok: true};
}
