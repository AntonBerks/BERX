/**
 * Production WebGPU gate contract for BERX Full MAX 5D.
 *
 * This module deliberately does not claim capabilities from configuration.
 * Each feature must be backed by an observed runtime result before the
 * platform can advertise it.
 */
export type WebGPUProductionGate =
  | 'hdr'
  | 'msaa'
  | 'shadows'
  | 'ibl'
  | 'ssao'
  | 'culling'
  | 'lod'
  | 'instancing'
  | 'streaming'
  | 'device-loss'
  | 'world-space-text'
  | 'picking'
  | 'lifecycle';

export interface WebGPUProductionGateResult {
  gate: WebGPUProductionGate;
  verified: boolean;
  evidence: string;
}

export interface WebGPUProductionVerificationReport {
  allPassed: boolean;
  results: readonly WebGPUProductionGateResult[];
}

export const WEBGPU_PRODUCTION_GATES: readonly WebGPUProductionGate[] = [
  'hdr',
  'msaa',
  'shadows',
  'ibl',
  'ssao',
  'culling',
  'lod',
  'instancing',
  'streaming',
  'device-loss',
  'world-space-text',
  'picking',
  'lifecycle',
] as const;

/**
 * CI/runtime integration point. A platform must supply observed results;
 * there is intentionally no optimistic default.
 */
export function evaluateWebGPUProductionVerification(
  results: readonly WebGPUProductionGateResult[],
): WebGPUProductionVerificationReport {
  const byGate = new Map(results.map((result) => [result.gate, result]));
  const normalized = WEBGPU_PRODUCTION_GATES.map((gate) =>
    byGate.get(gate) ?? {
      gate,
      verified: false,
      evidence: 'No runtime evidence recorded',
    },
  );

  return {
    allPassed: normalized.every((result) => result.verified),
    results: normalized,
  };
}
