/**
 * Browser entry for the wiring gate.
 *
 * Starts a REAL host session — the same berxHost a browser session runs,
 * not the modules it is made of — and reads back what that session
 * actually did. Driving the modules directly is what let the tiers and
 * the Core sit unwired behind passing gates for a whole branch.
 */
import {createBerx5DWebHost} from '@berx/spatial-web/runtimeHost5d';
import {berxBuildDrawList, berxVolumetricUniform, berxCoreTarget, BERX_CORE_REST} from '@berx/spatial';
import {Berx5DWorldApp} from '@berx/spatial';
import {mapUserToSpatial} from '@berx/scenes';

declare global {
	interface Window { BERX_WIRING: unknown }
}

const settle = (frames: number) => new Promise<void>((resolve) => {
	let n = 0;
	const tick = () => (++n >= frames ? resolve() : requestAnimationFrame(tick));
	requestAnimationFrame(tick);
});

window.BERX_WIRING = {
	async run() {
		const canvas = document.createElement('canvas');
		canvas.width = 480; canvas.height = 360;
		document.body.appendChild(canvas);

		/* A real world in a real host — the same object a browser session
		   builds, not a fixture handed to a module. */
		const world = new Berx5DWorldApp({viewerId: 'person:77'});
		const host = createBerx5DWebHost({canvas, world});
		const user = {guid: 77, username: 'ann', fullname: 'Анна', email: '', icon_url: '', profile_url: '', time_created: 0};
		const mapped = mapUserToSpatial(user);
		host.ingest([{object: mapped.object, relations: [], media: []}]);
		host.start();

		/* the field at rest, before anything has happened */
		const atStart = host.core.state;
		const first = {...host.core.field};
		await settle(30);
		const idleFrames = 30;
		const idleState = host.core.state;

		/* Something that really happens: a person puts a hand on the
		   world. Not a synthetic call into the Core — the same event a
		   pointer produces. */
		canvas.dispatchEvent(new PointerEvent('pointerdown', {
			pointerType: 'touch', clientX: 200, clientY: 180, bubbles: true, isPrimary: true,
		}));
		await settle(30);
		const afterEvent = host.core.state;
		const later = {...host.core.field};

		const travelled = Math.abs(later.energy - first.energy)
			+ Math.abs(later.reach - first.reach)
			+ Math.abs(later.coherence - first.coherence);

		/* The draw list a frame in this state really produces. */
		const tier = host.renderTier;
		const list = berxBuildDrawList(world.latestFrame, {
			width: canvas.width, height: canvas.height,
			quality: tier.quality, core: host.core.field,
		});
		const baseDensity = berxVolumetricUniform()[0];
		const expectedDensity = baseDensity * Math.max(0.4, Math.min(2.5, host.core.field.haze / BERX_CORE_REST.haze));

		host.stop();
		return {
			tier,
			core: {
				atStart, afterEvent, idleFrames,
				idleStaysPut: idleState === atStart,
				moved: travelled > 1e-4,
				travelled,
				frames: 60,
				baseDensity,
				expectedDensity,
			},
			list: {
				volumetric: list.volumetric,
				airDensity: list.volumetric[0],
				motes: list.particles.map((f) => f[8]),
			},
			targets: {aware: berxCoreTarget('aware').energy, idle: berxCoreTarget('idle').energy},
		};
	},
};
