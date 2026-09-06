/** BERX FULL MAX 5D: one runtime contract for every target platform. */
import type {BerxDisplayForm, BerxPlatformCapabilities, BerxSpatialRendererBackend, BerxNavigationIntent} from './platform';

export type BerxFullPlatform = 'web'|'desktop'|'tablet'|'ios'|'android'|'watch'|'ar'|'vr';
export type BerxPlatformFamily = 'screen'|'wearable'|'immersive';

export interface BerxFullPlatformTarget {
  platform: BerxFullPlatform;
  family: BerxPlatformFamily;
  displayForm: BerxDisplayForm;
  renderer: 'webgl2'|'webgpu'|'metal'|'vulkan';
  nativeRequired: boolean;
  immersive: boolean;
  stereo: boolean;
  poseRequired: boolean;
  input: readonly ('touch'|'pointer'|'keyboard'|'gamepad'|'watch-gesture'|'xr-controller'|'head-pose')[];
}

export const BERX_FULL_MAX_5D_TARGETS: readonly BerxFullPlatformTarget[] = [
  {platform:'web',family:'screen',displayForm:'desktop',renderer:'webgl2',nativeRequired:false,immersive:false,stereo:false,poseRequired:false,input:['pointer','keyboard','touch']},
  {platform:'desktop',family:'screen',displayForm:'desktop',renderer:'vulkan',nativeRequired:true,immersive:false,stereo:false,poseRequired:false,input:['pointer','keyboard','gamepad']},
  {platform:'tablet',family:'screen',displayForm:'tablet',renderer:'metal',nativeRequired:true,immersive:false,stereo:false,poseRequired:true,input:['touch','head-pose']},
  {platform:'ios',family:'screen',displayForm:'phone',renderer:'metal',nativeRequired:true,immersive:false,stereo:false,poseRequired:true,input:['touch','head-pose','gamepad']},
  {platform:'android',family:'screen',displayForm:'phone',renderer:'vulkan',nativeRequired:true,immersive:false,stereo:false,poseRequired:true,input:['touch','head-pose','gamepad']},
  {platform:'watch',family:'wearable',displayForm:'watch',renderer:'metal',nativeRequired:true,immersive:false,stereo:false,poseRequired:false,input:['watch-gesture']},
  {platform:'ar',family:'immersive',displayForm:'ar',renderer:'metal',nativeRequired:true,immersive:true,stereo:true,poseRequired:true,input:['head-pose','xr-controller','touch']},
  {platform:'vr',family:'immersive',displayForm:'vr',renderer:'vulkan',nativeRequired:true,immersive:true,stereo:true,poseRequired:true,input:['head-pose','xr-controller','gamepad']},
] as const;

export interface BerxFullPlatformRuntime {
  readonly platform: BerxFullPlatform;
  readonly capabilities: BerxPlatformCapabilities;
  readonly renderer: BerxSpatialRendererBackend;
  dispatch(intent: BerxNavigationIntent): void;
  dispose(): void;
}

export function fullPlatformTarget(platform: BerxFullPlatform): BerxFullPlatformTarget {
  const target = BERX_FULL_MAX_5D_TARGETS.find((item) => item.platform === platform);
  if (!target) throw new Error(`Unknown BERX FULL platform: ${platform}`);
  return target;
}

export function fullPlatformGaps(platform: BerxFullPlatform, capabilities: BerxPlatformCapabilities): string[] {
  const target = fullPlatformTarget(platform);
  const gaps: string[] = [];
  if (capabilities.gpu !== target.renderer && !(platform === 'web' && capabilities.gpu === 'webgpu')) gaps.push(`renderer ${target.renderer} required; got ${capabilities.gpu}`);
  if (!capabilities.depthBuffer) gaps.push('depthBuffer');
  if (!capabilities.physicallyLitMaterials) gaps.push('physicallyLitMaterials');
  if (target.stereo && !capabilities.poseTracking) gaps.push('stereo/poseTracking');
  if (target.poseRequired && !capabilities.poseTracking) gaps.push('poseTracking');
  if (!capabilities.spatialAudio) gaps.push('spatialAudio');
  if (!capabilities.pointer) gaps.push('pointer/ray selection');
  return gaps;
}
