import {
  createBerxOnboardingWorld,
  nextOnboardingStep,
  previousOnboardingStep,
  onboardingStepIndex,
} from './spatialOnboarding';

describe('BERX MAX 5D onboarding world', () => {
  it('creates one persistent spatial volume per onboarding state', () => {
    const world = createBerxOnboardingWorld();
    expect(world.length).toBe(19);
    expect(new Set(world.map((volume) => volume.id)).size).toBe(world.length);
    expect(world.every((volume) => volume.interactive)).toBe(true);
    expect(world.every((volume) => Number.isFinite(volume.transform.position.z))).toBe(true);
  });

  it('links onboarding through spatial adjacency instead of routes', () => {
    const world = createBerxOnboardingWorld();
    for (let index = 1; index < world.length; index += 1) {
      expect(world[index].enterFrom).toBe(world[index - 1].id);
      expect(world[index - 1].exitTo).toBe(world[index].id);
    }
  });

  it('keeps deterministic temporal order independent of a screen stack', () => {
    expect(onboardingStepIndex('welcome')).toBe(0);
    expect(nextOnboardingStep('welcome')).toBe('identity');
    expect(previousOnboardingStep('identity')).toBe('welcome');
    expect(nextOnboardingStep('world')).toBeNull();
  });
});
