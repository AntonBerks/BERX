/**
 * BERX MAX 5D onboarding world model.
 *
 * This is a platform-free world-state layer. It deliberately contains no
 * React, DOM, navigation routes, or visual screen model. Renderers consume
 * these spatial volumes and the app shell owns the actual auth/API effects.
 */

export type BerxOnboardingStep =
  | 'welcome'
  | 'identity'
  | 'verification'
  | 'name'
  | 'berx-id'
  | 'birthday'
  | 'gender'
  | 'interests'
  | 'hobbies'
  | 'music'
  | 'photo'
  | 'bio'
  | 'location'
  | 'permissions'
  | 'privacy'
  | 'completion'
  | 'reward'
  | 'level'
  | 'world';

export interface BerxSpatialVolumeTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface BerxOnboardingVolume {
  id: string;
  step: BerxOnboardingStep;
  transform: BerxSpatialVolumeTransform;
  depth: number;
  enterFrom: string | null;
  exitTo: string | null;
  interactive: true;
}

const STEPS: BerxOnboardingStep[] = [
  'welcome', 'identity', 'verification', 'name', 'berx-id', 'birthday',
  'gender', 'interests', 'hobbies', 'music', 'photo', 'bio', 'location',
  'permissions', 'privacy', 'completion', 'reward', 'level', 'world',
];

/** Deterministic world path: no route index is used as spatial identity. */
export function createBerxOnboardingWorld(): BerxOnboardingVolume[] {
  return STEPS.map((step, index) => {
    const angle = index * 0.62;
    const radius = 5.5 + Math.min(index, 8) * 0.35;
    const x = Math.cos(angle) * radius;
    const z = -8 - Math.sin(angle) * radius - index * 3.2;
    const y = Math.sin(index * 0.83) * 1.8;
    const id = `onboarding:${step}`;

    return {
      id,
      step,
      transform: {
        position: { x, y, z },
        rotation: { x: 0, y: -angle, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      depth: Math.abs(z),
      enterFrom: index === 0 ? null : `onboarding:${STEPS[index - 1]}`,
      exitTo: index === STEPS.length - 1 ? null : `onboarding:${STEPS[index + 1]}`,
      interactive: true,
    };
  });
}

export function onboardingStepIndex(step: BerxOnboardingStep): number {
  return STEPS.indexOf(step);
}

export function nextOnboardingStep(step: BerxOnboardingStep): BerxOnboardingStep | null {
  const index = onboardingStepIndex(step);
  return index >= 0 && index < STEPS.length - 1 ? STEPS[index + 1] : null;
}

export function previousOnboardingStep(step: BerxOnboardingStep): BerxOnboardingStep | null {
  const index = onboardingStepIndex(step);
  return index > 0 ? STEPS[index - 1] : null;
}
