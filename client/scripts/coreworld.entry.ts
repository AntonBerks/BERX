/**
 * Browser entry for the Core-reaches-the-world gate.
 *
 * Renders the SAME world at different Core states. Nothing about the
 * scene changes between them — same entities, same camera, same lights,
 * same quality tier. The only difference is the Core's physical state,
 * so any difference in the frame is the Core reaching the pixels.
 */
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {BERX_CROSS_RENDERER_VIEWPORT, berxVolumetricFixtureFrame, berxVolumetricFixtureLighting} from '@berx/scenes';
import {
	berxBuildDrawList, berxCoreAt, berxCoreEnter, berxCoreStep, berxCoreTarget,
	type BerxCoreState,
} from '@berx/spatial';

const WIDTH = BERX_CROSS_RENDERER_VIEWPORT.width;
const HEIGHT = BERX_CROSS_RENDERER_VIEWPORT.height;

declare global {
	interface Window { BERX_CORE_WORLD: unknown }
}

window.BERX_CORE_WORLD = {
	async states(names: BerxCoreState[]) {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const canvas = document.createElement('canvas');
		canvas.width = WIDTH; canvas.height = HEIGHT;
		document.body.appendChild(canvas);
		const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
		if (!renderer) return {available: false as const, reason: 'no WebGPU device here'};
		renderer.setLighting(lighting);
		renderer.resize(WIDTH, HEIGHT);

		const out: Record<string, {pixels: number[]; density: number; keyIntensity: number; motes: number[]}> = {};
		for (const name of names) {
			/* Settled, so the comparison is between the states themselves
			   rather than between two points on the way to them. */
			let motion = berxCoreEnter(berxCoreAt('idle'), name);
			for (let i = 0; i < 240; i++) motion = berxCoreStep(motion, 1 / 60);
			const list = berxBuildDrawList(frame, {
				width: WIDTH, height: HEIGHT, lighting, core: motion.field,
			});
			renderer.draw(list, true, undefined, {});
			out[name] = {
				pixels: Array.from(await renderer.readback()),
				density: list.volumetric[0],
				keyIntensity: list.key.intensity,
				motes: list.particles.map((f) => f[8]),
			};
		}
		renderer.dispose();
		return {available: true as const, out, targets: Object.fromEntries(names.map((n) => [n, berxCoreTarget(n)]))};
	},
};
