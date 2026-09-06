/**
 * BERX FULL MAX 5D platform contract.
 * One world, many physical runtimes; no platform-specific 2D product model.
 */
import type {BerxPlatformCapabilities, BerxSpatialRendererBackend, BerxDisplayForm} from './platform';

export type BerxPlatformTargetName = 'web' | 'desktop' | 'tablet' | 'ios' | 'android' | 'watch' | 'ar' | 'vr';

export interface BerxPlatformRuntimeContract {
  target: BerxPlatformTargetName;
  displayForm: BerxDisplayForm;
  renderer: BerxSpatialRendererBackend;
  capabilities: BerxPlatformCapabilities;
  primaryExperience: 'spatial-world';
  domProductUi: false;
  sharedWorld: true;
}

export const BERX_FULL_MAX_5D_TARGETS: readonly BerxPlatformTargetName[] = [
  'web', 'desktop', 'tablet', 'ios', 'android', 'watch', 'ar', 'vr',
];

export function assertFullMax5DPlatform(contract: BerxPlatformRuntimeContract): void {
  if (!contract.sharedWorld) throw new Error('FULL MAX 5D invariant: platform has a separate world');
  if (contract.primaryExperience !== 'spatial-world') throw new Error('FULL MAX 5D invariant: primary experience is not the spatial world');
  if (contract.domProductUi) throw new Error('FULL MAX 5D invariant: DOM product UI is primary');
  if (!contract.renderer.capabilities.perspective) throw new Error('FULL MAX 5D invariant: renderer has no perspective projection');
  if (!contract.capabilities.depthBuffer) throw new Error('FULL MAX 5D invariant: depth buffer missing');
  if (contract.capabilities.gpu === 'none') throw new Error('FULL MAX 5D invariant: no GPU backend');
}

export function platformTargetList(): readonly BerxPlatformTargetName[] {
  return BERX_FULL_MAX_5D_TARGETS;
}
