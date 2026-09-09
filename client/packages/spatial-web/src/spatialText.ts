/**
 * Text in the world, not text over it.
 *
 * Entities carry names and nothing drew them, so the world was a set
 * of lit forms with no way to tell which person or which place you
 * were looking at. This renders those names as real geometry in world
 * space: a quad that stands at the entity, turns to face the camera,
 * is occluded by anything in front of it, and recedes with distance
 * like everything else.
 *
 * Deliberately not a HUD. A label that scales itself to stay the same
 * size on screen is an overlay wearing a world's clothes — it does not
 * get further away, it cannot go behind anything, and it tells you
 * nothing about where the thing is. These labels have a real height in
 * metres, so a person across the world reads as small and far, and
 * fades out rather than growing to stay legible.
 *
 * The glyphs come from a 2D canvas, which is the platform's own text
 * shaper: real font, real kerning, real Cyrillic. Nothing here draws
 * letterforms by hand.
 */

export interface BerxTextTexture {
	texture: WebGLTexture;
	/** Width / height of the rendered label, for the quad's proportions. */
	aspect: number;
	lastUsedFrame: number;
}

export interface BerxSpatialTextOptions {
	/** How many label textures may be resident. */
	budget?: number;
	/** Rendered glyph height in device pixels. Higher is sharper and larger. */
	pixelHeight?: number;
}

const DEFAULT_BUDGET = 96;
/**
 * The height, in device pixels, every label in the world is rasterised at.
 *
 * Exported because the RING'S LAYOUT has to measure at exactly the size
 * the atlas rasterises at, and a second copy of this number would be a
 * second opinion about how wide a word is.
 */
export const BERX_LABEL_PIXEL_HEIGHT = 64;
const DEFAULT_PIXEL_HEIGHT = BERX_LABEL_PIXEL_HEIGHT;
/** #F2F0EB — pearl, the DNA's text colour. */
const INK = '#F2F0EB';

/**
 * Labels, rasterised once and kept until the budget says otherwise.
 *
 * Keyed by the text itself: two people with the same name share one
 * texture, which is correct — it is the same word.
 */
export class BerxSpatialTextAtlas {
	private readonly gl: WebGL2RenderingContext;
	private readonly budget: number;
	private readonly pixelHeight: number;
	private readonly cache = new Map<string, BerxTextTexture>();
	private frame = 0;

	constructor(gl: WebGL2RenderingContext, options: BerxSpatialTextOptions = {}) {
		this.gl = gl;
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
	 * reserve exactly the width `get` is about to rasterise. Same
	 * function, same pixel height, so the two cannot disagree — and no
	 * texture is created to answer it.
	 */
	measure(text: string): number | undefined {
		return berxMeasureLabel(text, this.pixelHeight);
	}

	/**
	 * The texture for a label, rasterising it on first use.
	 *
	 * Synchronous: a 2D canvas draw of one line of text is a fraction
	 * of a millisecond, and a label that appeared a frame late would
	 * flicker every time the camera moved.
	 */
	get(text: string): BerxTextTexture | undefined {
		const label = text.trim();
		if (label.length === 0) return undefined;
		const hit = this.cache.get(label);
		if (hit) {
			hit.lastUsedFrame = this.frame;
			return hit;
		}
		const raster = berxRasteriseLabel(label, this.pixelHeight);
		if (!raster) return undefined;
		const gl = this.gl;
		const texture = gl.createTexture();
		if (!texture) return undefined;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster.canvas);
		gl.generateMipmap(gl.TEXTURE_2D);
		/* trilinear: a label seen edge-on across the world minifies hard,
		   and without mipmaps it turns into noise */
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
		const entry: BerxTextTexture = {texture, aspect: raster.aspect, lastUsedFrame: this.frame};
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
				this.gl.deleteTexture(entry.texture);
				this.cache.delete(key);
			}
		}
		for (const [key, entry] of byAge) {
			if (this.cache.size <= this.budget) return;
			if (this.cache.has(key)) {
				this.gl.deleteTexture(entry.texture);
				this.cache.delete(key);
			}
		}
	}

	get residentCount(): number {
		return this.cache.size;
	}

	handleContextLost(): void {
		this.cache.clear();
	}

	dispose(): void {
		for (const entry of this.cache.values()) this.gl.deleteTexture(entry.texture);
		this.cache.clear();
	}
}

/**
 * One line of real text on a canvas, at a power-of-two-ish size the GPU
 * is happy to mipmap.
 *
 * Exported because the WebGPU atlas rasterises the same way: two text
 * paths would mean two different sets of glyphs, and the cross-renderer
 * comparison would be measuring the font rather than the renderers.
 *
 * Long labels are cut rather than wrapped: a name that needs two lines
 * in the world is a name that should be read by going closer to it.
 */
export function berxRasteriseLabel(text: string, pixelHeight: number): {canvas: HTMLCanvasElement; aspect: number} | undefined {
	const box = berxLabelBox(text, pixelHeight);
	if (!box) return undefined;
	const {clipped, font, width, height, padX} = box;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) return undefined;
	ctx.clearRect(0, 0, width, height);
	ctx.font = font;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';
	/* A dark rim under the glyphs. Not decoration: a label crossing a
	   pearl orb and then the ink background would otherwise disappear
	   over the light half. */
	ctx.strokeStyle = 'rgba(7,8,10,0.85)';
	ctx.lineWidth = Math.max(2, pixelHeight * 0.09);
	ctx.lineJoin = 'round';
	ctx.strokeText(clipped, padX, height / 2);
	ctx.fillStyle = INK;
	ctx.fillText(clipped, padX, height / 2);
	return {canvas, aspect: width / height};
}

/**
 * THE ONE MEASUREMENT OF HOW WIDE A WORD IS IN THE WORLD.
 *
 * The box a label occupies, in device pixels, decided by the platform's
 * own text shaper. `berxRasteriseLabel` draws exactly this box, so the
 * quad the GPU gets and the width the RING'S LAYOUT reserves are the
 * same number by construction rather than by two functions agreeing.
 *
 * The ring used to space its slots from an estimate — a fixed world
 * width per character — which was short for the longest name: at five
 * actions «Комментировать» was 1.548 world units wide standing 1.411
 * from its neighbour, so the two overlapped and a press in the overlap
 * could be answered by the wrong action. An estimate cannot be made
 * right; a measurement does not need to be.
 *
 * Cached, and on one reused canvas: this runs per frame for every
 * affordance in the ring, and `measureText` on a fresh canvas element
 * each time would allocate a DOM node per name per frame.
 */
export interface BerxLabelBox {
	/** What actually gets drawn — long names are cut, not wrapped. */
	readonly clipped: string;
	readonly font: string;
	readonly width: number;
	readonly height: number;
	readonly padX: number;
}

let measureContext: CanvasRenderingContext2D | null | undefined;
const measured = new Map<string, BerxLabelBox>();

export function berxLabelBox(text: string, pixelHeight: number = BERX_LABEL_PIXEL_HEIGHT): BerxLabelBox | undefined {
	const label = text.trim();
	if (label.length === 0) return undefined;
	const key = `${pixelHeight}\u0000${label}`;
	const hit = measured.get(key);
	if (hit) return hit;
	if (measureContext === undefined) measureContext = document.createElement('canvas').getContext('2d');
	const context = measureContext;
	if (!context) return undefined;
	const font = `500 ${pixelHeight}px system-ui, -apple-system, "Segoe UI", sans-serif`;
	context.font = font;
	const clipped = label.length > 48 ? `${label.slice(0, 47)}…` : label;
	const metrics = context.measureText(clipped);
	/* padding so the mipmap chain does not bleed the edge glyphs */
	const padX = Math.ceil(pixelHeight * 0.35);
	const padY = Math.ceil(pixelHeight * 0.3);
	const box: BerxLabelBox = {
		clipped, font, padX,
		width: Math.max(2, Math.ceil(metrics.width) + padX * 2),
		height: pixelHeight + padY * 2,
	};
	measured.set(key, box);
	return box;
}

/**
 * How many times wider than tall a label is — the quad's own aspect.
 *
 * This is what the ring's layout reserves room for and what the
 * renderers scale their quad by: `halfWidth = halfHeight * aspect`.
 * Undefined for a label with nothing to draw, which is the same answer
 * the atlas gives, so a blank affordance is neither drawn nor spaced
 * for.
 */
export function berxMeasureLabel(text: string, pixelHeight: number = BERX_LABEL_PIXEL_HEIGHT): number | undefined {
	const box = berxLabelBox(text, pixelHeight);
	return box ? box.width / box.height : undefined;
}
