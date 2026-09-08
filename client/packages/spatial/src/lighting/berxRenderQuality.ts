/**
 * BERX RENDER QUALITY — what a device can afford, decided once.
 *
 * The 5D runtime has five real GPU costs: the shadow map, the G-buffer,
 * the occlusion kernel, the volumetric march and the particle fields.
 * Every one of them has a knob, and before this module those knobs were
 * constants — one number for a discrete GPU and a four-year-old phone
 * alike.
 *
 * THE RULE, AND IT IS NOT NEGOTIABLE: a tier changes what an effect
 * COSTS, never whether it exists. LOW still marches the air, still
 * occludes contacts, still casts a real shadow and still carries all
 * three particle fields. A tier that switched the volumetric pass off
 * would not be a lower quality setting, it would be a different product
 * — and the phone is where most people will meet BERX.
 *
 * WHY THE NUMBERS ARE HERE. The march at HIGH was measured at 74ms of a
 * 125ms WebGPU frame in this repository's own harness. That is not a
 * rounding error to tune away later; it is the frame. The dominant term
 * is steps x pixels, so the two knobs that matter are the step count and
 * the resolution the march runs at — and halving the resolution is worth
 * four times what dropping a third of the steps is.
 *
 * DETERMINISM SURVIVES THE TIER. Everything in BERX 5D that could have
 * been random is a hash instead, and that is only worth anything if the
 * hash still lands in the same place at a different quality. So a
 * reduced particle field is a PREFIX of the full one — mote 7 is in the
 * same place on a phone as on a workstation, there are simply fewer of
 * them — and a reduced occlusion kernel is a STRIDE through the full
 * spiral rather than its first half, so it still covers the whole
 * hemisphere instead of crowding the contact.
 */
import type {BerxVec3} from '../world';
import {BERX_SSAO_SAMPLES, berxSSAOKernel} from './berxSSAO';
import {BERX_VOLUMETRIC_STEPS} from './berxVolumetric';
import {berxParticleSpec, type BerxParticleKind} from './berxParticles';

/**
 * Four tiers, not three.
 *
 * The existing BerxPerformanceTier (low/medium/high) describes what a
 * DEVICE is; this describes what the RENDERER does, and it needs one
 * more step at the top. A desktop with a discrete GPU can afford a march
 * that a high-tier phone cannot, and collapsing the two wastes the
 * machine that most makes the case for the product.
 */
export type BerxRenderTier = 'ultra' | 'high' | 'medium' | 'low';

export const BERX_RENDER_TIERS: readonly BerxRenderTier[] = ['ultra', 'high', 'medium', 'low'] as const;

export interface BerxRenderQuality {
	tier: BerxRenderTier;
	/**
	 * Steps along the view ray. Linear in cost, and the banding it trades
	 * against is hidden by the march's own per-pixel dither, which is why
	 * this can be cut at all.
	 */
	volumetricSteps: number;
	/**
	 * The march runs at 1/N the frame's width and height.
	 *
	 * Quadratic: the single biggest lever there is. A shaft is a smooth,
	 * low-frequency thing — it has no edges of its own, only the edges the
	 * shadow map gives it — so it upsamples with a bilinear tap and almost
	 * nothing is lost. This is why the composite samples the march with a
	 * LINEAR sampler rather than loading a texel.
	 */
	volumetricScale: number;
	/** Taps in the occlusion kernel. A stride through the full spiral. */
	ssaoSamples: number;
	/** Edge of the square shadow map, in texels. Quadratic in memory too. */
	shadowMapSize: number;
	/**
	 * Fraction of each particle field that is drawn, as a prefix.
	 *
	 * Not a fraction of the alpha: half as many motes at the same alpha
	 * reads as a thinner room, which is honest. Half the alpha at the same
	 * count reads as a dirty screen.
	 */
	particleScale: number;
	/** Objects the draw list may keep after culling. */
	maxObjects: number;
	/** Why, so the QA report states it rather than a later reader guessing. */
	reason: string;
}

const QUALITIES: Readonly<Record<BerxRenderTier, Omit<BerxRenderQuality, 'reason'>>> = Object.freeze({
	ultra: {
		tier: 'ultra',
		volumetricSteps: 48,
		volumetricScale: 1,
		ssaoSamples: BERX_SSAO_SAMPLES,
		shadowMapSize: 2048,
		particleScale: 1,
		maxObjects: 160,
	},
	high: {
		tier: 'high',
		volumetricSteps: BERX_VOLUMETRIC_STEPS,
		volumetricScale: 1,
		ssaoSamples: BERX_SSAO_SAMPLES,
		shadowMapSize: 2048,
		particleScale: 1,
		maxObjects: 120,
	},
	medium: {
		tier: 'medium',
		volumetricSteps: 20,
		volumetricScale: 2,
		ssaoSamples: 8,
		shadowMapSize: 1024,
		particleScale: 0.55,
		maxObjects: 80,
	},
	low: {
		tier: 'low',
		volumetricSteps: 12,
		volumetricScale: 2,
		ssaoSamples: 8,
		shadowMapSize: 512,
		particleScale: 0.3,
		maxObjects: 48,
	},
});

const REASONS: Readonly<Record<BerxRenderTier, string>> = Object.freeze({
	ultra: 'a machine with headroom: the march at full resolution and 48 steps, and every mote the fields describe',
	high: 'the reference picture — full-resolution march, 32 steps, a 2048 shadow map',
	medium: 'a half-resolution march at 20 steps, which is a sixth of the cost and the same shaft',
	low: 'a half-resolution march at 12 steps and a 512 map: every pass still runs, none of them at full price',
});

/** The knobs for one tier. One place, so three backends cannot differ. */
export function berxRenderQuality(tier: BerxRenderTier): BerxRenderQuality {
	return {...QUALITIES[tier], reason: REASONS[tier]};
}

/**
 * Roughly what the march costs, relative to HIGH.
 *
 * steps / scale^2, normalised. Not a benchmark and not presented as one
 * — it is the term that dominates, written down so a tier table cannot
 * be edited into something that costs more than the tier above it. The
 * quality gate asserts exactly that.
 */
export function berxVolumetricRelativeCost(quality: BerxRenderQuality): number {
	const high = berxRenderQuality('high');
	const cost = quality.volumetricSteps / (quality.volumetricScale * quality.volumetricScale);
	return cost / (high.volumetricSteps / (high.volumetricScale * high.volumetricScale));
}

/**
 * The occlusion kernel for a tier: a STRIDE through the full spiral.
 *
 * Not its first half. The spiral's radius grows with the index, so a
 * prefix would ask only about what is touching and never about what is
 * an arm's length away — the AO would tighten into a dark line at every
 * contact and vanish everywhere else. A stride keeps the full range and
 * simply asks about fewer directions in it.
 */
export function berxSSAOKernelFor(quality: BerxRenderQuality): BerxVec3[] {
	const full = berxSSAOKernel();
	if (quality.ssaoSamples >= full.length) return full;
	const stride = full.length / quality.ssaoSamples;
	const out: BerxVec3[] = [];
	for (let i = 0; i < quality.ssaoSamples; i++) out.push(full[Math.floor(i * stride)]);
	return out;
}

/**
 * How many of a field's motes to draw at this tier.
 *
 * A prefix, so mote 7 is mote 7 on every device — the field thins, it
 * does not rearrange. At least one, because a field that renders nothing
 * is a field that was switched off, and nothing here switches off.
 */
export function berxParticleCountFor(kind: BerxParticleKind, quality: BerxRenderQuality): number {
	return Math.max(1, Math.round(berxParticleSpec(kind).count * quality.particleScale));
}

/**
 * The tier a device gets, from what can actually be observed about it.
 *
 * Deliberately conservative, and in this order: an explicit measurement
 * beats a guess from the hardware, and a guess from the hardware beats
 * the platform's name. A device that says nothing about itself gets
 * MEDIUM — the tier that looks right and cannot embarrass the machine —
 * rather than HIGH, because the cost of guessing high on a weak phone is
 * a stuttering first impression and the cost of guessing medium on a
 * strong one is a slightly cheaper march nobody will notice.
 */
export function berxResolveRenderTier(signals: {
	platform?: 'ios' | 'android' | 'web' | 'tablet' | 'desktop' | 'watch' | 'arvr';
	deviceMemoryGb?: number;
	logicalCores?: number;
	measuredFps?: number;
	pixelRatio?: number;
	saveData?: boolean;
	prefersReducedMotion?: boolean;
}): {tier: BerxRenderTier; reason: string} {
	if (signals.saveData) {
		return {tier: 'low', reason: 'the device asked for less data and less work; that request is honoured'};
	}
	/* A headset renders every frame twice at 72Hz or more. It is the one
	   platform where the space is real and the budget is hardest, so it
	   never gets the top tier however strong the machine is. */
	if (signals.platform === 'arvr') {
		return {tier: 'medium', reason: 'two eyes at 72Hz or more: half the frame budget of anything else, whatever the GPU'};
	}
	if (signals.platform === 'watch') {
		return {tier: 'low', reason: 'a watch draws the world at all, which is already the ambitious choice'};
	}
	/* A real measurement, when one exists, outranks everything below. */
	if (typeof signals.measuredFps === 'number') {
		if (signals.measuredFps < 24) return {tier: 'low', reason: `measured ${Math.round(signals.measuredFps)}fps — the machine is already behind`};
		if (signals.measuredFps < 50) return {tier: 'medium', reason: `measured ${Math.round(signals.measuredFps)}fps — room for the picture, not for all of it`};
		if (signals.platform === 'desktop' && (signals.logicalCores ?? 0) >= 8) {
			return {tier: 'ultra', reason: `measured ${Math.round(signals.measuredFps)}fps on ${signals.logicalCores} cores`};
		}
		return {tier: 'high', reason: `measured ${Math.round(signals.measuredFps)}fps`};
	}
	const memory = signals.deviceMemoryGb ?? 0;
	const cores = signals.logicalCores ?? 0;
	/* A 3x phone pays nine times the fill cost of a 1x one, and the march
	   is pure fill. Pixel ratio belongs in this decision, not after it. */
	const dense = (signals.pixelRatio ?? 1) >= 3;
	if (signals.platform === 'desktop' && memory >= 16 && cores >= 8) {
		return {tier: 'ultra', reason: `desktop, ${memory}GB and ${cores} cores`};
	}
	if (memory >= 8 && cores >= 8 && !dense) return {tier: 'high', reason: `${memory}GB and ${cores} cores`};
	if (memory > 0 && memory <= 2) return {tier: 'low', reason: `${memory}GB of memory`};
	if (cores > 0 && cores <= 4) return {tier: 'low', reason: `${cores} logical cores`};
	if (memory >= 6 && cores >= 6) return {tier: 'medium', reason: `${memory}GB and ${cores} cores${dense ? ' at 3x or denser' : ''}`};
	return {tier: 'medium', reason: 'the device said little about itself, and medium is the tier that cannot embarrass it'};
}
