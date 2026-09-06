/**
 * Real media on real surfaces, through WebGPU.
 *
 * The same three rules as the WebGL2 cache next to it — no invented
 * URLs, a budget that is actually met, and dimensions measured from the
 * decoded image rather than guessed — with one difference forced by the
 * driver.
 *
 * WebGPU's ordinary path from an image to a texture is
 * `copyExternalImageToTexture`, and it is unsupported on the software
 * Vulkan driver these gates run against: it silently produces zeros.
 * That was recorded as a blocker. It is not one any more, because there
 * is a second path that this driver does support and that needs no
 * external image at all: rasterise the decoded image into a 2D canvas,
 * read its bytes, and `queue.writeTexture` them. It costs one extra
 * copy through CPU memory, which is the honest price of an upload that
 * actually works everywhere rather than one that works on hardware and
 * returns black in verification.
 *
 * Mipmaps are built on the CPU with the same 2x2 box filter
 * `generateMipmap` uses — see webgpuMipmaps — because a photograph
 * drawn at every distance in a perspective world shimmers without them,
 * and because a different filter would make the two backends disagree
 * for a reason that is not rendering.
 */

import {berxBuildMipChain, berxMipLevelCount, berxWriteMipChain} from './webgpuMipmaps';

export interface BerxWebGPULoadedTexture {
	texture: GPUTexture;
	view: GPUTextureView;
	/** Real, from the decoded image — never guessed from the URL. */
	aspectRatio: number;
	lastUsedFrame: number;
}

export interface BerxWebGPUMediaOptions {
	budget?: number;
	onError?: (uri: string, error: unknown) => void;
}

const DEFAULT_BUDGET = 64;

export class BerxWebGPUMediaTextures {
	private readonly budget: number;
	private readonly onError?: (uri: string, error: unknown) => void;
	private readonly loaded = new Map<string, BerxWebGPULoadedTexture>();
	private readonly pending = new Set<string>();
	private readonly failed = new Set<string>();
	private frame = 0;
	private alive = true;

	constructor(private readonly device: GPUDevice, options: BerxWebGPUMediaOptions = {}) {
		this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET);
		this.onError = options.onError;
	}

	beginFrame(): void {
		this.frame++;
	}

	/**
	 * The texture for a URI if it is resident, starting a load if it is
	 * not. Undefined while loading and forever after a failure — the
	 * caller draws the material colour, which is what an object with no
	 * picture looks like.
	 */
	get(uri: string): BerxWebGPULoadedTexture | undefined {
		const hit = this.loaded.get(uri);
		if (hit) {
			hit.lastUsedFrame = this.frame;
			return hit;
		}
		if (!this.pending.has(uri) && !this.failed.has(uri)) void this.load(uri);
		return undefined;
	}

	private async load(uri: string): Promise<void> {
		this.pending.add(uri);
		try {
			const pixels = await decodeToPixels(uri);
			if (!this.alive) return;
			const texture = this.device.createTexture({
				size: {width: pixels.width, height: pixels.height},
				format: 'rgba8unorm',
				mipLevelCount: berxMipLevelCount(pixels.width, pixels.height),
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
			});
			berxWriteMipChain(this.device, texture, berxBuildMipChain(pixels.data, pixels.width, pixels.height));
			this.loaded.set(uri, {
				texture,
				view: texture.createView(),
				aspectRatio: pixels.width / Math.max(1, pixels.height),
				lastUsedFrame: this.frame,
			});
			this.evict();
		} catch (error) {
			this.failed.add(uri);
			this.onError?.(uri, error);
		} finally {
			this.pending.delete(uri);
		}
	}

	/**
	 * Least recently drawn go first, down to the budget — and the budget
	 * is met, not merely aimed at. With more textures visible at once
	 * than the budget allows, the oldest in-use ones go too: that
	 * thrashes, which is the honest symptom of a budget set below what
	 * the world is showing, and is still preferable to unbounded GPU
	 * memory.
	 */
	private evict(): void {
		if (this.loaded.size <= this.budget) return;
		const byAge = [...this.loaded.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
		const drop = (uri: string, entry: BerxWebGPULoadedTexture) => {
			entry.texture.destroy();
			this.loaded.delete(uri);
		};
		for (const [uri, entry] of byAge) {
			if (this.loaded.size <= this.budget) return;
			if (entry.lastUsedFrame !== this.frame) drop(uri, entry);
		}
		for (const [uri, entry] of byAge) {
			if (this.loaded.size <= this.budget) return;
			if (this.loaded.has(uri)) drop(uri, entry);
		}
	}

	get residentCount(): number {
		return this.loaded.size;
	}

	dispose(): void {
		this.alive = false;
		for (const entry of this.loaded.values()) entry.texture.destroy();
		this.loaded.clear();
		this.pending.clear();
		this.failed.clear();
	}
}

export interface BerxDecodedPixels {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

/**
 * A URI to RGBA bytes, top row first.
 *
 * The 2D canvas in the middle is not decoration: it is what turns a
 * decoded image into bytes `writeTexture` accepts, on a driver whose
 * external-image copy does not work.
 */
export async function decodeToPixels(uri: string): Promise<BerxDecodedPixels> {
	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const element = new Image();
		/* BERX media is served from the same OSSN host the API is on;
		   anonymous CORS is what makes it readable as pixels at all, and a
		   host that refuses it fails loudly rather than tainting the canvas */
		element.crossOrigin = 'anonymous';
		element.decoding = 'async';
		element.onload = () => resolve(element);
		element.onerror = () => reject(new Error(`BERX 5D: media failed to load (${uri})`));
		element.src = uri;
	});
	const width = Math.max(1, image.naturalWidth || image.width);
	const height = Math.max(1, image.naturalHeight || image.height);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', {willReadFrequently: true});
	if (!ctx) throw new Error('BERX 5D: no 2D context to read media pixels through');
	ctx.drawImage(image, 0, 0);
	return {width, height, data: ctx.getImageData(0, 0, width, height).data};
}
