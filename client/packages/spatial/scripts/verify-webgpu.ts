/**
 * BERX WebGPU runtime verification.
 *
 * This verifier intentionally proves only the GPU contract that can be
 * exercised in a browser environment: adapter/device creation, context
 * configuration, WGSL compilation, pipeline/bind-group creation, an actual
 * draw submission, and a readback from a dedicated render target.
 */

interface VerificationResult {
  check: string;
  passed: boolean;
  details: string;
  timestamp: number;
}

export interface VerificationReport {
  allPassed: boolean;
  results: VerificationResult[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
}

const TEST_SHADER = /* wgsl */ `
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) i: u32) -> VertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-0.75, -0.75),
    vec2<f32>( 0.75, -0.75),
    vec2<f32>( 0.00,  0.75)
  );
  var colors = array<vec4<f32>, 3>(
    vec4<f32>(1.0, 0.0, 0.0, 1.0),
    vec4<f32>(0.0, 1.0, 0.0, 1.0),
    vec4<f32>(0.0, 0.0, 1.0, 1.0)
  );

  var out: VertexOut;
  out.position = vec4<f32>(positions[i], 0.0, 1.0);
  out.color = colors[i];
  return out;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4<f32> {
  return in.color;
}
`;

function makeResult(check: string): VerificationResult {
  return {check, passed: false, details: '', timestamp: Date.now()};
}

function getGPU(): GPU | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {gpu?: GPU};
  return nav.gpu ?? null;
}

async function createContext(): Promise<{
  gpu: GPU;
  adapter: GPUAdapter;
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
} | null> {
  const gpu = getGPU();
  if (!gpu || typeof document === 'undefined') return null;

  const adapter = await gpu.requestAdapter();
  if (!adapter) return null;
  const device = await adapter.requestDevice();

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('webgpu');
  if (!context) return null;

  const format = gpu.getPreferredCanvasFormat();
  context.configure({device, format, alphaMode: 'opaque'});
  return {gpu, adapter, device, canvas, context, format};
}

async function checkAvailability(): Promise<VerificationResult> {
  const result = makeResult('WebGPU availability');
  const gpu = getGPU();
  if (!gpu) {
    result.details = 'navigator.gpu unavailable';
    return result;
  }
  try {
    const adapter = await gpu.requestAdapter();
    result.passed = !!adapter;
    result.details = adapter ? 'WebGPU adapter available' : 'No adapter returned';
  } catch (error) {
    result.details = `requestAdapter failed: ${String(error)}`;
  }
  return result;
}

async function checkDevice(): Promise<VerificationResult> {
  const result = makeResult('Device creation');
  const gpu = getGPU();
  if (!gpu) {
    result.details = 'navigator.gpu unavailable';
    return result;
  }
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      result.details = 'No adapter';
      return result;
    }
    const device = await adapter.requestDevice();
    result.passed = true;
    result.details = `maxTextureDimension2D=${device.limits.maxTextureDimension2D}`;
    device.destroy();
  } catch (error) {
    result.details = `requestDevice failed: ${String(error)}`;
  }
  return result;
}

async function checkWGSL(): Promise<VerificationResult> {
  const result = makeResult('WGSL compilation');
  try {
    const ctx = await createContext();
    if (!ctx) {
      result.details = 'WebGPU context unavailable';
      return result;
    }
    const module = ctx.device.createShaderModule({code: TEST_SHADER});
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((message) => message.type === 'error');
    result.passed = errors.length === 0;
    result.details = errors.length === 0 ? 'WGSL compiled without errors' : errors.map((e) => e.message).join('; ');
    ctx.device.destroy();
  } catch (error) {
    result.details = `WGSL check failed: ${String(error)}`;
  }
  return result;
}

async function checkPipelineAndBindGroups(): Promise<VerificationResult> {
  const result = makeResult('Pipeline and bind groups');
  try {
    const ctx = await createContext();
    if (!ctx) {
      result.details = 'WebGPU context unavailable';
      return result;
    }
    const module = ctx.device.createShaderModule({code: TEST_SHADER});
    const pipeline = ctx.device.createRenderPipeline({
      layout: 'auto',
      vertex: {module, entryPoint: 'vertexMain'},
      fragment: {module, entryPoint: 'fragmentMain', targets: [{format: ctx.format}]},
      primitive: {topology: 'triangle-list'},
    });
    result.passed = !!pipeline;
    result.details = 'Render pipeline created; no bind group required by test shader';
    ctx.device.destroy();
  } catch (error) {
    result.details = `Pipeline creation failed: ${String(error)}`;
  }
  return result;
}

async function checkActualDraw(): Promise<VerificationResult> {
  const result = makeResult('Actual GPU draw');
  try {
    const ctx = await createContext();
    if (!ctx) {
      result.details = 'WebGPU context unavailable';
      return result;
    }
    const module = ctx.device.createShaderModule({code: TEST_SHADER});
    const pipeline = ctx.device.createRenderPipeline({
      layout: 'auto',
      vertex: {module, entryPoint: 'vertexMain'},
      fragment: {module, entryPoint: 'fragmentMain', targets: [{format: ctx.format}]},
      primitive: {topology: 'triangle-list'},
    });

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: ctx.context.getCurrentTexture().createView(),
        clearValue: {r: 0, g: 0, b: 0, a: 1},
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
    await ctx.device.queue.onSubmittedWorkDone();

    result.passed = true;
    result.details = 'GPU command buffer submitted and completed';
    ctx.device.destroy();
  } catch (error) {
    result.details = `Draw failed: ${String(error)}`;
  }
  return result;
}

async function checkPixelReadback(): Promise<VerificationResult> {
  const result = makeResult('Pixel readback');
  try {
    const ctx = await createContext();
    if (!ctx) {
      result.details = 'WebGPU context unavailable';
      return result;
    }

    // Use a dedicated rgba8unorm texture so copyTextureToBuffer has defined
    // four-byte rows and we do not rely on implementation-specific canvas
    // swapchain readback support.
    const target = ctx.device.createTexture({
      size: {width: 4, height: 4},
      format: 'rgba8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    const module = ctx.device.createShaderModule({code: TEST_SHADER});
    const pipeline = ctx.device.createRenderPipeline({
      layout: 'auto',
      vertex: {module, entryPoint: 'vertexMain'},
      fragment: {module, entryPoint: 'fragmentMain', targets: [{format: 'rgba8unorm'}]},
      primitive: {topology: 'triangle-list'},
    });

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: target.createView(),
        clearValue: {r: 0, g: 0, b: 0, a: 1},
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();

    // WebGPU copyTextureToBuffer requires bytesPerRow aligned to 256 bytes.
    const readback = ctx.device.createBuffer({
      size: 256 * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    encoder.copyTextureToBuffer(
      {texture: target},
      {buffer: readback, bytesPerRow: 256},
      {width: 4, height: 4, depthOrArrayLayers: 1},
    );
    ctx.device.queue.submit([encoder.finish()]);
    await ctx.device.queue.onSubmittedWorkDone();
    await readback.mapAsync(GPUMapMode.READ);
    const bytes = new Uint8Array(readback.getMappedRange());
    const alpha = bytes[3];
    const colored = bytes[0] > 10 || bytes[1] > 10 || bytes[2] > 10;
    result.passed = alpha > 0 && colored;
    result.details = `first pixel RGBA=${bytes[0]},${bytes[1]},${bytes[2]},${bytes[3]}`;
    readback.unmap();
    readback.destroy();
    target.destroy();
    ctx.device.destroy();
  } catch (error) {
    result.details = `Readback failed: ${String(error)}`;
  }
  return result;
}

export async function runWebGPUVerification(): Promise<VerificationReport> {
  const results = [
    await checkAvailability(),
    await checkDevice(),
    await checkWGSL(),
    await checkPipelineAndBindGroups(),
    await checkActualDraw(),
    await checkPixelReadback(),
  ];

  const passedChecks = results.filter((result) => result.passed).length;
  const failedChecks = results.length - passedChecks;
  return {
    allPassed: failedChecks === 0,
    results,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
  };
}
