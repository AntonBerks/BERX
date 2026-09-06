/**
 * Browser entry for the cross-renderer verification.
 *
 * Renders exactly the frame the native backend was given — same shared
 * core, same world, same camera — through the real WebGL2 backend, and
 * hands the framebuffer back as bytes. The comparison happens outside,
 * against the native readback.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {berxBuildDrawList} from '@berx/spatial';
import {BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame} from '@berx/scenes';

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
	/** The same frame, rendered by the real WebGL2 backend, read back as RGBA8. */
	render() {
		const canvas = document.getElementById('world') as HTMLCanvasElement;
		canvas.width = BERX_CROSS_RENDERER_VIEWPORT.width;
		canvas.height = BERX_CROSS_RENDERER_VIEWPORT.height;
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
};

function flipRows(px: Uint8Array, width: number, height: number): Uint8Array {
	const row = width * 4;
	const out = new Uint8Array(px.length);
	for (let y = 0; y < height; y++) {
		out.set(px.subarray((height - 1 - y) * row, (height - y) * row), y * row);
	}
	return out;
}

window.BERX_CROSS = api;
