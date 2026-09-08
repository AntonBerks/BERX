/**
 * The Core, photographed in every state a real spoken exchange reaches.
 *
 * Not a state machine driven from a test: the same host a browser
 * session runs, the same voice binding, the same slow client a person
 * would be waiting on — and a frame captured at each state the
 * conversation actually arrives in. If a state cannot be reached by
 * talking, it does not appear here, and that absence is the honest
 * answer about it.
 *
 * WHY THIS EXISTS AT ALL. Its first run photographed five frames and
 * every one of them was `aware`: the loop computed `understanding →
 * searching → discovering → error` correctly, carried them in
 * `turn.core`, and threw them away, because the Core the frame loop
 * stepped was a different object. Two verified subsystems, no seam
 * either of them could see. A camera found it in one run.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {berxVoiceToWorld} from '@berx/spatial-web/voiceToWorld';
import {BerxWebVoice} from '@berx/spatial-web/voiceWeb';
import {Berx5DWorldApp, BERX_CORE_STATES} from '@berx/spatial';
import type {BerxHeard, BerxVoiceBackend, BerxVoiceProsody} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_CORE_SHOT: unknown }
}

const settle = (frames: number) => new Promise<void>((resolve) => {
	let n = 0;
	const tick = () => (++n >= frames ? resolve() : requestAnimationFrame(tick));
	requestAnimationFrame(tick);
});

/** Wall-clock, so a state is held for a length of time a camera can use. */
const hold = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * A microphone and a speaker that this container does not have.
 *
 * NOT a stand-in for the voice binding, which is the real one: this
 * stands in for the DEVICE. A headless container has no audio input and
 * no audio output, so `listening` and `speaking` cannot be produced by
 * a real microphone here at any effort. What it does have is the same
 * BerxVoiceBackend interface BerxWebVoice implements, driven through
 * the same `hear()` and the same speak path — so the wiring under test
 * is the shipped wiring, and only the hardware is substituted.
 *
 * The durations are real waits, because a state with no duration is a
 * state no camera can photograph and no person can perceive.
 */
class BerxAbsentDevice implements BerxVoiceBackend {
	stopped = 0;
	constructor(private readonly said: string, private readonly listenMs = 700, private readonly speakMs = 700) {}
	get available(): boolean { return true; }
	async listen(): Promise<BerxHeard | undefined> {
		await hold(this.listenMs);
		return {transcript: this.said, confidence: 0.9, hesitationMs: this.listenMs};
	}
	async speak(_text: string, _prosody: BerxVoiceProsody): Promise<void> {
		await hold(this.speakMs);
	}
	stop(): void { this.stopped += 1; }
}

/** What the container really offers, reported rather than assumed. */
const device = () => {
	const real = new BerxWebVoice();
	return {
		synthesis: real.available,
		recogniser: real.canListen,
		voices: real.voices().length,
	};
};

let host: ReturnType<typeof createBerx5DWebHost> | undefined;
let voice: ReturnType<typeof berxVoiceToWorld> | undefined;
let pending: Promise<unknown> | undefined;
let backend: BerxAbsentDevice | undefined;

window.BERX_CORE_SHOT = {
	states: BERX_CORE_STATES,
	device,

	/**
	 * @param said what the microphone will report, when there is one
	 * @param withDevice whether this session has audio hardware at all
	 *
	 * Both passes are real sessions. A browser with no synthesiser gets
	 * the silent path — that is the shipped behaviour, not a reduced
	 * one — and in it the states the world reaches are HELD, because
	 * nothing is talking over them. With a device, BERX speaks, and
	 * `speaking` is what supersedes them. Photographing both is the only
	 * honest way to show all of it.
	 */
	async open(said: string, withDevice = true) {
		const canvas = document.getElementById('world') as HTMLCanvasElement;
		const world = new Berx5DWorldApp({viewerId: 'person:77'});
		host = createBerx5DWebHost({canvas, world});
		host.ingest([{
			object: mapUserToSpatial({
				guid: 77, username: 'ann', fullname: 'Анна', email: '',
				icon_url: '', profile_url: '', time_created: 0,
			}).object,
			relations: [], media: [],
		}]);
		host.start();

		/* Slow on purpose: a person waiting is what SEARCHING looks like,
		   and a client that answered instantly would never show it. */
		const nowS = Math.floor(Date.now() / 1000);
		const place = (guid: number, title: string, live = 0) => ({
			guid, title, category: null, cover_url: null, distance_km: 0.4,
			moments: Array.from({length: live}, (_, i) => ({id: guid * 10 + i, text: 'идёт сейчас', ends_at: nowS + 3600})),
			is_open_now: null,
		});
		const client = {
			async nearbyNow() {
				await hold(2600);
				/* The shape the endpoint really returns — the mappers read
				   `starts`, `place_guid` and `moments`, and a stub without
				   them would be testing a world that cannot exist. */
				return {
					events: [{guid: 908, title: 'Вечер импровизации', starts: nowS + 5400, place_guid: 4211, distance_km: 0.6}],
					places: [place(4211, 'Дом Культуры', 2), place(4212, 'Веранда')],
					open_now_available: false,
				};
			},
			async events() {
				await hold(2200);
				throw new Error('сеть не ответила');
			},
		};
		/* Long enough that a frame can be taken of it: a state shorter
		   than the time a screenshot costs is not photographable, and a
		   real synthesiser saying "3. Вот что происходит." takes about
		   this long anyway. */
		backend = withDevice ? new BerxAbsentDevice(said, 900, 3000) : undefined;
		voice = berxVoiceToWorld({
			host, client: client as unknown as Record<string, unknown>,
			location: () => ({lat: 55.75, lng: 37.62, atMs: Date.now()}),
			voice: backend,
		});
		await settle(60);
		return host.core.state;
	},

	/** Where the Core is right now, for the caller to label a frame with. */
	state() { return host!.core.state; },

	/** A hand lands on the world — the same event a pointer produces. */
	touch() {
		document.getElementById('world')!.dispatchEvent(new PointerEvent('pointerdown', {
			pointerType: 'touch', clientX: 550, clientY: 350, bubbles: true, isPrimary: true,
		}));
		return true;
	},

	/** Start something without waiting for it, so mid-flight can be caught. */
	begin(utterance: string) {
		pending = voice!.say(utterance);
		return true;
	},

	/** Open the microphone. The Core is in `listening` while it is open. */
	beginHearing() {
		pending = voice!.hear();
		return true;
	},

	async finish() {
		await pending;
		return host!.core.state;
	},

	/** Hold for a real length of time, then say where the Core is. */
	async hold(ms: number) {
		await hold(ms);
		return host!.core.state;
	},

	/**
	 * Wait until the Core is in a state, or give up and say what it is.
	 *
	 * A screenshot in a software rasteriser costs about a second, so
	 * counting milliseconds from the outside drifts past any state
	 * shorter than that — which is how `speaking` was missed. Waiting on
	 * the state itself does not drift, and reporting whatever was
	 * actually there on a timeout is the difference between a photograph
	 * and a caption.
	 */
	async until(want: string, timeoutMs = 12000) {
		const deadline = Date.now() + timeoutMs;
		while (host!.core.state !== want && Date.now() < deadline) await hold(16);
		return host!.core.state;
	},

	/** Where everything actually is, so a dark frame can be explained. */
	world() {
		const f = host!.world!.latestFrame;
		return {
			camera: f.camera.position,
			core: {state: host!.core.state, field: host!.core.field},
			objects: f.world.objects.map((o) => ({
				id: o.id,
				p: o.transform.position,
				visible: o.visible,
				opacity: o.material?.opacity,
			})),
		};
	},

	/** Turn the air off, to tell the void from what is floating in it. */
	air(on: boolean) {
		host!.setVolumetric(on);
		host!.setParticles(on);
		return true;
	},

	stop() { host?.stop(); return true; },
};
