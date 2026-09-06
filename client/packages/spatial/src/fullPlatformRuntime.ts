/**
 * BERX FULL MAX 5D platform runtime contract.
 *
 * This module is intentionally platform-neutral. It turns the platform matrix
 * into executable lifecycle rules: every target gets the same persistent world
 * and must attach a real renderer/input/display adapter before it can claim
 * runtime readiness.
 */
import type {Berx5DFrame} from './runtime5d';
import type {BerxNavigationIntent, BerxPlatformCapabilities, BerxSpatialRendererBackend, BerxDisplay} from './platform';
import {BERX_PLATFORM_TARGETS, berxPlatformGaps, berxPlatformSupported, type BerxPlatformTarget} from './platformTargets';
import {Berx5DWorldApp} from './worldApp';

export type BerxPlatformRuntimeState = 'unbound' | 'ready' | 'blocked' | 'disposed';

export interface BerxPlatformAdapter {
  readonly display: BerxDisplay;
  readonly capabilities: BerxPlatformCapabilities;
  readonly renderer: BerxSpatialRendererBackend;
  attach(world: Berx5DWorldApp): void;
  dispatch(intent: BerxNavigationIntent): void;
  resize(width: number, height: number, pixelRatio?: number): void;
  frame(): Berx5DFrame | undefined;
  dispose(): void;
}

export interface BerxPlatformRuntimeSnapshot {
  form: BerxPlatformTarget['form'];
  state: BerxPlatformRuntimeState;
  supported: boolean;
  gaps: readonly string[];
  frameCount: number;
}

export class BerxFull5DPlatformRuntime {
  readonly world: Berx5DWorldApp;
  private adapter?: BerxPlatformAdapter;
  private state: BerxPlatformRuntimeState = 'unbound';
  private frames = 0;

  constructor(readonly form: BerxPlatformTarget['form'], world: Berx5DWorldApp = new Berx5DWorldApp()) {
    this.world = world;
  }

  bind(adapter: BerxPlatformAdapter): void {
    if (this.state === 'disposed') throw new Error('BERX 5D runtime is disposed');
    const gaps = berxPlatformGaps(this.form, adapter.capabilities);
    if (!berxPlatformSupported(this.form, adapter.capabilities)) {
      this.state = 'blocked';
      throw new Error(`BERX ${this.form} runtime blocked: ${gaps.join('; ')}`);
    }
    this.adapter = adapter;
    adapter.attach(this.world);
    this.state = 'ready';
  }

  dispatch(intent: BerxNavigationIntent): void {
    if (this.state !== 'ready' || !this.adapter) throw new Error(`BERX ${this.form} runtime is not ready`);
    this.adapter.dispatch(intent);
  }

  resize(width: number, height: number, pixelRatio = 1): void {
    if (this.state !== 'ready' || !this.adapter) return;
    this.adapter.resize(width, height, pixelRatio);
  }

  render(): Berx5DFrame | undefined {
    if (this.state !== 'ready' || !this.adapter) return undefined;
    const frame = this.adapter.frame();
    if (!frame) return undefined;
    this.adapter.renderer.render(frame);
    this.frames += 1;
    return frame;
  }

  snapshot(): BerxPlatformRuntimeSnapshot {
    const gaps = this.adapter ? berxPlatformGaps(this.form, this.adapter.capabilities) : ['renderer/input/display adapter not bound'];
    return {
      form: this.form,
      state: this.state,
      supported: !!this.adapter && berxPlatformSupported(this.form, this.adapter.capabilities),
      gaps,
      frameCount: this.frames,
    };
  }

  dispose(): void {
    if (this.adapter) this.adapter.dispose();
    this.adapter = undefined;
    this.state = 'disposed';
  }
}

export function createFull5DRuntimes(world?: Berx5DWorldApp): Record<BerxPlatformTarget['form'], BerxFull5DPlatformRuntime> {
  return {
    watch: new BerxFull5DPlatformRuntime('watch', world),
    phone: new BerxFull5DPlatformRuntime('phone', world),
    tablet: new BerxFull5DPlatformRuntime('tablet', world),
    desktop: new BerxFull5DPlatformRuntime('desktop', world),
    ar: new BerxFull5DPlatformRuntime('ar', world),
    vr: new BerxFull5DPlatformRuntime('vr', world),
  };
}
