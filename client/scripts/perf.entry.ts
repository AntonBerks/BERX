/**
 * Browser entry for the performance gate.
 *
 * WHAT THIS CAN AND CANNOT MEASURE, stated first because the difference
 * decides what the gate is allowed to claim. Chromium falls back to a
 * software rasteriser in this container, so a frames-per-second number
 * taken here would describe llvmpipe rather than a phone, and any budget
 * asserted against it would be a number about CI. What IS real and what
 * a regression shows up in is the RATIO: the same world, the same
 * camera, the same frame count, with a pass on and off. A pass that
 * doubles in cost doubles here too.
 *
 * So the gate measures relative cost and resource growth, and says
 * plainly that absolute frame rate is not available. A budget nobody can
 * verify is worse than an honest blocker.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {
	BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame,
	berxVolumetricFixtureFrame, berxVolumetricFixtureLighting,
} from '@berx/scenes';
import {berxBuildDrawList, berxRenderQuality, type BerxRenderTier} from '@berx/spatial';

const W = BERX_CROSS_RENDERER_VIEWPORT.width;
const H = BERX_CROSS_RENDERER_VIEWPORT.height;

const fresh = () => {
	const c = document.createElement('canvas');
	c.width = W; c.height = H;
	document.body.appendChild(c);
	return c;
};

/** Median, because one scheduling hitch should not become the answer. */
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

declare global {
	interface Window { BERX_PERF: unknown }
}

window.BERX_PERF = {
	/** What each pass costs on WebGPU, and what each tier costs. */
	async webgpu(frames = 24) {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const canvas = fresh();
		const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
		if (!renderer) return {available: false as const, reason: 'no WebGPU device here'};
		renderer.setLighting(lighting);
		renderer.resize(W, H);

		const time = async (list: ReturnType<typeof berxBuildDrawList>, options: Record<string, boolean>) => {
			/* Warm up: the first frames build pipelines and populate
			   caches, and counting them would be timing the compiler. */
			for (let i = 0; i < 3; i++) renderer.draw(list, true, undefined, options as never);
			await renderer.readback();
			const each: number[] = [];
			for (let i = 0; i < frames; i++) {
				const t0 = performance.now();
				renderer.draw(list, true, undefined, options as never);
				/* A readback is the only way to wait for the GPU from here.
				   Its own cost is the same in every row, so the DIFFERENCE
				   between rows is still the pass's. */
				await renderer.readback();
				each.push(performance.now() - t0);
			}
			return median(each);
		};

		const at = (tier: BerxRenderTier) => berxBuildDrawList(frame, {
			width: W, height: H, lighting, quality: berxRenderQuality(tier),
		});
		const high = at('high');
		const passes = {
			all: await time(high, {}),
			noVolumetric: await time(high, {volumetric: false}),
			noParticles: await time(high, {particles: false}),
			noSsao: await time(high, {ssao: false}),
			bare: await time(high, {volumetric: false, particles: false, ssao: false, shadows: false}),
		};
		const tiers: Record<string, number> = {};
		for (const tier of ['ultra', 'high', 'medium', 'low'] as BerxRenderTier[]) {
			tiers[tier] = await time(at(tier), {});
		}
		const errors = [...renderer.errors];
		renderer.dispose();
		return {available: true as const, passes, tiers, errors};
	},

	/**
	 * Does anything grow?
	 *
	 * Two questions, because they fail differently: rendering the same
	 * world many times over catches a per-frame allocation, and switching
	 * worlds catches a per-scene one that is never released.
	 */
	memory(rounds = 120) {
		const a = berxVolumetricFixtureFrame();
		const b = berxCrossRendererFrame();
		const canvas = fresh();
		const renderer = new BerxThreeRuntimeRenderer(canvas);
		renderer.setLighting(berxVolumetricFixtureLighting());
		renderer.resize(W, H);
		const heap = () => (performance as unknown as {memory?: {usedJSHeapSize: number}}).memory?.usedJSHeapSize ?? 0;
		for (let i = 0; i < 20; i++) renderer.render(a, {});
		const beforeSame = heap();
		for (let i = 0; i < rounds; i++) renderer.render(a, {});
		const afterSame = heap();
		for (let i = 0; i < rounds; i++) renderer.render(i % 2 ? a : b, {});
		const afterSwitch = heap();
		return {
			beforeSame, afterSame, afterSwitch, rounds,
			/* What the renderer says it is holding. A leak the JS heap
			   hides still shows up here. */
			stats: renderer.frameStats,
			available: heap() > 0,
		};
	},
};
