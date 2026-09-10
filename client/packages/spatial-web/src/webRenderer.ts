/**
 * The web's renderer boundary.
 *
 * BERX has two GPU backends on the web now — WebGL2 and WebGPU — and
 * the host has to be able to run on either without knowing which. This
 * is the surface it actually uses, written down once, so a backend that
 * cannot do all of it fails to compile rather than failing at runtime
 * halfway through a session.
 *
 * It is deliberately narrow. Everything about the world — what to draw,
 * in what order, at what level of detail, where a name stands, where
 * the action ring sits — is decided in @berx/spatial and arrives in the
 * draw list. What is left here is genuinely per-API: buffers, textures,
 * passes, and the handful of things a host needs to ask a renderer
 * about itself.
 */
import type {
	Berx5DFrame,
	BerxActionSlot,
	BerxHit,
	BerxSpatialAffordance,
	BerxWorldLighting,
} from '@berx/spatial';
import type {BerxFrameStats, BerxSpatialRenderOptions, BerxThreeRuntimeRenderer} from './threeRuntime';
import type {BerxWebGPURuntimeRenderer} from './webgpuRuntime';

export interface BerxWebRendererBackend {
	readonly kind: 'webgl2' | 'webgpu';
	readonly capabilities: {
		perspective: boolean;
		depthBuffer: boolean;
		physicallyLitMaterials: boolean;
		shadows: boolean;
		postProcessing: boolean;
	};
	resize(width: number, height: number): void;
	render(frame: Berx5DFrame, options?: BerxSpatialRenderOptions): void;
	pick(frame: Berx5DFrame, x: number, y: number): BerxHit | undefined;
	/**
	 * The distance to the surface this backend actually DREW at a pixel.
	 *
	 * The one authority for "what is in front" — `pick` resolves an
	 * entity with it, and the shell tests the affordance ring against
	 * the same number so a ring and an entity cannot disagree about
	 * which of them a person is touching.
	 *
	 * Optional because a backend may genuinely be unable to answer, and
	 * an invented depth is worse than none: WebGPU reads its G-buffer
	 * back asynchronously (`copyTextureToBuffer` then `mapAsync`) and a
	 * pick is a synchronous pointer event, so it answers undefined until
	 * that is solved. Undefined means "cannot say", and every caller
	 * falls back to the geometry it had before.
	 */
	depthAt?(x: number, y: number): number | undefined;
	setAffordances(affordances: readonly BerxSpatialAffordance[]): void;
	/**
	 * The slots the last frame actually DREW.
	 *
	 * The picker reads this rather than what was requested: an
	 * affordance whose glyphs are not resident draws nothing, and
	 * something invisible must not be touchable.
	 */
	readonly actionSlots: readonly BerxActionSlot[];
	/** What was handed in, so the difference can be measured. */
	readonly requestedSlots: readonly BerxActionSlot[];
	setLighting(lighting: BerxWorldLighting): void;
	readonly worldLighting: BerxWorldLighting;
	setObjectMedia(objectId: string, surfaces: readonly {uri: string}[]): void;
	forgetObjectMedia(objectId: string): void;
	readonly residentTextureCount: number;
	readonly residentLabelCount: number;
	readonly frameStats: BerxFrameStats;
	handleContextLost(reason?: string): void;
	dispose(): void;
}

/**
 * Both backends really do satisfy the boundary above.
 *
 * The factory returns the interface, so nothing else would check it:
 * a backend could quietly drop a method and the failure would only
 * appear when a session called it. These two lines fail the build
 * instead.
 */
type Satisfies<T extends BerxWebRendererBackend> = T;
export type BerxWebGL2Backend = Satisfies<BerxThreeRuntimeRenderer>;
export type BerxWebGPUBackend = Satisfies<BerxWebGPURuntimeRenderer>;

export interface BerxWebRendererOptions {
	textureBudget?: number;
	labelBudget?: number;
	onMediaError?: (uri: string, error: unknown) => void;
	/**
	 * Which backend to build.
	 *
	 * `auto` prefers WebGPU where the browser grants a device and falls
	 * back to WebGL2 where it does not — there is no third outcome, and
	 * nothing degrades to a flat approximation. `webgl2` and `webgpu`
	 * ask for one specifically; asking for `webgpu` where there is none
	 * fails rather than silently giving back the other, because a
	 * verification that asked for WebGPU must not pass on WebGL2.
	 */
	prefer?: 'auto' | 'webgl2' | 'webgpu';
}

/**
 * A renderer for this canvas, on the best GPU API this browser has.
 *
 * Asynchronous because asking for a WebGPU adapter is: there is no way
 * to know whether a browser really has a device without waiting for the
 * answer, and guessing from `navigator.gpu` alone is how a page ends up
 * with a renderer it cannot use.
 */
export async function createBerxWebRenderer(
	canvas: HTMLCanvasElement,
	options: BerxWebRendererOptions = {},
): Promise<BerxWebRendererBackend> {
	const prefer = options.prefer ?? 'auto';
	if (prefer !== 'webgl2') {
		const {BerxWebGPURuntimeRenderer, berxWebGPUCanvasPresentable} = await import('./webgpuRuntime');
		/* An adapter is not a working renderer. Presenting to a canvas is
		   measured on a throwaway one first, because a backend that loses
		   its device on the first frame would take the session with it —
		   and because a canvas can hold only one kind of context, so
		   finding out on the real one leaves nowhere to fall back to. */
		const presentable = await berxWebGPUCanvasPresentable();
		if (presentable.ok) {
			const webgpu = await BerxWebGPURuntimeRenderer.create(canvas, options);
			if (webgpu) return webgpu;
		}
		if (prefer === 'webgpu') {
			throw new Error(`BERX 5D: WebGPU was asked for and cannot draw here — ${presentable.reason ?? 'this browser granted no device'}`);
		}
	}
	const {BerxThreeRuntimeRenderer} = await import('./threeRuntime');
	return new BerxThreeRuntimeRenderer(canvas, options);
}
