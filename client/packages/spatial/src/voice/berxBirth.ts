/**
 * BERX REGISTRATION — arriving in a world, not filling in a form.
 *
 * The nine stages the design asks for are real stages, but they are not
 * all the same KIND of thing, and pretending otherwise is where a
 * registration flow starts lying. Some of them commit something to a
 * server. Some of them only ask. One of them cannot be committed at all,
 * because the backend has nowhere to put it — and saying so here is the
 * point of the file.
 *
 * THE ORDER IS NOT A DESIGN CHOICE. It is what the API permits. Only
 * `register` and `login` can be called without a session; everything
 * else — the portrait, the profile — needs a token that does not exist
 * until the account does. A flow that asked for a photograph first and
 * held it in memory until the end would be a flow that loses it when the
 * app is backgrounded, and would be showing progress it had not made.
 * So BIRTH is not the last stage by sentiment. It is the stage after
 * which the others become possible.
 *
 * WHAT CANNOT BE SAVED IS MARKED, NOT FAKED. There is no general
 * interests endpoint on this backend. There is a dating profile that has
 * an `interests` string, and using it for someone who did not ask for a
 * dating profile would be storing personal data somewhere they did not
 * agree to. So INTERESTS collects and does not commit, and its
 * `capability` is undefined, and the gate checks that nothing claims it
 * was saved.
 */

/**
 * The arc, in the order it actually runs.
 *
 * ARRIVAL and PRESENCE come before anything is asked, and that is most
 * of what makes this not a form: the first thing that happens is a world
 * opening and someone being noticed, not a field gaining focus.
 */
export type BerxBirthStage =
	/** The world opens. Nothing is asked. */
	| 'arrival'
	/** Someone is there, and the room knows. Consent for the microphone. */
	| 'presence'
	/** What to call them. Spoken, not typed. */
	| 'name'
	/** What they came for. Collected; this backend cannot store it. */
	| 'interests'
	/** Who they are to the system: a handle, an address, a secret. */
	| 'identity'
	/** Their face, if they want one. Needs an account to belong to. */
	| 'portrait'
	/** The rest of the name, once there is somewhere to put it. */
	| 'profile'
	/** They agree. Explicitly, and not by voice. */
	| 'confirm'
	/** The account exists. Everything after this is possible. */
	| 'birth';

export const BERX_BIRTH_STAGES: readonly BerxBirthStage[] = [
	'arrival', 'presence', 'name', 'interests', 'identity',
	'confirm', 'birth', 'portrait', 'profile',
] as const;

export interface BerxBirthStep {
	stage: BerxBirthStage;
	/**
	 * The BerxApiClient method that commits this stage, if one does.
	 *
	 * Undefined means the stage collects or does something local — and,
	 * in one case, that the backend has nowhere to put what was
	 * collected. The gate checks every defined one against the real
	 * client by reflection.
	 */
	capability?: string;
	/** True when this cannot run until a session exists. */
	needsSession: boolean;
	/** What it asks for, in the words the voice uses. */
	says: string;
	/**
	 * Present only when something is collected that this backend cannot
	 * store, and it says where it goes instead: nowhere. A field with
	 * this set must never be reported as saved.
	 */
	blocked?: string;
}

/**
 * The whole flow, as data.
 *
 * Written out rather than assembled, because the ORDER carries a
 * constraint that is easy to break by refactoring and impossible to see
 * in a diff: nothing needing a session may precede `birth`.
 */
export const BERX_BIRTH_PLAN: readonly BerxBirthStep[] = Object.freeze([
	{stage: 'arrival', needsSession: false, says: ''},
	{stage: 'presence', needsSession: false, says: 'Слышу тебя.'},
	{stage: 'name', needsSession: false, says: 'Как тебя зовут?'},
	{
		stage: 'interests', needsSession: false, says: 'Что тебе интересно?',
		/* Collected because it shapes what the world shows on arrival, and
		   held in memory for that. NOT written anywhere: there is no
		   general interests endpoint, and the dating profile's interests
		   string belongs to a dating profile this person did not ask
		   for. */
		blocked: 'no general interests endpoint on this backend; the dating profile\'s field belongs to a profile this person did not ask for',
	},
	{stage: 'identity', needsSession: false, says: 'Нужен адрес и пароль.'},
	{stage: 'confirm', needsSession: false, says: 'Создаю?'},
	{stage: 'birth', capability: 'register', needsSession: false, says: 'Готово.'},
	{stage: 'portrait', capability: 'uploadAvatar', needsSession: true, says: 'Хочешь лицо?'},
	{stage: 'profile', capability: 'updateProfile', needsSession: true, says: ''},
]);

/** What has actually been collected, before anything is committed. */
export interface BerxBirthDraft {
	name?: string;
	interests?: readonly string[];
	username?: string;
	email?: string;
	/** Never logged, never spoken back, never in a moment. */
	password?: string;
	agreed?: boolean;
}

export type BerxBirthState = 'waiting' | 'collected' | 'committed' | 'failed' | 'blocked';

export interface BerxBirthResult {
	stage: BerxBirthStage;
	state: BerxBirthState;
	reason?: string;
}

/**
 * Whether the flow is allowed to attempt a stage yet.
 *
 * Two conditions and both are real: the stages before it must have got
 * somewhere, and anything needing a session must come after the account
 * exists. The second is not a preference — the request would be rejected.
 */
export function berxBirthReady(
	stage: BerxBirthStage,
	done: readonly BerxBirthResult[],
): {ok: boolean; why?: string} {
	const step = BERX_BIRTH_PLAN.find((s) => s.stage === stage);
	if (!step) return {ok: false, why: 'no such stage'};
	if (step.needsSession) {
		const born = done.find((d) => d.stage === 'birth');
		if (!born || born.state !== 'committed') {
			return {ok: false, why: 'there is no account for this to belong to yet'};
		}
	}
	const index = BERX_BIRTH_PLAN.findIndex((s) => s.stage === stage);
	const bornIndex = BERX_BIRTH_PLAN.findIndex((s) => s.stage === 'birth');
	const born = done.some((d) => d.stage === 'birth' && d.state === 'committed');
	for (let i = 0; i < index; i++) {
		const prior = BERX_BIRTH_PLAN[i];
		/**
		 * An account existing IS the evidence.
		 *
		 * `register` cannot succeed without a name, an address and a
		 * password, and this flow will not call it without an explicit
		 * agreement — so a committed birth proves every stage up to it
		 * happened, and asking for a separate tick for each is bookkeeping
		 * that can only be wrong. The first version of this required them
		 * and refused a portrait for an account the server had already
		 * made, which the gate caught.
		 */
		if (born && i <= bornIndex) continue;
		const result = done.find((d) => d.stage === prior.stage);
		/* A blocked stage does not hold the flow up — it was never going
		   to commit, and blocking on it would be waiting for something
		   that cannot happen. */
		if (!result && !prior.blocked && prior.says !== '') {
			return {ok: false, why: `${prior.stage} has not happened yet`};
		}
	}
	return {ok: true};
}

/**
 * Everything the register call needs, or what is missing.
 *
 * Returns the exact shape BerxApiClient.register takes — not a superset,
 * not a guess. A field this backend does not accept is a field that
 * should never have been asked for.
 */
export function berxBirthFields(draft: BerxBirthDraft):
	| {ok: true; fields: {username: string; firstname: string; lastname: string; email: string; password: string}}
	| {ok: false; missing: string[]} {
	const missing: string[] = [];
	if (!draft.username?.trim()) missing.push('username');
	if (!draft.email?.trim()) missing.push('email');
	if (!draft.password) missing.push('password');
	if (!draft.name?.trim()) missing.push('name');
	if (!draft.agreed) missing.push('agreement');
	if (missing.length > 0) return {ok: false, missing};

	/* One spoken name, split the way the API wants it. Someone who said
	   "Анна" has one name, and inventing a surname to fill a required
	   field would be putting a fiction in their profile — the empty
	   string is honest and the server accepts it. */
	const parts = draft.name!.trim().split(/\s+/);
	return {
		ok: true,
		fields: {
			username: draft.username!.trim(),
			firstname: parts[0],
			lastname: parts.slice(1).join(' '),
			email: draft.email!.trim(),
			password: draft.password!,
		},
	};
}

/**
 * How far this has really got.
 *
 * Derived from results, like every other outcome in BERX: `born` is true
 * exactly when the register call came back, so a flow whose account
 * creation failed cannot show a finished registration however much the
 * rest of it succeeded.
 */
export function berxBirthProgress(done: readonly BerxBirthResult[]): {
	born: boolean;
	committed: BerxBirthStage[];
	blocked: BerxBirthStage[];
	failed: BerxBirthStage[];
} {
	return {
		born: done.some((d) => d.stage === 'birth' && d.state === 'committed'),
		committed: done.filter((d) => d.state === 'committed').map((d) => d.stage),
		blocked: done.filter((d) => d.state === 'blocked').map((d) => d.stage),
		failed: done.filter((d) => d.state === 'failed').map((d) => d.stage),
	};
}
