/**
 * BERX WebGPU production verification contract.
 *
 * This module is intentionally an executable contract, not an optimistic
 * capability declaration. A production gate is green only when the backing
 * runtime reports evidence for the required behaviour. Environment-only
 * checks are never allowed to promote a renderer to production.
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
  | 'world-text'
  | 'picking'
  | 'lifecycle';

export interface WebGPUVerificationEvidence {
  gate: WebGPUProductionGate;
  verified: boolean;
  gpuExecuted: boolean;
  readbackVerified: boolean;
  details: string;
  timestamp: number;
}

export interface WebGPUProductionVerificationReport {
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  results: WebGPUVerificationEvidence[];
}

export interface WebGPUProductionVerifierAdapter {
  verify(gate: WebGPUProductionGate): Promise<WebGPUVerificationEvidence>;
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
  'world-text',
  'picking',
  'lifecycle',
] as const;

export async function runWebGPUProductionContract(
  adapter: WebGPUProductionVerifierAdapter,
): Promise<WebGPUProductionVerificationReport> {
  const results: WebGPUVerificationEvidence[] = [];

  for (const gate of WEBGPU_PRODUCTION_GATES) {
    results.push(await adapter.verify(gate));
  }

  const passed = results.filter((result) => result.verified).length;
  const blocked = results.filter((result) => !result.gpuExecuted).length;
  const failed = results.length - passed;

  return {
    allPassed: results.length === WEBGPU_PRODUCTION_GATES.length && failed === 0 && blocked === 0,
    total: results.length,
    passed,
    failed,
    blocked,
    results,
  };
}

export function makeBlockedEvidence(gate: WebGPUProductionGate, details: string): WebGPUVerificationEvidence {
  return {
    gate,
    verified: false,
    gpuExecuted: false,
    readbackVerified: false,
    details,
    timestamp: Date.now(),
  };
}
