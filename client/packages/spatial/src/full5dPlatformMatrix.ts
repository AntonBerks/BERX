/**
 * BERX FULL MAX 5D platform matrix.
 * One world; platform adapters only.
 *
 * This file is intentionally declarative: it prevents a platform from being
 * called FULL until its real renderer/input/display path and verification are
 * present. It does not fake native implementations.
 */
import type {BerxDisplayForm} from './platform';

export type Berx5DPlatform =
  | 'web'
  | 'desktop'
  | 'tablet'
  | 'ios'
  | 'android'
  | 'watch'
  | 'ar'
  | 'vr';

export interface Berx5DPlatformContract {
  platform: Berx5DPlatform;
  display: BerxDisplayForm;
  worldShared: true;
  dimensions: readonly ['x', 'y', 'z', 't', 'r'];
  primaryWorldExperience: true;
  rendererRequired: boolean;
  nativeProjectRequired: boolean;
  stereoCapable: boolean;
  poseCapable: boolean;
}

export const BERX_FULL_5D_PLATFORM_MATRIX: Record<Berx5DPlatform, Berx5DPlatformContract> = {
  web: {
    platform: 'web', display: 'desktop', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: false,
    stereoCapable: false, poseCapable: true,
  },
  desktop: {
    platform: 'desktop', display: 'desktop', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: false, poseCapable: false,
  },
  tablet: {
    platform: 'tablet', display: 'tablet', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: false, poseCapable: true,
  },
  ios: {
    platform: 'ios', display: 'phone', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: false, poseCapable: true,
  },
  android: {
    platform: 'android', display: 'phone', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: false, poseCapable: true,
  },
  watch: {
    platform: 'watch', display: 'watch', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: false, poseCapable: false,
  },
  ar: {
    platform: 'ar', display: 'ar', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: true, poseCapable: true,
  },
  vr: {
    platform: 'vr', display: 'vr', worldShared: true,
    dimensions: ['x','y','z','t','r'], primaryWorldExperience: true,
    rendererRequired: true, nativeProjectRequired: true,
    stereoCapable: true, poseCapable: true,
  },
};

export function platformMatrixSummary(): Berx5DPlatformContract[] {
  return Object.values(BERX_FULL_5D_PLATFORM_MATRIX);
}
