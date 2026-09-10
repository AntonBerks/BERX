/**
 * WHAT PUTS THE CORE IN A STATE.
 *
 * The Core does not decide how it feels. Everything here is a reading of
 * something that actually happened — a plan started, a server answered,
 * a person arrived somewhere — which is the structural form of "каждое
 * изменение должно иметь причину в состоянии системы". There is no
 * function in this file that can be called to make the Core look
 * interesting, because there is no argument for interestingness.
 *
 * The consequence worth stating: if the world is doing nothing, the Core
 * has nothing to be, and it rests. A machine that keeps performing while
 * nothing is happening is a machine performing.
 */
import type {BerxCoreState} from './berxCore';
import type {BerxVoiceIntent} from '../voice/berxIntent';
import type {BerxOutcome, BerxPlan} from '../voice/berxActionGraph';
import type {BerxSituation} from '../voice/berxWorldState';

/**
 * Everything that can move the Core, as one union.
 *
 * A closed set on purpose: a gate can enumerate it, and adding a cause
 * means adding a case here rather than calling a setter from somewhere
 * far away. That is what keeps "no AI theatre" true a year from now.
 */
export type BerxCoreCause =
	/** Someone or something entered the field of attention. */
	| {kind: 'presence'; near: boolean}
	/** The microphone is open and carrying sound. */
	| {kind: 'voice'; speaking: boolean}
	/** An utterance ended and is being read. */
	| {kind: 'utterance'; intent: BerxVoiceIntent}
	/** A plan is running. */
	| {kind: 'plan'; plan: BerxPlan}
	/** Results came back. `found` is a real count, never an estimate. */
	| {kind: 'results'; found: number}
	/** A plan finished, one way or the other. */
	| {kind: 'outcome'; outcome: BerxOutcome}
	/** BERX is saying something. */
	| {kind: 'speech'; speaking: boolean}
	/** The person went somewhere: a place, an event, a conversation. */
	| {kind: 'arrived'; region: BerxSituation['region']};

/**
 * The state one cause puts the Core in, given where it already is.
 *
 * Where it already is matters in exactly one place — recovery — and that
 * exception is the reason this takes `current` at all: after an error,
 * the next thing that happens is a RECOVERY, not a fresh start, and the
 * Core saying so is most of what "BERX не сломался, он ищет другой путь"
 * means. Everywhere else the cause is enough.
 */
export function berxCoreCause(
	current: BerxCoreState,
	cause: BerxCoreCause,
	/**
	 * Whether a failure is still standing — `BerxCoreMotion.unresolved`.
	 *
	 * Defaulted, because most callers ask about a state in isolation and
	 * because the two states that ARE a failure answer for themselves.
	 * It matters for the states a failure survives: BERX saying "не
	 * получилось" is in `speaking`, and when the line ends the question
	 * "was something wrong?" has to reach past that state to the one it
	 * was speaking about. Without this it settled into `aware` — the
	 * room forgetting a problem the person had just been told about.
	 */
	unresolved = false,
): BerxCoreState {
	const recovering = current === 'error' || current === 'recovering' || unresolved;

	switch (cause.kind) {
		case 'presence':
			if (!cause.near) return 'idle';
			if (recovering) return 'recovering';
			/**
			 * A HAND ARRIVING DOES NOT MAKE BERX LESS BUSY.
			 *
			 * `aware` means "something could happen". Every state below
			 * is something already happening — it is listening, or
			 * reading a sentence, or waiting on a server it has already
			 * asked — and all of them are MORE than aware. Returning
			 * `aware` from one of them demoted the drawn Core in the
			 * middle of the work: a finger resting on the world while a
			 * search was in flight reset the room to "someone is here"
			 * and the search became invisible until the answer came
			 * back, which is a progress bar that fills after the
			 * download.
			 *
			 * Found by the held gesture, which produces a presence the
			 * moment a finger has stayed half a second — but the same
			 * hole was under every tap and every hotword, and the
			 * ordering of a test was all that hid it.
			 */
			return current === 'idle' || current === 'aware' || current === 'success' ? 'aware' : current;

		case 'voice':
			/* Someone speaking after a failure is the recovery: they are
			   giving BERX the other path. It listens as itself, not as a
			   thing that has just been reset. */
			return cause.speaking ? 'listening' : (recovering ? 'recovering' : 'aware');

		case 'utterance':
			if (cause.intent.kind === 'unknown') {
				/* Not understanding is not an error — the system is fine,
				   the sentence was not resolvable. ERROR is for things that
				   failed, and spending it here would make a real failure
				   mean less. */
				return 'recovering';
			}
			return 'understanding';

		case 'plan': {
			if (cause.plan.blocked.length > 0) return 'recovering';
			/* A plan that only reads is a search; one that writes is an
			   act. The distinction is visible because it is real: one of
			   them changes the world and the other looks at it. */
			const writes = cause.plan.steps.some((s) => s.effect === 'write' || s.effect === 'sensitive');
			return writes ? 'acting' : 'searching';
		}

		case 'results':
			/* An empty answer is not a failure and must not look like one.
			   It resolves — quietly, with nothing in it — and the voice
			   says so. A world that reddened on "ничего не нашёл" would be
			   teaching people that asking is risky. */
			return cause.found > 0 ? 'discovering' : 'success';

		case 'outcome':
			if (cause.outcome.awaiting) return 'acting';
			return cause.outcome.ok ? 'success' : 'error';

		case 'speech':
			return cause.speaking ? 'speaking' : (recovering ? 'recovering' : 'aware');

		case 'arrived':
			/* Arriving somewhere IS the resolution: the thing that was
			   being looked for is now the place the person is standing.
			   The Core settles into it rather than announcing it. */
			return 'success';

		default:
			return current;
	}
}

/**
 * Whether a state change should also be felt.
 *
 * Haptics as part of the state rather than as a notification, which is
 * the difference between a phone buzzing at you and a room having
 * substance. Only the moments a hand would expect to feel something:
 * the instant of commitment, the instant of resolution, and the instant
 * a plan came apart. Nothing on searching, because a search that
 * vibrated for its whole duration would be a machine demanding
 * attention it has not earned yet.
 */
export function berxCoreHaptic(from: BerxCoreState, to: BerxCoreState): 'none' | 'light' | 'settle' | 'break' {
	if (from === to) return 'none';
	if (to === 'acting') return 'light';
	if (to === 'success') return 'settle';
	if (to === 'error') return 'break';
	return 'none';
}

/**
 * Whether a state carries sound, and of what kind.
 *
 * Also part of the state, for the same reason. `bed` is a continuous
 * layer that belongs to a condition — the room while a search is
 * happening — and `mark` is a single event at a moment. Silence is the
 * majority answer and is not an omission.
 */
export function berxCoreSound(state: BerxCoreState): 'silence' | 'bed' | 'mark' {
	if (state === 'searching' || state === 'discovering') return 'bed';
	if (state === 'success' || state === 'error') return 'mark';
	return 'silence';
}
