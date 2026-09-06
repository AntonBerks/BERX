/**
 * The targets BERX runs on, and what each one really is.
 *
 * One world, seven ways of standing in it. Nothing here changes the
 * world graph, the identities, the relations or the time — a watch and
 * a headset show the same BERX, framed for the body holding it. What
 * differs is how far the camera stands, how wide it sees, how many
 * eyes it has, and what the device can do.
 *
 * A target's capabilities are declared as what a build for it *must*
 * provide. A backend that cannot meet them is not a build of BERX for
 * that target, and `verify:5d-platforms` says so rather than letting
 * a half-implemented port claim the name.
 */
import type {
	BerxDisplay,
	BerxDisplayForm,
	BerxNavigationIntent,
	BerxPlatformCapabilities,
	BerxSpatialRendererBackend,
} from './platform';

/**
 * The eight things BERX ships as.
 *
 * Distinct from `BerxDisplayForm`, which is the shape of the surface:
 * web and desktop are both desktop-shaped, and iOS and Android are both
 * phone-shaped, but each is a separate build with its own GPU API and
 * its own inputs. Two tables for this existed with incompatible types
 * and the same exported name, which is what broke the build — there is
 * one now.
 */
export type BerxPlatformTargetName = 'web' | 'desktop' | 'tablet' | 'ios' | 'android' | 'watch' | 'ar' | 'vr';
export type BerxPlatformFamily = 'screen' | 'wearable' | 'immersive';
export type BerxInputKind = 'touch' | 'pointer' | 'keyboard' | 'gamepad' | 'watch-gesture' | 'xr-controller' | 'head-pose';

export interface BerxPlatformBuild {
	platform: BerxPlatformTargetName;
	family: BerxPlatformFamily;
	displayForm: BerxDisplayForm;
	/** The GPU API a real build for this target uses. */
	renderer: BerxPlatformCapabilities['gpu'];
	/** True when it cannot be built from the web toolchain alone. */
	nativeRequired: boolean;
	stereo: boolean;
	poseRequired: boolean;
	input: readonly BerxInputKind[];
}

/** Every BERX build target, and what each one really is. */
export const BERX_PLATFORM_BUILDS: readonly BerxPlatformBuild[] = [
	{platform: 'web', family: 'screen', displayForm: 'desktop', renderer: 'webgl2', nativeRequired: false, stereo: false, poseRequired: false, input: ['pointer', 'keyboard', 'touch']},
	{platform: 'desktop', family: 'screen', displayForm: 'desktop', renderer: 'vulkan', nativeRequired: true, stereo: false, poseRequired: false, input: ['pointer', 'keyboard', 'gamepad']},
	{platform: 'tablet', family: 'screen', displayForm: 'tablet', renderer: 'metal', nativeRequired: true, stereo: false, poseRequired: true, input: ['touch', 'head-pose']},
	{platform: 'ios', family: 'screen', displayForm: 'phone', renderer: 'metal', nativeRequired: true, stereo: false, poseRequired: true, input: ['touch', 'head-pose', 'gamepad']},
	{platform: 'android', family: 'screen', displayForm: 'phone', renderer: 'vulkan', nativeRequired: true, stereo: false, poseRequired: true, input: ['touch', 'head-pose', 'gamepad']},
	{platform: 'watch', family: 'wearable', displayForm: 'watch', renderer: 'metal', nativeRequired: true, stereo: false, poseRequired: false, input: ['watch-gesture']},
	{platform: 'ar', family: 'immersive', displayForm: 'ar', renderer: 'metal', nativeRequired: true, stereo: true, poseRequired: true, input: ['head-pose', 'xr-controller', 'touch']},
	{platform: 'vr', family: 'immersive', displayForm: 'vr', renderer: 'vulkan', nativeRequired: true, stereo: true, poseRequired: true, input: ['head-pose', 'xr-controller', 'gamepad']},
] as const;

export function berxPlatformBuild(platform: BerxPlatformTargetName): BerxPlatformBuild {
	const build = BERX_PLATFORM_BUILDS.find((item) => item.platform === platform);
	if (!build) throw new Error(`BERX: no such platform target: ${platform}`);
	return build;
}

/**
 * A live runtime for one target. Same world underneath; the platform
 * supplies a renderer, receives intents, and can be torn down.
 */
export interface BerxPlatformRuntime {
	readonly platform: BerxPlatformTargetName;
	readonly capabilities: BerxPlatformCapabilities;
	readonly renderer: BerxSpatialRendererBackend;
	dispatch(intent: BerxNavigationIntent): void;
	dispose(): void;
}

/**
 * The invariants that make a build BERX rather than a lookalike.
 *
 * Throws rather than returning false: a platform that has quietly grown
 * its own world or its own 2D product is not a configuration problem to
 * report, it is a fork to stop.
 */
export function assertBerxPlatformRuntime(contract: {
	platform: BerxPlatformTargetName;
	renderer: BerxSpatialRendererBackend;
	capabilities: BerxPlatformCapabilities;
	primaryExperience: 'spatial-world';
	domProductUi: false;
	sharedWorld: true;
}): void {
	if (!contract.sharedWorld) throw new Error('BERX invariant: this platform has a separate world');
	if (contract.primaryExperience !== 'spatial-world') throw new Error('BERX invariant: the primary experience is not the spatial world');
	if (contract.domProductUi) throw new Error('BERX invariant: a DOM product interface is primary');
	if (!contract.renderer.capabilities.perspective) throw new Error('BERX invariant: the renderer has no perspective projection');
	if (!contract.capabilities.depthBuffer) throw new Error('BERX invariant: no depth buffer');
	if (contract.capabilities.gpu === 'none') throw new Error('BERX invariant: no GPU backend');
}

/** Exactly what a build is missing for its target. Named, so it can be built. */
export function berxPlatformBuildGaps(platform: BerxPlatformTargetName, capabilities: BerxPlatformCapabilities): string[] {
	const build = berxPlatformBuild(platform);
	const gaps: string[] = [];
	/* the web target ships WebGL2 and may run WebGPU where it exists */
	const rendererOk = capabilities.gpu === build.renderer || (platform === 'web' && capabilities.gpu === 'webgpu');
	if (!rendererOk) gaps.push(`renderer ${build.renderer} required; got ${capabilities.gpu}`);
	if (!capabilities.depthBuffer) gaps.push('depthBuffer');
	if (!capabilities.physicallyLitMaterials) gaps.push('physicallyLitMaterials');
	if (build.poseRequired && !capabilities.poseTracking) gaps.push('poseTracking');
	if (build.stereo && !capabilities.poseTracking) gaps.push('stereo needs poseTracking');
	if (!capabilities.spatialAudio) gaps.push('spatialAudio');
	if (!capabilities.pointer) gaps.push('pointer or ray selection');
	return gaps;
}

export interface BerxPlatformTarget {
	form: BerxDisplayForm;
	/** What a real build for this form has to be able to do. */
	requires: Pick<BerxPlatformCapabilities, 'depthBuffer' | 'pointer' | 'keyboard' | 'poseTracking'>;
	/** The GPU APIs a real build for this form is expected to use. */
	gpu: readonly BerxPlatformCapabilities['gpu'][];
	/** How the world is framed here. Not styling — camera geometry. */
	framing: {
		/** Vertical field of view, degrees. */
		fov: number;
		/** How far back the camera stands from what it is with. */
		distance: number;
		/** Two eyes, and how far apart, in world units (metres). */
		stereoIpd?: number;
	};
}

export const BERX_PLATFORM_TARGETS: Record<BerxDisplayForm, BerxPlatformTarget> = {
	/* a wrist: held close, seen small, no keyboard and no real pointer
	   precision — the world comes in tight and shows fewer things */
	watch: {
		form: 'watch',
		requires: {depthBuffer: true, pointer: true, keyboard: false, poseTracking: false},
		gpu: ['metal', 'vulkan'],
		framing: {fov: 34, distance: 4.2},
	},
	phone: {
		form: 'phone',
		requires: {depthBuffer: true, pointer: true, keyboard: false, poseTracking: true},
		gpu: ['metal', 'vulkan', 'webgl2', 'webgpu'],
		framing: {fov: 42, distance: 7},
	},
	tablet: {
		form: 'tablet',
		requires: {depthBuffer: true, pointer: true, keyboard: false, poseTracking: true},
		gpu: ['metal', 'vulkan', 'webgl2', 'webgpu'],
		framing: {fov: 44, distance: 8.5},
	},
	desktop: {
		form: 'desktop',
		requires: {depthBuffer: true, pointer: true, keyboard: true, poseTracking: false},
		gpu: ['webgl2', 'webgpu', 'metal', 'vulkan'],
		framing: {fov: 42, distance: 8},
	},
	/* passthrough: the world stands in a real room, so it sits further
	   out and the head is the camera */
	ar: {
		form: 'ar',
		requires: {depthBuffer: true, pointer: true, keyboard: false, poseTracking: true},
		gpu: ['metal', 'vulkan', 'webgpu'],
		framing: {fov: 50, distance: 3.2, stereoIpd: 0.063},
	},
	vr: {
		form: 'vr',
		requires: {depthBuffer: true, pointer: true, keyboard: false, poseTracking: true},
		gpu: ['vulkan', 'metal', 'webgpu'],
		framing: {fov: 90, distance: 5, stereoIpd: 0.063},
	},
};

/** True when a build's real capabilities meet what the target requires. */
export function berxPlatformSupported(form: BerxDisplayForm, capabilities: BerxPlatformCapabilities): boolean {
	const target = BERX_PLATFORM_TARGETS[form];
	if (!target.gpu.includes(capabilities.gpu)) return false;
	return (Object.keys(target.requires) as (keyof typeof target.requires)[]).every(
		(key) => !target.requires[key] || capabilities[key],
	);
}

/** Exactly what a build is missing for a target. Named, so it can be built. */
export function berxPlatformGaps(form: BerxDisplayForm, capabilities: BerxPlatformCapabilities): string[] {
	const target = BERX_PLATFORM_TARGETS[form];
	const gaps: string[] = [];
	if (!target.gpu.includes(capabilities.gpu)) gaps.push(`gpu ${capabilities.gpu} is not one of ${target.gpu.join('/')}`);
	for (const key of Object.keys(target.requires) as (keyof typeof target.requires)[]) {
		if (target.requires[key] && !capabilities[key]) gaps.push(`${key} is required and absent`);
	}
	return gaps;
}

/**
 * How the camera stands for a display.
 *
 * The same world, framed for the body holding it: a watch pulls it
 * close and narrow so a handful of entities fill the wrist; a headset
 * opens wide and puts the viewer inside it. Stereo is a property of
 * the display, so the caller renders twice with the returned offset
 * rather than the world knowing about eyes.
 */
export function berxFramingFor(display: BerxDisplay): {fov: number; distance: number; ipd: number} {
	const target = BERX_PLATFORM_TARGETS[display.form];
	const ipd = display.stereo ? target.framing.stereoIpd ?? 0.063 : 0;
	/* a very wide surface sees more of the world at the same fov; a very
	   tall one sees less, so the framing pulls back to compensate */
	const aspect = display.height > 0 ? display.width / display.height : 1;
	const distance = target.framing.distance * (aspect < 0.75 ? 1.18 : 1);
	return {fov: target.framing.fov, distance, ipd};
}
