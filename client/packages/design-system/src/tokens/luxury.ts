/** BERX 5D Luxury Visual DNA — canonical spatial material palette. */
export const BERX_LUXURY = {
  obsidian: '#07080A',
  deepGraphite: '#0D1014',
  graphite: '#15191E',
  elevatedSurface: '#1C2228',
  primaryText: '#F2F0EB',
  secondaryText: '#A7ADB4',
  mutedText: '#6F767E',
  champagne: '#C9B58A',
  energy: '#4FD6E8',
  destructive: '#B85C5C',
} as const;

export type BerxLuxuryToken = keyof typeof BERX_LUXURY;
