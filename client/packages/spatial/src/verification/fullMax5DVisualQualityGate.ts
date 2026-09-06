export interface CapabilityEvidence {
  supported: boolean;
  verified: boolean;
  evidence: string | null;
}

export interface VisualQualityGate {
  pbrGGX: CapabilityEvidence;
  ibl: CapabilityEvidence;
  ssao: CapabilityEvidence;
  hdr: CapabilityEvidence;
  msaa: CapabilityEvidence;
  shadows: CapabilityEvidence;
  bloom: CapabilityEvidence;
  culling: CapabilityEvidence;
  lod: CapabilityEvidence;
  instancing: CapabilityEvidence;
  picking: CapabilityEvidence;
  deviceLossRecovery: CapabilityEvidence;
}

/**
 * Fail-closed capability rule.
 * A feature is available only when the runtime both supports it and has
 * produced verification evidence for the current backend/device.
 */
export function isCapabilityAvailable(
  gate: VisualQualityGate,
  capability: keyof VisualQualityGate,
): boolean {
  const proof = gate[capability];
  return proof.supported === true && proof.verified === true && !!proof.evidence;
}

export function assertVisualQualityGate(gate: VisualQualityGate): void {
  const blockers = (Object.keys(gate) as Array<keyof VisualQualityGate>)
    .filter((capability) => !isCapabilityAvailable(gate, capability));

  if (blockers.length > 0) {
    throw new Error(`BERX Full MAX 5D visual gate blocked: ${blockers.join(', ')}`);
  }
}

/** Canonical BERX brand tokens. No purple-dominant palette is permitted. */
export const BERX_BRAND = Object.freeze({
  bgPrimary: '#07080A',
  bgSecondary: '#0A0D14',
  bgTertiary: '#0F141E',
  accentPrimary: '#4FD6E8',
  accentSecondary: '#2DD4BF',
  textPrimary: '#F0F4F8',
  textSecondary: 'rgba(240, 244, 248, 0.6)',
  textTertiary: 'rgba(240, 244, 248, 0.3)',
} as const);

export interface FullMax5DVisualQualityPolicy {
  zero2DPrimary: true;
  secondSpatialCore: false;
  authoritativeSource: 'Berx5DFrame';
  brand: typeof BERX_BRAND;
  gate: VisualQualityGate;
}

/**
 * Validates the design contract without creating or mutating a world/core.
 */
export function validateFullMax5DVisualPolicy(
  policy: FullMax5DVisualQualityPolicy,
): void {
  if (policy.zero2DPrimary !== true) {
    throw new Error('BERX visual policy requires zero-2D primary experience.');
  }
  if (policy.secondSpatialCore !== false) {
    throw new Error('BERX visual policy forbids a second spatial core.');
  }
  if (policy.authoritativeSource !== 'Berx5DFrame') {
    throw new Error('BERX visual policy must derive from Berx5DFrame.');
  }
  assertVisualQualityGate(policy.gate);
}
