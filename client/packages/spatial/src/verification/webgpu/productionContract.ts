/**
 * BERX Full MAX 5D — WebGPU production gate contract.
 *
 * This module is deliberately a contract, not a fake implementation. A gate may
 * only become verified after the real backend reports both GPU execution and
 * an observed/read-back result matching the gate's expected evidence.
 */
export type WebGPUProductionGateName =
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
  | 'world-text'
  | 'picking'
  | 'lifecycle';

export interface WebGPUProductionGateResult {
  gate: WebGPUProductionGateName;
  gpuExecuted: boolean;
  readbackVerified: boolean;
  verified: boolean;
  blocked: boolean;
  evidence: string;
  timestamp: number;
}

export interface WebGPUProductionReport {
  allGatesPassed: boolean;
  totalGates: number;
  passedGates: number;
  failedGates: number;
  blockers: WebGPUProductionGateResult[];
  results: WebGPUProductionGateResult[];
}

export function makeGateResult(
  gate: WebGPUProductionGateName,
  patch: Partial<Omit<WebGPUProductionGateResult, 'gate' | 'verified' | 'timestamp'>> = {},
): WebGPUProductionGateResult {
  const gpuExecuted = patch.gpuExecuted === true;
  const readbackVerified = patch.readbackVerified === true;
  const blocked = patch.blocked === true || !gpuExecuted || !readbackVerified;
  return {
    gate,
    gpuExecuted,
    readbackVerified,
    verified: gpuExecuted && readbackVerified && blocked === false,
    blocked,
    evidence: patch.evidence ?? 'No runtime evidence',
    timestamp: Date.now(),
  };
}

export function summarizeWebGPUProduction(
  results: readonly WebGPUProductionGateResult[],
): WebGPUProductionReport {
  const blockers = results.filter((result) => !result.verified);
  return {
    allGatesPassed: results.length === 13 && blockers.length === 0,
    totalGates: results.length,
    passedGates: results.filter((result) => result.verified).length,
    failedGates: blockers.length,
    blockers,
    results: [...results],
  };
}
