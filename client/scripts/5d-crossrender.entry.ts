/**
 * Browser entry for the cross-renderer verification.
 *
 * Renders exactly the frame the native backend was given — same shared
 * core, same world, same camera — through the real WebGL2 backend, and
 * hands the framebuffer back as bytes. The comparison happens outside,
 * against the native readback.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BerxWebGPURuntimeRenderer} from '@berx/spatial-web/webgpuRuntime';
import {berxBuildDrawList, type BerxTransitionKind} from '@berx/spatial';
import {BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame, berxShadowFixtureFrame, berxShadowFixtureLighting} from '@berx/scenes';

declare global {
	interface Window {
		BERX_CROSS: typeof api;
	}
}

const api = {
	/** The draw list this build resolves, for comparison with the native one. */
	drawList() {
		return berxBuildDrawList(berxCrossRendererFrame(), {
			width: BERX_CROSS_RENDERER_VIEWPORT.width,
			height: BERX_CROSS_RENDERER_VIEWPORT.height,
		});
	},
	/**
	 * The same world, mid-transition, rendered by the real WebGL2
	 * backend and read back.
	 *
	 * Every image this produces differs from every other ONLY by the
	 * transition: same objects, same camera pose at t, same lights. So
	 * a difference between two of them is the effect itself, which is
	 * what turns eight names into eight things.
	 */
	renderTransition(kind: BerxTransitionKind, progress: number) {
		const canvas = freshCanvas(BERX_CROSS_RENDERER_VIEWPORT.width, BERX_CROSS_RENDERER_VIEWPORT.height);
		const renderer = new BerxThreeRuntimeRenderer(canvas);
		renderer.resize(canvas.width, canvas.height);
		renderer.render(berxCrossRendererFrame({transition: {kind, progress}}));
		const gl = canvas.getContext('webgl2');
		if (!gl) throw new Error('no WebGL2 context');
		const px = new Uint8Array(canvas.width * canvas.height * 4);
		gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
		return {
			kind,
			progress,
			width: canvas.width,
			height: canvas.height,
			rgba: Array.from(flipRows(px, canvas.width, canvas.height)),
		};
	},
	/**
	 * The shadow question, asked twice on one scene.
	 *
	 * The same world, the same camera and the same light, rendered with
	 * the key casting and with it not casting. Anything that differs
	 * between the two images is the shadow — there is nothing else it
	 * could be.
	 */
	renderShadowPair() {
		const frame = berxShadowFixtureFrame();
		const lighting = berxShadowFixtureLighting();
		const list = berxBuildDrawList(frame, {
			width: BERX_CROSS_RENDERER_VIEWPORT.width,
			height: BERX_CROSS_RENDERER_VIEWPORT.height,
			lighting,
		});
		const shoot = (shadows: boolean) => {
			const canvas = freshCanvas(BERX_CROSS_RENDERER_VIEWPORT.width, BERX_CROSS_RENDERER_VIEWPORT.height);
			const renderer = new BerxThreeRuntimeRenderer(canvas);
			renderer.setLighting(lighting);
			renderer.resize(canvas.width, canvas.height);
			renderer.render(frame, {shadows});
			const gl = canvas.getContext('webgl2');
			if (!gl) throw new Error('no WebGL2 context');
			const px = new Uint8Array(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
			return Array.from(flipRows(px, canvas.width, canvas.height));
		};
		return {
			width: BERX_CROSS_RENDERER_VIEWPORT.width,
			height: BERX_CROSS_RENDERER_VIEWPORT.height,
			withShadows: shoot(true),
			withoutShadows: shoot(false),
			/* the light camera the shared core fitted, and the view the
			   frame was drawn with, so the gate can predict where the
			   shadow must land instead of guessing at a screen box */
			shadowCamera: list.shadow,
			projection: list.projection,
			view: list.view,
		};
	},
	/**
	 * The same question, asked of WebGPU.
	 *
	 * Agreement with WebGL2 is strong evidence, but it is evidence about
	 * two backends being the same — not about either one casting a
	 * shadow. This asks WebGPU directly: the same world, with the key
	 * casting and with it not.
	 */
	async renderShadowPairWebGPU() {
		const frame = berxShadowFixtureFrame();
		const lighting = berxShadowFixtureLighting();
		const shoot = async (shadows: boolean) => {
			const canvas = freshCanvas(BERX_CROSS_RENDERER_VIEWPORT.width, BERX_CROSS_RENDERER_VIEWPORT.height);
			const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
			if (!renderer) return undefined;
			renderer.setLighting(lighting);
			renderer.resize(canvas.width, canvas.height);
			/* the offscreen path: the same pipeline, the same shader and
			   the same draw list as the canvas one, resolving somewhere
			   that can actually be read back */
			renderer.draw(berxBuildDrawList(frame, {
				width: canvas.width, height: canvas.height, lighting, shadows,
			}), true);
			const rgba = Array.from(await renderer.readback());
			renderer.dispose();
			return rgba;
		};
		const withShadows = await shoot(true);
		if (!withShadows) return {available: false as const, reason: 'this browser granted no WebGPU device'};
		const withoutShadows = await shoot(false);
		return {
			available: true as const,
			width: BERX_CROSS_RENDERER_VIEWPORT.width,
			height: BERX_CROSS_RENDERER_VIEWPORT.height,
			withShadows,
			withoutShadows,
		};
	},
	/** The same frame, rendered by the real WebGL2 backend, read back as RGBA8. */
	render() {
		const canvas = freshCanvas(BERX_CROSS_RENDERER_VIEWPORT.width, BERX_CROSS_RENDERER_VIEWPORT.height);
		const renderer = new BerxThreeRuntimeRenderer(canvas);
		renderer.resize(canvas.width, canvas.height);
		renderer.render(berxCrossRendererFrame());
		const gl = canvas.getContext('webgl2');
		if (!gl) throw new Error('no WebGL2 context');
		const px = new Uint8Array(canvas.width * canvas.height * 4);
		gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
		return {
			width: canvas.width,
			height: canvas.height,
			/* readPixels returns bottom row first; the native readback is
			   top row first, so flip here rather than in the comparison */
			rgba: Array.from(flipRows(px, canvas.width, canvas.height)),
			stats: renderer.frameStats,
		};
	},
	/**
	 * A real WebGPU device loss, and what survives it.
	 *
	 * `destroy()` ends the device: every pipeline, buffer and texture on
	 * it becomes invalid and `device.lost` resolves. What is being
	 * checked is that none of BERX was in there — the same draw list,
	 * given to a backend built a moment later on a new device, produces
	 * the same picture. The world, the camera, the time cursor and the
	 * relations were never the renderer's to lose.
	 */
	async renderAfterDeviceLoss() {
		const list = api.drawList();
		const first = await BerxWebGPURuntimeRenderer.create(freshCanvas(list.width, list.height));
		if (!first) return {available: false as const, reason: 'navigator.gpu granted no adapter or device in this browser'};
		first.resize(list.width, list.height);
		first.draw(list, true);
		const before = Array.from(await first.readback());

		first.device.destroy();
		const reason = await first.whenLost;
		const lostFlag = first.deviceLost;
		/* drawing into a dead device must do nothing rather than throw */
		first.draw(list, true);
		first.dispose();

		const second = await BerxWebGPURuntimeRenderer.create(freshCanvas(list.width, list.height));
		if (!second) return {available: false as const, reason: `the device was lost (${reason}) and no replacement could be obtained`};
		second.resize(list.width, list.height);
		second.draw(list, true);
		const after = Array.from(await second.readback());
		const errors = [...second.errors];
		second.dispose();
		return {available: true as const, reason, lostFlag, before, after, errors};
	},

	/**
	 * The same world with its names on, drawn by both web backends.
	 *
	 * Names are left out of the three-way comparison because the native
	 * backend has no text rasteriser. Both web backends do, and they
	 * share the rasteriser and take their placement from the same draw
	 * list, so this checks that a name lands in the same place with the
	 * same glyphs in both — and that it is drawn at all, by comparing
	 * against the same world without names.
	 */
	async renderLabelled() {
		const list = api.drawList();
		const frame = berxCrossRendererFrame({labels: true});
		const withLabels = berxBuildDrawList(frame, {width: list.width, height: list.height});

		const glCanvas = freshCanvas(list.width, list.height);
		const gl2 = new BerxThreeRuntimeRenderer(glCanvas);
		gl2.resize(list.width, list.height);
		gl2.render(frame);
		const glContext = glCanvas.getContext('webgl2');
		if (!glContext) throw new Error('no WebGL2 context');
		const glPixels = new Uint8Array(list.width * list.height * 4);
		glContext.readPixels(0, 0, list.width, list.height, glContext.RGBA, glContext.UNSIGNED_BYTE, glPixels);
		const glStats = gl2.frameStats;

		const gpuCanvas = freshCanvas(list.width, list.height);
		const gpu = await BerxWebGPURuntimeRenderer.create(gpuCanvas);
		if (!gpu) return {available: false as const, reason: 'navigator.gpu granted no adapter or device in this browser'};
		gpu.resize(list.width, list.height);
		gpu.draw(withLabels, true);
		const gpuPixels = await gpu.readback();
		const result = {
			available: true as const,
			placed: withLabels.labels.map((l) => ({id: l.id, text: l.text, alpha: l.alpha})),
			webgl: {rgba: Array.from(flipRows(glPixels, list.width, list.height)), residentLabels: glStats.residentLabels, drawCalls: glStats.drawCalls},
			webgpu: {rgba: Array.from(gpuPixels), residentLabels: gpu.frameStats.residentLabels, drawCalls: gpu.frameStats.drawCalls},
			errors: [...gpu.errors],
		};
		gpu.dispose();
		gl2.dispose();
		return result;
	},

	/**
	 * The same world with a real BERX photograph on its moment surface,
	 * drawn by both web backends.
	 *
	 * Media is the one part of the frame the cross-renderer comparison
	 * deliberately leaves out, because the two paths to the GPU are
	 * different: WebGL2 uploads through texImage2D, WebGPU through
	 * writeTexture from decoded pixels. So it is checked here instead,
	 * on its own, against the same image — and against the same world
	 * without it, so "the picture is on the surface" is measured rather
	 * than assumed.
	 */
	async renderMedia(uri: string) {
		const wait = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
		const list = api.drawList();
		const frame = berxCrossRendererFrame();
		const target = frame.world.objects.find((o) => o.kind === 'moment');
		if (!target) throw new Error('the cross-renderer world has no moment to put a picture on');

		const glCanvas = freshCanvas(list.width, list.height);
		const gl2 = new BerxThreeRuntimeRenderer(glCanvas);
		gl2.resize(list.width, list.height);
		gl2.setObjectMedia(target.id, [{uri}]);
		/* the image has to decode and upload before it can be drawn; the
		   renderer reports how many textures are resident, so this waits
		   on that fact rather than on a timeout */
		for (let i = 0; i < 240 && gl2.frameStats.residentTextures === 0; i++) {
			gl2.render(frame);
			await wait();
		}
		gl2.render(frame);
		const glContext = glCanvas.getContext('webgl2');
		if (!glContext) throw new Error('no WebGL2 context');
		const glPixels = new Uint8Array(list.width * list.height * 4);
		glContext.readPixels(0, 0, list.width, list.height, glContext.RGBA, glContext.UNSIGNED_BYTE, glPixels);
		const glResident = gl2.frameStats.residentTextures;

		const gpuCanvas = freshCanvas(list.width, list.height);
		const gpu = await BerxWebGPURuntimeRenderer.create(gpuCanvas);
		if (!gpu) return {available: false as const, reason: 'navigator.gpu granted no adapter or device in this browser'};
		gpu.resize(list.width, list.height);
		gpu.setObjectMedia(target.id, [{uri}]);
		for (let i = 0; i < 240 && gpu.frameStats.residentTextures === 0; i++) {
			gpu.draw(berxBuildDrawList(frame, {
				width: list.width, height: list.height,
				mediaFor: (id) => (id === target.id ? uri : undefined),
			}), true);
			await wait();
		}
		gpu.draw(berxBuildDrawList(frame, {
			width: list.width, height: list.height,
			mediaFor: (id) => (id === target.id ? uri : undefined),
		}), true);
		const gpuPixels = await gpu.readback();
		const result = {
			available: true as const,
			objectId: target.id,
			webgl: {rgba: Array.from(flipRows(glPixels, list.width, list.height)), residentTextures: glResident},
			webgpu: {rgba: Array.from(gpuPixels), residentTextures: gpu.frameStats.residentTextures},
			errors: [...gpu.errors],
		};
		gpu.dispose();
		gl2.dispose();
		return result;
	},

	/**
	 * The same frame through the WebGPU backend, read back off the GPU.
	 *
	 * Returns a reason rather than throwing when this browser has no
	 * WebGPU device: absent is a fact to report, not a failure to hide.
	 */
	async renderWebGPU() {
		const canvas = freshCanvas(BERX_CROSS_RENDERER_VIEWPORT.width, BERX_CROSS_RENDERER_VIEWPORT.height);
		const renderer = await BerxWebGPURuntimeRenderer.create(canvas);
		if (!renderer) return {available: false as const, reason: 'navigator.gpu granted no adapter or device in this browser'};
		renderer.resize(canvas.width, canvas.height);
		renderer.draw(api.drawList(), true);
		const rgba = await renderer.readback();
		const result = {
			available: true as const,
			width: canvas.width,
			height: canvas.height,
			rgba: Array.from(rgba),
			stats: renderer.frameStats,
			capabilities: {...renderer.capabilities, ...renderer.extendedCapabilities},
			errors: [...renderer.errors],
			kind: renderer.kind,
		};
		renderer.dispose();
		return result;
	},
};

/**
 * A canvas per renderer.
 *
 * Each pass below builds its own backend and disposes it afterwards,
 * and a disposed WebGL2 or WebGPU context cannot be handed to the next
 * one — reusing a single canvas made the second renderer fail to
 * compile its shaders against a context that was already gone.
 */
function freshCanvas(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	return canvas;
}

function flipRows(px: Uint8Array, width: number, height: number): Uint8Array {
	const row = width * 4;
	const out = new Uint8Array(px.length);
	for (let y = 0; y < height; y++) {
		out.set(px.subarray((height - 1 - y) * row, (height - y) * row), y * row);
	}
	return out;
}

window.BERX_CROSS = api;
