/**
 * THE VOICE, ATTACHED TO THE WORLD.
 *
 * Everything on both sides of this file already existed and was already
 * verified: BerxWebVoice turns a microphone into a transcript through
 * the platform's own recogniser, and berxSpeakToWorld turns a sentence
 * into a confirmed change of the world. Nothing joined them, so a
 * product session had a voice that could hear and a world that could
 * change and no path between the two.
 *
 * This is that path, and it is deliberately thin. It decides nothing:
 * the intent layer reads the sentence, the action graph plans it, the
 * bridge below calls the REAL API method the plan names, and the loop
 * decides what the world does with the answer. What this file adds is
 * the wiring and one rule that has to live at the boundary — a plan step
 * names a capability by the client method's own name, and a name that is
 * not a method on the client is refused rather than guessed at.
 *
 * NOTHING IS INVENTED HERE. A capability with no method behind it fails
 * its step, the step failing means the outcome failed, and a failed
 * outcome leaves the world exactly as it was. That chain is the reason
 * this file can be thin: it does not need to be careful, because the
 * layers around it already are.
 */
import {
	berxLivingWorld, berxSpeakToWorld, berxSituation, berxTemporalCursor,
	type BerxLivingWorldState, type BerxTurn, type BerxWorldBridge,
	berxRequested,
	type BerxPlan, type BerxStepResult, type BerxSituation,
} from '@berx/spatial';
import type {Berx5DWebHost} from './runtimeHost5d';

/**
 * What the voice needs from the outside world.
 *
 * `client` is the real BerxApiClient, structurally typed so this package
 * does not depend on @berx/api — the plan names a method on it and this
 * calls that method, which is the whole contract.
 */
export interface BerxVoiceToWorldOptions {
	host: Berx5DWebHost;
	/** The real API client. A plan step's `capability` is a method name on it. */
	client: Record<string, unknown>;
	/** Where the person is, when they have allowed it to be known. */
	location?: () => {lat: number; lng: number; atMs: number} | undefined;
	/** What the platform has actually granted. Never assumed. */
	permissions?: () => {microphone: boolean; location: boolean; notifications: boolean; presence: boolean};
	/** Called after every turn, so a shell can say what was said. */
	onTurn?: (turn: BerxTurn) => void;
	/**
	 * How to stop BERX talking, right now.
	 *
	 * BerxVoiceBackend.stop() in a real session. Handed in rather than
	 * imported so this module does not depend on a speech backend, and so
	 * a gate can watch exactly when it is called — which is the one thing
	 * about barge-in that has to be measured rather than asserted.
	 */
	stopSpeaking?: () => void;
	now?: () => number;
}

/**
 * How a spoken result becomes entities.
 *
 * Every list the API returns is a different shape, and the one thing
 * they have in common is that BERX needs an id and a name from each. The
 * mapping is explicit per capability rather than guessed by probing for
 * fields: a heuristic that found `title` on one response and `name` on
 * another would silently produce empty names the day a third arrived.
 */
const ENTITIES: Readonly<Record<string, (got: unknown) => {id: string; label?: string}[]>> = Object.freeze({
	nearbyNow: (got) => {
		const r = got as {events?: {guid: number; title?: string}[]; places?: {guid: number; title?: string}[]};
		return [
			...(r?.events ?? []).map((e) => ({id: `event:${e.guid}`, label: e.title})),
			...(r?.places ?? []).map((p) => ({id: `place:${p.guid}`, label: p.title})),
		];
	},
	nearbyPlaces: (got) => ((got as {places?: {guid: number; title?: string}[]})?.places ?? [])
		.map((p) => ({id: `place:${p.guid}`, label: p.title})),
	events: (got) => ((got as {events?: {guid: number; title?: string}[]})?.events ?? [])
		.map((e) => ({id: `event:${e.guid}`, label: e.title})),
	searchUsers: (got) => ((got as {users?: {guid: number; fullname?: string; username?: string}[]})?.users ?? [])
		.map((u) => ({id: `person:${u.guid}`, label: u.fullname ?? u.username})),
	feed: (got) => ((got as {posts?: {guid: number; text?: string}[]})?.posts ?? [])
		.map((p) => ({id: `moment:${p.guid}`, label: p.text?.slice(0, 40)})),
});

/**
 * The arguments each capability really takes.
 *
 * Written out because the API is the API: `nearbyNow(lat, lng, radiusKm)`
 * has a signature and this has to match it. A generic caller that passed
 * an options object would fail at runtime against a client that has been
 * correct all along.
 */
const callFor = (
	capability: string,
	client: Record<string, unknown>,
	situation: BerxSituation,
): (() => Promise<unknown>) | undefined => {
	const method = client[capability];
	if (typeof method !== 'function') return undefined;
	const call = method.bind(client) as (...args: unknown[]) => Promise<unknown>;
	const here = situation.location;
	switch (capability) {
		case 'nearbyNow':
			return here ? () => call(here.lat, here.lng, 5, false, true) : undefined;
		case 'nearbyPlaces':
			return here ? () => call(here.lat, here.lng, 5) : undefined;
		case 'events':
			return () => call({});
		case 'searchUsers':
			return () => call('');
		case 'feed':
			return () => call(20, 0);
		default:
			return () => call();
	}
};

export interface BerxVoiceToWorld {
	/** One utterance, all the way to a changed world. */
	say(utterance: string): Promise<BerxTurn>;
	/**
	 * Someone started talking while BERX was still going.
	 *
	 * Stops the speaking immediately, abandons whatever the previous turn
	 * was still going to do, and reads the new sentence against
	 * everything the conversation already knows. Interruption is not an
	 * error and not a reset: it is how people talk, and the whole reason
	 * this is a conversation rather than a sequence of commands.
	 */
	interrupt(utterance: string): Promise<BerxTurn>;
	/** True while a turn is still running. */
	readonly busy: boolean;
	/** What the loop currently remembers: what was shown, chosen, dismissed. */
	readonly state: BerxLivingWorldState;
	/** Every turn this session has run, newest last. */
	readonly turns: readonly BerxTurn[];
}

export function berxVoiceToWorld(options: BerxVoiceToWorldOptions): BerxVoiceToWorld {
	let state = berxLivingWorld();
	const turns: BerxTurn[] = [];
	const now = options.now ?? (() => Date.now());

	/** The world as it stands, this instant. Never cached: it moves. */
	const situationNow = (): BerxSituation => {
		const world = options.host.world;
		const frame = world?.latestFrame;
		const position = world?.worldPosition;
		return berxSituation({
			nowMs: now(),
			cursor: world?.cursor ?? berxTemporalCursor(Math.floor(now() / 1000)),
			region: position?.region ?? 'world',
			focusId: frame?.world.activeObjectId,
			viewerId: world?.viewer,
			objects: frame?.world.objects ?? [],
			eye: frame?.camera.position ?? {x: 0, y: 0, z: 0},
			location: options.location?.(),
			allowed: options.permissions?.() ?? {
				microphone: true, location: options.location?.() !== undefined,
				notifications: false, presence: false,
			},
		});
	};

	/**
	 * The bridge: what a plan does when it really runs.
	 *
	 * Each step's `capability` is looked up on the client BY NAME. A name
	 * with no method behind it is `failed`, not skipped and not
	 * substituted — and a failed step means a failed outcome, which means
	 * the loop leaves the world untouched.
	 */
	const bridge: BerxWorldBridge = {
		async execute(plan: BerxPlan, situation: BerxSituation) {
			const results: BerxStepResult[] = [];
			let entities: {id: string; label?: string}[] = [];
			for (const step of plan.steps) {
				if (!step.capability) {
					results.push({step, state: 'done'});
					continue;
				}
				const call = callFor(step.capability, options.client, situation);
				if (!call) {
					results.push({
						step, state: 'failed',
						reason: situation.location === undefined && (step.capability === 'nearbyNow' || step.capability === 'nearbyPlaces')
							? 'я не знаю, где ты'
							: `${step.capability} нет на сервере`,
					});
					break;
				}
				try {
					const got = await call();
					results.push({step, state: 'done', got});
					entities = ENTITIES[step.capability]?.(got) ?? [];
				} catch (error) {
					/* The server's own words, not a substitute for them. */
					results.push({step, state: 'failed', reason: error instanceof Error ? error.message : 'сервер не ответил'});
					break;
				}
			}
			return {results, entities};
		},
		travel(objectId) {
			return options.host.world?.travelTo(objectId) ?? false;
		},
		back() {
			return options.host.back();
		},
	};

	/**
	 * The turn in flight, and the token that says whether it still counts.
	 *
	 * A turn that was interrupted must not apply its result when it
	 * finally returns — the request it was answering is no longer the
	 * request. The counter is compared after every await, which is the
	 * only reliable way to know that in a language with no cancellation.
	 */
	let generation = 0;
	let running = false;

	const run = async (utterance: string): Promise<BerxTurn> => {
		const mine = ++generation;
		running = true;
		try {
			const turn = await berxSpeakToWorld(state, utterance, situationNow(), bridge, (intent) => {
				/**
				 * RECORDED AT THE MOMENT IT IS UNDERSTOOD, not when it
				 * finishes.
				 *
				 * A person who says "покажи события" and then cuts in with
				 * "нет, только вечерние" before the server answers is
				 * correcting a request that is still in the air. If the
				 * request were only written down on completion, the
				 * correction would arrive to an empty memory and read as a
				 * new, meaningless sentence.
				 */
				state = {...state, memory: berxRequested(state.memory, intent.kind)};
			});
			/**
			 * SUPERSEDED WHILE IT WAS AWAY.
			 *
			 * Someone spoke again while this was in the air, so the world
			 * must not be rearranged by an answer to a question that has
			 * been replaced. The turn is returned for the record and
			 * nothing is applied — no memory, no entities, no Core.
			 */
			if (mine !== generation) return turn;
			state = {core: turn.core, memory: turn.memory};
			turns.push(turn);
			applyToWorld(turn);
			options.onTurn?.(turn);
			return turn;
		} finally {
			if (mine === generation) running = false;
		}
	};

	return {
		get busy() { return running; },

		async interrupt(utterance: string) {
			/**
			 * SILENCE FIRST, and before anything else in this function.
			 *
			 * A person who starts talking has already decided BERX should
			 * stop, and every millisecond of continued speech after that
			 * decision is the system talking over them. Reading the
			 * sentence, planning it and calling a server all come after.
			 */
			options.stopSpeaking?.();
			/**
			 * And the context is KEPT. `state` is untouched here, so the
			 * new sentence is read against everything the conversation
			 * already knows — what was shown, what was dismissed, and what
			 * was last REQUESTED, which is what makes "нет, только
			 * итальянские" a correction rather than a fresh search.
			 */
			return run(utterance);
		},

		async say(utterance: string) {
			return run(utterance);
		},
		get state() { return state; },
		get turns() { return turns; },
	};

	function applyToWorld(turn: BerxTurn) {
			/**
			 * WHAT WAS FOUND BECOMES PART OF THE WORLD.
			 *
			 * Only on a turn that composed something — the loop already
			 * guarantees that a failed execution composes nothing, so this
			 * cannot put a set the server did not give into the room.
			 */
			if (turn.change === 'composed' && options.host.world) {
				for (const entity of turn.shown) {
					const [kind, guid] = entity.id.split(':');
					options.host.world.ingest([{
						object: {
							id: entity.id,
							kind: kind as never,
							label: entity.label,
							transform: {position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}, scale: {x: 1, y: 1, z: 1}},
							material: {opacity: 1},
							energy: 0,
							visible: true,
						} as never,
						relations: [{
							/* what was asked for is related to who asked: the
							   graph is what places it, so this is not a
							   decoration on the entity, it is its position */
							from: options.host.world.viewer ?? 'person:me',
							to: entity.id,
							kind: 'mentions',
							weight: 0.5,
						}] as never,
						media: [],
					}]);
					void guid;
				}
			}
	}
}
