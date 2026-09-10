/**
 * Browser entry for the voice-wiring gate.
 *
 * Drives a REAL host session with a REAL voice-to-world binding, against
 * a client that answers like the server does — and, for the failure
 * case, against one that does not. What is exercised is the path, not
 * the modules: every module on both sides of it already had a gate, and
 * a product session still had no way from a sentence to the world.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {berxVoiceToWorld} from '@berx/spatial-web/voiceToWorld';
import {Berx5DWorldApp, berxSpeechChain} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_VOICE_WIRE: unknown; BERX_5D_CHAIN: typeof berxSpeechChain }
}

/**
 * Where the person is, NOW.
 *
 * The timestamp has to be current: berxSituation discards a fix older
 * than ten minutes, because a location old enough to be somewhere else
 * is not a location. A fixed past timestamp here made the intent report
 * a missing location and the plan refuse to run — the code being right
 * and the fixture being wrong.
 */
const HERE = () => ({lat: 55.75, lng: 37.62, atMs: Date.now()});

/**
 * PAYLOADS THE SHAPE THE SERVER REALLY SENDS.
 *
 * These carried only `guid` and `title`, which was enough while this
 * file assembled spatial objects by hand and not one field more was
 * read. Now the real mappers run on them — they read `starts`,
 * `place_guid`, `moments`, `cover_url` — so a stub missing those is a
 * stub testing a world that cannot exist. See BerxNearbyPlaceItem and
 * BerxNearbyEventItem in @berx/api/types.
 */
const NOW_S = () => Math.floor(Date.now() / 1000);
const place = (guid: number, title: string, live = 0) => ({
	guid, title, category: null, cover_url: null, distance_km: 0.4,
	moments: Array.from({length: live}, (_, i) => ({id: guid * 10 + i, text: 'идёт сейчас', ends_at: NOW_S() + 3600})),
	is_open_now: null,
});
const nearbyEvent = (guid: number, title: string, placeGuid: number) => ({
	guid, title, starts: NOW_S() + 5400, place_guid: placeGuid, distance_km: 0.6,
});
const fullEvent = (guid: number, title: string) => ({
	guid, title, description: '', category: null, starts: NOW_S() + 7200, ends: null,
	location: null, place: null, capacity: null, seats_left: null, attendee_count: 3,
	owner_guid: 77, cover_url: null, has_ended: false, is_going: false,
});

/** A client that answers the way the real one does, shape for shape. */
const answering = () => {
	const calls: string[] = [];
	return {
		calls,
		async nearbyNow(lat: number, lng: number) {
			calls.push(`nearbyNow(${lat},${lng})`);
			return {
				events: [nearbyEvent(908, 'Вечер импровизации', 4211)],
				places: [place(4211, 'Дом Культуры', 2), place(4212, 'Веранда')],
				open_now_available: false,
			};
		},
	};
};

/** One that is reachable and refuses, which is what a real outage is. */
const failing = () => {
	const calls: string[] = [];
	return {
		calls,
		async nearbyNow() {
			calls.push('nearbyNow');
			throw new Error('сеть не ответила');
		},
	};
};

/**
 * A client that answers SLOWLY, so a person can cut in while it is
 * still working. The delay is what makes barge-in observable at all.
 */
const slow = (ms: number) => {
	const calls: string[] = [];
	return {
		calls,
		async events() {
			calls.push('events');
			await new Promise((r) => setTimeout(r, ms));
			return {events: [fullEvent(1, 'Концерт'), fullEvent(2, 'Лекция')]};
		},
		async nearbyPlaces() {
			calls.push('nearbyPlaces');
			await new Promise((r) => setTimeout(r, ms));
			return {places: [place(10, 'Траттория'), place(11, 'Остерия')]};
		},
		async feed() {
			calls.push('feed');
			await new Promise((r) => setTimeout(r, ms));
			return {posts: [{
				guid: 20, text: 'что-то ещё', time_created: NOW_S(),
				owner_guid: 77, owner_username: 'ann',
			}]};
		},
	};
};

const build = (client: Record<string, unknown>) => {
	const canvas = document.createElement('canvas');
	canvas.width = 480; canvas.height = 360;
	document.body.appendChild(canvas);
	const world = new Berx5DWorldApp({viewerId: 'person:77'});
	const host = createBerx5DWebHost({canvas, world});
	const me = mapUserToSpatial({
		guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0,
	});
	host.ingest([{object: me.object, relations: [], media: []}]);
	host.start();
	const silenced: number[] = [];
	const voice = berxVoiceToWorld({
		host, client, location: HERE,
		stopSpeaking: () => silenced.push(Date.now()),
	});
	return {host, world, voice, canvas, silenced};
};

const snapshot = (world: Berx5DWorldApp) => ({
	ids: world.latestFrame.world.objects.map((o) => o.id),
	count: world.latestFrame.world.objects.length,
});

/**
 * A provider that fails, one that works, and one that only listens.
 *
 * No fake voice: none of these makes a sound. What is being measured is
 * the CHAIN — that a failing provider is fallen back from, that the
 * fallback is reported, that a language reaches the provider, and that
 * stop() reaches all of them. A real text-to-speech service is a
 * provider like these with an HTTP call inside `speak`.
 */
const provider = (id: string, opts: {speaks?: boolean; listens?: boolean; offDevice?: boolean; languages?: string[]; fails?: boolean} = {}) => {
	const said: {text: string; language?: string}[] = [];
	let stopped = 0;
	return {
		said,
		get stopped() { return stopped; },
		capability: {
			id,
			speaks: opts.speaks !== false,
			listens: opts.listens === true,
			offDevice: opts.offDevice === true,
			languages: opts.languages ?? [],
		},
		available: opts.speaks !== false,
		async speak(text: string) {
			if (opts.fails) throw new Error(`${id} refused`);
			said.push({text});
		},
		async speakIn(text: string, _p: unknown, language: string) {
			if (opts.fails) throw new Error(`${id} refused`);
			said.push({text, language});
		},
		async listen() {
			return opts.listens ? {transcript: `heard by ${id}`, confidence: 0.9, hesitationMs: 10} : undefined;
		},
		stop() { stopped++; },
	};
};

window.BERX_VOICE_WIRE = {
	/** The provider chain: fallback, language, reporting, stop. */
	async providers() {
		const log: string[] = [];
		const paid = provider('paid-tts', {languages: ['ru-RU', 'en-GB'], offDevice: true, fails: true});
		const platform = provider('web-speech', {languages: []});
		const ears = provider('mic', {speaks: false, listens: true});
		const chain = berxSpeechChain(
			[paid, platform, ears],
			{language: 'ru-RU', onProvider: (id: string, what: string, detail?: string) => log.push(`${id}:${what}${detail ? `(${detail})` : ''}`)},
		);
		await chain.speak('привет', {rate: 1, pitch: 1, pauseMs: 0});
		const heard = await chain.listen(50);
		chain.setLanguage('en-GB');
		await chain.speak('hello', {rate: 1, pitch: 1, pauseMs: 0});
		chain.stop();
		return {
			capability: chain.capability,
			providers: chain.providers.map((c: {id: string}) => c.id),
			using: chain.using,
			log,
			paidSaid: paid.said.length,
			platformSaid: platform.said,
			heard: heard?.transcript,
			stopped: [paid.stopped, platform.stopped, ears.stopped],
			language: chain.language,
		};
	},

	/** Is the platform's own recogniser what the shell would listen with? */
	recogniser() {
		const w = window as unknown as {SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown};
		return {present: Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition)};
	},

	async conversation() {
		const client = answering();
		const {host, world, voice} = build(client as unknown as Record<string, unknown>);
		const before = snapshot(world);

		const asked = await voice.say('что происходит рядом?');
		const afterAsk = snapshot(world);

		const second = await voice.say('а второй?');
		const afterSecond = snapshot(world);

		const dismissed = await voice.say('убери это');

		host.stop();
		return {
			calls: client.calls,
			before, afterAsk, afterSecond,
			asked: {
				intent: asked.intent.kind, change: asked.change, said: asked.say.text,
				shown: asked.shown.map((s) => ({id: s.id, label: s.label})),
				core: asked.core.state,
			},
			second: {
				intent: second.intent.kind, change: second.change, said: second.say.text,
				objectId: second.intent.objectId, core: second.core.state,
			},
			dismissed: {
				intent: dismissed.intent.kind, change: dismissed.change,
				left: dismissed.shown.map((s) => s.id), core: dismissed.core.state,
			},
		};
	},

	async serverFails() {
		const client = failing();
		const {host, world, voice} = build(client as unknown as Record<string, unknown>);
		const before = snapshot(world);
		const turn = await voice.say('что происходит рядом?');
		const after = snapshot(world);
		host.stop();
		return {
			calls: client.calls,
			before, after,
			ok: turn.outcome.ok, change: turn.change,
			shown: turn.shown.length, said: turn.say.text, core: turn.core.state,
			reason: turn.outcome.stoppedAt?.reason,
		};
	},

	/**
	 * BARGE-IN: someone talks while BERX is still working.
	 *
	 * The slow client makes the window real. What is measured is not
	 * that an interruption is ACCEPTED — anything accepts a second call —
	 * but that speaking stops immediately, that the superseded turn does
	 * NOT rearrange the world when it finally returns, and that the
	 * correction carries the original request forward instead of starting
	 * over.
	 */
	async bargeIn() {
		const client = slow(180);
		const {host, world, voice, silenced} = build(client as unknown as Record<string, unknown>);

		/* "Покажи события" — starts, and takes its time. */
		const first = voice.say('покажи события');
		await new Promise((r) => setTimeout(r, 40));
		const busyDuring = voice.busy;

		/* "Нет, только вечерние" — cut in before the first came back. */
		const second = await voice.interrupt('нет, только вечерние');
		const firstTurn = await first;

		const shown = world.latestFrame.world.objects.map((o) => o.id);
		host.stop();
		return {
			calls: client.calls,
			busyDuring,
			silencedCount: silenced.length,
			first: {intent: firstTurn.intent.kind, change: firstTurn.change},
			second: {
				intent: second.intent.kind,
				refining: second.intent.refining,
				change: second.change,
				shown: second.shown.map((x) => x.label),
				capability: second.plan.steps.map((st) => st.capability).filter(Boolean),
			},
			/* what is actually in the world at the end */
			worldIds: shown,
		};
	},

	/**
	 * DOES THE VOICE'S CORE REACH THE CORE THAT IS DRAWN?
	 *
	 * Every other Core check in this file reads `turn.core` — the state
	 * the loop computed. That is the module's own answer about itself,
	 * and it was right the whole time while the Core a person actually
	 * saw sat in whatever state the last pointer event left it in. The
	 * loop had a Core, the host had a Core, and they were different
	 * objects.
	 *
	 * So this reads `host.core` — the motion the frame loop steps and the
	 * draw list draws — and it samples it WHILE a turn is in the air,
	 * because the whole point of SEARCHING is that it is visible while
	 * someone waits. Delete the line that forwards causes into the host
	 * and every state below collapses to the one the pointer set.
	 */
	async coreInTheFrame() {
		const calls: string[] = [];
		const client = {
			calls,
			async nearbyNow(lat: number, lng: number) {
				calls.push(`nearbyNow(${lat},${lng})`);
				await new Promise((r) => setTimeout(r, 220));
				return {
					events: [nearbyEvent(908, 'Вечер импровизации', 4211)],
					places: [place(4211, 'Дом Культуры', 1)],
					open_now_available: false,
				};
			},
			async events() {
				calls.push('events');
				await new Promise((r) => setTimeout(r, 220));
				throw new Error('сеть не ответила');
			},
		};
		const {host, canvas} = build(client as unknown as Record<string, unknown>);
		const voice = berxVoiceToWorld({
			host, client: client as unknown as Record<string, unknown>, location: HERE,
		});

		/* Everything the rendered Core is, for as long as this runs. Not
		   the loop's copy — the host's. */
		const seen: string[] = [];
		const watch = setInterval(() => {
			if (seen[seen.length - 1] !== host.core.state) seen.push(host.core.state);
		}, 8);
		seen.push(host.core.state);

		const atRest = host.core.state;

		/* A hand on the world: the same event a pointer produces. */
		canvas.dispatchEvent(new PointerEvent('pointerdown', {
			pointerType: 'touch', clientX: 200, clientY: 180, bubbles: true, isPrimary: true,
		}));
		await new Promise((r) => setTimeout(r, 40));
		const afterTouch = host.core.state;

		/* A real question against a client that takes its time. */
		const pending = voice.say('что происходит рядом?');
		await new Promise((r) => setTimeout(r, 90));
		const duringSearch = host.core.state;
		const previousDuringSearch = host.core.previous;
		await pending;
		/**
		 * A BEAT, because a conversation has one.
		 *
		 * The first version of this ran the next sentence in the same
		 * microtask the previous one resolved in, so DISCOVERING existed
		 * for less wall time than one tick of the sampler and the path
		 * read `idle → aware → searching`. The states were all reached —
		 * the direct readings below say so — and the sampler was right
		 * that they were never held. A person gets to see a result before
		 * being asked to say the next thing.
		 */
		await new Promise((r) => setTimeout(r, 80));
		const afterResults = host.core.state;

		/* And one the server refuses. */
		const failing = voice.say('покажи события');
		await new Promise((r) => setTimeout(r, 90));
		const duringFailing = host.core.state;
		await failing;
		await new Promise((r) => setTimeout(r, 80));
		const afterFailure = host.core.state;

		clearInterval(watch);
		host.stop();
		return {
			calls,
			atRest, afterTouch, duringSearch, previousDuringSearch,
			afterResults, duringFailing, afterFailure,
			seen,
		};
	},

	/**
	 * WHERE WHAT WAS FOUND ACTUALLY LANDS.
	 *
	 * The world-changed gate above counts objects, and counting is what
	 * let this through: three entities went in, three were counted, and
	 * one of them was at NaN while another sat on top of the camera. The
	 * cause was a hand-built relation cast past the compiler with `as
	 * never` — no `id`, so all three collapsed onto the key `undefined`;
	 * `kind`/`weight` where the world wants `type`/`strength`, so the
	 * layout placed things from a strength that did not exist.
	 *
	 * A frame is what caught it — the world went DARKER when it filled —
	 * so this measures what a frame would show: a finite position for
	 * everything, an edge per entity that survived ingest, and no two
	 * things occupying the same point.
	 */
	async placement() {
		const client = answering();
		const {host, world, voice} = build(client as unknown as Record<string, unknown>);
		const turn = await voice.say('что происходит рядом?');
		const objects = world.latestFrame.world.objects.map((o) => ({
			id: o.id, p: o.transform.position, label: o.label,
		}));
		const edges = world.allRelations.map((r) => ({id: r.id, from: r.from, to: r.to, type: r.type, strength: r.strength}));
		host.stop();
		const finite = (v: {x: number; y: number; z: number}) =>
			Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
		let closest = Infinity;
		for (let i = 0; i < objects.length; i++) {
			for (let j = i + 1; j < objects.length; j++) {
				const a = objects[i].p, b = objects[j].p;
				if (!finite(a) || !finite(b)) continue;
				closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
			}
		}
		return {
			shown: turn.shown.length,
			objects,
			atNonPosition: objects.filter((o) => !finite(o.p)).map((o) => o.id),
			edges,
			wellFormedEdges: edges.filter((e) =>
				typeof e.id === 'string' && e.id.length > 0
				&& typeof e.type === 'string' && Number.isFinite(e.strength)).length,
			closest,
			labels: objects.map((o) => o.label).filter(Boolean).length,
		};
	},

	/** A capability the client does not have must fail, not be invented. */
	async missingCapability() {
		const {host, world, voice} = build({});
		const before = snapshot(world);
		const turn = await voice.say('что происходит рядом?');
		const after = snapshot(world);
		host.stop();
		return {
			before, after, ok: turn.outcome.ok, change: turn.change,
			reason: turn.outcome.stoppedAt?.reason, said: turn.say.text,
		};
	},
};
