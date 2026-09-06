/**
 * The presentability probe, on its own, for verification.
 *
 * The shell uses `berxWebGPUCanvasPresentable` to decide which backend
 * to run on. A gate that wants to check the shell chose correctly has
 * to ask the same question the same way — a second implementation of
 * "is WebGPU usable here" would let the two disagree, which is exactly
 * the failure being checked for.
 */
export {berxWebGPUCanvasPresentable} from '@berx/spatial-web/webgpuRuntime';
