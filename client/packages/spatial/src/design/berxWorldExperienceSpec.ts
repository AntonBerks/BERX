/**
 * BERX World Experience Design Specification
 *
 * Design-only contract for the single spatial world. It does not create a
 * second world, synthetic regions, or a separate navigation model.
 * Visual states are resolved from the authoritative Berx5DFrame.
 */

export type BerxTimePhase = 'dawn' | 'morning' | 'day' | 'sunset' | 'evening' | 'night';
export type BerxTransitionEffect = 'wormhole' | 'dissolve' | 'fold' | 'warp' | 'teleport' | 'flow' | 'bloom' | 'collapse';

export interface BerxDesignMotionPolicy {
  reducedMotion: boolean;
  transitionEffect: BerxTransitionEffect;
  transitionDurationMs: number;
  ambientMotion: boolean;
}

export interface BerxSpatialVisualState {
  timePhase: BerxTimePhase;
  worldPosition: { x: number; y: number; z: number };
  temporalCursor: number;
  relationalEnergy: number;
  depth: number;
  glowIntensity: number;
  fogDensity: number;
  motion: BerxDesignMotionPolicy;
}

export interface BerxMicroInteractionSpec {
  action: 'press' | 'focus' | 'select' | 'like' | 'swipe' | 'travel' | 'success' | 'error';
  durationMs: number;
  scale?: number;
  intensity?: number;
}

export interface BerxCinematicProfile {
  hdr: boolean;
  toneMapping: 'aces';
  bloom: boolean;
  depthOfField: boolean;
  motionBlur: boolean;
  vignette: boolean;
  lensFlare: boolean;
  filmGrain: boolean;
}

export interface BerxAccessibilityDesign {
  minimumTextContrast: 4.5;
  enhancedTextContrast: 7;
  focusRing: boolean;
  reducedMotion: boolean;
  reducedTransparency: boolean;
  colorIndependentStatus: boolean;
}

export const BERX_WORLD_EXPERIENCE: Readonly<{
  zero2DPrimary: true;
  sharedWorld: true;
  dimensions: readonly ['x', 'y', 'z', 't', 'r'];
  timePhases: readonly BerxTimePhase[];
  transitions: readonly BerxTransitionEffect[];
  microInteractions: readonly BerxMicroInteractionSpec[];
  cinematic: BerxCinematicProfile;
  accessibility: BerxAccessibilityDesign;
  visualBaseline: {
    background: '#07080A';
    accent: '#4FD6E8';
    premiumGlass: true;
  };
}> = {
  zero2DPrimary: true,
  sharedWorld: true,
  dimensions: ['x', 'y', 'z', 't', 'r'],
  timePhases: ['dawn', 'morning', 'day', 'sunset', 'evening', 'night'],
  transitions: ['wormhole', 'dissolve', 'fold', 'warp', 'teleport', 'flow', 'bloom', 'collapse'],
  microInteractions: [
    { action: 'press', durationMs: 120, scale: 0.96 },
    { action: 'focus', durationMs: 240, scale: 1.03 },
    { action: 'select', durationMs: 320, intensity: 0.8 },
    { action: 'like', durationMs: 700, intensity: 1 },
    { action: 'swipe', durationMs: 280, intensity: 0.7 },
    { action: 'travel', durationMs: 1000, intensity: 0.9 },
    { action: 'success', durationMs: 500, intensity: 0.8 },
    { action: 'error', durationMs: 420, intensity: 0.9 },
  ],
  cinematic: {
    hdr: true,
    toneMapping: 'aces',
    bloom: true,
    depthOfField: true,
    motionBlur: false,
    vignette: true,
    lensFlare: false,
    filmGrain: false,
  },
  accessibility: {
    minimumTextContrast: 4.5,
    enhancedTextContrast: 7,
    focusRing: true,
    reducedMotion: true,
    reducedTransparency: true,
    colorIndependentStatus: true,
  },
  visualBaseline: {
    background: '#07080A',
    accent: '#4FD6E8',
    premiumGlass: true,
  },
};

export function resolveBerxVisualState(frame: {
  camera: { position: { x: number; y: number; z: number } };
  world: { worldTime: number };
  reducedMotion: boolean;
}): BerxSpatialVisualState {
  const hour = ((frame.world.worldTime / 3600) % 24 + 24) % 24;
  const timePhase: BerxTimePhase =
    hour < 5 ? 'night' : hour < 8 ? 'dawn' : hour < 12 ? 'morning' : hour < 17 ? 'day' : hour < 20 ? 'sunset' : hour < 23 ? 'evening' : 'night';

  return {
    timePhase,
    worldPosition: { ...frame.camera.position },
    temporalCursor: frame.world.worldTime,
    relationalEnergy: 1,
    depth: Math.hypot(frame.camera.position.x, frame.camera.position.y, frame.camera.position.z),
    glowIntensity: 1,
    fogDensity: timePhase === 'night' ? 0.02 : 0.01,
    motion: {
      reducedMotion: frame.reducedMotion,
      transitionEffect: frame.reducedMotion ? 'flow' : 'wormhole',
      transitionDurationMs: frame.reducedMotion ? 180 : 1000,
      ambientMotion: !frame.reducedMotion,
    },
  };
}
