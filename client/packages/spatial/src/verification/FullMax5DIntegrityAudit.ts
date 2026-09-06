export type IntegrityStatus = 'verified' | 'blocker';

export interface IntegrityCheck {
  name: string;
  status: IntegrityStatus;
  evidence: string;
}

export interface IntegrityAuditReport {
  allVerified: boolean;
  checks: readonly IntegrityCheck[];
  blockers: readonly string[];
}

/**
 * Static/runtime policy for Full MAX 5D. No capability is considered proven
 * from configuration or symbol existence alone.
 */
export function auditFullMax5DIntegrity(input: {
  sharedCoreEvidence: boolean;
  productionRendererEvidence: boolean;
  backendCanonical: boolean;
  nativeRuntimeEvidence: boolean;
  realDeviceEvidence: boolean;
  persistenceEvidence: boolean;
  realtimeEvidence: boolean;
  mediaEvidence: boolean;
  audioEvidence: boolean;
  arVrEvidence: boolean;
  packagingEvidence: boolean;
  designEvidence: boolean;
}): IntegrityAuditReport {
  const checks: IntegrityCheck[] = [
    ['Shared spatial core', input.sharedCoreEvidence],
    ['Production renderer path', input.productionRendererEvidence],
    ['Canonical backend', input.backendCanonical],
    ['Native platform runtimes', input.nativeRuntimeEvidence],
    ['Real-device verification', input.realDeviceEvidence],
    ['Persistence', input.persistenceEvidence],
    ['Realtime sync', input.realtimeEvidence],
    ['Media pipeline', input.mediaEvidence],
    ['Spatial audio', input.audioEvidence],
    ['AR/VR runtime', input.arVrEvidence],
    ['Packaging', input.packagingEvidence],
    ['Design integration', input.designEvidence],
  ].map(([name, verified]) => ({
    name,
    status: verified ? 'verified' : 'blocker',
    evidence: verified
      ? 'Independent evidence supplied by production verification.'
      : 'No independent production evidence; remain blocked.',
  }));

  const blockers = checks.filter((c) => c.status === 'blocker').map((c) => c.name);
  return { allVerified: blockers.length === 0, checks, blockers };
}
