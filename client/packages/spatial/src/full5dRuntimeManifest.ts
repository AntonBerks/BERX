/**
 * BERX FULL MAX 5D runtime manifest.
 * One world, one identity graph, all target surfaces.
 * This manifest is intentionally capability-driven: a platform is not marked
 * ready until its renderer, input, display, build and verification artifacts exist.
 */
export type Berx5DTarget =
  | 'web'
  | 'desktop'
  | 'tablet'
  | 'ios'
  | 'android'
  | 'watch'
  | 'ar'
  | 'vr';

export type Berx5DGate =
  | 'shared-core'
  | 'renderer'
  | 'input'
  | 'display'
  | 'build'
  | 'runtime-launch'
  | 'spatial-picking'
  | 'media-gpu'
  | 'lighting'
  | 'temporal'
  | 'relational'
  | 'persistence'
  | 'accessibility';

export interface Berx5DManifestEntry {
  target: Berx5DTarget;
  sharedWorld: true;
  dimensions: readonly ['x', 'y', 'z', 't', 'r'];
  gates: Record<Berx5DGate, boolean>;
  notes: readonly string[];
}

const blocked = (notes: readonly string[]): Berx5DManifestEntry => ({
  target: 'web',
  sharedWorld: true,
  dimensions: ['x', 'y', 'z', 't', 'r'],
  gates: {
    'shared-core': true,
    renderer: false,
    input: false,
    display: false,
    build: false,
    'runtime-launch': false,
    'spatial-picking': false,
    'media-gpu': false,
    lighting: false,
    temporal: false,
    relational: false,
    persistence: false,
    accessibility: false,
  },
  notes,
});

export const BERX_FULL_5D_RUNTIME_MANIFEST: Record<Berx5DTarget, Berx5DManifestEntry> = {
  web: blocked(['Implemented separately by the spatial-web runtime; manifest is a cross-platform contract.']),
  desktop: blocked(['Requires a real desktop application target and verified GPU backend.']),
  tablet: blocked(['Requires a real tablet application target and verified GPU backend.']),
  ios: blocked(['Requires a real iOS project, Metal renderer, device/simulator verification.']),
  android: blocked(['Requires a real Android project, Vulkan renderer, device/emulator verification.']),
  watch: blocked(['Requires a real watch application target and verified GPU/display path.']),
  ar: blocked(['Requires a real AR runtime with pose tracking and stereo/scene integration.']),
  vr: blocked(['Requires a real VR runtime with stereo pose tracking and immersive input.']),
};

/** Returns true only when every required gate is actually implemented. */
export function isFull5DEntryReady(entry: Berx5DManifestEntry): boolean {
  return Object.values(entry.gates).every(Boolean);
}

/** No partial platform can accidentally be reported as FULL. */
export function full5DReadiness(entries = BERX_FULL_5D_RUNTIME_MANIFEST): Record<Berx5DTarget, boolean> {
  return Object.fromEntries(Object.entries(entries).map(([target, entry]) => [target, isFull5DEntryReady(entry)])) as Record<Berx5DTarget, boolean>;
}
