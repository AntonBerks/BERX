/**
 * BERX Full MAX 5D — visual quality policy.
 * Visual design is subordinate to the single authoritative Berx5DFrame.
 * No DOM, mock world, random world generation or visual capability claims are authoritative.
 */
import type { Berx5DFrame } from '../runtime5d';
import type { BerxSpatialRenderer } from '../renderer';

export const BERX_VISUAL_QUALITY_POLICY = {
  canonicalWorldSource: 'Berx5DFrame',
  dimensions: ['x', 'y', 'z', 't', 'r'] as const,
  primaryExperience: 'spatial-runtime',
  forbiddenAuthoritativeSources: [
    'dom-screen-state',
    'mock-regions',
    'random-geometry',
    'hardcoded-demo-entities',
  ] as const,
  brand: {
    background: '#07080A',
    accent: '#4FD6E8',
    purpleDominant: false,
  },
  transitions: ['wormhole', 'dissolve', 'fold', 'warp', 'teleport', 'flow', 'bloom', 'collapse'] as const,
  cinematic: {
    depthOfField: true,
    motionBlur: true,
    chromaticAberration: true,
    vignette: true,
    bloom: true,
    lensFlare: true,
    grain: true,
  },
  accessibility: {
    reducedMotion: true,
    highContrast: true,
    largeText: true,
    colorblindModes: ['protanopia', 'deuteranopia', 'tritanopia'] as const,
  },
} as const;

export interface BerxVisualFeatureVerification {
  feature: string;
  supported: boolean;
  verified: boolean;
  evidence: string;
  timestamp: number;
}

export function verifyVisualFeatures(
  renderer: BerxSpatialRenderer,
  frame: Berx5DFrame,
): BerxVisualFeatureVerification[] {
  const caps = renderer.capabilities;
  const evidence = renderer.capabilityEvidence ?? [];
  const now = Date.now();

  const verified = (name: keyof typeof caps): BerxVisualFeatureVerification => {
    const probe = evidence.find((p) => p.capability === name);
    return {
      feature: name,
      supported: Boolean(caps[name]),
      verified: Boolean(probe?.verified),
      evidence: probe?.evidence ?? 'No runtime evidence recorded',
      timestamp: probe?.timestamp ?? now,
    };
  };

  // Accessing the frame here is intentional: visual policy cannot become a parallel world.
  void frame.world.objects.length;
  void frame.camera;

  return [
    verified('physicallyLitMaterials'),
    verified('shadows'),
    verified('imageBasedLighting'),
    verified('ssao'),
    verified('hdr'),
    verified('msaa'),
    verified('instancing'),
    verified('stereo'),
    verified('picking'),
    verified('deviceLossRecovery'),
  ];
}

export function assertVisualQualityGate(
  renderer: BerxSpatialRenderer,
  frame: Berx5DFrame,
): void {
  const results = verifyVisualFeatures(renderer, frame);
  const failed = results.filter((result) => !result.verified);
  if (failed.length > 0) {
    throw new Error(
      `BERX visual quality gate failed: ${failed.map((r) => r.feature).join(', ')}`,
    );
  }
}
