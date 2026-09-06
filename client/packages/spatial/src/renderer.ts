import type { Berx5DFrame } from './runtime5d';

/**
 * Renderer boundary. The spatial domain never knows whether the pixels are
 * produced by WebGL2, Filament/Metal/Vulkan, or another future GPU backend.
 * A renderer is only considered real when it consumes the authoritative
 * frame and performs a perspective/depth GPU pass.
 */
export interface BerxSpatialRenderer {
  readonly kind: 'webgl2' | 'webgpu' | 'filament';
  readonly capabilities: {
    perspective: boolean;
    depthBuffer: boolean;
    physicallyLitMaterials: boolean;
    shadows: boolean;
    postProcessing: boolean;
  };
  resize(width: number, height: number): void;
  render(frame: Berx5DFrame): void;
  dispose(): void;
}

export interface BerxSpatialInputAdapter {
  setPointer(x: number, y: number, pressed: boolean): void;
  setPan(deltaX: number, deltaY: number): void;
  setPinch(delta: number): void;
  setDeviceMotion(pitch: number, roll: number, yaw: number, intensity: number): void;
}

export interface BerxSpatialFeedbackAdapter {
  impact(kind: 'selection' | 'focus' | 'transition' | 'success' | 'error', intensity?: number): void;
  spatialAudio(event: string, position?: {x:number;y:number;z:number}): void;
}
