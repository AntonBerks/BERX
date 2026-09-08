/**
 * BERX Design Tokens — canonical spatial visual language.
 * Keep web/mobile/native values derived from this contract.
 * No default framework palette is permitted in BERX UI.
 */

export const colors = {
  black: '#07080A',
  bg: '#07080A',
  graphite: '#101216',

  glass1: 'rgba(255,255,255,0.04)',
  glass2: 'rgba(255,255,255,0.07)',
  glass3: 'rgba(255,255,255,0.10)',
  surface: 'rgba(255,255,255,0.07)',
  surface2: 'rgba(255,255,255,0.10)',

  border: 'rgba(255,255,255,0.10)',
  borderSoft: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  white: '#FFFFFF',
  text: '#F5F7FA',
  textDim: 'rgba(245,247,250,0.68)',
  textFaint: 'rgba(245,247,250,0.42)',

  accent: '#4FD6E8',
  accentHover: '#7CE4F0',
  accentSoft: 'rgba(79,214,232,0.16)',
  accentSecondary: '#4FD6E8',
  accentSecondarySoft: 'rgba(79,214,232,0.16)',

  danger: '#FF5864',
  success: '#45E6A5',
  warning: '#FFD166',
} as const;

export const gradientAccent = ['#4FD6E8', '#4FD6E8'] as const;

export const blur = {
  sm: 8,
  md: 16,
  lg: 28,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const motion = {
  easeControlPoints: [0.16, 1, 0.3, 1] as [number, number, number, number],
  durationFast: 140,
  durationBase: 220,
  durationSlow: 380,
  durationCinematic: 720,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  colossal: 96,
} as const;

export const typography = {
  sizeXs: 12,
  sizeSm: 13,
  sizeBase: 15,
  sizeLg: 17,
  sizeXl: 20,
  sizeTitle: 24,
  sizeHeadline: 32,
  sizeHero: 40,
  sizeDisplay: 56,
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,
  lineHeightTight: 1.14,
  lineHeightBase: 1.45,
  letterTight: -0.02,
};

export const shadow = {
  base: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
} as const;

export const tokens = { colors, blur, radius, motion, spacing, typography, shadow };
export type BerxTokens = typeof tokens;

export type BerxDaypart = 'lateNight' | 'morning' | 'day' | 'evening' | 'night';

export interface BerxDaypartPalette {
  daypart: BerxDaypart;
  label: string;
  accent: string;
  accentSoft: string;
  bg: string;
}

const DAYPART_PALETTES: Record<BerxDaypart, BerxDaypartPalette> = {
  lateNight: { daypart: 'lateNight', label: 'Ночь', accent: colors.accent, accentSoft: colors.accentSoft, bg: '#05070A' },
  morning: { daypart: 'morning', label: 'Утро', accent: colors.accent, accentSoft: colors.accentSoft, bg: colors.bg },
  day: { daypart: 'day', label: 'День', accent: colors.accent, accentSoft: colors.accentSoft, bg: colors.bg },
  evening: { daypart: 'evening', label: 'Вечер', accent: colors.accent, accentSoft: colors.accentSoft, bg: '#080B0E' },
  night: { daypart: 'night', label: 'Ночь', accent: colors.accent, accentSoft: colors.accentSoft, bg: '#040609' },
};

export function resolveBerxDaypart(hour: number): BerxDaypart {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  if (normalized < 5) return 'lateNight';
  if (normalized < 11) return 'morning';
  if (normalized < 17) return 'day';
  if (normalized < 21) return 'evening';
  return 'night';
}

export function getBerxDaypartPalette(hour: number): BerxDaypartPalette {
  return DAYPART_PALETTES[resolveBerxDaypart(hour)];
}
