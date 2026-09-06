/**
 * Mipmaps for WebGPU textures, built on the CPU.
 *
 * WebGL2 has `generateMipmap`; WebGPU has nothing equivalent, and the
 * usual answer is a chain of render passes that downsample level by
 * level. That is more machinery than this needs and, more to the point,
 * it would filter differently from the WebGL2 path — which matters here,
 * because the two backends are compared pixel for pixel and a
 * difference in filtering would read as a difference in rendering.
 *
 * So the chain is built the same way `generateMipmap` builds it: a 2x2
 * box filter, halving until 1x1. It costs one pass over the image per
 * level, once, when the texture is uploaded — not per frame — and it
 * means a photograph or a name seen far across the world minifies
 * cleanly instead of turning into noise.
 */

export interface BerxMipLevel {
	width: number;
	height: number;
	data: Uint8Array;
}

/** How many levels a texture of this size has, down to 1x1. */
export function berxMipLevelCount(width: number, height: number): number {
	return Math.floor(Math.log2(Math.max(1, Math.max(width, height)))) + 1;
}

/**
 * Every level of the chain, level 0 first.
 *
 * Alpha-weighted: averaging colour without weighting it by coverage
 * pulls the transparent black outside a glyph into its edge and leaves
 * a dark halo, which is exactly what a label rim must not grow.
 */
export function berxBuildMipChain(source: Uint8Array | Uint8ClampedArray, width: number, height: number): BerxMipLevel[] {
	const levels: BerxMipLevel[] = [{width, height, data: new Uint8Array(source)}];
	let w = width;
	let h = height;
	let previous = levels[0].data;
	while (w > 1 || h > 1) {
		const nw = Math.max(1, w >> 1);
		const nh = Math.max(1, h >> 1);
		const next = new Uint8Array(nw * nh * 4);
		for (let y = 0; y < nh; y++) {
			for (let x = 0; x < nw; x++) {
				let r = 0, g = 0, b = 0, a = 0, weight = 0;
				for (let dy = 0; dy < 2; dy++) {
					for (let dx = 0; dx < 2; dx++) {
						const sx = Math.min(w - 1, x * 2 + dx);
						const sy = Math.min(h - 1, y * 2 + dy);
						const i = (sy * w + sx) * 4;
						const alpha = previous[i + 3];
						r += previous[i] * alpha;
						g += previous[i + 1] * alpha;
						b += previous[i + 2] * alpha;
						a += alpha;
						weight += alpha;
					}
				}
				const o = (y * nw + x) * 4;
				/* fully transparent quads keep their colour rather than
				   dividing by zero and going black */
				next[o] = weight > 0 ? Math.round(r / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4];
				next[o + 1] = weight > 0 ? Math.round(g / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4 + 1];
				next[o + 2] = weight > 0 ? Math.round(b / weight) : previous[(Math.min(h - 1, y * 2) * w + Math.min(w - 1, x * 2)) * 4 + 2];
				next[o + 3] = Math.round(a / 4);
			}
		}
		levels.push({width: nw, height: nh, data: next});
		previous = next;
		w = nw;
		h = nh;
	}
	return levels;
}

/** Upload a whole chain into a texture that was created with room for it. */
export function berxWriteMipChain(device: GPUDevice, texture: GPUTexture, levels: readonly BerxMipLevel[]): void {
	levels.forEach((level, mipLevel) => {
		device.queue.writeTexture(
			{texture, mipLevel},
			level.data,
			{bytesPerRow: level.width * 4, rowsPerImage: level.height},
			{width: level.width, height: level.height},
		);
	});
}
