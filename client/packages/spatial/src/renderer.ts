import type { Berx5DFrame } from './runtime5d';
import type { BerxHit } from './spatialInteraction';

export type BerxGpuKind = 'webgl2' | 'webgpu' | 'metal' | 'vulkan' | 'filament' | 'none';

export interface BerxRendererCapabilities {
  perspective: boolean;
  depthBuffer: boolean;
  physicallyLitMaterials: boolean;
  shadows: boolean;
  postProcessing: boolean;
  imageBasedLighting: boolean;
  ssao: boolean;
  hdr: boolean;
  msaa: boolean;
  instancing: boolean;
  stereo: boolean;
  picking: boolean;
  deviceLossRecovery: boolean;
}

export interface BerxRenderOptions {
  stereo?: {
    leftEye: Float32Array;
    rightEye: Float32Array;
    ipd: number;
  };
  temporalCursor?: number;
  debugOverlay?: boolean;
  maxObjects?: number;
  ambientMotion?: boolean;
}

/**
 * Single renderer boundary for every BERX platform.
 * It consumes the authoritative Berx5DFrame and never owns a second world.
 */
export interface BerxSpatialRenderer {
  readonly kind: BerxGpuKind;
  readonly capabilities: BerxRendererCapabilities;
  readonly isDeviceLost: boolean;

  initialize(): Promise<boolean>;
  resize(widthPx: number, heightPx: number): void;
  render(frame: Berx5DFrame, options?: BerxRenderOptions): void;
  pick(frame: Berx5DFrame, xPx: number, yPx: number): BerxHit | string | null | undefined;
  dispose(): void;

  onDeviceLost(callback: () => void): void;
  onDeviceRestored(callback: () => void): void;
}

export interface BerxSpatialInputAdapter {
  setPointer(x: number, y: number, pressed: boolean): void;
  setPan(deltaX: number, deltaY: number): void;
  setPinch(delta: number): void;
  setDeviceMotion(pitch: number, roll: number, yaw: number, intensity: number): void;
}

export interface BerxSpatialFeedbackAdapter {
  impact(kind: 'selection' | 'focus' | 'transition' | 'success' | 'error', intensity?: number): void;
  spatialAudio(event: string, position?: {x:number; y:number; z:number}): void;
}
