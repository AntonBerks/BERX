/** BERX factual capability probing. Never infer unsupported GPU features from a target name. */
import type {BerxPlatformCapabilities, BerxPlatformTarget} from './platform';

export function emptyCapabilities(gpu: BerxPlatformCapabilities['gpu'] = 'none'): BerxPlatformCapabilities {
  return {
    gpu,
    depthBuffer: false,
    physicallyLitMaterials: false,
    shadows: false,
    postProcessing: false,
    spatialAudio: false,
    poseTracking: false,
    keyboard: false,
    pointer: false,
  };
}

export async function detectWebCapabilities(): Promise<BerxPlatformCapabilities> {
  const caps = emptyCapabilities();
  caps.pointer = typeof window !== 'undefined';
  caps.keyboard = typeof window !== 'undefined';
  caps.gpu = 'webgl2';

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) caps.depthBuffer = true;

    const gpu = (navigator as Navigator & {gpu?: GPU}).gpu;
    if (gpu) {
      try {
        const adapter = await gpu.requestAdapter();
        if (adapter) {
          const device = await adapter.requestDevice();
          caps.gpu = 'webgpu';
          caps.depthBuffer = true;
          caps.physicallyLitMaterials = true;
          device.destroy();
        }
      } catch {
        /* Keep WebGL2 as the factual runtime capability. */
      }
    }
  }

  return caps;
}

/** Native/XR capability probes are supplied by the real platform adapter. */
export function requireNativeCapabilities(
  target: BerxPlatformTarget['form'],
  reported: BerxPlatformCapabilities,
): BerxPlatformCapabilities {
  if (target === 'ar' && !reported.poseTracking) {
    throw new Error('BERX AR runtime requires verified pose tracking');
  }
  if (target === 'vr' && (!reported.poseTracking || !reported.keyboard && !reported.pointer)) {
    throw new Error('BERX VR runtime requires verified pose tracking and input');
  }
  return reported;
}
