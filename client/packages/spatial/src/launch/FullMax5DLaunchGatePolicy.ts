export interface EvidenceRecord {
  supported: boolean;
  verified: boolean;
  evidence: string | null;
}

export type LaunchRequirement =
  | 'shared-core'
  | 'webgpu'
  | 'webgl2'
  | 'desktop'
  | 'ios-metal'
  | 'android-vulkan'
  | 'tablet'
  | 'watchos'
  | 'arkit'
  | 'arcore'
  | 'openxr'
  | 'spatial-audio'
  | 'media'
  | 'authentication'
  | 'registration'
  | 'server-authz-privacy'
  | 'persistence'
  | 'realtime'
  | 'packaging'
  | 'real-device'
  | 'design-integration';

export interface LaunchEvidence {
  requirement: LaunchRequirement;
  evidence: EvidenceRecord;
}

/**
 * Full MAX 5D is open only when every requirement has independent evidence.
 * This policy never treats source-code presence, config flags, or object existence
 * as runtime proof.
 */
export function canOpenFullMax5D(evidence: readonly LaunchEvidence[]): boolean {
  const required = new Set<LaunchRequirement>([
    'shared-core', 'webgpu', 'webgl2', 'desktop', 'ios-metal',
    'android-vulkan', 'tablet', 'watchos', 'arkit', 'arcore', 'openxr',
    'spatial-audio', 'media', 'authentication', 'registration',
    'server-authz-privacy', 'persistence', 'realtime', 'packaging',
    'real-device', 'design-integration',
  ]);

  const byRequirement = new Map(evidence.map(item => [item.requirement, item.evidence]));
  for (const requirement of required) {
    const item = byRequirement.get(requirement);
    if (!item?.supported || !item.verified || !item.evidence?.trim()) return false;
  }
  return true;
}

export function getFullMax5DBlockers(
  evidence: readonly LaunchEvidence[],
): LaunchRequirement[] {
  const required: LaunchRequirement[] = [
    'shared-core', 'webgpu', 'webgl2', 'desktop', 'ios-metal',
    'android-vulkan', 'tablet', 'watchos', 'arkit', 'arcore', 'openxr',
    'spatial-audio', 'media', 'authentication', 'registration',
    'server-authz-privacy', 'persistence', 'realtime', 'packaging',
    'real-device', 'design-integration',
  ];

  const byRequirement = new Map(evidence.map(item => [item.requirement, item.evidence]));
  return required.filter(requirement => {
    const item = byRequirement.get(requirement);
    return !item?.supported || !item.verified || !item.evidence?.trim();
  });
}

export const BERX_DESIGN_POLICY = Object.freeze({
  background: '#07080A',
  primaryAccent: '#4FD6E8',
  zero2DPrimary: true,
  singleWorldSource: true,
  forbidRandomAuthoritativeWorld: true,
  forbidPurpleDominant: true,
  designIsVisualLayerOnly: true,
});
