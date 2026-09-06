/** Runtime capability evidence. A capability may only be asserted after a backend proves it. */
import type { BerxRendererCapabilities } from '../renderer';

export type BerxCapabilityName = keyof BerxRendererCapabilities;

export interface BerxCapabilityEvidence {
  capability: BerxCapabilityName;
  supported: boolean;
  verified: boolean;
  evidence: string;
  timestamp: number;
}

export interface BerxCapabilityReport {
  allVerified: boolean;
  capabilities: BerxRendererCapabilities;
  evidence: readonly BerxCapabilityEvidence[];
}

const REQUIRED: readonly BerxCapabilityName[] = [
  'perspective', 'depthBuffer', 'physicallyLitMaterials', 'shadows',
  'postProcessing', 'imageBasedLighting', 'ssao', 'hdr', 'msaa',
  'instancing', 'stereo', 'picking', 'deviceLossRecovery',
];

export function failClosedCapabilities(
  evidence: readonly BerxCapabilityEvidence[],
): BerxCapabilityReport {
  const verified = new Map(evidence.map((item) => [item.capability, item]));
  const capabilities = Object.fromEntries(
    REQUIRED.map((name) => [name, verified.get(name)?.verified === true && verified.get(name)?.supported === true]),
  ) as BerxRendererCapabilities;
  return {
    allVerified: REQUIRED.every((name) => capabilities[name] === true),
    capabilities,
    evidence,
  };
}
