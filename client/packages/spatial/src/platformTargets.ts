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
import type {BerxDisplay, BerxDisplayForm, BerxPlatformCapabilities} from './platform';

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
