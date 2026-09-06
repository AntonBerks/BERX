/**
 * Real media on real surfaces.
 *
 * `createMediaSurface` produced surfaces that nothing could draw: the
 * WebGL backend had no texture path at all, so every object in the
 * world was a flat-shaded solid and a place's cover photograph existed
 * only as a string. This is the missing pipeline, and it carries three
 * rules.
 *
 * **No invented URLs.** A texture is only ever loaded from a URI the
 * server actually sent. Nothing here has a placeholder, a gradient
 * stand-in or a default image — an object with no media stays the
 * material colour it was, which is a truthful "no picture" rather
 * than a picture of nothing.
 *
 * **Bounded, and actually freed.** GPU textures are the largest thing
 * this runtime allocates. The cache has a real budget and evicts the
 * least recently drawn beyond it, `dispose` deletes every one, and a
 * lost context drops the handles without calling into a dead driver.
 * A world that scrolls through a thousand covers holds a bounded
 * number of them.
 *
 * **Honest dimensions.** The endpoints that return media URLs do not
 * return their dimensions, so the surface starts at 1:1 and is
 * corrected from the decoded image's real pixels. Nothing claims an
 * aspect ratio it has not measured.
 */

export interface BerxLoadedTexture {
	texture: WebGLTexture;
	/** Real, from the decoded image — never guessed from the URL. */
	aspectRatio: number;
	lastUsedFrame: number;
}

export interface BerxMediaTextureOptions {
	/** How many textures may be resident. Beyond it, least-recently-drawn go. */
	budget?: number;
	/**
	 * Only called for URIs the caller supplied. Present so a host can
	 * report a broken image rather than have it vanish silently.
	 */
	onError?: (uri: string, error: unknown) => void;
}

const DEFAULT_BUDGET = 64;

export class BerxMediaTextureCache {
	private readonly gl: WebGL2RenderingContext;
	private readonly budget: number;
	private readonly onError?: (uri: string, error: unknown) => void;
	private readonly loaded = new Map<string, BerxLoadedTexture>();
	/** In flight, so a URI drawn every frame is requested once. */
	private readonly pending = new Set<string>();
	/** Failed, so a broken URL is not retried sixty times a second. */
	private readonly failed = new Set<string>();
	private frame = 0;
	private alive = true;

	constructor(gl: WebGL2RenderingContext, options: BerxMediaTextureOptions = {}) {
		this.gl = gl;
		this.budget = Math.max(1, options.budget ?? DEFAULT_BUDGET);
		this.onError = options.onError;
	}

	/** Called once per rendered frame, so eviction knows what is actually in use. */
	beginFrame(): void {
		this.frame++;
	}

	/**
	 * The texture for a URI if it is resident, starting a load if it is
	 * not. Returns undefined while loading and forever after a failure —
	 * the caller draws the material colour, which is what an object with
	 * no picture looks like.
	 */
	get(uri: string): BerxLoadedTexture | undefined {
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
			const image = await decode(uri);
			/* the context may have gone or been disposed while decoding */
			if (!this.alive) return;
			const gl = this.gl;
			const texture = gl.createTexture();
			if (!texture) throw new Error('BERX 5D: texture allocation failed');
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			/* mipmaps, because these are drawn at every distance in a
			   perspective world and a minified photograph without them
			   shimmers as the camera moves */
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			/* clamp: media is a picture on a face, not a repeating pattern */
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
			if (aniso) {
				const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
				gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
			}
			gl.bindTexture(gl.TEXTURE_2D, null);
			const height = image.height || 1;
			this.loaded.set(uri, {texture, aspectRatio: (image.width || 1) / height, lastUsedFrame: this.frame});
			this.evict();
		} catch (error) {
			/* a broken URL is a fact about the data, not a reason to keep
			   asking; the host hears about it once */
			this.failed.add(uri);
			this.onError?.(uri, error);
		} finally {
			this.pending.delete(uri);
		}
	}

	/** Least recently drawn go first, and only down to the budget. */
	private evict(): void {
		if (this.loaded.size <= this.budget) return;
		const byAge = [...this.loaded.entries()].sort((a, b) => a[1].lastUsedFrame - b[1].lastUsedFrame);
		for (const [uri, entry] of byAge) {
			if (this.loaded.size <= this.budget) break;
			/* never evict something drawn in the frame being composed */
			if (entry.lastUsedFrame === this.frame) continue;
			this.gl.deleteTexture(entry.texture);
			this.loaded.delete(uri);
		}
	}

	/** How many textures are resident. Real, for a host that reports budgets. */
	get residentCount(): number {
		return this.loaded.size;
	}

	/**
	 * A lost context invalidates every handle. They are dropped rather
	 * than deleted: calling into a dead context is undefined, and the
	 * driver has already reclaimed the memory.
	 */
	handleContextLost(): void {
		this.loaded.clear();
		this.pending.clear();
		/* a restored context deserves a fresh attempt at what failed */
		this.failed.clear();
	}

	dispose(): void {
		this.alive = false;
		for (const entry of this.loaded.values()) this.gl.deleteTexture(entry.texture);
		this.loaded.clear();
		this.pending.clear();
		this.failed.clear();
	}
}

function decode(uri: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		/* BERX media is served from the same OSSN host the API is on;
		   anonymous CORS is what makes it usable as a texture at all,
		   and a host that refuses it fails loudly rather than tainting
		   the canvas */
		image.crossOrigin = 'anonymous';
		image.decoding = 'async';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`BERX 5D: media failed to load (${uri})`));
		image.src = uri;
	});
}
