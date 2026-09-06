/**
 * BERX MAX 5D runtime.
 *
 * One persistent world + one camera + one transition history. A platform
 * renderer consumes this state. Navigation therefore becomes movement through
 * a world instead of replacement of flat screens.
 */

import { BerxSpatialCamera, type BerxCameraInput, type BerxSpatialCameraState } from './spatialCamera';
import { BerxSpatialWorld, type BerxSpatialObject, type BerxSpatialWorldSnapshot, type BerxVec3 } from './world';

export type BerxWorldId = string;

export interface BerxWorldState {
  id: BerxWorldId;
  sourceRoute?: string;
  focusObjectId?: string;
  enteredAt: number;
}

export interface BerxSpatialTransitionState {
  fromWorld: BerxWorldState;
  toWorld: BerxWorldState;
  fromCamera: BerxSpatialCameraState;
  destination: BerxVec3;
  progress: number;
  duration: number;
}

export interface Berx5DFrame {
  world: BerxSpatialWorldSnapshot;
  camera: BerxSpatialCameraState;
  transition?: BerxSpatialTransitionState;
  reducedMotion: boolean;
  deviceMotionEnabled: boolean;
}

export interface Berx5DRuntimeOptions {
  reducedMotion?: boolean;
  deviceMotionEnabled?: boolean;
}

export class Berx5DRuntime {
  readonly world: BerxSpatialWorld;
  readonly camera: BerxSpatialCamera;
  private readonly history: BerxWorldState[] = [];
  private currentWorld: BerxWorldState;
  private transition?: BerxSpatialTransitionState;
  private reducedMotion: boolean;
  private deviceMotionEnabled: boolean;

  constructor(options: Berx5DRuntimeOptions = {}) {
    this.world = new BerxSpatialWorld();
    this.camera = new BerxSpatialCamera();
    this.currentWorld = { id: 'root', enteredAt: Date.now() };
    this.reducedMotion = options.reducedMotion === true;
    this.deviceMotionEnabled = options.deviceMotionEnabled !== false;
  }

  get worldState(): BerxWorldState {
    return { ...this.currentWorld };
  }

  setAccessibility(options: { reducedMotion?: boolean }): void {
    if (options.reducedMotion !== undefined) this.reducedMotion = options.reducedMotion;
  }

  setDeviceMotionEnabled(enabled: boolean): void {
    this.deviceMotionEnabled = enabled;
  }

  registerObject(object: BerxSpatialObject): void {
    this.world.upsertObject(object);
  }

  focus(objectId: string): void {
    const object = this.world.getObject(objectId);
    if (!object) return;
    this.world.setActiveObject(objectId);
    this.currentWorld.focusObjectId = objectId;
    this.camera.moveTo(object.transform.position, this.reducedMotion ? 0 : 0.65);
  }

  enterWorld(world: BerxWorldState, destination?: BerxVec3): void {
    const previous = { ...this.currentWorld };
    this.history.push(previous);
    this.currentWorld = { ...world, enteredAt: Date.now() };
    const target = destination ?? this.world.getActiveObject()?.transform.position ?? { x: 0, y: 0, z: 0 };
    const duration = this.reducedMotion ? 0.01 : 0.65;
    this.transition = {
      fromWorld: previous,
      toWorld: { ...this.currentWorld },
      fromCamera: this.camera.getState(),
      destination: { ...target },
      progress: 0,
      duration,
    };
  }

  back(): void {
    const previous = this.history.pop();
    if (!previous) return;
    const target = this.world.getObject(previous.focusObjectId ?? '')?.transform.position ?? { x: 0, y: 0, z: 0 };
    const from = { ...this.currentWorld };
    this.currentWorld = previous;
    this.transition = {
      fromWorld: from,
      toWorld: { ...previous },
      fromCamera: this.camera.getState(),
      destination: { ...target },
      progress: 0,
      duration: this.reducedMotion ? 0.01 : 0.65,
    };
  }

  input(input: BerxCameraInput): void {
    this.camera.applyInput({
      ...input,
      motion: this.deviceMotionEnabled ? input.motion : undefined,
    });
  }

  frame(deltaSeconds: number): Berx5DFrame {
    this.world.tick(deltaSeconds);
    this.camera.frame(deltaSeconds, this.reducedMotion);

    if (this.transition) {
      this.transition.progress = Math.min(1, this.transition.progress + deltaSeconds / this.transition.duration);
      if (this.transition.progress >= 1) this.transition = undefined;
    }

    return {
      world: this.world.snapshot(),
      camera: this.camera.getState(),
      transition: this.transition ? { ...this.transition, fromCamera: { ...this.transition.fromCamera } } : undefined,
      reducedMotion: this.reducedMotion,
      deviceMotionEnabled: this.deviceMotionEnabled,
    };
  }
}
