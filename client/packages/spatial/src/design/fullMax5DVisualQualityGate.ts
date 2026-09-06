/**
 * BERX Full MAX 5D — visual quality gate.
 *
 * The uploaded design proposal contains useful visual ideas, but several of
 * its sample implementations are not suitable as production architecture:
 * synthetic 300-region generation, Math.random(), DOM-owned world state,
 * standalone Three.js bootstrapping, and declarative capability claims.
 *
 * This gate turns the useful design intent into rules for the existing
 * Berx5DWorldApp / Berx5DFrame pipeline.
 */
import type { Berx5DFrame } from '../runtime5d';

export interface FullMax5DVisualRules {
  zero2DPrimary: true;
  singleWorldSource: 'Berx5DWorldApp';
  singleFrameSource: 'Berx5DFrame';
  deterministicSpatialState: true;
  realEntityIdentity: true;
  temporalVisualState: true;
  relationalVisualState: true;
  rendererOwnedEffects: true;
  platformNativeInput: true;
  accessibilityAware: true;
  reducedMotionAware: true;
}

export const BERX_FULL_MAX_5D_VISUAL_RULES: FullMax5DVisualRules = {
  zero2DPrimary: true,
  singleWorldSource: 'Berx5DWorldApp',
  singleFrameSource: 'Berx5DFrame',
  deterministicSpatialState: true,
  realEntityIdentity: true,
  temporalVisualState: true,
  relationalVisualState: true,
  rendererOwnedEffects: true,
  platformNativeInput: true,
  accessibilityAware: true,
  reducedMotionAware: true,
};

export interface VisualFrameContext {
  frame: Berx5DFrame;
  daylightPhase: 'dawn' | 'morning' | 'day' | 'sunset' | 'evening' | 'night';
  transitionProgress: number;
  selectedObjectId?: string;
}

/**
 * Produces a deterministic visual context from authoritative runtime state.
 * No synthetic regions or random entities are introduced here.
 */
export function buildVisualFrameContext(
  frame: Berx5DFrame,
  daylightPhase: VisualFrameContext['daylightPhase'],
  transitionProgress = 1,
): VisualFrameContext {
  if (!Number.isFinite(transitionProgress)) {
    throw new Error('transitionProgress must be finite');
  }

  return {
    frame,
    daylightPhase,
    transitionProgress: Math.max(0, Math.min(1, transitionProgress)),
    selectedObjectId: frame.world.activeObjectId,
  };
}

/**
 * Production design features are capabilities, not declarations. A backend
 * may expose an effect only when its renderer can actually execute it.
 */
export interface VisualFeatureEvidence {
  feature: 'bloom' | 'dof' | 'motionBlur' | 'vignette' | 'lensFlare' | 'ao' | 'ibl' | 'shadows' | 'hdr';
  available: boolean;
  verified: boolean;
  evidence?: string;
}

export function featureIsUsable(evidence: VisualFeatureEvidence): boolean {
  return evidence.available === true && evidence.verified === true;
}

/**
 * Palette changes are visual state changes, not DOM world regeneration.
 */
export function applyTemporalTheme(frame: Berx5DFrame, _phase: VisualFrameContext['daylightPhase']): Berx5DFrame {
  return {
    ...frame,
    transition: frame.transition ? { ...frame.transition } : undefined,
  };
}
