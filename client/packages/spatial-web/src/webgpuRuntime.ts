/**
 * The BERX world, through WebGPU.
 *
 * This is a second web backend, not a second product. It consumes the
 * same draw list from the same shared core as the WebGL2 renderer, runs
 * the same shader the native desktop backend runs — literally the same
 * text, from @berx/spatial-shaders — and tessellates the same
 * primitives at the same levels of detail. Where WebGPU exists it draws
 * the world; where it does not, `BerxWebGPURuntimeRenderer.create`
 * returns undefined and the host keeps WebGL2. Nothing degrades to a
 * flat approximation.
 *
 * What it does not do is reported rather than implied. There is no
 * shadow map, no image-based lighting and no post chain, the same as on
 * WebGL2, and `capabilities` says so. Media is drawn: not through
 * `copyExternalImageToTexture`, which this driver does not support, but
 * through `writeTexture` from decoded pixels — see webgpuMediaTextures.
 * Media textures carry no mipmap chain here, because WebGPU has no
 * generateMipmap and the downsample passes are not written yet, so a
 * distant photograph is softer than on WebGL2.
 */
import {
	berxBuildDrawList,
	berxEyeCamera,
	berxWorldLighting,
	pickSpatialObject,
	rayFromNdc,
	BERX_WORLD_CLEAR,
	type Berx5DFrame,
	type BerxActionSlot,
	type BerxDrawList,
	type BerxHit,
	type BerxSpatialAffordance,
	type BerxSpatialRenderer,
	type BerxWorldLighting,
} from '@berx/spatial';
import {BERX_LABEL_WGSL, BERX_WORLD_WGSL} from '@berx/spatial-shaders';
import {createBox, createSphere, createRing, createFrame, type BerxPrimitiveMesh} from './primitiveGeometry';
import {BerxWebGPUMediaTextures} from './webgpuMediaTextures';
import {BerxWebGPUTextAtlas} from './webgpuText';
import type {BerxFrameStats, BerxSpatialRenderOptions} from './threeRuntime';

/** Bytes per draw item. The struct is exactly this, and it is also the alignment. */
const DRAW_STRIDE = 256;
/* proj(64) + view(64) + camera(16) + ambient(16) + key_dir(16) +
   key_col(16) + light_vp(64) + shadow(16) + the room's five vec4s (80)
   — the Globals struct in world.wgsl, in the order it declares them. */
const GLOBALS_BYTES = 352;
/** The square depth map the key light writes. Matches the shared core's. */
const SHADOW_FORMAT: GPUTextureFormat = 'depth32float';
/** Bytes per label. One dynamic offset each, at the alignment the API wants. */
const LABEL_STRIDE = 256;
const LABEL_GLOBALS_BYTES = 160;
/** Matches the WebGL2 canvas's `antialias: true`, so the two agree at edges. */
const SAMPLE_COUNT = 4;

/** The same table as the WebGL2 backend's, at the same levels of detail. */
function meshFor(primitive: string, lod: 0 | 1): BerxPrimitiveMesh {
	const far = lod === 1;
	switch (primitive) {
		case 'orb': return createSphere(.5, far ? 10 : 24, far ? 7 : 16);
		case 'ring': return createRing(.62, .42, far ? 16 : 48);
		case 'frame': return createFrame(1, 1, .12);
		case 'surface': return createBox(1, 1, .06);
		case 'portal': return createFrame(1, 1.2, .16);
		case 'node': return createSphere(.58, far ? 9 : 20, far ? 6 : 12);
		case 'stack': return createBox(1, 1, .32);
		case 'message': return createBox(1, .46, .12);
		case 'create': return createSphere(.58, far ? 11 : 28, far ? 7 : 18);
		default: throw new Error(`BERX 5D WebGPU: unknown primitive '${primitive}'`);
	}
}

/**
 * GL clip space runs z in -1..1; WGSL runs 0..1. The shared core emits
 * one projection, so the remap happens in the backends whose API
 * convention differs — never in the core, which would then be carrying
 * a platform's opinion.
 */
function glToWgpuDepth(projection: readonly number[]): Float32Array {
	const m = Float32Array.from(projection);
	for (let c = 0; c < 4; c++) {
		m[c * 4 + 2] = (projection[c * 4 + 2] + projection[c * 4 + 3]) * 0.5;
	}
	return m;
}

interface GpuMesh {
	vertices: GPUBuffer;
	indices: GPUBuffer;
	count: number;
	/** local XY half-extent, measured from the vertices themselves */
	halfX: number;
	halfY: number;
}

/**
 * Can this browser actually present WebGPU to a canvas?
 *
 * Having an adapter is not the same as being able to draw with one. On
 * the software Vulkan stack these gates run against, a device is
 * granted, the offscreen path works perfectly — and the first present
 * to a canvas loses the device with "a valid external Instance
 * reference no longer exists". A session started on that backend goes
 * dark one frame in.
 *
 * So this measures it, on a throwaway canvas, before anything real is
 * built on it: request a device, clear the canvas once, wait a frame,
 * and report whether the device is still there. It costs one frame at
 * startup and is the difference between preferring the better renderer
 * and gambling on it.
 */
export async function berxWebGPUCanvasPresentable(): Promise<{ok: boolean; reason?: string}> {
	const gpu = (navigator as Navigator & {gpu?: GPU}).gpu;
	if (!gpu) return {ok: false, reason: 'navigator.gpu is absent'};
	let device: GPUDevice | undefined;
	try {
		const adapter = await gpu.requestAdapter({powerPreference: 'high-performance'});
		if (!adapter) return {ok: false, reason: 'navigator.gpu granted no adapter'};
		device = await adapter.requestDevice();
		let lostReason: string | undefined;
		void device.lost.then((info) => {
			lostReason = `${info.reason}: ${info.message}`.trim();
		});
		const canvas = document.createElement('canvas');
		canvas.width = 16;
		canvas.height = 16;
		const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
		if (!context) return {ok: false, reason: 'the canvas granted no webgpu context'};
		context.configure({device, format: 'rgba8unorm', alphaMode: 'opaque'});
		/* Two presents, then several frames of waiting. A device that
		   dies on presentation dies on the first one, but the loss
		   arrives as a promise a tick or two later — racing it against a
		   single frame decides by timing rather than by fact, and the
		   answer has to be the same every run for the shell and a gate to
		   agree about it. */
		for (let frame = 0; frame < 2 && !lostReason; frame++) {
			const encoder = device.createCommandEncoder();
			encoder.beginRenderPass({
				colorAttachments: [{
					view: context.getCurrentTexture().createView(),
					clearValue: {r: 0, g: 0, b: 0, a: 1},
					loadOp: 'clear', storeOp: 'store',
				}],
			}).end();
			device.queue.submit([encoder.finish()]);
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}
		for (let settle = 0; settle < 4 && !lostReason; settle++) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}
		if (lostReason) return {ok: false, reason: `the device was lost on presenting to a canvas (${lostReason})`};
		return {ok: true};
	} catch (error) {
		return {ok: false, reason: error instanceof Error ? error.message : String(error)};
	} finally {
		/* the probe's device is never the session's: it has already
		   presented to a canvas nobody will see again */
		try {
			device?.destroy();
		} catch {
			/* a device that is already gone needs no destroying */
		}
	}
}

export class BerxWebGPURuntimeRenderer implements BerxSpatialRenderer {
	readonly kind = 'webgpu' as const;
	/* what this backend really does, and nothing it does not */
	readonly capabilities = {
		perspective: true,
		depthBuffer: true,
		physicallyLitMaterials: true,
		shadows: true,
		postProcessing: false,
	} as const;
	/** What this backend has, beyond the renderer interface's own list. */
	readonly extendedCapabilities = {
		mediaSurfaces: true,
		/** Built on the CPU, since WebGPU has no generateMipmap of its own. */
		mediaMipmaps: true,
		worldSpaceLabels: true,
		labelMipmaps: true,
		multisample: SAMPLE_COUNT,
	} as const;

	private readonly meshes = new Map<string, GpuMesh>();
	private readonly globals: GPUBuffer;
	private globalsBind: GPUBindGroup;
	private readonly shadowSampler: GPUSampler;
	private shadowMap: GPUTexture;
	private shadowSize: number;
	private readonly shadowGlobalsBind: GPUBindGroup;
	private drawBuffer?: GPUBuffer;
	private drawBind?: GPUBindGroup;
	private drawCapacity = 0;
	private readonly textures: BerxWebGPUMediaTextures;
	/** objectId -> the one media URI drawn on its face */
	private readonly media = new Map<string, string>();
	private readonly mediaSampler: GPUSampler;
	private readonly mediaLayout: GPUBindGroupLayout;
	/** bound where an object has no picture, so the flag alone decides */
	private readonly blankBind: GPUBindGroup;
	private readonly mediaBinds = new Map<string, GPUBindGroup>();
	private readonly labels: BerxWebGPUTextAtlas;
	private readonly labelGlobals: GPUBuffer;
	private readonly labelGlobalsBind: GPUBindGroup;
	private labelBuffer?: GPUBuffer;
	private labelBind?: GPUBindGroup;
	private labelCapacity = 0;
	private readonly labelBinds = new Map<string, GPUBindGroup>();
	/** Every uncaptured device error since this renderer was created. */
	errors: string[] = [];
	private affordances: readonly BerxSpatialAffordance[] = [];
	private slots: readonly BerxActionSlot[] = [];
	private lighting: BerxWorldLighting = berxWorldLighting();
	/** Resolves when the device is lost, with the reason it was lost. */
	private lost?: string;
	private lostPromise: Promise<string> = new Promise(() => {});
	/**
	 * The adapter this device came from, kept alive on purpose.
	 *
	 * Dropping it lets the implementation collect the object that owns
	 * the WebGPU instance, and the device is then lost mid-session with
	 * "a valid external Instance reference no longer exists" — a live
	 * session going dark for no reason a caller could see. Holding the
	 * reference is what stops that.
	 */
	adapter?: GPUAdapter;
	private offscreen?: GPUTexture;
	private msaa?: GPUTexture;
	private depth?: GPUTexture;
	private width = 1;
	private height = 1;
	private stats: BerxFrameStats = {
		visible: 0, inFrustum: 0, drawCalls: 0, triangles: 0, lodReduced: 0,
		budgetCut: 0, residentTextures: 0, residentLabels: 0, meshVariants: 0,
	};

	private constructor(
		private readonly canvas: HTMLCanvasElement,
		/**
		 * The device this backend draws on.
		 *
		 * Public because WebGPU-specific things a host may legitimately
		 * need — limits, error scopes, releasing the GPU when a tab is
		 * hidden — go through it, and because ending it is the only way
		 * to make a device loss happen on purpose.
		 */
		readonly device: GPUDevice,
		private readonly context: GPUCanvasContext,
		private readonly format: GPUTextureFormat,
		private readonly pipeline: GPURenderPipeline,
		private readonly drawLayout: GPUBindGroupLayout,
		mediaLayout: GPUBindGroupLayout,
		private readonly labelPipeline: GPURenderPipeline,
		private readonly labelLayout: GPUBindGroupLayout,
		private readonly shadowPipeline: GPURenderPipeline,
		options: {textureBudget?: number; labelBudget?: number; onMediaError?: (uri: string, error: unknown) => void},
	) {
		this.labels = new BerxWebGPUTextAtlas(device, {budget: options.labelBudget});
		this.labelGlobals = device.createBuffer({size: LABEL_GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
		this.labelGlobalsBind = device.createBindGroup({
			layout: labelPipeline.getBindGroupLayout(0),
			entries: [{binding: 0, resource: {buffer: this.labelGlobals}}],
		});
		this.mediaLayout = mediaLayout;
		this.textures = new BerxWebGPUMediaTextures(device, {budget: options.textureBudget, onError: options.onMediaError});
		this.mediaSampler = device.createSampler({magFilter: 'linear', minFilter: 'linear'});
		const blank = device.createTexture({
			size: {width: 1, height: 1},
			format: 'rgba8unorm',
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
		});
		/* one defined white pixel: unused where the flag is zero, but a
		   texture is never left with undefined contents */
		device.queue.writeTexture({texture: blank}, new Uint8Array([255, 255, 255, 255]), {bytesPerRow: 4, rowsPerImage: 1}, {width: 1, height: 1});
		this.blankBind = device.createBindGroup({
			layout: mediaLayout,
			entries: [
				{binding: 0, resource: this.mediaSampler},
				{binding: 1, resource: blank.createView()},
			],
		});
		this.globals = device.createBuffer({size: GLOBALS_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
		/* `compare: 'less'` is what makes this a comparison sampler: the
		   hardware runs the depth test per tap and averages the RESULTS.
		   Averaging depths instead would produce a surface that exists
		   nowhere. */
		this.shadowSampler = device.createSampler({
			compare: 'less', magFilter: 'linear', minFilter: 'linear',
			addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
		});
		/* A 1x1 stand-in, bound whenever there is nothing to cast. The
		   bind group must always be complete; the shadow strength in the
		   uniform is what actually turns the sampling off. */
		this.shadowMap = device.createTexture({
			size: {width: 1, height: 1}, format: SHADOW_FORMAT,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		});
		this.shadowSize = 0;
		this.globalsBind = this.buildGlobalsBind();
		/* the same uniform buffer, without the depth texture — see the
		   shadow pipeline's own layout for why */
		this.shadowGlobalsBind = device.createBindGroup({
			layout: shadowPipeline.getBindGroupLayout(0),
			entries: [{binding: 0, resource: {buffer: this.globals}}],
		});
		this.resize(canvas.width || 1, canvas.height || 1);
	}

	/**
	 * Build the backend, or say honestly that this browser has no
	 * WebGPU. Returns undefined rather than throwing, so a host can ask
	 * for the better renderer and keep the working one when the answer
	 * is no.
	 */
	static async create(
		canvas: HTMLCanvasElement,
		options: {textureBudget?: number; labelBudget?: number; onMediaError?: (uri: string, error: unknown) => void} = {},
	): Promise<BerxWebGPURuntimeRenderer | undefined> {
		const gpu = (navigator as Navigator & {gpu?: GPU}).gpu;
		if (!gpu) return undefined;
		const adapter = await gpu.requestAdapter({powerPreference: 'high-performance'});
		if (!adapter) return undefined;
		const device = await adapter.requestDevice();
		/* A WebGPU validation error does not throw: it is reported and the
		   offending work is dropped, which looks exactly like a renderer
		   that drew nothing. Capturing them is what makes that difference
		   visible instead of silent. */
		const errors: string[] = [];
		device.onuncapturederror = (event) => {
			errors.push((event as GPUUncapturedErrorEvent).error.message);
		};
		const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
		if (!context) return undefined;
		/* rgba8unorm, not the preferred srgb format: the WebGL2 backend
		   writes into a plain RGBA8 drawing buffer, and an sRGB target
		   would re-encode every colour so the two backends could never be
		   compared */
		const format: GPUTextureFormat = 'rgba8unorm';
		/* COPY_SRC so the frame can be read back off the GPU: a renderer
		   whose output is never observed proves nothing, and the
		   cross-renderer gate compares these bytes against the WebGL2 and
		   native ones */
		context.configure({
			device, format, alphaMode: 'opaque',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
		});

		const module = device.createShaderModule({code: BERX_WORLD_WGSL});
		const drawLayout = device.createBindGroupLayout({
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: {type: 'uniform', hasDynamicOffset: true, minBindingSize: DRAW_STRIDE},
			}],
		});
		const mediaLayout = device.createBindGroupLayout({
			entries: [
				{binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
				{binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float', viewDimension: '2d'}},
			],
		});
		const globalsLayout = device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
					buffer: {type: 'uniform', minBindingSize: GLOBALS_BYTES},
				},
				/* A comparison sampler, not a filtering one: the hardware
				   does the depth test per sample and averages the results,
				   which is what makes the 3x3 tap a soft edge. */
				{binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}},
				{binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth', viewDimension: '2d'}},
			],
		});
		const pipeline = device.createRenderPipeline({
			layout: device.createPipelineLayout({bindGroupLayouts: [globalsLayout, drawLayout, mediaLayout]}),
			vertex: {
				module, entryPoint: 'vs',
				buffers: [{
					arrayStride: 24,
					attributes: [
						{shaderLocation: 0, offset: 0, format: 'float32x3'},
						{shaderLocation: 1, offset: 12, format: 'float32x3'},
					],
				}],
			},
			fragment: {
				module, entryPoint: 'fs',
				targets: [{
					format,
					/* the same blend the WebGL2 backend runs */
					blend: {
						color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
						alpha: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
					},
				}],
			},
			primitive: {topology: 'triangle-list', frontFace: 'ccw', cullMode: 'back'},
			depthStencil: {format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less'},
			multisample: {count: SAMPLE_COUNT},
		});
		/**
		 * The depth-only pass, from the light.
		 *
		 * Same module, same vertex layout, same Draw bind group — a
		 * shadow cast by a different shape from the one drawn is worse
		 * than no shadow, because it is a shape that is not there. Front
		 * faces are culled rather than back faces: recording the FAR side
		 * of each caster moves the recorded depth away from the surface
		 * being tested, which removes self-shadowing acne without a bias
		 * large enough to detach a shadow from its object's foot.
		 *
		 * No fragment stage at all — the depth buffer is the whole output.
		 */
		/**
		 * Its own group-0 layout, holding the uniform buffer ONLY.
		 *
		 * Reusing the world pass's layout put the depth texture in the
		 * shadow pass's bind group while that same texture was the pass's
		 * render attachment — WebGPU rejected it outright: "usage
		 * includes writable usage and another usage in the same
		 * synchronization scope". A validation error, caught by the
		 * device rather than by reading, and exactly the kind a
		 * hand-written binding is prone to.
		 */
		const shadowGlobalsLayout = device.createBindGroupLayout({
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: {type: 'uniform', minBindingSize: GLOBALS_BYTES},
			}],
		});
		const shadowPipeline = device.createRenderPipeline({
			layout: device.createPipelineLayout({bindGroupLayouts: [shadowGlobalsLayout, drawLayout]}),
			vertex: {
				module, entryPoint: 'vs_shadow',
				buffers: [{
					arrayStride: 24,
					attributes: [
						{shaderLocation: 0, offset: 0, format: 'float32x3'},
						{shaderLocation: 1, offset: 12, format: 'float32x3'},
					],
				}],
			},
			primitive: {topology: 'triangle-list', frontFace: 'ccw', cullMode: 'front'},
			depthStencil: {format: SHADOW_FORMAT, depthWriteEnabled: true, depthCompare: 'less'},
		});
		/* the label pass: its own pipeline, its own quad, its own atlas.
		   Depth-tested against the world so a name behind a place is
		   hidden by it, with depth writes off so names never occlude each
		   other into flicker. */
		const labelModule = device.createShaderModule({code: BERX_LABEL_WGSL});
		const labelGlobalsLayout = device.createBindGroupLayout({
			entries: [{binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform', minBindingSize: LABEL_GLOBALS_BYTES}}],
		});
		const labelLayout = device.createBindGroupLayout({
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: {type: 'uniform', hasDynamicOffset: true, minBindingSize: LABEL_STRIDE},
			}],
		});
		const labelPipeline = device.createRenderPipeline({
			layout: device.createPipelineLayout({bindGroupLayouts: [labelGlobalsLayout, labelLayout, mediaLayout]}),
			vertex: {module: labelModule, entryPoint: 'vs'},
			fragment: {
				module: labelModule, entryPoint: 'fs',
				targets: [{
					format,
					blend: {
						color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
						alpha: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
					},
				}],
			},
			/* two-sided: a name has no back, and culling one would make it
			   vanish when the camera crossed behind its plane */
			primitive: {topology: 'triangle-list', cullMode: 'none'},
			depthStencil: {format: 'depth32float', depthWriteEnabled: false, depthCompare: 'less'},
			multisample: {count: SAMPLE_COUNT},
		});

		const renderer = new BerxWebGPURuntimeRenderer(canvas, device, context, format, pipeline, drawLayout, mediaLayout, labelPipeline, labelLayout, shadowPipeline, options);
		renderer.errors = errors;
		renderer.adapter = adapter;
		renderer.lostPromise = device.lost.then((info) => {
			const reason = `${info.reason}: ${info.message}`.trim();
			renderer.handleContextLost(reason);
			return reason;
		});
		return renderer;
	}

	get frameStats(): BerxFrameStats {return {...this.stats};}
	/** What can be done to the focused entity. State, not a constant. */
	setAffordances(affordances: readonly BerxSpatialAffordance[]): void {this.affordances = affordances;}
	/** Where the ring stood in the last drawn frame. */
	get actionSlots(): readonly BerxActionSlot[] {return this.slots;}
	/** Relight the world. Lights are state, not constants baked into a shader. */
	setLighting(lighting: BerxWorldLighting): void {this.lighting = lighting;}
	get worldLighting(): BerxWorldLighting {return this.lighting;}
	get residentTextureCount(): number {return this.textures.residentCount;}
	get residentLabelCount(): number {return this.labels.residentCount;}
	/** Why the GPU device went away, if it has. Undefined while it is alive. */
	get deviceLost(): string | undefined {return this.lost;}
	/**
	 * Resolves when the device is gone, with the reason.
	 *
	 * WebGPU has no restore: a lost device stays lost, and continuing
	 * means asking for another one. The host watches this and rebuilds,
	 * which is possible only because none of the world is in here.
	 */
	get whenLost(): Promise<string> {return this.lostPromise;}

	/**
	 * What the viewer is pointing at.
	 *
	 * The same shared-core ray cast the WebGL2 backend uses, against the
	 * same world objects: a spatial identity picked here is the same
	 * identity picked there. `x`/`y` are in backing-store pixels, the
	 * space the frame was drawn in.
	 */
	pick(frame: Berx5DFrame, x: number, y: number): BerxHit | undefined {
		const ray = rayFromNdc(frame.camera, (x / this.width) * 2 - 1, 1 - (y / this.height) * 2, this.width / this.height);
		return ray ? pickSpatialObject(ray, frame.world.objects) : undefined;
	}

	/**
	 * A lost WebGPU device invalidates every handle at once.
	 *
	 * There is no equivalent of WebGL's context-restored event: the
	 * device is gone and a new one must be requested, which is the
	 * host's decision rather than this object's. All this does is stop
	 * the renderer from calling into a dead device and record why.
	 */
	handleContextLost(reason = 'device lost'): void {
		this.lost = reason;
		this.meshes.clear();
		this.mediaBinds.clear();
		this.labelBinds.clear();
	}

	resize(width: number, height: number): void {
		this.width = Math.max(1, Math.floor(width));
		this.height = Math.max(1, Math.floor(height));
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.msaa?.destroy();
		this.depth?.destroy();
		this.offscreen?.destroy();
		/* A second, offscreen resolve target the same size as the canvas.
		   Reading a canvas texture back is unsupported on the software
		   driver these gates run against — copyTextureToBuffer from it
		   makes the whole submission fail — so verification renders the
		   same list, through the same pipeline and shader, into this
		   instead. Only the attachment differs. */
		this.offscreen = this.device.createTexture({
			size: {width: this.width, height: this.height},
			format: this.format,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
		});
		this.msaa = this.device.createTexture({
			size: {width: this.width, height: this.height},
			sampleCount: SAMPLE_COUNT,
			format: this.format,
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});
		this.depth = this.device.createTexture({
			size: {width: this.width, height: this.height},
			sampleCount: SAMPLE_COUNT,
			format: 'depth32float',
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});
	}

	private mesh(primitive: string, lod: 0 | 1): GpuMesh {
		const key = `${primitive}:${lod}`;
		let m = this.meshes.get(key);
		if (!m) {
			const source = meshFor(primitive, lod);
			const vertices = this.device.createBuffer({size: source.vertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
			this.device.queue.writeBuffer(vertices, 0, source.vertices);
			/* index buffers must be a multiple of 4 bytes; an odd index
			   count is padded rather than truncated */
			const indexBytes = Math.ceil(source.indices.byteLength / 4) * 4;
			const indices = this.device.createBuffer({size: indexBytes, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST});
			this.device.queue.writeBuffer(indices, 0, source.indices);
			let halfX = 0, halfY = 0;
			for (let i = 0; i < source.vertices.length; i += 6) {
				halfX = Math.max(halfX, Math.abs(source.vertices[i]));
				halfY = Math.max(halfY, Math.abs(source.vertices[i + 1]));
			}
			m = {vertices, indices, count: source.indices.length, halfX: halfX || .5, halfY: halfY || .5};
			this.meshes.set(key, m);
		}
		return m;
	}

	render(frame: Berx5DFrame, options: BerxSpatialRenderOptions = {}): void {
		if (this.lost) return;
		const listFor = (eye: Berx5DFrame, width: number, height: number) => berxBuildDrawList(eye, {
			width, height,
			maxObjects: options.maxObjects,
			ambientMotion: options.ambientMotion,
			shadows: options.shadows,
			lighting: this.lighting,
			mediaFor: (id) => this.media.get(id),
			affordances: this.affordances,
		});
		if (options.stereo) {
			/* the same world, the same lights and the same budget, drawn
			   twice from cameras a real interpupillary distance apart —
			   not a second rendering path */
			const half = Math.max(1, Math.floor(this.width / 2));
			this.draw(
				listFor({...frame, camera: berxEyeCamera(frame.camera, options.stereo.ipd, -1)}, half, this.height),
				false,
				{x: 0, width: half},
				{clear: true, keep: true},
			);
			this.draw(
				listFor({...frame, camera: berxEyeCamera(frame.camera, options.stereo.ipd, 1)}, half, this.height),
				false,
				{x: half, width: half},
				{clear: false, keep: false},
			);
			return;
		}
		this.draw(listFor(frame, this.width, this.height));
	}

	/**
	 * Draw a list the caller already resolved.
	 *
	 * `offscreen` sends the resolve to a texture that can be read back
	 * rather than to the canvas. It is the same pipeline, the same
	 * shader and the same draw list; the cross-renderer gate uses it
	 * because this driver cannot copy out of a canvas texture.
	 */
	/** The bind group the world pass uses: globals plus the depth map. */
	private buildGlobalsBind(): GPUBindGroup {
		return this.device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{binding: 0, resource: {buffer: this.globals}},
				{binding: 1, resource: this.shadowSampler},
				{binding: 2, resource: this.shadowMap.createView()},
			],
		});
	}

	/**
	 * The depth target the light writes, rebuilt only when the size
	 * changes. Rebuilding the bind group with it is not optional: a bind
	 * group holds the VIEW, so a new texture with the old group bound
	 * would sample the destroyed one.
	 */
	private ensureShadowMap(size: number): void {
		if (this.shadowSize === size) return;
		this.shadowMap.destroy();
		this.shadowMap = this.device.createTexture({
			size: {width: size, height: size}, format: SHADOW_FORMAT,
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		});
		this.shadowSize = size;
		this.globalsBind = this.buildGlobalsBind();
	}

	draw(
		list: BerxDrawList,
		offscreen = false,
		viewport?: {x: number; width: number},
		pass_?: {clear: boolean; keep: boolean},
	): void {
		if (this.lost) return;
		const device = this.device;

		const globals = new Float32Array(GLOBALS_BYTES / 4);
		globals.set(glToWgpuDepth(list.projection), 0);
		globals.set(list.view, 16);
		globals.set([list.camera.x, list.camera.y, list.camera.z, 0], 32);
		globals.set([list.ambient[0], list.ambient[1], list.ambient[2], 0], 36);
		globals.set([list.key.direction.x, list.key.direction.y, list.key.direction.z, 0], 40);
		globals.set([list.key.colour[0], list.key.colour[1], list.key.colour[2], list.key.intensity], 44);
		/* The light's own matrix goes through the SAME depth remap every
		   other projection does: the shared core produces GL clip space
		   (z from -1 to 1) and this API wants 0 to 1. The convention
		   difference lives here, in the backend, never in the core. */
		if (list.shadow) {
			this.ensureShadowMap(list.shadow.mapSize);
			globals.set(glToWgpuDepth(list.shadow.viewProjection), 48);
			globals.set([
				1 / list.shadow.mapSize,
				list.shadow.depthBias,
				list.shadow.normalBias,
				list.shadow.strength,
			], 64);
		} else {
			/* strength 0 is what turns the sampling off in the shader; the
			   bind group still has to be complete, so the 1x1 stand-in
			   stays bound */
			globals.set([0, 0, 0, 0], 64);
		}
		/* THE ROOM. Copied verbatim from the shared core's packing — this
		   backend does not know the order and must not: berxEnvironmentUniform
		   owns it, world.wgsl's uniform block mirrors it, and a copy here
		   would be a third opinion about which slot holds the sun. */
		globals.set(list.environment, 68);
		device.queue.writeBuffer(this.globals, 0, globals);

		const count = Math.max(1, list.items.length);
		if (!this.drawBuffer || this.drawCapacity < count) {
			this.drawBuffer?.destroy();
			this.drawBuffer = device.createBuffer({size: count * DRAW_STRIDE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
			this.drawCapacity = count;
			this.drawBind = device.createBindGroup({
				layout: this.drawLayout,
				entries: [{binding: 0, resource: {buffer: this.drawBuffer, size: DRAW_STRIDE}}],
			});
		}
		this.textures.beginFrame();
		/* meshes and textures first: the uniform for an item carries its
		   mesh's own half-extent and the picture's real aspect ratio, so
		   both have to be resolved before the buffer is written */
		const resolved = list.items.map((item) => {
			const mesh = this.mesh(item.primitive, item.lod);
			const uri = item.media;
			const loaded = uri ? this.textures.get(uri) : undefined;
			return {item, mesh, uri, loaded};
		});

		const draws = new Float32Array(count * (DRAW_STRIDE / 4));
		resolved.forEach(({item, mesh, loaded}, i) => {
			const o = i * (DRAW_STRIDE / 4);
			draws.set(item.model, o);
			/* base.w and emissive.w carry the local half-extent the shader's
			   planar media projection needs */
			draws.set([item.base[0], item.base[1], item.base[2], mesh.halfX], o + 16);
			draws.set([item.emissive[0], item.emissive[1], item.emissive[2], mesh.halfY], o + 20);
			draws.set([item.metalness, item.roughness, item.opacity, item.transmission], o + 24);
			const near = item.pointLights.slice(0, 4);
			near.forEach((light, k) => {
				draws.set([light.position.x, light.position.y, light.position.z, light.range], o + 28 + k * 4);
				draws.set([light.colour[0], light.colour[1], light.colour[2], light.intensity], o + 44 + k * 4);
			});
			/* the same cover/contain correction the GLSL pass applies, from
			   the image's real decoded aspect ratio */
			const face = mesh.halfX / mesh.halfY;
			const fit = loaded ? loaded.aspectRatio / face : 1;
			draws.set([
				near.length,
				loaded ? (fit > 1 ? 1 / fit : 1) : 1,
				loaded ? (fit > 1 ? 1 : fit) : 1,
				loaded ? 1 : 0,
			], o + 60);
		});
		device.queue.writeBuffer(this.drawBuffer!, 0, draws);

		const encoder = device.createCommandEncoder();
		/* The light's pass first: the world pass samples the depth it
		   writes, in the same submission. */
		if (list.shadow) {
			const shadowPass = encoder.beginRenderPass({
				colorAttachments: [],
				depthStencilAttachment: {
					view: this.shadowMap.createView(),
					depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store',
				},
			});
			shadowPass.setPipeline(this.shadowPipeline);
			shadowPass.setBindGroup(0, this.shadowGlobalsBind);
			resolved.forEach(({item, mesh}, i) => {
				/* A surface you can see through does not stop light.
				   Casting from glass would put a solid shadow under
				   something transparent. */
				if (item.opacity < 0.95) return;
				shadowPass.setBindGroup(1, this.drawBind!, [i * DRAW_STRIDE]);
				shadowPass.setVertexBuffer(0, mesh.vertices);
				shadowPass.setIndexBuffer(mesh.indices, 'uint16');
				shadowPass.drawIndexed(mesh.count);
			});
			shadowPass.end();
		}
		const pass = encoder.beginRenderPass({
			colorAttachments: [{
				view: this.msaa!.createView(),
				resolveTarget: (offscreen ? this.offscreen! : this.context.getCurrentTexture()).createView(),
				clearValue: {r: BERX_WORLD_CLEAR[0], g: BERX_WORLD_CLEAR[1], b: BERX_WORLD_CLEAR[2], a: 1},
				loadOp: pass_?.clear === false ? 'load' : 'clear', storeOp: 'store',
			}],
			depthStencilAttachment: {
				view: this.depth!.createView(),
				depthClearValue: 1, depthLoadOp: pass_?.clear === false ? 'load' : 'clear', depthStoreOp: 'store',
			},
		});
		if (viewport) pass.setViewport(viewport.x, 0, viewport.width, this.height, 0, 1);
		pass.setPipeline(this.pipeline);
		pass.setBindGroup(0, this.globalsBind);
		let drawCalls = 0, triangles = 0;
		resolved.forEach(({mesh, uri, loaded}, i) => {
			pass.setBindGroup(1, this.drawBind!, [i * DRAW_STRIDE]);
			pass.setBindGroup(2, loaded && uri ? this.mediaBind(uri, loaded.view) : this.blankBind);
			pass.setVertexBuffer(0, mesh.vertices);
			pass.setIndexBuffer(mesh.indices, 'uint16');
			pass.drawIndexed(mesh.count);
			drawCalls++;
			triangles += mesh.count / 3;
		});
		/* names and the action ring, in the same pass and of the same
		   material — a word standing in the world beside its object */
		drawCalls += this.drawLabels(pass, list);
		pass.end();
		device.queue.submit([encoder.finish()]);

		this.slots = list.actionSlots;
		const accumulate = pass_?.keep === true;
		this.stats = accumulate ? {
			...this.stats,
			visible: list.stats.visible,
			inFrustum: list.stats.inFrustum,
			drawCalls,
			triangles,
			lodReduced: list.stats.lodReduced,
			budgetCut: list.stats.budgetCut,
			meshVariants: this.meshes.size,
		} : {
			visible: list.stats.visible,
			inFrustum: list.stats.inFrustum,
			drawCalls,
			triangles,
			lodReduced: list.stats.lodReduced,
			budgetCut: list.stats.budgetCut,
			residentTextures: this.textures.residentCount,
			residentLabels: this.labels.residentCount,
			meshVariants: this.meshes.size,
		};
		if (!accumulate && pass_?.clear === false) {
			/* the second eye: its counts add to the first's rather than
			   replacing them, so frameStats describes the whole frame */
			this.stats.drawCalls += this.stereoCarry.drawCalls;
			this.stats.triangles += this.stereoCarry.triangles;
			this.stats.inFrustum += this.stereoCarry.inFrustum;
			this.stats.lodReduced += this.stereoCarry.lodReduced;
			this.stats.budgetCut += this.stereoCarry.budgetCut;
		}
		if (accumulate) {
			this.stereoCarry = {
				drawCalls, triangles,
				inFrustum: list.stats.inFrustum,
				lodReduced: list.stats.lodReduced,
				budgetCut: list.stats.budgetCut,
			};
		}
	}

	private stereoCarry = {drawCalls: 0, triangles: 0, inFrustum: 0, lodReduced: 0, budgetCut: 0};

	/**
	 * The names and the action ring, where the shared core put them.
	 *
	 * One pass, one pipeline and one buffer, because they are the same
	 * kind of thing — a word standing in the world beside the object it
	 * belongs to. Names go far to near so the ones in front composite
	 * over the ones behind; the ring follows, on top of them. The
	 * placement — position, height, fade — is not decided here: it
	 * arrives in the draw list, which is what makes this pass comparable
	 * to the WebGL2 one.
	 *
	 * Capacity is settled before anything is recorded. Growing the
	 * buffer between two draws in the same pass would destroy the buffer
	 * the earlier draws are bound to.
	 */
	private drawLabels(pass: GPURenderPassEncoder, list: BerxDrawList): number {
		this.labels.beginFrame();
		if (!list.basis) return 0;

		const named = list.labels
			.map((placement) => ({
				position: placement.position,
				halfHeight: placement.halfHeight,
				alpha: placement.alpha,
				text: placement.text,
				glyphs: this.labels.get(placement.text),
			}))
			.filter((entry) => entry.glyphs !== undefined);
		const ring = list.actionSlots
			.map((slot) => ({
				position: slot.position,
				halfHeight: slot.halfHeight,
				alpha: 1,
				text: slot.affordance.label,
				glyphs: this.labels.get(slot.affordance.label),
			}))
			.filter((entry) => entry.glyphs !== undefined);
		const quads = [...named, ...ring];
		if (quads.length === 0) return 0;

		const globals = new Float32Array(LABEL_GLOBALS_BYTES / 4);
		globals.set(glToWgpuDepth(list.projection), 0);
		globals.set(list.view, 16);
		globals.set([list.basis.right.x, list.basis.right.y, list.basis.right.z, 0], 32);
		globals.set([list.basis.up.x, list.basis.up.y, list.basis.up.z, 0], 36);
		this.device.queue.writeBuffer(this.labelGlobals, 0, globals);

		this.ensureLabelCapacity(quads.length);
		const data = new Float32Array(quads.length * (LABEL_STRIDE / 4));
		quads.forEach((quad, i) => {
			const o = i * (LABEL_STRIDE / 4);
			data.set([quad.position.x, quad.position.y, quad.position.z, 0], o);
			data.set([quad.halfHeight * quad.glyphs!.aspect, quad.halfHeight, quad.alpha, 0], o + 4);
		});
		this.device.queue.writeBuffer(this.labelBuffer!, 0, data);

		pass.setPipeline(this.labelPipeline);
		pass.setBindGroup(0, this.labelGlobalsBind);
		quads.forEach((quad, i) => {
			pass.setBindGroup(1, this.labelBind!, [i * LABEL_STRIDE]);
			pass.setBindGroup(2, this.glyphBind(quad.text, quad.glyphs!.view));
			pass.draw(6);
		});
		return quads.length;
	}

	/**
	 * Room for `count` label quads.
	 *
	 * Sized before the pass records anything, because growing it after a
	 * draw is bound to the old buffer would destroy a buffer in use.
	 */
	private ensureLabelCapacity(count: number): void {
		if (this.labelBuffer && this.labelCapacity >= count) return;
		this.labelBuffer?.destroy();
		this.labelBuffer = this.device.createBuffer({
			size: Math.max(1, count) * LABEL_STRIDE,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
		this.labelCapacity = Math.max(1, count);
		this.labelBind = this.device.createBindGroup({
			layout: this.labelLayout,
			entries: [{binding: 0, resource: {buffer: this.labelBuffer, size: LABEL_STRIDE}}],
		});
	}

	private glyphBind(text: string, view: GPUTextureView): GPUBindGroup {
		let bind = this.labelBinds.get(text);
		if (!bind) {
			bind = this.device.createBindGroup({
				layout: this.mediaLayout,
				entries: [{binding: 0, resource: this.mediaSampler}, {binding: 1, resource: view}],
			});
			this.labelBinds.set(text, bind);
		}
		return bind;
	}

	private mediaBind(uri: string, view: GPUTextureView): GPUBindGroup {
		let bind = this.mediaBinds.get(uri);
		if (!bind) {
			bind = this.device.createBindGroup({
				layout: this.mediaLayout,
				entries: [{binding: 0, resource: this.mediaSampler}, {binding: 1, resource: view}],
			});
			this.mediaBinds.set(uri, bind);
		}
		return bind;
	}

	/**
	 * The one media surface an object shows.
	 *
	 * Only URIs the server actually sent ever reach here; an object with
	 * none keeps its material colour, which is what "no picture" looks
	 * like rather than a placeholder.
	 */
	setObjectMedia(objectId: string, media: readonly {uri: string}[]): void {
		const first = media.find((m) => m.uri)?.uri;
		if (first) this.media.set(objectId, first);
		else this.media.delete(objectId);
	}

	forgetObjectMedia(objectId: string): void {
		this.media.delete(objectId);
	}

	/**
	 * The frame that was just drawn, off the GPU.
	 *
	 * Tightly packed RGBA8, top row first — the same layout the native
	 * backend returns, so the two can be compared byte for byte.
	 */
	async readback(): Promise<Uint8Array> {
		const texture = this.offscreen!;
		const unpadded = this.width * 4;
		const padded = Math.ceil(unpadded / 256) * 256;
		const staging = this.device.createBuffer({
			size: padded * this.height,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});
		const encoder = this.device.createCommandEncoder();
		encoder.copyTextureToBuffer(
			{texture},
			{buffer: staging, bytesPerRow: padded, rowsPerImage: this.height},
			{width: this.width, height: this.height},
		);
		this.device.queue.submit([encoder.finish()]);
		/* wait for the copy to actually complete before asking to map it:
		   mapAsync on work the queue has not finished is where a readback
		   quietly turns into a hang or an aborted map */
		await this.device.queue.onSubmittedWorkDone();
		await staging.mapAsync(GPUMapMode.READ);
		const data = new Uint8Array(staging.getMappedRange());
		const out = new Uint8Array(unpadded * this.height);
		for (let row = 0; row < this.height; row++) {
			out.set(data.subarray(row * padded, row * padded + unpadded), row * unpadded);
		}
		staging.unmap();
		staging.destroy();
		return out;
	}

	dispose(): void {
		/* a device that is already gone has reclaimed all of this; calling
		   destroy() on its buffers would be calling into a dead driver */
		if (this.lost) {
			this.meshes.clear();
			this.mediaBinds.clear();
			this.labelBinds.clear();
			return;
		}
		for (const mesh of this.meshes.values()) {
			mesh.vertices.destroy();
			mesh.indices.destroy();
		}
		this.meshes.clear();
		this.mediaBinds.clear();
		this.labelBinds.clear();
		this.labels.dispose();
		this.labelBuffer?.destroy();
		this.labelGlobals.destroy();
		this.textures.dispose();
		this.drawBuffer?.destroy();
		this.globals.destroy();
		this.msaa?.destroy();
		this.depth?.destroy();
		this.offscreen?.destroy();
		this.device.destroy();
	}
}
