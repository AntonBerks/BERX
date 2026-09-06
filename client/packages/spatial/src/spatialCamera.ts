/** BERX MAX 5D camera state and interaction physics. */

import type { BerxEuler3, BerxVec3 } from './world';

export interface BerxSpatialCameraState {
  position: BerxVec3;
  target: BerxVec3;
  rotation: BerxEuler3;
  fov: number;
  near: number;
  far: number;
}

export interface BerxDeviceMotion {
  pitch: number;
  roll: number;
  yaw: number;
  intensity: number;
}

export interface BerxCameraInput {
  panX: number;
  panY: number;
  depthDelta: number;
  pinch: number;
  motion?: BerxDeviceMotion;
}

export interface BerxCameraLimits {
  maxTiltDeg: number;
  maxDepth: number;
  minFov: number;
  maxFov: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class BerxSpatialCamera {
  private state: BerxSpatialCameraState;
  private velocity: BerxVec3 = { x: 0, y: 0, z: 0 };
  private readonly limits: BerxCameraLimits;

  constructor(initial?: Partial<BerxSpatialCameraState>, limits?: Partial<BerxCameraLimits>) {
    this.state = {
      position: initial?.position ?? { x: 0, y: 0, z: 8 },
      target: initial?.target ?? { x: 0, y: 0, z: 0 },
      rotation: initial?.rotation ?? { x: 0, y: 0, z: 0 },
      fov: initial?.fov ?? 42,
      near: initial?.near ?? 0.01,
      far: initial?.far ?? 500,
    };
    this.limits = {
      maxTiltDeg: limits?.maxTiltDeg ?? 6,
      maxDepth: limits?.maxDepth ?? 30,
      minFov: limits?.minFov ?? 28,
      maxFov: limits?.maxFov ?? 58,
    };
  }

  getState(): BerxSpatialCameraState {
    return JSON.parse(JSON.stringify(this.state)) as BerxSpatialCameraState;
  }

  applyInput(input: BerxCameraInput): void {
    this.velocity.x += input.panX * 0.18;
    this.velocity.y += input.panY * 0.18;
    this.velocity.z += input.depthDelta * 0.28;

    this.state.fov = clamp(this.state.fov - input.pinch * 0.45, this.limits.minFov, this.limits.maxFov);

    if (input.motion) {
      const factor = clamp(input.motion.intensity, 0, 1);
      const tilt = this.limits.maxTiltDeg * factor;
      this.state.rotation.x = clamp(input.motion.pitch * tilt, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
      this.state.rotation.z = clamp(input.motion.roll * tilt, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
      this.state.rotation.y = clamp(input.motion.yaw * tilt * 0.55, -this.limits.maxTiltDeg, this.limits.maxTiltDeg);
    }
  }

  frame(deltaSeconds: number, reducedMotion = false): void {
    const dt = clamp(deltaSeconds, 0, 0.05);
    const damping = Math.pow(0.001, dt);
    this.state.position.x += this.velocity.x * dt;
    this.state.position.y += this.velocity.y * dt;
    this.state.position.z = clamp(this.state.position.z + this.velocity.z * dt, -this.limits.maxDepth, this.limits.maxDepth);
    this.velocity.x *= damping;
    this.velocity.y *= damping;
    this.velocity.z *= damping;

    if (reducedMotion) {
      this.state.rotation.x = lerp(this.state.rotation.x, 0, 1 - damping);
      this.state.rotation.y = lerp(this.state.rotation.y, 0, 1 - damping);
      this.state.rotation.z = lerp(this.state.rotation.z, 0, 1 - damping);
    }
  }

  moveTo(target: BerxVec3, durationSeconds = 0.65): BerxCameraTransition {
    return new BerxCameraTransition(this.getState(), { ...target }, durationSeconds);
  }
}

export class BerxCameraTransition {
  private elapsed = 0;
  private readonly start: BerxSpatialCameraState;
  private readonly destination: BerxVec3;
  private readonly duration: number;

  constructor(start: BerxSpatialCameraState, destination: BerxVec3, durationSeconds: number) {
    this.start = start;
    this.destination = destination;
    this.duration = Math.max(0.001, durationSeconds);
  }

  step(deltaSeconds: number): BerxSpatialCameraState {
    this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, deltaSeconds));
    const raw = this.elapsed / this.duration;
    const t = raw * raw * (3 - 2 * raw);
    const next = JSON.parse(JSON.stringify(this.start)) as BerxSpatialCameraState;
    next.position.x = lerp(this.start.position.x, this.destination.x, t);
    next.position.y = lerp(this.start.position.y, this.destination.y, t);
    next.position.z = lerp(this.start.position.z, this.destination.z, t);
    next.target = { ...this.destination };
    return next;
  }

  get done(): boolean {
    return this.elapsed >= this.duration;
  }
}
