/** BERX FULL MAX 5D — executable platform runtime specification. */
import type {BerxPlatformCapabilities} from './platform';

export type BerxPlatformId = 'web' | 'desktop' | 'tablet' | 'ios' | 'android' | 'watch' | 'ar' | 'vr';

export interface BerxRuntimeRequirement {
  readonly gpu: readonly BerxPlatformCapabilities['gpu'][];
  readonly nativeProject: boolean;
  readonly depth: boolean;
  readonly perspective: boolean;
  readonly pose: boolean;
  readonly stereo: boolean;
  readonly spatialAudio: boolean;
}

export interface BerxPlatformRuntimeSpec {
  readonly id: BerxPlatformId;
  readonly display: 'desktop' | 'phone' | 'tablet' | 'watch' | 'ar' | 'vr';
  readonly requirements: BerxRuntimeRequirement;
  readonly requiredArtifacts: readonly string[];
  readonly verification: readonly string[];
}

export const BERX_FULL_MAX_5D_RUNTIME_SPECS: readonly BerxPlatformRuntimeSpec[] = [
  { id: 'web', display: 'desktop', requirements: { gpu: ['webgpu'], nativeProject: false, depth: true, perspective: true, pose: true, stereo: false, spatialAudio: true }, requiredArtifacts: ['web runtime entry', 'WebGPU backend', 'WebGL2 backend'], verification: ['browser build', 'GPU render probe', 'zero-flat shell'] },
  { id: 'desktop', display: 'desktop', requirements: { gpu: ['webgpu', 'vulkan', 'metal'], nativeProject: true, depth: true, perspective: true, pose: false, stereo: false, spatialAudio: true }, requiredArtifacts: ['native desktop project', 'GPU backend', 'packaged executable'], verification: ['native build', 'launch probe', 'GPU frame'] },
  { id: 'tablet', display: 'tablet', requirements: { gpu: ['metal', 'vulkan'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: false, spatialAudio: true }, requiredArtifacts: ['native tablet target', 'GPU backend', 'touch/gesture adapter'], verification: ['native build', 'touch input', 'GPU frame'] },
  { id: 'ios', display: 'phone', requirements: { gpu: ['metal'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: false, spatialAudio: true }, requiredArtifacts: ['.xcodeproj/.xcworkspace', 'Metal renderer', 'Metal shaders'], verification: ['xcodebuild', 'launch', 'Metal frame', 'pose path'] },
  { id: 'android', display: 'phone', requirements: { gpu: ['vulkan'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: false, spatialAudio: true }, requiredArtifacts: ['Gradle project', 'AndroidManifest.xml', 'NDK/Vulkan backend'], verification: ['Gradle build', 'native launch', 'Vulkan frame', 'pose path'] },
  { id: 'watch', display: 'watch', requirements: { gpu: ['metal'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: false, spatialAudio: true }, requiredArtifacts: ['watchOS target', 'Metal renderer', 'Digital Crown adapter'], verification: ['watch build', 'interaction probe', 'GPU frame'] },
  { id: 'ar', display: 'ar', requirements: { gpu: ['metal', 'vulkan', 'webgpu'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: true, spatialAudio: true }, requiredArtifacts: ['AR session adapter', 'world anchors', 'depth integration'], verification: ['AR session', 'pose tracking', 'depth frame', 'stereo/viewport path'] },
  { id: 'vr', display: 'vr', requirements: { gpu: ['vulkan', 'metal', 'webgpu'], nativeProject: true, depth: true, perspective: true, pose: true, stereo: true, spatialAudio: true }, requiredArtifacts: ['OpenXR runtime', 'stereo renderer', 'controller adapter'], verification: ['XR session', 'head pose', 'controller input', 'stereo frame'] },
];

export interface BerxRuntimeVerificationResult {
  readonly platform: BerxPlatformId;
  readonly ready: boolean;
  readonly missing: readonly string[];
}

export function verifyPlatformRuntime(
  spec: BerxPlatformRuntimeSpec,
  capabilities: BerxPlatformCapabilities,
  artifacts: ReadonlySet<string>,
): BerxRuntimeVerificationResult {
  const missing: string[] = [];
  if (!spec.requirements.gpu.includes(capabilities.gpu)) missing.push(`GPU backend ${capabilities.gpu} is not accepted`);
  if (spec.requirements.depth && !capabilities.depthBuffer) missing.push('depth buffer');
  if (spec.requirements.perspective && !capabilities.physicallyLitMaterials) missing.push('physically lit spatial renderer');
  if (spec.requirements.pose && !capabilities.poseTracking) missing.push('pose tracking');
  if (spec.requirements.stereo && !capabilities.stereoRendering) missing.push('stereo rendering');
  if (spec.requirements.spatialAudio && !capabilities.spatialAudio) missing.push('spatial audio');
  for (const artifact of spec.requiredArtifacts) if (!artifacts.has(artifact)) missing.push(`artifact: ${artifact}`);
  return { platform: spec.id, ready: missing.length === 0, missing };
}
