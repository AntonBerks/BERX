/** Node entry for the render-quality gate: the core, nothing else. */
export {
	BERX_RENDER_TIERS,
	berxRenderQuality,
	berxVolumetricRelativeCost,
	berxSSAOKernelFor,
	berxParticleCountFor,
	berxResolveRenderTier,
} from '@berx/spatial';
export {BERX_SSAO_SAMPLES, berxSSAOKernel} from '@berx/spatial';
export {BERX_VOLUMETRIC_STEPS} from '@berx/spatial';
export {BERX_PARTICLE_KINDS, berxParticleSpec, berxParticleAt} from '@berx/spatial';
