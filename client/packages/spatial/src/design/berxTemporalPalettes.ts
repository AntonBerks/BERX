export type BerxTemporalPaletteName = 'night' | 'dawn' | 'morning' | 'day' | 'sunset' | 'evening';

export interface BerxTemporalPalette {
  name: BerxTemporalPaletteName;
  bg: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
}

/**
 * Canonical BERX temporal palette. Cyan remains the primary brand signal in
 * every phase; secondary colors are accents only and never replace the core
 * BERX visual identity.
 */
export const BERX_PALETTES: Readonly<Record<BerxTemporalPaletteName, BerxTemporalPalette>> = Object.freeze({
  night: {
    name: 'night',
    bg: '#07080A',
    accent1: '#4FD6E8',
    accent2: '#2DD4BF',
    accent3: '#818CF8',
    accent4: '#F472B6',
  },
  dawn: {
    name: 'dawn',
    bg: '#0A0D14',
    accent1: '#4FD6E8',
    accent2: '#F9A8D4',
    accent3: '#A5B4FC',
    accent4: '#FCD34D',
  },
  morning: {
    name: 'morning',
    bg: '#0A0F1E',
    accent1: '#4FD6E8',
    accent2: '#86EFAC',
    accent3: '#93C5FD',
    accent4: '#FDE68A',
  },
  day: {
    name: 'day',
    bg: '#080D17',
    accent1: '#4FD6E8',
    accent2: '#5EEAD4',
    accent3: '#7DD3FC',
    accent4: '#FBBF24',
  },
  sunset: {
    name: 'sunset',
    bg: '#120A1A',
    accent1: '#4FD6E8',
    accent2: '#FDA4AF',
    accent3: '#F9A8D4',
    accent4: '#FCD34D',
  },
  evening: {
    name: 'evening',
    bg: '#0A0812',
    accent1: '#4FD6E8',
    accent2: '#A78BFA',
    accent3: '#818CF8',
    accent4: '#67E8F9',
  },
});
