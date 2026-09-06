/** BERX FULL MAX 5D platform completion contract. */
import {BERX_FULL_5D_PLATFORM_MATRIX, type Berx5DPlatform} from './full5dPlatformMatrix';

export interface Berx5DPlatformReadiness {
  platform: Berx5DPlatform;
  required: readonly string[];
  status: 'blocked-unimplemented' | 'ready';
}

const COMMON = [
  'shared Berx5DWorldApp',
  'shared X/Y/Z/T/R state',
  'shared spatial identity',
  'shared temporal/relational graph',
  'real renderer backend',
  'real input adapter',
  'real display adapter',
  'real persistence',
  'real verification gate',
] as const;

export const BERX_FULL_5D_PLATFORM_READINESS: readonly Berx5DPlatformReadiness[] =
  (Object.keys(BERX_FULL_5D_PLATFORM_MATRIX) as Berx5DPlatform[]).map((platform) => ({
    platform,
    required: COMMON,
    status: 'blocked-unimplemented',
  }));

/** Deliberately conservative: readiness can only become `ready` from real build evidence. */
export function berxAllPlatformsReady(readiness = BERX_FULL_5D_PLATFORM_READINESS): boolean {
  return readiness.every((target) => target.status === 'ready');
}
