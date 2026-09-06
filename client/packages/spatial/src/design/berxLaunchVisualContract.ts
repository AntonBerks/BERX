import type { Berx5DFrame } from '../runtime5d';
import type { BerxSpatialRenderer, BerxRenderOptions } from '../renderer';

/**
 * BERX Full MAX 5D launch design contract.
 * The design is a visual layer over the single authoritative Berx5DFrame.
 * It must never create or own a second world, graph, or screen-based app shell.
 */
export interface BerxLaunchVisualContract {
  zero2DPrimary: true;
  dimensions: readonly ['x', 'y', 'z', 't', 'r'];
  baseBackground: '#07080A';
  accent: '#4FD6E8';

  /** Visual systems are renderer effects, not DOM-screen substitutes. */
  rendererFeatures: {
    pbr: true;
    hdr: true;
    ibl: true;
    shadows: true;
    ssao: true;
    bloom: true;
    toneMapping: true;
    msaa: true;
    lod: true;
    frustumCulling: true;
    occlusionCulling: true;
    instancing: true;
    worldSpaceText: true;
  };

  experience: {
    spatialTransitions: readonly [
      'wormhole', 'dissolve', 'fold', 'warp',
      'teleport', 'flow', 'bloom', 'collapse'
    ];
    microInteractions: true;
    spatialAudio: true;
    haptics: true;
    cinematicProfile: true;
    adaptiveTypography: true;
    accessibility: true;
    temporalTheme: true;
  };
}

export const BERX_LAUNCH_VISUAL_CONTRACT: BerxLaunchVisualContract = {
  zero2DPrimary: true,
  dimensions: ['x', 'y', 'z', 't', 'r'],
  baseBackground: '#07080A',
  accent: '#4FD6E8',
  rendererFeatures: {
    pbr: true,
    hdr: true,
    ibl: true,
    shadows: true,
    ssao: true,
    bloom: true,
    toneMapping: true,
    msaa: true,
    lod: true,
    frustumCulling: true,
    occlusionCulling: true,
    instancing: true,
    worldSpaceText: true,
  },
  experience: {
    spatialTransitions: [
      'wormhole', 'dissolve', 'fold', 'warp',
      'teleport', 'flow', 'bloom', 'collapse'
    ],
    microInteractions: true,
    spatialAudio: true,
    haptics: true,
    cinematicProfile: true,
    adaptiveTypography: true,
    accessibility: true,
    temporalTheme: true,
  },
};

/**
 * Apply only validated visual parameters to a renderer that already consumes
 * the authoritative world frame. No DOM or synthetic entity generation is
 * allowed here.
 */
export interface BerxVisualRuntimeAdapter {
  applyFrameVisuals(frame: Berx5DFrame, renderer: BerxSpatialRenderer): void;
  applyRenderOptions(frame: Berx5DFrame): BerxRenderOptions;
}

export function assertLaunchVisualContract(): true {
  if (BERX_LAUNCH_VISUAL_CONTRACT.zero2DPrimary !== true) {
    throw new Error('BERX launch visual contract violated: 2D primary path enabled');
  }
  return true;
}
