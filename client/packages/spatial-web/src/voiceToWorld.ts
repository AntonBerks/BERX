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
	berxRequested, berxVoiceProsody,
	type BerxPlan, type BerxStepResult, type BerxSituation,
	type BerxVoiceBackend, type BerxVoiceEmotion, type BerxCoreState,
	type BerxSpatialRelation,
} from '@berx/spatial';
import type {
	BerxNearbyNow, BerxNearbyPlaceItem, BerxEvent, BerxUser, BerxFeedItem,
} from '@berx/api/types';
import type {BerxSpatialMapping} from '@berx/scenes';
import {
	mapNearbyEventToSpatial, mapNearbyPlaceToSpatial, mapEventToSpatial,
	mapUserToSpatial, mapFeedItemToSpatial,
} from '@berx/scenes';
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
	/**
	 * The platform's own voice — BerxWebVoice in a real session.
	 *
	 * WHY IT BELONGS HERE and not in a shell above: `listening` and
	 * `speaking` are two of the Core's eleven states, and until this
	 * existed nothing in the product could cause either. The recogniser
	 * was written, verified and imported by nobody, which is the same
	 * gap as the Core the shell never stepped — a module with a gate is
	 * not a feature.
	 *
	 * Optional, because a browser without a synthesiser is a real
	 * browser and gets the silent path rather than a broken one.
	 */
	voice?: BerxVoiceBackend;
	now?: () => number;
}

/**
 * How BERX sounds, taken from the state of the world rather than from a
 * guess about how anyone feels.
 *
 * The Core is already the world's state made physical; the voice is the
 * same state made audible, so there is one source for both. A tone
 * table keyed on the sentence's content would be a second opinion about
 * what is happening, and the two would drift.
 */
const TONE_OF: Readonly<Partial<Record<BerxCoreState, BerxVoiceEmotion>>> = Object.freeze({
	/* A failure is an invitation to try another way, not an apology. */
	error: 'holding',
	recovering: 'tender',
	discovering: 'warm',
	success: 'warm',
});

/**
 * How a spoken result becomes part of the world.
 *
 * THROUGH THE SAME MAPPERS EVERYTHING ELSE USES. This built its own
 * spatial objects by hand, cast past the compiler with `as never`, and
 * the casts hid that the shape was wrong in three ways at once: the
 * relation had no `id`, so all of them collapsed onto the key
 * `undefined` and only the last survived; `kind`/`weight` are called
 * `type`/`strength`; and `'mentions'` is not one of the relation types
 * the layout knows. The result was entities placed from a strength of
 * `undefined` — one on top of the camera, one behind it, one at NaN,
 * which is why the world went DARKER when it filled with what had just
 * been found.
 *
 * There is nothing for this file to invent: `mapNearbyPlaceToSpatial`
 * and the rest already turn exactly these payloads into exactly these
 * objects, with real energy from real live moments and real edges to
 * the places events happen at. Using them is both less code and the
 * only way the voice's world is the same world as everything else's.
 */
const ENTITIES: Readonly<Record<string, (got: unknown, now: number) => BerxSpatialMapping[]>> = Object.freeze({
	nearbyNow: (got, now) => {
		const r = got as Partial<BerxNearbyNow>;
		return [
			...(r?.events ?? []).map((e) => mapNearbyEventToSpatial(e)),
			...(r?.places ?? []).map((p) => mapNearbyPlaceToSpatial(p, now)),
		];
	},
	nearbyPlaces: (got, now) => ((got as {places?: BerxNearbyPlaceItem[]})?.places ?? [])
		.map((p) => mapNearbyPlaceToSpatial(p, now)),
	events: (got) => ((got as {events?: BerxEvent[]})?.events ?? [])
		.map((e) => mapEventToSpatial(e)),
	searchUsers: (got) => ((got as {users?: BerxUser[]})?.users ?? [])
		.map((u) => mapUserToSpatial(u)),
	feed: (got) => ((got as {posts?: BerxFeedItem[]})?.posts ?? [])
		.map((p) => mapFeedItemToSpatial(p)),
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
	/**
	 * Open the microphone and run whatever was said.
	 *
	 * The Core is in `listening` for exactly as long as the microphone
	 * is open — a real condition with a real duration, not a flourish
	 * played while one is pretended. Nothing heard leaves the world
	 * untouched and says so by going quiet.
	 *
	 * Someone talking while BERX is still working is routed to
	 * `interrupt` rather than queued behind it, because that is what
	 * happened.
	 */
	hear(timeoutMs?: number): Promise<BerxTurn | undefined>;
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
	/** What the last execution mapped, by spatial id. */
	const composed = new Map<string, BerxSpatialMapping>();

	const bridge: BerxWorldBridge = {
		async execute(plan: BerxPlan, situation: BerxSituation) {
			const results: BerxStepResult[] = [];
			let entities: {id: string; label?: string}[] = [];
			/* The full mapping for everything this step produced, so what
			   goes INTO the world is the mapper's object rather than a
			   second one assembled from an id and a label. */
			composed.clear();
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
					const mapped = ENTITIES[step.capability]?.(got, now()) ?? [];
					for (const m of mapped) composed.set(m.object.id, m);
					entities = mapped.map((m) => ({id: m.object.id, label: m.object.label}));
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

	/**
	 * Silence, from whichever side can produce it.
	 *
	 * `stopSpeaking` was handed in so a gate could watch the exact
	 * moment; a real session has a backend and does not need to be told
	 * how to stop its own mouth. Both, because a shell may want to cut
	 * something this module does not own.
	 */
	const silence = () => {
		options.stopSpeaking?.();
		options.voice?.stop();
	};

	/**
	 * BERX says the line, and the Core is in `speaking` for exactly as
	 * long as that takes.
	 *
	 * Not a duration anybody estimated: `speak` resolves when the
	 * utterance has FINISHED, so the state ends when the sound does. A
	 * timer here would drift on every line and be wrong on all of them.
	 *
	 * Most turns say nothing — the world answered and narrating it would
	 * be the assistant reading its own screen — so most turns never
	 * reach this state at all, which is correct rather than a gap.
	 */
	const speakIt = async (turn: BerxTurn, mine: number): Promise<void> => {
		const backend = options.voice;
		if (!backend?.available || turn.say.text === '') return;
		if (mine !== generation) return;
		options.host.coreCause({kind: 'speech', speaking: true});
		try {
			await backend.speak(turn.say.text, berxVoiceProsody(TONE_OF[turn.core.state] ?? 'calm'));
		} finally {
			/* Interrupted mid-line: the person is talking now and their
			   turn owns the Core. Reporting the end of a line nobody
			   heard the end of would pull it back out of `listening`. */
			if (mine === generation) options.host.coreCause({kind: 'speech', speaking: false});
		}
	};

	const run = async (utterance: string): Promise<BerxTurn> => {
		const mine = ++generation;
		running = true;
		try {
			/**
			 * THE CORE THE LOOP REASONS FROM IS THE ONE BEING RENDERED.
			 *
			 * The loop used to start from a Core of its own, carried in
			 * `state.core`, and the host's Core — the one the frame loop
			 * steps and the draw list draws — never heard about any of it.
			 * Both were correct and neither was the same object, so a
			 * spoken exchange photographed as a Core sitting in whatever
			 * state the last pointer event left it in.
			 *
			 * Taking the host's motion here also means the field carries on
			 * from exactly where it is: `berxCoreEnter` changes the target
			 * and never the field, so adopting mid-flight is continuous by
			 * construction rather than by luck.
			 */
			state = {...state, core: options.host.core};
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
			}, (cause) => {
				/**
				 * Every cause, straight into the rendered Core, as it
				 * happens — not at the end of the turn, because the whole
				 * point of SEARCHING is that it is visible WHILE a person
				 * waits.
				 *
				 * And a superseded turn moves nothing. Someone who cut in
				 * has replaced the question; the answer to the old one
				 * arriving late must not pull the Core into `discovering`
				 * over a search that is still running.
				 */
				if (mine === generation) options.host.coreCause(cause);
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
			await speakIt(turn, mine);
			return turn;
		} finally {
			if (mine === generation) running = false;
		}
	};

	/**
	 * Someone started talking while BERX was still going.
	 *
	 * A named function rather than a method, so `hear` can route into it
	 * without depending on how the caller destructured this object.
	 */
	const interrupt = async (utterance: string): Promise<BerxTurn> => {
		/**
		 * SILENCE FIRST, and before anything else in this function.
		 *
		 * A person who starts talking has already decided BERX should
		 * stop, and every millisecond of continued speech after that
		 * decision is the system talking over them. Reading the
		 * sentence, planning it and calling a server all come after.
		 */
		silence();
		/**
		 * And the context is KEPT. `state` is untouched here, so the
		 * new sentence is read against everything the conversation
		 * already knows — what was shown, what was dismissed, and what
		 * was last REQUESTED, which is what makes "нет, только
		 * итальянские" a correction rather than a fresh search.
		 */
		return run(utterance);
	};

	return {
		get busy() { return running; },
		interrupt,

		async say(utterance: string) {
			return run(utterance);
		},

		async hear(timeoutMs = 8000) {
			const backend = options.voice;
			if (!backend) return undefined;
			/* The microphone is open and carrying sound: a condition, for
			   as long as it lasts. */
			options.host.coreCause({kind: 'voice', speaking: true});
			let heard;
			try {
				heard = await backend.listen(timeoutMs);
			} catch {
				heard = undefined;
			}
			if (!heard || heard.transcript.trim() === '') {
				/* Nothing was said, so nothing happened. The Core comes
				   off `listening` and the world is exactly as it was —
				   an empty microphone is not a failure and must not
				   look like one. */
				options.host.coreCause({kind: 'voice', speaking: false});
				return undefined;
			}
			/* Someone talking while BERX is still working IS an
			   interruption, and routing it anywhere else would be
			   queueing a person behind a machine. */
			return running ? interrupt(heard.transcript) : run(heard.transcript);
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
		 *
		 * The object ingested is the MAPPER'S object: real energy from
		 * real live moments, the server's own timestamps, the edge from
		 * an event to the place it happens at. Plus one edge this
		 * binding is entitled to add, because it is the thing that
		 * happened: the viewer asked, and this came back to them. That
		 * edge is what the layout arranges the answer around, so it is
		 * not a decoration on the entity — it is its position.
		 */
		const world = options.host.world;
		if (turn.change !== 'composed' || !world) return;
		const viewer = world.viewer;
		for (const shown of turn.shown) {
			const mapping = composed.get(shown.id);
			if (!mapping) continue;
			const asked: BerxSpatialRelation[] = viewer && viewer !== shown.id
				? [{
					id: `${viewer}->${shown.id}:asked`,
					from: viewer,
					to: shown.id,
					/* 'related' is the honest type: the viewer asked a
					   question and this was in the answer. Nothing about
					   it is contained, located-at or created-by, and
					   claiming one of those would be inventing a fact
					   about the world from the fact that it was found. */
					type: 'related',
					strength: 0.5,
				}]
				: [];
			world.ingest([{
				object: mapping.object,
				relations: [...mapping.relations, ...asked],
				media: mapping.media,
			}]);
		}

		/**
		 * AND THEN FRAME IT.
		 *
		 * Composing a set and leaving the camera where it was is half a
		 * composition: BERX stood 8 metres back from the origin whatever
		 * was in front of it, and a real spoken search came to 6.5% of a
		 * desktop frame with two of five entities off it. A person who
		 * asks what is nearby should be looking AT what is nearby.
		 *
		 * The size comes from the canvas the session is actually drawing
		 * into, because framing is a question about a frame — the same
		 * world composes differently on a phone and a desktop, and using
		 * a fixed aspect here would frame for a screen nobody has.
		 */
		const canvas = options.host.canvas;
		world.frameWorld(canvas.width, canvas.height);
	}
}
