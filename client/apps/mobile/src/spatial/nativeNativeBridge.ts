/**
 * BERX native MAX 5D bridge contract.
 *
 * Platform-neutral native entry point. Metal/Vulkan/XR implementations
 * must provide these callbacks in the actual iOS/Android/desktop/XR hosts.
 * No 2D screen renderer is accepted by this contract.
 */
import type {Berx5DFrame} from '@berx/spatial';
import type {BerxNavigationIntent, BerxPlatformCapabilities} from '@berx/spatial';

export interface BerxNative5DHost {
  readonly platform: 'ios' | 'android' | 'desktop' | 'tablet' | 'watch' | 'ar' | 'vr';
  readonly capabilities: BerxPlatformCapabilities;
  attach(canvasOrSurface: unknown): void;
  resize(widthPx: number, heightPx: number, pixelRatio: number): void;
  render(frame: Berx5DFrame): void;
  dispatch(intent: BerxNavigationIntent): void;
  dispose(): void;
}

export function assertNative5DHost(host: BerxNative5DHost): void {
  if (!host.capabilities.depthBuffer) throw new Error('Native 5D host requires a depth buffer');
  if (!host.capabilities.physicallyLitMaterials) throw new Error('Native 5D host requires physically-lit materials');
  if (!host.capabilities.pointer) throw new Error('Native 5D host requires spatial pointer input');
  if (host.capabilities.gpu !== 'metal' && host.capabilities.gpu !== 'vulkan') {
    throw new Error(`Native 5D host requires Metal or Vulkan, got ${host.capabilities.gpu}`);
  }
}
