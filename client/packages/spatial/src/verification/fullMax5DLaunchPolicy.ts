export interface LaunchCapabilityEvidence {
  supported: boolean;
  verified: boolean;
  evidence: string | null;
  blocker: string | null;
}

export interface FullMax5DLaunchPolicy {
  sharedCore: LaunchCapabilityEvidence;
  webgpu: LaunchCapabilityEvidence;
  webgl2Fallback: LaunchCapabilityEvidence;
  desktop: LaunchCapabilityEvidence;
  iosMetal: LaunchCapabilityEvidence;
  androidVulkan: LaunchCapabilityEvidence;
  tablet: LaunchCapabilityEvidence;
  watchOS: LaunchCapabilityEvidence;
  arkit: LaunchCapabilityEvidence;
  arcore: LaunchCapabilityEvidence;
  openXR: LaunchCapabilityEvidence;
  spatialAudio: LaunchCapabilityEvidence;
  mediaPipeline: LaunchCapabilityEvidence;
  authentication: LaunchCapabilityEvidence;
  registration: LaunchCapabilityEvidence;
  backendAuthorization: LaunchCapabilityEvidence;
  persistence: LaunchCapabilityEvidence;
  realtimeSync: LaunchCapabilityEvidence;
  packaging: LaunchCapabilityEvidence;
  realDeviceVerification: LaunchCapabilityEvidence;
  designIntegration: LaunchCapabilityEvidence;
}

export function capabilityReady(e: LaunchCapabilityEvidence): boolean {
  return e.supported === true && e.verified === true && typeof e.evidence === 'string' && e.evidence.length > 0;
}

export function canOpenFullMax5D(policy: FullMax5DLaunchPolicy): boolean {
  return Object.values(policy).every(capabilityReady);
}

export function getLaunchBlockers(policy: FullMax5DLaunchPolicy): string[] {
  return Object.entries(policy)
    .filter(([, evidence]) => !capabilityReady(evidence))
    .map(([name, evidence]) => `${name}: ${evidence.blocker ?? 'runtime evidence is missing'}`);
}

export const BERX_DESIGN_TOKENS = {
  background: '#07080A',
  primaryAccent: '#4FD6E8',
  glassSurface: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#F0F4F8',
  textSecondary: 'rgba(240,244,248,0.68)',
  spatialDepth: true,
  temporalState: true,
  relationalState: true,
  zero2DPrimary: true,
} as const;
