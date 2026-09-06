/**
 * BERX Experience System — design/runtime contracts.
 *
 * This file contains platform-neutral experience tokens only.
 * It does not create a second world, scene graph, renderer or UI shell.
 * All spatial state remains authoritative in Berx5DWorldApp/Berx5DFrame.
 */

export type TransitionEffect =
  | 'wormhole'
  | 'dissolve'
  | 'fold'
  | 'warp'
  | 'teleport'
  | 'flow'
  | 'bloom'
  | 'collapse';

export interface TransitionSpec {
  readonly effect: TransitionEffect;
  readonly durationMs: number;
  readonly easing: 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'spring';
  readonly preservesWorldIdentity: true;
  readonly preservesTemporalCursor: true;
}

export const DEFAULT_TRANSITION: TransitionSpec = {
  effect: 'wormhole',
  durationMs: 650,
  easing: 'easeOutCubic',
  preservesWorldIdentity: true,
  preservesTemporalCursor: true,
};

export const MICRO_INTERACTIONS = {
  buttonPress: { scaleFrom: 1, scaleTo: 0.94, durationMs: 100 },
  release: { scaleTo: 1.03, durationMs: 180 },
  focus: { scaleTo: 1.025, durationMs: 240 },
  hoverLift: { y: -4, scale: 1.02, durationMs: 220 },
  selectionPulse: { durationMs: 420, intensity: 0.7 },
  likeBurst: { particleCount: 16, durationMs: 700 },
} as const;

export interface SpatialSoundEvent {
  readonly id: string;
  readonly type: 'ambient' | 'interaction' | 'transition' | 'notification';
  readonly position?: { x: number; y: number; z: number };
  readonly gain: number;
  readonly maxDistance: number;
}

export interface HapticPattern {
  readonly name: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';
  readonly pulsesMs: readonly number[];
}

export const HAPTIC_PATTERNS: readonly HapticPattern[] = [
  { name: 'light', pulsesMs: [10] },
  { name: 'medium', pulsesMs: [18, 24, 18] },
  { name: 'heavy', pulsesMs: [40, 30, 40] },
  { name: 'success', pulsesMs: [24, 20, 24, 20, 50] },
  { name: 'error', pulsesMs: [55, 40, 55] },
  { name: 'selection', pulsesMs: [14, 16, 26] },
];

export interface CinematicProfile {
  readonly bloom: boolean;
  readonly toneMapping: 'aces';
  readonly vignette: number;
  readonly grain: number;
  readonly depthOfField: boolean;
  readonly motionBlur: boolean;
  readonly chromaticAberration: number;
}

export const CINEMATIC_PROFILE: CinematicProfile = {
  bloom: true,
  toneMapping: 'aces',
  vignette: 0.18,
  grain: 0.01,
  depthOfField: true,
  motionBlur: false,
  chromaticAberration: 0.0005,
};

export interface ResponsiveTypeScale {
  display: number;
  title: number;
  body: number;
  caption: number;
  lineHeight: number;
}

export function responsiveTypeScale(viewportWidthPx: number): ResponsiveTypeScale {
  const s = Math.max(0.82, Math.min(1.18, viewportWidthPx / 1440));
  return {
    display: 56 * s,
    title: 32 * s,
    body: 16 * s,
    caption: 13 * s,
    lineHeight: 1.45,
  };
}

export interface ContrastResult {
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly passesAA: boolean;
  readonly passesAAA: boolean;
}

function hexToLinear(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) throw new Error(`Invalid hex color: ${hex}`);
  const rgb = [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
  return rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as [number, number, number];
}

export function contrast(foreground: string, background: string): ContrastResult {
  const f = hexToLinear(foreground);
  const b = hexToLinear(background);
  const fl = 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  const bl = 0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2];
  const ratio = (Math.max(fl, bl) + 0.05) / (Math.min(fl, bl) + 0.05);
  return { foreground, background, ratio, passesAA: ratio >= 4.5, passesAAA: ratio >= 7 };
}

export interface ExperienceCapabilities {
  readonly supportsSpatialAudio: boolean;
  readonly supportsHaptics: boolean;
  readonly supportsMotion: boolean;
  readonly supportsCinematicPost: boolean;
}

export interface ExperienceAdapter {
  readonly capabilities: ExperienceCapabilities;
  playSpatialSound(event: SpatialSoundEvent): void;
  triggerHaptic(pattern: HapticPattern['name']): void;
  applyTransition(spec: TransitionSpec, fromObjectId?: string, toObjectId?: string): void;
  setCinematicProfile(profile: CinematicProfile): void;
}

/**
 * Deliberately platform-neutral and world-state-free.
 * Implementations must delegate spatial truth to the existing runtime.
 */
export interface ExperienceSystem {
  readonly adapter: ExperienceAdapter;
  transition(spec?: Partial<TransitionSpec>, fromObjectId?: string, toObjectId?: string): void;
  feedback(kind: 'selection' | 'focus' | 'success' | 'error', position?: { x: number; y: number; z: number }): void;
}
