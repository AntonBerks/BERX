/**
 * Browser entry for the volumetric verification.
 *
 * Renders the fixture through the real WebGL2 backend and hands back
 * three things: the in-scatter buffer the march produced, the shadow
 * map it sampled, and the draw list it was given. The gate re-runs the
 * shared core's berxVolumetricAt over exactly those and compares —
 * which is only meaningful if all three come from the same frame.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {berxBuildDrawList} from '@berx/spatial';
import {berxVolumetricFixtureFrame, berxVolumetricFixtureLighting} from '@berx/scenes';

declare global {
	interface Window {
		BERX_VOL: typeof api;
	}
}

const WIDTH = 480;
const HEIGHT = 360;

function canvas(): HTMLCanvasElement {
	const c = document.createElement('canvas');
	c.width = WIDTH;
	c.height = HEIGHT;
	document.body.appendChild(c);
	return c;
}

const api = {
	/** WebGL2: the march, its inputs, and the frame it composited into. */
	webgl2() {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const c = canvas();
		const renderer = new BerxThreeRuntimeRenderer(c);
		renderer.setLighting(lighting);
		renderer.resize(WIDTH, HEIGHT);
		renderer.render(frame);
		const inscatter = renderer.readVolumetricBuffer();
		const shadow = renderer.readShadowMap();
		const gbuffer = renderer.readSSAOBuffers();
		const list = berxBuildDrawList(frame, {width: WIDTH, height: HEIGHT, lighting});
		if (!inscatter || !shadow || !gbuffer) return {available: false as const, reason: 'no float colour buffers on this driver'};
		return {
			available: true as const,
			width: inscatter.width,
			height: inscatter.height,
			inscatter: Array.from(inscatter.rgba),
			shadowDepth: Array.from(shadow.depth),
			/* the same surface distances the march read: without them the twin
			   would have to guess where each ray ends */
			gbuffer: Array.from(gbuffer.gbuffer),
			shadowSize: shadow.size,
			shadowCamera: list.shadow,
			projection: list.projection,
			view: list.view,
			camera: list.camera,
			key: {
				direction: list.key.direction,
				colour: list.key.colour,
				intensity: list.key.intensity,
			},
		};
	},
	/** The same fixture with the pass off, so the composite can be isolated. */
	webgl2Composited(volumetric: boolean) {
		const c = canvas();
		const renderer = new BerxThreeRuntimeRenderer(c);
		renderer.setLighting(berxVolumetricFixtureLighting());
		renderer.resize(WIDTH, HEIGHT);
		renderer.render(berxVolumetricFixtureFrame(), {volumetric});
		const gl = c.getContext('webgl2');
		if (!gl) throw new Error('no WebGL2 context');
		const px = new Uint8Array(WIDTH * HEIGHT * 4);
		gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, px);
		const out = new Uint8Array(px.length);
		const stride = WIDTH * 4;
		for (let y = 0; y < HEIGHT; y++) out.set(px.subarray((HEIGHT - 1 - y) * stride, (HEIGHT - y) * stride), y * stride);
		return {width: WIDTH, height: HEIGHT, rgba: Array.from(out)};
	},
	/**
	 * The particle fields, on and off, through both web backends.
	 *
	 * The same frame either way, so the difference between the two images
	 * is the field and nothing else. The draw list is handed back too:
	 * the gate re-runs the shared core's berxParticleAt over it and
	 * projects each particle itself, which is how a prediction is made
	 * rather than a description written.
	 */
	particles(on: boolean) {
		const frame = berxVolumetricFixtureFrame();
		const lighting = berxVolumetricFixtureLighting();
		const c = canvas();
		const renderer = new BerxThreeRuntimeRenderer(c);
		renderer.setLighting(lighting);
		renderer.resize(WIDTH, HEIGHT);
		/* volumetric off: it and the particles both add light, and two
		   things changing at once is not a measurement */
		renderer.render(frame, {particles: on, volumetric: false});
		/* the same surfaces the depth test used, so the gate can predict
		   which particles are hidden as well as which are visible */
		const gbuffer = renderer.readSSAOBuffers();
		const gl = c.getContext('webgl2');
		if (!gl) throw new Error('no WebGL2 context');
		const px = new Uint8Array(WIDTH * HEIGHT * 4);
		gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, px);
		const out = new Uint8Array(px.length);
		const stride = WIDTH * 4;
		for (let y = 0; y < HEIGHT; y++) out.set(px.subarray((HEIGHT - 1 - y) * stride, (HEIGHT - y) * stride), y * stride);
		const list = berxBuildDrawList(frame, {width: WIDTH, height: HEIGHT, lighting});
		return {
			width: WIDTH, height: HEIGHT, rgba: Array.from(out),
			projection: list.projection, view: list.view, camera: list.camera,
			basis: list.basis, worldTime: list.worldTime, particles: list.particles,
			gbuffer: gbuffer ? Array.from(gbuffer.gbuffer) : undefined,
			items: list.items.map((i) => ({emissive: i.emissive, model: i.model})),
		};
	},
	async particlesWebGPU(on: boolean) {
		const c = canvas();
		const renderer = await BerxWebGPURuntimeRenderer.create(c);
		if (!renderer) return {available: false as const, reason: 'this browser granted no WebGPU device'};
		renderer.setLighting(berxVolumetricFixtureLighting());
		renderer.resize(WIDTH, HEIGHT);
		renderer.draw(
			berxBuildDrawList(berxVolumetricFixtureFrame(), {
				width: WIDTH, height: HEIGHT, lighting: berxVolumetricFixtureLighting(),
			}),
			true,
			undefined,
			{particles: on, volumetric: false},
		);
		const rgba = Array.from(await renderer.readback());
		renderer.dispose();
		return {available: true as const, width: WIDTH, height: HEIGHT, rgba};
	},
	/** WebGPU, composited, so the two web backends can be compared. */
	async webgpuComposited(volumetric: boolean) {
		const c = canvas();
		const renderer = await BerxWebGPURuntimeRenderer.create(c);
		if (!renderer) return {available: false as const, reason: 'this browser granted no WebGPU device'};
		renderer.setLighting(berxVolumetricFixtureLighting());
		renderer.resize(WIDTH, HEIGHT);
		renderer.draw(
			berxBuildDrawList(berxVolumetricFixtureFrame(), {
				width: WIDTH, height: HEIGHT, lighting: berxVolumetricFixtureLighting(),
			}),
			true,
			undefined,
			{volumetric},
		);
		const rgba = Array.from(await renderer.readback());
		renderer.dispose();
		return {available: true as const, width: WIDTH, height: HEIGHT, rgba};
	},
};

window.BERX_VOL = api;
