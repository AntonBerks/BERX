/**
 * Browser entry for the pipeline gate.
 *
 * Renders the same world with different passes turned off, and hands
 * back what each backend REPORTED encoding — not what it drew. The
 * frames are checked elsewhere; this is about whether the two web
 * renderers run the same sequence, and whether turning one pass off
 * removes exactly that pass and the ones that genuinely depend on it.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {BERX_CROSS_RENDERER_VIEWPORT, berxVolumetricFixtureFrame, berxVolumetricFixtureLighting} from '@berx/scenes';
import {berxBuildDrawList} from '@berx/spatial';

const fresh = () => {
	const c = document.createElement('canvas');
	c.width = BERX_CROSS_RENDERER_VIEWPORT.width;
	c.height = BERX_CROSS_RENDERER_VIEWPORT.height;
	document.body.appendChild(c);
	return c;
};

/** The combinations worth asking about, named so a failure says which. */
const CASES: {name: string; options: Record<string, boolean>}[] = [
	{name: 'everything', options: {}},
	{name: 'no occlusion', options: {ssao: false}},
	{name: 'no air', options: {volumetric: false}},
	{name: 'no motes', options: {particles: false}},
	{name: 'no shadows', options: {shadows: false}},
	{name: 'nothing optional', options: {ssao: false, volumetric: false, particles: false, shadows: false}},
];

declare global {
	interface Window { BERX_PIPELINE_PROBE: unknown }
}

window.BERX_PIPELINE_PROBE = {
	webgl2() {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const out: Record<string, string[]> = {};
		for (const c of CASES) {
			const canvas = fresh();
			const renderer = new BerxThreeRuntimeRenderer(canvas);
			renderer.setLighting(lighting);
			renderer.resize(canvas.width, canvas.height);
			renderer.render(frame, c.options as never);
			out[c.name] = renderer.frameStats.stages ?? [];
		}
		return out;
	},

	async webgpu() {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const canvas = fresh();
		const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
		if (!renderer) return {available: false as const, reason: 'no WebGPU device here'};
		renderer.setLighting(lighting);
		renderer.resize(canvas.width, canvas.height);
		const out: Record<string, string[]> = {};
		for (const c of CASES) {
			const list = berxBuildDrawList(frame, {
				width: canvas.width, height: canvas.height, lighting,
				shadows: c.options.shadows,
			});
			renderer.draw(list, true, undefined, c.options as never);
			await renderer.readback();
			out[c.name] = renderer.frameStats.stages ?? [];
		}
		renderer.dispose();
		return {available: true as const, out};
	},
};
