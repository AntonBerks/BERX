/**
 * Names in the world, through WebGPU.
 *
 * The glyphs come from `berxRasteriseLabel` — the same 2D-canvas
 * rasteriser the WebGL2 atlas uses, so the two backends draw the same
 * letterforms with the same font, the same Cyrillic and the same dark
 * rim under the ink. Two text paths would mean the cross-renderer
 * comparison was measuring the font rather than the renderers.
 *
 * The upload is `writeTexture` from the canvas's own pixels rather than
 * `copyExternalImageToTexture`, for the same reason as the media cache:
 * the external-image copy is unsupported on the software driver these
 * gates run against, and an upload that works only on hardware is not
 * an upload that can be verified.
 *
 * The mipmap chain is built on the CPU with the same box filter
 * `generateMipmap` uses — see webgpuMipmaps — because a label seen
 * edge-on across the world minifies hard, and without mipmaps it turns
 * into noise.
 */
import {berxMeasureLabel, berxRasteriseLabel} from './spatialText';
import {berxBuildMipChain, berxMipLevelCount, berxWriteMipChain} from './webgpuMipmaps';

export interface BerxWebGPUGlyphTexture {
	texture: GPUTexture;
	view: GPUTextureView;
	/** Width / height of the rendered label, for the quad's proportions. */
	aspect: number;
	lastUsedFrame: number;
}

export interface BerxWebGPUTextOptions {
	budget?: number;
	/** Rendered glyph height in device pixels. Higher is sharper and larger. */
	pixelHeight?: number;
}

const DEFAULT_BUDGET = 96;
const DEFAULT_PIXEL_HEIGHT = 64;

export class BerxWebGPUTextAtlas {
	private readonly budget: number;
	private readonly pixelHeight: number;
	private readonly cache = new Map<string, BerxWebGPUGlyphTexture>();
	private frame = 0;

	constructor(private readonly device: GPUDevice, options: BerxWebGPUTextOptions = {}) {
		this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET);
		this.pixelHeight = Math.max(16, options.pixelHeight ?? DEFAULT_PIXEL_HEIGHT);
	}

	beginFrame(): void {
		this.frame++;
	}

	/**
	 * How wide this label will be drawn, in multiples of its height.
	 *
	 * The ring's layout asks this BEFORE the frame is built, so it can
	 * reserve exactly the width `get` is about to rasterise. The same
	 * function the WebGL atlas answers with, at this atlas's own pixel
	 * height: two backends measuring text differently would draw the
	 * same world at two different widths.
	 */
	measure(text: string): number | undefined {
		return berxMeasureLabel(text, this.pixelHeight);
	}

	/**
	 * The texture for a label, rasterising it on first use.
	 *
	 * Synchronous, like the WebGL2 atlas: one line of text on a 2D
	 * canvas is a fraction of a millisecond, and a name that appeared a
	 * frame late would flicker every time the camera moved.
	 */
	get(text: string): BerxWebGPUGlyphTexture | undefined {
		const label = text.trim();
		if (label.length === 0) return undefined;
		const hit = this.cache.get(label);
		if (hit) {
			hit.lastUsedFrame = this.frame;
			return hit;
		}
		const raster = berxRasteriseLabel(label, this.pixelHeight);
		if (!raster) return undefined;
		const context = raster.canvas.getContext('2d', {willReadFrequently: true});
		if (!context) return undefined;
		const {width, height} = raster.canvas;
		const pixels = context.getImageData(0, 0, width, height).data;
		const texture = this.device.createTexture({
			size: {width, height},
			format: 'rgba8unorm',
			mipLevelCount: berxMipLevelCount(width, height),
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
		});
		berxWriteMipChain(this.device, texture, berxBuildMipChain(pixels, width, height));
		const entry: BerxWebGPUGlyphTexture = {
			texture, view: texture.createView(), aspect: raster.aspect, lastUsedFrame: this.frame,
		};
		this.cache.set(label, entry);
		this.evict();
		return entry;
	}

	/** Same rule as the media cache: the budget is met, not aimed at. */
	private evict(): void {
		if (this.cache.size <= this.budget) return;
		const byAge = [...this.cache.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
		for (const [key, entry] of byAge) {
			if (this.cache.size <= this.budget) return;
			if (entry.lastUsedFrame !== this.frame) {
				entry.texture.destroy();
				this.cache.delete(key);
			}
		}
		for (const [key, entry] of byAge) {
			if (this.cache.size <= this.budget) return;
			if (this.cache.has(key)) {
				entry.texture.destroy();
				this.cache.delete(key);
			}
		}
	}

	get residentCount(): number {
		return this.cache.size;
	}

	dispose(): void {
		for (const entry of this.cache.values()) entry.texture.destroy();
		this.cache.clear();
	}
}
