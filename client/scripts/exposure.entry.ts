/**
 * Browser entry for the exposure gate.
 *
 * Renders a REAL frame through the real host and reads back the pixels
 * the exposure produced. The point is not that a curve is implemented —
 * a unit test can say that — but that the number the shared core
 * predicts is the number a GPU puts on screen, and that a brand colour
 * arrives as the colour it was authored as.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {Berx5DWorldApp, berxAppearance, berxRadianceFor, BERX_EXPOSURE, berxShoulder} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_EXPOSURE_SHOT: unknown }
}

const settle = (frames: number) => new Promise<void>((resolve) => {
	let n = 0;
	const tick = () => (++n >= frames ? resolve() : requestAnimationFrame(tick));
	requestAnimationFrame(tick);
});

window.BERX_EXPOSURE_SHOT = {
	async run() {
		const canvas = document.getElementById('world') as HTMLCanvasElement;
		const world = new Berx5DWorldApp({viewerId: 'person:77'});
		const host = createBerx5DWebHost({canvas, world});
		host.ingest([{
			object: mapUserToSpatial({
				guid: 77, username: 'ann', fullname: 'Анна', email: '',
				icon_url: '', profile_url: '', time_created: 0,
			}).object,
			relations: [], media: [],
		}]);
		host.start();

		/* The air off, so the void is the VOID rather than lit air over
		   it — the question here is what the clear colour becomes, and
		   in-scatter would be answering a different one. */
		host.setVolumetric(false);
		host.setParticles(false);
		await settle(40);

		const gl = canvas.getContext('webgl2');
		const read = (x: number, y: number) => {
			const px = new Uint8Array(4);
			gl!.readPixels(x, y, 1, 1, gl!.RGBA, gl!.UNSIGNED_BYTE, px);
			return [px[0], px[1], px[2]];
		};
		/* A corner: nothing is composed there, so it is the room itself. */
		const voidPixel = read(4, 4);
		host.stop();
		return {
			voidPixel,
			exposure: BERX_EXPOSURE,
			/* The core's own predictions, for the gate to compare against
			   the bytes above rather than against another opinion. */
			predictedVoid: [7, 8, 10],
			roundTrip: [7, 13, 21, 214].map((v) => Math.round(berxShoulder(berxRadianceFor(v / 255) * BERX_EXPOSURE) * 255)),
			graphite: Math.round(berxAppearance(0x15 / 255) * 255),
			background: Math.round(berxAppearance(7 / 255) * 255),
		};
	},
};
