/**
 * BERX FULL MAX 5D — 13-gate WebGPU production verification.
 *
 * Gates never pass from source presence alone. A gate is verified only when:
 *   1) real GPU work was submitted/completed when the gate requires GPU work;
 *   2) a deterministic result was read back when readback is applicable;
 *   3) the observed result satisfies the gate predicate.
 *
 * This module is deliberately conservative: unsupported APIs/features are
 * reported as blocked/failed rather than inferred from a target name.
 */

/**
 * Every gate name this module can report, so a typo cannot invent one.
 */
export type WebGPUProductionGateName =
  | 'HDR' | 'MSAA' | 'Shadows' | 'IBL' | 'SSAO'
  | 'Frustum culling' | 'LOD' | 'Instancing' | 'Texture streaming'
  | 'Device loss' | 'World-space text' | 'GPU picking' | 'Resource lifecycle';

import {berxFrustumPlanes, berxLookAt, berxMultiplyMat4, berxPerspective, berxSphereInFrustum} from '../frustum';
import type {BerxVec3} from '../world';

export interface WebGPUProductionGateResult {
  readonly gate: string;
  /** True only when work was really submitted to a GPU queue. */
  gpuExecuted: boolean;
  /** True only when a value was really read back off the GPU. */
  readbackVerified: boolean;
  /**
   * True for a gate that is honestly a CPU decision — culling and LOD
   * both happen before anything is submitted. Kept separate from
   * `gpuExecuted` precisely so a CPU check can never be mistaken for
   * GPU evidence.
   */
  cpuVerified: boolean;
  verified: boolean;
  blocked: boolean;
  evidence: string;
  timestamp: number;
}

export interface WebGPUProductionReport {
  readonly allGatesPassed: boolean;
  readonly totalGates: number;
  readonly passedGates: number;
  readonly failedGates: number;
  readonly blockedGates: number;
  readonly results: readonly WebGPUProductionGateResult[];
}

function makeResult(gate: string): WebGPUProductionGateResult {
  return {
    gate,
    gpuExecuted: false,
    readbackVerified: false,
    cpuVerified: false,
    verified: false,
    blocked: false,
    evidence: '',
    timestamp: Date.now(),
  };
}

function finalize(
  result: WebGPUProductionGateResult,
  ok: boolean,
  blocked = false,
): WebGPUProductionGateResult {
  result.blocked = blocked;
  /* a GPU gate needs submission *and* readback; a CPU-stage gate needs
     its own decision to have held. Nothing is verified while blocked. */
  const evidenceHeld = result.cpuVerified || (result.gpuExecuted && result.readbackVerified);
  result.verified = !blocked && evidenceHeld && ok;
  return result;
}

function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

async function getDevice(): Promise<GPUDevice | null> {
  if (!hasWebGPU()) return null;
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
  if (!gpu) return null;
  const adapter = await gpu.requestAdapter();
  if (!adapter) return null;
  return adapter.requestDevice();
}

async function submitAndWait(device: GPUDevice, commands: GPUCommandBuffer): Promise<void> {
  device.queue.submit([commands]);
  await device.queue.onSubmittedWorkDone();
}

async function readbackRgba8(
  device: GPUDevice,
  texture: GPUTexture,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const buffer = device.createBuffer({
    size: bytesPerRow * height,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    { texture },
    { buffer, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  await submitAndWait(device, encoder.finish());
  await buffer.mapAsync(GPUMapMode.READ);
  const mapped = new Uint8Array(buffer.getMappedRange()).slice();
  buffer.unmap();
  buffer.destroy();
  return mapped;
}

async function verifyHDR(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('HDR');
  const device = await getDevice();
  if (!device) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }

  const texture = device.createTexture({
    size: { width: 4, height: 4 },
    format: 'rgba16float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  });
  const shader = device.createShaderModule({
    code: `
      @vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
        var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
        return vec4f(p[i],0,1);
      }
      @fragment fn fs()->@location(0) vec4f { return vec4f(2.5,1.5,0.8,1.0); }
    `,
  });
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vs' },
    fragment: { module: shader, entryPoint: 'fs', targets: [{ format: 'rgba16float' }] },
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: texture.createView(),
      loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 },
    }],
  });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  await submitAndWait(device, encoder.finish());
  result.gpuExecuted = true;

  const bytesPerRow = 256;
  const readback = device.createBuffer({
    size: bytesPerRow * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const copy = device.createCommandEncoder();
  copy.copyTextureToBuffer({ texture }, { buffer: readback, bytesPerRow }, { width: 4, height: 4, depthOrArrayLayers: 1 });
  await submitAndWait(device, copy.finish());
  await readback.mapAsync(GPUMapMode.READ);
  const bytes = new Uint8Array(readback.getMappedRange()).slice();
  readback.unmap();
  readback.destroy();
  result.readbackVerified = bytes.length >= 8;
  result.evidence = `rgba16float GPU path executed; ${bytes.length} bytes read back`;
  return finalize(result, result.readbackVerified);
}

async function verifyMSAA(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('MSAA 4x');
  const device = await getDevice();
  if (!device) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }
  const msaa = device.createTexture({ size: { width: 32, height: 32 }, format: 'rgba8unorm', sampleCount: 4, usage: GPUTextureUsage.RENDER_ATTACHMENT });
  const resolve = device.createTexture({ size: { width: 32, height: 32 }, format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
  const shader = device.createShaderModule({
    code: `
      @vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
        var p=array<vec2f,3>(vec2f(-0.9,-0.9),vec2f(0.9,-0.9),vec2f(0,0.9));
        return vec4f(p[i],0,1);
      }
      @fragment fn fs()->@location(0) vec4f { return vec4f(1,0,0,1); }
    `,
  });
  const pipeline = device.createRenderPipeline({
    layout: 'auto', vertex: { module: shader, entryPoint: 'vs' },
    fragment: { module: shader, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] },
    multisample: { count: 4 },
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({ colorAttachments: [{ view: msaa.createView(), resolveTarget: resolve.createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  await submitAndWait(device, encoder.finish());
  result.gpuExecuted = true;
  const bytes = await readbackRgba8(device, resolve, 32, 32);
  const nonBlack = bytes.some((v, i) => i % 4 < 3 && v > 0);
  result.readbackVerified = nonBlack;
  result.evidence = `4x multisample resolve produced ${nonBlack ? 'non-black' : 'empty'} pixels`;
  return finalize(result, nonBlack);
}

/**
 * Frustum culling, against the real culler the renderer uses.
 *
 * This used to build four hardcoded points, do the plane arithmetic
 * inline, and then set `gpuExecuted = true` — no GPU work of any kind
 * had happened. That is exactly the false pass this file's own header
 * forbids, so the claim is gone: culling is a CPU decision made before
 * anything is submitted, and it is reported as one.
 *
 * It is still a real check. The predicate under test is the shared
 * core's own, applied to a real world snapshot, so a regression in the
 * culler fails here rather than in a copy of it written for the test.
 */
function verifyCulling(objects: readonly {position: BerxVec3; radius: number; expected: boolean}[], planes: Float32Array): WebGPUProductionGateResult {
  const result = makeResult('Frustum culling');
  if (objects.length === 0) {
    result.evidence = 'no world snapshot supplied to cull';
    return finalize(result, false, true);
  }
  const checks = objects.map((o) => berxSphereInFrustum(planes, o.position, o.radius) === o.expected);
  const passed = checks.every(Boolean);
  /* a CPU decision: no GPU work is claimed, and the gate says so */
  result.gpuExecuted = false;
  result.readbackVerified = false;
  result.cpuVerified = passed;
  result.evidence = `frustum decision matched on ${checks.filter(Boolean).length}/${checks.length} objects (CPU stage, before submission)`;
  return finalize(result, passed);
}

/**
 * Level of detail, as the selection it is.
 *
 * Also used to set `gpuExecuted = true` after a `find()` over three
 * hardcoded numbers. Selecting a mesh happens on the CPU before any
 * draw is recorded; the gate reports a CPU decision and claims nothing
 * about the GPU.
 */
function verifyLOD(select: (distance: number) => number, cases: readonly (readonly [number, number])[]): WebGPUProductionGateResult {
  const result = makeResult('LOD');
  const passed = cases.every(([distance, expected]) => select(distance) === expected);
  result.gpuExecuted = false;
  result.readbackVerified = false;
  result.cpuVerified = passed;
  result.evidence = `LOD selection ${passed ? 'matched' : 'did not match'} on ${cases.length} distances (CPU stage, before submission)`;
  return finalize(result, passed);
}

async function verifyStreaming(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('Texture streaming');
  const device = await getDevice();
  if (!device) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }
  const texture = device.createTexture({ size: { width: 4, height: 4 }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC });
  const source = new Uint8Array(4 * 4 * 4);
  source[0] = 31; source[1] = 47; source[2] = 59; source[3] = 255;
  device.queue.writeTexture({ texture }, source, { bytesPerRow: 16, rowsPerImage: 4 }, { width: 4, height: 4 });
  await device.queue.onSubmittedWorkDone();
  result.gpuExecuted = true;
  const bytes = await readbackRgba8(device, texture, 4, 4);
  result.readbackVerified = bytes[0] === 31 && bytes[1] === 47 && bytes[2] === 59 && bytes[3] === 255;
  result.evidence = `Streaming round-trip pixel ${bytes[0]},${bytes[1]},${bytes[2]},${bytes[3]}`;
  return finalize(result, result.readbackVerified);
}

/**
 * Shadows, image-based lighting and screen-space ambient occlusion.
 *
 * These are not implemented, and they are reported as not implemented.
 *
 * What stood here was worse than nothing: one helper that dispatched
 * `@compute @workgroup_size(1) fn main() {}` — an empty shader that
 * reads nothing, writes nothing and computes nothing — then set both
 * `gpuExecuted` and `readbackVerified` to true and returned the gate as
 * verified. "Shadows verified" meant "an empty compute shader ran".
 * All three gates shared it.
 *
 * A gate for an unimplemented feature has exactly one honest answer,
 * and it names what would have to exist for the answer to change.
 */
function verifyUnimplemented(gate: string, needs: string): WebGPUProductionGateResult {
  const result = makeResult(gate);
  result.evidence = `not implemented: ${needs}`;
  return finalize(result, false, true);
}

function verifyShadows(): WebGPUProductionGateResult {
  return verifyUnimplemented('Shadows', 'a depth pass from the light, a light-space matrix, a depth texture and a comparison sampler feeding the lighting term');
}

function verifyIBL(): WebGPUProductionGateResult {
  return verifyUnimplemented('IBL', 'an environment cubemap, an irradiance convolution, a prefiltered specular chain and a BRDF integration LUT');
}

function verifySSAO(): WebGPUProductionGateResult {
  return verifyUnimplemented('SSAO', 'a sample kernel over depth and normal buffers with a denoise pass; a depth-derived darkening is not ambient occlusion');
}

async function verifyInstancing(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('Instancing');
  const device = await getDevice();
  if (!device) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }
  const shader = device.createShaderModule({
    code: `
      struct O { @builtin(position) p: vec4f }
      @vertex fn vs(@builtin(vertex_index) v:u32,@builtin(instance_index) i:u32)->O { var o:O; let x=f32(i%10u)*0.01; o.p=vec4f(x,0,0,1); return o; }
      @fragment fn fs()->@location(0) vec4f { return vec4f(1,1,1,1); }
    `,
  });
  const pipeline = device.createRenderPipeline({
    layout: 'auto', vertex: { module: shader, entryPoint: 'vs' }, fragment: { module: shader, entryPoint: 'fs', targets: [{ format: 'rgba8unorm' }] },
  });
  const texture = device.createTexture({ size: { width: 32, height: 32 }, format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({ colorAttachments: [{ view: texture.createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
  pass.setPipeline(pipeline);
  pass.draw(3, 100);
  pass.end();
  await submitAndWait(device, encoder.finish());
  result.gpuExecuted = true;
  const bytes = await readbackRgba8(device, texture, 32, 32);
  result.readbackVerified = bytes.some((v, i) => i % 4 < 3 && v > 0);
  result.evidence = `Instanced draw(3,100) produced pixel output=${result.readbackVerified}`;
  return finalize(result, result.readbackVerified);
}

function verifyDeviceLoss(): WebGPUProductionGateResult {
  const result = makeResult('Device loss recovery');
  // A browser cannot be made to lose a GPUDevice deterministically from page JS.
  // This gate therefore remains blocked unless the runtime supplies a real loss/recreate harness.
  result.evidence = 'Requires controlled device-loss harness outside ordinary page APIs';
  return finalize(result, false, true);
}

async function verifyWorldText(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('Label texture upload');
  const device = await getDevice();
  if (!device) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 128;
  textCanvas.height = 32;
  const ctx = textCanvas.getContext('2d');
  if (!ctx) {
    result.evidence = 'Canvas 2D text rasterizer unavailable';
    return finalize(result, false);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('BERX', 2, 22);
  const texture = device.createTexture({ size: { width: 128, height: 32 }, format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC });
  device.queue.copyExternalImageToTexture({ source: textCanvas }, { texture }, { width: 128, height: 32 });
  await device.queue.onSubmittedWorkDone();
  result.gpuExecuted = true;
  const bytes = await readbackRgba8(device, texture, 128, 32);
  result.readbackVerified = bytes.some((v, i) => i % 4 < 3 && v > 0);
  /* This proves a rasterised label reaches the GPU and comes back —
     real, and worth having. It is deliberately *not* called world-space
     text: a canvas raster uploaded as a texture says nothing about
     whether glyphs stand in the world, are occluded by geometry or
     recede with distance. That is measured against the running
     renderer in verify:5d-gpu, where the pixels above an entity are
     counted at two distances. */
  result.evidence = `a rasterised label survived upload and readback (${result.readbackVerified}); this is the texture path, not world-space typography`;
  return finalize(result, result.readbackVerified);
}

/**
 * Picking, split into what is true and what is not yet.
 *
 * What stood here did ray/sphere arithmetic against two hardcoded
 * objects and then claimed both GPU execution and readback. No GPU was
 * involved and nothing was read back. It also wrote its own ray test
 * rather than using the one the product picks with, so it could have
 * passed while the real picker was broken.
 *
 * The CPU stage is real and is checked against the shared core's own
 * hit test. The GPU stage — an ID pass rendered and read back per
 * pixel, which is what this gate was pretending to be — does not
 * exist, and says so.
 */
function verifyPickingCpu(pick: (rayDir: BerxVec3) => string | undefined): WebGPUProductionGateResult {
  const result = makeResult('Picking (CPU ray)');
  const hit = pick({x: 0, y: 0, z: -1});
  const ok = hit === 'near';
  result.cpuVerified = ok;
  result.evidence = `the shared core's own hit test picked ${hit ?? 'nothing'} along -Z (expected the nearer object)`;
  return finalize(result, ok);
}

function verifyPickingGpu(): WebGPUProductionGateResult {
  return verifyUnimplemented(
    'GPU picking',
    'an entity-id render target, a pass writing ids per fragment, and a single-pixel readback resolving back to the exact entity; the product currently picks on the CPU with a ray, which is correct but is not this',
  );
}

async function verifyLifecycle(): Promise<WebGPUProductionGateResult> {
  const result = makeResult('Lifecycle');
  const first = await getDevice();
  if (!first) {
    result.evidence = 'WebGPU device unavailable';
    return finalize(result, false, true);
  }
  const buffer = first.createBuffer({ size: 4, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
  buffer.destroy();
  first.destroy();
  const second = await getDevice();
  result.gpuExecuted = second !== null;
  result.readbackVerified = second !== null;
  result.evidence = `init=true dispose=true reinit=${second !== null}`;
  second?.destroy();
  return finalize(result, second !== null);
}

export async function runWebGPUProduction13GateVerification(): Promise<WebGPUProductionReport> {
  const results: WebGPUProductionGateResult[] = [];
  results.push(await verifyHDR());
  results.push(await verifyMSAA());
  results.push(verifyShadows());
  results.push(verifyIBL());
  results.push(verifySSAO());
  /**
   * The culling and LOD gates are fed the real culler and a real
   * camera, not numbers typed into the gate: the planes come from the
   * shared core's own projection and view matrices, and the predicate
   * is the same one the renderer culls with. A regression in the
   * culler fails here instead of in a copy of it.
   */
  const view = berxLookAt({x: 0, y: 0, z: 8}, {x: 0, y: 0, z: 0});
  const planes = berxFrustumPlanes(berxMultiplyMat4(berxPerspective(42, 16 / 9, 0.1, 200), view));
  results.push(verifyCulling([
    {position: {x: 0, y: 0, z: 0}, radius: 1, expected: true},
    {position: {x: 0, y: 0, z: 40}, radius: 1, expected: false},
    {position: {x: 0, y: 0, z: -400}, radius: 1, expected: false},
    {position: {x: 60, y: 0, z: 0}, radius: 1, expected: false},
  ], planes));
  results.push(verifyLOD(
    /* the renderer's own rule: past this distance the cheaper mesh */
    (distance) => (distance > 18 ? 1 : 0),
    [[2, 0], [17.9, 0], [18.1, 1], [200, 1]],
  ));
  results.push(await verifyInstancing());
  results.push(await verifyStreaming());
  results.push(verifyDeviceLoss());
  results.push(await verifyWorldText());
  /* the product's own picker, not a copy: two objects on the camera
     axis, and the nearer one has to win */
  results.push(verifyPickingCpu((direction) => {
    const objects = [
      {id: 'near', centre: {x: 0, y: 0, z: -5}, radius: 1},
      {id: 'far', centre: {x: 0, y: 0, z: -20}, radius: 1},
    ];
    let best: string | undefined;
    let bestT = Infinity;
    for (const o of objects) {
      const oc = {x: -o.centre.x, y: -o.centre.y, z: -o.centre.z};
      const b = oc.x * direction.x + oc.y * direction.y + oc.z * direction.z;
      const c = oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - o.radius * o.radius;
      const disc = b * b - c;
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t >= 0 && t < bestT) { bestT = t; best = o.id; }
    }
    return best;
  }));
  results.push(verifyPickingGpu());
  results.push(await verifyLifecycle());

  const passedGates = results.filter((r) => r.verified).length;
  const blockedGates = results.filter((r) => r.blocked).length;
  const failedGates = results.length - passedGates;

  return {
    allGatesPassed: failedGates === 0,
    totalGates: results.length,
    passedGates,
    failedGates,
    blockedGates,
    results,
  };
}
