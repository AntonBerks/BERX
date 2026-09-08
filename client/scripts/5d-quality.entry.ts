/**
 * Browser entry for the quality gate.
 *
 * The core half of that gate multiplies the tier table out and checks it
 * descends. This half renders it: the same world at each of the four
 * tiers, and the frame each one produces. A table that descends on paper
 * and never reaches a pixel would pass the first half and be worthless.
 *
 * It also renders the one case no other gate covers — the air with
 * occlusion turned OFF. The two are separate passes that happen to share
 * a G-buffer, and gating one on the other is a mistake each backend can
 * make independently. WebGPU had made it.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {
	BERX_CROSS_RENDERER_VIEWPORT,
	berxVolumetricFixtureFrame, berxVolumetricFixtureLighting,
} from '@berx/scenes';
import {berxBuildDrawList, berxRenderQuality, type BerxRenderTier} from '@berx/spatial';

const fresh = () => {
	const c = document.createElement('canvas');
	c.width = BERX_CROSS_RENDERER_VIEWPORT.width;
	c.height = BERX_CROSS_RENDERER_VIEWPORT.height;
	document.body.appendChild(c);
	return c;
};

declare global {
	interface Window { BERX_QUALITY: unknown }
}

window.BERX_QUALITY = {
	/** The same world at each tier, on both web backends. */
	async tiers() {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const out: Record<string, unknown> = {};
		for (const tier of ['ultra', 'high', 'medium', 'low'] as BerxRenderTier[]) {
			const quality = berxRenderQuality(tier);
			const canvas = fresh();
			const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
			if (!renderer) return {available: false as const};
			renderer.setLighting(lighting);
			renderer.resize(canvas.width, canvas.height);
			const list = berxBuildDrawList(frame, {width: canvas.width, height: canvas.height, lighting, quality});
			renderer.draw(list, true, undefined, {});
			const withAir = Array.from(await renderer.readback());
			renderer.draw(list, true, undefined, {volumetric: false});
			const noAir = Array.from(await renderer.readback());
			out[tier] = {
				steps: list.volumetric[4], scale: list.volumetric[5],
				shadowMapSize: list.shadow?.mapSize, ssaoSamples: list.ssaoSamples,
				particles: list.particles.map((f) => f[8]),
				withAir, noAir, errors: [...renderer.errors],
			};
			renderer.dispose();
		}
		return {available: true as const, out};
	},

	/** The air with occlusion turned OFF — the coupling this run is checking. */
	async airWithoutSSAO() {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const canvas = fresh();
		const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
		if (!renderer) return {available: false as const};
		renderer.setLighting(lighting);
		renderer.resize(canvas.width, canvas.height);
		const list = berxBuildDrawList(frame, {width: canvas.width, height: canvas.height, lighting});
		renderer.draw(list, true, undefined, {ssao: false, volumetric: true});
		const gpuAir = Array.from(await renderer.readback());
		renderer.draw(list, true, undefined, {ssao: false, volumetric: false});
		const gpuNoAir = Array.from(await renderer.readback());
		renderer.dispose();
		const c2 = fresh();
		const gl = new BerxThreeRuntimeRenderer(c2);
		gl.setLighting(lighting); gl.resize(c2.width, c2.height);
		const shoot = (volumetric: boolean) => {
			gl.render(frame, {ssao: false, volumetric});
			const ctx = c2.getContext('webgl2')!;
			const px = new Uint8Array(c2.width * c2.height * 4);
			ctx.readPixels(0, 0, c2.width, c2.height, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
			return Array.from(px);
		};
		return {available: true as const, gpuAir, gpuNoAir, glAir: shoot(true), glNoAir: shoot(false)};
	},

};
