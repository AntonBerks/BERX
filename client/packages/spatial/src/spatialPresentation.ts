/** BERX 5D semantic presentation: domain kind -> restrained luxury material and geometry. */
import type { BerxSpatialEntityKind, BerxSpatialObject } from './world';

export interface BerxSpatialPresentation {
  base: [number, number, number];
  emissive: [number, number, number];
  geometry: 'orb' | 'frame' | 'surface' | 'portal' | 'ring' | 'node' | 'stack' | 'message' | 'create';
}

const PEARL: [number, number, number] = [0.74, 0.72, 0.67];
const GRAPHITE: [number, number, number] = [0.18, 0.20, 0.23];
const GOLD: [number, number, number] = [0.79, 0.70, 0.50];
const CYAN: [number, number, number] = [0.18, 0.74, 0.82];

export function presentationForKind(kind: BerxSpatialEntityKind, object?: BerxSpatialObject): BerxSpatialPresentation {
  const energy = Math.max(0, Math.min(1, object?.energy ?? 0));
  const glow = (amount: number): [number, number, number] => [CYAN[0] * energy * amount, CYAN[1] * energy * amount, CYAN[2] * energy * amount];
  switch (kind) {
    case 'person': return { geometry: 'orb', base: PEARL, emissive: glow(0.08) };
    case 'moment': return { geometry: 'surface', base: PEARL, emissive: glow(0.10) };
    case 'place': return { geometry: 'portal', base: GRAPHITE, emissive: [0, 0, 0] };
    case 'event': return { geometry: 'ring', base: GOLD, emissive: [GOLD[0] * energy * 0.08, GOLD[1] * energy * 0.08, GOLD[2] * energy * 0.08] };
    case 'experience': return { geometry: 'frame', base: GOLD, emissive: [GOLD[0] * energy * 0.06, GOLD[1] * energy * 0.06, GOLD[2] * energy * 0.06] };
    case 'community': return { geometry: 'node', base: PEARL, emissive: [0, 0, 0] };
    case 'business': return { geometry: 'stack', base: GRAPHITE, emissive: [GOLD[0] * energy * 0.05, GOLD[1] * energy * 0.05, GOLD[2] * energy * 0.05] };
    case 'collection': return { geometry: 'stack', base: GRAPHITE, emissive: [0, 0, 0] };
    case 'message': return { geometry: 'message', base: PEARL, emissive: [0, 0, 0] };
    case 'create': return { geometry: 'create', base: GRAPHITE, emissive: glow(0.18) };
  }
}
