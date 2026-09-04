/**
 * Performance gate.
 *
 * The v9 performance contract is a budget, not an aspiration: 60fps,
 * ≤3 blurred layers on mobile, one autoplaying video, virtualized
 * lists, lazy media. This module turns a device's real, observable
 * capabilities into that budget and hands each depth layer a yes/no
 * on blur — so exceeding the budget is impossible by construction
 * rather than by review.
 *
 * Progressive fallback is allowed; semantic loss is not. A layer that
 * loses its blur becomes an opaque surface carrying the same content
 * (see materials.ts), never a removed layer.
 */
import {BERX_V9_PERFORMANCE, type BerxDepthKey} from './tokens';
import {clamp} from './color';

export type BerxPlatform = 'ios' | 'android' | 'web' | 'tablet' | 'desktop' | 'watch' | 'arvr';

export type BerxPerformanceTier = 'low' | 'medium' | 'high';

export interface BerxDeviceSignals {
	platform: BerxPlatform;
	/** navigator.deviceMemory (GB) where exposed. */
	deviceMemoryGb?: number;
	/** navigator.hardwareConcurrency where exposed. */
	logicalCores?: number;
	/** Measured frames per second from a real sample, when one exists. */
	measuredFps?: number;
	/** Device pixel ratio — a 3x phone pays 9x the blur cost of a 1x one. */
	pixelRatio?: number;
	/** True when the platform can composite a backdrop blur at all. */
	supportsBackdropBlur?: boolean;
	prefersReducedMotion?: boolean;
	/** Save-Data / low-power hints. */
	saveData?: boolean;
}

export interface BerxPerformanceBudget {
	tier: BerxPerformanceTier;
	targetFps: number;
	frameBudgetMs: number;
	/** How many layers in one scene may carry a backdrop blur. */
	maxBlurLayers: number;
	/** False on low tier and watch — the scene flattens to scale/opacity. */
	allow3D: boolean;
	/** Continuous ambient loops are the first thing to go when frames are scarce. */
	allowAmbientMotion: boolean;
	allowParallax: boolean;
	maxConcurrentVideo: number;
	max3DObjects: number;
	/** Lists must virtualize on every tier; this is the window size. */
	listWindowSize: number;
	lazyMedia: boolean;
	/** Why this tier was chosen — surfaced in the QA report, not guessed at later. */
	reason: string;
}

const WATCH_BUDGET: Omit<BerxPerformanceBudget, 'reason'> = {
	tier: 'low',
	targetFps: 60,
	frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
	maxBlurLayers: 0,
	allow3D: false,
	allowAmbientMotion: false,
	allowParallax: false,
	maxConcurrentVideo: 0,
	max3DObjects: 0,
	listWindowSize: 8,
	lazyMedia: true,
};

export function resolvePerformanceTier(signals: BerxDeviceSignals): {tier: BerxPerformanceTier; reason: string} {
	if (signals.platform === 'watch') return {tier: 'low', reason: 'watch platform: depth is simulated, never composited'};

	if (signals.measuredFps !== undefined && signals.measuredFps > 0) {
		if (signals.measuredFps < 45) return {tier: 'low', reason: `measured ${Math.round(signals.measuredFps)}fps below 45`};
		if (signals.measuredFps < 55) return {tier: 'medium', reason: `measured ${Math.round(signals.measuredFps)}fps below 55`};
	}
	if (signals.saveData) return {tier: 'low', reason: 'Save-Data requested by the user agent'};
	/**
	 * Absent backdrop blur is deliberately NOT a tier signal. React
	 * Native has no backdrop filter without a native module, but it
	 * composites perspective transforms perfectly well — treating the
	 * two as one capability would flatten every phone to a 2D scene
	 * for a reason that has nothing to do with 3D. Blur is zeroed
	 * further down instead.
	 */

	const mem = signals.deviceMemoryGb;
	const cores = signals.logicalCores;
	const dpr = signals.pixelRatio ?? 1;

	if (mem !== undefined && mem <= 2) return {tier: 'low', reason: `deviceMemory ${mem}GB`};
	if (cores !== undefined && cores <= 2) return {tier: 'low', reason: `${cores} logical cores`};
	if (mem !== undefined && mem <= 4 && dpr >= 3) return {tier: 'medium', reason: `deviceMemory ${mem}GB at ${dpr}x`};
	if (mem !== undefined && mem <= 4) return {tier: 'medium', reason: `deviceMemory ${mem}GB`};
	if (cores !== undefined && cores <= 4) return {tier: 'medium', reason: `${cores} logical cores`};

	if (signals.platform === 'desktop' || signals.platform === 'tablet') {
		return {tier: 'high', reason: `${signals.platform} with no low-capability signal`};
	}
	if (mem === undefined && cores === undefined) {
		/**
		 * No signals at all is the common case on iOS Safari and RN.
		 * Medium is the honest default: it keeps the scene fully
		 * spatial but stays inside the mobile blur budget, rather than
		 * assuming a high-end device we have no evidence for.
		 */
		return {tier: 'medium', reason: 'no capability signals exposed; conservative default'};
	}
	return {tier: 'high', reason: 'capability signals above every low/medium threshold'};
}

export function resolvePerformanceBudget(signals: BerxDeviceSignals): BerxPerformanceBudget {
	if (signals.platform === 'watch') {
		return {...WATCH_BUDGET, reason: 'watch platform: depth is simulated, never composited'};
	}

	const {tier, reason} = resolvePerformanceTier(signals);
	const reduced = signals.prefersReducedMotion === true;
	const desktopClass = signals.platform === 'desktop' || signals.platform === 'tablet';

	const base: Omit<BerxPerformanceBudget, 'reason'> =
		tier === 'low'
			? {
					tier,
					targetFps: BERX_V9_PERFORMANCE.targetFps,
					frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
					maxBlurLayers: 0,
					allow3D: false,
					allowAmbientMotion: false,
					allowParallax: false,
					maxConcurrentVideo: 0,
					max3DObjects: 0,
					listWindowSize: 10,
					lazyMedia: true,
				}
			: tier === 'medium'
				? {
						tier,
						targetFps: BERX_V9_PERFORMANCE.targetFps,
						frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
						maxBlurLayers: 2,
						allow3D: true,
						allowAmbientMotion: true,
						allowParallax: true,
						maxConcurrentVideo: BERX_V9_PERFORMANCE.videoAutoplayConcurrentMobile,
						max3DObjects: BERX_V9_PERFORMANCE.simultaneous3DObjectsMobile,
						listWindowSize: 14,
						lazyMedia: true,
					}
				: {
						tier,
						targetFps: BERX_V9_PERFORMANCE.targetFps,
						frameBudgetMs: BERX_V9_PERFORMANCE.interactiveBudgetMs,
						/**
						 * Three, on every platform. An earlier draft gave
						 * desktop four on the assumption that a bigger
						 * machine could afford it; the browser probe
						 * measured the fourth blurred layer pushing p95
						 * frame time from 33ms to 50ms during a real
						 * scroll, with no visible gain. The archive only
						 * ever specified three, and the measurement agrees
						 * with the archive.
						 */
						maxBlurLayers: BERX_V9_PERFORMANCE.blurMaxLayersMobile,
						allow3D: true,
						allowAmbientMotion: true,
						allowParallax: true,
						maxConcurrentVideo: desktopClass ? 2 : BERX_V9_PERFORMANCE.videoAutoplayConcurrentMobile,
						max3DObjects: desktopClass ? 240 : BERX_V9_PERFORMANCE.simultaneous3DObjectsMobile,
						listWindowSize: 21,
						lazyMedia: true,
					};

	if (signals.supportsBackdropBlur === false) base.maxBlurLayers = 0;

	/**
	 * Reduced motion is an accessibility preference, not a
	 * performance tier: it removes movement (ambient loops, parallax)
	 * and leaves depth, material and blur exactly as they were.
	 */
	if (reduced) {
		base.allowAmbientMotion = false;
		base.allowParallax = false;
	}

	return {...base, reason: reduced ? `${reason}; reduced motion active` : reason};
}

/**
 * Blur allocation. Structure and content compete for a small budget,
 * so it is spent from the top of the hierarchy down: focus and
 * controls first (they must stay legible over anything), then
 * structure, then atmosphere. A layer that misses out is not hidden —
 * materials.ts gives it an opaque surface instead.
 */
export function allocateBlurLayers(
	depths: readonly BerxDepthKey[],
	budget: BerxPerformanceBudget,
): Record<BerxDepthKey, boolean> {
	const priority: BerxDepthKey[] = ['D5', 'D4', 'D2', 'D3', 'D1', 'D0'];
	const allowed: Record<BerxDepthKey, boolean> = {D0: false, D1: false, D2: false, D3: false, D4: false, D5: false};
	let remaining = clamp(budget.maxBlurLayers, 0, 6);
	for (const depth of priority) {
		if (remaining <= 0) break;
		if (!depths.includes(depth)) continue;
		allowed[depth] = true;
		remaining -= 1;
	}
	return allowed;
}
