/**
 * BERX MAX 5D onboarding runtime model.
 *
 * Platform-free and renderer-agnostic. The onboarding journey is a living
 * spatial environment: state has position, depth, temporal phase and
 * relational context. Authentication/API side effects remain owned by the
 * application shell.
 */

import type { BerxOnboardingStep, BerxOnboardingVolume } from './spatialOnboarding';
import { createBerxOnboardingWorld, onboardingStepIndex } from './spatialOnboarding';

export type BerxOnboardingTemporalPhase = 'past' | 'now' | 'future';
export type BerxOnboardingRelation =
  | 'self'
  | 'identity'
  | 'trust'
  | 'preference'
  | 'permission'
  | 'reward'
  | 'world-entry';

export interface BerxOnboardingSpatialState {
  activeStep: BerxOnboardingStep;
  progress: number;
  temporalPhase: BerxOnboardingTemporalPhase;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  relation: BerxOnboardingRelation;
  relationStrength: number;
  energy: number;
  completed: ReadonlySet<BerxOnboardingStep>;
}

export interface BerxOnboardingCameraTransition {
  from: BerxOnboardingStep;
  to: BerxOnboardingStep;
  durationMs: number;
  arcHeight: number;
  depthDelta: number;
}

export interface BerxOnboardingWorldSnapshot {
  volumes: readonly BerxOnboardingVolume[];
  state: BerxOnboardingSpatialState;
}

const RELATIONS: Record<BerxOnboardingStep, BerxOnboardingRelation> = {
  welcome: 'self',
  identity: 'identity',
  verification: 'trust',
  name: 'identity',
  'berx-id': 'identity',
  birthday: 'identity',
  gender: 'identity',
  interests: 'preference',
  hobbies: 'preference',
  music: 'preference',
  photo: 'identity',
  bio: 'identity',
  location: 'permission',
  permissions: 'permission',
  privacy: 'permission',
  completion: 'reward',
  reward: 'reward',
  level: 'reward',
  world: 'world-entry',
};

const STEP_PHASE: Record<BerxOnboardingStep, BerxOnboardingTemporalPhase> = {
  welcome: 'now',
  identity: 'now',
  verification: 'now',
  name: 'now',
  'berx-id': 'now',
  birthday: 'past',
  gender: 'now',
  interests: 'future',
  hobbies: 'future',
  music: 'future',
  photo: 'now',
  bio: 'now',
  location: 'now',
  permissions: 'now',
  privacy: 'future',
  completion: 'future',
  reward: 'future',
  level: 'future',
  world: 'future',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

export class BerxOnboardingWorldRuntime {
  private readonly volumes: readonly BerxOnboardingVolume[];
  private activeStep: BerxOnboardingStep;
  private readonly completed = new Set<BerxOnboardingStep>();

  constructor(volumes: readonly BerxOnboardingVolume[] = createBerxOnboardingWorld()) {
    if (volumes.length === 0) throw new Error('BERX onboarding world requires at least one volume');
    this.volumes = volumes;
    this.activeStep = volumes[0].step;
  }

  snapshot(): BerxOnboardingWorldSnapshot {
    const active = this.volume(this.activeStep);
    const index = onboardingStepIndex(this.activeStep);
    const progress = index / Math.max(1, this.volumes.length - 1);
    const phase = STEP_PHASE[this.activeStep];

    return {
      volumes: this.volumes,
      state: {
        activeStep: this.activeStep,
        progress,
        temporalPhase: phase,
        position: { ...active.transform.position },
        target: { ...active.transform.position },
        relation: RELATIONS[this.activeStep],
        relationStrength: clamp(0.45 + progress * 0.55, 0, 1),
        energy: clamp(0.22 + progress * 0.78, 0, 1),
        completed: new Set(this.completed),
      },
    };
  }

  enter(step: BerxOnboardingStep): BerxOnboardingCameraTransition {
    const from = this.volume(this.activeStep);
    const to = this.volume(step);
    const depthDelta = to.transform.position.z - from.transform.position.z;
    const arcHeight = clamp(Math.abs(depthDelta) * 0.16 + distance(from.transform.position, to.transform.position) * 0.08, 0.45, 3.2);
    const durationMs = clamp(520 + distance(from.transform.position, to.transform.position) * 38, 520, 1100);

    this.activeStep = step;
    return {
      from: from.step,
      to: to.step,
      durationMs,
      arcHeight,
      depthDelta,
    };
  }

  complete(step: BerxOnboardingStep = this.activeStep): void {
    this.completed.add(step);
  }

  hasCompleted(step: BerxOnboardingStep): boolean {
    return this.completed.has(step);
  }

  volume(step: BerxOnboardingStep): BerxOnboardingVolume {
    const volume = this.volumes.find((candidate) => candidate.step === step);
    if (!volume) throw new Error(`Unknown BERX onboarding spatial step: ${step}`);
    return volume;
  }

  relationFor(step: BerxOnboardingStep): BerxOnboardingRelation {
    return RELATIONS[step];
  }

  phaseFor(step: BerxOnboardingStep): BerxOnboardingTemporalPhase {
    return STEP_PHASE[step];
  }
}
