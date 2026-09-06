/**
 * Machine-readable readiness matrix for BERX FULL MAX 5D targets.
 * A platform is not READY merely because it has a contract: it needs a
 * concrete renderer adapter and a real build/verification path.
 */
export type BerxRuntimeStatus = 'implemented' | 'verification-blocked' | 'unimplemented';

export interface BerxPlatformRuntimeStatus {
  platform: 'web' | 'desktop' | 'tablet' | 'ios' | 'android' | 'watch' | 'ar' | 'vr';
  status: BerxRuntimeStatus;
  primaryWorld: true;
  zeroFlatPrimary: true;
  realRendererRequired: true;
  verificationRequired: true;
  notes: string;
}

export const BERX_FULL_5D_RUNTIME_STATUS: readonly BerxPlatformRuntimeStatus[] = [
  { platform: 'web', status: 'implemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Web spatial runtime is the verified primary world surface.' },
  { platform: 'desktop', status: 'verification-blocked', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Requires concrete desktop packaging and runtime verification.' },
  { platform: 'tablet', status: 'verification-blocked', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Shared world contract exists; device runtime verification remains required.' },
  { platform: 'ios', status: 'unimplemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Native Metal runtime must be implemented and verified.' },
  { platform: 'android', status: 'unimplemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Native Vulkan/runtime path must be implemented and verified.' },
  { platform: 'watch', status: 'unimplemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Native watch spatial runtime must be implemented and verified.' },
  { platform: 'ar', status: 'unimplemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Real pose-tracked AR runtime must be implemented and verified.' },
  { platform: 'vr', status: 'unimplemented', primaryWorld: true, zeroFlatPrimary: true, realRendererRequired: true, verificationRequired: true, notes: 'Real stereo immersive VR runtime must be implemented and verified.' },
];

export function berxAllPlatformsReady(): boolean {
  return BERX_FULL_5D_RUNTIME_STATUS.every((entry) => entry.status === 'implemented');
}
