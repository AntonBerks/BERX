/**
 * BERX Full MAX 5D integrity audit.
 * This is policy/evidence plumbing only: it never fabricates readiness.
 */

export type LaunchEvidenceStatus = 'verified' | 'blocked';

export interface LaunchEvidence {
  readonly requirement: string;
  readonly status: LaunchEvidenceStatus;
  readonly evidence: string | null;
  readonly verifiedAt: number | null;
  readonly source: 'runtime' | 'device' | 'backend' | 'ci' | 'unknown';
}

export const FULL_MAX_5D_REQUIREMENTS = [
  'Shared Core',
  'WebGPU',
  'WebGL2',
  'Desktop',
  'iOS / Metal',
  'Android / Vulkan',
  'Tablet',
  'watchOS',
  'ARKit',
  'ARCore',
  'OpenXR',
  'Spatial Audio',
  'Media Pipeline',
  'Authentication',
  'Registration',
  'Server Authorization',
  'Persistence',
  'Realtime Sync',
  'Packaging',
  'Real-device Verification',
  'Design Integration',
] as const;

export type FullMax5DRequirement = typeof FULL_MAX_5D_REQUIREMENTS[number];

export function isLaunchEvidenceValid(evidence: LaunchEvidence): boolean {
  return evidence.status === 'verified' &&
    evidence.evidence !== null &&
    evidence.evidence.trim().length > 0 &&
    evidence.verifiedAt !== null &&
    evidence.source !== 'unknown';
}

export function canOpenFullMax5D(evidence: readonly LaunchEvidence[]): boolean {
  const byRequirement = new Map(evidence.map((item) => [item.requirement, item]));
  return FULL_MAX_5D_REQUIREMENTS.every((requirement) => {
    const item = byRequirement.get(requirement);
    return item !== undefined && isLaunchEvidenceValid(item);
  });
}

export function getFullMax5DBlockers(evidence: readonly LaunchEvidence[]): string[] {
  const byRequirement = new Map(evidence.map((item) => [item.requirement, item]));
  return FULL_MAX_5D_REQUIREMENTS.filter((requirement) => {
    const item = byRequirement.get(requirement);
    return item === undefined || !isLaunchEvidenceValid(item);
  });
}
