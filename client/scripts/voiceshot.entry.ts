/**
 * A frame BEFORE and AFTER a spoken sentence, from a real session.
 *
 * The gate proves the entity count changed. This proves a PERSON would
 * see it change: the same host, the same canvas, the same renderer, one
 * utterance between the two readbacks.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {berxVoiceToWorld} from '@berx/spatial-web/voiceToWorld';
import {Berx5DWorldApp} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_VOICE_SHOT: unknown }
}

const settle = (frames: number) => new Promise<void>((resolve) => {
	let n = 0;
	const tick = () => (++n >= frames ? resolve() : requestAnimationFrame(tick));
	requestAnimationFrame(tick);
});

window.BERX_VOICE_SHOT = {
	async run() {
		const canvas = document.getElementById('world') as HTMLCanvasElement;
		const world = new Berx5DWorldApp({viewerId: 'person:77'});
		const host = createBerx5DWebHost({canvas, world});
		const me = mapUserToSpatial({
			guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0,
		});
		host.ingest([{object: me.object, relations: [], media: []}]);
		host.start();

		const client = {
			async nearbyNow() {
				return {
					events: [{guid: 908, title: 'Вечер импровизации'}],
					places: [
						{guid: 4211, title: 'Дом Культуры'},
						{guid: 4212, title: 'Веранда'},
						{guid: 4213, title: 'Подвал'},
					],
				};
			},
		};
		const voice = berxVoiceToWorld({
			host, client: client as unknown as Record<string, unknown>,
			location: () => ({lat: 55.75, lng: 37.62, atMs: Date.now()}),
		});

		await settle(120);
		(window as unknown as {__before: number}).__before = world.latestFrame.world.objects.length;

		return {
			ready: true,
			before: world.latestFrame.world.objects.length,
			async speak() {
				const turn = await voice.say('что происходит рядом?');
				await settle(180);
				return {
					change: turn.change,
					core: turn.core.state,
					said: turn.say.text,
					after: world.latestFrame.world.objects.length,
					shown: turn.shown.map((s) => s.label),
				};
			},
		};
	},
};
