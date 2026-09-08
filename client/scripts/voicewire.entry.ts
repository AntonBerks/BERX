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
import {Berx5DWorldApp} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_VOICE_WIRE: unknown }
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

/** A client that answers the way the real one does, shape for shape. */
const answering = () => {
	const calls: string[] = [];
	return {
		calls,
		async nearbyNow(lat: number, lng: number) {
			calls.push(`nearbyNow(${lat},${lng})`);
			return {
				events: [{guid: 908, title: 'Вечер импровизации'}],
				places: [
					{guid: 4211, title: 'Дом Культуры'},
					{guid: 4212, title: 'Веранда'},
				],
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
	const voice = berxVoiceToWorld({host, client, location: HERE});
	return {host, world, voice, canvas};
};

const snapshot = (world: Berx5DWorldApp) => ({
	ids: world.latestFrame.world.objects.map((o) => o.id),
	count: world.latestFrame.world.objects.length,
});

window.BERX_VOICE_WIRE = {
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
