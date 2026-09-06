import { BerxOnboardingWorldRuntime } from './spatialOnboardingRuntime';

describe('BerxOnboardingWorldRuntime', () => {
  it('keeps onboarding as a persistent spatial world', () => {
    const runtime = new BerxOnboardingWorldRuntime();
    const first = runtime.snapshot();
    const transition = runtime.enter('interests');
    const next = runtime.snapshot();

    expect(first.state.activeStep).toBe('welcome');
    expect(first.state.position.z).not.toBe(next.state.position.z);
    expect(transition.from).toBe('welcome');
    expect(transition.to).toBe('interests');
    expect(transition.durationMs).toBeGreaterThan(0);
    expect(transition.arcHeight).toBeGreaterThan(0);
    expect(next.state.temporalPhase).toBe('future');
    expect(next.state.relation).toBe('preference');
  });

  it('persists completed spatial states independently of the active volume', () => {
    const runtime = new BerxOnboardingWorldRuntime();
    runtime.complete('identity');
    runtime.enter('privacy');
    const state = runtime.snapshot().state;

    expect(state.activeStep).toBe('privacy');
    expect(state.completed.has('identity')).toBe(true);
    expect(state.completed.has('privacy')).toBe(false);
  });
});
