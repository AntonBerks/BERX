/** BERX visual system: presentation only; never creates world entities or a second core. */

export type BerxTimePhase = 'dawn' | 'morning' | 'day' | 'sunset' | 'evening' | 'night';

export interface BerxDesignPalette {
  phase: BerxTimePhase;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  glass: string;
  glassStrong: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  glow: string;
  particle: string;
}

const CYAN = '#4FD6E8';
const BASE: Omit<BerxDesignPalette, 'phase' | 'accentSoft' | 'glow' | 'particle' | 'bgPrimary' | 'bgSecondary' | 'bgTertiary'> = {
  glass: 'rgba(255,255,255,0.045)',
  glassStrong: 'rgba(255,255,255,0.075)',
  border: 'rgba(255,255,255,0.11)',
  textPrimary: '#F5F9FC',
  textSecondary: 'rgba(245,249,252,0.68)',
  textTertiary: 'rgba(245,249,252,0.38)',
  accent: CYAN,
};

export const BERX_PALETTES: Record<BerxTimePhase, BerxDesignPalette> = {
  dawn: { ...BASE, phase: 'dawn', bgPrimary: '#080B10', bgSecondary: '#0D141A', bgTertiary: '#132027', accentSoft: 'rgba(79,214,232,0.16)', glow: 'rgba(79,214,232,0.30)', particle: '#A9F3FA' },
  morning: { ...BASE, phase: 'morning', bgPrimary: '#070B10', bgSecondary: '#0D151C', bgTertiary: '#14232B', accentSoft: 'rgba(79,214,232,0.17)', glow: 'rgba(79,214,232,0.32)', particle: '#BDF7FB' },
  day: { ...BASE, phase: 'day', bgPrimary: '#070A0D', bgSecondary: '#0D1418', bgTertiary: '#122027', accentSoft: 'rgba(79,214,232,0.20)', glow: 'rgba(79,214,232,0.36)', particle: '#C8FAFF' },
  sunset: { ...BASE, phase: 'sunset', bgPrimary: '#0B0A0D', bgSecondary: '#151014', bgTertiary: '#21171B', accentSoft: 'rgba(79,214,232,0.16)', glow: 'rgba(79,214,232,0.28)', particle: '#D2F8FB' },
  evening: { ...BASE, phase: 'evening', bgPrimary: '#07080B', bgSecondary: '#0B0E13', bgTertiary: '#111923', accentSoft: 'rgba(79,214,232,0.18)', glow: 'rgba(79,214,232,0.34)', particle: '#9EEEF5' },
  night: { ...BASE, phase: 'night', bgPrimary: '#040507', bgSecondary: '#080B10', bgTertiary: '#0D1319', accentSoft: 'rgba(79,214,232,0.13)', glow: 'rgba(79,214,232,0.24)', particle: '#7EDFE9' },
};

export function berxTimePhase(date = new Date()): BerxTimePhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  if (hour >= 20 && hour < 23) return 'evening';
  return 'night';
}

export function berxPaletteForTime(date = new Date()): BerxDesignPalette {
  return BERX_PALETTES[berxTimePhase(date)];
}

export const BERX_MOTION = {
  spatialTravelMs: 650,
  focusMs: 420,
  microInteractionMs: 180,
  revealMs: 720,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const BERX_DEPTH = {
  glassNear: 2,
  glassFar: 10,
  worldTextOffset: 0.02,
  interactionLift: 0.08,
} as const;

export const BERX_TEXT = {
  hero: 32,
  title: 22,
  body: 16,
  meta: 13,
  micro: 11,
} as const;

export function berxDesignTokens(date = new Date()) {
  const palette = berxPaletteForTime(date);
  return { palette, motion: BERX_MOTION, depth: BERX_DEPTH, text: BERX_TEXT };
}

/**
 * Design surfaces remain secondary to the spatial world. They are
 * presentation/feedback only and must never become a screen navigation model.
 */
export interface BerxSpatialSurface {
  depth: number;
  opacity: number;
  blurPx: number;
  emissive: number;
}

export const BERX_SURFACES: Record<'soft' | 'focus' | 'critical', BerxSpatialSurface> = {
  soft: { depth: 8, opacity: 0.86, blurPx: 24, emissive: 0.08 },
  focus: { depth: 4, opacity: 0.94, blurPx: 32, emissive: 0.16 },
  critical: { depth: 2, opacity: 0.98, blurPx: 20, emissive: 0.24 },
};
